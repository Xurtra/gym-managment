import { BookingStatus, CheckInMethod, CheckInStatus, ClassSessionStatus, LocationStatus, MemberStatus, MembershipStatus } from "@gym-platform/constants";
import { randomUUID } from "node:crypto";
import { badRequest, notFound } from "../../http/errors.js";
const allowedMemberStatuses = new Set([MemberStatus.Active, MemberStatus.Trial]);
const deniedMemberStatuses = new Set([
    MemberStatus.Frozen,
    MemberStatus.Expired,
    MemberStatus.Cancelled,
    MemberStatus.PastDue
]);
const activeMembershipStatuses = new Set([
    MembershipStatus.Active,
    MembershipStatus.Trialing
]);
const deniedMembershipStatuses = new Set([
    MembershipStatus.Paused,
    MembershipStatus.Expired,
    MembershipStatus.Canceled,
    MembershipStatus.PastDue
]);
export class CheckInService {
    repositories;
    clock;
    constructor(repositories, clock) {
        this.repositories = repositories;
        this.clock = clock;
    }
    async listForMember(gymId, memberId) {
        const member = await this.getScopedMember(gymId, memberId);
        return this.repositories.checkIns.listCheckInsForMember(member.id);
    }
    async checkIn(gymId, staffUserId, input) {
        const member = await this.resolveMember(gymId, input);
        const location = await this.repositories.locations.getLocation(input.locationId);
        if (!location || location.gymId !== gymId || location.status !== LocationStatus.Active) {
            throw notFound("Location was not found.");
        }
        const now = this.clock.now();
        const denial = await this.getDenialReason(gymId, member, input.classSessionId);
        const overrideEligibility = input.overrideEligibility ?? false;
        const allowed = !denial || overrideEligibility;
        const checkIn = {
            id: randomUUID(),
            gymId,
            memberId: member.id,
            locationId: location.id,
            status: allowed ? CheckInStatus.Allowed : CheckInStatus.Denied,
            method: input.method ?? CheckInMethod.StaffManual,
            staffOverride: Boolean(denial && overrideEligibility),
            checkedInAt: now,
            createdByUserId: staffUserId,
            createdAt: now,
            updatedAt: now
        };
        if (input.classSessionId) {
            checkIn.classSessionId = input.classSessionId;
        }
        if (denial && !allowed) {
            checkIn.deniedReason = denial;
        }
        if (denial && allowed) {
            checkIn.deniedReason = denial;
            if (input.overrideReason) {
                checkIn.overrideReason = input.overrideReason;
            }
        }
        const bookingId = await this.findBookedClassBooking(member.id, input.classSessionId);
        if (bookingId) {
            checkIn.bookingId = bookingId;
        }
        return this.repositories.checkIns.createCheckIn(checkIn);
    }
    async checkInCode(gymId, memberId) {
        const member = await this.getScopedMember(gymId, memberId);
        const code = {
            qrPayload: `gym:${gymId}:member:${memberId}`,
            barcodeFallback: memberId
        };
        return member.barcode ? { ...code, barcode: member.barcode } : code;
    }
    async resolveMember(gymId, input) {
        const memberId = input.memberId ?? memberIdFromQrPayload(gymId, input.qrPayload);
        if (memberId) {
            return this.getScopedMember(gymId, memberId);
        }
        if (!input.barcode) {
            throw badRequest("A member ID, barcode, or QR payload is required.", "member_lookup_required");
        }
        const member = (await this.repositories.members.listMembersForGym(gymId)).find((candidate) => candidate.barcode === input.barcode);
        if (!member || member.status === MemberStatus.Archived) {
            throw notFound("Member was not found.");
        }
        return member;
    }
    async getScopedMember(gymId, memberId) {
        const member = await this.repositories.members.getMember(memberId);
        if (!member || member.gymId !== gymId || member.status === MemberStatus.Archived) {
            throw notFound("Member was not found.");
        }
        return member;
    }
    async getDenialReason(gymId, member, classSessionId) {
        if (deniedMemberStatuses.has(member.status)) {
            return `member_status_${member.status}`;
        }
        if (!allowedMemberStatuses.has(member.status)) {
            return "member_not_active";
        }
        const membershipDenial = await this.getMembershipDenial(member.id, gymId);
        if (membershipDenial) {
            return membershipDenial;
        }
        if (classSessionId) {
            const classDenial = await this.getClassBookingDenial(gymId, member.id, classSessionId);
            if (classDenial) {
                return classDenial;
            }
        }
        return undefined;
    }
    async getMembershipDenial(memberId, gymId) {
        const now = this.clock.now();
        const memberships = (await this.repositories.memberMemberships.listMemberMembershipsForMember(memberId)).filter((membership) => membership.gymId === gymId);
        const active = memberships.some((membership) => activeMembershipStatuses.has(membership.status) &&
            membership.startsAt <= now &&
            (!membership.endsAt || membership.endsAt >= now));
        if (active) {
            return undefined;
        }
        if (memberships.some((membership) => deniedMembershipStatuses.has(membership.status))) {
            return "membership_not_active";
        }
        return "active_membership_required";
    }
    async getClassBookingDenial(gymId, memberId, classSessionId) {
        const session = await this.repositories.classes.getClassSession(classSessionId);
        if (!session || session.gymId !== gymId || session.status !== ClassSessionStatus.Scheduled) {
            return "class_session_not_available";
        }
        const bookingId = await this.findBookedClassBooking(memberId, classSessionId);
        return bookingId ? undefined : "class_booking_required";
    }
    async findBookedClassBooking(memberId, classSessionId) {
        if (!classSessionId) {
            return undefined;
        }
        const bookings = await this.repositories.bookings.listClassBookingsForMember(memberId);
        return bookings.find((booking) => booking.classSessionId === classSessionId && booking.status === BookingStatus.Booked)?.id;
    }
}
function memberIdFromQrPayload(gymId, qrPayload) {
    if (!qrPayload) {
        return undefined;
    }
    const match = qrPayload.match(/^gym:([^:]+):member:([^:]+)$/);
    if (!match || match[1] !== gymId) {
        throw badRequest("QR check-in payload is invalid.", "invalid_qr_payload");
    }
    return match[2];
}
//# sourceMappingURL=checkIn.service.js.map