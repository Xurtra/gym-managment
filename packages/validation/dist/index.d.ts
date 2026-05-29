import { z } from "zod";
export declare const emailSchema: z.ZodEffects<z.ZodString, string, string>;
export declare const passwordSchema: z.ZodString;
export declare function formatZodIssues(issues: {
    path: (string | number)[];
    message: string;
}[]): string;
export declare const migrationChecklistSchema: z.ZodObject<{
    currentSoftware: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    items: z.ZodDefault<z.ZodObject<{
        memberList: z.ZodDefault<z.ZodBoolean>;
        activeMemberships: z.ZodDefault<z.ZodBoolean>;
        billingDates: z.ZodDefault<z.ZodBoolean>;
        paymentStatus: z.ZodDefault<z.ZodBoolean>;
        attendanceHistory: z.ZodDefault<z.ZodBoolean>;
        classSchedules: z.ZodDefault<z.ZodBoolean>;
        appointments: z.ZodDefault<z.ZodBoolean>;
        staffList: z.ZodDefault<z.ZodBoolean>;
        staffRoles: z.ZodDefault<z.ZodBoolean>;
        waiversDocuments: z.ZodDefault<z.ZodBoolean>;
        notesTags: z.ZodDefault<z.ZodBoolean>;
        productsPackages: z.ZodDefault<z.ZodBoolean>;
        paymentMethods: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        memberList: boolean;
        activeMemberships: boolean;
        billingDates: boolean;
        paymentStatus: boolean;
        attendanceHistory: boolean;
        classSchedules: boolean;
        appointments: boolean;
        staffList: boolean;
        staffRoles: boolean;
        waiversDocuments: boolean;
        notesTags: boolean;
        productsPackages: boolean;
        paymentMethods: boolean;
    }, {
        memberList?: boolean | undefined;
        activeMemberships?: boolean | undefined;
        billingDates?: boolean | undefined;
        paymentStatus?: boolean | undefined;
        attendanceHistory?: boolean | undefined;
        classSchedules?: boolean | undefined;
        appointments?: boolean | undefined;
        staffList?: boolean | undefined;
        staffRoles?: boolean | undefined;
        waiversDocuments?: boolean | undefined;
        notesTags?: boolean | undefined;
        productsPackages?: boolean | undefined;
        paymentMethods?: boolean | undefined;
    }>>;
    details: z.ZodOptional<z.ZodRecord<z.ZodEnum<["memberList", "activeMemberships", "billingDates", "paymentStatus", "attendanceHistory", "classSchedules", "appointments", "staffList", "staffRoles", "waiversDocuments", "notesTags", "productsPackages", "paymentMethods"]>, z.ZodObject<{
        sourceType: z.ZodDefault<z.ZodEnum<["unknown", "csv_excel", "pdf_document", "api_export", "manual_entry", "old_system_report", "not_available"]>>;
        sourceName: z.ZodOptional<z.ZodString>;
        fieldNotes: z.ZodOptional<z.ZodString>;
        importNotes: z.ZodOptional<z.ZodString>;
        uploads: z.ZodOptional<z.ZodArray<z.ZodObject<{
            fileName: z.ZodString;
            contentType: z.ZodDefault<z.ZodString>;
            sizeBytes: z.ZodNumber;
            base64Data: z.ZodString;
            textPreview: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            fileName: string;
            contentType: string;
            sizeBytes: number;
            base64Data: string;
            textPreview?: string | undefined;
        }, {
            fileName: string;
            sizeBytes: number;
            base64Data: string;
            contentType?: string | undefined;
            textPreview?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        sourceType: "unknown" | "csv_excel" | "pdf_document" | "api_export" | "manual_entry" | "old_system_report" | "not_available";
        sourceName?: string | undefined;
        fieldNotes?: string | undefined;
        importNotes?: string | undefined;
        uploads?: {
            fileName: string;
            contentType: string;
            sizeBytes: number;
            base64Data: string;
            textPreview?: string | undefined;
        }[] | undefined;
    }, {
        sourceType?: "unknown" | "csv_excel" | "pdf_document" | "api_export" | "manual_entry" | "old_system_report" | "not_available" | undefined;
        sourceName?: string | undefined;
        fieldNotes?: string | undefined;
        importNotes?: string | undefined;
        uploads?: {
            fileName: string;
            sizeBytes: number;
            base64Data: string;
            contentType?: string | undefined;
            textPreview?: string | undefined;
        }[] | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    items: {
        memberList: boolean;
        activeMemberships: boolean;
        billingDates: boolean;
        paymentStatus: boolean;
        attendanceHistory: boolean;
        classSchedules: boolean;
        appointments: boolean;
        staffList: boolean;
        staffRoles: boolean;
        waiversDocuments: boolean;
        notesTags: boolean;
        productsPackages: boolean;
        paymentMethods: boolean;
    };
    currentSoftware?: string | undefined;
    notes?: string | undefined;
    details?: Partial<Record<"memberList" | "activeMemberships" | "billingDates" | "paymentStatus" | "attendanceHistory" | "classSchedules" | "appointments" | "staffList" | "staffRoles" | "waiversDocuments" | "notesTags" | "productsPackages" | "paymentMethods", {
        sourceType: "unknown" | "csv_excel" | "pdf_document" | "api_export" | "manual_entry" | "old_system_report" | "not_available";
        sourceName?: string | undefined;
        fieldNotes?: string | undefined;
        importNotes?: string | undefined;
        uploads?: {
            fileName: string;
            contentType: string;
            sizeBytes: number;
            base64Data: string;
            textPreview?: string | undefined;
        }[] | undefined;
    }>> | undefined;
}, {
    currentSoftware?: string | undefined;
    notes?: string | undefined;
    items?: {
        memberList?: boolean | undefined;
        activeMemberships?: boolean | undefined;
        billingDates?: boolean | undefined;
        paymentStatus?: boolean | undefined;
        attendanceHistory?: boolean | undefined;
        classSchedules?: boolean | undefined;
        appointments?: boolean | undefined;
        staffList?: boolean | undefined;
        staffRoles?: boolean | undefined;
        waiversDocuments?: boolean | undefined;
        notesTags?: boolean | undefined;
        productsPackages?: boolean | undefined;
        paymentMethods?: boolean | undefined;
    } | undefined;
    details?: Partial<Record<"memberList" | "activeMemberships" | "billingDates" | "paymentStatus" | "attendanceHistory" | "classSchedules" | "appointments" | "staffList" | "staffRoles" | "waiversDocuments" | "notesTags" | "productsPackages" | "paymentMethods", {
        sourceType?: "unknown" | "csv_excel" | "pdf_document" | "api_export" | "manual_entry" | "old_system_report" | "not_available" | undefined;
        sourceName?: string | undefined;
        fieldNotes?: string | undefined;
        importNotes?: string | undefined;
        uploads?: {
            fileName: string;
            sizeBytes: number;
            base64Data: string;
            contentType?: string | undefined;
            textPreview?: string | undefined;
        }[] | undefined;
    }>> | undefined;
}>;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodString, string, string>;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    gymName: z.ZodOptional<z.ZodString>;
    migrationChecklist: z.ZodOptional<z.ZodObject<{
        currentSoftware: z.ZodOptional<z.ZodString>;
        notes: z.ZodOptional<z.ZodString>;
        items: z.ZodDefault<z.ZodObject<{
            memberList: z.ZodDefault<z.ZodBoolean>;
            activeMemberships: z.ZodDefault<z.ZodBoolean>;
            billingDates: z.ZodDefault<z.ZodBoolean>;
            paymentStatus: z.ZodDefault<z.ZodBoolean>;
            attendanceHistory: z.ZodDefault<z.ZodBoolean>;
            classSchedules: z.ZodDefault<z.ZodBoolean>;
            appointments: z.ZodDefault<z.ZodBoolean>;
            staffList: z.ZodDefault<z.ZodBoolean>;
            staffRoles: z.ZodDefault<z.ZodBoolean>;
            waiversDocuments: z.ZodDefault<z.ZodBoolean>;
            notesTags: z.ZodDefault<z.ZodBoolean>;
            productsPackages: z.ZodDefault<z.ZodBoolean>;
            paymentMethods: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            memberList: boolean;
            activeMemberships: boolean;
            billingDates: boolean;
            paymentStatus: boolean;
            attendanceHistory: boolean;
            classSchedules: boolean;
            appointments: boolean;
            staffList: boolean;
            staffRoles: boolean;
            waiversDocuments: boolean;
            notesTags: boolean;
            productsPackages: boolean;
            paymentMethods: boolean;
        }, {
            memberList?: boolean | undefined;
            activeMemberships?: boolean | undefined;
            billingDates?: boolean | undefined;
            paymentStatus?: boolean | undefined;
            attendanceHistory?: boolean | undefined;
            classSchedules?: boolean | undefined;
            appointments?: boolean | undefined;
            staffList?: boolean | undefined;
            staffRoles?: boolean | undefined;
            waiversDocuments?: boolean | undefined;
            notesTags?: boolean | undefined;
            productsPackages?: boolean | undefined;
            paymentMethods?: boolean | undefined;
        }>>;
        details: z.ZodOptional<z.ZodRecord<z.ZodEnum<["memberList", "activeMemberships", "billingDates", "paymentStatus", "attendanceHistory", "classSchedules", "appointments", "staffList", "staffRoles", "waiversDocuments", "notesTags", "productsPackages", "paymentMethods"]>, z.ZodObject<{
            sourceType: z.ZodDefault<z.ZodEnum<["unknown", "csv_excel", "pdf_document", "api_export", "manual_entry", "old_system_report", "not_available"]>>;
            sourceName: z.ZodOptional<z.ZodString>;
            fieldNotes: z.ZodOptional<z.ZodString>;
            importNotes: z.ZodOptional<z.ZodString>;
            uploads: z.ZodOptional<z.ZodArray<z.ZodObject<{
                fileName: z.ZodString;
                contentType: z.ZodDefault<z.ZodString>;
                sizeBytes: z.ZodNumber;
                base64Data: z.ZodString;
                textPreview: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                fileName: string;
                contentType: string;
                sizeBytes: number;
                base64Data: string;
                textPreview?: string | undefined;
            }, {
                fileName: string;
                sizeBytes: number;
                base64Data: string;
                contentType?: string | undefined;
                textPreview?: string | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            sourceType: "unknown" | "csv_excel" | "pdf_document" | "api_export" | "manual_entry" | "old_system_report" | "not_available";
            sourceName?: string | undefined;
            fieldNotes?: string | undefined;
            importNotes?: string | undefined;
            uploads?: {
                fileName: string;
                contentType: string;
                sizeBytes: number;
                base64Data: string;
                textPreview?: string | undefined;
            }[] | undefined;
        }, {
            sourceType?: "unknown" | "csv_excel" | "pdf_document" | "api_export" | "manual_entry" | "old_system_report" | "not_available" | undefined;
            sourceName?: string | undefined;
            fieldNotes?: string | undefined;
            importNotes?: string | undefined;
            uploads?: {
                fileName: string;
                sizeBytes: number;
                base64Data: string;
                contentType?: string | undefined;
                textPreview?: string | undefined;
            }[] | undefined;
        }>>>;
    }, "strip", z.ZodTypeAny, {
        items: {
            memberList: boolean;
            activeMemberships: boolean;
            billingDates: boolean;
            paymentStatus: boolean;
            attendanceHistory: boolean;
            classSchedules: boolean;
            appointments: boolean;
            staffList: boolean;
            staffRoles: boolean;
            waiversDocuments: boolean;
            notesTags: boolean;
            productsPackages: boolean;
            paymentMethods: boolean;
        };
        currentSoftware?: string | undefined;
        notes?: string | undefined;
        details?: Partial<Record<"memberList" | "activeMemberships" | "billingDates" | "paymentStatus" | "attendanceHistory" | "classSchedules" | "appointments" | "staffList" | "staffRoles" | "waiversDocuments" | "notesTags" | "productsPackages" | "paymentMethods", {
            sourceType: "unknown" | "csv_excel" | "pdf_document" | "api_export" | "manual_entry" | "old_system_report" | "not_available";
            sourceName?: string | undefined;
            fieldNotes?: string | undefined;
            importNotes?: string | undefined;
            uploads?: {
                fileName: string;
                contentType: string;
                sizeBytes: number;
                base64Data: string;
                textPreview?: string | undefined;
            }[] | undefined;
        }>> | undefined;
    }, {
        currentSoftware?: string | undefined;
        notes?: string | undefined;
        items?: {
            memberList?: boolean | undefined;
            activeMemberships?: boolean | undefined;
            billingDates?: boolean | undefined;
            paymentStatus?: boolean | undefined;
            attendanceHistory?: boolean | undefined;
            classSchedules?: boolean | undefined;
            appointments?: boolean | undefined;
            staffList?: boolean | undefined;
            staffRoles?: boolean | undefined;
            waiversDocuments?: boolean | undefined;
            notesTags?: boolean | undefined;
            productsPackages?: boolean | undefined;
            paymentMethods?: boolean | undefined;
        } | undefined;
        details?: Partial<Record<"memberList" | "activeMemberships" | "billingDates" | "paymentStatus" | "attendanceHistory" | "classSchedules" | "appointments" | "staffList" | "staffRoles" | "waiversDocuments" | "notesTags" | "productsPackages" | "paymentMethods", {
            sourceType?: "unknown" | "csv_excel" | "pdf_document" | "api_export" | "manual_entry" | "old_system_report" | "not_available" | undefined;
            sourceName?: string | undefined;
            fieldNotes?: string | undefined;
            importNotes?: string | undefined;
            uploads?: {
                fileName: string;
                sizeBytes: number;
                base64Data: string;
                contentType?: string | undefined;
                textPreview?: string | undefined;
            }[] | undefined;
        }>> | undefined;
    }>>;
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
    migrationChecklist?: {
        items: {
            memberList: boolean;
            activeMemberships: boolean;
            billingDates: boolean;
            paymentStatus: boolean;
            attendanceHistory: boolean;
            classSchedules: boolean;
            appointments: boolean;
            staffList: boolean;
            staffRoles: boolean;
            waiversDocuments: boolean;
            notesTags: boolean;
            productsPackages: boolean;
            paymentMethods: boolean;
        };
        currentSoftware?: string | undefined;
        notes?: string | undefined;
        details?: Partial<Record<"memberList" | "activeMemberships" | "billingDates" | "paymentStatus" | "attendanceHistory" | "classSchedules" | "appointments" | "staffList" | "staffRoles" | "waiversDocuments" | "notesTags" | "productsPackages" | "paymentMethods", {
            sourceType: "unknown" | "csv_excel" | "pdf_document" | "api_export" | "manual_entry" | "old_system_report" | "not_available";
            sourceName?: string | undefined;
            fieldNotes?: string | undefined;
            importNotes?: string | undefined;
            uploads?: {
                fileName: string;
                contentType: string;
                sizeBytes: number;
                base64Data: string;
                textPreview?: string | undefined;
            }[] | undefined;
        }>> | undefined;
    } | undefined;
}, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    gymName?: string | undefined;
    migrationChecklist?: {
        currentSoftware?: string | undefined;
        notes?: string | undefined;
        items?: {
            memberList?: boolean | undefined;
            activeMemberships?: boolean | undefined;
            billingDates?: boolean | undefined;
            paymentStatus?: boolean | undefined;
            attendanceHistory?: boolean | undefined;
            classSchedules?: boolean | undefined;
            appointments?: boolean | undefined;
            staffList?: boolean | undefined;
            staffRoles?: boolean | undefined;
            waiversDocuments?: boolean | undefined;
            notesTags?: boolean | undefined;
            productsPackages?: boolean | undefined;
            paymentMethods?: boolean | undefined;
        } | undefined;
        details?: Partial<Record<"memberList" | "activeMemberships" | "billingDates" | "paymentStatus" | "attendanceHistory" | "classSchedules" | "appointments" | "staffList" | "staffRoles" | "waiversDocuments" | "notesTags" | "productsPackages" | "paymentMethods", {
            sourceType?: "unknown" | "csv_excel" | "pdf_document" | "api_export" | "manual_entry" | "old_system_report" | "not_available" | undefined;
            sourceName?: string | undefined;
            fieldNotes?: string | undefined;
            importNotes?: string | undefined;
            uploads?: {
                fileName: string;
                sizeBytes: number;
                base64Data: string;
                contentType?: string | undefined;
                textPreview?: string | undefined;
            }[] | undefined;
        }>> | undefined;
    } | undefined;
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
    migrationChecklist: z.ZodOptional<z.ZodObject<{
        currentSoftware: z.ZodOptional<z.ZodString>;
        notes: z.ZodOptional<z.ZodString>;
        items: z.ZodDefault<z.ZodObject<{
            memberList: z.ZodDefault<z.ZodBoolean>;
            activeMemberships: z.ZodDefault<z.ZodBoolean>;
            billingDates: z.ZodDefault<z.ZodBoolean>;
            paymentStatus: z.ZodDefault<z.ZodBoolean>;
            attendanceHistory: z.ZodDefault<z.ZodBoolean>;
            classSchedules: z.ZodDefault<z.ZodBoolean>;
            appointments: z.ZodDefault<z.ZodBoolean>;
            staffList: z.ZodDefault<z.ZodBoolean>;
            staffRoles: z.ZodDefault<z.ZodBoolean>;
            waiversDocuments: z.ZodDefault<z.ZodBoolean>;
            notesTags: z.ZodDefault<z.ZodBoolean>;
            productsPackages: z.ZodDefault<z.ZodBoolean>;
            paymentMethods: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            memberList: boolean;
            activeMemberships: boolean;
            billingDates: boolean;
            paymentStatus: boolean;
            attendanceHistory: boolean;
            classSchedules: boolean;
            appointments: boolean;
            staffList: boolean;
            staffRoles: boolean;
            waiversDocuments: boolean;
            notesTags: boolean;
            productsPackages: boolean;
            paymentMethods: boolean;
        }, {
            memberList?: boolean | undefined;
            activeMemberships?: boolean | undefined;
            billingDates?: boolean | undefined;
            paymentStatus?: boolean | undefined;
            attendanceHistory?: boolean | undefined;
            classSchedules?: boolean | undefined;
            appointments?: boolean | undefined;
            staffList?: boolean | undefined;
            staffRoles?: boolean | undefined;
            waiversDocuments?: boolean | undefined;
            notesTags?: boolean | undefined;
            productsPackages?: boolean | undefined;
            paymentMethods?: boolean | undefined;
        }>>;
        details: z.ZodOptional<z.ZodRecord<z.ZodEnum<["memberList", "activeMemberships", "billingDates", "paymentStatus", "attendanceHistory", "classSchedules", "appointments", "staffList", "staffRoles", "waiversDocuments", "notesTags", "productsPackages", "paymentMethods"]>, z.ZodObject<{
            sourceType: z.ZodDefault<z.ZodEnum<["unknown", "csv_excel", "pdf_document", "api_export", "manual_entry", "old_system_report", "not_available"]>>;
            sourceName: z.ZodOptional<z.ZodString>;
            fieldNotes: z.ZodOptional<z.ZodString>;
            importNotes: z.ZodOptional<z.ZodString>;
            uploads: z.ZodOptional<z.ZodArray<z.ZodObject<{
                fileName: z.ZodString;
                contentType: z.ZodDefault<z.ZodString>;
                sizeBytes: z.ZodNumber;
                base64Data: z.ZodString;
                textPreview: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                fileName: string;
                contentType: string;
                sizeBytes: number;
                base64Data: string;
                textPreview?: string | undefined;
            }, {
                fileName: string;
                sizeBytes: number;
                base64Data: string;
                contentType?: string | undefined;
                textPreview?: string | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            sourceType: "unknown" | "csv_excel" | "pdf_document" | "api_export" | "manual_entry" | "old_system_report" | "not_available";
            sourceName?: string | undefined;
            fieldNotes?: string | undefined;
            importNotes?: string | undefined;
            uploads?: {
                fileName: string;
                contentType: string;
                sizeBytes: number;
                base64Data: string;
                textPreview?: string | undefined;
            }[] | undefined;
        }, {
            sourceType?: "unknown" | "csv_excel" | "pdf_document" | "api_export" | "manual_entry" | "old_system_report" | "not_available" | undefined;
            sourceName?: string | undefined;
            fieldNotes?: string | undefined;
            importNotes?: string | undefined;
            uploads?: {
                fileName: string;
                sizeBytes: number;
                base64Data: string;
                contentType?: string | undefined;
                textPreview?: string | undefined;
            }[] | undefined;
        }>>>;
    }, "strip", z.ZodTypeAny, {
        items: {
            memberList: boolean;
            activeMemberships: boolean;
            billingDates: boolean;
            paymentStatus: boolean;
            attendanceHistory: boolean;
            classSchedules: boolean;
            appointments: boolean;
            staffList: boolean;
            staffRoles: boolean;
            waiversDocuments: boolean;
            notesTags: boolean;
            productsPackages: boolean;
            paymentMethods: boolean;
        };
        currentSoftware?: string | undefined;
        notes?: string | undefined;
        details?: Partial<Record<"memberList" | "activeMemberships" | "billingDates" | "paymentStatus" | "attendanceHistory" | "classSchedules" | "appointments" | "staffList" | "staffRoles" | "waiversDocuments" | "notesTags" | "productsPackages" | "paymentMethods", {
            sourceType: "unknown" | "csv_excel" | "pdf_document" | "api_export" | "manual_entry" | "old_system_report" | "not_available";
            sourceName?: string | undefined;
            fieldNotes?: string | undefined;
            importNotes?: string | undefined;
            uploads?: {
                fileName: string;
                contentType: string;
                sizeBytes: number;
                base64Data: string;
                textPreview?: string | undefined;
            }[] | undefined;
        }>> | undefined;
    }, {
        currentSoftware?: string | undefined;
        notes?: string | undefined;
        items?: {
            memberList?: boolean | undefined;
            activeMemberships?: boolean | undefined;
            billingDates?: boolean | undefined;
            paymentStatus?: boolean | undefined;
            attendanceHistory?: boolean | undefined;
            classSchedules?: boolean | undefined;
            appointments?: boolean | undefined;
            staffList?: boolean | undefined;
            staffRoles?: boolean | undefined;
            waiversDocuments?: boolean | undefined;
            notesTags?: boolean | undefined;
            productsPackages?: boolean | undefined;
            paymentMethods?: boolean | undefined;
        } | undefined;
        details?: Partial<Record<"memberList" | "activeMemberships" | "billingDates" | "paymentStatus" | "attendanceHistory" | "classSchedules" | "appointments" | "staffList" | "staffRoles" | "waiversDocuments" | "notesTags" | "productsPackages" | "paymentMethods", {
            sourceType?: "unknown" | "csv_excel" | "pdf_document" | "api_export" | "manual_entry" | "old_system_report" | "not_available" | undefined;
            sourceName?: string | undefined;
            fieldNotes?: string | undefined;
            importNotes?: string | undefined;
            uploads?: {
                fileName: string;
                sizeBytes: number;
                base64Data: string;
                contentType?: string | undefined;
                textPreview?: string | undefined;
            }[] | undefined;
        }>> | undefined;
    }>>;
    featureFlags: z.ZodDefault<z.ZodArray<z.ZodNativeEnum<{
        readonly OnlineSignup: "online_signup";
        readonly ClassBooking: "class_booking";
        readonly PersonalTraining: "personal_training";
        readonly MemberPortal: "member_portal";
        readonly WebsiteBuilder: "website_builder";
        readonly PointOfSale: "point_of_sale";
        readonly AccessControl: "access_control";
        readonly AnonymousWalkInPos: "anonymous_walk_in_pos";
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    timezone: string;
    locale: string;
    name: string;
    featureFlags: ("online_signup" | "class_booking" | "personal_training" | "member_portal" | "website_builder" | "point_of_sale" | "access_control" | "anonymous_walk_in_pos")[];
    migrationChecklist?: {
        items: {
            memberList: boolean;
            activeMemberships: boolean;
            billingDates: boolean;
            paymentStatus: boolean;
            attendanceHistory: boolean;
            classSchedules: boolean;
            appointments: boolean;
            staffList: boolean;
            staffRoles: boolean;
            waiversDocuments: boolean;
            notesTags: boolean;
            productsPackages: boolean;
            paymentMethods: boolean;
        };
        currentSoftware?: string | undefined;
        notes?: string | undefined;
        details?: Partial<Record<"memberList" | "activeMemberships" | "billingDates" | "paymentStatus" | "attendanceHistory" | "classSchedules" | "appointments" | "staffList" | "staffRoles" | "waiversDocuments" | "notesTags" | "productsPackages" | "paymentMethods", {
            sourceType: "unknown" | "csv_excel" | "pdf_document" | "api_export" | "manual_entry" | "old_system_report" | "not_available";
            sourceName?: string | undefined;
            fieldNotes?: string | undefined;
            importNotes?: string | undefined;
            uploads?: {
                fileName: string;
                contentType: string;
                sizeBytes: number;
                base64Data: string;
                textPreview?: string | undefined;
            }[] | undefined;
        }>> | undefined;
    } | undefined;
    slug?: string | undefined;
}, {
    name: string;
    migrationChecklist?: {
        currentSoftware?: string | undefined;
        notes?: string | undefined;
        items?: {
            memberList?: boolean | undefined;
            activeMemberships?: boolean | undefined;
            billingDates?: boolean | undefined;
            paymentStatus?: boolean | undefined;
            attendanceHistory?: boolean | undefined;
            classSchedules?: boolean | undefined;
            appointments?: boolean | undefined;
            staffList?: boolean | undefined;
            staffRoles?: boolean | undefined;
            waiversDocuments?: boolean | undefined;
            notesTags?: boolean | undefined;
            productsPackages?: boolean | undefined;
            paymentMethods?: boolean | undefined;
        } | undefined;
        details?: Partial<Record<"memberList" | "activeMemberships" | "billingDates" | "paymentStatus" | "attendanceHistory" | "classSchedules" | "appointments" | "staffList" | "staffRoles" | "waiversDocuments" | "notesTags" | "productsPackages" | "paymentMethods", {
            sourceType?: "unknown" | "csv_excel" | "pdf_document" | "api_export" | "manual_entry" | "old_system_report" | "not_available" | undefined;
            sourceName?: string | undefined;
            fieldNotes?: string | undefined;
            importNotes?: string | undefined;
            uploads?: {
                fileName: string;
                sizeBytes: number;
                base64Data: string;
                contentType?: string | undefined;
                textPreview?: string | undefined;
            }[] | undefined;
        }>> | undefined;
    } | undefined;
    timezone?: string | undefined;
    locale?: string | undefined;
    slug?: string | undefined;
    featureFlags?: ("online_signup" | "class_booking" | "personal_training" | "member_portal" | "website_builder" | "point_of_sale" | "access_control" | "anonymous_walk_in_pos")[] | undefined;
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
export declare const studioResourceTypeSchema: z.ZodEnum<["sauna", "cold_plunge", "red_light", "compression", "float", "stretch_table", "recovery_room", "other"]>;
export declare const studioSetupStepSchema: z.ZodEnum<["profile", "rooms_devices", "services", "first_csv", "first_revenue_plan"]>;
export declare const studioSettingsSchema: z.ZodObject<{
    businessType: z.ZodOptional<z.ZodString>;
    defaultBufferMinutes: z.ZodOptional<z.ZodNumber>;
    averageSessionPriceCents: z.ZodOptional<z.ZodNumber>;
    softwareMonthlyCostCents: z.ZodOptional<z.ZodNumber>;
    targetMonthlyRevenueCents: z.ZodOptional<z.ZodNumber>;
    resourceTypesUsed: z.ZodOptional<z.ZodArray<z.ZodEnum<["sauna", "cold_plunge", "red_light", "compression", "float", "stretch_table", "recovery_room", "other"]>, "many">>;
}, "strip", z.ZodTypeAny, {
    businessType?: string | undefined;
    defaultBufferMinutes?: number | undefined;
    averageSessionPriceCents?: number | undefined;
    softwareMonthlyCostCents?: number | undefined;
    targetMonthlyRevenueCents?: number | undefined;
    resourceTypesUsed?: ("float" | "sauna" | "cold_plunge" | "red_light" | "compression" | "stretch_table" | "recovery_room" | "other")[] | undefined;
}, {
    businessType?: string | undefined;
    defaultBufferMinutes?: number | undefined;
    averageSessionPriceCents?: number | undefined;
    softwareMonthlyCostCents?: number | undefined;
    targetMonthlyRevenueCents?: number | undefined;
    resourceTypesUsed?: ("float" | "sauna" | "cold_plunge" | "red_light" | "compression" | "stretch_table" | "recovery_room" | "other")[] | undefined;
}>;
export declare const studioSetupWizardSchema: z.ZodObject<{
    currentStep: z.ZodOptional<z.ZodEnum<["profile", "rooms_devices", "services", "first_csv", "first_revenue_plan"]>>;
    completedSteps: z.ZodOptional<z.ZodArray<z.ZodEnum<["profile", "rooms_devices", "services", "first_csv", "first_revenue_plan"]>, "many">>;
    completedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    currentStep?: "profile" | "rooms_devices" | "services" | "first_csv" | "first_revenue_plan" | undefined;
    completedSteps?: ("profile" | "rooms_devices" | "services" | "first_csv" | "first_revenue_plan")[] | undefined;
    completedAt?: Date | undefined;
}, {
    currentStep?: "profile" | "rooms_devices" | "services" | "first_csv" | "first_revenue_plan" | undefined;
    completedSteps?: ("profile" | "rooms_devices" | "services" | "first_csv" | "first_revenue_plan")[] | undefined;
    completedAt?: Date | undefined;
}>;
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
    studioSettings: z.ZodOptional<z.ZodObject<{
        businessType: z.ZodOptional<z.ZodString>;
        defaultBufferMinutes: z.ZodOptional<z.ZodNumber>;
        averageSessionPriceCents: z.ZodOptional<z.ZodNumber>;
        softwareMonthlyCostCents: z.ZodOptional<z.ZodNumber>;
        targetMonthlyRevenueCents: z.ZodOptional<z.ZodNumber>;
        resourceTypesUsed: z.ZodOptional<z.ZodArray<z.ZodEnum<["sauna", "cold_plunge", "red_light", "compression", "float", "stretch_table", "recovery_room", "other"]>, "many">>;
    }, "strip", z.ZodTypeAny, {
        businessType?: string | undefined;
        defaultBufferMinutes?: number | undefined;
        averageSessionPriceCents?: number | undefined;
        softwareMonthlyCostCents?: number | undefined;
        targetMonthlyRevenueCents?: number | undefined;
        resourceTypesUsed?: ("float" | "sauna" | "cold_plunge" | "red_light" | "compression" | "stretch_table" | "recovery_room" | "other")[] | undefined;
    }, {
        businessType?: string | undefined;
        defaultBufferMinutes?: number | undefined;
        averageSessionPriceCents?: number | undefined;
        softwareMonthlyCostCents?: number | undefined;
        targetMonthlyRevenueCents?: number | undefined;
        resourceTypesUsed?: ("float" | "sauna" | "cold_plunge" | "red_light" | "compression" | "stretch_table" | "recovery_room" | "other")[] | undefined;
    }>>;
    setupWizard: z.ZodOptional<z.ZodObject<{
        currentStep: z.ZodOptional<z.ZodEnum<["profile", "rooms_devices", "services", "first_csv", "first_revenue_plan"]>>;
        completedSteps: z.ZodOptional<z.ZodArray<z.ZodEnum<["profile", "rooms_devices", "services", "first_csv", "first_revenue_plan"]>, "many">>;
        completedAt: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        currentStep?: "profile" | "rooms_devices" | "services" | "first_csv" | "first_revenue_plan" | undefined;
        completedSteps?: ("profile" | "rooms_devices" | "services" | "first_csv" | "first_revenue_plan")[] | undefined;
        completedAt?: Date | undefined;
    }, {
        currentStep?: "profile" | "rooms_devices" | "services" | "first_csv" | "first_revenue_plan" | undefined;
        completedSteps?: ("profile" | "rooms_devices" | "services" | "first_csv" | "first_revenue_plan")[] | undefined;
        completedAt?: Date | undefined;
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
        readonly AnonymousWalkInPos: "anonymous_walk_in_pos";
    }>, "many">>;
    onboardingCompletedSteps: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    migrationChecklist: z.ZodOptional<z.ZodObject<{
        currentSoftware: z.ZodOptional<z.ZodString>;
        notes: z.ZodOptional<z.ZodString>;
        items: z.ZodDefault<z.ZodObject<{
            memberList: z.ZodDefault<z.ZodBoolean>;
            activeMemberships: z.ZodDefault<z.ZodBoolean>;
            billingDates: z.ZodDefault<z.ZodBoolean>;
            paymentStatus: z.ZodDefault<z.ZodBoolean>;
            attendanceHistory: z.ZodDefault<z.ZodBoolean>;
            classSchedules: z.ZodDefault<z.ZodBoolean>;
            appointments: z.ZodDefault<z.ZodBoolean>;
            staffList: z.ZodDefault<z.ZodBoolean>;
            staffRoles: z.ZodDefault<z.ZodBoolean>;
            waiversDocuments: z.ZodDefault<z.ZodBoolean>;
            notesTags: z.ZodDefault<z.ZodBoolean>;
            productsPackages: z.ZodDefault<z.ZodBoolean>;
            paymentMethods: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            memberList: boolean;
            activeMemberships: boolean;
            billingDates: boolean;
            paymentStatus: boolean;
            attendanceHistory: boolean;
            classSchedules: boolean;
            appointments: boolean;
            staffList: boolean;
            staffRoles: boolean;
            waiversDocuments: boolean;
            notesTags: boolean;
            productsPackages: boolean;
            paymentMethods: boolean;
        }, {
            memberList?: boolean | undefined;
            activeMemberships?: boolean | undefined;
            billingDates?: boolean | undefined;
            paymentStatus?: boolean | undefined;
            attendanceHistory?: boolean | undefined;
            classSchedules?: boolean | undefined;
            appointments?: boolean | undefined;
            staffList?: boolean | undefined;
            staffRoles?: boolean | undefined;
            waiversDocuments?: boolean | undefined;
            notesTags?: boolean | undefined;
            productsPackages?: boolean | undefined;
            paymentMethods?: boolean | undefined;
        }>>;
        details: z.ZodOptional<z.ZodRecord<z.ZodEnum<["memberList", "activeMemberships", "billingDates", "paymentStatus", "attendanceHistory", "classSchedules", "appointments", "staffList", "staffRoles", "waiversDocuments", "notesTags", "productsPackages", "paymentMethods"]>, z.ZodObject<{
            sourceType: z.ZodDefault<z.ZodEnum<["unknown", "csv_excel", "pdf_document", "api_export", "manual_entry", "old_system_report", "not_available"]>>;
            sourceName: z.ZodOptional<z.ZodString>;
            fieldNotes: z.ZodOptional<z.ZodString>;
            importNotes: z.ZodOptional<z.ZodString>;
            uploads: z.ZodOptional<z.ZodArray<z.ZodObject<{
                fileName: z.ZodString;
                contentType: z.ZodDefault<z.ZodString>;
                sizeBytes: z.ZodNumber;
                base64Data: z.ZodString;
                textPreview: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                fileName: string;
                contentType: string;
                sizeBytes: number;
                base64Data: string;
                textPreview?: string | undefined;
            }, {
                fileName: string;
                sizeBytes: number;
                base64Data: string;
                contentType?: string | undefined;
                textPreview?: string | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            sourceType: "unknown" | "csv_excel" | "pdf_document" | "api_export" | "manual_entry" | "old_system_report" | "not_available";
            sourceName?: string | undefined;
            fieldNotes?: string | undefined;
            importNotes?: string | undefined;
            uploads?: {
                fileName: string;
                contentType: string;
                sizeBytes: number;
                base64Data: string;
                textPreview?: string | undefined;
            }[] | undefined;
        }, {
            sourceType?: "unknown" | "csv_excel" | "pdf_document" | "api_export" | "manual_entry" | "old_system_report" | "not_available" | undefined;
            sourceName?: string | undefined;
            fieldNotes?: string | undefined;
            importNotes?: string | undefined;
            uploads?: {
                fileName: string;
                sizeBytes: number;
                base64Data: string;
                contentType?: string | undefined;
                textPreview?: string | undefined;
            }[] | undefined;
        }>>>;
    }, "strip", z.ZodTypeAny, {
        items: {
            memberList: boolean;
            activeMemberships: boolean;
            billingDates: boolean;
            paymentStatus: boolean;
            attendanceHistory: boolean;
            classSchedules: boolean;
            appointments: boolean;
            staffList: boolean;
            staffRoles: boolean;
            waiversDocuments: boolean;
            notesTags: boolean;
            productsPackages: boolean;
            paymentMethods: boolean;
        };
        currentSoftware?: string | undefined;
        notes?: string | undefined;
        details?: Partial<Record<"memberList" | "activeMemberships" | "billingDates" | "paymentStatus" | "attendanceHistory" | "classSchedules" | "appointments" | "staffList" | "staffRoles" | "waiversDocuments" | "notesTags" | "productsPackages" | "paymentMethods", {
            sourceType: "unknown" | "csv_excel" | "pdf_document" | "api_export" | "manual_entry" | "old_system_report" | "not_available";
            sourceName?: string | undefined;
            fieldNotes?: string | undefined;
            importNotes?: string | undefined;
            uploads?: {
                fileName: string;
                contentType: string;
                sizeBytes: number;
                base64Data: string;
                textPreview?: string | undefined;
            }[] | undefined;
        }>> | undefined;
    }, {
        currentSoftware?: string | undefined;
        notes?: string | undefined;
        items?: {
            memberList?: boolean | undefined;
            activeMemberships?: boolean | undefined;
            billingDates?: boolean | undefined;
            paymentStatus?: boolean | undefined;
            attendanceHistory?: boolean | undefined;
            classSchedules?: boolean | undefined;
            appointments?: boolean | undefined;
            staffList?: boolean | undefined;
            staffRoles?: boolean | undefined;
            waiversDocuments?: boolean | undefined;
            notesTags?: boolean | undefined;
            productsPackages?: boolean | undefined;
            paymentMethods?: boolean | undefined;
        } | undefined;
        details?: Partial<Record<"memberList" | "activeMemberships" | "billingDates" | "paymentStatus" | "attendanceHistory" | "classSchedules" | "appointments" | "staffList" | "staffRoles" | "waiversDocuments" | "notesTags" | "productsPackages" | "paymentMethods", {
            sourceType?: "unknown" | "csv_excel" | "pdf_document" | "api_export" | "manual_entry" | "old_system_report" | "not_available" | undefined;
            sourceName?: string | undefined;
            fieldNotes?: string | undefined;
            importNotes?: string | undefined;
            uploads?: {
                fileName: string;
                sizeBytes: number;
                base64Data: string;
                contentType?: string | undefined;
                textPreview?: string | undefined;
            }[] | undefined;
        }>> | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    migrationChecklist?: {
        items: {
            memberList: boolean;
            activeMemberships: boolean;
            billingDates: boolean;
            paymentStatus: boolean;
            attendanceHistory: boolean;
            classSchedules: boolean;
            appointments: boolean;
            staffList: boolean;
            staffRoles: boolean;
            waiversDocuments: boolean;
            notesTags: boolean;
            productsPackages: boolean;
            paymentMethods: boolean;
        };
        currentSoftware?: string | undefined;
        notes?: string | undefined;
        details?: Partial<Record<"memberList" | "activeMemberships" | "billingDates" | "paymentStatus" | "attendanceHistory" | "classSchedules" | "appointments" | "staffList" | "staffRoles" | "waiversDocuments" | "notesTags" | "productsPackages" | "paymentMethods", {
            sourceType: "unknown" | "csv_excel" | "pdf_document" | "api_export" | "manual_entry" | "old_system_report" | "not_available";
            sourceName?: string | undefined;
            fieldNotes?: string | undefined;
            importNotes?: string | undefined;
            uploads?: {
                fileName: string;
                contentType: string;
                sizeBytes: number;
                base64Data: string;
                textPreview?: string | undefined;
            }[] | undefined;
        }>> | undefined;
    } | undefined;
    timezone?: string | undefined;
    locale?: string | undefined;
    name?: string | undefined;
    featureFlags?: ("online_signup" | "class_booking" | "personal_training" | "member_portal" | "website_builder" | "point_of_sale" | "access_control" | "anonymous_walk_in_pos")[] | undefined;
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
    studioSettings?: {
        businessType?: string | undefined;
        defaultBufferMinutes?: number | undefined;
        averageSessionPriceCents?: number | undefined;
        softwareMonthlyCostCents?: number | undefined;
        targetMonthlyRevenueCents?: number | undefined;
        resourceTypesUsed?: ("float" | "sauna" | "cold_plunge" | "red_light" | "compression" | "stretch_table" | "recovery_room" | "other")[] | undefined;
    } | undefined;
    setupWizard?: {
        currentStep?: "profile" | "rooms_devices" | "services" | "first_csv" | "first_revenue_plan" | undefined;
        completedSteps?: ("profile" | "rooms_devices" | "services" | "first_csv" | "first_revenue_plan")[] | undefined;
        completedAt?: Date | undefined;
    } | undefined;
    operatingHours?: Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", {
        opensAt: string;
        closesAt: string;
    }[]>> | undefined;
    onboardingCompletedSteps?: string[] | undefined;
}, {
    migrationChecklist?: {
        currentSoftware?: string | undefined;
        notes?: string | undefined;
        items?: {
            memberList?: boolean | undefined;
            activeMemberships?: boolean | undefined;
            billingDates?: boolean | undefined;
            paymentStatus?: boolean | undefined;
            attendanceHistory?: boolean | undefined;
            classSchedules?: boolean | undefined;
            appointments?: boolean | undefined;
            staffList?: boolean | undefined;
            staffRoles?: boolean | undefined;
            waiversDocuments?: boolean | undefined;
            notesTags?: boolean | undefined;
            productsPackages?: boolean | undefined;
            paymentMethods?: boolean | undefined;
        } | undefined;
        details?: Partial<Record<"memberList" | "activeMemberships" | "billingDates" | "paymentStatus" | "attendanceHistory" | "classSchedules" | "appointments" | "staffList" | "staffRoles" | "waiversDocuments" | "notesTags" | "productsPackages" | "paymentMethods", {
            sourceType?: "unknown" | "csv_excel" | "pdf_document" | "api_export" | "manual_entry" | "old_system_report" | "not_available" | undefined;
            sourceName?: string | undefined;
            fieldNotes?: string | undefined;
            importNotes?: string | undefined;
            uploads?: {
                fileName: string;
                sizeBytes: number;
                base64Data: string;
                contentType?: string | undefined;
                textPreview?: string | undefined;
            }[] | undefined;
        }>> | undefined;
    } | undefined;
    timezone?: string | undefined;
    locale?: string | undefined;
    name?: string | undefined;
    featureFlags?: ("online_signup" | "class_booking" | "personal_training" | "member_portal" | "website_builder" | "point_of_sale" | "access_control" | "anonymous_walk_in_pos")[] | undefined;
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
    studioSettings?: {
        businessType?: string | undefined;
        defaultBufferMinutes?: number | undefined;
        averageSessionPriceCents?: number | undefined;
        softwareMonthlyCostCents?: number | undefined;
        targetMonthlyRevenueCents?: number | undefined;
        resourceTypesUsed?: ("float" | "sauna" | "cold_plunge" | "red_light" | "compression" | "stretch_table" | "recovery_room" | "other")[] | undefined;
    } | undefined;
    setupWizard?: {
        currentStep?: "profile" | "rooms_devices" | "services" | "first_csv" | "first_revenue_plan" | undefined;
        completedSteps?: ("profile" | "rooms_devices" | "services" | "first_csv" | "first_revenue_plan")[] | undefined;
        completedAt?: Date | undefined;
    } | undefined;
    operatingHours?: Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", {
        opensAt: string;
        closesAt: string;
    }[]>> | undefined;
    onboardingCompletedSteps?: string[] | undefined;
}>, {
    migrationChecklist?: {
        items: {
            memberList: boolean;
            activeMemberships: boolean;
            billingDates: boolean;
            paymentStatus: boolean;
            attendanceHistory: boolean;
            classSchedules: boolean;
            appointments: boolean;
            staffList: boolean;
            staffRoles: boolean;
            waiversDocuments: boolean;
            notesTags: boolean;
            productsPackages: boolean;
            paymentMethods: boolean;
        };
        currentSoftware?: string | undefined;
        notes?: string | undefined;
        details?: Partial<Record<"memberList" | "activeMemberships" | "billingDates" | "paymentStatus" | "attendanceHistory" | "classSchedules" | "appointments" | "staffList" | "staffRoles" | "waiversDocuments" | "notesTags" | "productsPackages" | "paymentMethods", {
            sourceType: "unknown" | "csv_excel" | "pdf_document" | "api_export" | "manual_entry" | "old_system_report" | "not_available";
            sourceName?: string | undefined;
            fieldNotes?: string | undefined;
            importNotes?: string | undefined;
            uploads?: {
                fileName: string;
                contentType: string;
                sizeBytes: number;
                base64Data: string;
                textPreview?: string | undefined;
            }[] | undefined;
        }>> | undefined;
    } | undefined;
    timezone?: string | undefined;
    locale?: string | undefined;
    name?: string | undefined;
    featureFlags?: ("online_signup" | "class_booking" | "personal_training" | "member_portal" | "website_builder" | "point_of_sale" | "access_control" | "anonymous_walk_in_pos")[] | undefined;
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
    studioSettings?: {
        businessType?: string | undefined;
        defaultBufferMinutes?: number | undefined;
        averageSessionPriceCents?: number | undefined;
        softwareMonthlyCostCents?: number | undefined;
        targetMonthlyRevenueCents?: number | undefined;
        resourceTypesUsed?: ("float" | "sauna" | "cold_plunge" | "red_light" | "compression" | "stretch_table" | "recovery_room" | "other")[] | undefined;
    } | undefined;
    setupWizard?: {
        currentStep?: "profile" | "rooms_devices" | "services" | "first_csv" | "first_revenue_plan" | undefined;
        completedSteps?: ("profile" | "rooms_devices" | "services" | "first_csv" | "first_revenue_plan")[] | undefined;
        completedAt?: Date | undefined;
    } | undefined;
    operatingHours?: Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", {
        opensAt: string;
        closesAt: string;
    }[]>> | undefined;
    onboardingCompletedSteps?: string[] | undefined;
}, {
    migrationChecklist?: {
        currentSoftware?: string | undefined;
        notes?: string | undefined;
        items?: {
            memberList?: boolean | undefined;
            activeMemberships?: boolean | undefined;
            billingDates?: boolean | undefined;
            paymentStatus?: boolean | undefined;
            attendanceHistory?: boolean | undefined;
            classSchedules?: boolean | undefined;
            appointments?: boolean | undefined;
            staffList?: boolean | undefined;
            staffRoles?: boolean | undefined;
            waiversDocuments?: boolean | undefined;
            notesTags?: boolean | undefined;
            productsPackages?: boolean | undefined;
            paymentMethods?: boolean | undefined;
        } | undefined;
        details?: Partial<Record<"memberList" | "activeMemberships" | "billingDates" | "paymentStatus" | "attendanceHistory" | "classSchedules" | "appointments" | "staffList" | "staffRoles" | "waiversDocuments" | "notesTags" | "productsPackages" | "paymentMethods", {
            sourceType?: "unknown" | "csv_excel" | "pdf_document" | "api_export" | "manual_entry" | "old_system_report" | "not_available" | undefined;
            sourceName?: string | undefined;
            fieldNotes?: string | undefined;
            importNotes?: string | undefined;
            uploads?: {
                fileName: string;
                sizeBytes: number;
                base64Data: string;
                contentType?: string | undefined;
                textPreview?: string | undefined;
            }[] | undefined;
        }>> | undefined;
    } | undefined;
    timezone?: string | undefined;
    locale?: string | undefined;
    name?: string | undefined;
    featureFlags?: ("online_signup" | "class_booking" | "personal_training" | "member_portal" | "website_builder" | "point_of_sale" | "access_control" | "anonymous_walk_in_pos")[] | undefined;
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
    studioSettings?: {
        businessType?: string | undefined;
        defaultBufferMinutes?: number | undefined;
        averageSessionPriceCents?: number | undefined;
        softwareMonthlyCostCents?: number | undefined;
        targetMonthlyRevenueCents?: number | undefined;
        resourceTypesUsed?: ("float" | "sauna" | "cold_plunge" | "red_light" | "compression" | "stretch_table" | "recovery_room" | "other")[] | undefined;
    } | undefined;
    setupWizard?: {
        currentStep?: "profile" | "rooms_devices" | "services" | "first_csv" | "first_revenue_plan" | undefined;
        completedSteps?: ("profile" | "rooms_devices" | "services" | "first_csv" | "first_revenue_plan")[] | undefined;
        completedAt?: Date | undefined;
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
    createsReservableResource: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    permissions: ("gym:read" | "gym:update" | "location:read" | "location:create" | "location:update" | "location:archive" | "staff:directory_view" | "staff:read" | "staff:invite" | "staff:role_assign" | "staff:remove" | "member:read" | "member:write" | "plan:read" | "plan:write" | "class:read" | "class:write" | "booking:read" | "booking:write" | "access:read" | "access:write" | "payment:read" | "payment:write" | "report:read" | "schedule:read" | "schedule:create" | "schedule:publish" | "schedule:requests_manage" | "schedule:auto_resolve" | "platform:admin")[];
    createsReservableResource: boolean;
    parentRoleId?: string | undefined;
}, {
    name: string;
    permissions: ("gym:read" | "gym:update" | "location:read" | "location:create" | "location:update" | "location:archive" | "staff:directory_view" | "staff:read" | "staff:invite" | "staff:role_assign" | "staff:remove" | "member:read" | "member:write" | "plan:read" | "plan:write" | "class:read" | "class:write" | "booking:read" | "booking:write" | "access:read" | "access:write" | "payment:read" | "payment:write" | "report:read" | "schedule:read" | "schedule:create" | "schedule:publish" | "schedule:requests_manage" | "schedule:auto_resolve" | "platform:admin")[];
    parentRoleId?: string | undefined;
    createsReservableResource?: boolean | undefined;
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
    createsReservableResource: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    parentRoleId?: string | undefined;
    permissions?: ("gym:read" | "gym:update" | "location:read" | "location:create" | "location:update" | "location:archive" | "staff:directory_view" | "staff:read" | "staff:invite" | "staff:role_assign" | "staff:remove" | "member:read" | "member:write" | "plan:read" | "plan:write" | "class:read" | "class:write" | "booking:read" | "booking:write" | "access:read" | "access:write" | "payment:read" | "payment:write" | "report:read" | "schedule:read" | "schedule:create" | "schedule:publish" | "schedule:requests_manage" | "schedule:auto_resolve" | "platform:admin")[] | undefined;
    createsReservableResource?: boolean | undefined;
}, {
    name?: string | undefined;
    parentRoleId?: string | undefined;
    permissions?: ("gym:read" | "gym:update" | "location:read" | "location:create" | "location:update" | "location:archive" | "staff:directory_view" | "staff:read" | "staff:invite" | "staff:role_assign" | "staff:remove" | "member:read" | "member:write" | "plan:read" | "plan:write" | "class:read" | "class:write" | "booking:read" | "booking:write" | "access:read" | "access:write" | "payment:read" | "payment:write" | "report:read" | "schedule:read" | "schedule:create" | "schedule:publish" | "schedule:requests_manage" | "schedule:auto_resolve" | "platform:admin")[] | undefined;
    createsReservableResource?: boolean | undefined;
}>, {
    name?: string | undefined;
    parentRoleId?: string | undefined;
    permissions?: ("gym:read" | "gym:update" | "location:read" | "location:create" | "location:update" | "location:archive" | "staff:directory_view" | "staff:read" | "staff:invite" | "staff:role_assign" | "staff:remove" | "member:read" | "member:write" | "plan:read" | "plan:write" | "class:read" | "class:write" | "booking:read" | "booking:write" | "access:read" | "access:write" | "payment:read" | "payment:write" | "report:read" | "schedule:read" | "schedule:create" | "schedule:publish" | "schedule:requests_manage" | "schedule:auto_resolve" | "platform:admin")[] | undefined;
    createsReservableResource?: boolean | undefined;
}, {
    name?: string | undefined;
    parentRoleId?: string | undefined;
    permissions?: ("gym:read" | "gym:update" | "location:read" | "location:create" | "location:update" | "location:archive" | "staff:directory_view" | "staff:read" | "staff:invite" | "staff:role_assign" | "staff:remove" | "member:read" | "member:write" | "plan:read" | "plan:write" | "class:read" | "class:write" | "booking:read" | "booking:write" | "access:read" | "access:write" | "payment:read" | "payment:write" | "report:read" | "schedule:read" | "schedule:create" | "schedule:publish" | "schedule:requests_manage" | "schedule:auto_resolve" | "platform:admin")[] | undefined;
    createsReservableResource?: boolean | undefined;
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
    notes?: string | undefined;
    roleId?: string | undefined;
    locationId?: string | undefined;
}, {
    userId: string;
    startsAt: string;
    endsAt: string;
    notes?: string | undefined;
    roleId?: string | undefined;
    locationId?: string | undefined;
}>, {
    userId: string;
    startsAt: string;
    endsAt: string;
    notes?: string | undefined;
    roleId?: string | undefined;
    locationId?: string | undefined;
}, {
    userId: string;
    startsAt: string;
    endsAt: string;
    notes?: string | undefined;
    roleId?: string | undefined;
    locationId?: string | undefined;
}>;
export declare const staffClockInSchema: z.ZodObject<{
    userId: z.ZodString;
    locationId: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    notes?: string | undefined;
    locationId?: string | undefined;
}, {
    userId: string;
    notes?: string | undefined;
    locationId?: string | undefined;
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
    notes?: string | undefined;
    locationId?: string | undefined;
}, {
    notes?: string | undefined;
    locationId?: string | undefined;
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
    status: "lead" | "trial" | "active" | "past_due" | "frozen" | "cancelled" | "expired" | "archived";
    firstName: string;
    lastName: string;
    leadStage: "none" | "open" | "converted" | "closed";
    tagNames: string[];
    notes?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
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
    notes?: string | undefined;
    status?: "lead" | "trial" | "active" | "past_due" | "frozen" | "cancelled" | "expired" | "archived" | undefined;
    email?: string | undefined;
    phone?: string | undefined;
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
    notes?: string | undefined;
    status?: "lead" | "trial" | "active" | "past_due" | "frozen" | "cancelled" | "expired" | "archived" | undefined;
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
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
    notes?: string | undefined;
    status?: "lead" | "trial" | "active" | "past_due" | "frozen" | "cancelled" | "expired" | "archived" | undefined;
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
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
    notes?: string | undefined;
    status?: "lead" | "trial" | "active" | "past_due" | "frozen" | "cancelled" | "expired" | "archived" | undefined;
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
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
    notes?: string | undefined;
    status?: "lead" | "trial" | "active" | "past_due" | "frozen" | "cancelled" | "expired" | "archived" | undefined;
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
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
    status: "lead" | "trial" | "active" | "past_due" | "frozen" | "cancelled" | "expired" | "archived";
    firstName: string;
    lastName: string;
    leadStage: "none" | "open" | "converted" | "closed";
    tagNames: string[];
    notes?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
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
    notes?: string | undefined;
    status?: "lead" | "trial" | "active" | "past_due" | "frozen" | "cancelled" | "expired" | "archived" | undefined;
    email?: string | undefined;
    phone?: string | undefined;
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
    notes?: string | undefined;
    status?: "lead" | "trial" | "active" | "past_due" | "frozen" | "cancelled" | "expired" | "archived" | undefined;
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
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
    notes?: string | undefined;
    status?: "lead" | "trial" | "active" | "past_due" | "frozen" | "cancelled" | "expired" | "archived" | undefined;
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
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
    notes?: string | undefined;
    status?: "lead" | "trial" | "active" | "past_due" | "frozen" | "cancelled" | "expired" | "archived" | undefined;
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
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
    notes?: string | undefined;
    status?: "lead" | "trial" | "active" | "past_due" | "frozen" | "cancelled" | "expired" | "archived" | undefined;
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
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
export declare const migrationCsvImportSchema: z.ZodObject<{
    fileName: z.ZodString;
    contentType: z.ZodOptional<z.ZodString>;
    base64Data: z.ZodString;
    delimiter: z.ZodDefault<z.ZodEnum<["auto", "comma", "tab"]>>;
    mapping: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    fileName: string;
    base64Data: string;
    delimiter: "auto" | "comma" | "tab";
    contentType?: string | undefined;
    mapping?: Record<string, string> | undefined;
}, {
    fileName: string;
    base64Data: string;
    contentType?: string | undefined;
    delimiter?: "auto" | "comma" | "tab" | undefined;
    mapping?: Record<string, string> | undefined;
}>;
export declare const migrationFileTypeSchema: z.ZodEnum<["members", "staff", "membership_plans", "classes", "attendance", "billing", "appointments", "unknown"]>;
export declare const migrationBatchCreateSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export declare const migrationFileUploadSchema: z.ZodObject<{
    fileName: z.ZodString;
    contentType: z.ZodOptional<z.ZodString>;
    base64Data: z.ZodString;
}, "strip", z.ZodTypeAny, {
    fileName: string;
    base64Data: string;
    contentType?: string | undefined;
}, {
    fileName: string;
    base64Data: string;
    contentType?: string | undefined;
}>;
export declare const migrationFileTypeOverrideSchema: z.ZodObject<{
    fileType: z.ZodEnum<["members", "staff", "membership_plans", "classes", "attendance", "billing", "appointments", "unknown"]>;
}, "strip", z.ZodTypeAny, {
    fileType: "appointments" | "unknown" | "members" | "staff" | "membership_plans" | "classes" | "attendance" | "billing";
}, {
    fileType: "appointments" | "unknown" | "members" | "staff" | "membership_plans" | "classes" | "attendance" | "billing";
}>;
export declare const migrationColumnMappingsUpdateSchema: z.ZodObject<{
    mappings: z.ZodArray<z.ZodObject<{
        sourceColumn: z.ZodString;
        targetField: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        sourceColumn: string;
        targetField: string;
    }, {
        sourceColumn: string;
        targetField: string;
    }>, "many">;
    approve: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    mappings: {
        sourceColumn: string;
        targetField: string;
    }[];
    approve?: boolean | undefined;
}, {
    mappings: {
        sourceColumn: string;
        targetField: string;
    }[];
    approve?: boolean | undefined;
}>;
export declare const migrationStagedMemberUpdateSchema: z.ZodEffects<z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    fullName: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    dateOfBirth: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    emergencyContact: z.ZodOptional<z.ZodString>;
    membershipStatus: z.ZodOptional<z.ZodString>;
    membershipPlanName: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    cancellationDate: z.ZodOptional<z.ZodString>;
    nextBillingDate: z.ZodOptional<z.ZodString>;
    assignedTrainerName: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    notes?: string | undefined;
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    emergencyContact?: string | undefined;
    fullName?: string | undefined;
    dateOfBirth?: string | undefined;
    membershipStatus?: string | undefined;
    membershipPlanName?: string | undefined;
    startDate?: string | undefined;
    cancellationDate?: string | undefined;
    nextBillingDate?: string | undefined;
    assignedTrainerName?: string | undefined;
    tags?: string[] | undefined;
}, {
    notes?: string | undefined;
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    emergencyContact?: string | undefined;
    fullName?: string | undefined;
    dateOfBirth?: string | undefined;
    membershipStatus?: string | undefined;
    membershipPlanName?: string | undefined;
    startDate?: string | undefined;
    cancellationDate?: string | undefined;
    nextBillingDate?: string | undefined;
    assignedTrainerName?: string | undefined;
    tags?: string[] | undefined;
}>, {
    notes?: string | undefined;
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    emergencyContact?: string | undefined;
    fullName?: string | undefined;
    dateOfBirth?: string | undefined;
    membershipStatus?: string | undefined;
    membershipPlanName?: string | undefined;
    startDate?: string | undefined;
    cancellationDate?: string | undefined;
    nextBillingDate?: string | undefined;
    assignedTrainerName?: string | undefined;
    tags?: string[] | undefined;
}, {
    notes?: string | undefined;
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    emergencyContact?: string | undefined;
    fullName?: string | undefined;
    dateOfBirth?: string | undefined;
    membershipStatus?: string | undefined;
    membershipPlanName?: string | undefined;
    startDate?: string | undefined;
    cancellationDate?: string | undefined;
    nextBillingDate?: string | undefined;
    assignedTrainerName?: string | undefined;
    tags?: string[] | undefined;
}>;
export declare const migrationStagedMemberBulkApproveSchema: z.ZodObject<{
    memberIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    memberIds?: string[] | undefined;
}, {
    memberIds?: string[] | undefined;
}>;
export declare const migrationMemberCsvImportSchema: z.ZodObject<{
    fileName: z.ZodString;
    contentType: z.ZodOptional<z.ZodString>;
    base64Data: z.ZodString;
    delimiter: z.ZodDefault<z.ZodEnum<["auto", "comma", "tab"]>>;
    mapping: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    fileName: string;
    base64Data: string;
    delimiter: "auto" | "comma" | "tab";
    contentType?: string | undefined;
    mapping?: Record<string, string> | undefined;
}, {
    fileName: string;
    base64Data: string;
    contentType?: string | undefined;
    delimiter?: "auto" | "comma" | "tab" | undefined;
    mapping?: Record<string, string> | undefined;
}>;
export declare const migrationMembershipPlanCsvImportSchema: z.ZodObject<{
    fileName: z.ZodString;
    contentType: z.ZodOptional<z.ZodString>;
    base64Data: z.ZodString;
    delimiter: z.ZodDefault<z.ZodEnum<["auto", "comma", "tab"]>>;
    mapping: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    fileName: string;
    base64Data: string;
    delimiter: "auto" | "comma" | "tab";
    contentType?: string | undefined;
    mapping?: Record<string, string> | undefined;
}, {
    fileName: string;
    base64Data: string;
    contentType?: string | undefined;
    delimiter?: "auto" | "comma" | "tab" | undefined;
    mapping?: Record<string, string> | undefined;
}>;
export declare const migrationStaffRoleCsvImportSchema: z.ZodObject<{
    fileName: z.ZodString;
    contentType: z.ZodOptional<z.ZodString>;
    base64Data: z.ZodString;
    delimiter: z.ZodDefault<z.ZodEnum<["auto", "comma", "tab"]>>;
    mapping: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    fileName: string;
    base64Data: string;
    delimiter: "auto" | "comma" | "tab";
    contentType?: string | undefined;
    mapping?: Record<string, string> | undefined;
}, {
    fileName: string;
    base64Data: string;
    contentType?: string | undefined;
    delimiter?: "auto" | "comma" | "tab" | undefined;
    mapping?: Record<string, string> | undefined;
}>;
export declare const migrationStaffListCsvImportSchema: z.ZodObject<{
    fileName: z.ZodString;
    contentType: z.ZodOptional<z.ZodString>;
    base64Data: z.ZodString;
    delimiter: z.ZodDefault<z.ZodEnum<["auto", "comma", "tab"]>>;
    mapping: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    fileName: string;
    base64Data: string;
    delimiter: "auto" | "comma" | "tab";
    contentType?: string | undefined;
    mapping?: Record<string, string> | undefined;
}, {
    fileName: string;
    base64Data: string;
    contentType?: string | undefined;
    delimiter?: "auto" | "comma" | "tab" | undefined;
    mapping?: Record<string, string> | undefined;
}>;
export declare const migrationMemberCsvPreviewSchema: z.ZodObject<{
    fileName: z.ZodString;
    contentType: z.ZodOptional<z.ZodString>;
    base64Data: z.ZodString;
    delimiter: z.ZodDefault<z.ZodEnum<["auto", "comma", "tab"]>>;
    mapping: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    fileName: string;
    base64Data: string;
    delimiter: "auto" | "comma" | "tab";
    contentType?: string | undefined;
    mapping?: Record<string, string> | undefined;
}, {
    fileName: string;
    base64Data: string;
    contentType?: string | undefined;
    delimiter?: "auto" | "comma" | "tab" | undefined;
    mapping?: Record<string, string> | undefined;
}>;
export declare const migrationMembershipPlanCsvPreviewSchema: z.ZodObject<{
    fileName: z.ZodString;
    contentType: z.ZodOptional<z.ZodString>;
    base64Data: z.ZodString;
    delimiter: z.ZodDefault<z.ZodEnum<["auto", "comma", "tab"]>>;
    mapping: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    fileName: string;
    base64Data: string;
    delimiter: "auto" | "comma" | "tab";
    contentType?: string | undefined;
    mapping?: Record<string, string> | undefined;
}, {
    fileName: string;
    base64Data: string;
    contentType?: string | undefined;
    delimiter?: "auto" | "comma" | "tab" | undefined;
    mapping?: Record<string, string> | undefined;
}>;
export declare const migrationStaffRoleCsvPreviewSchema: z.ZodObject<{
    fileName: z.ZodString;
    contentType: z.ZodOptional<z.ZodString>;
    base64Data: z.ZodString;
    delimiter: z.ZodDefault<z.ZodEnum<["auto", "comma", "tab"]>>;
    mapping: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    fileName: string;
    base64Data: string;
    delimiter: "auto" | "comma" | "tab";
    contentType?: string | undefined;
    mapping?: Record<string, string> | undefined;
}, {
    fileName: string;
    base64Data: string;
    contentType?: string | undefined;
    delimiter?: "auto" | "comma" | "tab" | undefined;
    mapping?: Record<string, string> | undefined;
}>;
export declare const migrationStaffListCsvPreviewSchema: z.ZodObject<{
    fileName: z.ZodString;
    contentType: z.ZodOptional<z.ZodString>;
    base64Data: z.ZodString;
    delimiter: z.ZodDefault<z.ZodEnum<["auto", "comma", "tab"]>>;
    mapping: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    fileName: string;
    base64Data: string;
    delimiter: "auto" | "comma" | "tab";
    contentType?: string | undefined;
    mapping?: Record<string, string> | undefined;
}, {
    fileName: string;
    base64Data: string;
    contentType?: string | undefined;
    delimiter?: "auto" | "comma" | "tab" | undefined;
    mapping?: Record<string, string> | undefined;
}>;
export declare const migrationMemberCsvAiMapSchema: z.ZodObject<{
    fileName: z.ZodString;
    contentType: z.ZodOptional<z.ZodString>;
    base64Data: z.ZodString;
    delimiter: z.ZodDefault<z.ZodEnum<["auto", "comma", "tab"]>>;
    mapping: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    fileName: string;
    base64Data: string;
    delimiter: "auto" | "comma" | "tab";
    contentType?: string | undefined;
    mapping?: Record<string, string> | undefined;
}, {
    fileName: string;
    base64Data: string;
    contentType?: string | undefined;
    delimiter?: "auto" | "comma" | "tab" | undefined;
    mapping?: Record<string, string> | undefined;
}>;
export declare const migrationMembershipPlanCsvAiMapSchema: z.ZodObject<{
    fileName: z.ZodString;
    contentType: z.ZodOptional<z.ZodString>;
    base64Data: z.ZodString;
    delimiter: z.ZodDefault<z.ZodEnum<["auto", "comma", "tab"]>>;
    mapping: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    fileName: string;
    base64Data: string;
    delimiter: "auto" | "comma" | "tab";
    contentType?: string | undefined;
    mapping?: Record<string, string> | undefined;
}, {
    fileName: string;
    base64Data: string;
    contentType?: string | undefined;
    delimiter?: "auto" | "comma" | "tab" | undefined;
    mapping?: Record<string, string> | undefined;
}>;
export declare const migrationStaffRoleCsvAiMapSchema: z.ZodObject<{
    fileName: z.ZodString;
    contentType: z.ZodOptional<z.ZodString>;
    base64Data: z.ZodString;
    delimiter: z.ZodDefault<z.ZodEnum<["auto", "comma", "tab"]>>;
    mapping: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    fileName: string;
    base64Data: string;
    delimiter: "auto" | "comma" | "tab";
    contentType?: string | undefined;
    mapping?: Record<string, string> | undefined;
}, {
    fileName: string;
    base64Data: string;
    contentType?: string | undefined;
    delimiter?: "auto" | "comma" | "tab" | undefined;
    mapping?: Record<string, string> | undefined;
}>;
export declare const migrationStaffListCsvAiMapSchema: z.ZodObject<{
    fileName: z.ZodString;
    contentType: z.ZodOptional<z.ZodString>;
    base64Data: z.ZodString;
    delimiter: z.ZodDefault<z.ZodEnum<["auto", "comma", "tab"]>>;
    mapping: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    fileName: string;
    base64Data: string;
    delimiter: "auto" | "comma" | "tab";
    contentType?: string | undefined;
    mapping?: Record<string, string> | undefined;
}, {
    fileName: string;
    base64Data: string;
    contentType?: string | undefined;
    delimiter?: "auto" | "comma" | "tab" | undefined;
    mapping?: Record<string, string> | undefined;
}>;
export declare const campaignImportTypeSchema: z.ZodEnum<["clients", "bookings", "services", "memberships_packages", "payments", "rooms_devices"]>;
export declare const campaignCsvPreviewSchema: z.ZodObject<{
    importType: z.ZodEnum<["clients", "bookings", "services", "memberships_packages", "payments", "rooms_devices"]>;
    fileName: z.ZodString;
    contentType: z.ZodOptional<z.ZodString>;
    base64Data: z.ZodString;
    delimiter: z.ZodDefault<z.ZodEnum<["auto", "comma", "tab"]>>;
}, "strip", z.ZodTypeAny, {
    fileName: string;
    base64Data: string;
    delimiter: "auto" | "comma" | "tab";
    importType: "rooms_devices" | "services" | "clients" | "bookings" | "memberships_packages" | "payments";
    contentType?: string | undefined;
}, {
    fileName: string;
    base64Data: string;
    importType: "rooms_devices" | "services" | "clients" | "bookings" | "memberships_packages" | "payments";
    contentType?: string | undefined;
    delimiter?: "auto" | "comma" | "tab" | undefined;
}>;
export declare const campaignCsvConfirmSchema: z.ZodObject<{
    importType: z.ZodEnum<["clients", "bookings", "services", "memberships_packages", "payments", "rooms_devices"]>;
    fileName: z.ZodString;
    contentType: z.ZodOptional<z.ZodString>;
    base64Data: z.ZodString;
    delimiter: z.ZodDefault<z.ZodEnum<["auto", "comma", "tab"]>>;
} & {
    mappings: z.ZodArray<z.ZodObject<{
        sourceColumn: z.ZodString;
        targetField: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        sourceColumn: string;
        targetField: string;
    }, {
        sourceColumn: string;
        targetField: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    fileName: string;
    base64Data: string;
    delimiter: "auto" | "comma" | "tab";
    mappings: {
        sourceColumn: string;
        targetField: string;
    }[];
    importType: "rooms_devices" | "services" | "clients" | "bookings" | "memberships_packages" | "payments";
    contentType?: string | undefined;
}, {
    fileName: string;
    base64Data: string;
    mappings: {
        sourceColumn: string;
        targetField: string;
    }[];
    importType: "rooms_devices" | "services" | "clients" | "bookings" | "memberships_packages" | "payments";
    contentType?: string | undefined;
    delimiter?: "auto" | "comma" | "tab" | undefined;
}>;
export declare const campaignGeneratorTypeSchema: z.ZodEnum<["unused_credit_reminder", "inactive_member_win_back", "first_visit_follow_up", "off_peak_room_fill", "premium_program_launch", "review_request", "membership_upgrade"]>;
export declare const campaignGenerateSchema: z.ZodObject<{
    campaignType: z.ZodEnum<["unused_credit_reminder", "inactive_member_win_back", "first_visit_follow_up", "off_peak_room_fill", "premium_program_launch", "review_request", "membership_upgrade"]>;
}, "strip", z.ZodTypeAny, {
    campaignType: "unused_credit_reminder" | "inactive_member_win_back" | "first_visit_follow_up" | "off_peak_room_fill" | "premium_program_launch" | "review_request" | "membership_upgrade";
}, {
    campaignType: "unused_credit_reminder" | "inactive_member_win_back" | "first_visit_follow_up" | "off_peak_room_fill" | "premium_program_launch" | "review_request" | "membership_upgrade";
}>;
export declare const premiumRecoveryProgramCreateSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    targetAudience: z.ZodString;
    includedServices: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    recommendedPriceCents: z.ZodNumber;
    capacity: z.ZodNumber;
    schedule: z.ZodString;
    durationWeeks: z.ZodNumber;
    campaignCopy: z.ZodString;
    postProgramUpsell: z.ZodString;
    sourceJson: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description: string;
    targetAudience: string;
    includedServices: string[];
    recommendedPriceCents: number;
    capacity: number;
    schedule: string;
    durationWeeks: number;
    campaignCopy: string;
    postProgramUpsell: string;
    sourceJson?: Record<string, unknown> | undefined;
}, {
    title: string;
    description: string;
    targetAudience: string;
    recommendedPriceCents: number;
    capacity: number;
    schedule: string;
    durationWeeks: number;
    campaignCopy: string;
    postProgramUpsell: string;
    includedServices?: string[] | undefined;
    sourceJson?: Record<string, unknown> | undefined;
}>;
export declare const weeklyRevenuePlanActionUpdateSchema: z.ZodObject<{
    done: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    done: boolean;
}, {
    done: boolean;
}>;
export declare const roiTrackingEntryCreateSchema: z.ZodObject<{
    sourceType: z.ZodEnum<["campaign", "weekly_action"]>;
    sourceId: z.ZodString;
    sourceLabel: z.ZodString;
    bookingsGenerated: z.ZodNumber;
    revenueGeneratedCents: z.ZodNumber;
    membershipsSold: z.ZodNumber;
    packagesSold: z.ZodNumber;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    sourceType: "campaign" | "weekly_action";
    sourceId: string;
    sourceLabel: string;
    bookingsGenerated: number;
    revenueGeneratedCents: number;
    membershipsSold: number;
    packagesSold: number;
    notes?: string | undefined;
}, {
    sourceType: "campaign" | "weekly_action";
    sourceId: string;
    sourceLabel: string;
    bookingsGenerated: number;
    revenueGeneratedCents: number;
    membershipsSold: number;
    packagesSold: number;
    notes?: string | undefined;
}>;
export declare const crmActivityTypeSchema: z.ZodEnum<["note", "call", "email", "text", "reply", "tour_booked", "tour_completed", "trial_started", "trial_attended", "follow_up", "follow_up_outcome", "cancellation_reason"]>;
export declare const crmActivityCreateSchema: z.ZodObject<{
    type: z.ZodDefault<z.ZodEnum<["note", "call", "email", "text", "reply", "tour_booked", "tour_completed", "trial_started", "trial_attended", "follow_up", "follow_up_outcome", "cancellation_reason"]>>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    outcome: z.ZodOptional<z.ZodString>;
    occurredAt: z.ZodOptional<z.ZodString>;
    followUpAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "email" | "note" | "call" | "text" | "reply" | "tour_booked" | "tour_completed" | "trial_started" | "trial_attended" | "follow_up" | "follow_up_outcome" | "cancellation_reason";
    title: string;
    description?: string | undefined;
    outcome?: string | undefined;
    occurredAt?: string | undefined;
    followUpAt?: string | undefined;
}, {
    title: string;
    type?: "email" | "note" | "call" | "text" | "reply" | "tour_booked" | "tour_completed" | "trial_started" | "trial_attended" | "follow_up" | "follow_up_outcome" | "cancellation_reason" | undefined;
    description?: string | undefined;
    outcome?: string | undefined;
    occurredAt?: string | undefined;
    followUpAt?: string | undefined;
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
    paymentMethod: "manual_entry" | "card_reader";
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
    paymentMethod: "manual_entry" | "card_reader";
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
    paymentMethod: "manual_entry" | "card_reader";
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
    paymentMethod: "manual_entry" | "card_reader";
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
export declare const stripeConnectOnboardingLinkSchema: z.ZodObject<{
    returnUrl: z.ZodString;
    refreshUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    returnUrl: string;
    refreshUrl?: string | undefined;
}, {
    returnUrl: string;
    refreshUrl?: string | undefined;
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
export declare const migrationPlanTypeSchema: z.ZodEnum<["Monthly Membership", "Annual Membership", "Class Pack", "Personal Training Package", "Drop-In", "Trial", "Family Add-On", "Student/Discounted Plan", "Legacy Plan", "Free/Comped Plan", "Unknown"]>;
export declare const migrationColumnMappingSaveSchema: z.ZodObject<{
    mappings: z.ZodArray<z.ZodObject<{
        sourceColumn: z.ZodString;
        targetField: z.ZodEnum<["ignore", "plan_name", "plan_type", "price", "billing_frequency", "contract_length", "class_limit", "session_limit", "active", "notes"]>;
        confidence: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        sourceColumn: string;
        targetField: "notes" | "active" | "ignore" | "plan_name" | "plan_type" | "price" | "billing_frequency" | "contract_length" | "class_limit" | "session_limit";
        confidence: number;
    }, {
        sourceColumn: string;
        targetField: "notes" | "active" | "ignore" | "plan_name" | "plan_type" | "price" | "billing_frequency" | "contract_length" | "class_limit" | "session_limit";
        confidence?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    mappings: {
        sourceColumn: string;
        targetField: "notes" | "active" | "ignore" | "plan_name" | "plan_type" | "price" | "billing_frequency" | "contract_length" | "class_limit" | "session_limit";
        confidence: number;
    }[];
}, {
    mappings: {
        sourceColumn: string;
        targetField: "notes" | "active" | "ignore" | "plan_name" | "plan_type" | "price" | "billing_frequency" | "contract_length" | "class_limit" | "session_limit";
        confidence?: number | undefined;
    }[];
}>;
export declare const migrationPlanMappingApproveSchema: z.ZodObject<{
    mappings: z.ZodArray<z.ZodObject<{
        mappingId: z.ZodOptional<z.ZodString>;
        oldPlanName: z.ZodString;
        finalPlanType: z.ZodEnum<["Monthly Membership", "Annual Membership", "Class Pack", "Personal Training Package", "Drop-In", "Trial", "Family Add-On", "Student/Discounted Plan", "Legacy Plan", "Free/Comped Plan", "Unknown"]>;
    }, "strip", z.ZodTypeAny, {
        oldPlanName: string;
        finalPlanType: "Trial" | "Monthly Membership" | "Annual Membership" | "Class Pack" | "Personal Training Package" | "Drop-In" | "Family Add-On" | "Student/Discounted Plan" | "Legacy Plan" | "Free/Comped Plan" | "Unknown";
        mappingId?: string | undefined;
    }, {
        oldPlanName: string;
        finalPlanType: "Trial" | "Monthly Membership" | "Annual Membership" | "Class Pack" | "Personal Training Package" | "Drop-In" | "Family Add-On" | "Student/Discounted Plan" | "Legacy Plan" | "Free/Comped Plan" | "Unknown";
        mappingId?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    mappings: {
        oldPlanName: string;
        finalPlanType: "Trial" | "Monthly Membership" | "Annual Membership" | "Class Pack" | "Personal Training Package" | "Drop-In" | "Family Add-On" | "Student/Discounted Plan" | "Legacy Plan" | "Free/Comped Plan" | "Unknown";
        mappingId?: string | undefined;
    }[];
}, {
    mappings: {
        oldPlanName: string;
        finalPlanType: "Trial" | "Monthly Membership" | "Annual Membership" | "Class Pack" | "Personal Training Package" | "Drop-In" | "Family Add-On" | "Student/Discounted Plan" | "Legacy Plan" | "Free/Comped Plan" | "Unknown";
        mappingId?: string | undefined;
    }[];
}>;
export declare const migrationStagedPlanUpdateSchema: z.ZodObject<{
    planName: z.ZodOptional<z.ZodString>;
    planType: z.ZodOptional<z.ZodEnum<["Monthly Membership", "Annual Membership", "Class Pack", "Personal Training Package", "Drop-In", "Trial", "Family Add-On", "Student/Discounted Plan", "Legacy Plan", "Free/Comped Plan", "Unknown"]>>;
    price: z.ZodOptional<z.ZodNumber>;
    billingFrequency: z.ZodOptional<z.ZodString>;
    contractLength: z.ZodOptional<z.ZodNumber>;
    classLimit: z.ZodOptional<z.ZodNumber>;
    sessionLimit: z.ZodOptional<z.ZodNumber>;
    active: z.ZodOptional<z.ZodBoolean>;
    notes: z.ZodOptional<z.ZodString>;
    skipped: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    notes?: string | undefined;
    active?: boolean | undefined;
    price?: number | undefined;
    planName?: string | undefined;
    planType?: "Trial" | "Monthly Membership" | "Annual Membership" | "Class Pack" | "Personal Training Package" | "Drop-In" | "Family Add-On" | "Student/Discounted Plan" | "Legacy Plan" | "Free/Comped Plan" | "Unknown" | undefined;
    billingFrequency?: string | undefined;
    contractLength?: number | undefined;
    classLimit?: number | undefined;
    sessionLimit?: number | undefined;
    skipped?: boolean | undefined;
}, {
    notes?: string | undefined;
    active?: boolean | undefined;
    price?: number | undefined;
    planName?: string | undefined;
    planType?: "Trial" | "Monthly Membership" | "Annual Membership" | "Class Pack" | "Personal Training Package" | "Drop-In" | "Family Add-On" | "Student/Discounted Plan" | "Legacy Plan" | "Free/Comped Plan" | "Unknown" | undefined;
    billingFrequency?: string | undefined;
    contractLength?: number | undefined;
    classLimit?: number | undefined;
    sessionLimit?: number | undefined;
    skipped?: boolean | undefined;
}>;
export declare const migrationStagedPlansApproveSchema: z.ZodObject<{
    stagedPlanIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    approveAllReady: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    approveAllReady: boolean;
    stagedPlanIds?: string[] | undefined;
}, {
    stagedPlanIds?: string[] | undefined;
    approveAllReady?: boolean | undefined;
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
    capacity: number;
    classTypeId: string;
    waitlistCapacity: number;
    cancellationCutoffMinutes: number;
    lateCancellationFeeCents: number;
    trainerUserId?: string | undefined;
    roomName?: string | undefined;
}, {
    locationId: string;
    startsAt: string;
    endsAt: string;
    capacity: number;
    classTypeId: string;
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
export declare const resourceCreateSchema: z.ZodEffects<z.ZodObject<{
    locationId: z.ZodOptional<z.ZodString>;
    parentResourceId: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    resourceType: z.ZodString;
    linkedStaffUserId: z.ZodOptional<z.ZodString>;
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
    locationId?: string | undefined;
    parentResourceId?: string | undefined;
    linkedStaffUserId?: string | undefined;
    rentableHours?: Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", {
        opensAt: string;
        closesAt: string;
    }[]>> | undefined;
}, {
    name: string;
    resourceType: string;
    locationId?: string | undefined;
    capacity?: number | undefined;
    parentResourceId?: string | undefined;
    linkedStaffUserId?: string | undefined;
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
    name: string;
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
    locationId?: string | undefined;
    parentResourceId?: string | undefined;
    linkedStaffUserId?: string | undefined;
    rentableHours?: Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", {
        opensAt: string;
        closesAt: string;
    }[]>> | undefined;
}, {
    name: string;
    resourceType: string;
    locationId?: string | undefined;
    capacity?: number | undefined;
    parentResourceId?: string | undefined;
    linkedStaffUserId?: string | undefined;
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
    locationId: z.ZodOptional<z.ZodString>;
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
    locationId?: string | undefined;
    note?: string | undefined;
    overrideReason?: string | undefined;
    paymentReference?: string | undefined;
}, {
    startsAt: string;
    endsAt: string;
    memberId: string;
    resourceId: string;
    locationId?: string | undefined;
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
    locationId?: string | undefined;
    note?: string | undefined;
    overrideReason?: string | undefined;
    paymentReference?: string | undefined;
}, {
    startsAt: string;
    endsAt: string;
    memberId: string;
    resourceId: string;
    locationId?: string | undefined;
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
    locationId?: string | undefined;
    note?: string | undefined;
    overrideReason?: string | undefined;
    paymentReference?: string | undefined;
}, {
    startsAt: string;
    endsAt: string;
    memberId: string;
    resourceId: string;
    locationId?: string | undefined;
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
    occurredAt?: string | undefined;
    memberId?: string | undefined;
    qrPayload?: string | undefined;
}, {
    apiKey: string;
    barcode?: string | undefined;
    occurredAt?: string | undefined;
    memberId?: string | undefined;
    qrPayload?: string | undefined;
}>, {
    apiKey: string;
    barcode?: string | undefined;
    occurredAt?: string | undefined;
    memberId?: string | undefined;
    qrPayload?: string | undefined;
}, {
    apiKey: string;
    barcode?: string | undefined;
    occurredAt?: string | undefined;
    memberId?: string | undefined;
    qrPayload?: string | undefined;
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
export type CustomRoleCreateInput = z.input<typeof customRoleCreateSchema>;
export type CustomRoleUpdateInput = z.input<typeof customRoleUpdateSchema>;
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
export type MigrationBatchCreateInput = z.infer<typeof migrationBatchCreateSchema>;
export type MigrationFileType = z.infer<typeof migrationFileTypeSchema>;
export type MigrationFileUploadInput = z.infer<typeof migrationFileUploadSchema>;
export type MigrationFileTypeOverrideInput = z.infer<typeof migrationFileTypeOverrideSchema>;
export type MigrationColumnMappingsUpdateInput = z.infer<typeof migrationColumnMappingsUpdateSchema>;
export type MigrationStagedMemberUpdateInput = z.infer<typeof migrationStagedMemberUpdateSchema>;
export type MigrationStagedMemberBulkApproveInput = z.infer<typeof migrationStagedMemberBulkApproveSchema>;
export type MigrationMemberCsvImportInput = z.infer<typeof migrationMemberCsvImportSchema>;
export type MigrationMembershipPlanCsvImportInput = z.infer<typeof migrationMembershipPlanCsvImportSchema>;
export type MigrationStaffRoleCsvImportInput = z.infer<typeof migrationStaffRoleCsvImportSchema>;
export type MigrationStaffListCsvImportInput = z.infer<typeof migrationStaffListCsvImportSchema>;
export type MigrationMemberCsvPreviewInput = z.infer<typeof migrationMemberCsvPreviewSchema>;
export type MigrationMembershipPlanCsvPreviewInput = z.infer<typeof migrationMembershipPlanCsvPreviewSchema>;
export type MigrationStaffRoleCsvPreviewInput = z.infer<typeof migrationStaffRoleCsvPreviewSchema>;
export type MigrationStaffListCsvPreviewInput = z.infer<typeof migrationStaffListCsvPreviewSchema>;
export type MigrationMemberCsvAiMapInput = z.infer<typeof migrationMemberCsvAiMapSchema>;
export type MigrationMembershipPlanCsvAiMapInput = z.infer<typeof migrationMembershipPlanCsvAiMapSchema>;
export type MigrationStaffRoleCsvAiMapInput = z.infer<typeof migrationStaffRoleCsvAiMapSchema>;
export type MigrationStaffListCsvAiMapInput = z.infer<typeof migrationStaffListCsvAiMapSchema>;
export type CampaignImportType = z.infer<typeof campaignImportTypeSchema>;
export type CampaignCsvPreviewInput = z.infer<typeof campaignCsvPreviewSchema>;
export type CampaignCsvConfirmInput = z.infer<typeof campaignCsvConfirmSchema>;
export type CampaignGeneratorType = z.infer<typeof campaignGeneratorTypeSchema>;
export type CampaignGenerateInput = z.infer<typeof campaignGenerateSchema>;
export type PremiumRecoveryProgramCreateInput = z.infer<typeof premiumRecoveryProgramCreateSchema>;
export type WeeklyRevenuePlanActionUpdateInput = z.infer<typeof weeklyRevenuePlanActionUpdateSchema>;
export type RoiTrackingEntryCreateInput = z.infer<typeof roiTrackingEntryCreateSchema>;
export type CrmActivityCreateInput = z.input<typeof crmActivityCreateSchema>;
export type PosPurchaseInput = z.infer<typeof posPurchaseSchema>;
export type PosStripeFinalizeInput = z.infer<typeof posStripeFinalizeSchema>;
export type StripeConnectOnboardingLinkInput = z.infer<typeof stripeConnectOnboardingLinkSchema>;
export type MemberCreateInput = z.input<typeof memberCreateSchema>;
export type MemberUpdateInput = z.input<typeof memberUpdateSchema>;
export type MembershipPlanCreateInput = z.infer<typeof membershipPlanCreateSchema>;
export type MembershipPlanUpdateInput = z.infer<typeof membershipPlanUpdateSchema>;
export type MemberMembershipAssignInput = z.infer<typeof memberMembershipAssignSchema>;
export type MigrationColumnMappingSaveInput = z.infer<typeof migrationColumnMappingSaveSchema>;
export type MigrationPlanMappingApproveInput = z.infer<typeof migrationPlanMappingApproveSchema>;
export type MigrationStagedPlanUpdateInput = z.infer<typeof migrationStagedPlanUpdateSchema>;
export type MigrationStagedPlansApproveInput = z.infer<typeof migrationStagedPlansApproveSchema>;
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