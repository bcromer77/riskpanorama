// app/api/cron/delete-expired-users/route.ts
import { NextResponse } from 'next/server';
import { getDatabases } from '@/lib/mongodb';
import { initializeIdentityModels } from '@/models/index';

const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET() {
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.json({ error: "Cron disabled in dev" }, { status: 403 });
  }

  try {
    const { dbIdentity, client: mongoClient } = await getDatabases();
    const { User } = await initializeIdentityModels(dbIdentity);
    const dbVault = mongoClient.db("rareearthminerals");

    const cutoff = new Date(Date.now() - GRACE_PERIOD_MS);

    const usersToDelete = await User.find({
      deleteRequestedAt: { $lte: cutoff },
      deletionCancelledAt: { $exists: false },
      deletionCompletedAt: { $exists: false },
      isActive: false,
    }).select('_id organisationId');

    let deletedCount = 0;

    for (const user of usersToDelete) {
      const session = mongoClient.startSession();
      try {
        await session.withTransaction(async () => {
          // 1. Delete all sealed documents
          await dbVault.collection("sealed_documents").deleteMany({
            sealedByUserId: user._id
          });

          // 2. Audit permanent deletion
          await dbIdentity.collection("audit_trail").insertOne({
            event: "DATA_PERMANENTLY_DELETED",
            userId: user._id,
            organisationId: user.organisationId,
            timestamp: new Date(),
            details: { triggeredBy: "automated_cron" },
          }, { session });

          // 3. Mark user as deleted
          await User.findByIdAndUpdate(user._id, {
            $set: { deletionCompletedAt: new Date() },
          }, { session });
        });

        deletedCount++;
      } catch (err) {
        console.error(`Failed to delete user ${user._id}:`, err);
      } finally {
        await session.endSession();
      }
    }

    return NextResponse.json({ 
      success: true, 
      deletedUsers: deletedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Cron deletion failed:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
