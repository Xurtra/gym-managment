import { input } from "@gym-platform/ui";
const countryPattern = /^[A-Z]{2}$/;
const requiredAddressFields = ["line1", "city", "region", "postalCode", "country"];
export function buildAddressValidationFields(address) {
    const normalized = normalizeAddress(address);
    const errors = {};
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
    const fieldLookup = {
        line1: input({
            name: "line1",
            label: "Street address",
            value: normalized.line1,
            type: "text",
            required: true,
            ...(errors.line1 ? { error: errors.line1 } : {})
        }),
        line2: input({
            name: "line2",
            label: "Suite",
            value: normalized.line2,
            type: "text",
            required: false
        }),
        city: input({
            name: "city",
            label: "City",
            value: normalized.city,
            type: "text",
            required: true,
            ...(errors.city ? { error: errors.city } : {})
        }),
        region: input({
            name: "region",
            label: "Region",
            value: normalized.region,
            type: "text",
            required: true,
            ...(errors.region ? { error: errors.region } : {})
        }),
        postalCode: input({
            name: "postalCode",
            label: "Postal code",
            value: normalized.postalCode,
            type: "text",
            required: true,
            ...(errors.postalCode ? { error: errors.postalCode } : {})
        }),
        country: input({
            name: "country",
            label: "Country",
            value: normalized.country,
            type: "text",
            required: true,
            ...(errors.country ? { error: errors.country } : {})
        })
    };
    const missingRequiredFields = requiredAddressFields.filter((field) => !normalized[field]);
    const errorCount = Object.keys(errors).length;
    return {
        fields: [
            fieldLookup.line1,
            fieldLookup.line2,
            fieldLookup.city,
            fieldLookup.region,
            fieldLookup.postalCode,
            fieldLookup.country
        ],
        fieldLookup,
        normalizedAddress: normalized,
        errors,
        missingRequiredFields,
        errorCount,
        canSubmit: errorCount === 0
    };
}
export function buildLocationMapLink(address, label = "Open in maps") {
    const displayAddress = formatAddress(address);
    const query = encodeURIComponent(displayAddress);
    return {
        label,
        shortLabel: "Maps",
        address: displayAddress,
        query,
        href: `https://www.google.com/maps/search/?api=1&query=${query}`,
        external: true
    };
}
export function formatAddress(address) {
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
function normalizeAddress(address) {
    return {
        line1: address.line1?.trim() ?? "",
        line2: address.line2?.trim() ?? "",
        city: address.city?.trim() ?? "",
        region: address.region?.trim() ?? "",
        postalCode: address.postalCode?.trim() ?? "",
        country: address.country?.trim().toUpperCase() ?? ""
    };
}
//# sourceMappingURL=address.js.map