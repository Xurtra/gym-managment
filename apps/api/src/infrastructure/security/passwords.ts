import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt$${salt}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, hash: string) {
  const [scheme, salt, storedHash] = hash.split("$");
  if (scheme !== "scrypt" || !salt || !storedHash) {
    return false;
  }
  const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  const stored = Buffer.from(storedHash, "base64url");
  if (stored.length !== derived.length) {
    return false;
  }
  return timingSafeEqual(new Uint8Array(stored), new Uint8Array(derived));
}
