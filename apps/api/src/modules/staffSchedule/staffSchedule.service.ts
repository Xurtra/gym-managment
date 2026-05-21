import { LocationStatus, RoleName, UserStatus } from "@gym-platform/constants";
import type {
  StaffAvailabilityCreateInput,
  StaffShiftCreateInput,
  StaffTaskCreateInput,
  StaffTaskUpdateInput
} from "@gym-platform/validation";
import { randomUUID } from "node:crypto";
import { badRequest, conflict, notFound } from "../../http/errors.js";
import type {
  StaffAvailability,
  StaffShift,
  StaffTask
} from "../../infrastructure/store/entities.js";
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

  async listShifts(gymId: string) {
    return (await this.repositories.staffShifts.listStaffShiftsForGym(gymId)).map(
      toPublicStaffShift
    );
  }

  async createAvailability(gymId: string, input: StaffAvailabilityCreateInput) {
    await this.ensureStaffUser(gymId, input.userId);
    await this.ensureLocation(gymId, input.locationId);
    if (input.endsAt <= input.startsAt) {
      throw badRequest(
        "Availability end time must be after start time.",
        "invalid_availability_time"
      );
    }
    const now = this.clock.now();
    const availability: StaffAvailability = {
      id: randomUUID(),
      gymId,
      userId: input.userId,
      weekday: input.weekday,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      createdAt: now,
      updatedAt: now
    };
    if (input.locationId) {
      availability.locationId = input.locationId;
    }
    return this.repositories.staffShifts.createStaffAvailability(availability);
  }

  async listAvailability(gymId: string) {
    return this.repositories.staffShifts.listStaffAvailabilitiesForGym(gymId);
  }

  async createTask(gymId: string, createdByUserId: string, input: StaffTaskCreateInput) {
    if (input.assignedToUserId) {
      await this.ensureStaffUser(gymId, input.assignedToUserId);
    }
    const now = this.clock.now();
    const task: StaffTask = {
      id: randomUUID(),
      gymId,
      title: input.title,
      status: "todo",
      createdByUserId,
      createdAt: now,
      updatedAt: now
    };
    if (input.description) {
      task.description = input.description;
    }
    if (input.assignedToUserId) {
      task.assignedToUserId = input.assignedToUserId;
    }
    if (input.dueAt) {
      task.dueAt = new Date(input.dueAt);
    }
    return this.repositories.staffShifts.createStaffTask(task);
  }

  async listTasks(gymId: string) {
    return this.repositories.staffShifts.listStaffTasksForGym(gymId);
  }

  async updateTask(gymId: string, taskId: string, input: StaffTaskUpdateInput) {
    const existing = await this.repositories.staffShifts.getStaffTask(taskId);
    if (!existing || existing.gymId !== gymId) {
      throw notFound("Staff task was not found.");
    }
    if (input.assignedToUserId) {
      await this.ensureStaffUser(gymId, input.assignedToUserId);
    }
    const now = this.clock.now();
    const updated: StaffTask = {
      ...existing,
      title: input.title ?? existing.title,
      status: input.status ?? existing.status,
      updatedAt: now
    };
    if ("description" in input) {
      if (input.description) {
        updated.description = input.description;
      } else {
        delete updated.description;
      }
    }
    if ("assignedToUserId" in input) {
      if (input.assignedToUserId) {
        updated.assignedToUserId = input.assignedToUserId;
      } else {
        delete updated.assignedToUserId;
      }
    }
    if ("dueAt" in input) {
      if (input.dueAt) {
        updated.dueAt = new Date(input.dueAt);
      } else {
        delete updated.dueAt;
      }
    }
    if (updated.status === "done" && !updated.completedAt) {
      updated.completedAt = now;
    }
    if (updated.status !== "done") {
      delete updated.completedAt;
    }
    return this.repositories.staffShifts.updateStaffTask(updated);
  }

  private async ensureStaffUser(gymId: string, userId: string) {
    const membership = await this.repositories.gymUsers.findGymUser(gymId, userId);
    if (!membership || membership.status !== UserStatus.Active) {
      throw notFound("Staff member was not found.");
    }
    const role = await this.repositories.roles.getRole(membership.roleId);
    if (!role || role.gymId !== gymId || role.name === RoleName.Member) {
      throw notFound("Staff member was not found.");
    }
    return membership;
  }

  private async ensureLocation(gymId: string, locationId?: string) {
    if (!locationId) {
      return;
    }
    const location = await this.repositories.locations.getLocation(locationId);
    if (!location || location.gymId !== gymId || location.status !== LocationStatus.Active) {
      throw notFound("Location was not found.");
    }
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
