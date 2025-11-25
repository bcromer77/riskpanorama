import mongoose, { Schema, Document, Types, Model } from 'mongoose';
import crypto from 'crypto';

export interface IApiKey extends Document {
  organisationId: Types.ObjectId;
  keyPrefix: string; // First 8 characters of the key (for display)
  keyHash: string; // Securely stored hash of the key
  name: string;
  permissions: string[]; // e.g., ["ingest", "search_vault", "run_agent"]
  createdAt: Date;
  lastUsed?: Date;
  isActive: boolean;
  
  // Instance methods for key verification
  compareKey: (key: string) => boolean;
}

export const ApiKeySchema: Schema = new Schema({
  organisationId: { 
    type: Schema.Types.ObjectId, 
    required: true, 
    ref: 'Organisation' 
  },
  keyPrefix: { type: String, required: true },
  keyHash: { type: String, required: true },
  name: { type: String, required: true },
  permissions: { type: [String], default: ["ingest", "search_vault"] },
  createdAt: { type: Date, default: Date.now },
  lastUsed: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
});

// Instance method to compare a plain-text key against the stored hash
ApiKeySchema.methods.compareKey = function (candidateKey: string): boolean {
    const hash = crypto.createHash('sha256').update(candidateKey).digest('hex');
    return hash === this.keyHash;
};

// We compile this model inside models/index.ts
export const ApiKeyModel = (mongoose.models.ApiKey as Model<IApiKey>) || mongoose.model<IApiKey>('ApiKey', ApiKeySchema);
