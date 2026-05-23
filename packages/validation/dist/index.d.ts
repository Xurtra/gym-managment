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
    gymSlug: z.ZodOptional<z.ZodString>;
    twoFactorCode: z.ZodOptional<z.ZodString>;
    recoveryCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    gymSlug?: string | undefined;
    twoFactorCode?: string | undefined;
    recoveryCode?: string | undefined;
}, {
    email: string;
    password: string;
    gymSlug?: string | undefined;
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
    stripeAccountId: z.ZodOptional<z.ZodString>;
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
    stripeAccountId?: string | undefined;
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
    stripeAccountId?: string | undefined;
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
    stripeAccountId?: string | undefined;
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
    stripeAccountId?: string | undefined;
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
    parentRoleId: z.ZodOptional<z.ZodString>;
    permissions: z.ZodArray<z.ZodNativeEnum<{
        readonly GymRead: "gym:read";
        readonly GymUpdate: "gym:update";
        readonly LocationRead: "location:read";
        readonly LocationCreate: "location:create";
        readonly LocationUpdate: "location:update";
        readonly LocationArchive: "location:archive";
        readonly StaffDirectoryView: "staff:directory_view";
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
        readonly ScheduleRead: "schedule:read";
        readonly ScheduleCreate: "schedule:create";
        readonly SchedulePublish: "schedule:publish";
        readonly ScheduleRequestsManage: "schedule:requests_manage";
        readonly ScheduleAutoResolve: "schedule:auto_resolve";
        readonly PlatformAdmin: "platform:admin";
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    permissions: ("gym:read" | "gym:update" | "location:read" | "location:create" | "location:update" | "location:archive" | "staff:directory_view" | "staff:read" | "staff:invite" | "staff:role_assign" | "staff:remove" | "member:read" | "member:write" | "plan:read" | "plan:write" | "class:read" | "class:write" | "booking:read" | "booking:write" | "access:read" | "access:write" | "payment:read" | "payment:write" | "report:read" | "schedule:read" | "schedule:create" | "schedule:publish" | "schedule:requests_manage" | "schedule:auto_resolve" | "platform:admin")[];
    parentRoleId?: string | undefined;
}, {
    name: string;
    permissions: ("gym:read" | "gym:update" | "location:read" | "location:create" | "location:update" | "location:archive" | "staff:directory_view" | "staff:read" | "staff:invite" | "staff:role_assign" | "staff:remove" | "member:read" | "member:write" | "plan:read" | "plan:write" | "class:read" | "class:write" | "booking:read" | "booking:write" | "access:read" | "access:write" | "payment:read" | "payment:write" | "report:read" | "schedule:read" | "schedule:create" | "schedule:publish" | "schedule:requests_manage" | "schedule:auto_resolve" | "platform:admin")[];
    parentRoleId?: string | undefined;
}>;
export declare const customRoleUpdateSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    parentRoleId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    permissions: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<{
        readonly GymRead: "gym:read";
        readonly GymUpdate: "gym:update";
        readonly LocationRead: "location:read";
        readonly LocationCreate: "location:create";
        readonly LocationUpdate: "location:update";
        readonly LocationArchive: "location:archive";
        readonly StaffDirectoryView: "staff:directory_view";
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
        readonly ScheduleRead: "schedule:read";
        readonly ScheduleCreate: "schedule:create";
        readonly SchedulePublish: "schedule:publish";
        readonly ScheduleRequestsManage: "schedule:requests_manage";
        readonly ScheduleAutoResolve: "schedule:auto_resolve";
        readonly PlatformAdmin: "platform:admin";
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    parentRoleId?: string | undefined;
    permissions?: ("gym:read" | "gym:update" | "location:read" | "location:create" | "location:update" | "location:archive" | "staff:directory_view" | "staff:read" | "staff:invite" | "staff:role_assign" | "staff:remove" | "member:read" | "member:write" | "plan:read" | "plan:write" | "class:read" | "class:write" | "booking:read" | "booking:write" | "access:read" | "access:write" | "payment:read" | "payment:write" | "report:read" | "schedule:read" | "schedule:create" | "schedule:publish" | "schedule:requests_manage" | "schedule:auto_resolve" | "platform:admin")[] | undefined;
}, {
    name?: string | undefined;
    parentRoleId?: string | undefined;
    permissions?: ("gym:read" | "gym:update" | "location:read" | "location:create" | "location:update" | "location:archive" | "staff:directory_view" | "staff:read" | "staff:invite" | "staff:role_assign" | "staff:remove" | "member:read" | "member:write" | "plan:read" | "plan:write" | "class:read" | "class:write" | "booking:read" | "booking:write" | "access:read" | "access:write" | "payment:read" | "payment:write" | "report:read" | "schedule:read" | "schedule:create" | "schedule:publish" | "schedule:requests_manage" | "schedule:auto_resolve" | "platform:admin")[] | undefined;
}>, {
    name?: string | undefined;
    parentRoleId?: string | undefined;
    permissions?: ("gym:read" | "gym:update" | "location:read" | "location:create" | "location:update" | "location:archive" | "staff:directory_view" | "staff:read" | "staff:invite" | "staff:role_assign" | "staff:remove" | "member:read" | "member:write" | "plan:read" | "plan:write" | "class:read" | "class:write" | "booking:read" | "booking:write" | "access:read" | "access:write" | "payment:read" | "payment:write" | "report:read" | "schedule:read" | "schedule:create" | "schedule:publish" | "schedule:requests_manage" | "schedule:auto_resolve" | "platform:admin")[] | undefined;
}, {
    name?: string | undefined;
    parentRoleId?: string | undefined;
    permissions?: ("gym:read" | "gym:update" | "location:read" | "location:create" | "location:update" | "location:archive" | "staff:directory_view" | "staff:read" | "staff:invite" | "staff:role_assign" | "staff:remove" | "member:read" | "member:write" | "plan:read" | "plan:write" | "class:read" | "class:write" | "booking:read" | "booking:write" | "access:read" | "access:write" | "payment:read" | "payment:write" | "report:read" | "schedule:read" | "schedule:create" | "schedule:publish" | "schedule:requests_manage" | "schedule:auto_resolve" | "platform:admin")[] | undefined;
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
export declare const staffClockInSchema: z.ZodObject<{
    userId: z.ZodString;
    locationId: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    locationId?: string | undefined;
    notes?: string | undefined;
}, {
    userId: string;
    locationId?: string | undefined;
    notes?: string | undefined;
}>;
export declare const staffClockOutSchema: z.ZodObject<{
    userId: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    notes?: string | undefined;
}, {
    userId: string;
    notes?: string | undefined;
}>;
export declare const staffSelfClockInSchema: z.ZodObject<{
    locationId: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    locationId?: string | undefined;
    notes?: string | undefined;
}, {
    locationId?: string | undefined;
    notes?: string | undefined;
}>;
export declare const staffSelfClockOutSchema: z.ZodObject<{
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    notes?: string | undefined;
}, {
    notes?: string | undefined;
}>;
export declare const schedulerCoverageRuleCreateSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodString;
    locationId: z.ZodOptional<z.ZodString>;
    roleId: z.ZodString;
    daysOfWeek: z.ZodArray<z.ZodNumber, "many">;
    startTime: z.ZodString;
    endTime: z.ZodString;
    requiredStaff: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    roleId: string;
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    requiredStaff: number;
    locationId?: string | undefined;
}, {
    name: string;
    roleId: string;
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    locationId?: string | undefined;
    requiredStaff?: number | undefined;
}>, {
    name: string;
    roleId: string;
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    requiredStaff: number;
    locationId?: string | undefined;
}, {
    name: string;
    roleId: string;
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    locationId?: string | undefined;
    requiredStaff?: number | undefined;
}>;
export declare const schedulerAvailabilityCreateSchema: z.ZodEffects<z.ZodObject<{
    userId: z.ZodString;
    daysOfWeek: z.ZodArray<z.ZodNumber, "many">;
    startTime: z.ZodString;
    endTime: z.ZodString;
    preference: z.ZodDefault<z.ZodEnum<["available", "preferred", "unavailable"]>>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    preference: "available" | "preferred" | "unavailable";
    notes?: string | undefined;
}, {
    userId: string;
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    notes?: string | undefined;
    preference?: "available" | "preferred" | "unavailable" | undefined;
}>, {
    userId: string;
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    preference: "available" | "preferred" | "unavailable";
    notes?: string | undefined;
}, {
    userId: string;
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    notes?: string | undefined;
    preference?: "available" | "preferred" | "unavailable" | undefined;
}>;
export declare const schedulerSettingsUpdateSchema: z.ZodObject<{
    planningHorizonDays: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    planningHorizonDays: number;
}, {
    planningHorizonDays: number;
}>;
export declare const schedulerPreferenceRequestCreateSchema: z.ZodEffects<z.ZodObject<{
    daysOfWeek: z.ZodArray<z.ZodNumber, "many">;
    startTime: z.ZodString;
    endTime: z.ZodString;
    preference: z.ZodDefault<z.ZodEnum<["available", "preferred", "unavailable"]>>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    preference: "available" | "preferred" | "unavailable";
    notes?: string | undefined;
}, {
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    notes?: string | undefined;
    preference?: "available" | "preferred" | "unavailable" | undefined;
}>, {
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    preference: "available" | "preferred" | "unavailable";
    notes?: string | undefined;
}, {
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    notes?: string | undefined;
    preference?: "available" | "preferred" | "unavailable" | undefined;
}>;
export declare const schedulerPreferenceRequestResolveSchema: z.ZodObject<{
    decision: z.ZodEnum<["approve", "decline"]>;
    resolutionNote: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    decision: "approve" | "decline";
    resolutionNote?: string | undefined;
}, {
    decision: "approve" | "decline";
    resolutionNote?: string | undefined;
}>;
export declare const schedulerRequestCreateSchema: z.ZodObject<{
    shiftId: z.ZodOptional<z.ZodString>;
    requestType: z.ZodDefault<z.ZodEnum<["time_off", "swap", "complaint"]>>;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    requestType: "time_off" | "swap" | "complaint";
    shiftId?: string | undefined;
}, {
    message: string;
    shiftId?: string | undefined;
    requestType?: "time_off" | "swap" | "complaint" | undefined;
}>;
export declare const schedulerGenerateSchema: z.ZodEffects<z.ZodObject<{
    startsOn: z.ZodString;
    endsOn: z.ZodOptional<z.ZodString>;
    locationId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    startsOn: string;
    locationId?: string | undefined;
    endsOn?: string | undefined;
}, {
    startsOn: string;
    locationId?: string | undefined;
    endsOn?: string | undefined;
}>, {
    startsOn: string;
    locationId?: string | undefined;
    endsOn?: string | undefined;
}, {
    startsOn: string;
    locationId?: string | undefined;
    endsOn?: string | undefined;
}>;
export declare const schedulerPublishSchema: z.ZodEffects<z.ZodObject<{
    startsOn: z.ZodString;
    endsOn: z.ZodOptional<z.ZodString>;
    locationId: z.ZodOptional<z.ZodString>;
} & {
    replaceExisting: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    startsOn: string;
    replaceExisting: boolean;
    locationId?: string | undefined;
    endsOn?: string | undefined;
}, {
    startsOn: string;
    locationId?: string | undefined;
    endsOn?: string | undefined;
    replaceExisting?: boolean | undefined;
}>, {
    startsOn: string;
    replaceExisting: boolean;
    locationId?: string | undefined;
    endsOn?: string | undefined;
}, {
    startsOn: string;
    locationId?: string | undefined;
    endsOn?: string | undefined;
    replaceExisting?: boolean | undefined;
}>;
export declare const schedulerRequestResolveSchema: z.ZodObject<{
    resolutionNote: z.ZodOptional<z.ZodString>;
    decision: z.ZodDefault<z.ZodEnum<["apply", "decline"]>>;
    autoAssignReplacement: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    decision: "decline" | "apply";
    autoAssignReplacement: boolean;
    resolutionNote?: string | undefined;
}, {
    decision?: "decline" | "apply" | undefined;
    resolutionNote?: string | undefined;
    autoAssignReplacement?: boolean | undefined;
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
    leadStage: z.ZodDefault<z.ZodNativeEnum<{
        readonly None: "none";
        readonly Open: "open";
        readonly Converted: "converted";
        readonly Closed: "closed";
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
    leadStage: "none" | "open" | "converted" | "closed";
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
    leadStage?: "none" | "open" | "converted" | "closed" | undefined;
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
    leadStage: z.ZodOptional<z.ZodDefault<z.ZodNativeEnum<{
        readonly None: "none";
        readonly Open: "open";
        readonly Converted: "converted";
        readonly Closed: "closed";
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
    leadStage?: "none" | "open" | "converted" | "closed" | undefined;
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
    leadStage?: "none" | "open" | "converted" | "closed" | undefined;
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
    leadStage?: "none" | "open" | "converted" | "closed" | undefined;
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
    leadStage?: "none" | "open" | "converted" | "closed" | undefined;
    emergencyContact?: {
        phone: string;
        name: string;
        relationship?: string | undefined;
    } | undefined;
    tagNames?: string[] | undefined;
}>;
export declare const consumerCreateSchema: z.ZodObject<{
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
    leadStage: z.ZodDefault<z.ZodNativeEnum<{
        readonly None: "none";
        readonly Open: "open";
        readonly Converted: "converted";
        readonly Closed: "closed";
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
    leadStage: "none" | "open" | "converted" | "closed";
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
    leadStage?: "none" | "open" | "converted" | "closed" | undefined;
    emergencyContact?: {
        phone: string;
        name: string;
        relationship?: string | undefined;
    } | undefined;
    tagNames?: string[] | undefined;
}>;
export declare const consumerUpdateSchema: z.ZodEffects<z.ZodObject<{
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
    leadStage: z.ZodOptional<z.ZodDefault<z.ZodNativeEnum<{
        readonly None: "none";
        readonly Open: "open";
        readonly Converted: "converted";
        readonly Closed: "closed";
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
    leadStage?: "none" | "open" | "converted" | "closed" | undefined;
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
    leadStage?: "none" | "open" | "converted" | "closed" | undefined;
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
    leadStage?: "none" | "open" | "converted" | "closed" | undefined;
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
    leadStage?: "none" | "open" | "converted" | "closed" | undefined;
    emergencyContact?: {
        phone: string;
        name: string;
        relationship?: string | undefined;
    } | undefined;
    tagNames?: string[] | undefined;
}>;
export declare const consumerProfileImageUploadSchema: z.ZodObject<{
    consumerId: z.ZodOptional<z.ZodString>;
    fileName: z.ZodString;
    contentType: z.ZodString;
    base64Data: z.ZodString;
}, "strip", z.ZodTypeAny, {
    fileName: string;
    contentType: string;
    base64Data: string;
    consumerId?: string | undefined;
}, {
    fileName: string;
    contentType: string;
    base64Data: string;
    consumerId?: string | undefined;
}>;
export declare const posPurchaseSchema: z.ZodEffects<z.ZodObject<{
    consumerId: z.ZodOptional<z.ZodString>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    phone: z.ZodOptional<z.ZodString>;
    amountCents: z.ZodNumber;
    paymentMethod: z.ZodEnum<["card_reader", "manual_entry"]>;
    note: z.ZodOptional<z.ZodString>;
    receiptEmail: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    planId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    amountCents: number;
    paymentMethod: "card_reader" | "manual_entry";
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    planId?: string | undefined;
    phone?: string | undefined;
    consumerId?: string | undefined;
    note?: string | undefined;
    receiptEmail?: string | undefined;
}, {
    amountCents: number;
    paymentMethod: "card_reader" | "manual_entry";
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    planId?: string | undefined;
    phone?: string | undefined;
    consumerId?: string | undefined;
    note?: string | undefined;
    receiptEmail?: string | undefined;
}>, {
    amountCents: number;
    paymentMethod: "card_reader" | "manual_entry";
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    planId?: string | undefined;
    phone?: string | undefined;
    consumerId?: string | undefined;
    note?: string | undefined;
    receiptEmail?: string | undefined;
}, {
    amountCents: number;
    paymentMethod: "card_reader" | "manual_entry";
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    planId?: string | undefined;
    phone?: string | undefined;
    consumerId?: string | undefined;
    note?: string | undefined;
    receiptEmail?: string | undefined;
}>;
export declare const posStripeFinalizeSchema: z.ZodObject<{
    paymentIntentId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    paymentIntentId: string;
}, {
    paymentIntentId: string;
}>;
export declare const membershipPlanCreateSchema: z.ZodEffects<z.ZodObject<{
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
}>, {
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
export declare const membershipPlanUpdateSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
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
export declare const resourceCreateSchema: z.ZodObject<{
    locationId: z.ZodString;
    parentResourceId: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    resourceType: z.ZodString;
    isBookable: z.ZodDefault<z.ZodBoolean>;
    isExclusive: z.ZodDefault<z.ZodBoolean>;
    capacity: z.ZodDefault<z.ZodNumber>;
    amenities: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    rentableHours: z.ZodOptional<z.ZodRecord<z.ZodEnum<["mon", "tue", "wed", "thu", "fri", "sat", "sun"]>, z.ZodArray<z.ZodObject<{
        opensAt: z.ZodString;
        closesAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        opensAt: string;
        closesAt: string;
    }, {
        opensAt: string;
        closesAt: string;
    }>, "many">>>;
    slotRules: z.ZodDefault<z.ZodEffects<z.ZodObject<{
        minDurationMinutes: z.ZodDefault<z.ZodNumber>;
        maxDurationMinutes: z.ZodDefault<z.ZodNumber>;
        incrementMinutes: z.ZodDefault<z.ZodNumber>;
        bufferBeforeMinutes: z.ZodDefault<z.ZodNumber>;
        bufferAfterMinutes: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        minDurationMinutes: number;
        maxDurationMinutes: number;
        incrementMinutes: number;
        bufferBeforeMinutes: number;
        bufferAfterMinutes: number;
    }, {
        minDurationMinutes?: number | undefined;
        maxDurationMinutes?: number | undefined;
        incrementMinutes?: number | undefined;
        bufferBeforeMinutes?: number | undefined;
        bufferAfterMinutes?: number | undefined;
    }>, {
        minDurationMinutes: number;
        maxDurationMinutes: number;
        incrementMinutes: number;
        bufferBeforeMinutes: number;
        bufferAfterMinutes: number;
    }, {
        minDurationMinutes?: number | undefined;
        maxDurationMinutes?: number | undefined;
        incrementMinutes?: number | undefined;
        bufferBeforeMinutes?: number | undefined;
        bufferAfterMinutes?: number | undefined;
    }>>;
    pricing: z.ZodDefault<z.ZodObject<{
        amountCents: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        amountCents: number;
    }, {
        amountCents?: number | undefined;
    }>>;
    paymentRequirement: z.ZodDefault<z.ZodNativeEnum<{
        readonly Free: "free";
        readonly PayUpfront: "pay_upfront";
        readonly PayLater: "pay_later";
    }>>;
    confirmationMode: z.ZodDefault<z.ZodNativeEnum<{
        readonly Automatic: "automatic";
        readonly StaffApproval: "staff_approval";
    }>>;
    cancellationPolicy: z.ZodDefault<z.ZodObject<{
        cutoffMinutes: z.ZodDefault<z.ZodNumber>;
        feeCents: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        cutoffMinutes: number;
        feeCents: number;
    }, {
        cutoffMinutes?: number | undefined;
        feeCents?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    locationId: string;
    capacity: number;
    resourceType: string;
    isBookable: boolean;
    isExclusive: boolean;
    amenities: string[];
    slotRules: {
        minDurationMinutes: number;
        maxDurationMinutes: number;
        incrementMinutes: number;
        bufferBeforeMinutes: number;
        bufferAfterMinutes: number;
    };
    pricing: {
        amountCents: number;
    };
    paymentRequirement: "free" | "pay_upfront" | "pay_later";
    confirmationMode: "automatic" | "staff_approval";
    cancellationPolicy: {
        cutoffMinutes: number;
        feeCents: number;
    };
    parentResourceId?: string | undefined;
    rentableHours?: Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", {
        opensAt: string;
        closesAt: string;
    }[]>> | undefined;
}, {
    name: string;
    locationId: string;
    resourceType: string;
    capacity?: number | undefined;
    parentResourceId?: string | undefined;
    isBookable?: boolean | undefined;
    isExclusive?: boolean | undefined;
    amenities?: string[] | undefined;
    rentableHours?: Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", {
        opensAt: string;
        closesAt: string;
    }[]>> | undefined;
    slotRules?: {
        minDurationMinutes?: number | undefined;
        maxDurationMinutes?: number | undefined;
        incrementMinutes?: number | undefined;
        bufferBeforeMinutes?: number | undefined;
        bufferAfterMinutes?: number | undefined;
    } | undefined;
    pricing?: {
        amountCents?: number | undefined;
    } | undefined;
    paymentRequirement?: "free" | "pay_upfront" | "pay_later" | undefined;
    confirmationMode?: "automatic" | "staff_approval" | undefined;
    cancellationPolicy?: {
        cutoffMinutes?: number | undefined;
        feeCents?: number | undefined;
    } | undefined;
}>;
export declare const resourceUpdateSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    capacity: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    resourceType: z.ZodOptional<z.ZodString>;
    isBookable: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    isExclusive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    amenities: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    rentableHours: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodEnum<["mon", "tue", "wed", "thu", "fri", "sat", "sun"]>, z.ZodArray<z.ZodObject<{
        opensAt: z.ZodString;
        closesAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        opensAt: string;
        closesAt: string;
    }, {
        opensAt: string;
        closesAt: string;
    }>, "many">>>>;
    slotRules: z.ZodOptional<z.ZodDefault<z.ZodEffects<z.ZodObject<{
        minDurationMinutes: z.ZodDefault<z.ZodNumber>;
        maxDurationMinutes: z.ZodDefault<z.ZodNumber>;
        incrementMinutes: z.ZodDefault<z.ZodNumber>;
        bufferBeforeMinutes: z.ZodDefault<z.ZodNumber>;
        bufferAfterMinutes: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        minDurationMinutes: number;
        maxDurationMinutes: number;
        incrementMinutes: number;
        bufferBeforeMinutes: number;
        bufferAfterMinutes: number;
    }, {
        minDurationMinutes?: number | undefined;
        maxDurationMinutes?: number | undefined;
        incrementMinutes?: number | undefined;
        bufferBeforeMinutes?: number | undefined;
        bufferAfterMinutes?: number | undefined;
    }>, {
        minDurationMinutes: number;
        maxDurationMinutes: number;
        incrementMinutes: number;
        bufferBeforeMinutes: number;
        bufferAfterMinutes: number;
    }, {
        minDurationMinutes?: number | undefined;
        maxDurationMinutes?: number | undefined;
        incrementMinutes?: number | undefined;
        bufferBeforeMinutes?: number | undefined;
        bufferAfterMinutes?: number | undefined;
    }>>>;
    pricing: z.ZodOptional<z.ZodDefault<z.ZodObject<{
        amountCents: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        amountCents: number;
    }, {
        amountCents?: number | undefined;
    }>>>;
    paymentRequirement: z.ZodOptional<z.ZodDefault<z.ZodNativeEnum<{
        readonly Free: "free";
        readonly PayUpfront: "pay_upfront";
        readonly PayLater: "pay_later";
    }>>>;
    confirmationMode: z.ZodOptional<z.ZodDefault<z.ZodNativeEnum<{
        readonly Automatic: "automatic";
        readonly StaffApproval: "staff_approval";
    }>>>;
    cancellationPolicy: z.ZodOptional<z.ZodDefault<z.ZodObject<{
        cutoffMinutes: z.ZodDefault<z.ZodNumber>;
        feeCents: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        cutoffMinutes: number;
        feeCents: number;
    }, {
        cutoffMinutes?: number | undefined;
        feeCents?: number | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    capacity?: number | undefined;
    resourceType?: string | undefined;
    isBookable?: boolean | undefined;
    isExclusive?: boolean | undefined;
    amenities?: string[] | undefined;
    rentableHours?: Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", {
        opensAt: string;
        closesAt: string;
    }[]>> | undefined;
    slotRules?: {
        minDurationMinutes: number;
        maxDurationMinutes: number;
        incrementMinutes: number;
        bufferBeforeMinutes: number;
        bufferAfterMinutes: number;
    } | undefined;
    pricing?: {
        amountCents: number;
    } | undefined;
    paymentRequirement?: "free" | "pay_upfront" | "pay_later" | undefined;
    confirmationMode?: "automatic" | "staff_approval" | undefined;
    cancellationPolicy?: {
        cutoffMinutes: number;
        feeCents: number;
    } | undefined;
}, {
    name?: string | undefined;
    capacity?: number | undefined;
    resourceType?: string | undefined;
    isBookable?: boolean | undefined;
    isExclusive?: boolean | undefined;
    amenities?: string[] | undefined;
    rentableHours?: Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", {
        opensAt: string;
        closesAt: string;
    }[]>> | undefined;
    slotRules?: {
        minDurationMinutes?: number | undefined;
        maxDurationMinutes?: number | undefined;
        incrementMinutes?: number | undefined;
        bufferBeforeMinutes?: number | undefined;
        bufferAfterMinutes?: number | undefined;
    } | undefined;
    pricing?: {
        amountCents?: number | undefined;
    } | undefined;
    paymentRequirement?: "free" | "pay_upfront" | "pay_later" | undefined;
    confirmationMode?: "automatic" | "staff_approval" | undefined;
    cancellationPolicy?: {
        cutoffMinutes?: number | undefined;
        feeCents?: number | undefined;
    } | undefined;
}>, {
    name?: string | undefined;
    capacity?: number | undefined;
    resourceType?: string | undefined;
    isBookable?: boolean | undefined;
    isExclusive?: boolean | undefined;
    amenities?: string[] | undefined;
    rentableHours?: Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", {
        opensAt: string;
        closesAt: string;
    }[]>> | undefined;
    slotRules?: {
        minDurationMinutes: number;
        maxDurationMinutes: number;
        incrementMinutes: number;
        bufferBeforeMinutes: number;
        bufferAfterMinutes: number;
    } | undefined;
    pricing?: {
        amountCents: number;
    } | undefined;
    paymentRequirement?: "free" | "pay_upfront" | "pay_later" | undefined;
    confirmationMode?: "automatic" | "staff_approval" | undefined;
    cancellationPolicy?: {
        cutoffMinutes: number;
        feeCents: number;
    } | undefined;
}, {
    name?: string | undefined;
    capacity?: number | undefined;
    resourceType?: string | undefined;
    isBookable?: boolean | undefined;
    isExclusive?: boolean | undefined;
    amenities?: string[] | undefined;
    rentableHours?: Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", {
        opensAt: string;
        closesAt: string;
    }[]>> | undefined;
    slotRules?: {
        minDurationMinutes?: number | undefined;
        maxDurationMinutes?: number | undefined;
        incrementMinutes?: number | undefined;
        bufferBeforeMinutes?: number | undefined;
        bufferAfterMinutes?: number | undefined;
    } | undefined;
    pricing?: {
        amountCents?: number | undefined;
    } | undefined;
    paymentRequirement?: "free" | "pay_upfront" | "pay_later" | undefined;
    confirmationMode?: "automatic" | "staff_approval" | undefined;
    cancellationPolicy?: {
        cutoffMinutes?: number | undefined;
        feeCents?: number | undefined;
    } | undefined;
}>;
export declare const resourceAvailabilityQuerySchema: z.ZodEffects<z.ZodObject<{
    from: z.ZodString;
    to: z.ZodString;
}, "strip", z.ZodTypeAny, {
    from: string;
    to: string;
}, {
    from: string;
    to: string;
}>, {
    from: string;
    to: string;
}, {
    from: string;
    to: string;
}>;
export declare const classSessionResourceAllocationSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    resourceId: z.ZodString;
    startsAt: z.ZodOptional<z.ZodString>;
    endsAt: z.ZodOptional<z.ZodString>;
    overrideConflict: z.ZodDefault<z.ZodBoolean>;
    overrideReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    resourceId: string;
    overrideConflict: boolean;
    startsAt?: string | undefined;
    endsAt?: string | undefined;
    overrideReason?: string | undefined;
}, {
    resourceId: string;
    startsAt?: string | undefined;
    endsAt?: string | undefined;
    overrideReason?: string | undefined;
    overrideConflict?: boolean | undefined;
}>, {
    resourceId: string;
    overrideConflict: boolean;
    startsAt?: string | undefined;
    endsAt?: string | undefined;
    overrideReason?: string | undefined;
}, {
    resourceId: string;
    startsAt?: string | undefined;
    endsAt?: string | undefined;
    overrideReason?: string | undefined;
    overrideConflict?: boolean | undefined;
}>, {
    resourceId: string;
    overrideConflict: boolean;
    startsAt?: string | undefined;
    endsAt?: string | undefined;
    overrideReason?: string | undefined;
}, {
    resourceId: string;
    startsAt?: string | undefined;
    endsAt?: string | undefined;
    overrideReason?: string | undefined;
    overrideConflict?: boolean | undefined;
}>;
export declare const facilityReservationCreateSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    resourceId: z.ZodString;
    memberId: z.ZodString;
    startsAt: z.ZodString;
    endsAt: z.ZodString;
    overrideConflict: z.ZodDefault<z.ZodBoolean>;
    overrideReason: z.ZodOptional<z.ZodString>;
    paymentReference: z.ZodOptional<z.ZodString>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    startsAt: string;
    endsAt: string;
    memberId: string;
    resourceId: string;
    overrideConflict: boolean;
    note?: string | undefined;
    overrideReason?: string | undefined;
    paymentReference?: string | undefined;
}, {
    startsAt: string;
    endsAt: string;
    memberId: string;
    resourceId: string;
    note?: string | undefined;
    overrideReason?: string | undefined;
    overrideConflict?: boolean | undefined;
    paymentReference?: string | undefined;
}>, {
    startsAt: string;
    endsAt: string;
    memberId: string;
    resourceId: string;
    overrideConflict: boolean;
    note?: string | undefined;
    overrideReason?: string | undefined;
    paymentReference?: string | undefined;
}, {
    startsAt: string;
    endsAt: string;
    memberId: string;
    resourceId: string;
    note?: string | undefined;
    overrideReason?: string | undefined;
    overrideConflict?: boolean | undefined;
    paymentReference?: string | undefined;
}>, {
    startsAt: string;
    endsAt: string;
    memberId: string;
    resourceId: string;
    overrideConflict: boolean;
    note?: string | undefined;
    overrideReason?: string | undefined;
    paymentReference?: string | undefined;
}, {
    startsAt: string;
    endsAt: string;
    memberId: string;
    resourceId: string;
    note?: string | undefined;
    overrideReason?: string | undefined;
    overrideConflict?: boolean | undefined;
    paymentReference?: string | undefined;
}>;
export declare const facilityReservationCancelSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reason?: string | undefined;
}, {
    reason?: string | undefined;
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
export declare const permissionSchema: z.ZodNativeEnum<{
    readonly GymRead: "gym:read";
    readonly GymUpdate: "gym:update";
    readonly LocationRead: "location:read";
    readonly LocationCreate: "location:create";
    readonly LocationUpdate: "location:update";
    readonly LocationArchive: "location:archive";
    readonly StaffDirectoryView: "staff:directory_view";
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
    readonly ScheduleRead: "schedule:read";
    readonly ScheduleCreate: "schedule:create";
    readonly SchedulePublish: "schedule:publish";
    readonly ScheduleRequestsManage: "schedule:requests_manage";
    readonly ScheduleAutoResolve: "schedule:auto_resolve";
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
export type StaffClockInInput = z.infer<typeof staffClockInSchema>;
export type StaffClockOutInput = z.infer<typeof staffClockOutSchema>;
export type StaffSelfClockInInput = z.infer<typeof staffSelfClockInSchema>;
export type StaffSelfClockOutInput = z.infer<typeof staffSelfClockOutSchema>;
export type SchedulerCoverageRuleCreateInput = z.infer<typeof schedulerCoverageRuleCreateSchema>;
export type SchedulerAvailabilityCreateInput = z.infer<typeof schedulerAvailabilityCreateSchema>;
export type SchedulerSettingsUpdateInput = z.infer<typeof schedulerSettingsUpdateSchema>;
export type SchedulerPreferenceRequestCreateInput = z.infer<typeof schedulerPreferenceRequestCreateSchema>;
export type SchedulerPreferenceRequestResolveInput = z.infer<typeof schedulerPreferenceRequestResolveSchema>;
export type SchedulerRequestCreateInput = z.infer<typeof schedulerRequestCreateSchema>;
export type SchedulerGenerateInput = z.infer<typeof schedulerGenerateSchema>;
export type SchedulerPublishInput = z.infer<typeof schedulerPublishSchema>;
export type SchedulerRequestResolveInput = z.infer<typeof schedulerRequestResolveSchema>;
export type ConsumerCreateInput = z.input<typeof consumerCreateSchema>;
export type ConsumerUpdateInput = z.input<typeof consumerUpdateSchema>;
export type ConsumerProfileImageUploadInput = z.infer<typeof consumerProfileImageUploadSchema>;
export type PosPurchaseInput = z.infer<typeof posPurchaseSchema>;
export type PosStripeFinalizeInput = z.infer<typeof posStripeFinalizeSchema>;
export type MemberCreateInput = z.input<typeof memberCreateSchema>;
export type MemberUpdateInput = z.input<typeof memberUpdateSchema>;
export type MembershipPlanCreateInput = z.infer<typeof membershipPlanCreateSchema>;
export type MembershipPlanUpdateInput = z.infer<typeof membershipPlanUpdateSchema>;
export type MemberMembershipAssignInput = z.infer<typeof memberMembershipAssignSchema>;
export type ClassTypeCreateInput = z.infer<typeof classTypeCreateSchema>;
export type ClassSessionCreateInput = z.input<typeof classSessionCreateSchema>;
export type ClassBookingCreateInput = z.infer<typeof classBookingCreateSchema>;
export type StaffManualBookingInput = z.infer<typeof staffManualBookingSchema>;
export type WaitlistJoinInput = z.infer<typeof waitlistJoinSchema>;
export type ResourceCreateInput = z.input<typeof resourceCreateSchema>;
export type ResourceUpdateInput = z.input<typeof resourceUpdateSchema>;
export type ResourceAvailabilityQueryInput = z.infer<typeof resourceAvailabilityQuerySchema>;
export type ClassSessionResourceAllocationInput = z.input<typeof classSessionResourceAllocationSchema>;
export type FacilityReservationCreateInput = z.input<typeof facilityReservationCreateSchema>;
export type FacilityReservationCancelInput = z.infer<typeof facilityReservationCancelSchema>;
export type CheckInCreateInput = z.input<typeof checkInCreateSchema>;
export type AccessDeviceCreateInput = z.input<typeof accessDeviceCreateSchema>;
export type AccessRuleCreateInput = z.input<typeof accessRuleCreateSchema>;
export type AccessDeviceEventInput = z.input<typeof accessDeviceEventSchema>;
export type AccessDeviceHeartbeatInput = z.input<typeof accessDeviceHeartbeatSchema>;
//# sourceMappingURL=index.d.ts.map