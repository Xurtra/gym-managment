import { CheckInMethod, CheckInStatus, MemberStatus } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import { buildBarcodeInputScreen, buildCheckInHistoryScreen, buildCheckInKioskScreen, buildCheckInResultScreen, buildFrontDeskCheckInScreen, buildMemberSearchScreen, buildQrScannerScreen, createBarcodeCheckInSubmission, createManualCheckInSubmission, createQrCheckInSubmission, exportCheckInHistoryCsv, shouldResetKiosk, warningForMember } from "./index.js";
const members = [
    {
        id: "member-1",
        firstName: "Jamie",
        lastName: "Rivera",
        email: "jamie@example.com",
        phone: "555-0101",
        barcode: "MEM-100",
        status: MemberStatus.Active
    },
    {
        id: "member-2",
        firstName: "Jordan",
        lastName: "Lee",
        email: "jordan@example.com",
        phone: "555-0102",
        barcode: "MEM-200",
        status: MemberStatus.PastDue
    }
];
const allowedRecord = {
    id: "check-in-1",
    memberId: "member-1",
    memberName: "Jamie Rivera",
    locationId: "location-1",
    locationName: "Main Floor",
    classSessionId: "session-1",
    className: "Strength Foundations",
    bookingId: "booking-1",
    status: CheckInStatus.Allowed,
    method: CheckInMethod.QrCode,
    staffOverride: false,
    checkedInAt: "2026-05-16T12:00:00.000Z"
};
const deniedRecord = {
    id: "check-in-2",
    memberId: "member-2",
    memberName: "Jordan Lee",
    locationId: "location-1",
    locationName: "Main Floor",
    status: CheckInStatus.Denied,
    method: CheckInMethod.Barcode,
    staffOverride: false,
    deniedReason: "member_status_past_due",
    checkedInAt: "2026-05-16T12:03:00.000Z"
};
describe("check-in dashboard screens", () => {
    it("builds the front desk search screen and manual submission", () => {
        const search = buildMemberSearchScreen(members, "mem-100", "member-1");
        const screen = buildFrontDeskCheckInScreen({
            members: search.results,
            locations: [{ id: "location-1", name: "Main Floor" }],
            selectedLocationId: "location-1"
        });
        const submission = createManualCheckInSubmission({
            memberId: "member-1",
            locationId: "location-1"
        });
        expect(search.results).toHaveLength(1);
        expect(search.selectedMember?.id).toBe("member-1");
        expect(screen.canSubmit).toBe(true);
        expect(submission).toEqual({
            memberId: "member-1",
            locationId: "location-1",
            method: CheckInMethod.StaffManual
        });
    });
    it("builds QR and barcode scanner submissions", () => {
        const qrScreen = buildQrScannerScreen(" gym:gym-1:member:member-1 ");
        const barcodeScreen = buildBarcodeInputScreen(" MEM-100 ");
        const qrSubmission = createQrCheckInSubmission({
            qrPayload: " gym:gym-1:member:member-1 ",
            locationId: "location-1",
            classSessionId: "session-1"
        });
        const barcodeSubmission = createBarcodeCheckInSubmission({
            barcode: " MEM-100 ",
            locationId: "location-1"
        });
        expect(qrScreen.canSubmit).toBe(true);
        expect(qrScreen.lastPayload).toBe("gym:gym-1:member:member-1");
        expect(barcodeScreen.value).toBe("MEM-100");
        expect(qrSubmission.method).toBe(CheckInMethod.QrCode);
        expect(qrSubmission.classSessionId).toBe("session-1");
        expect(barcodeSubmission).toEqual({
            barcode: "MEM-100",
            locationId: "location-1",
            method: CheckInMethod.Barcode
        });
    });
    it("builds success, denied, and payment warning result states", () => {
        const success = buildCheckInResultScreen(allowedRecord);
        const denied = buildCheckInResultScreen(deniedRecord);
        expect(success.screen).toBe("check_in_success");
        expect(success.bookingId).toBe("booking-1");
        expect(denied.screen).toBe("check_in_denied");
        expect(denied.canOverride).toBe(true);
        expect(denied.warning).toBe("Payment or membership needs review");
        expect(warningForMember(members[1])).toBe("Payment past due");
    });
    it("filters history and exports CSV", () => {
        const history = buildCheckInHistoryScreen([allowedRecord, deniedRecord], {
            status: CheckInStatus.Denied
        });
        const csv = exportCheckInHistoryCsv(history.records);
        expect(history.total).toBe(1);
        expect(history.records[0]?.id).toBe("check-in-2");
        expect(csv).toContain('"Jordan Lee"');
        expect(csv).toContain('"member_status_past_due"');
    });
    it("builds kiosk mode and auto-reset state", () => {
        const kiosk = buildCheckInKioskScreen({
            mode: "barcode",
            barcodeValue: "MEM-100",
            result: allowedRecord,
            now: new Date("2026-05-16T12:00:00.000Z"),
            autoResetSeconds: 5
        });
        expect(kiosk.screen).toBe("check_in_kiosk");
        expect(kiosk.result?.screen).toBe("check_in_success");
        expect(kiosk.resetAt).toBe("2026-05-16T12:00:05.000Z");
        expect(shouldResetKiosk(kiosk.resetAt, new Date("2026-05-16T12:00:04.999Z"))).toBe(false);
        expect(shouldResetKiosk(kiosk.resetAt, new Date("2026-05-16T12:00:05.000Z"))).toBe(true);
    });
});
//# sourceMappingURL=checkInDashboard.test.js.map