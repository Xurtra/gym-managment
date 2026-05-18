import { CheckInMethod } from "@gym-platform/constants";
export function buildQrScannerScreen(lastPayload, error) {
    const normalizedPayload = lastPayload?.trim();
    return {
        mode: "qr",
        cameraRequested: true,
        canSubmit: Boolean(normalizedPayload),
        ...(normalizedPayload ? { lastPayload: normalizedPayload } : {}),
        ...(error ? { error } : {})
    };
}
export function buildBarcodeInputScreen(value, error) {
    const normalized = normalizeBarcode(value);
    return {
        mode: "barcode",
        value: normalized,
        canSubmit: normalized.length > 0,
        ...(error ? { error } : {})
    };
}
export function createQrCheckInSubmission(input) {
    const submission = {
        qrPayload: input.qrPayload.trim(),
        locationId: input.locationId,
        method: CheckInMethod.QrCode
    };
    if (input.classSessionId) {
        submission.classSessionId = input.classSessionId;
    }
    return submission;
}
export function createBarcodeCheckInSubmission(input) {
    const submission = {
        barcode: normalizeBarcode(input.barcode),
        locationId: input.locationId,
        method: CheckInMethod.Barcode
    };
    if (input.classSessionId) {
        submission.classSessionId = input.classSessionId;
    }
    return submission;
}
export function normalizeBarcode(value) {
    return value.trim();
}
//# sourceMappingURL=scanner.js.map