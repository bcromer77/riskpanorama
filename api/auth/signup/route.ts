// app/api/auth/signup/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db"; // Your connection utility
import { getModel } from "@/lib/models"; // The new model getter utility

/**
 * Handles POST requests for user sign-up using the safe model getter.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Connect to the database
    await connectDB();

    // 2. Get Models safely using the helper function
    const User = await getModel('User');
    const Organisation = await getModel('Organisation');

    // 3. Parse and Validate
    const body = await req.json();
    const { email, password, organisationName, country } = body;

    if (!email || !password || !organisationName || !country) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 }
      );
    }

    // 4. Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "A user with this email already exists." },
        { status: 409 }
      );
    }

    // 5. Find or Create Organisation
    let organisation = await Organisation.findOne({ name: organisationName });

    if (!organisation) {
      organisation = await Organisation.create({
        name: organisationName,
        country,
      });
    }

    // 6. Create the new User
    const newUser = await User.create({
      email,
      hashedPassword: password, 
      organisationId: organisation._id,
      role: 'admin',
    });

    // 7. Update Organisation to link the new user
    await Organisation.findByIdAndUpdate(organisation._id, { $push: { users: newUser._id } });

    // 8. Success Response
    return NextResponse.json(
      {
        message: "Sign-up successful! User and Organization created.",
        user: {
          id: newUser._id,
          email: newUser.email,
          organisation: organisation.name,
          role: newUser.role,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Sign-up Error:", error);
    return NextResponse.json(
      { message: "Internal server error during sign-up." },
      { status: 500 }
    );
  }
}
