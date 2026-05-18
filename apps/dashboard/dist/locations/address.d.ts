import type { InputModel } from "@gym-platform/ui";
import type { LocationAddressView, LocationMapLink } from "./types.js";
export interface AddressValidationState {
    fields: InputModel[];
    errors: Partial<Record<keyof LocationAddressView, string>>;
    canSubmit: boolean;
}
export declare function buildAddressValidationFields(address: Partial<LocationAddressView>): AddressValidationState;
export declare function buildLocationMapLink(address: LocationAddressView, label?: string): LocationMapLink;
export declare function formatAddress(address: LocationAddressView): string;
//# sourceMappingURL=address.d.ts.map