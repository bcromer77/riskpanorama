// lib/models.ts
import mongoose from 'mongoose';

const modelPaths = {
  // CRITICAL FIX: Changed paths from alias (@/) to relative paths (../models/)
  // This is much safer for dynamic imports in the Next.js server environment.
  User: '../models/User',
  Organisation: '../models/Organisation',
  ApiKey: '../models/ApiKey',
};

/**
 * Safely imports and returns a Mongoose model from the global registry.
 * It forces registration if the model doesn't exist, preventing redefinition errors.
 */
export async function getModel(modelName: keyof typeof modelPaths) {
  // 1. Check if the model is already defined globally by Mongoose
  // This is the safety check against model redefinition errors.
  if (mongoose.models[modelName]) {
    return mongoose.models[modelName];
  }

  // 2. Dynamically import the model file
  // The path is resolved relative to the lib/models.ts file.
  const modelModule = await import(modelPaths[modelName]);

  // 3. Return the Mongoose model class
  // We rely on the model file exporting the model instance (e.g., export const User = null;)
  return modelModule[modelName];
}
