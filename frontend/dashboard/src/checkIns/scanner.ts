import { CheckInMethod } from "@gym-platform/constants";
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

export function buildQrScannerScreen(lastPayload?: string, error?: string): QrScannerScreen {
  const normalizedPayload = lastPayload?.trim();
  return {
    mode: "qr",
    cameraRequested: true,
    canSubmit: Boolean(normalizedPayload),
    ...(normalizedPayload ? { lastPayload: normalizedPayload } : {}),
    ...(error ? { error } : {})
  };
}

export function buildBarcodeInputScreen(value: string, error?: string): BarcodeInputScreen {
  const normalized = normalizeBarcode(value);
  return {
    mode: "barcode",
    value: normalized,
    canSubmit: normalized.length > 0,
    ...(error ? { error } : {})
  };
}

export function createQrCheckInSubmission(input: {
  qrPayload: string;
  locationId: string;
  classSessionId?: string;
}): CheckInSubmission {
  const submission: CheckInSubmission = {
    qrPayload: input.qrPayload.trim(),
    locationId: input.locationId,
    method: CheckInMethod.QrCode
  };
  if (input.classSessionId) {
    submission.classSessionId = input.classSessionId;
  }
  return submission;
}

export function createBarcodeCheckInSubmission(input: {
  barcode: string;
  locationId: string;
  classSessionId?: string;
}): CheckInSubmission {
  const submission: CheckInSubmission = {
    barcode: normalizeBarcode(input.barcode),
    locationId: input.locationId,
    method: CheckInMethod.Barcode
  };
  if (input.classSessionId) {
    submission.classSessionId = input.classSessionId;
  }
  return submission;
}

export function normalizeBarcode(value: string) {
  return value.trim();
}
