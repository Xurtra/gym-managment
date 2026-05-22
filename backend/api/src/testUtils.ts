import type { Services } from "./app.js";
import type { ApiConfig } from "./config/env.js";
import type { Clock } from "./shared/time.js";

export const testConfig: ApiConfig = {
  nodeEnv: "test",
  persistenceDriver: "memory",
  host: "127.0.0.1",
  port: 0,
  accessTokenSecret: "test-secret",
  accessTokenTtlSeconds: 900,
  refreshTokenTtlDays: 30,
  passwordResetTokenTtlMinutes: 30,
  emailVerificationTokenTtlHours: 24
};

export const fixedClock: Clock = {
  now: () => new Date("2026-05-16T12:00:00.000Z")
};

export async function createGym(services: Services): Promise<string> {
  const owner = await services.authService.register({
    email: "owner@example.com",
    password: "Password123",
    firstName: "Demo",
    lastName: "Owner",
    gymName: "Demo Strength Club",
    timezone: "America/New_York",
    locale: "en-US"
  });
  if (!owner.gym) {
    throw new Error("Expected gym to be created during test setup.");
  }
  return owner.gym.id;
}
