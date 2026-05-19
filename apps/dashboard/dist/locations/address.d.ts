import type { InputModel } from "@gym-platform/ui";
import type { LocationAddressView, LocationMapLink } from "./types.js";
declare const requiredAddressFields: readonly ["line1", "city", "region", "postalCode", "country"];
export interface AddressValidationState {
    fields: InputModel[];
    fieldLookup: Record<keyof LocationAddressView, InputModel>;
    normalizedAddress: Record<keyof LocationAddressView, string>;
    errors: Partial<Record<keyof LocationAddressView, string>>;
    missingRequiredFields: Array<(typeof requiredAddressFields)[number]>;
    errorCount: number;
    canSubmit: boolean;
}
export declare function buildAddressValidationFields(address: Partial<LocationAddressView>): AddressValidationState;
export declare function buildLocationMapLink(address: LocationAddressView, label?: string): LocationMapLink;
export declare function formatAddress(address: LocationAddressView): string;
export {};
//# sourceMappingURL=address.d.ts.map