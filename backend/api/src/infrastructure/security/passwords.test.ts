import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./passwords.js";

describe("hashPassword / verifyPassword", () => {
  it("produces a verifiable scrypt hash with the expected format", async () => {
    const hash = await hashPassword("Password123");
    expect(hash).toMatch(/^scrypt\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/);
    expect(await verifyPassword("Password123", hash)).toBe(true);
  });

  it("rejects a wrong password against a valid hash", async () => {
    const hash = await hashPassword("CorrectPassword");
    expect(await verifyPassword("WrongPassword", hash)).toBe(false);
  });

  it("uses a different salt per hash (non-deterministic output)", async () => {
    const hash1 = await hashPassword("SamePassword");
    const hash2 = await hashPassword("SamePassword");
    expect(hash1).not.toBe(hash2);
    expect(await verifyPassword("SamePassword", hash1)).toBe(true);
    expect(await verifyPassword("SamePassword", hash2)).toBe(true);
  });

  it("returns false for a hash missing the scheme prefix", async () => {
    expect(await verifyPassword("Password123", "not-a-valid-hash")).toBe(false);
  });

  it("returns false for a hash with the wrong scheme", async () => {
    expect(await verifyPassword("Password123", "bcrypt$somesalt$somevalue")).toBe(false);
  });

  it("returns false for a hash missing the derived segment", async () => {
    expect(await verifyPassword("Password123", "scrypt$onlysalt")).toBe(false);
  });

  it("returns false for an empty string hash", async () => {
    expect(await verifyPassword("Password123", "")).toBe(false);
  });

  it("returns false for an empty password against a real hash", async () => {
    const hash = await hashPassword("NotEmpty");
    expect(await verifyPassword("", hash)).toBe(false);
  });

  it("returns false when a byte in the derived key is tampered", async () => {
    const hash = await hashPassword("Password123");
    const [, salt, derived] = hash.split("$");
    if (!salt || !derived || derived.length < 10) throw new Error("Unexpected hash format");
    // Flip a character near the start (not the last char, which may have padding-only bits)
    const idx = 4;
    const original = derived[idx]!;
    const flipped = original === "a" ? "b" : "a";
    const tampered = `scrypt$${salt}$${derived.slice(0, idx)}${flipped}${derived.slice(idx + 1)}`;
    expect(await verifyPassword("Password123", tampered)).toBe(false);
  });
});
