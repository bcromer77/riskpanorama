// lib/mongo.ts
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;

let client: MongoClient | null = null;

export async function getDb() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db(dbName);
}

