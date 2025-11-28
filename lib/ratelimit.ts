// lib/ratelimit.ts
// Simple, fast, in-memory rate limiter (perfect for dev + early production)
// Upgrades to Upstash/Redis later with zero code change

type RateLimitConfig = {
  tokensPerInterval: number;
  interval: number; // ms
};

const store = new Map<string, { tokens: number; lastRefill: number }>();

export function ratelimit(tokens: number, interval: string) {
  const intervalMs = parseInterval(interval);

  return {
    async limit(key: string): Promise<{ success: boolean; remaining: number }> {
      const now = Date.now();
      const entry = store.get(key) || { tokens, lastRefill: now };

      // Refill tokens based on elapsed time
      const elapsed = now - entry.lastRefill;
      const tokensToAdd = Math.floor(elapsed / intervalMs) * tokens;
      const newTokens = Math.min(tokens, entry.tokens + tokensToAdd);

      const updatedEntry = {
        tokens: newTokens,
        lastRefill: entry.lastRefill + tokensToAdd * intervalMs,
      };

      if (updatedEntry.tokens <= 0) {
        store.set(key, { tokens: 0, lastRefill: now });
        return { success: false, remaining: 0 };
      }

      updatedEntry.tokens -= 1;
      store.set(key, updatedEntry);

      return { success: true, remaining: updatedEntry.tokens };
    },
  };
}

// Helper to parse "30 s", "1 m", "5 m" etc.
function parseInterval(interval: string): number {
  const match = interval.match(/^(\d+)\s*([smhd]?)$/);
  if (!match) throw new Error("Invalid interval format");

  const value = parseInt(match[1]);
  const unit = match[2] || "s";

  switch (unit) {
    case "s": return value * 1000;
    case "m": return value * 60 * 1000;
    case "h": return value * 60 * 60 * 1000;
    case "d": return value * 24 * 60 * 60 * 1000;
    default: return value * 1000;
  }
}
