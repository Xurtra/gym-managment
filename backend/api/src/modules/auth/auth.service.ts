import { StaffInviteStatus, UserStatus } from "@gym-platform/constants";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  StaffInviteAcceptInput,
  TwoFactorVerifyInput,
  VerifyEmailInput
} from "@gym-platform/validation";
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { badRequest, conflict, unauthorized } from "../../http/errors.js";
import { hashPassword, verifyPassword } from "../../infrastructure/security/passwords.js";
import {
  generateOpaqueToken,
  hashToken,
  signAccessToken
} from "../../infrastructure/security/tokens.js";
import type { RefreshToken, StaffInvite, User } from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import { addDays, addHours, addMinutes, type Clock } from "../../shared/time.js";
import { reconcileStaffResourceForMembership } from "../reservations/staffResourceLinking.js";
import { TenancyService } from "../tenancy/tenancy.service.js";

export interface AuthServiceOptions {
  accessTokenSecret: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlDays: number;
  passwordResetTokenTtlMinutes: number;
  emailVerificationTokenTtlHours: number;
}

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  emailVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  twoFactorEnabled: boolean;
}

export class AuthService {
  constructor(
    private readonly repositories: Repositories,
    private readonly tenancyService: TenancyService,
    private readonly clock: Clock,
    private readonly options: AuthServiceOptions
  ) {}

  async register(input: RegisterInput) {
    return this.repositories.transaction(async (repositories) => {
      if (await repositories.users.findUserByEmail(input.email)) {
        throw conflict("An account already exists for this email.", "email_exists");
      }
      const tenancyService = new TenancyService(repositories, this.clock);
      const now = this.clock.now();
      const user: User = {
        id: randomUUID(),
        email: input.email,
        passwordHash: await hashPassword(input.password),
        firstName: input.firstName,
        lastName: input.lastName,
        status: UserStatus.Active,
        recoveryCodeHashes: [],
        createdAt: now,
        updatedAt: now
      };
      await repositories.users.createUser(user);

      const gym = input.gymName
        ? await tenancyService.createGym(user.id, {
            name: input.gymName,
            timezone: input.timezone,
            locale: input.locale,
            featureFlags: []
          })
        : undefined;
      const emailVerificationToken = await this.createPurposeToken(
        user.id,
        "email_verification",
        addHours(now, this.options.emailVerificationTokenTtlHours),
        repositories
      );
      const session = await this.createSession(user, gym?.id, repositories);
      return {
        user: toPublicUser(user),
        gym,
        ...session,
        emailVerificationToken
      };
    });
  }

