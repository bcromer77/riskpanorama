// app/api/compliance/request-deletion/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDatabases } from '@/lib/mongodb';
import { initializeIdentityModels } from '@/models/index';
import { ObjectId } from 'mongodb';

const GRACE_PERIOD_DAYS = 7;

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
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Prevent re-request if already pending or deleted
    if (user.deleteRequestedAt && !user.deletionCancelledAt && !user.deletionCompletedAt) {
      return NextResponse.json({ 
        message: "Deletion already requested.",
        gracePeriodEnds: new Date(user.deleteRequestedAt.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000).toISOString()
      }, { status: 200 });
    }

    if (user.deletionCompletedAt) {
      return NextResponse.json({ error: "Account already permanently deleted." }, { status: 410 });
    }

    const now = new Date();
    const gracePeriodEnd = new Date(now.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

    await User.findByIdAndUpdate(userId, {
      $set: {
        deleteRequestedAt: now,
        isActive: false,
        deletionCancelledAt: null,
      }
    });

    await dbIdentity.collection("audit_trail").insertOne({
      event: "DATA_DELETION_REQUESTED",
      userId: new ObjectId(userId),
      organisationId: user.organisationId,
      timestamp: now,
      gracePeriodEnds: gracePeriodEnd,
      details: { initiatedBy: "user_self" },
    });

    return NextResponse.json({
      success: true,
      message: "Your account and all associated data will be permanently deleted after the mandatory 7-day grace period.",
      gracePeriodEnds: gracePeriodEnd.toISOString(),
      warning: "You will be logged out. You can cancel this request within 7 days.",
    }, { status: 200 });

  } catch (error: any) {
    console.error("Deletion request failed:", error);
    return NextResponse.json({ error: "Failed to process deletion request." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
