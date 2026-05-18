export const DASHBOARD_SESSION_KEY = "gym.dashboard.session";
export function saveSession(storage, session) {
    storage.setItem(DASHBOARD_SESSION_KEY, JSON.stringify(session));
}
export function loadSession(storage) {
    const raw = storage.getItem(DASHBOARD_SESSION_KEY);
    if (!raw) {
        return undefined;
    }
    try {
        const parsed = JSON.parse(raw);
        if (!parsed.accessToken || !parsed.refreshToken) {
            return undefined;
        }
        return {
            accessToken: parsed.accessToken,
            refreshToken: parsed.refreshToken,
            ...(parsed.userId ? { userId: parsed.userId } : {}),
            ...(parsed.gymId ? { gymId: parsed.gymId } : {})
        };
    }
    catch {
        return undefined;
    }
}
export function clearSession(storage) {
    storage.removeItem(DASHBOARD_SESSION_KEY);
}
export function applyTokenRefresh(storage, current, next) {
    const updated = {
        ...current,
        accessToken: next.accessToken,
        refreshToken: next.refreshToken
    };
    saveSession(storage, updated);
    return updated;
}
export function forceLogout(storage) {
    clearSession(storage);
    return { redirectTo: "/login", reason: "refresh_token_expired" };
}
//# sourceMappingURL=session.js.map