  async login(input: LoginInput) {
    const user = await this.repositories.users.findUserByEmail(input.email);
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw unauthorized("Invalid email or password.");
    }
    if (user.status !== UserStatus.Active) {
      throw unauthorized("This account is not active.");
    }
    const gymId = (await this.repositories.gymUsers.listGymMemberships(user.id))[0]?.gymId;
    if (user.twoFactorEnabledAt) {
      if (input.recoveryCode) {
        await this.consumeRecoveryCode(user, input.recoveryCode);
      } else if (!input.twoFactorCode || !verifyTotpCode(user.twoFactorSecret ?? "", input.twoFactorCode, this.clock.now())) {
        return { user: toPublicUser(user), twoFactorRequired: true };
      }
    }
    return {
      user: toPublicUser(user),
      ...(await this.createSession(user, gymId))
    };
  }

  async refresh(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    const existing = await this.repositories.tokens.findRefreshTokenByHash(tokenHash);
    const now = this.clock.now();
    if (!existing || existing.revokedAt || existing.expiresAt <= now) {
      throw unauthorized("Refresh token is invalid or expired.");
    }
    const user = await this.repositories.users.getUser(existing.userId);
    if (!user || user.status !== UserStatus.Active) {
      throw unauthorized("Refresh token user is no longer active.");
    }
    const rotated = await this.createRefreshToken(user.id, existing.gymId);
    await this.repositories.tokens.updateRefreshToken({
      ...existing,
      revokedAt: now,
      replacedByTokenId: rotated.record.id
    });
    return {
      user: toPublicUser(user),
      accessToken: this.createAccessToken(user, existing.gymId),
      refreshToken: rotated.token,
      refreshTokenExpiresAt: rotated.record.expiresAt.toISOString()
    };
  }

  async logout(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    const existing = await this.repositories.tokens.findRefreshTokenByHash(tokenHash);
    if (existing && !existing.revokedAt) {
      await this.repositories.tokens.updateRefreshToken({ ...existing, revokedAt: this.clock.now() });
    }
    return { ok: true };
  }

  async forgotPassword(input: ForgotPasswordInput) {
    const user = await this.repositories.users.findUserByEmail(input.email);
    if (!user) {
      return { ok: true };
    }
    const token = await this.createPurposeToken(
      user.id,
      "password_reset",
      addMinutes(this.clock.now(), this.options.passwordResetTokenTtlMinutes)
    );
    return { ok: true, resetToken: token };
  }

  async resetPassword(input: ResetPasswordInput) {
    const purposeToken = await this.consumePurposeToken(input.token, "password_reset");
    const user = await this.repositories.users.getUser(purposeToken.userId);
    if (!user) {
      throw badRequest("Password reset token is invalid.", "invalid_password_reset_token");
    }
    await this.repositories.users.updateUser({
      ...user,
      passwordHash: await hashPassword(input.password),
      updatedAt: this.clock.now()
    });
    for (const refreshToken of await this.repositories.tokens.listRefreshTokensForUser(user.id)) {
      if (refreshToken.userId === user.id && !refreshToken.revokedAt) {
        await this.repositories.tokens.updateRefreshToken({
          ...refreshToken,
          revokedAt: this.clock.now()
        });
      }
    }
    return { ok: true };
  }

  async verifyEmail(input: VerifyEmailInput) {
    const purposeToken = await this.consumePurposeToken(input.token, "email_verification");
    const user = await this.repositories.users.getUser(purposeToken.userId);
    if (!user) {
      throw badRequest("Email verification token is invalid.", "invalid_email_verification_token");
    }
    const verified = {
      ...user,
      emailVerifiedAt: this.clock.now(),
      updatedAt: this.clock.now()
    };
    await this.repositories.users.updateUser(verified);
    return { user: toPublicUser(verified) };
  }

  async resendVerification(email: string) {
    const user = await this.repositories.users.findUserByEmail(email);
    if (!user || user.emailVerifiedAt) {
      return { ok: true };
    }
    const token = await this.createPurposeToken(
      user.id,
      "email_verification",
      addHours(this.clock.now(), this.options.emailVerificationTokenTtlHours)
    );
    return { ok: true, emailVerificationToken: token };
  }

  async acceptStaffInvite(input: StaffInviteAcceptInput) {
    return this.repositories.transaction(async (repositories) => {
      const now = this.clock.now();
      const invite = await repositories.staffInvites.findStaffInviteByTokenHash(hashToken(input.token));
      if (!invite) {
        throw badRequest("Staff invite token is invalid or expired.", "invalid_staff_invite");
      }
      if (invite.status !== StaffInviteStatus.Pending) {
        throw badRequest("Staff invite is no longer pending.", "staff_invite_not_pending");
      }
      if (invite.expiresAt <= now) {
        await repositories.staffInvites.updateStaffInvite({
          ...invite,
          status: StaffInviteStatus.Expired,
          updatedAt: now
        });
        throw badRequest("Staff invite token is invalid or expired.", "invalid_staff_invite");
      }
      const gym = await repositories.gyms.getGym(invite.gymId);
      const role = await repositories.roles.getRole(invite.roleId);
      if (!gym || !role || role.gymId !== invite.gymId) {
        throw badRequest("Staff invite is misconfigured.", "invalid_staff_invite");
      }

      const existingUser = await repositories.users.findUserByEmail(invite.email);
      const user =
        existingUser ??
        (await repositories.users.createUser({
          id: randomUUID(),
          email: invite.email,
          passwordHash: await hashPassword(input.password),
          firstName: input.firstName,
          lastName: input.lastName,
          status: UserStatus.Active,
          recoveryCodeHashes: [],
          createdAt: now,
          updatedAt: now
        }));

      if (existingUser) {
        if (!(await verifyPassword(input.password, existingUser.passwordHash))) {
          throw unauthorized("Invalid email or password.");
        }
        if (existingUser.status !== UserStatus.Active) {
          throw unauthorized("This account is not active.");
        }
      }

      if (await repositories.gymUsers.findGymUser(invite.gymId, user.id)) {
        throw conflict("This user already has access to the gym.", "staff_access_exists");
      }

      const membership = await repositories.gymUsers.createGymUser({
        id: randomUUID(),
        gymId: invite.gymId,
        userId: user.id,
        roleId: invite.roleId,
        status: UserStatus.Active,
        createdAt: now,
        updatedAt: now
      });
      await reconcileStaffResourceForMembership(repositories, this.clock, invite.gymId, user.id);
      const acceptedInvite = await repositories.staffInvites.updateStaffInvite({
        ...invite,
        status: StaffInviteStatus.Accepted,
        acceptedAt: now,
        updatedAt: now
      });

      return {
        user: toPublicUser(user),
        gym,
        membership,
        invite: publicInvite(acceptedInvite),
        ...(await this.createSession(user, invite.gymId, repositories))
      };
    });
  }

  async setupTwoFactor(userId: string) {
    const user = await this.getActiveUser(userId);
    const secret = generateBase32Secret();
    const updated = {
      ...user,
      twoFactorSecret: secret,
      updatedAt: this.clock.now()
    };
    await this.repositories.users.updateUser(updated);
    return {
      secret,
      otpauthUrl: `otpauth://totp/GymPlatform:${encodeURIComponent(user.email)}?secret=${secret}&issuer=GymPlatform`
    };
  }

  async verifyTwoFactorSetup(userId: string, input: TwoFactorVerifyInput) {
    const user = await this.getActiveUser(userId);
    if (!user.twoFactorSecret || !verifyTotpCode(user.twoFactorSecret, input.code, this.clock.now())) {
      throw unauthorized("Two-factor verification code is invalid.");
    }
    const recoveryCodes = generateRecoveryCodes();
    await this.repositories.users.updateUser({
      ...user,
      twoFactorEnabledAt: this.clock.now(),
      recoveryCodeHashes: await hashRecoveryCodes(recoveryCodes),
      updatedAt: this.clock.now()
    });
    return { enabled: true, recoveryCodes };
  }

  async regenerateRecoveryCodes(userId: string) {
    const user = await this.getActiveUser(userId);
    if (!user.twoFactorEnabledAt) {
      throw badRequest("Two-factor authentication is not enabled.", "two_factor_not_enabled");
    }
    const recoveryCodes = generateRecoveryCodes();
    await this.repositories.users.updateUser({
      ...user,
      recoveryCodeHashes: await hashRecoveryCodes(recoveryCodes),
      updatedAt: this.clock.now()
    });
    return { recoveryCodes };
  }

  async currentUser(userId: string, gymId?: string) {
    const user = await this.repositories.users.getUser(userId);
    if (!user) {
      throw unauthorized();
    }
    const memberships = await Promise.all(
      (await this.repositories.gymUsers.listGymMemberships(user.id)).map(async (membership) => {
        const gym = await this.repositories.gyms.getGym(membership.gymId);
        const role = await this.repositories.roles.getRole(membership.roleId);
        return {
          id: membership.id,
          gym,
          role,
          status: membership.status
        };
      })
    );
    const activeGym = gymId ? (await this.tenancyService.resolveGymForUser(userId, gymId)).gym : undefined;
    return {
      user: toPublicUser(user),
      activeGym,
      memberships
    };
  }

  private async createSession(user: User, gymId?: string, repositories = this.repositories) {
    const refreshToken = await this.createRefreshToken(user.id, gymId, repositories);
    return {
      accessToken: this.createAccessToken(user, gymId),
      refreshToken: refreshToken.token,
      refreshTokenExpiresAt: refreshToken.record.expiresAt.toISOString()
    };
  }

  private createAccessToken(user: User, gymId?: string) {
    const payload: { sub: string; email: string; gymId?: string } = {
      sub: user.id,
      email: user.email
    };
    if (gymId) {
      payload.gymId = gymId;
    }
    return signAccessToken(
      payload,
      this.options.accessTokenSecret,
      this.options.accessTokenTtlSeconds,
      this.clock.now()
    );
  }

  private async createRefreshToken(userId: string, gymId?: string, repositories = this.repositories) {
    const token = generateOpaqueToken();
    const now = this.clock.now();
    const record: RefreshToken = {
      id: randomUUID(),
      userId,
      tokenHash: hashToken(token),
      expiresAt: addDays(now, this.options.refreshTokenTtlDays),
      createdAt: now
    };
    if (gymId) {
      record.gymId = gymId;
    }
    await repositories.tokens.createRefreshToken(record);
    return { token, record };
  }

  private async createPurposeToken(
    userId: string,
    purpose: "password_reset" | "email_verification",
    expiresAt: Date,
    repositories = this.repositories
  ) {
    const token = generateOpaqueToken();
    const now = this.clock.now();
    const id = randomUUID();
    await repositories.tokens.createPurposeToken({
      id,
      userId,
      purpose,
      tokenHash: hashToken(token),
      expiresAt,
      createdAt: now
    });
    return token;
  }

  private async consumePurposeToken(token: string, purpose: "password_reset" | "email_verification") {
    const tokenHash = hashToken(token);
    const existing = await this.repositories.tokens.findPurposeTokenByHash(tokenHash, purpose);
    if (!existing || existing.usedAt || existing.expiresAt <= this.clock.now()) {
      throw badRequest("Token is invalid or expired.", "invalid_token");
    }
    const consumed = { ...existing, usedAt: this.clock.now() };
    await this.repositories.tokens.updatePurposeToken(consumed);
    return consumed;
  }

  private async getActiveUser(userId: string) {
    const user = await this.repositories.users.getUser(userId);
    if (!user || user.status !== UserStatus.Active) {
      throw unauthorized();
    }
    return user;
  }

  private async consumeRecoveryCode(user: User, recoveryCode: string) {
    for (const [index, hash] of user.recoveryCodeHashes.entries()) {
      if (await verifyPassword(recoveryCode, hash)) {
        await this.repositories.users.updateUser({
          ...user,
          recoveryCodeHashes: user.recoveryCodeHashes.filter((_, candidateIndex) => candidateIndex !== index),
          updatedAt: this.clock.now()
        });
        return;
      }
    }
    throw unauthorized("Recovery code is invalid.");
  }
}

