import { input } from "@gym-platform/ui";
import type { InputModel } from "@gym-platform/ui";
import type { LocationAddressView, LocationMapLink } from "./types.js";

const countryPattern = /^[A-Z]{2}$/;

export interface AddressValidationState {
  fields: InputModel[];
  errors: Partial<Record<keyof LocationAddressView, string>>;
  canSubmit: boolean;
}

export function buildAddressValidationFields(address: Partial<LocationAddressView>): AddressValidationState {
  const normalized = normalizeAddress(address);
  const errors: Partial<Record<keyof LocationAddressView, string>> = {};

  if (!normalized.line1) {
    errors.line1 = "Street address is required.";
  }
  if (!normalized.city) {
    errors.city = "City is required.";
  }
  if (!normalized.region) {
    errors.region = "Region is required.";
  }
  if (!normalized.postalCode) {
    errors.postalCode = "Postal code is required.";
  }
  if (!countryPattern.test(normalized.country)) {
    errors.country = "Use a two-letter country code.";
  }

  return {
    fields: [
      input({
        name: "line1",
        label: "Street address",
        value: normalized.line1,
        type: "text",
        required: true,
        ...(errors.line1 ? { error: errors.line1 } : {})
      }),
      input({
        name: "line2",
        label: "Suite",
        value: normalized.line2,
        type: "text",
        required: false
      }),
      input({
        name: "city",
        label: "City",
        value: normalized.city,
        type: "text",
        required: true,
        ...(errors.city ? { error: errors.city } : {})
      }),
      input({
        name: "region",
        label: "Region",
        value: normalized.region,
        type: "text",
        required: true,
        ...(errors.region ? { error: errors.region } : {})
      }),
      input({
        name: "postalCode",
        label: "Postal code",
        value: normalized.postalCode,
        type: "text",
        required: true,
        ...(errors.postalCode ? { error: errors.postalCode } : {})
      }),
      input({
        name: "country",
        label: "Country",
        value: normalized.country,
        type: "text",
        required: true,
        ...(errors.country ? { error: errors.country } : {})
      })
    ],
    errors,
    canSubmit: Object.keys(errors).length === 0
  };
}

export function buildLocationMapLink(
  address: LocationAddressView,
  label = "Open in maps"
): LocationMapLink {
  const displayAddress = formatAddress(address);
  return {
    label,
    address: displayAddress,
    href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress)}`
  };
}

export function formatAddress(address: LocationAddressView) {
  return [
    address.line1,
    address.line2,
    address.city,
    address.region,
    address.postalCode,
    address.country
  ]
    .filter(Boolean)
    .join(", ");
}

function normalizeAddress(address: Partial<LocationAddressView>) {
  return {
    line1: address.line1?.trim() ?? "",
    line2: address.line2?.trim() ?? "",
    city: address.city?.trim() ?? "",
    region: address.region?.trim() ?? "",
    postalCode: address.postalCode?.trim() ?? "",
    country: address.country?.trim().toUpperCase() ?? ""
  };
}
