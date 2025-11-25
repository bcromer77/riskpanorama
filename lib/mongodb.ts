// lib/mongodb.ts

import { MongoClient } from "mongodb";
// IMPORT Mongoose: Necessary for Mongoose models to attach to this connection
import mongoose, { Connection } from "mongoose";

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!uri) {
  // Switched to MONGODB_URI for consistency
  throw new Error("Missing MONGODB_URI in environment");
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // allow global caching in dev
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// 1. Native Driver Connection Logic (Your Original Code)
if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

// 2. Export Database Connections + Native Mongoose Connection
export const getDatabases = async () => {
  const client = await clientPromise;
  
  // dbV = Identity DB (e.g., veracity101), dbR = Risk DB (e.g., riskpanorama)
  const dbV = client.db(process.env.DB_VERACITY); 
  const dbR = client.db(process.env.DB_PANORAMA);
  
  // This is the native connection that Mongoose models will attach to
  const nativeConnection = client.connection as Connection;

  return { dbIdentity: dbV, dbRisk: dbR, nativeConnection, client };
};

export default clientPromise;
