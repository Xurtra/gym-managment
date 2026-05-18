import { createHmac, createHash, randomBytes, timingSafeEqual } from "node:crypto";
function base64UrlJson(value) {
    return Buffer.from(JSON.stringify(value)).toString("base64url");
}
function sign(input, secret) {
    return createHmac("sha256", secret).update(input).digest("base64url");
}
export function generateOpaqueToken(bytes = 32) {
    return randomBytes(bytes).toString("base64url");
}
export function hashToken(token) {
    return createHash("sha256").update(token).digest("base64url");
}
export function signAccessToken(payload, secret, ttlSeconds, now = new Date()) {
    const iat = Math.floor(now.getTime() / 1000);
    const tokenPayload = { ...payload, iat, exp: iat + ttlSeconds };
    const header = base64UrlJson({ alg: "HS256", typ: "JWT" });
    const body = base64UrlJson(tokenPayload);
    const signature = sign(`${header}.${body}`, secret);
    return `${header}.${body}.${signature}`;
}
export function verifyAccessToken(token, secret, now = new Date()) {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) {
        return undefined;
    }
    const expected = sign(`${header}.${body}`, secret);
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (actualBuffer.length !== expectedBuffer.length ||
        !timingSafeEqual(new Uint8Array(actualBuffer), new Uint8Array(expectedBuffer))) {
        return undefined;
    }
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload.sub || !payload.email || payload.exp <= Math.floor(now.getTime() / 1000)) {
        return undefined;
    }
    return payload;
}
//# sourceMappingURL=tokens.js.map