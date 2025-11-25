// lib/security.ts (Conceptual function)

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from 'next/server';

export const requireAdmin = async (req: Request) => {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'admin' || !session.user.organisationId) {
        return { 
            adminId: null, 
            organisationId: null,
            response: NextResponse.json({ error: "Access Denied: Admin privileges required." }, { status: 403 }) 
        };
    }
    
    return {
        adminId: session.user.id as string,
        organisationId: session.user.organisationId as string,
        response: null // Success
    };
};
