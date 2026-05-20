import { z } from "zod";
export declare const emailSchema: z.ZodEffects<z.ZodString, string, string>;
export declare const passwordSchema: z.ZodString;
export declare function formatZodIssues(issues: {
    path: (string | number)[];
    message: string;
}[]): string;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodString, string, string>;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    gymName: z.ZodOptional<z.ZodString>;
    timezone: z.ZodDefault<z.ZodString>;
    locale: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    timezone: string;
    locale: string;
    gymName?: string | undefined;
}, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    gymName?: string | undefined;
    timezone?: string | undefined;
    locale?: string | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodString, string, string>;
    password: z.ZodString;
    twoFactorCode: z.ZodOptional<z.ZodString>;
    recoveryCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    twoFactorCode?: string | undefined;
    recoveryCode?: string | undefined;
}, {
    email: string;
    password: string;
    twoFactorCode?: string | undefined;
    recoveryCode?: string | undefined;
}>;
export declare const publicSignupSchema: z.ZodObject<{
    planId: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodEffects<z.ZodString, string, string>;
    phone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    firstName: string;
    lastName: string;
    planId: string;
    phone?: string | undefined;
}, {
    email: string;
    firstName: string;
    lastName: string;
    planId: string;
    phone?: string | undefined;
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const logoutSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const resetPasswordSchema: z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    token: string;
}, {
    password: string;
    token: string;
}>;
export declare const verifyEmailSchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
export declare const resendVerificationSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const twoFactorVerifySchema: z.ZodObject<{
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
}, {
    code: string;
}>;
export declare const gymCreateSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodOptional<z.ZodString>;
    timezone: z.ZodDefault<z.ZodString>;
    locale: z.ZodDefault<z.ZodString>;
    featureFlags: z.ZodDefault<z.ZodArray<z.ZodNativeEnum<{
        readonly OnlineSignup: "online_signup";
        readonly ClassBooking: "class_booking";
        readonly PersonalTraining: "personal_training";
        readonly MemberPortal: "member_portal";
        readonly WebsiteBuilder: "website_builder";
        readonly PointOfSale: "point_of_sale";
        readonly AccessControl: "access_control";
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    timezone: string;
    locale: string;
    name: string;
    featureFlags: ("online_signup" | "class_booking" | "personal_training" | "member_portal" | "website_builder" | "point_of_sale" | "access_control")[];
    slug?: string | undefined;
}, {
    name: string;
    timezone?: string | undefined;
    locale?: string | undefined;
    slug?: string | undefined;
    featureFlags?: ("online_signup" | "class_booking" | "personal_training" | "member_portal" | "website_builder" | "point_of_sale" | "access_control")[] | undefined;
}>;
export declare const brandColorsSchema: z.ZodObject<{
    primary: z.ZodString;
    secondary: z.ZodOptional<z.ZodString>;
    accent: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    primary: string;
    secondary?: string | undefined;
    accent?: string | undefined;
}, {
    primary: string;
    secondary?: string | undefined;
    accent?: string | undefined;
}>;
export declare const addressSchema: z.ZodObject<{
    line1: z.ZodString;
    line2: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    region: z.ZodString;
    postalCode: z.ZodString;
    country: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    line1: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
    line2?: string | undefined;
}, {
    line1: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
    line2?: string | undefined;
}>;
export declare const operatingHoursSchema: z.ZodRecord<z.ZodEnum<["mon", "tue", "wed", "thu", "fri", "sat", "sun"]>, z.ZodArray<z.ZodObject<{
    opensAt: z.ZodString;
    closesAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    opensAt: string;
    closesAt: string;
}, {
    opensAt: string;
    closesAt: string;
}>, "many">>;
export declare const gymBusinessInfoSchema: z.ZodObject<{
    legalName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    website: z.ZodOptional<z.ZodString>;
    taxId: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodObject<{
        line1: z.ZodString;
        line2: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        region: z.ZodString;
        postalCode: z.ZodString;
        country: z.ZodEffects<z.ZodString, string, string>;
    }, "strip", z.ZodTypeAny, {
        line1: string;
        city: string;
        region: string;
        postalCode: string;
        country: string;
        line2?: string | undefined;
    }, {
        line1: string;
        city: string;
        region: string;
        postalCode: string;
        country: string;
        line2?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    phone?: string | undefined;
    legalName?: string | undefined;
    website?: string | undefined;
    taxId?: string | undefined;
    address?: {
        line1: string;
        city: string;
        region: string;
        postalCode: string;
        country: string;
        line2?: string | undefined;
    } | undefined;
}, {
    email?: string | undefined;
    phone?: string | undefined;
    legalName?: string | undefined;
    website?: string | undefined;
    taxId?: string | undefined;
    address?: {
        line1: string;
        city: string;
        region: string;
        postalCode: string;
        country: string;
        line2?: string | undefined;
    } | undefined;
}>;
export declare const gymUpdateSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodString>;
    locale: z.ZodOptional<z.ZodString>;
    logoUrl: z.ZodOptional<z.ZodString>;
    brandColors: z.ZodOptional<z.ZodObject<{
        primary: z.ZodString;
        secondary: z.ZodOptional<z.ZodString>;
        accent: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        primary: string;
        secondary?: string | undefined;
        accent?: string | undefined;
    }, {
        primary: string;
        secondary?: string | undefined;
        accent?: string | undefined;
    }>>;
    businessInfo: z.ZodOptional<z.ZodObject<{
        legalName: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
        website: z.ZodOptional<z.ZodString>;
        taxId: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodObject<{
            line1: z.ZodString;
            line2: z.ZodOptional<z.ZodString>;
            city: z.ZodString;
            region: z.ZodString;
            postalCode: z.ZodString;
            country: z.ZodEffects<z.ZodString, string, string>;
        }, "strip", z.ZodTypeAny, {
            line1: string;
            city: string;
            region: string;
            postalCode: string;
            country: string;
            line2?: string | undefined;
        }, {
            line1: string;
            city: string;
            region: string;
            postalCode: string;
            country: string;
            line2?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        email?: string | undefined;
        phone?: string | undefined;
        legalName?: string | undefined;
        website?: string | undefined;
        taxId?: string | undefined;
        address?: {
            line1: string;
            city: string;
            region: string;
            postalCode: string;
            country: string;
            line2?: string | undefined;
        } | undefined;
    }, {
        email?: string | undefined;
        phone?: string | undefined;
        legalName?: string | undefined;
        website?: string | undefined;
        taxId?: string | undefined;
        address?: {
            line1: string;
            city: string;
            region: string;
            postalCode: string;
            country: string;
            line2?: string | undefined;
        } | undefined;
    }>>;
    operatingHours: z.ZodOptional<z.ZodRecord<z.ZodEnum<["mon", "tue", "wed", "thu", "fri", "sat", "sun"]>, z.ZodArray<z.ZodObject<{
        opensAt: z.ZodString;
        closesAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        opensAt: string;
        closesAt: string;
    }, {
        opensAt: string;
        closesAt: string;
    }>, "many">>>;
    featureFlags: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<{
        readonly OnlineSignup: "online_signup";
        readonly ClassBooking: "class_booking";
        readonly PersonalTraining: "personal_training";
        readonly MemberPortal: "member_portal";
        readonly WebsiteBuilder: "website_builder";
        readonly PointOfSale: "point_of_sale";
        readonly AccessControl: "access_control";
    }>, "many">>;
    onboardingCompletedSteps: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    timezone?: string | undefined;
    locale?: string | undefined;
    name?: string | undefined;
    featureFlags?: ("online_signup" | "class_booking" | "personal_training" | "member_portal" | "website_builder" | "point_of_sale" | "access_control")[] | undefined;
    logoUrl?: string | undefined;
    brandColors?: {
        primary: string;
        secondary?: string | undefined;
        accent?: string | undefined;
    } | undefined;
    businessInfo?: {
        email?: string | undefined;
        phone?: string | undefined;
        legalName?: string | undefined;
        website?: string | undefined;
        taxId?: string | undefined;
        address?: {
            line1: string;
            city: string;
            region: string;
            postalCode: string;
            country: string;
            line2?: string | undefined;
        } | undefined;
    } | undefined;
    operatingHours?: Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", {
        opensAt: string;
        closesAt: string;
    }[]>> | undefined;
    onboardingCompletedSteps?: string[] | undefined;
}, {
    timezone?: string | undefined;
    locale?: string | undefined;
    name?: string | undefined;
    featureFlags?: ("online_signup" | "class_booking" | "personal_training" | "member_portal" | "website_builder" | "point_of_sale" | "access_control")[] | undefined;
    logoUrl?: string | undefined;
    brandColors?: {
        primary: string;
        secondary?: string | undefined;
        accent?: string | undefined;
    } | undefined;
    businessInfo?: {
        email?: string | undefined;
        phone?: string | undefined;
        legalName?: string | undefined;
        website?: string | undefined;
        taxId?: string | undefined;
        address?: {
            line1: string;
            city: string;
            region: string;
            postalCode: string;
            country: string;
            line2?: string | undefined;
        } | undefined;
    } | undefined;
    operatingHours?: Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", {
        opensAt: string;
        closesAt: string;
    }[]>> | undefined;
    onboardingCompletedSteps?: string[] | undefined;
}>, {
    timezone?: string | undefined;
    locale?: string | undefined;
    name?: string | undefined;
    featureFlags?: ("online_signup" | "class_booking" | "personal_training" | "member_portal" | "website_builder" | "point_of_sale" | "access_control")[] | undefined;
    logoUrl?: string | undefined;
    brandColors?: {
        primary: string;
        secondary?: string | undefined;
        accent?: string | undefined;
    } | undefined;
    businessInfo?: {
        email?: string | undefined;
        phone?: string | undefined;
        legalName?: string | undefined;
        website?: string | undefined;
        taxId?: string | undefined;
        address?: {
            line1: string;
            city: string;
            region: string;
            postalCode: string;
            country: string;
            line2?: string | undefined;
        } | undefined;
    } | undefined;
    operatingHours?: Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", {
        opensAt: string;
        closesAt: string;
    }[]>> | undefined;
    onboardingCompletedSteps?: string[] | undefined;
}, {
    timezone?: string | undefined;
    locale?: string | undefined;
    name?: string | undefined;
    featureFlags?: ("online_signup" | "class_booking" | "personal_training" | "member_portal" | "website_builder" | "point_of_sale" | "access_control")[] | undefined;
    logoUrl?: string | undefined;
    brandColors?: {
        primary: string;
        secondary?: string | undefined;
        accent?: string | undefined;
    } | undefined;
    businessInfo?: {
        email?: string | undefined;
        phone?: string | undefined;
        legalName?: string | undefined;
        website?: string | undefined;
        taxId?: string | undefined;
        address?: {
            line1: string;
            city: string;
            region: string;
            postalCode: string;
            country: string;
            line2?: string | undefined;
        } | undefined;
    } | undefined;
    operatingHours?: Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", {
        opensAt: string;
        closesAt: string;
    }[]>> | undefined;
    onboardingCompletedSteps?: string[] | undefined;
}>;
export declare const locationCreateSchema: z.ZodObject<{
    name: z.ZodString;
    address: z.ZodObject<{
        line1: z.ZodString;
        line2: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        region: z.ZodString;
        postalCode: z.ZodString;
        country: z.ZodEffects<z.ZodString, string, string>;
    }, "strip", z.ZodTypeAny, {
        line1: string;
        city: string;
        region: string;
        postalCode: string;
        country: string;
        line2?: string | undefined;
    }, {
        line1: string;
        city: string;
        region: string;
        postalCode: string;
        country: string;
        line2?: string | undefined;
    }>;
    timezone: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    operatingHours: z.ZodDefault<z.ZodRecord<z.ZodEnum<["mon", "tue", "wed", "thu", "fri", "sat", "sun"]>, z.ZodArray<z.ZodObject<{
        opensAt: z.ZodString;
        closesAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        opensAt: string;
        closesAt: string;
    }, {
        opensAt: string;
        closesAt: string;
    }>, "many">>>;
}, "strip", z.ZodTypeAny, {
    timezone: string;
    name: string;
    address: {
        line1: string;
        city: string;
        region: string;
        postalCode: string;
        country: string;
        line2?: string | undefined;
    };
    operatingHours: Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", {
        opensAt: string;
        closesAt: string;
    }[]>>;
    phone?: string | undefined;
}, {
    timezone: string;
    name: string;
    address: {
        line1: string;
        city: string;
        region: string;
        postalCode: string;
        country: string;
        line2?: string | undefined;
    };
    phone?: string | undefined;
    operatingHours?: Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", {
        opensAt: string;
        closesAt: string;
    }[]>> | undefined;
}>;
export declare const locationUpdateSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodObject<{
        line1: z.ZodString;
        line2: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        region: z.ZodString;
        postalCode: z.ZodString;
        country: z.ZodEffects<z.ZodString, string, string>;
    }, "strip", z.ZodTypeAny, {
        line1: string;
        city: string;
        region: string;
        postalCode: string;
        country: string;
        line2?: string | undefined;
    }, {
        line1: string;
        city: string;
        region: string;
        postalCode: string;
        country: string;
        line2?: string | undefined;
    }>>;
    timezone: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    operatingHours: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodEnum<["mon", "tue", "wed", "thu", "fri", "sat", "sun"]>, z.ZodArray<z.ZodObject<{
        opensAt: z.ZodString;
        closesAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        opensAt: string;
        closesAt: string;
    }, {
        opensAt: string;
        closesAt: string;
    }>, "many">>>>;
}, "strip", z.ZodTypeAny, {
    timezone?: string | undefined;
    phone?: string | undefined;
    name?: string | undefined;
    address?: {
        line1: string;
        city: string;
        region: string;
        postalCode: string;
        country: string;
        line2?: string | undefined;
    } | undefined;
    operatingHours?: Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", {
        opensAt: string;
        closesAt: string;
    }[]>> | undefined;
}, {
    timezone?: string | undefined;
    phone?: string | undefined;
    name?: string | undefined;
    address?: {
        line1: string;
        city: string;
        region: string;
        postalCode: string;
        country: string;
        line2?: string | undefined;
    } | undefined;
    operatingHours?: Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", {
        opensAt: string;
        closesAt: string;
    }[]>> | undefined;
}>, {
    timezone?: string | undefined;
    phone?: string | undefined;
    name?: string | undefined;
    address?: {
        line1: string;
        city: string;
        region: string;
        postalCode: string;
        country: string;
        line2?: string | undefined;
    } | undefined;
    operatingHours?: Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", {
        opensAt: string;
        closesAt: string;
    }[]>> | undefined;
}, {
    timezone?: string | undefined;
    phone?: string | undefined;
    name?: string | undefined;
    address?: {
        line1: string;
        city: string;
        region: string;
        postalCode: string;
        country: string;
        line2?: string | undefined;
    } | undefined;
    operatingHours?: Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", {
        opensAt: string;
        closesAt: string;
    }[]>> | undefined;
}>;
export declare const roleAssignmentSchema: z.ZodObject<{
    userId: z.ZodString;
    roleId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    roleId: string;
}, {
    userId: string;
    roleId: string;
}>;
export declare const customRoleCreateSchema: z.ZodObject<{
    name: z.ZodString;
    permissions: z.ZodArray<z.ZodNativeEnum<{
        readonly GymRead: "gym:read";
        readonly GymUpdate: "gym:update";
        readonly LocationRead: "location:read";
        readonly LocationCreate: "location:create";
        readonly LocationUpdate: "location:update";
        readonly LocationArchive: "location:archive";
        readonly StaffRead: "staff:read";
        readonly StaffInvite: "staff:invite";
        readonly StaffRoleAssign: "staff:role_assign";
        readonly StaffRemove: "staff:remove";
        readonly MemberRead: "member:read";
        readonly MemberWrite: "member:write";
        readonly PlanRead: "plan:read";
        readonly PlanWrite: "plan:write";
        readonly ClassRead: "class:read";
        readonly ClassWrite: "class:write";
        readonly BookingRead: "booking:read";
        readonly BookingWrite: "booking:write";
        readonly AccessRead: "access:read";
        readonly AccessWrite: "access:write";
        readonly PaymentRead: "payment:read";
        readonly PaymentWrite: "payment:write";
        readonly ReportRead: "report:read";
        readonly PlatformAdmin: "platform:admin";
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    permissions: ("gym:read" | "gym:update" | "location:read" | "location:create" | "location:update" | "location:archive" | "staff:read" | "staff:invite" | "staff:role_assign" | "staff:remove" | "member:read" | "member:write" | "plan:read" | "plan:write" | "class:read" | "class:write" | "booking:read" | "booking:write" | "access:read" | "access:write" | "payment:read" | "payment:write" | "report:read" | "platform:admin")[];
}, {
    name: string;
    permissions: ("gym:read" | "gym:update" | "location:read" | "location:create" | "location:update" | "location:archive" | "staff:read" | "staff:invite" | "staff:role_assign" | "staff:remove" | "member:read" | "member:write" | "plan:read" | "plan:write" | "class:read" | "class:write" | "booking:read" | "booking:write" | "access:read" | "access:write" | "payment:read" | "payment:write" | "report:read" | "platform:admin")[];
}>;
export declare const customRoleUpdateSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    permissions: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<{
        readonly GymRead: "gym:read";
        readonly GymUpdate: "gym:update";
        readonly LocationRead: "location:read";
        readonly LocationCreate: "location:create";
        readonly LocationUpdate: "location:update";
        readonly LocationArchive: "location:archive";
        readonly StaffRead: "staff:read";
        readonly StaffInvite: "staff:invite";
        readonly StaffRoleAssign: "staff:role_assign";
        readonly StaffRemove: "staff:remove";
        readonly MemberRead: "member:read";
        readonly MemberWrite: "member:write";
        readonly PlanRead: "plan:read";
        readonly PlanWrite: "plan:write";
        readonly ClassRead: "class:read";
        readonly ClassWrite: "class:write";
        readonly BookingRead: "booking:read";
        readonly BookingWrite: "booking:write";
        readonly AccessRead: "access:read";
        readonly AccessWrite: "access:write";
        readonly PaymentRead: "payment:read";
        readonly PaymentWrite: "payment:write";
        readonly ReportRead: "report:read";
        readonly PlatformAdmin: "platform:admin";
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    permissions?: ("gym:read" | "gym:update" | "location:read" | "location:create" | "location:update" | "location:archive" | "staff:read" | "staff:invite" | "staff:role_assign" | "staff:remove" | "member:read" | "member:write" | "plan:read" | "plan:write" | "class:read" | "class:write" | "booking:read" | "booking:write" | "access:read" | "access:write" | "payment:read" | "payment:write" | "report:read" | "platform:admin")[] | undefined;
}, {
    name?: string | undefined;
    permissions?: ("gym:read" | "gym:update" | "location:read" | "location:create" | "location:update" | "location:archive" | "staff:read" | "staff:invite" | "staff:role_assign" | "staff:remove" | "member:read" | "member:write" | "plan:read" | "plan:write" | "class:read" | "class:write" | "booking:read" | "booking:write" | "access:read" | "access:write" | "payment:read" | "payment:write" | "report:read" | "platform:admin")[] | undefined;
}>, {
    name?: string | undefined;
    permissions?: ("gym:read" | "gym:update" | "location:read" | "location:create" | "location:update" | "location:archive" | "staff:read" | "staff:invite" | "staff:role_assign" | "staff:remove" | "member:read" | "member:write" | "plan:read" | "plan:write" | "class:read" | "class:write" | "booking:read" | "booking:write" | "access:read" | "access:write" | "payment:read" | "payment:write" | "report:read" | "platform:admin")[] | undefined;
}, {
    name?: string | undefined;
    permissions?: ("gym:read" | "gym:update" | "location:read" | "location:create" | "location:update" | "location:archive" | "staff:read" | "staff:invite" | "staff:role_assign" | "staff:remove" | "member:read" | "member:write" | "plan:read" | "plan:write" | "class:read" | "class:write" | "booking:read" | "booking:write" | "access:read" | "access:write" | "payment:read" | "payment:write" | "report:read" | "platform:admin")[] | undefined;
}>;
export declare const staffAccessRemoveSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reason?: string | undefined;
}, {
    reason?: string | undefined;
}>;
export declare const staffInviteCreateSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodString, string, string>;
    roleId: z.ZodString;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    roleId: string;
    message?: string | undefined;
}, {
    email: string;
    roleId: string;
    message?: string | undefined;
}>;
export declare const staffInviteAcceptSchema: z.ZodObject<{
    token: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    firstName: string;
    lastName: string;
    token: string;
}, {
    password: string;
    firstName: string;
    lastName: string;
    token: string;
}>;
export declare const staffShiftCreateSchema: z.ZodEffects<z.ZodObject<{
    userId: z.ZodString;
    locationId: z.ZodOptional<z.ZodString>;
    roleId: z.ZodOptional<z.ZodString>;
    startsAt: z.ZodString;
    endsAt: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    startsAt: string;
    endsAt: string;
    roleId?: string | undefined;
    locationId?: string | undefined;
    notes?: string | undefined;
}, {
    userId: string;
    startsAt: string;
    endsAt: string;
    roleId?: string | undefined;
    locationId?: string | undefined;
    notes?: string | undefined;
}>, {
    userId: string;
    startsAt: string;
    endsAt: string;
    roleId?: string | undefined;
    locationId?: string | undefined;
    notes?: string | undefined;
}, {
    userId: string;
    startsAt: string;
    endsAt: string;
    roleId?: string | undefined;
    locationId?: string | undefined;
    notes?: string | undefined;
}>;
export declare const memberCreateSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    phone: z.ZodOptional<z.ZodString>;
    barcode: z.ZodOptional<z.ZodString>;
    profileImageUrl: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodLiteral<"">]>>;
    status: z.ZodDefault<z.ZodNativeEnum<{
        readonly Lead: "lead";
        readonly Trial: "trial";
        readonly Active: "active";
        readonly PastDue: "past_due";
        readonly Frozen: "frozen";
        readonly Cancelled: "cancelled";
        readonly Expired: "expired";
        readonly Archived: "archived";
    }>>;
    emergencyContact: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        phone: z.ZodString;
        relationship: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        phone: string;
        name: string;
        relationship?: string | undefined;
    }, {
        phone: string;
        name: string;
        relationship?: string | undefined;
    }>>;
    notes: z.ZodOptional<z.ZodString>;
    tagNames: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    firstName: string;
    lastName: string;
    status: "lead" | "trial" | "active" | "past_due" | "frozen" | "cancelled" | "expired" | "archived";
    tagNames: string[];
    email?: string | undefined;
    phone?: string | undefined;
    notes?: string | undefined;
    barcode?: string | undefined;
    profileImageUrl?: string | undefined;
    emergencyContact?: {
        phone: string;
        name: string;
        relationship?: string | undefined;
    } | undefined;
}, {
    firstName: string;
    lastName: string;
    email?: string | undefined;
    status?: "lead" | "trial" | "active" | "past_due" | "frozen" | "cancelled" | "expired" | "archived" | undefined;
    phone?: string | undefined;
    notes?: string | undefined;
    barcode?: string | undefined;
    profileImageUrl?: string | undefined;
    emergencyContact?: {
        phone: string;
        name: string;
        relationship?: string | undefined;
    } | undefined;
    tagNames?: string[] | undefined;
}>;
export declare const memberUpdateSchema: z.ZodEffects<z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    barcode: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    profileImageUrl: z.ZodOptional<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodLiteral<"">]>>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodNativeEnum<{
        readonly Lead: "lead";
        readonly Trial: "trial";
        readonly Active: "active";
        readonly PastDue: "past_due";
        readonly Frozen: "frozen";
        readonly Cancelled: "cancelled";
        readonly Expired: "expired";
        readonly Archived: "archived";
    }>>>;
    emergencyContact: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        phone: z.ZodString;
        relationship: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        phone: string;
        name: string;
        relationship?: string | undefined;
    }, {
        phone: string;
        name: string;
        relationship?: string | undefined;
    }>>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    tagNames: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    status?: "lead" | "trial" | "active" | "past_due" | "frozen" | "cancelled" | "expired" | "archived" | undefined;
    phone?: string | undefined;
    notes?: string | undefined;
    barcode?: string | undefined;
    profileImageUrl?: string | undefined;
    emergencyContact?: {
        phone: string;
        name: string;
        relationship?: string | undefined;
    } | undefined;
    tagNames?: string[] | undefined;
}, {
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    status?: "lead" | "trial" | "active" | "past_due" | "frozen" | "cancelled" | "expired" | "archived" | undefined;
    phone?: string | undefined;
    notes?: string | undefined;
    barcode?: string | undefined;
    profileImageUrl?: string | undefined;
    emergencyContact?: {
        phone: string;
        name: string;
        relationship?: string | undefined;
    } | undefined;
    tagNames?: string[] | undefined;
}>, {
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    status?: "lead" | "trial" | "active" | "past_due" | "frozen" | "cancelled" | "expired" | "archived" | undefined;
    phone?: string | undefined;
    notes?: string | undefined;
    barcode?: string | undefined;
    profileImageUrl?: string | undefined;
    emergencyContact?: {
        phone: string;
        name: string;
        relationship?: string | undefined;
    } | undefined;
    tagNames?: string[] | undefined;
}, {
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    status?: "lead" | "trial" | "active" | "past_due" | "frozen" | "cancelled" | "expired" | "archived" | undefined;
    phone?: string | undefined;
    notes?: string | undefined;
    barcode?: string | undefined;
    profileImageUrl?: string | undefined;
    emergencyContact?: {
        phone: string;
        name: string;
        relationship?: string | undefined;
    } | undefined;
    tagNames?: string[] | undefined;
}>;
export declare const membershipPlanCreateSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    billingInterval: z.ZodNativeEnum<{
        readonly Monthly: "monthly";
        readonly Yearly: "yearly";
        readonly OneTime: "one_time";
        readonly Package: "package";
    }>;
    priceCents: z.ZodNumber;
    signupFeeCents: z.ZodDefault<z.ZodNumber>;
    trialDays: z.ZodDefault<z.ZodNumber>;
    autoRenew: z.ZodDefault<z.ZodBoolean>;
    contractLengthMonths: z.ZodOptional<z.ZodNumber>;
    classAccessLimit: z.ZodOptional<z.ZodNumber>;
    isPublic: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    billingInterval: "monthly" | "yearly" | "one_time" | "package";
    priceCents: number;
    signupFeeCents: number;
    trialDays: number;
    autoRenew: boolean;
    isPublic: boolean;
    description?: string | undefined;
    contractLengthMonths?: number | undefined;
    classAccessLimit?: number | undefined;
}, {
    name: string;
    billingInterval: "monthly" | "yearly" | "one_time" | "package";
    priceCents: number;
    description?: string | undefined;
    signupFeeCents?: number | undefined;
    trialDays?: number | undefined;
    autoRenew?: boolean | undefined;
    contractLengthMonths?: number | undefined;
    classAccessLimit?: number | undefined;
    isPublic?: boolean | undefined;
}>;
export declare const membershipPlanUpdateSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    billingInterval: z.ZodOptional<z.ZodNativeEnum<{
        readonly Monthly: "monthly";
        readonly Yearly: "yearly";
        readonly OneTime: "one_time";
        readonly Package: "package";
    }>>;
    priceCents: z.ZodOptional<z.ZodNumber>;
    signupFeeCents: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    trialDays: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    autoRenew: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    contractLengthMonths: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    classAccessLimit: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    isPublic: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    billingInterval?: "monthly" | "yearly" | "one_time" | "package" | undefined;
    priceCents?: number | undefined;
    signupFeeCents?: number | undefined;
    trialDays?: number | undefined;
    autoRenew?: boolean | undefined;
    contractLengthMonths?: number | undefined;
    classAccessLimit?: number | undefined;
    isPublic?: boolean | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    billingInterval?: "monthly" | "yearly" | "one_time" | "package" | undefined;
    priceCents?: number | undefined;
    signupFeeCents?: number | undefined;
    trialDays?: number | undefined;
    autoRenew?: boolean | undefined;
    contractLengthMonths?: number | undefined;
    classAccessLimit?: number | undefined;
    isPublic?: boolean | undefined;
}>, {
    name?: string | undefined;
    description?: string | undefined;
    billingInterval?: "monthly" | "yearly" | "one_time" | "package" | undefined;
    priceCents?: number | undefined;
    signupFeeCents?: number | undefined;
    trialDays?: number | undefined;
    autoRenew?: boolean | undefined;
    contractLengthMonths?: number | undefined;
    classAccessLimit?: number | undefined;
    isPublic?: boolean | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    billingInterval?: "monthly" | "yearly" | "one_time" | "package" | undefined;
    priceCents?: number | undefined;
    signupFeeCents?: number | undefined;
    trialDays?: number | undefined;
    autoRenew?: boolean | undefined;
    contractLengthMonths?: number | undefined;
    classAccessLimit?: number | undefined;
    isPublic?: boolean | undefined;
}>;
export declare const memberMembershipAssignSchema: z.ZodEffects<z.ZodObject<{
    planId: z.ZodString;
    status: z.ZodDefault<z.ZodNativeEnum<{
        readonly Trialing: "trialing";
        readonly Active: "active";
        readonly PastDue: "past_due";
        readonly Paused: "paused";
        readonly Canceled: "canceled";
        readonly Expired: "expired";
    }>>;
    startsAt: z.ZodOptional<z.ZodString>;
    endsAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "active" | "past_due" | "expired" | "trialing" | "paused" | "canceled";
    planId: string;
    startsAt?: string | undefined;
    endsAt?: string | undefined;
}, {
    planId: string;
    status?: "active" | "past_due" | "expired" | "trialing" | "paused" | "canceled" | undefined;
    startsAt?: string | undefined;
    endsAt?: string | undefined;
}>, {
    status: "active" | "past_due" | "expired" | "trialing" | "paused" | "canceled";
    planId: string;
    startsAt?: string | undefined;
    endsAt?: string | undefined;
}, {
    planId: string;
    status?: "active" | "past_due" | "expired" | "trialing" | "paused" | "canceled" | undefined;
    startsAt?: string | undefined;
    endsAt?: string | undefined;
}>;
export declare const classTypeCreateSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    defaultDurationMinutes: z.ZodNumber;
    defaultCapacity: z.ZodNumber;
    defaultWaitlistCapacity: z.ZodDefault<z.ZodNumber>;
    isPublic: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    isPublic: boolean;
    defaultDurationMinutes: number;
    defaultCapacity: number;
    defaultWaitlistCapacity: number;
    description?: string | undefined;
}, {
    name: string;
    defaultDurationMinutes: number;
    defaultCapacity: number;
    description?: string | undefined;
    isPublic?: boolean | undefined;
    defaultWaitlistCapacity?: number | undefined;
}>;
export declare const classSessionCreateSchema: z.ZodObject<{
    classTypeId: z.ZodString;
    locationId: z.ZodString;
    trainerUserId: z.ZodOptional<z.ZodString>;
    roomName: z.ZodOptional<z.ZodString>;
    startsAt: z.ZodString;
    endsAt: z.ZodString;
    capacity: z.ZodNumber;
    waitlistCapacity: z.ZodDefault<z.ZodNumber>;
    cancellationCutoffMinutes: z.ZodDefault<z.ZodNumber>;
    lateCancellationFeeCents: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    locationId: string;
    startsAt: string;
    endsAt: string;
    classTypeId: string;
    capacity: number;
    waitlistCapacity: number;
    cancellationCutoffMinutes: number;
    lateCancellationFeeCents: number;
    trainerUserId?: string | undefined;
    roomName?: string | undefined;
}, {
    locationId: string;
    startsAt: string;
    endsAt: string;
    classTypeId: string;
    capacity: number;
    trainerUserId?: string | undefined;
    roomName?: string | undefined;
    waitlistCapacity?: number | undefined;
    cancellationCutoffMinutes?: number | undefined;
    lateCancellationFeeCents?: number | undefined;
}>;
export declare const classBookingCreateSchema: z.ZodObject<{
    memberId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    memberId: string;
}, {
    memberId: string;
}>;
export declare const staffManualBookingSchema: z.ZodEffects<z.ZodObject<{
    memberId: z.ZodString;
    overrideCapacity: z.ZodDefault<z.ZodBoolean>;
    overrideEligibility: z.ZodDefault<z.ZodBoolean>;
    overridePlanLimit: z.ZodDefault<z.ZodBoolean>;
    overrideReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    memberId: string;
    overrideCapacity: boolean;
    overrideEligibility: boolean;
    overridePlanLimit: boolean;
    overrideReason?: string | undefined;
}, {
    memberId: string;
    overrideCapacity?: boolean | undefined;
    overrideEligibility?: boolean | undefined;
    overridePlanLimit?: boolean | undefined;
    overrideReason?: string | undefined;
}>, {
    memberId: string;
    overrideCapacity: boolean;
    overrideEligibility: boolean;
    overridePlanLimit: boolean;
    overrideReason?: string | undefined;
}, {
    memberId: string;
    overrideCapacity?: boolean | undefined;
    overrideEligibility?: boolean | undefined;
    overridePlanLimit?: boolean | undefined;
    overrideReason?: string | undefined;
}>;
export declare const waitlistJoinSchema: z.ZodObject<{
    memberId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    memberId: string;
}, {
    memberId: string;
}>;
export declare const checkInCreateSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    memberId: z.ZodOptional<z.ZodString>;
    barcode: z.ZodOptional<z.ZodString>;
    qrPayload: z.ZodOptional<z.ZodString>;
    locationId: z.ZodString;
    classSessionId: z.ZodOptional<z.ZodString>;
    method: z.ZodDefault<z.ZodNativeEnum<{
        readonly StaffManual: "staff_manual";
        readonly Barcode: "barcode";
        readonly QrCode: "qr_code";
    }>>;
    overrideEligibility: z.ZodDefault<z.ZodBoolean>;
    overrideReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    locationId: string;
    overrideEligibility: boolean;
    method: "barcode" | "staff_manual" | "qr_code";
    barcode?: string | undefined;
    memberId?: string | undefined;
    overrideReason?: string | undefined;
    qrPayload?: string | undefined;
    classSessionId?: string | undefined;
}, {
    locationId: string;
    barcode?: string | undefined;
    memberId?: string | undefined;
    overrideEligibility?: boolean | undefined;
    overrideReason?: string | undefined;
    qrPayload?: string | undefined;
    classSessionId?: string | undefined;
    method?: "barcode" | "staff_manual" | "qr_code" | undefined;
}>, {
    locationId: string;
    overrideEligibility: boolean;
    method: "barcode" | "staff_manual" | "qr_code";
    barcode?: string | undefined;
    memberId?: string | undefined;
    overrideReason?: string | undefined;
    qrPayload?: string | undefined;
    classSessionId?: string | undefined;
}, {
    locationId: string;
    barcode?: string | undefined;
    memberId?: string | undefined;
    overrideEligibility?: boolean | undefined;
    overrideReason?: string | undefined;
    qrPayload?: string | undefined;
    classSessionId?: string | undefined;
    method?: "barcode" | "staff_manual" | "qr_code" | undefined;
}>, {
    locationId: string;
    overrideEligibility: boolean;
    method: "barcode" | "staff_manual" | "qr_code";
    barcode?: string | undefined;
    memberId?: string | undefined;
    overrideReason?: string | undefined;
    qrPayload?: string | undefined;
    classSessionId?: string | undefined;
}, {
    locationId: string;
    barcode?: string | undefined;
    memberId?: string | undefined;
    overrideEligibility?: boolean | undefined;
    overrideReason?: string | undefined;
    qrPayload?: string | undefined;
    classSessionId?: string | undefined;
    method?: "barcode" | "staff_manual" | "qr_code" | undefined;
}>;
export declare const accessDeviceCreateSchema: z.ZodObject<{
    name: z.ZodString;
    locationId: z.ZodString;
    deviceType: z.ZodDefault<z.ZodNativeEnum<{
        readonly DoorController: "door_controller";
        readonly Kiosk: "kiosk";
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    locationId: string;
    deviceType: "door_controller" | "kiosk";
}, {
    name: string;
    locationId: string;
    deviceType?: "door_controller" | "kiosk" | undefined;
}>;
export declare const accessRuleCreateSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    name: z.ZodString;
    locationId: z.ZodString;
    planId: z.ZodOptional<z.ZodString>;
    allowAllActiveMembers: z.ZodDefault<z.ZodBoolean>;
    startsAt: z.ZodOptional<z.ZodString>;
    endsAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    locationId: string;
    allowAllActiveMembers: boolean;
    planId?: string | undefined;
    startsAt?: string | undefined;
    endsAt?: string | undefined;
}, {
    name: string;
    locationId: string;
    planId?: string | undefined;
    startsAt?: string | undefined;
    endsAt?: string | undefined;
    allowAllActiveMembers?: boolean | undefined;
}>, {
    name: string;
    locationId: string;
    allowAllActiveMembers: boolean;
    planId?: string | undefined;
    startsAt?: string | undefined;
    endsAt?: string | undefined;
}, {
    name: string;
    locationId: string;
    planId?: string | undefined;
    startsAt?: string | undefined;
    endsAt?: string | undefined;
    allowAllActiveMembers?: boolean | undefined;
}>, {
    name: string;
    locationId: string;
    allowAllActiveMembers: boolean;
    planId?: string | undefined;
    startsAt?: string | undefined;
    endsAt?: string | undefined;
}, {
    name: string;
    locationId: string;
    planId?: string | undefined;
    startsAt?: string | undefined;
    endsAt?: string | undefined;
    allowAllActiveMembers?: boolean | undefined;
}>;
export declare const accessDeviceEventSchema: z.ZodEffects<z.ZodObject<{
    apiKey: z.ZodString;
    memberId: z.ZodOptional<z.ZodString>;
    barcode: z.ZodOptional<z.ZodString>;
    qrPayload: z.ZodOptional<z.ZodString>;
    occurredAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    apiKey: string;
    barcode?: string | undefined;
    memberId?: string | undefined;
    qrPayload?: string | undefined;
    occurredAt?: string | undefined;
}, {
    apiKey: string;
    barcode?: string | undefined;
    memberId?: string | undefined;
    qrPayload?: string | undefined;
    occurredAt?: string | undefined;
}>, {
    apiKey: string;
    barcode?: string | undefined;
    memberId?: string | undefined;
    qrPayload?: string | undefined;
    occurredAt?: string | undefined;
}, {
    apiKey: string;
    barcode?: string | undefined;
    memberId?: string | undefined;
    qrPayload?: string | undefined;
    occurredAt?: string | undefined;
}>;
export declare const accessDeviceHeartbeatSchema: z.ZodObject<{
    apiKey: z.ZodString;
    occurredAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    apiKey: string;
    occurredAt?: string | undefined;
}, {
    apiKey: string;
    occurredAt?: string | undefined;
}>;
export declare const stripePaymentMethodSchema: z.ZodEnum<["card_reader", "manual_entry"]>;
export declare const stripePaymentCollectSchema: z.ZodObject<{
    memberId: z.ZodOptional<z.ZodString>;
    amountCents: z.ZodNumber;
    currency: z.ZodEffects<z.ZodDefault<z.ZodString>, string, string | undefined>;
    paymentMethod: z.ZodEnum<["card_reader", "manual_entry"]>;
    note: z.ZodOptional<z.ZodString>;
    receiptEmail: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
}, "strip", z.ZodTypeAny, {
    amountCents: number;
    currency: string;
    paymentMethod: "card_reader" | "manual_entry";
    memberId?: string | undefined;
    note?: string | undefined;
    receiptEmail?: string | undefined;
}, {
    amountCents: number;
    paymentMethod: "card_reader" | "manual_entry";
    memberId?: string | undefined;
    currency?: string | undefined;
    note?: string | undefined;
    receiptEmail?: string | undefined;
}>;
export declare const stripePaymentRefundSchema: z.ZodObject<{
    amountCents: z.ZodOptional<z.ZodNumber>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reason?: string | undefined;
    amountCents?: number | undefined;
}, {
    reason?: string | undefined;
    amountCents?: number | undefined;
}>;
export declare const notificationProcessSchema: z.ZodObject<{
    markFailed: z.ZodDefault<z.ZodBoolean>;
    failureReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    markFailed: boolean;
    failureReason?: string | undefined;
}, {
    markFailed?: boolean | undefined;
    failureReason?: string | undefined;
}>;
export declare const contractWaiverTypeSchema: z.ZodEnum<["contract", "waiver"]>;
export declare const contractWaiverCreateSchema: z.ZodObject<{
    title: z.ZodString;
    type: z.ZodEnum<["contract", "waiver"]>;
    version: z.ZodDefault<z.ZodNumber>;
    requiresSignature: z.ZodDefault<z.ZodBoolean>;
    publish: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "contract" | "waiver";
    title: string;
    version: number;
    requiresSignature: boolean;
    publish: boolean;
}, {
    type: "contract" | "waiver";
    title: string;
    version?: number | undefined;
    requiresSignature?: boolean | undefined;
    publish?: boolean | undefined;
}>;
export declare const contractWaiverUpdateSchema: z.ZodEffects<z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["contract", "waiver"]>>;
    version: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    requiresSignature: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    publish: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    type?: "contract" | "waiver" | undefined;
    title?: string | undefined;
    version?: number | undefined;
    requiresSignature?: boolean | undefined;
    publish?: boolean | undefined;
}, {
    type?: "contract" | "waiver" | undefined;
    title?: string | undefined;
    version?: number | undefined;
    requiresSignature?: boolean | undefined;
    publish?: boolean | undefined;
}>, {
    type?: "contract" | "waiver" | undefined;
    title?: string | undefined;
    version?: number | undefined;
    requiresSignature?: boolean | undefined;
    publish?: boolean | undefined;
}, {
    type?: "contract" | "waiver" | undefined;
    title?: string | undefined;
    version?: number | undefined;
    requiresSignature?: boolean | undefined;
    publish?: boolean | undefined;
}>;
export declare const permissionSchema: z.ZodNativeEnum<{
    readonly GymRead: "gym:read";
    readonly GymUpdate: "gym:update";
    readonly LocationRead: "location:read";
    readonly LocationCreate: "location:create";
    readonly LocationUpdate: "location:update";
    readonly LocationArchive: "location:archive";
    readonly StaffRead: "staff:read";
    readonly StaffInvite: "staff:invite";
    readonly StaffRoleAssign: "staff:role_assign";
    readonly StaffRemove: "staff:remove";
    readonly MemberRead: "member:read";
    readonly MemberWrite: "member:write";
    readonly PlanRead: "plan:read";
    readonly PlanWrite: "plan:write";
    readonly ClassRead: "class:read";
    readonly ClassWrite: "class:write";
    readonly BookingRead: "booking:read";
    readonly BookingWrite: "booking:write";
    readonly AccessRead: "access:read";
    readonly AccessWrite: "access:write";
    readonly PaymentRead: "payment:read";
    readonly PaymentWrite: "payment:write";
    readonly ReportRead: "report:read";
    readonly PlatformAdmin: "platform:admin";
}>;
export declare const roleNameSchema: z.ZodNativeEnum<{
    readonly Owner: "owner";
    readonly Manager: "manager";
    readonly Trainer: "trainer";
    readonly FrontDesk: "front_desk";
    readonly Sales: "sales";
    readonly Accountant: "accountant";
    readonly Member: "member";
}>;
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
export type StripePaymentCollectInput = z.infer<typeof stripePaymentCollectSchema>;
export type StripePaymentRefundInput = z.infer<typeof stripePaymentRefundSchema>;
export type NotificationProcessInput = z.input<typeof notificationProcessSchema>;
export type ContractWaiverCreateInput = z.infer<typeof contractWaiverCreateSchema>;
export type ContractWaiverUpdateInput = z.infer<typeof contractWaiverUpdateSchema>;
//# sourceMappingURL=index.d.ts.map