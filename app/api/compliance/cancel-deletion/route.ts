// app/api/compliance/cancel-deletion/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabases } from '@/lib/mongodb';
import { initializeIdentityModels } from '@/models/index';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const userId = session.user.id as string;

  try {
    const { dbIdentity } = await getDatabases();
    const { User } = await initializeIdentityModels(dbIdentity);

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
    if (user.deletionCompletedAt) return NextResponse.json({ error: "Account already deleted." }, { status: 410 });
    if (!user.deleteRequestedAt) return NextResponse.json({ message: "No deletion request to cancel." }, { status: 200 });

    const daysSinceRequest = (Date.now() - user.deleteRequestedAt.getTime()) / (86400000);
    if (daysSinceRequest > 7) {
      return NextResponse.json({ error: "Grace period expired. Deletion is irreversible." }, { status: 400 });
    }

    await User.findByIdAndUpdate(userId, {
      $set: {
        isActive: true,
        deletionCancelledAt: new Date(),
      },
      $unset: {
        deleteRequestedAt: "",
      }
    });

    await dbIdentity.collection("audit_trail").insertOne({
      event: "DATA_DELETION_CANCELLED",
      userId: user._id,
      organisationId: user.organisationId,
      timestamp: new Date(),
      details: { cancelledBy: "user_self" },
    });

    return NextResponse.json({
      success: true,
      message: "Deletion request cancelled. Your account is active again.",
    });

  } catch (error: any) {
    console.error("Cancellation failed:", error);
    return NextResponse.json({ error: "Failed to cancel deletion." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
