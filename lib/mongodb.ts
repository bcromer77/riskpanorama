import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Missing MONGO_URI in environment");
}

let client;
let clientPromise: Promise<MongoClient>;

declare global {
  // allow global caching in dev
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

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

export const getDatabases = async () => {
  const client = await clientPromise;
  const dbV = client.db(process.env.DB_VERACITY);
  const dbR = client.db(process.env.DB_PANORAMA);
  return { dbV, dbR };
};

export default clientPromise;

