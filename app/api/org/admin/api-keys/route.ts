// app/api/org/admin/api-keys/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import ApiKeyModel from "@/models/ApiKey";
import crypto from "crypto";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.organisationId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const userId = session.user.id as string;
  const orgId = session.user.organisationId as string;

  // Optional: Restrict to admins only
  // if (session.user.role !== "admin") {
  //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // }

  try {
    const { name, permissions } = await req.json();

    if (!name || !Array.isArray(permissions) || permissions.length === 0) {
      return NextResponse.json(
        { error: "Name and permissions array required" },
        { status: 400 }
      );
    }

    // GENERATE SECURE API KEY (NEVER STORED IN PLAIN TEXT)
    const rawKey = `rem_${crypto.randomBytes(32).toString("hex")}`;
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    const apiKey = await ApiKeyModel.create({
      organisationId: new ObjectId(orgId),
      keyHash,
      name: name.trim(),
      permissions,
      createdBy: new ObjectId(userId),
    });

    // RETURN RAW KEY ONCE — THIS IS THE ONLY TIME IT'S EVER SHOWN
    return NextResponse.json(
      {
        success: true,
        message: "API key created successfully",
        keyId: apiKey._id.toString(),
        keyPrefix: keyHash.slice(0, 8),
        fullKey: rawKey, // ← SHOWN ONLY ONCE
        warning: "This key is shown only once. Copy it now — it will never be displayed again.",
        permissions: apiKey.permissions,
        createdAt: apiKey.createdAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API key creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
