// app/api/billing/history/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabases } from '@/lib/mongodb';
import { ObjectId } from "mongodb";

/**
 * GET /api/billing/history
 * Retrieves the organization's immutable credit consumption history from the audit log.
 * Provides transparency for auditors and internal stakeholders.
 */
export async function GET(request: Request) {
    
    // 1. Authorization Check (Only authenticated users can view their history)
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.organisationId) {
        return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    
    const organisationId = session.user.organisationId as string;
    
    try {
        const { dbIdentity } = await getDatabases();
        const dbAuditTrail = dbIdentity.collection("audit_trail"); // Use the dedicated audit collection
        
        // 2. Data Retrieval
        // We filter for consumption events that have creditBefore/creditAfter fields, 
        // ensuring we only pull high-value, auditable transactions.
        const historyEvents = await dbAuditTrail
            .find(
                { 
                    organisationId: new ObjectId(organisationId),
                    event: { 
                        $in: ["DOCUMENT_SEALED", "AGENTIC_REPORT_CHARGED", "CREDITS_PURCHASED"] 
                    }
                },
                {
                    projection: {
                        _id: 0,
                        event: 1,
                        timestamp: 1,
                        userId: 1,
                        documentId: 1,
                        creditsBefore: 1,
                        creditsAfter: 1,
                        cost: 1, // Cost for reports
                        query: 1, // Query for reports
                    },
                }
            )
            .sort({ timestamp: -1 }) // Most recent first
            .limit(100) // Limit the history size for performance
            .toArray();

        // 3. Map for Frontend Display
        const mappedHistory = historyEvents.map(event => ({
            type: event.event,
            date: event.timestamp,
            cost: event.cost || (event.creditsBefore - event.creditsAfter), // Calculate cost if not explicitly set
            documentId: event.documentId ? event.documentId.toString() : null,
            // Only expose the user ID who initiated the action (not their email/name) for security
            initiatedBy: event.userId.toString().slice(-6), 
            details: event.query || (event.event === 'DOCUMENT_SEALED' ? `File Sealed (ID: ${event.documentId.toString().slice(-6)})` : event.event),
            creditsRemaining: event.creditsAfter,
        }));

        // 4. Final Response
        return NextResponse.json({
            success: true,
            history: mappedHistory,
            organisationId: organisationId,
        }, { status: 200 });

    } catch (error: any) {
        console.error("Billing history retrieval failed:", error);
        return NextResponse.json({ error: "Internal server error during billing audit." }, { status: 500 });
    }
}

export const dynamic = "force-dynamic";
