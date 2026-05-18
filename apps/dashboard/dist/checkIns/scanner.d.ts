import type { CheckInSubmission } from "./types.js";
export interface QrScannerScreen {
    mode: "qr";
    cameraRequested: boolean;
    canSubmit: boolean;
    lastPayload?: string;
    error?: string;
}
export interface BarcodeInputScreen {
    mode: "barcode";
    value: string;
    canSubmit: boolean;
    error?: string;
}
export declare function buildQrScannerScreen(lastPayload?: string, error?: string): QrScannerScreen;
export declare function buildBarcodeInputScreen(value: string, error?: string): BarcodeInputScreen;
export declare function createQrCheckInSubmission(input: {
    qrPayload: string;
    locationId: string;
    classSessionId?: string;
}): CheckInSubmission;
export declare function createBarcodeCheckInSubmission(input: {
    barcode: string;
    locationId: string;
    classSessionId?: string;
}): CheckInSubmission;
export declare function normalizeBarcode(value: string): string;
//# sourceMappingURL=scanner.d.ts.map