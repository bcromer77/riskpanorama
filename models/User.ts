// models/User.ts
import { Schema, Document, Types, Model } from "mongoose";
import * as bcrypt from "bcrypt";

export interface IUser extends Document {
  email: string;
  hashedPassword: string;
  createdAt: Date;
  credits: number; 
  role: "admin" | "reviewer" | "uploader"; 
  organisationId: Types.ObjectId; 
  emailVerified: boolean;
  deleteRequestedAt?: Date;
  comparePassword: (password: string) => Promise<boolean>;
}

// Define the schema first
export const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  hashedPassword: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  credits: { type: Number, default: 10, required: true }, 
  role: {
    type: String,
    enum: ["admin", "reviewer", "uploader"],
    default: "uploader",
    required: true,
  },
  organisationId: {
    type: Schema.Types.ObjectId,
    ref: "Organisation",
    required: true,
  },
  emailVerified: { type: Boolean, default: false },
  deleteRequestedAt: { type: Date, default: null },
});

// Pre-save hook for password hashing (CRITICAL SECURITY STEP)
UserSchema.pre<IUser>("save", async function (next) {
  if (this.isModified("hashedPassword")) {
    this.hashedPassword = await bcrypt.hash(this.hashedPassword, 10);
  }
  next();
});

// Custom method for password comparison (used by NextAuth Credentials)
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.hashedPassword);
};
