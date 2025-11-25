// app/api/ingest/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabases } from "@/lib/mongodb"; // Use the native client utility
import { ratelimit } from "@/lib/ratelimit"; // Rate limiting utility
import { headers } from "next/headers";
import crypto from "crypto";
import { processDocument } from "@/lib/classification"; // The Classification Brain
import { ObjectId } from "mongodb"; // Required for using ObjectId constructors

// -----------------------------------------------------------------------------
// POST /api/ingest – Seal a document (The Integrated Engine)
// -----------------------------------------------------------------------------
export async function POST(req: Request) {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    let mongoSession: any = null; // Variable to hold MongoDB session

    try {
        // --- 1. PRE-PROCESSING & AUTHENTICATION ---
        const headerList = headers();
        const idempotencyKey = headerList.get("idempotency-key")?.slice(0, 100) || null;
        const contentLength = headerList.get("content-length");
        const ip = headerList.get("x-forwarded-for")?.split(",")[0] || "unknown";

        const session = await getServerSession(authOptions);
        if (!session?.user?.id || !session.user.organisationId) {
            return NextResponse.json({ error: "Unauthenticated" }, { status: 401, headers: { "X-Request-ID": requestId } });
        }
        
        const userId = session.user.id as string;
        const organisationId = session.user.organisationId as string;
        // userCredits is still read from session, but we use the live DB value for the audit log
        // const userCredits = session.user.credits as number; 

        // 2. Rate limiting (per organisation)
        const { success } = await ratelimit(5, "30 s").limit(`ingest:${organisationId}`);
        if (!success) {
            return NextResponse.json({ error: "Rate limit exceeded. Please slow down." }, { status: 429, headers: { "X-Request-ID": requestId } });
        }
        
        // 3. Input size guardrail (100 MB max)
        if (contentLength && parseInt(contentLength) > 100_000_000) {
            return NextResponse.json({ error: "File too large. Maximum 100 MB allowed." }, { status: 413, headers: { "X-Request-ID": requestId } });
        }

        // 4. File Parsing and Initial Check
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: "No valid file uploaded" }, { status: 400, headers: { "X-Request-ID": requestId } });
        }
        
        const buffer = Buffer.from(await file.arrayBuffer());

        // --- 5. CLASSIFICATION & PROOF GENERATION ---
        
        // Use the classification utility to process the document
        const { text, textPreview, passport, fpic } = await processDocument(buffer, file.name);

        // Compute cryptographic proofs (SHA-3-512 for vault hash, SHA-256 for secondary proof)
        const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
        const vaultHash = crypto.createHash("sha3-512").update(buffer).digest("hex");

        // --- 6. ATOMIC TRANSACTION (Credit Deduction, Insert, Audit Log) ---
        
        const { dbIdentity, client } = await getDatabases(); // Get client and identity DB
        const dbSealedDocuments = client.db("rareearthminerals").collection("sealed_documents");
        const dbAuditTrail = dbIdentity.collection("audit_trail");
        const dbUsers = dbIdentity.collection("users"); // Use native collection for transactional update

        // Idempotency check first
        if (idempotencyKey) {
            const existing = await dbSealedDocuments.findOne({ idempotencyKey });
            if (existing) {
                // Returns the existing sealed document if key matches
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
        let finalCreditsAfter: number; // Variable to hold the actual post-transaction credit count

        await mongoSession.withTransaction(async () => {
            // A. Deduct Credit (CRITICAL COMMERCIAL STEP)
            const userUpdate = await dbUsers.findOneAndUpdate(
                // Use new ObjectId() constructor for safety
                { _id: new ObjectId(userId), credits: { $gte: 1 } }, 
                { $inc: { credits: -1 } },
                { returnDocument: "after", session: mongoSession }
            );
            
            if (!userUpdate.value) {
                // This failure automatically rolls back the transaction
                throw new Error("Insufficient credits");
            }

            // Capture the precise credit values for the audit log (THE FIX)
            finalCreditsAfter = userUpdate.value.credits;
            const finalCreditsBefore = finalCreditsAfter + 1;


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
                _fullText: text // Store full text for future Vector Search / Agentic RAG (EPIC 6.4)
            };
            
            docResult = await dbSealedDocuments.insertOne(sealedDoc, { session: mongoSession });

            // C. Immutable Audit Trail (Proof of action)
            await dbAuditTrail.insertOne({
                event: "DOCUMENT_SEALED",
                userId: new ObjectId(userId),
                organisationId: new ObjectId(organisationId),
                documentId: docResult.insertedId,
                timestamp: now,
                // --- AUDIT ACCURACY FIX ---
                creditsBefore: finalCreditsBefore, 
                creditsAfter: finalCreditsAfter,
                // --------------------------
                hash: vaultHash,
                _requestId: requestId,
            }, { session: mongoSession });
        });

        // 7. Structured logging
        console.log(JSON.stringify({
            level: "info", message: "Document sealed successfully", requestId, userId, organisationId,
            documentId: docResult.insertedId, filename: file.name, processingMs: Date.now() - startTime, ip,
        }));

        // 8. Final response – includes public verification URL
        return NextResponse.json({
            success: true,
            documentId: docResult.insertedId,
            verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${docResult.insertedId}`,
            sealedAt: new Date().toISOString(),
            hash: vaultHash,
            message: "Document permanently sealed with cryptographic proof",
            passport: docResult.passport, // Return classification result
        }, { status: 201, headers: { "X-Request-ID": requestId } });

    } catch (err: any) {
        if (mongoSession) await mongoSession.abortTransaction();
        
        const statusMap: Record<string, number> = { "Insufficient credits": 402 };
        const status = statusMap[err.message] || 500;

        console.error(JSON.stringify({ level: "error", message: "Ingest failed", requestId, error: err.message, processingMs: Date.now() - startTime }));

        return NextResponse.json({ error: err.message || "Internal server error" }, { status, headers: { "X-Request-ID": requestId } });
        
    } finally {
        if (mongoSession) await mongoSession.endSession();
    }
}

// Optional: Enforce only POST and dynamic execution
export const dynamic = "force-dynamic";
