import {
  AccessDeviceType,
  BillingInterval,
  CheckInMethod,
  FeatureFlag,
  MemberStatus,
  MembershipStatus,
  Permission,
  RoleName
} from "@gym-platform/constants";
import { z } from "zod";

const trimmed = z.string().trim();
const id = z.string().uuid();

export const emailSchema = trimmed.email().transform((value) => value.toLowerCase());
export const passwordSchema = z
  .string()
  .min(8)
  .regex(/[A-Z]/, "Password must contain an uppercase letter.")
  .regex(/[a-z]/, "Password must contain a lowercase letter.")
  .regex(/[0-9]/, "Password must contain a number.");

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: trimmed.min(1).max(80),
  lastName: trimmed.min(1).max(80),
  gymName: trimmed.min(2).max(120).optional(),
  timezone: trimmed.min(1).max(80).default("America/New_York"),
  locale: trimmed.min(2).max(20).default("en-US")
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
  twoFactorCode: trimmed.regex(/^\d{6}$/).optional(),
  recoveryCode: trimmed.min(8).max(40).optional()
});

export const publicSignupSchema = z.object({
  planId: id,
  firstName: trimmed.min(1).max(80),
  lastName: trimmed.min(1).max(80),
  email: emailSchema,
  phone: trimmed.min(7).max(30).optional()
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(32)
});

export const logoutSchema = refreshTokenSchema;

export const forgotPasswordSchema = z.object({
  email: emailSchema
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: passwordSchema
});

export const verifyEmailSchema = z.object({
  token: z.string().min(32)
});

export const resendVerificationSchema = z.object({
  email: emailSchema
});

export const twoFactorVerifySchema = z.object({
  code: trimmed.regex(/^\d{6}$/)
});

export const gymCreateSchema = z.object({
  name: trimmed.min(2).max(120),
  slug: trimmed
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  timezone: trimmed.min(1).max(80).default("America/New_York"),
  locale: trimmed.min(2).max(20).default("en-US"),
  featureFlags: z.array(z.nativeEnum(FeatureFlag)).default([])
});

