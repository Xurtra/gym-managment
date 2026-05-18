export interface AccessTokenPayload {
    sub: string;
    gymId?: string;
    email: string;
    exp: number;
    iat: number;
}
export declare function generateOpaqueToken(bytes?: number): string;
export declare function hashToken(token: string): string;
export declare function signAccessToken(payload: Omit<AccessTokenPayload, "exp" | "iat">, secret: string, ttlSeconds: number, now?: Date): string;
export declare function verifyAccessToken(token: string, secret: string, now?: Date): AccessTokenPayload | undefined;
//# sourceMappingURL=tokens.d.ts.map