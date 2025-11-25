// app/api/auth/signup/route.ts
import { NextResponse } from 'next/server';
import { getDatabases } from '@/lib/mongodb';
import { initializeIdentityModels } from '@/models/index';
import { MongoClient } from 'mongodb'; // Import MongoClient for session/transaction management

// Helper function for basic input validation
const validateInput = (data: any) => {
    const { email, password, organisationName, country } = data;
    if (!email || !password || !organisationName || !country) {
        return "All fields (email, password, organization name, country) are required.";
    }
    if (password.length < 8) {
        return "Password must be at least 8 characters long.";
    }
    // Basic email regex (can be made more robust)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return "Invalid email format.";
    }
    return null; // Validation passed
};


/**
 * POST /api/auth/signup
 * Handles user and organization creation within a single transaction.
 */
export async function POST(request: Request) {
    let session: any = null; // Use 'any' for the MongoDB session object
    
    try {
        const body = await request.json();
        const validationError = validateInput(body);

        if (validationError) {
            return NextResponse.json({ message: validationError }, { status: 400 });
        }

        const { email, password, organisationName, country } = body;

        // 1. Get the native MongoDB Client and Identity DB
        const { dbIdentity, client } = await getDatabases();
        const { User, Organisation } = await initializeIdentityModels(dbIdentity);
        
        // Ensure the client is a MongoClient instance
        const mongoClient = client as MongoClient; 

        // 2. Check for existing user with this email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ message: "User with this email already exists." }, { status: 409 });
        }

        // --- 3. Start MongoDB Transaction (ACID Compliance) ---
        session = mongoClient.startSession();
        session.startTransaction();

        // 4. Create the new Organisation
        const newOrganisation = new Organisation({
            name: organisationName,
            country: country,
            rolePermissions: { // Default permissions for basic roles
                admin: ["manage_users", "manage_billing", "upload", "seal", "query"],
                uploader: ["upload", "seal"],
                reviewer: ["query"]
            }
        });

        const savedOrganisation = await newOrganisation.save({ session });
        const organisationId = savedOrganisation._id;

        // 5. Create the new User (with 'admin' role and linked to the new organization)
        const newUser = new User({
            email,
            // Mongoose pre-save hook will hash this password automatically
            hashedPassword: password, 
            credits: 10, // Default Freemium credit start
            role: 'admin', // First user is the admin
            organisationId: organisationId,
            emailVerified: false,
        });
        
        const savedUser = await newUser.save({ session });

        // 6. Update the Organisation's user array (linking the user back)
        await Organisation.updateOne(
            { _id: organisationId },
            { $push: { users: savedUser._id } },
            { session }
        );

        // 7. Commit the transaction
        await session.commitTransaction();

        // 8. Success Response (Exclude sensitive password/hash data)
        const userResponse = {
            id: savedUser._id,
            email: savedUser.email,
            role: savedUser.role,
            organisationId: savedUser.organisationId,
            credits: savedUser.credits
        };

        return NextResponse.json({ 
            message: "Account and Organization created successfully.", 
            user: userResponse
        }, { status: 201 });

    } catch (error: any) {
        // --- 9. Abort on Error ---
        if (session) {
            await session.abortTransaction();
        }
        
        console.error("Sign-up transaction failed:", error);

        // Check for duplicate key error (E11000) not caught by the initial check
        if (error.code === 11000) {
            return NextResponse.json({ message: "Email or Organization name already in use." }, { status: 409 });
        }

        return NextResponse.json({ message: "Internal server error during sign-up." }, { status: 500 });
        
    } finally {
        // --- 10. End the session ---
        if (session) {
            await session.endSession();
        }
    }
}
