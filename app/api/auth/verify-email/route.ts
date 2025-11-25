// app/api/auth/verify-email/route.ts
import { NextResponse } from 'next/server';
import { getDatabases } from '@/lib/mongodb';
import { initializeIdentityModels } from '@/models/index';
import { TokenModel } from '@/models/Token'; 

export async function POST(request: Request) {
    try {
        const { token } = await request.json();
        if (!token) return NextResponse.json({ message: "Token required." }, { status: 400 });

        const { dbIdentity } = await getDatabases();
        const { User } = await initializeIdentityModels(dbIdentity);

        // 1. Find Token (must match type and not be expired by TTL index)
        const dbToken = await TokenModel.findOne({ 
            token: token, 
            type: 'emailVerification' 
        });

        if (!dbToken) {
            return NextResponse.json({ message: "Invalid or expired token." }, { status: 400 });
        }
        
        // 2. Update User Status (CRITICAL TRUST STEP)
        const user = await User.findByIdAndUpdate(dbToken.userId, 
            { emailVerified: true }, 
            { new: true }
        );

        if (!user) {
            return NextResponse.json({ message: "User not found." }, { status: 404 });
        }

        // 3. Delete Token (Single Use)
        await dbToken.deleteOne();

        return NextResponse.json({ message: "Email verified successfully.", email: user.email });
        
    } catch (error) {
        console.error("Verification validation failed:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