export const brandColorsSchema = z.object({
  primary: trimmed.regex(/^#[0-9A-Fa-f]{6}$/),
  secondary: trimmed.regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accent: trimmed.regex(/^#[0-9A-Fa-f]{6}$/).optional()
});

export const addressSchema = z.object({
  line1: trimmed.min(1).max(120),
  line2: trimmed.max(120).optional(),
  city: trimmed.min(1).max(80),
  region: trimmed.min(1).max(80),
  postalCode: trimmed.min(1).max(20),
  country: trimmed.length(2).transform((value) => value.toUpperCase())
});

export const operatingHoursSchema = z.record(
  z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
  z.array(
    z.object({
      opensAt: z.string().regex(/^\d{2}:\d{2}$/),
      closesAt: z.string().regex(/^\d{2}:\d{2}$/)
    })
  )
);

export const gymBusinessInfoSchema = z.object({
  legalName: trimmed.max(160).optional(),
  phone: trimmed.max(40).optional(),
  email: emailSchema.optional(),
  website: trimmed.url().optional(),
  taxId: trimmed.max(80).optional(),
  address: addressSchema.optional()
});

export const gymUpdateSchema = z
  .object({
    name: trimmed.min(2).max(120).optional(),
    timezone: trimmed.min(1).max(80).optional(),
    locale: trimmed.min(2).max(20).optional(),
    logoUrl: trimmed.url().optional(),
    brandColors: brandColorsSchema.optional(),
    businessInfo: gymBusinessInfoSchema.optional(),
    operatingHours: operatingHoursSchema.optional(),
    featureFlags: z.array(z.nativeEnum(FeatureFlag)).optional(),
    onboardingCompletedSteps: z.array(trimmed.min(1).max(80)).optional()
  })
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");

export const locationCreateSchema = z.object({
  name: trimmed.min(1).max(120),
  address: addressSchema,
  timezone: trimmed.min(1).max(80),
  phone: trimmed.max(40).optional(),
  operatingHours: operatingHoursSchema.default({})
});

export const locationUpdateSchema = locationCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");

export const roleAssignmentSchema = z.object({
  userId: id,
  roleId: id
});

export const customRoleCreateSchema = z.object({
  name: trimmed
    .min(2)
    .max(80)
    .regex(/^[A-Za-z][A-Za-z0-9 '&-]*$/),
  permissions: z.array(z.nativeEnum(Permission)).min(1)
});

export const customRoleUpdateSchema = customRoleCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");

export const staffAccessRemoveSchema = z.object({
  reason: trimmed.max(500).optional()
});

export const staffInviteCreateSchema = z.object({
  email: emailSchema,
  roleId: id,
  message: trimmed.max(500).optional()
});

export const staffInviteAcceptSchema = z.object({
  token: z.string().min(32),
  firstName: trimmed.min(1).max(80),
  lastName: trimmed.min(1).max(80),
  password: passwordSchema
});

export const staffShiftCreateSchema = z
  .object({
    userId: id,
    locationId: id.optional(),
    roleId: id.optional(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    notes: trimmed.max(500).optional()
  })
  .refine((value) => new Date(value.endsAt) > new Date(value.startsAt), {
    message: "Shift end time must be after start time."
  });

export const memberCreateSchema = z.object({
  firstName: trimmed.min(1).max(80),
  lastName: trimmed.min(1).max(80),
  email: emailSchema.optional(),
  phone: trimmed.max(40).optional(),
  barcode: trimmed.max(80).optional(),
  status: z.nativeEnum(MemberStatus).default(MemberStatus.Active),
  emergencyContact: z
    .object({
      name: trimmed.min(1).max(120),
      phone: trimmed.min(1).max(40),
      relationship: trimmed.max(80).optional()
    })
    .optional(),
  notes: trimmed.max(2000).optional(),
  tagNames: z.array(trimmed.min(1).max(40)).default([])
});

export const memberUpdateSchema = memberCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");

export const membershipPlanCreateSchema = z.object({
  name: trimmed.min(1).max(120),
  description: trimmed.max(1000).optional(),
  billingInterval: z.nativeEnum(BillingInterval),
  priceCents: z.number().int().min(0),
  signupFeeCents: z.number().int().min(0).default(0),
  trialDays: z.number().int().min(0).default(0),
  autoRenew: z.boolean().default(true),
  contractLengthMonths: z.number().int().min(0).optional(),
  classAccessLimit: z.number().int().min(0).optional(),
  isPublic: z.boolean().default(true)
});

export const membershipPlanUpdateSchema = membershipPlanCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");

export const memberMembershipAssignSchema = z
  .object({
    planId: id,
    status: z.nativeEnum(MembershipStatus).default(MembershipStatus.Active),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional()
  })
  .refine(
    (value) =>
      !value.startsAt || !value.endsAt || new Date(value.endsAt) > new Date(value.startsAt),
    "Membership end date must be after start date."
  );

export const classTypeCreateSchema = z.object({
  name: trimmed.min(1).max(120),
  description: trimmed.max(1000).optional(),
  defaultDurationMinutes: z.number().int().min(5).max(480),
  defaultCapacity: z.number().int().min(1).max(500),
  defaultWaitlistCapacity: z.number().int().min(0).max(500).default(0),
  isPublic: z.boolean().default(true)
});

export const classSessionCreateSchema = z.object({
  classTypeId: id,
  locationId: id,
  trainerUserId: id.optional(),
  roomName: trimmed.max(120).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  capacity: z.number().int().min(1).max(500),
  waitlistCapacity: z.number().int().min(0).max(500).default(0),
  cancellationCutoffMinutes: z.number().int().min(0).max(10080).default(0),
  lateCancellationFeeCents: z.number().int().min(0).default(0)
});

export const classBookingCreateSchema = z.object({
  memberId: id
});

export const staffManualBookingSchema = z
  .object({
    memberId: id,
    overrideCapacity: z.boolean().default(false),
    overrideEligibility: z.boolean().default(false),
    overridePlanLimit: z.boolean().default(false),
    overrideReason: trimmed.max(500).optional()
  })
  .refine(
    (value) =>
      !(value.overrideCapacity || value.overrideEligibility || value.overridePlanLimit) ||
      Boolean(value.overrideReason),
    "An override reason is required when staff override flags are enabled."
  );

export const waitlistJoinSchema = classBookingCreateSchema;

export const checkInCreateSchema = z
  .object({
    memberId: id.optional(),
    barcode: trimmed.max(80).optional(),
    qrPayload: trimmed.max(300).optional(),
    locationId: id,
    classSessionId: id.optional(),
    method: z.nativeEnum(CheckInMethod).default(CheckInMethod.StaffManual),
    overrideEligibility: z.boolean().default(false),
    overrideReason: trimmed.max(500).optional()
  })
  .refine(
    (value) => Boolean(value.memberId || value.barcode || value.qrPayload),
    "A member ID, barcode, or QR payload is required."
  )
  .refine(
    (value) => !value.overrideEligibility || Boolean(value.overrideReason),
    "An override reason is required when eligibility is overridden."
  );

export const accessDeviceCreateSchema = z.object({
  name: trimmed.min(1).max(120),
  locationId: id,
  deviceType: z.nativeEnum(AccessDeviceType).default(AccessDeviceType.DoorController)
});

export const accessRuleCreateSchema = z
  .object({
    name: trimmed.min(1).max(120),
    locationId: id,
    planId: id.optional(),
    allowAllActiveMembers: z.boolean().default(false),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional()
  })
  .refine((value) => Boolean(value.planId || value.allowAllActiveMembers), {
    message: "A plan or all-active-members rule is required."
  })
  .refine(
    (value) =>
      !value.startsAt || !value.endsAt || new Date(value.endsAt) > new Date(value.startsAt),
    "Access rule end date must be after start date."
  );

export const accessDeviceEventSchema = z
  .object({
    apiKey: z.string().min(24),
    memberId: id.optional(),
    barcode: trimmed.max(80).optional(),
    qrPayload: trimmed.max(300).optional(),
    occurredAt: z.string().datetime().optional()
  })
  .refine(
    (value) => Boolean(value.memberId || value.barcode || value.qrPayload),
    "A member ID, barcode, or QR payload is required."
  );

export const accessDeviceHeartbeatSchema = z.object({
  apiKey: z.string().min(24),
  occurredAt: z.string().datetime().optional()
});

export const permissionSchema = z.nativeEnum(Permission);
export const roleNameSchema = z.nativeEnum(RoleName);

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PublicSignupInput = z.infer<typeof publicSignupSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type TwoFactorVerifyInput = z.infer<typeof twoFactorVerifySchema>;
export type GymCreateInput = z.infer<typeof gymCreateSchema>;
export type GymUpdateInput = z.infer<typeof gymUpdateSchema>;
export type LocationCreateInput = z.infer<typeof locationCreateSchema>;
export type LocationUpdateInput = z.infer<typeof locationUpdateSchema>;
export type RoleAssignmentInput = z.infer<typeof roleAssignmentSchema>;
export type CustomRoleCreateInput = z.infer<typeof customRoleCreateSchema>;
export type CustomRoleUpdateInput = z.infer<typeof customRoleUpdateSchema>;
export type StaffAccessRemoveInput = z.infer<typeof staffAccessRemoveSchema>;
export type StaffInviteCreateInput = z.infer<typeof staffInviteCreateSchema>;
export type StaffInviteAcceptInput = z.infer<typeof staffInviteAcceptSchema>;
export type StaffShiftCreateInput = z.infer<typeof staffShiftCreateSchema>;
export type MemberCreateInput = z.infer<typeof memberCreateSchema>;
export type MemberUpdateInput = z.infer<typeof memberUpdateSchema>;
export type MembershipPlanCreateInput = z.infer<typeof membershipPlanCreateSchema>;
export type MembershipPlanUpdateInput = z.infer<typeof membershipPlanUpdateSchema>;
export type MemberMembershipAssignInput = z.infer<typeof memberMembershipAssignSchema>;
export type ClassTypeCreateInput = z.infer<typeof classTypeCreateSchema>;
export type ClassSessionCreateInput = z.input<typeof classSessionCreateSchema>;
export type ClassBookingCreateInput = z.infer<typeof classBookingCreateSchema>;
export type StaffManualBookingInput = z.infer<typeof staffManualBookingSchema>;
export type WaitlistJoinInput = z.infer<typeof waitlistJoinSchema>;
export type CheckInCreateInput = z.input<typeof checkInCreateSchema>;
export type AccessDeviceCreateInput = z.input<typeof accessDeviceCreateSchema>;
export type AccessRuleCreateInput = z.input<typeof accessRuleCreateSchema>;
export type AccessDeviceEventInput = z.input<typeof accessDeviceEventSchema>;
export type AccessDeviceHeartbeatInput = z.input<typeof accessDeviceHeartbeatSchema>;
