import { buildBarcodeInputScreen, buildQrScannerScreen } from "./scanner.js";
import { buildCheckInResultScreen } from "./screens.js";
export function buildCheckInKioskScreen(input) {
    const autoResetSeconds = input.autoResetSeconds ?? 8;
    const screen = {
        screen: "check_in_kiosk",
        mode: input.mode,
        autoResetSeconds,
        scanner: input.mode === "qr"
            ? buildQrScannerScreen(input.qrPayload)
            : buildBarcodeInputScreen(input.barcodeValue ?? "")
    };
    if (input.result) {
        screen.result = buildCheckInResultScreen(input.result);
        const now = input.now ?? new Date();
        screen.resetAt = new Date(now.getTime() + autoResetSeconds * 1000).toISOString();
    }
    return screen;
}
export function shouldResetKiosk(resetAt, now) {
    return Boolean(resetAt && now.getTime() >= Date.parse(resetAt));
}
//# sourceMappingURL=kiosk.js.map