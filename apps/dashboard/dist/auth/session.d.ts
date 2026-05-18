export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export interface StoredSession extends AuthTokens {
    userId?: string;
    gymId?: string;
}
export interface SessionStorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}
export declare const DASHBOARD_SESSION_KEY = "gym.dashboard.session";
export declare function saveSession(storage: SessionStorageLike, session: StoredSession): void;
export declare function loadSession(storage: SessionStorageLike): StoredSession | undefined;
export declare function clearSession(storage: SessionStorageLike): void;
export declare function applyTokenRefresh(storage: SessionStorageLike, current: StoredSession, next: AuthTokens): StoredSession;
export declare function forceLogout(storage: SessionStorageLike): {
    redirectTo: string;
    reason: string;
};
//# sourceMappingURL=session.d.ts.map