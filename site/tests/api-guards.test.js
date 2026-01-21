import { describe, expect, it } from "vitest";
import { checkRateLimit, getClientIp } from "../src/lib/api-guards.ts";

describe("api guards", () => {
  it("enforces a simple rate limit", () => {
    const key = `test-${Date.now()}-${Math.random()}`;
    const config = { limit: 2, windowMs: 1000 };

    expect(checkRateLimit(key, config).allowed).toBe(true);
    expect(checkRateLimit(key, config).allowed).toBe(true);

    const blocked = checkRateLimit(key, config);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("resolves client ip from headers", () => {
    const headers = new Map([
      ["x-forwarded-for", "203.0.113.1, 70.41.3.18"],
      ["x-real-ip", "203.0.113.2"]
    ]);
    const request = {
      headers: {
        get: (name) => headers.get(String(name).toLowerCase()) || null
      }
    };

    expect(getClientIp(request)).toBe("203.0.113.1");
  });
});
