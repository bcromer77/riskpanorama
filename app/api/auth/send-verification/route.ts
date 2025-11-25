// app/api/auth/send-verification/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDatabases } from '@/lib/mongodb';
import { initializeIdentityModels } from '@/models/index';
import { TokenModel } from '@/models/Token'; // Assuming TokenModel is exported

// NOTE: This assumes a simple email utility exists at lib/email
// import { sendEmail } from '@/lib/email'; 

export async function POST(request: Request) {
    try {
        const { email } = await request.json();
        if (!email) return NextResponse.json({ message: "Email required." }, { status: 400 });

        const { dbIdentity } = await getDatabases();
        const { User } = await initializeIdentityModels(dbIdentity);

        const user = await User.findOne({ email });
        if (!user) {
            // Send a generic success message even if user not found to prevent enumeration
            return NextResponse.json({ message: "If user exists, verification email sent." });
        }
        if (user.emailVerified) {
            return NextResponse.json({ message: "Email already verified." }, { status: 200 });
        }

        // 1. Generate and Save Token (Expires in 1 hour)
        const tokenValue = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Clean up old tokens first
        await TokenModel.deleteMany({ userId: user._id, type: 'emailVerification' });

        await TokenModel.create({
            userId: user._id,
            token: tokenValue,
            type: 'emailVerification',
            expiresAt: expiresAt,
        });

        // 2. Send Email (Placeholder)
        const verificationLink = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify?token=${tokenValue}`;
        
        /* await sendEmail({
            to: user.email,
            subject: 'Verify Your RareEarthMinerals.ai Email',
            html: `<a href="${verificationLink}">Click here to verify your email.</a>`
        });
        */

        return NextResponse.json({ message: "Verification link sent to email." });

    } catch (error) {
        console.error("Verification send failed:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