export function toPublicUser(user: User): PublicUser {
  const publicUser: PublicUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    status: user.status,
    twoFactorEnabled: Boolean(user.twoFactorEnabledAt),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
  if (user.emailVerifiedAt) {
    publicUser.emailVerifiedAt = user.emailVerifiedAt.toISOString();
  }
  return publicUser;
}

function publicInvite(invite: StaffInvite) {
  return {
    id: invite.id,
    gymId: invite.gymId,
    email: invite.email,
    roleId: invite.roleId,
    invitedByUserId: invite.invitedByUserId,
    status: invite.status,
    expiresAt: invite.expiresAt.toISOString(),
    ...(invite.acceptedAt ? { acceptedAt: invite.acceptedAt.toISOString() } : {}),
    ...(invite.revokedAt ? { revokedAt: invite.revokedAt.toISOString() } : {}),
    createdAt: invite.createdAt.toISOString(),
    updatedAt: invite.updatedAt.toISOString()
  };
}

const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function generateBase32Secret() {
  const bytes = randomBytes(20);
  let output = "";
  let bits = 0;
  let value = 0;
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += base32Alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += base32Alphabet[(value << (5 - bits)) & 31];
  }
  return output;
}

export function generateTotpCode(secret: string, now: Date, stepSeconds = 30) {
  const counter = Math.floor(now.getTime() / 1000 / stepSeconds);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", decodeBase32(secret)).update(new Uint8Array(buffer)).digest();
  const offset = digest[digest.length - 1]! & 0xf;
  const code =
    (((digest[offset]! & 0x7f) << 24) |
      ((digest[offset + 1]! & 0xff) << 16) |
      ((digest[offset + 2]! & 0xff) << 8) |
      (digest[offset + 3]! & 0xff)) %
    1_000_000;
  return code.toString().padStart(6, "0");
}

function verifyTotpCode(secret: string, code: string, now: Date) {
  if (!secret) {
    return false;
  }
  const provided = new Uint8Array(Buffer.from(code));
  for (const offset of [-1, 0, 1]) {
    const expected = new Uint8Array(
      Buffer.from(generateTotpCode(secret, new Date(now.getTime() + offset * 30_000)))
    );
    if (provided.length === expected.length && timingSafeEqual(provided, expected)) {
      return true;
    }
  }
  return false;
}

function decodeBase32(secret: string) {
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of secret.replaceAll("=", "").toUpperCase()) {
    const index = base32Alphabet.indexOf(char);
    if (index < 0) {
      continue;
    }
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

function generateRecoveryCodes() {
  return Array.from({ length: 8 }, () => {
    const value = randomBytes(5).toString("hex").toUpperCase();
    return `${value.slice(0, 5)}-${value.slice(5)}`;
  });
}

async function hashRecoveryCodes(codes: string[]) {
  return Promise.all(codes.map((code) => hashPassword(code)));
}
