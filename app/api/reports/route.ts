import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const runtime = 'nodejs';

// GET /api/reports → fetch latest saved reports
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('veracity101');
    const reports = await db
      .collection('reports')
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ success: true, reports });
  } catch (err: any) {
    console.error('Error fetching reports:', err);
    return NextResponse.json(
      { success: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}

