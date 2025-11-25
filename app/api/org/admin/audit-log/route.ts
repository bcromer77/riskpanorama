// app/api/org/admin/audit-log/route.ts

import { NextResponse } from "next/server";
import { getDatabases } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/security';
import { ObjectId } from "mongodb";

/**
 * GET /api/org/admin/audit-log
 * Retrieves a time-sequenced list of all critical actions performed by users within the organization.
 * CRITICAL SECURITY: Restricted to Admin users only.
 */
export async function GET(request: Request) {
    
    // 1. Authorization Check (RBAC: Only Admins can view the full audit log)
    const authResult = await requireAdmin(request);
    if (authResult.response) return authResult.response;

    const { organisationId } = authResult;
    
    try {
        const { dbIdentity } = await getDatabases();
        const dbAuditTrail = dbIdentity.collection("audit_trail"); 
        
        // 2. Data Retrieval
        // Fetch all audit events for this organization, excluding password hashes/sensitive data
        const auditEvents = await dbAuditTrail
            .find(
                { 
                    organisationId: new ObjectId(organisationId),
                },
                {
                    projection: {
                        _id: 0,
                        event: 1,
                        timestamp: 1,
                        userId: 1, // User who initiated the action
                        documentId: 1,
                        targetUserId: 1, // User who was affected (for role changes/removal)
                        details: 1,
                        ip: 1,
                        creditsBefore: 1,
                        creditsAfter: 1,
                    },
                }
            )
            .sort({ timestamp: -1 }) // Most recent action first
            .limit(200) // Provide a generous limit for Admin oversight
            .toArray();

        // 3. Map for Frontend Display (Cleaning up IDs and event details)
        const mappedLog = auditEvents.map(event => {
            const cost = (event.creditsBefore && event.creditsAfter) ? event.creditsBefore - event.creditsAfter : 0;
            
            return {
                timestamp: event.timestamp.toISOString(),
                event: event.event,
                initiatedBy: event.userId ? event.userId.toString().slice(-6) : 'SYSTEM',
                targetUser: event.targetUserId ? event.targetUserId.toString().slice(-6) : null,
                documentRef: event.documentId ? event.documentId.toString().slice(-6) : null,
                cost: cost > 0 ? cost : undefined,
                details: event.details || {},
            };
        });

        // 4. Final Response
        return NextResponse.json({
            success: true,
            auditLog: mappedLog,
            organisationId: organisationId,
        }, { status: 200 });

    } catch (error: any) {
        console.error("Admin Audit Log retrieval failed:", error);
        return NextResponse.json({ error: "Internal server error during audit retrieval." }, { status: 500 });
    }
}

export const dynamic = "force-dynamic";
