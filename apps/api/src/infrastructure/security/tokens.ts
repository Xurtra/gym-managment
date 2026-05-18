import { createHmac, createHash, randomBytes, timingSafeEqual } from "node:crypto";

export interface AccessTokenPayload {
  sub: string;
  gymId?: string;
  email: string;
  exp: number;
  iat: number;
}

function base64UrlJson(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function sign(input: string, secret: string) {
  return createHmac("sha256", secret).update(input).digest("base64url");
}

export function generateOpaqueToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("base64url");
}

export function signAccessToken(
  payload: Omit<AccessTokenPayload, "exp" | "iat">,
  secret: string,
  ttlSeconds: number,
  now = new Date()
) {
  const iat = Math.floor(now.getTime() / 1000);
  const tokenPayload: AccessTokenPayload = { ...payload, iat, exp: iat + ttlSeconds };
  const header = base64UrlJson({ alg: "HS256", typ: "JWT" });
  const body = base64UrlJson(tokenPayload);
  const signature = sign(`${header}.${body}`, secret);
  return `${header}.${body}.${signature}`;
}

export function verifyAccessToken(token: string, secret: string, now = new Date()) {
  const [header, body, signature] = token.split(".");
  if (!header || !body || !signature) {
    return undefined;
  }
  const expected = sign(`${header}.${body}`, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(new Uint8Array(actualBuffer), new Uint8Array(expectedBuffer))
  ) {
    return undefined;
  }
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AccessTokenPayload;
  if (!payload.sub || !payload.email || payload.exp <= Math.floor(now.getTime() / 1000)) {
    return undefined;
  }
  return payload;
}
