import type { CheckInRecord } from "./types.js";
import { buildBarcodeInputScreen, buildQrScannerScreen } from "./scanner.js";
import { buildCheckInResultScreen, type CheckInResultScreen } from "./screens.js";

export interface CheckInKioskScreen {
  screen: "check_in_kiosk";
  mode: "qr" | "barcode";
  autoResetSeconds: number;
  resetAt?: string;
  scanner: ReturnType<typeof buildQrScannerScreen> | ReturnType<typeof buildBarcodeInputScreen>;
  result?: CheckInResultScreen;
}

export function buildCheckInKioskScreen(input: {
  mode: "qr" | "barcode";
  autoResetSeconds?: number;
  now?: Date;
  barcodeValue?: string;
  qrPayload?: string;
  result?: CheckInRecord;
}): CheckInKioskScreen {
  const autoResetSeconds = input.autoResetSeconds ?? 8;
  const screen: CheckInKioskScreen = {
    screen: "check_in_kiosk",
    mode: input.mode,
    autoResetSeconds,
    scanner:
      input.mode === "qr"
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

export function shouldResetKiosk(resetAt: string | undefined, now: Date) {
  return Boolean(resetAt && now.getTime() >= Date.parse(resetAt));
}
