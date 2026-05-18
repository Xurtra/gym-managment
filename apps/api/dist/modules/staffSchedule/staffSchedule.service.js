import { LocationStatus, RoleName, UserStatus } from "@gym-platform/constants";
import { randomUUID } from "node:crypto";
import { badRequest, conflict, notFound } from "../../http/errors.js";
export class StaffScheduleService {
    repositories;
    clock;
    constructor(repositories, clock) {
        this.repositories = repositories;
        this.clock = clock;
    }
    async createShift(gymId, createdByUserId, input) {
        const membership = await this.repositories.gymUsers.findGymUser(gymId, input.userId);
        if (!membership || membership.status !== UserStatus.Active) {
            throw notFound("Staff member was not found.");
        }
        const membershipRole = await this.repositories.roles.getRole(membership.roleId);
        if (!membershipRole ||
            membershipRole.gymId !== gymId ||
            membershipRole.name === RoleName.Member) {
            throw notFound("Staff member was not found.");
        }
        const roleId = input.roleId ?? membership.roleId;
        const shiftRole = await this.repositories.roles.getRole(roleId);
        if (!shiftRole || shiftRole.gymId !== gymId || shiftRole.name === RoleName.Member) {
            throw conflict("Shift role must belong to this gym and be a staff role.", "staff_shift_role_invalid");
        }
        if (input.locationId) {
            const location = await this.repositories.locations.getLocation(input.locationId);
            if (!location || location.gymId !== gymId || location.status !== LocationStatus.Active) {
                throw notFound("Location was not found.");
            }
        }
        const startsAt = new Date(input.startsAt);
        const endsAt = new Date(input.endsAt);
        if (endsAt <= startsAt) {
            throw badRequest("Shift end time must be after start time.", "invalid_shift_time");
        }
        const overlapping = (await this.repositories.staffShifts.listStaffShiftsForStaff(gymId, input.userId)).find((shift) => startsAt < shift.endsAt && endsAt > shift.startsAt);
        if (overlapping) {
            throw conflict("Staff member already has a shift during this time.", "staff_shift_overlap");
        }
        const now = this.clock.now();
        const shift = {
            id: randomUUID(),
            gymId,
            userId: input.userId,
            roleId,
            startsAt,
            endsAt,
            createdByUserId,
            createdAt: now,
            updatedAt: now
        };
        if (input.locationId) {
            shift.locationId = input.locationId;
        }
        if (input.notes) {
            shift.notes = input.notes;
        }
        return toPublicStaffShift(await this.repositories.staffShifts.createStaffShift(shift));
    }
}
function toPublicStaffShift(shift) {
    return {
        id: shift.id,
        gymId: shift.gymId,
        userId: shift.userId,
        ...(shift.locationId ? { locationId: shift.locationId } : {}),
        roleId: shift.roleId,
        startsAt: shift.startsAt.toISOString(),
        endsAt: shift.endsAt.toISOString(),
        ...(shift.notes ? { notes: shift.notes } : {}),
        createdByUserId: shift.createdByUserId,
        createdAt: shift.createdAt.toISOString(),
        updatedAt: shift.updatedAt.toISOString()
    };
}
//# sourceMappingURL=staffSchedule.service.js.map