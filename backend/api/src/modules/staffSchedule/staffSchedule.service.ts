import { LocationStatus, RoleName, UserStatus } from "@gym-platform/constants";
import type { StaffShiftCreateInput } from "@gym-platform/validation";
import { randomUUID } from "node:crypto";
import { badRequest, conflict, notFound } from "../../http/errors.js";
import type { StaffShift } from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";

export interface PublicStaffShift {
  id: string;
  gymId: string;
  userId: string;
  locationId?: string;
  roleId: string;
  startsAt: string;
  endsAt: string;
  notes?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export class StaffScheduleService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock
  ) {}

  async listShifts(gymId: string): Promise<PublicStaffShift[]> {
    const shifts = await this.repositories.staffShifts.listStaffShiftsForGym(gymId);
    return shifts.map(toPublicStaffShift);
  }

  async listShiftsForStaff(gymId: string, userId: string): Promise<PublicStaffShift[]> {
    const shifts = await this.repositories.staffShifts.listStaffShiftsForStaff(gymId, userId);
    return shifts.map(toPublicStaffShift);
  }

  async createShift(
    gymId: string,
    createdByUserId: string,
    input: StaffShiftCreateInput
  ): Promise<PublicStaffShift> {
    const membership = await this.repositories.gymUsers.findGymUser(gymId, input.userId);
    if (!membership || membership.status !== UserStatus.Active) {
      throw notFound("Staff member was not found.");
    }
    const membershipRole = await this.repositories.roles.getRole(membership.roleId);
    if (
      !membershipRole ||
      membershipRole.gymId !== gymId ||
      membershipRole.name === RoleName.Member
    ) {
      throw notFound("Staff member was not found.");
    }
    const roleId = input.roleId ?? membership.roleId;
    const shiftRole = await this.repositories.roles.getRole(roleId);
    if (!shiftRole || shiftRole.gymId !== gymId || shiftRole.name === RoleName.Member) {
      throw conflict(
        "Shift role must belong to this gym and be a staff role.",
        "staff_shift_role_invalid"
      );
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
    const overlapping = (
      await this.repositories.staffShifts.listStaffShiftsForStaff(gymId, input.userId)
    ).find((shift) => startsAt < shift.endsAt && endsAt > shift.startsAt);
    if (overlapping) {
      throw conflict("Staff member already has a shift during this time.", "staff_shift_overlap");
    }

    const now = this.clock.now();
    const shift: StaffShift = {
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

function toPublicStaffShift(shift: StaffShift): PublicStaffShift {
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
