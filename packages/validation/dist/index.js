import { AccessDeviceType, BillingInterval, CheckInMethod, LeadStage, FeatureFlag, ReservationConfirmationMode, ReservationPaymentRequirement, MemberStatus, MembershipStatus, Permission, RoleName } from "@gym-platform/constants";
import { z } from "zod";
const trimmed = z.string().trim();
const id = z.string().uuid();
export const emailSchema = trimmed.email().transform((value) => value.toLowerCase());
export const passwordSchema = z.string().min(1);
// Debug helper: log validation errors from API
export function formatZodIssues(issues) {
    return issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
}
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
export const operatingHoursSchema = z.record(z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]), z.array(z.object({
    opensAt: z.string().regex(/^\d{2}:\d{2}$/),
    closesAt: z.string().regex(/^\d{2}:\d{2}$/)
})));
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
    stripeAccountId: trimmed.regex(/^acct_[A-Za-z0-9]+$/).optional(),
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
    parentRoleId: id.optional(),
    permissions: z.array(z.nativeEnum(Permission)).min(1),
    createsReservableResource: z.boolean().default(false)
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
export const staffClockInSchema = z.object({
    userId: id,
    locationId: id.optional(),
    notes: trimmed.max(500).optional()
});
export const staffClockOutSchema = z.object({
    userId: id,
    notes: trimmed.max(500).optional()
});
export const staffSelfClockInSchema = z.object({
    locationId: id.optional(),
    notes: trimmed.max(500).optional()
});
export const staffSelfClockOutSchema = z.object({
    notes: trimmed.max(500).optional()
});
export const memberCreateSchema = z.object({
    firstName: trimmed.min(1).max(80),
    lastName: trimmed.min(1).max(80),
    email: emailSchema.optional(),
    phone: trimmed.max(40).optional(),
    barcode: trimmed.max(80).optional(),
    profileImageUrl: trimmed.url().or(z.literal("")).optional(),
    status: z.nativeEnum(MemberStatus).default(MemberStatus.Active),
    leadStage: z.nativeEnum(LeadStage).default(LeadStage.None),
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
export const consumerCreateSchema = memberCreateSchema;
export const consumerUpdateSchema = memberUpdateSchema;
export const consumerProfileImageUploadSchema = z.object({
    consumerId: id.optional(),
    fileName: trimmed.min(1).max(180),
    contentType: trimmed.regex(/^image\/[a-z0-9.+-]+$/i),
    base64Data: trimmed.min(16).max(8_000_000)
});
export const posPurchaseSchema = z
    .object({
    consumerId: id.optional(),
    firstName: trimmed.min(1).max(80).optional(),
    lastName: trimmed.min(1).max(80).optional(),
    email: emailSchema.optional(),
    phone: trimmed.min(7).max(40).optional(),
    amountCents: z.number().int().positive(),
    paymentMethod: z.enum(["card_reader", "manual_entry"]),
    note: trimmed.max(500).optional(),
    receiptEmail: emailSchema.optional(),
    planId: id.optional()
})
    .refine((value) => Boolean(value.consumerId ||
    (value.firstName && value.lastName)), "Choose an existing consumer or provide the buyer's first and last name.");
export const posStripeFinalizeSchema = z.object({
    paymentIntentId: trimmed.min(1).max(120)
});
export const stripeConnectOnboardingLinkSchema = z.object({
    returnUrl: trimmed.url(),
    refreshUrl: trimmed.url().optional()
});
const membershipPlanBaseSchema = z.object({
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
export const membershipPlanCreateSchema = membershipPlanBaseSchema.refine((value) => value.billingInterval !== BillingInterval.Package || value.classAccessLimit !== undefined, "Package plans require a class access limit.");
export const membershipPlanUpdateSchema = membershipPlanBaseSchema
    .partial()
    .refine((value) => value.billingInterval !== BillingInterval.Package || value.classAccessLimit !== undefined, "Package plans require a class access limit.")
    .refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");
export const memberMembershipAssignSchema = z
    .object({
    planId: id,
    status: z.nativeEnum(MembershipStatus).default(MembershipStatus.Active),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional()
})
    .refine((value) => !value.startsAt || !value.endsAt || new Date(value.endsAt) > new Date(value.startsAt), "Membership end date must be after start date.");
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
    .refine((value) => !(value.overrideCapacity || value.overrideEligibility || value.overridePlanLimit) ||
    Boolean(value.overrideReason), "An override reason is required when staff override flags are enabled.");
export const waitlistJoinSchema = classBookingCreateSchema;
const slotRulesSchema = z.object({
    minDurationMinutes: z.number().int().min(5).max(1440).default(30),
    maxDurationMinutes: z.number().int().min(5).max(1440).default(120),
    incrementMinutes: z.number().int().min(5).max(240).default(30),
    bufferBeforeMinutes: z.number().int().min(0).max(240).default(0),
    bufferAfterMinutes: z.number().int().min(0).max(240).default(0)
}).refine((value) => value.maxDurationMinutes >= value.minDurationMinutes, "Maximum duration must be at least the minimum duration.");
const pricingConfigSchema = z.object({
    amountCents: z.number().int().min(0).default(0)
});
const cancellationPolicySchema = z.object({
    cutoffMinutes: z.number().int().min(0).max(10080).default(0),
    feeCents: z.number().int().min(0).default(0)
});
const resourceBaseSchema = z.object({
    locationId: id.optional(),
    parentResourceId: id.optional(),
    name: trimmed.min(1).max(120),
    resourceType: trimmed.min(1).max(80),
    linkedStaffUserId: id.optional(),
    isBookable: z.boolean().default(true),
    isExclusive: z.boolean().default(true),
    capacity: z.number().int().min(1).max(1000).default(1),
    amenities: z.array(trimmed.min(1).max(80)).default([]),
    rentableHours: operatingHoursSchema.optional(),
    slotRules: slotRulesSchema.default({}),
    pricing: pricingConfigSchema.default({}),
    paymentRequirement: z.nativeEnum(ReservationPaymentRequirement).default(ReservationPaymentRequirement.Free),
    confirmationMode: z.nativeEnum(ReservationConfirmationMode).default(ReservationConfirmationMode.Automatic),
    cancellationPolicy: cancellationPolicySchema.default({})
});
export const resourceCreateSchema = resourceBaseSchema
    .refine((value) => Boolean(value.locationId || value.linkedStaffUserId), {
    message: "A physical resource location or linked staff user is required."
});
export const resourceUpdateSchema = resourceBaseSchema
    .omit({ locationId: true, parentResourceId: true, linkedStaffUserId: true })
    .partial()
    .refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");
export const resourceAvailabilityQuerySchema = z.object({
    from: z.string().datetime(),
    to: z.string().datetime()
}).refine((value) => new Date(value.to) > new Date(value.from), {
    message: "Availability end time must be after start time."
});
export const classSessionResourceAllocationSchema = z
    .object({
    resourceId: id,
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
    overrideConflict: z.boolean().default(false),
    overrideReason: trimmed.max(500).optional()
})
    .refine((value) => !value.startsAt || !value.endsAt || new Date(value.endsAt) > new Date(value.startsAt), {
    message: "Allocation end time must be after start time."
})
    .refine((value) => !value.overrideConflict || Boolean(value.overrideReason), {
    message: "An override reason is required when resource conflicts are overridden."
});
export const facilityReservationCreateSchema = z
    .object({
    resourceId: id,
    locationId: id.optional(),
    memberId: id,
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    overrideConflict: z.boolean().default(false),
    overrideReason: trimmed.max(500).optional(),
    paymentReference: trimmed.max(120).optional(),
    note: trimmed.max(500).optional()
})
    .refine((value) => new Date(value.endsAt) > new Date(value.startsAt), {
    message: "Reservation end time must be after start time."
})
    .refine((value) => !value.overrideConflict || Boolean(value.overrideReason), {
    message: "An override reason is required when resource conflicts are overridden."
});
export const facilityReservationCancelSchema = z.object({
    reason: trimmed.max(500).optional()
});
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
    .refine((value) => Boolean(value.memberId || value.barcode || value.qrPayload), "A member ID, barcode, or QR payload is required.")
    .refine((value) => !value.overrideEligibility || Boolean(value.overrideReason), "An override reason is required when eligibility is overridden.");
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
    .refine((value) => !value.startsAt || !value.endsAt || new Date(value.endsAt) > new Date(value.startsAt), "Access rule end date must be after start date.");
export const accessDeviceEventSchema = z
    .object({
    apiKey: z.string().min(24),
    memberId: id.optional(),
    barcode: trimmed.max(80).optional(),
    qrPayload: trimmed.max(300).optional(),
    occurredAt: z.string().datetime().optional()
})
    .refine((value) => Boolean(value.memberId || value.barcode || value.qrPayload), "A member ID, barcode, or QR payload is required.");
export const accessDeviceHeartbeatSchema = z.object({
    apiKey: z.string().min(24),
    occurredAt: z.string().datetime().optional()
});
export const permissionSchema = z.nativeEnum(Permission);
export const roleNameSchema = z.nativeEnum(RoleName);
//# sourceMappingURL=index.js.map