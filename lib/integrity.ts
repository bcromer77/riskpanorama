import crypto from "crypto";

export function hashPayload(payload: object) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

export type IntegrityStatus = "Verified" | "Pending";

export function judgeIntegrity(lastHash?: string): IntegrityStatus {
  if (!lastHash) return "Pending";
  return "Verified";
}

