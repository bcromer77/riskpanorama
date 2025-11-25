// app/api/document/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabases } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * GET /api/document
 * Retrieves a list of documents visible to the current user.
 * VISIBILITY RULE: User sees documents they created OR documents not marked 'Creator-Only View'.
 */
export async function GET() {
    
    // 1. Authentication and Identity Check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.organisationId) {
        return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    
    const userId = session.user.id as string;
    const organisationId = session.user.organisationId as string;

    try {
        const { client } = await getDatabases();
        const dbSealedDocuments = client.db("rareearthminerals").collection("sealed_documents");
        
        // --- 2. SECURE VISIBILITY FILTER (The Creator Sovereignty Check) ---
        const visibilityFilter = {
            // A. MANDATORY: Filter by organization tenancy
            sealedByOrganisationId: new ObjectId(organisationId),
            
            // B. CONDITIONAL VISIBILITY ($or logic)
            $or: [
                // 1. The user is the document creator
                { sealedByUserId: new ObjectId(userId) },
                // 2. The document allows organizational viewing (i.e., not marked creator-only)
                { "accessSettings.creatorOnlyView": { $ne: true } }
            ]
        };

        // 3. Data Retrieval
        const docs = await dbSealedDocuments
            .find(visibilityFilter, {
                projection: {
                    filename: 1,
                    uploadedAt: 1,
                    textPreview: 1,
                    passport: 1, 
                    fpic: 1,
                    hash: 1, 
                    accessSettings: 1, // Include access settings to show icons/warnings
                    _fullText: 0, 
                    vectorEmbedding: 0
                },
            })
            .sort({ uploadedAt: -1 })
            .limit(50) 
            .toArray();

        // 4. Mapping and Response (rest remains the same)
        const mapped = docs.map((d: any) => ({
            id: d._id.toString(),
            filename: d.filename ?? "Untitled document",
            uploadedAt: d.uploadedAt ?? null,
            textPreview: d.textPreview ?? "",
            passport: d.passport ?? null,
            fpic: d.fpic ?? null,
            hash: d.hash ?? null, 
            accessSettings: d.accessSettings ?? { creatorOnlyView: false, externalShareEnabled: false },
        }));

        return NextResponse.json({ documents: mapped });
        
    } catch (err: any) {
        console.error("Error in /api/document:", err);
        return NextResponse.json(
            { error: err.message ?? "Failed to load documents" },
            { status: 500 }
        );
    }
}

export const dynamic = "force-dynamic";
