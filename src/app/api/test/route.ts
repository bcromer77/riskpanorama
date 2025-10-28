import { getDatabases } from "@/lib/mongodb";

export async function GET() {
  try {
    const { dbV, dbR } = await getDatabases();

    const collectionsV = await dbV.listCollections().toArray();
    const collectionsR = await dbR.listCollections().toArray();

    return Response.json({
      success: true,
      veracityDB: process.env.DB_VERACITY,
      panoramaDB: process.env.DB_PANORAMA,
      collections: {
        veracity: collectionsV.map(c => c.name),
        panorama: collectionsR.map(c => c.name),
      },
    });
  } catch (e: any) {
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}

