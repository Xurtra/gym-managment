import { describe, expect, it } from "vitest";
import {
  generateOpaqueToken,
  hashToken,
  signAccessToken,
  verifyAccessToken
} from "./tokens.js";

const secret = "test-secret-key-for-unit-tests";
const basePayload = { sub: "user-1", email: "owner@example.com" };
const now = new Date("2026-05-16T12:00:00.000Z");
const ttlSeconds = 900;

describe("signAccessToken / verifyAccessToken", () => {
  it("signs a token and verifies it within TTL", () => {
    const token = signAccessToken(basePayload, secret, ttlSeconds, now);
    const payload = verifyAccessToken(token, secret, now);

    expect(payload).not.toBeUndefined();
    expect(payload?.sub).toBe("user-1");
    expect(payload?.email).toBe("owner@example.com");
    expect(payload?.iat).toBe(Math.floor(now.getTime() / 1000));
    expect(payload?.exp).toBe(Math.floor(now.getTime() / 1000) + ttlSeconds);
  });

  it("includes an optional gymId in the payload", () => {
    const token = signAccessToken({ ...basePayload, gymId: "gym-1" }, secret, ttlSeconds, now);
    const payload = verifyAccessToken(token, secret, now);
    expect(payload?.gymId).toBe("gym-1");
  });

  it("produces a three-segment JWT string", () => {
    const token = signAccessToken(basePayload, secret, ttlSeconds, now);
    expect(token.split(".")).toHaveLength(3);
  });

  it("returns undefined for an expired token (one second past expiry)", () => {
    const token = signAccessToken(basePayload, secret, ttlSeconds, now);
    const expired = new Date(now.getTime() + (ttlSeconds + 1) * 1000);
    expect(verifyAccessToken(token, secret, expired)).toBeUndefined();
  });

  it("returns the payload one second before expiry", () => {
    const token = signAccessToken(basePayload, secret, ttlSeconds, now);
    const justBefore = new Date(now.getTime() + (ttlSeconds - 1) * 1000);
    expect(verifyAccessToken(token, secret, justBefore)).not.toBeUndefined();
  });

  it("returns undefined exactly at the expiry second", () => {
    const token = signAccessToken(basePayload, secret, ttlSeconds, now);
    const atExpiry = new Date(now.getTime() + ttlSeconds * 1000);
    expect(verifyAccessToken(token, secret, atExpiry)).toBeUndefined();
  });

  it("returns undefined when the signature is tampered", () => {
    const token = signAccessToken(basePayload, secret, ttlSeconds, now);
    const [header, body, sig] = token.split(".");
    const tampered = `${header}.${body}.${sig!.slice(0, -1)}x`;
    expect(verifyAccessToken(tampered, secret, now)).toBeUndefined();
  });

  it("returns undefined when signed with the wrong secret", () => {
    const token = signAccessToken(basePayload, secret, ttlSeconds, now);
    expect(verifyAccessToken(token, "wrong-secret", now)).toBeUndefined();
  });

  it("returns undefined for a token with only two segments", () => {
    expect(verifyAccessToken("only.twosegments", secret, now)).toBeUndefined();
  });

  it("returns undefined for an empty string", () => {
    expect(verifyAccessToken("", secret, now)).toBeUndefined();
  });

  it("returns undefined when the body segment is not valid base64url JSON", () => {
    const token = signAccessToken(basePayload, secret, ttlSeconds, now);
    const [header, , sig] = token.split(".");
    const garbled = `${header}.!!!notbase64!!!.${sig}`;
    expect(verifyAccessToken(garbled, secret, now)).toBeUndefined();
  });
});

describe("generateOpaqueToken", () => {
  it("generates a non-empty base64url string", () => {
    const token = generateOpaqueToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token.length).toBeGreaterThan(30);
  });

  it("generates unique tokens on each call", () => {
    const t1 = generateOpaqueToken();
    const t2 = generateOpaqueToken();
    expect(t1).not.toBe(t2);
  });

  it("respects a custom byte length", () => {
    const short = generateOpaqueToken(8);
    expect(short.length).toBeGreaterThanOrEqual(8);
    expect(short.length).toBeLessThan(15);
  });
});

describe("hashToken", () => {
  it("returns a deterministic SHA-256 base64url hash", () => {
    const h1 = hashToken("my-opaque-token");
    const h2 = hashToken("my-opaque-token");
    expect(h1).toBe(h2);
  });

  it("produces a different hash for a different input", () => {
    expect(hashToken("token-a")).not.toBe(hashToken("token-b"));
  });

  it("produces a non-empty base64url string", () => {
    expect(hashToken("any-value")).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
