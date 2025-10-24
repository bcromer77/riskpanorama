// app/api/clear-database/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('supply_chain_risk');
    const collection = db.collection('documents');
    
    const result = await collection.deleteMany({});
    
    return NextResponse.json({
      message: 'Database cleared successfully',
      deletedCount: result.deletedCount
    });
    
  } catch (error) {
    console.error('Clear database error:', error);
    return NextResponse.json(
      { error: 'Failed to clear database' },
      { status: 500 }
    );
  }
}
