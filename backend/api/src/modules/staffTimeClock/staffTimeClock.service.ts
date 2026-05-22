import { LocationStatus, RoleName, UserStatus } from "@gym-platform/constants";
import type { StaffClockInInput, StaffClockOutInput } from "@gym-platform/validation";
import { randomUUID } from "node:crypto";
import { conflict, notFound } from "../../http/errors.js";
import type { StaffTimeEntry } from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";

export interface PublicStaffTimeEntry {
  id: string;
  gymId: string;
  userId: string;
  locationId?: string;
  clockedInAt: string;
  clockedOutAt?: string;
  clockedInByUserId: string;
  clockedOutByUserId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export class StaffTimeClockService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock
  ) {}

  async listEntries(gymId: string): Promise<PublicStaffTimeEntry[]> {
    const entries = await this.repositories.staffTimeEntries.listStaffTimeEntriesForGym(gymId);
    return entries.map(toPublicStaffTimeEntry);
  }

  async listEntriesForStaff(gymId: string, userId: string): Promise<PublicStaffTimeEntry[]> {
    await this.ensureActiveStaff(gymId, userId);
    const entries = await this.repositories.staffTimeEntries.listStaffTimeEntriesForStaff(
      gymId,
      userId
    );
    return entries.map(toPublicStaffTimeEntry);
  }

  async clockIn(
    gymId: string,
    actorUserId: string,
    input: StaffClockInInput
  ): Promise<PublicStaffTimeEntry> {
    await this.ensureActiveStaff(gymId, input.userId);
    if (input.locationId) {
      const location = await this.repositories.locations.getLocation(input.locationId);
      if (!location || location.gymId !== gymId || location.status !== LocationStatus.Active) {
        throw notFound("Location was not found.");
      }
    }
    const openEntry = await this.repositories.staffTimeEntries.findOpenStaffTimeEntry(
      gymId,
      input.userId
    );
    if (openEntry) {
      throw conflict("Staff member is already clocked in.", "staff_already_clocked_in");
    }

    const now = this.clock.now();
    const entry: StaffTimeEntry = {
      id: randomUUID(),
      gymId,
      userId: input.userId,
      clockedInAt: now,
      clockedInByUserId: actorUserId,
      createdAt: now,
      updatedAt: now
    };
    if (input.locationId) {
      entry.locationId = input.locationId;
    }
    if (input.notes) {
      entry.notes = input.notes;
    }
    return toPublicStaffTimeEntry(
      await this.repositories.staffTimeEntries.createStaffTimeEntry(entry)
    );
  }

  async clockOut(
    gymId: string,
    actorUserId: string,
    input: StaffClockOutInput
  ): Promise<PublicStaffTimeEntry> {
    await this.ensureActiveStaff(gymId, input.userId);
    const openEntry = await this.repositories.staffTimeEntries.findOpenStaffTimeEntry(
      gymId,
      input.userId
    );
    if (!openEntry) {
      throw conflict("Staff member is not clocked in.", "staff_not_clocked_in");
    }

    const now = this.clock.now();
    const updated: StaffTimeEntry = {
      ...openEntry,
      clockedOutAt: now,
      clockedOutByUserId: actorUserId,
      updatedAt: now
    };
    if (input.notes) {
      updated.notes = openEntry.notes ? `${openEntry.notes}\n${input.notes}` : input.notes;
    }
    return toPublicStaffTimeEntry(
      await this.repositories.staffTimeEntries.updateStaffTimeEntry(updated)
    );
  }

  private async ensureActiveStaff(gymId: string, userId: string) {
    const membership = await this.repositories.gymUsers.findGymUser(gymId, userId);
    if (!membership || membership.status !== UserStatus.Active) {
      throw notFound("Staff member was not found.");
    }
    const role = await this.repositories.roles.getRole(membership.roleId);
    if (!role || role.gymId !== gymId || role.name === RoleName.Member) {
      throw notFound("Staff member was not found.");
    }
  }
}

function toPublicStaffTimeEntry(entry: StaffTimeEntry): PublicStaffTimeEntry {
  return {
    id: entry.id,
    gymId: entry.gymId,
    userId: entry.userId,
    ...(entry.locationId ? { locationId: entry.locationId } : {}),
    clockedInAt: entry.clockedInAt.toISOString(),
    ...(entry.clockedOutAt ? { clockedOutAt: entry.clockedOutAt.toISOString() } : {}),
    clockedInByUserId: entry.clockedInByUserId,
    ...(entry.clockedOutByUserId ? { clockedOutByUserId: entry.clockedOutByUserId } : {}),
    ...(entry.notes ? { notes: entry.notes } : {}),
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString()
  };
}
