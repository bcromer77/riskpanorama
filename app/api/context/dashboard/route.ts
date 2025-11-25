// app/api/context/dashboard/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabases } from '@/lib/mongodb';
import { initializeIdentityModels } from '@/models/index';
import { Types } from 'mongoose';

/**
 * GET /api/context/dashboard
 * Retrieves all necessary user, role, and organisation data for initial dashboard load.
 * This powers the navigation and the Organisation Switcher.
 */
export async function GET(request: Request) {
    // 1. Authentication Check & Session Data Extraction (from JWT)
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.organisationId) {
        // Redirect logic would happen on the frontend, but the API confirms state.
        return NextResponse.json({ error: "Session invalid or missing organization context." }, { status: 401 });
    }

    const { id, email, role, credits, organisationId } = session.user;
    
    try {
        const { dbIdentity } = await getDatabases();
        const { Organisation } = await initializeIdentityModels(dbIdentity);
        
        // 2. Fetch Organisation Details (Name for the UI)
        const currentOrg = await Organisation.findById(new Types.ObjectId(organisationId))
            .select('name country')
            .exec();
            
        if (!currentOrg) {
            // CRITICAL ERROR: User is authenticated but their organization is missing.
            // This should trigger a forced sign-out on the frontend.
            console.error(`Dashboard Context Error: Org ID ${organisationId} not found.`);
            return NextResponse.json({ error: "Organization record missing. Please re-authenticate." }, { status: 404 });
        }

        // 3. Construct the Dashboard Context Payload
        const contextPayload = {
            user: {
                id: id,
                email: email,
                role: role,
                credits: credits,
                emailVerified: true // Assuming frontend displays if verified
            },
            organisation: {
                id: organisationId,
                name: currentOrg.name,
                country: currentOrg.country,
                // In a future multi-org version, you'd list all orgs here.
                canSwitch: false // For now, only one org is supported per session
            },
            // Metadata for front-end access control
            permissions: {
                canUpload: role === 'admin' || role === 'uploader',
                canManageTeam: role === 'admin',
                canViewBilling: role === 'admin',
            }
        };

        // 4. Final Response
        return NextResponse.json(contextPayload, { status: 200 });

    } catch (error: any) {
        console.error("Dashboard context retrieval failed:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}

// Ensure this route always executes dynamically
export const dynamic = "force-dynamic";
