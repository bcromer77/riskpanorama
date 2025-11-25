// app/api/org/admin/update-role/route.ts
import { NextResponse } from 'next/server';
import { getDatabases } from '@/lib/mongodb';
import { initializeIdentityModels } from '@/models/index';
import { requireAdmin } from '@/lib/security'; // The authorization helper
import { MongoClient } from 'mongodb';

/**
 * POST /api/org/admin/update-role - Changes a user's role within the organisation.
 * Requires calling user to be 'admin'.
 */
export async function POST(request: Request) {
    let session: any = null;
    
    // 1. Authorization Check (RBAC)
    const authResult = await requireAdmin(request);
    if (authResult.response) return authResult.response;

    const { adminId, organisationId } = authResult;

    try {
        const { targetUserId, newRole } = await request.json();
        const validRoles = ['admin', 'reviewer', 'uploader'];

        if (!targetUserId || !validRoles.includes(newRole)) {
            return NextResponse.json({ message: "Invalid user or role." }, { status: 400 });
        }

        const { dbIdentity, client } = await getDatabases();
        const { User } = await initializeIdentityModels(dbIdentity);
        
        // --- Transactional Update ---
        session = (client as MongoClient).startSession();
        session.startTransaction();

        // Check 1: Target user must exist and belong to the admin's organisation
        const targetUser = await User.findOne({ 
            _id: targetUserId, 
            organisationId: organisationId 
        });

        if (!targetUser) {
            await session.abortTransaction();
            return NextResponse.json({ message: "Target user not found or outside organization." }, { status: 404 });
        }

        const oldRole = targetUser.role;

        // Check 2: Admin cannot demote the last admin (CRITICAL GUARDRAIL)
        if (oldRole === 'admin' && newRole !== 'admin') {
             const adminCount = await User.countDocuments({ 
                organisationId: organisationId, 
                role: 'admin' 
             });
             if (adminCount <= 1) {
                await session.abortTransaction();
                return NextResponse.json({ 
                    message: "Cannot demote: At least one admin must remain in the organization." 
                }, { status: 403 });
             }
        }

        // 2. Perform Role Update
        const updatedUser = await User.findOneAndUpdate(
            { _id: targetUserId },
            { $set: { role: newRole } },
            { new: true, session }
        );

        // 3. Immutable Audit Trail (Proof of action)
        await dbIdentity.collection("audit_trail").insertOne({
            event: "ROLE_CHANGED",
            adminUserId: adminId,
            targetUserId: targetUserId,
            organisationId: organisationId,
            details: { oldRole, newRole },
            timestamp: new Date(),
        }, { session });

        await session.commitTransaction();

        return NextResponse.json({ 
            message: `Role for ${updatedUser?.email} updated to ${newRole}.`, 
            newRole: newRole 
        }, { status: 200 });

    } catch (error: any) {
        if (session) await session.abortTransaction();
        console.error("Role update failed:", error);
        return NextResponse.json({ message: "Internal server error during role update." }, { status: 500 });
    } finally {
        if (session) await session.endSession();
    }
}
