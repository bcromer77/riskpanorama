// models/User.ts
import { Schema, Document, Types } from "mongoose";
import * as bcrypt from "bcrypt";

// 1. Interface (MUST be exported)
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

// 2. Schema (MUST be exported)
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

// 3. Pre-save Hook (Hooks remain on the schema)
UserSchema.pre<IUser>("save", async function (next) {
  if (this.isModified("hashedPassword")) {
    this.hashedPassword = await bcrypt.hash(this.hashedPassword, 10);
  }
  next();
});

// 4. Custom Method (Method remains on the schema)
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.hashedPassword);
};

// 5. Final Export (Export a simple, non-Mongoose placeholder)
// This avoids crashing the compiler and relies on the getter to register the model later.
export const User = null;
