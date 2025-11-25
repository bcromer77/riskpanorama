// app/api/auth/reset-password/route.ts
import { NextResponse } from 'next/server';
import { getDatabases } from '@/lib/mongodb';
import { initializeIdentityModels } from '@/models/index';
import { TokenModel } from '@/models/Token';
// Note: User model pre-save hook handles hashing, so we just update the field.

export async function POST(request: Request) {
    try {
        const { token, newPassword } = await request.json();
        if (!token || !newPassword || newPassword.length < 8) {
            return NextResponse.json({ message: "Invalid input or password too short." }, { status: 400 });
        }

        const { dbIdentity } = await getDatabases();
        const { User } = await initializeIdentityModels(dbIdentity);

        // 1. Find Token
        const dbToken = await TokenModel.findOne({ 
            token: token, 
            type: 'passwordReset' 
        });

        if (!dbToken) {
            return NextResponse.json({ message: "Invalid or expired reset token." }, { status: 400 });
        }

        // 2. Update User Password
        const user = await User.findById(dbToken.userId);
        if (!user) return NextResponse.json({ message: "User not found." }, { status: 404 });

        // Update the password field. The pre-save hook in models/User.ts handles the hashing.
        user.hashedPassword = newPassword; 
        await user.save(); // save() triggers the pre-save hook to hash the new password

        // 3. Delete Token (Single Use)
        await dbToken.deleteMany({ userId: user._id }); // Delete all reset tokens for this user

        return NextResponse.json({ message: "Password reset successfully." });

    } catch (error) {
        console.error("Password reset failed:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
