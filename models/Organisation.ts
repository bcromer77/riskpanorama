// models/Organisation.ts

import { Schema, Document, Types } from "mongoose"; // Note: Removed 'model' import as it's not used here

// 1. Interface Definition (REQUIRED export for type safety)
export interface IOrganisation extends Document {
  name: string;
  country: string;
  users: Types.ObjectId[];
  documentCount: number;
  inviteToken: string;
  rolePermissions: Record<string, string[]>;
}

// 2. Schema Definition (REQUIRED export for use in the Getter)
export const OrganisationSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  country: { type: String, required: true },
  users: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
  documentCount: { type: Number, default: 0 },
  inviteToken: { type: String, unique: true, sparse: true },
  rolePermissions: { type: Object, default: {} },
});

// 3. Model Placeholder (CRITICAL FIX: Prevents compiler crash)
// We export a placeholder value instead of the Mongoose Model to avoid crashing the compiler.
// The actual model creation is handled safely by the getModel utility in lib/models.ts.
export const Organisation = null;
