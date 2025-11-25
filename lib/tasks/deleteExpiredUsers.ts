// lib/tasks/deleteExpiredUsers.ts
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

const usersToDelete = await User.find({
  deleteRequestedAt: { $lte: sevenDaysAgo },
  deletionCancelledAt: { $exists: false }
});

for (const user of usersToDelete) {
  await dbSealedDocuments.deleteMany({ sealedByUserId: user._id });
  await dbAuditTrail.insertOne({ event: "DATA_PERMANENTLY_DELETED", userId: user._id, timestamp: new Date() });
  await User.deleteOne({ _id: user._id });
}
