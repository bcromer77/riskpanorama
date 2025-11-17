import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db("rareearthminerals");

const run = async () => {
  await client.connect();
  const count = await db.collection("signals").countDocuments();
  console.log("Total signals docs:", count);
  const sample = await db.collection("signals").findOne();
  console.log("Sample:", sample);
  await client.close();
};

run();

