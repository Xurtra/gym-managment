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

export const DASHBOARD_SESSION_KEY = "gym.dashboard.session";

export function saveSession(storage: SessionStorageLike, session: StoredSession) {
  storage.setItem(DASHBOARD_SESSION_KEY, JSON.stringify(session));
}

export function loadSession(storage: SessionStorageLike): StoredSession | undefined {
  const raw = storage.getItem(DASHBOARD_SESSION_KEY);
  if (!raw) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (!parsed.accessToken || !parsed.refreshToken) {
      return undefined;
    }
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      ...(parsed.userId ? { userId: parsed.userId } : {}),
      ...(parsed.gymId ? { gymId: parsed.gymId } : {})
    };
  } catch {
    return undefined;
  }
}

export function clearSession(storage: SessionStorageLike) {
  storage.removeItem(DASHBOARD_SESSION_KEY);
}

export function applyTokenRefresh(
  storage: SessionStorageLike,
  current: StoredSession,
  next: AuthTokens
): StoredSession {
  const updated: StoredSession = {
    ...current,
    accessToken: next.accessToken,
    refreshToken: next.refreshToken
  };
  saveSession(storage, updated);
  return updated;
}

export function forceLogout(storage: SessionStorageLike) {
  clearSession(storage);
  return { redirectTo: "/login", reason: "refresh_token_expired" };
}
