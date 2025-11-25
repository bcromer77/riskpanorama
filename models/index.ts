// models/index.ts

import { Db } from 'mongodb';
import { Model, Connection } from 'mongoose';
import { IUser, UserSchema } from './User';
import { IOrganisation, OrganisationSchema } from './Organisation';

// Define the interface for our exported models
interface IdentityModels {
  User: Model<IUser>;
  Organisation: Model<IOrganisation>;
}

// Cache to prevent model re-compilation in development
let modelsCache: { [key: string]: Model<any> } = {};

// Function to initialize Mongoose models against the native DB connection
export async function initializeIdentityModels(nativeDb: Db): Promise<IdentityModels> {
  const dbName = nativeDb.databaseName;

  // Use the native Db object to create a Mongoose connection proxy
  // This ensures models attach to the correct database (e.g., 'veracity101')
  const mongooseDbProxy = nativeDb as unknown as Connection; 

  const getModel = <T extends Document>(name: string, schema: Schema): Model<T> => {
    // Check if the model is already compiled for this connection
    if (modelsCache[name]) {
      return modelsCache[name] as Model<T>;
    }
    
    // Compile and cache the model
    const compiledModel = mongooseDbProxy.model<T>(name, schema);
    modelsCache[name] = compiledModel;
    return compiledModel;
  };

  const User = getModel<IUser>('User', UserSchema);
  const Organisation = getModel<IOrganisation>('Organisation', OrganisationSchema);

  return { User, Organisation } as IdentityModels;
}
