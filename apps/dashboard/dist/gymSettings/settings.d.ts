import type { FeatureFlag } from "@gym-platform/constants";
import type { GymSettingsView, OperatingHoursView } from "./types.js";
export declare function buildGymProfileSettingsPage(gym: GymSettingsView): {
    screen: string;
    title: string;
    slug: string;
    businessInfo: {
        legalName?: string;
        phone?: string;
        email?: string;
        website?: string;
        taxId?: string;
    };
    card: import("@gym-platform/ui").CardModel;
};
export declare function buildGymLogoUploadFlow(gym: GymSettingsView, pendingLogoUrl?: string): {
    screen: string;
    currentLogoUrl: string | undefined;
    pendingLogoUrl: string | undefined;
    canSubmit: boolean;
    action: import("@gym-platform/ui").ButtonModel;
};
export declare function buildBrandColorSettings(gym: GymSettingsView): {
    screen: string;
    fields: import("@gym-platform/ui").InputModel[];
};
export declare function buildBusinessInformationForm(gym: GymSettingsView): {
    screen: string;
    fields: import("@gym-platform/ui").InputModel[];
};
export declare function buildTimezoneLocaleSettings(gym: GymSettingsView): {
    screen: string;
    timezone: string;
    locale: string;
    canSubmit: boolean;
};
export declare function buildOperatingHoursEditor(operatingHours: OperatingHoursView): {
    screen: string;
    table: import("@gym-platform/ui").TableModel<{
        day: string;
        opensAt: string;
        closesAt: string;
    }>;
};
export declare function buildFeatureFlagSettings(activeFlags: FeatureFlag[], allFlags: FeatureFlag[]): {
    screen: string;
    flags: {
        flag: FeatureFlag;
        enabled: boolean;
    }[];
};
//# sourceMappingURL=settings.d.ts.map