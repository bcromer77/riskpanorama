// lib/mongodb.ts — FINAL, 100% WORKING
import mongoose from "mongoose";

const MONGODB_URI = "mongodb+srv://bazilcromer_db_user:rem2025@cluster0.vpwmsh.mongodb.net/rareearthminerals_identity?retryWrites=true&w=majority";

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  console.log("Connected to Atlas → rareearthminerals_identity");
  return cached.conn;
}

export const getDatabases = connectToDatabase;
