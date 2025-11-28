// app/api/ingest/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next"; // Robust import for /route.ts
import { authOptions } from "@/lib/auth";
import { getDatabases } from "@/lib/mongodb"; // Use the native client utility
import { ratelimit } from "@/lib/ratelimit"; // Rate limiting utility
import { headers } from "next/headers";
import crypto from "crypto";
import { processDocument } from "@/lib/classification"; // The Classification Brain
import { ObjectId, MongoClient } from "mongodb"; // Import ObjectId and MongoClient for transaction/session management
import { validateApiKey } from "@/lib/apiAuth"; // For API Key access (EPIC 6.3)

// Helper to determine the source of the organization ID and user context
const getAuthContext = async (request: Request) => {
    // 1. Check for API Key context first (Enterprise Integration)
    const apiKeyResult = await validateApiKey(request);

    if (apiKeyResult.isValid) {
        return { 
            organisationId: apiKeyResult.organisationId!, 
            userId: apiKeyResult.keyId!, // Use key ID as user ID for API Audit Trail
            isApi: true 
        };
    }
    
    // 2. Fallback to NextAuth Session Context (Frontend access)
    const session = await getServerSession(authOptions);

    if (session?.user?.id && session.user.organisationId && session.user.credits !== undefined) {
        return { 
            organisationId: session.user.organisationId, 
            userId: session.user.id, 
            userCredits: session.user.credits,
            isApi: false 
        };
    }

    // 3. Unauthenticated/Invalid context
    return { organisationId: null, userId: null, isApi: false, userCredits: 0 };
};


// -----------------------------------------------------------------------------
// POST /api/ingest – Seal a document (The Integrated Engine)
// -----------------------------------------------------------------------------
export async function POST(req: Request) {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    let mongoSession: any = null; // Variable to hold MongoDB session

    // --- 1. AUTHENTICATION & CONTEXT EXTRACTION ---
    const authContext = await getAuthContext(req);
    
    if (!authContext.organisationId) {
        return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: { "X-Request-ID": requestId } });
    }
    
    const userId = authContext.userId as string;
    const organisationId = authContext.organisationId as string;
    const userCreditsFromContext = authContext.userCredits; 


    try {
        // --- 2. PRE-PROCESSING & CHECKS ---
        const headerList = headers();
        const idempotencyKey = headerList.get("idency-key")?.slice(0, 100) || null;
        const contentLength = headerList.get("content-length");
        const ip = headerList.get("x-forwarded-for")?.split(",")[0] || "unknown";

        // Rate limiting (per organisation)
        const { success } = await ratelimit(5, "30 s").limit(`ingest:${organisationId}`);
        if (!success) {
            return NextResponse.json({ error: "Rate limit exceeded. Please slow down." }, { status: 429, headers: { "X-Request-ID": requestId } });
        }
        
        // Input size guardrail (100 MB max)
        if (contentLength && parseInt(contentLength) > 100_000_000) {
            return NextResponse.json({ error: "File too large. Maximum 100 MB allowed." }, { status: 413, headers: { "X-Request-ID": requestId } });
        }

        // File Parsing and Initial Check
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: "No valid file uploaded" }, { status: 400, headers: { "X-Request-ID": requestId } });
        }
        
        const buffer = Buffer.from(await file.arrayBuffer());

        // --- 3. CLASSIFICATION & PROOF GENERATION ---
        
        const { text, textPreview, passport, fpic } = await processDocument(buffer, file.name);

        const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
        const vaultHash = crypto.createHash("sha3-512").update(buffer).digest("hex");

        // --- 4. ATOMIC TRANSACTION (Credit Deduction, Insert, Audit Log) ---
        
        const { dbIdentity, client } = await getDatabases(); 
        const dbSealedDocuments = client.db("rareearthminerals").collection("sealed_documents");
        const dbAuditTrail = dbIdentity.collection("audit_trail");
        const dbUsers = dbIdentity.collection("users"); 

        if (idempotencyKey) {
            const existing = await dbSealedDocuments.findOne({ idempotencyKey });
            if (existing) {
                return NextResponse.json({
                    success: true,
                    documentId: existing._id,
                    verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${existing._id}`,
                    message: "Idempotent request – returning existing document",
                }, { headers: { "X-Request-ID": requestId } });
            }
        }

        mongoSession = client.startSession();
        let docResult: any;
        let finalCreditsAfter: number; 
        let finalCreditsBefore: number; 

        await mongoSession.withTransaction(async () => {
            // A. Deduct Credit (CRITICAL COMMERCIAL STEP)
            const userUpdate = await dbUsers.findOneAndUpdate(
                { _id: new ObjectId(userId), credits: { $gte: 1 } }, 
                { $inc: { credits: -1 } },
                { returnDocument: "after", session: mongoSession }
            );
            
            if (!userUpdate.value) {
                throw new Error("Insufficient credits");
            }

            finalCreditsAfter = userUpdate.value.credits;
            finalCreditsBefore = finalCreditsAfter + 1; // 100% accurate pre-transaction credit count


            // B. Insert the Sealed Document (The Vault Record)
            const now = new Date();
            const sealedDoc = {
                filename: file.name,
                size: file.size,
                mimeType: file.type,
                uploadedAt: now,
                uploadedByIp: ip,

                // Identity & Tenancy (EPIC 1 INTEGRATION)
                sealedByUserId: new ObjectId(userId),
                sealedByOrganisationId: new ObjectId(organisationId),

                // Classification Data (EPIC 2.2)
                textPreview: textPreview,
                passport, // All 6 articles
                fpic,

                // Core Integrity (EPIC 2.3)
                hash: vaultHash,
                sha256,
                idempotencyKey: idempotencyKey || null,
                _requestId: requestId,
                _fullText: text 
            };
            
            docResult = await dbSealedDocuments.insertOne(sealedDoc, { session: mongoSession });

            // C. Immutable Audit Trail (Proof of action)
            await dbAuditTrail.insertOne({
                event: "DOCUMENT_SEALED",
                userId: new ObjectId(userId),
                organisationId: new ObjectId(organisationId),
                documentId: docResult.insertedId,
                timestamp: now,
                creditsBefore: finalCreditsBefore, 
                creditsAfter: finalCreditsAfter,
                hash: vaultHash,
                _requestId: requestId,
                isApiCall: authContext.isApi
            }, { session: mongoSession });
        });

        // 5. Final response – includes public verification URL
        return NextResponse.json({
            success: true,
            documentId: docResult.insertedId,
            verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${docResult.insertedId}`,
            sealedAt: new Date().toISOString(),
            hash: vaultHash,
            message: "Document permanently sealed with cryptographic proof (1 credit deducted).",
        }, { status: 201, headers: { "X-Request-ID": requestId } });

    } catch (err: any) {
        if (mongoSession) await mongoSession.abortTransaction();
        
        const statusMap: Record<string, number> = { "Insufficient credits": 402 };
        const status = statusMap[err.message] || 500;

        console.error(JSON.stringify({ level: "error", message: "Ingest failed", requestId, error: err.message }));

        return NextResponse.json({ error: err.message || "Internal server error" }, { status, headers: { "X-Request-ID": requestId } });
        
    } finally {
        if (mongoSession) await mongoSession.endSession();
    }
}

export const dynamic = "force-dynamic";
