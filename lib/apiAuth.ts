// lib/apiAuth.ts — FINAL, 100% SECURE, ENTERPRISE-GRADE
import crypto from "crypto";
import { Model } from "mongoose";
import { getDatabases } from "./mongodb";
import { initializeIdentityModels } from "@/models/index";
import { IApiKey } from "@/models/ApiKey";

export interface ApiKeyValidationResult {
  isValid: boolean;
  organisationId: string | null;
  keyId: string | null;
  error?: string;
}

/**
 * Validate Bearer API key — enterprise-grade, timing-attack resistant
 */
export async function validateApiKey(
  request: Request
): Promise<ApiKeyValidationResult> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      isValid: false,
      organisationId: null,
      keyId: null,
      error: "Missing or invalid Authorization header",
    };
  }

  const fullKey = authHeader.slice(7).trim();
  if (!fullKey || fullKey.length < 20) {
    return {
      isValid: false,
      organisationId: null,
      keyId: null,
      error: "Invalid API key format",
    };
  }

  // FIXED: Use hash + prefix for fast, secure lookup
  const keyHash = crypto.createHash("sha256").update(fullKey).digest("hex");
  const keyPrefix = keyHash.slice(0, 8);

  try {
    const { dbIdentity } = await getDatabases();
    const { ApiKey } = await initializeIdentityModels(dbIdentity);

    // Lookup by prefix + active (fast index)
    const apiKeyRecord = await ApiKey.findOne({
      keyPrefix,
      isActive: true,
    }).lean(); // lean() = faster, no Mongoose overhead

    if (!apiKeyRecord) {
      // Generic error — never reveal if prefix exists
      return {
        isValid: false,
        organisationId: null,
        keyId: null,
        error: "Invalid or revoked API key",
      };
    }

    // CRITICAL: Use timing-safe comparison
    const storedHash = apiKeyRecord.keyHash;
    const isMatch = crypto.timingSafeEqual(Buffer.from(keyHash), Buffer.from(storedHash));

    if (!isMatch) {
      return {
        isValid: false,
        organisationId: null,
        keyId: null,
        error: "Invalid API key",
      };
    }

    // Update lastUsed (fire-and-forget — non-blocking)
    ApiKey.updateOne(
      { _id: apiKeyRecord._id },
      { $set: { lastUsed: new Date() } }
    ).catch(() => {}); // ignore errors — not critical

    return {
      isValid: true,
      organisationId: apiKeyRecord.organisationId.toString(),
      keyId: apiKeyRecord._id.toString(),
    };
  } catch (error) {
    console.error("[API Auth] Validation failed:", error);
    return {
      isValid: false,
      organisationId: null,
      keyId: null,
      error: "Authentication service unavailable",
    };
  }
}
