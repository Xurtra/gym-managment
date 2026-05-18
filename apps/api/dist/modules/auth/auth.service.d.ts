import { StaffInviteStatus, UserStatus } from "@gym-platform/constants";
import type { ForgotPasswordInput, LoginInput, RegisterInput, ResetPasswordInput, StaffInviteAcceptInput, TwoFactorVerifyInput, VerifyEmailInput } from "@gym-platform/validation";
import type { User } from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import { type Clock } from "../../shared/time.js";
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
export declare class AuthService {
    private readonly repositories;
    private readonly tenancyService;
    private readonly clock;
    private readonly options;
    constructor(repositories: Repositories, tenancyService: TenancyService, clock: Clock, options: AuthServiceOptions);
    register(input: RegisterInput): Promise<{
        emailVerificationToken: string;
        accessToken: string;
        refreshToken: string;
        refreshTokenExpiresAt: string;
        user: PublicUser;
        gym: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            name: string;
            slug: string;
            ownerUserId: string;
            status: "active";
            timezone: string;
            locale: string;
            operatingHours: {};
            featureFlags: ("online_signup" | "class_booking" | "personal_training" | "member_portal" | "website_builder" | "point_of_sale" | "access_control")[];
            onboardingCompletedSteps: string[];
            createdAt: Date;
            updatedAt: Date;
        } | undefined;
    }>;
    login(input: LoginInput): Promise<{
        user: PublicUser;
        twoFactorRequired: boolean;
    } | {
        accessToken: string;
        refreshToken: string;
        refreshTokenExpiresAt: string;
        user: PublicUser;
        twoFactorRequired?: never;
    }>;
    refresh(refreshToken: string): Promise<{
        user: PublicUser;
        accessToken: string;
        refreshToken: string;
        refreshTokenExpiresAt: string;
    }>;
    logout(refreshToken: string): Promise<{
        ok: boolean;
    }>;
    forgotPassword(input: ForgotPasswordInput): Promise<{
        ok: boolean;
        resetToken?: never;
    } | {
        ok: boolean;
        resetToken: string;
    }>;
    resetPassword(input: ResetPasswordInput): Promise<{
        ok: boolean;
    }>;
    verifyEmail(input: VerifyEmailInput): Promise<{
        user: PublicUser;
    }>;
    resendVerification(email: string): Promise<{
        ok: boolean;
        emailVerificationToken?: never;
    } | {
        ok: boolean;
        emailVerificationToken: string;
    }>;
    acceptStaffInvite(input: StaffInviteAcceptInput): Promise<{
        accessToken: string;
        refreshToken: string;
        refreshTokenExpiresAt: string;
        user: PublicUser;
        gym: import("../../infrastructure/store/entities.js").Gym;
        membership: import("../../infrastructure/store/entities.js").GymUser;
        invite: {
            createdAt: string;
            updatedAt: string;
            revokedAt?: string;
            acceptedAt?: string;
            id: string;
            gymId: string;
            email: string;
            roleId: string;
            invitedByUserId: string;
            status: StaffInviteStatus;
            expiresAt: string;
        };
    }>;
    setupTwoFactor(userId: string): Promise<{
        secret: string;
        otpauthUrl: string;
    }>;
    verifyTwoFactorSetup(userId: string, input: TwoFactorVerifyInput): Promise<{
        enabled: boolean;
        recoveryCodes: string[];
    }>;
    regenerateRecoveryCodes(userId: string): Promise<{
        recoveryCodes: string[];
    }>;
    currentUser(userId: string, gymId?: string): Promise<{
        user: PublicUser;
        activeGym: import("../../infrastructure/store/entities.js").Gym | undefined;
        memberships: {
            id: string;
            gym: import("../../infrastructure/store/entities.js").Gym | undefined;
            role: import("../../infrastructure/store/entities.js").Role | undefined;
            status: UserStatus;
        }[];
    }>;
    private createSession;
    private createAccessToken;
    private createRefreshToken;
    private createPurposeToken;
    private consumePurposeToken;
    private getActiveUser;
    private consumeRecoveryCode;
}
export declare function toPublicUser(user: User): PublicUser;
export declare function generateTotpCode(secret: string, now: Date, stepSeconds?: number): string;
//# sourceMappingURL=auth.service.d.ts.map