import type { CheckInRecord } from "./types.js";
import { buildBarcodeInputScreen, buildQrScannerScreen } from "./scanner.js";
import { type CheckInResultScreen } from "./screens.js";
export interface CheckInKioskScreen {
    screen: "check_in_kiosk";
    mode: "qr" | "barcode";
    autoResetSeconds: number;
    resetAt?: string;
    scanner: ReturnType<typeof buildQrScannerScreen> | ReturnType<typeof buildBarcodeInputScreen>;
    result?: CheckInResultScreen;
}
export declare function buildCheckInKioskScreen(input: {
    mode: "qr" | "barcode";
    autoResetSeconds?: number;
    now?: Date;
    barcodeValue?: string;
    qrPayload?: string;
    result?: CheckInRecord;
}): CheckInKioskScreen;
export declare function shouldResetKiosk(resetAt: string | undefined, now: Date): boolean;
//# sourceMappingURL=kiosk.d.ts.map