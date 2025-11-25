// app/api/org/admin/team/route.ts

import { NextResponse } from 'next/server';
import { getDatabases } from '@/lib/mongodb';
import { initializeIdentityModels } from '@/models/index';
import { requireAdmin } from '@/lib/security'; // Re-use the authorization helper

/**
 * GET /api/org/admin/team
 * Retrieves the list of all users within the admin's organisation.
 * This data powers the Team Management Dashboard UI.
 */
export async function GET(request: Request) {
    // 1. Authorization Check (RBAC: Only Admins can view the roster)
    const authResult = await requireAdmin(request);
    if (authResult.response) return authResult.response;

    const { organisationId } = authResult;
    
    try {
        const { dbIdentity } = await getDatabases();
        const { User } = await initializeIdentityModels(dbIdentity);
        
        // 2. Data Retrieval
        // CRITICAL SECURITY: Use .select() to EXCLUDE the sensitive hashedPassword field.
        const teamRoster = await User.find({ organisationId: organisationId })
            .select('-hashedPassword') // Prevents exposure of sensitive data
            .select('-deleteRequestedAt') // Exclude compliance flags not relevant to the dashboard roster
            .exec();
        
        // 3. Success Response
        return NextResponse.json({ 
            team: teamRoster.map(user => ({
                id: user._id.toString(),
                email: user.email,
                role: user.role,
                credits: user.credits,
                createdAt: user.createdAt,
                emailVerified: user.emailVerified,
            })),
            organisationId: organisationId,
            memberCount: teamRoster.length,
        }, { status: 200 });

    } catch (error: any) {
        console.error("Team roster retrieval failed:", error);
        return NextResponse.json({ message: "Internal server error during data retrieval." }, { status: 500 });
    }
}

// Ensure this route always executes dynamically to check auth and database state
export const dynamic = "force-dynamic";
