import type { FeatureFlag } from "@gym-platform/constants";
import { button, card, input, table } from "@gym-platform/ui";
import type { GymSettingsView, OperatingHoursView } from "./types.js";

export function buildGymProfileSettingsPage(gym: GymSettingsView) {
  return {
    screen: "gym_profile_settings",
    title: gym.name,
    slug: gym.slug,
    businessInfo: gym.businessInfo ?? {},
    card: card({
      title: "Gym Profile",
      body: gym.slug,
      actions: [button({ label: "Save profile" })]
    })
  };
}

export function buildGymLogoUploadFlow(gym: GymSettingsView, pendingLogoUrl?: string) {
  return {
    screen: "gym_logo_upload",
    currentLogoUrl: gym.logoUrl,
    pendingLogoUrl,
    canSubmit: Boolean(pendingLogoUrl),
    action: button({ label: "Upload logo", disabled: !pendingLogoUrl })
  };
}

export function buildBrandColorSettings(gym: GymSettingsView) {
  return {
    screen: "gym_brand_colors",
    fields: [
      input({
        name: "primary",
        label: "Primary",
        value: gym.brandColors?.primary ?? "#111827",
        type: "text",
        required: true
      }),
      input({
        name: "secondary",
        label: "Secondary",
        value: gym.brandColors?.secondary ?? "#2563EB",
        type: "text",
        required: false
      }),
      input({
        name: "accent",
        label: "Accent",
        value: gym.brandColors?.accent ?? "#16A34A",
        type: "text",
        required: false
      })
    ]
  };
}

export function buildBusinessInformationForm(gym: GymSettingsView) {
  const business = gym.businessInfo ?? {};
  return {
    screen: "gym_business_info",
    fields: [
      input({ name: "legalName", label: "Legal name", value: business.legalName ?? "", type: "text", required: false }),
      input({ name: "phone", label: "Phone", value: business.phone ?? "", type: "tel", required: false }),
      input({ name: "email", label: "Email", value: business.email ?? "", type: "email", required: false }),
      input({ name: "website", label: "Website", value: business.website ?? "", type: "text", required: false }),
      input({ name: "taxId", label: "Tax ID", value: business.taxId ?? "", type: "text", required: false })
    ]
  };
}

export function buildTimezoneLocaleSettings(gym: GymSettingsView) {
  return {
    screen: "gym_timezone_locale",
    timezone: gym.timezone,
    locale: gym.locale,
    canSubmit: Boolean(gym.timezone && gym.locale)
  };
}

export function buildOperatingHoursEditor(operatingHours: OperatingHoursView) {
  const rows = Object.entries(operatingHours).flatMap(([day, ranges]) =>
    (ranges ?? []).map((range) => ({ day, opensAt: range.opensAt, closesAt: range.closesAt }))
  );
  return {
    screen: "gym_operating_hours",
    table: table({
      columns: [
        { key: "day", label: "Day" },
        { key: "opensAt", label: "Opens" },
        { key: "closesAt", label: "Closes" }
      ],
      rows
    })
  };
}

export function buildFeatureFlagSettings(activeFlags: FeatureFlag[], allFlags: FeatureFlag[]) {
  return {
    screen: "gym_feature_flags",
    flags: allFlags.map((flag) => ({
      flag,
      enabled: activeFlags.includes(flag)
    }))
  };
}
