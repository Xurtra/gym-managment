import { GymStatus, MemberStatus } from "@gym-platform/constants";
import type {
  MemberPortalAccountInput,
  MemberPortalLoginInput,
  MemberPortalTokenAcceptInput
} from "@gym-platform/validation";
import { randomUUID } from "node:crypto";
import { badRequest, notFound, unauthorized } from "../../http/errors.js";
import { hashPassword, verifyPassword } from "../../infrastructure/security/passwords.js";
import {
  generateOpaqueToken,
  hashToken,
  signAccessToken
} from "../../infrastructure/security/tokens.js";
import type { Member, MemberRefreshToken } from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import { addDays, type Clock } from "../../shared/time.js";

export interface MemberPortalServiceOptions {
  accessTokenSecret: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlDays: number;
}

export class MemberPortalService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock,
    private readonly options: MemberPortalServiceOptions
  ) {}

  async enablePortalAccount(gymId: string, memberId: string, input: MemberPortalAccountInput) {
    const member = await this.getScopedMember(gymId, memberId);
    if (!member.email) {
      throw badRequest("Member needs an email before portal access can be enabled.", "member_email_required");
    }
    const now = this.clock.now();
    const updated = await this.repositories.members.updateMember({
      ...member,
      portalPasswordHash: await hashPassword(input.password),
      portalEnabledAt: member.portalEnabledAt ?? now,
      updatedAt: now
    });
    return { member: toPublicMember(updated), portalEnabled: true };
  }

  async createPortalInvite(gymId: string, memberId: string, baseUrl = "http://localhost:5173") {
    const member = await this.getScopedMember(gymId, memberId);
    if (!member.email) {
      throw badRequest("Member needs an email before portal access can be enabled.", "member_email_required");
    }
    const rawToken = generateOpaqueToken();
    const now = this.clock.now();
    const purpose = member.portalEnabledAt ? "reset" : "setup";
    await this.repositories.tokens.createMemberPortalToken({
      id: randomUUID(),
      gymId,
      memberId,
      tokenHash: hashToken(rawToken),
      purpose,
      expiresAt: addDays(now, 7),
      createdAt: now
    });
    const setupUrl = `${baseUrl.replace(/\/$/, "")}/#/member-portal/setup?token=${encodeURIComponent(rawToken)}`;
    return {
      token: rawToken,
      setupUrl,
      purpose,
      expiresAt: addDays(now, 7).toISOString(),
      member: toPublicMember(member)
    };
  }

  async acceptPortalToken(input: MemberPortalTokenAcceptInput) {
    const tokenHash = hashToken(input.token);
    const existing = await this.repositories.tokens.findMemberPortalTokenByHash(tokenHash);
    const now = this.clock.now();
    if (!existing || existing.usedAt || existing.expiresAt <= now) {
      throw badRequest("Member portal setup token is invalid or expired.", "invalid_member_portal_token");
    }
    const member = await this.getScopedMember(existing.gymId, existing.memberId);
    const updated = await this.repositories.members.updateMember({
      ...member,
      portalPasswordHash: await hashPassword(input.password),
      portalEnabledAt: member.portalEnabledAt ?? now,
      updatedAt: now
    });
    await this.repositories.tokens.updateMemberPortalToken({
      ...existing,
      usedAt: now
    });
    for (const refreshToken of await this.repositories.tokens.listRefreshTokensForMember(member.id)) {
      if (!refreshToken.revokedAt) {
        await this.repositories.tokens.updateMemberRefreshToken({
          ...refreshToken,
          revokedAt: now
        });
      }
    }
    return { member: toPublicMember(updated), portalEnabled: true };
  }

  async login(input: MemberPortalLoginInput) {
    const gym = await this.repositories.gyms.findGymBySlug(input.gymSlug);
    if (!gym || gym.status !== GymStatus.Active) {
      throw unauthorized("Invalid email or password.");
    }
    const member = await this.repositories.members.findMemberByGymAndEmail(gym.id, input.email);
    if (
      !member ||
      member.status === MemberStatus.Archived ||
      !member.portalPasswordHash ||
      !member.portalEnabledAt ||
      !(await verifyPassword(input.password, member.portalPasswordHash))
    ) {
      throw unauthorized("Invalid email or password.");
    }
    const updated = await this.repositories.members.updateMember({
      ...member,
      lastPortalLoginAt: this.clock.now(),
      updatedAt: this.clock.now()
    });
    return {
      gym: publicGym(gym),
      member: toPublicMember(updated),
      ...(await this.createSession(updated))
    };
  }

  async refresh(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    const existing = await this.repositories.tokens.findMemberRefreshTokenByHash(tokenHash);
    const now = this.clock.now();
    if (!existing || existing.revokedAt || existing.expiresAt <= now) {
      throw unauthorized("Refresh token is invalid or expired.");
    }
    const member = await this.repositories.members.getMember(existing.memberId);
    if (
      !member ||
      member.gymId !== existing.gymId ||
      member.status === MemberStatus.Archived ||
      !member.portalPasswordHash ||
      !member.portalEnabledAt
    ) {
      throw unauthorized("Refresh token member is no longer active.");
    }
    const rotated = await this.createRefreshToken(member);
    await this.repositories.tokens.updateMemberRefreshToken({
      ...existing,
      revokedAt: now,
      replacedByTokenId: rotated.record.id
    });
    return {
      member: toPublicMember(member),
      accessToken: this.createAccessToken(member),
      refreshToken: rotated.token,
      refreshTokenExpiresAt: rotated.record.expiresAt.toISOString()
    };
  }

  async logout(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    const existing = await this.repositories.tokens.findMemberRefreshTokenByHash(tokenHash);
    if (existing && !existing.revokedAt) {
      await this.repositories.tokens.updateMemberRefreshToken({ ...existing, revokedAt: this.clock.now() });
    }
    return { ok: true };
  }

  async me(gymId: string, memberId: string) {
    const member = await this.getScopedMember(gymId, memberId);
    const gym = await this.repositories.gyms.getGym(gymId);
    if (!gym || gym.status !== GymStatus.Active) {
      throw notFound("Gym was not found.");
    }
    const memberships = await this.memberships(gymId, memberId);
    return {
      gym: publicGym(gym),
      member: toPublicMember(member),
      memberships: memberships.memberships
    };
  }

  async memberships(gymId: string, memberId: string) {
    await this.getScopedMember(gymId, memberId);
    const memberships = await Promise.all(
      (await this.repositories.memberMemberships.listMemberMembershipsForMember(memberId))
        .filter((membership) => membership.gymId === gymId)
        .map(async (membership) => ({
          ...membership,
          startsAt: membership.startsAt.toISOString(),
          ...(membership.endsAt ? { endsAt: membership.endsAt.toISOString() } : {}),
          ...(membership.cancelledAt ? { cancelledAt: membership.cancelledAt.toISOString() } : {}),
          createdAt: membership.createdAt.toISOString(),
          updatedAt: membership.updatedAt.toISOString(),
          plan: await this.repositories.membershipPlans.getMembershipPlan(membership.planId)
        }))
    );
    return { memberships };
  }

  async checkInCode(gymId: string, memberId: string) {
    const member = await this.getScopedMember(gymId, memberId);
    const code = {
      qrPayload: `gym:${gymId}:member:${memberId}`,
      barcodeFallback: memberId
    };
    return member.barcode ? { ...code, barcode: member.barcode } : code;
  }

  async checkIns(gymId: string, memberId: string) {
    await this.getScopedMember(gymId, memberId);
    return { checkIns: await this.repositories.checkIns.listCheckInsForMember(memberId) };
  }

  async getScopedMember(gymId: string, memberId: string) {
    const member = await this.repositories.members.getMember(memberId);
    if (!member || member.gymId !== gymId || member.status === MemberStatus.Archived) {
      throw unauthorized();
    }
    return member;
  }

  private async createSession(member: Member) {
    const refreshToken = await this.createRefreshToken(member);
    return {
      accessToken: this.createAccessToken(member),
      refreshToken: refreshToken.token,
      refreshTokenExpiresAt: refreshToken.record.expiresAt.toISOString()
    };
  }

  private createAccessToken(member: Member) {
    return signAccessToken(
      {
        sub: member.id,
        gymId: member.gymId,
        email: member.email ?? `${member.id}@member.local`
      },
      this.options.accessTokenSecret,
      this.options.accessTokenTtlSeconds,
      this.clock.now()
    );
  }

  private async createRefreshToken(member: Member) {
    const token = generateOpaqueToken();
    const now = this.clock.now();
    const record: MemberRefreshToken = {
      id: randomUUID(),
      gymId: member.gymId,
      memberId: member.id,
      tokenHash: hashToken(token),
      expiresAt: addDays(now, this.options.refreshTokenTtlDays),
      createdAt: now
    };
    await this.repositories.tokens.createMemberRefreshToken(record);
    return { token, record };
  }
}

export function toPublicMember(member: Member) {
  return {
    id: member.id,
    gymId: member.gymId,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    phone: member.phone,
    barcode: member.barcode,
    profileImageUrl: member.profileImageUrl,
    status: member.status,
    tagNames: member.tagNames,
    portalEnabled: Boolean(member.portalEnabledAt),
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString()
  };
}

function publicGym(gym: { id: string; name: string; slug: string; timezone: string; locale: string }) {
  return {
    id: gym.id,
    name: gym.name,
    slug: gym.slug,
    timezone: gym.timezone,
    locale: gym.locale
  };
}
