import { LocationStatus, RoleName, UserStatus } from "@gym-platform/constants";
import type {
  SchedulerAvailabilityCreateInput,
  SchedulerCoverageRuleCreateInput,
  SchedulerGenerateInput,
  SchedulerPreferenceRequestCreateInput,
  SchedulerPreferenceRequestResolveInput,
  SchedulerPublishInput,
  SchedulerRequestCreateInput,
  SchedulerRequestResolveInput,
  SchedulerSettingsUpdateInput
} from "@gym-platform/validation";
import { randomUUID } from "node:crypto";
import { badRequest, conflict, notFound } from "../../http/errors.js";
import type {
  GymUser,
  Role,
  SchedulerAvailability,
  SchedulerCoverageRule,
  SchedulerPreferenceRequest,
  SchedulerSettings,
  SchedulerRequest,
  StaffShift
} from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";
import { toPublicStaffShift, type PublicStaffShift } from "../staffSchedule/staffSchedule.service.js";

export interface PublicSchedulerCoverageRule {
  id: string;
  gymId: string;
  name: string;
  locationId?: string;
  roleId: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  requiredStaff: number;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicSchedulerAvailability {
  id: string;
  gymId: string;
  userId: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  preference: SchedulerAvailability["preference"];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicSchedulerSettings {
  gymId: string;
  planningHorizonDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicSchedulerPreferenceRequest {
  id: string;
  gymId: string;
  userId: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  preference: SchedulerAvailability["preference"];
  notes?: string;
  status: SchedulerPreferenceRequest["status"];
  resolutionNote?: string;
  resolvedByUserId?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface PublicSchedulerRequest {
  id: string;
  gymId: string;
  userId: string;
  shiftId?: string;
  requestType: SchedulerRequest["requestType"];
  message: string;
  status: SchedulerRequest["status"];
  suggestedReplacementUserId?: string;
  resolutionNote?: string;
  resolvedByUserId?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface ScheduleDraftAssignment {
  id: string;
  ruleId: string;
  date: string;
  userId?: string;
  roleId: string;
  locationId?: string;
  startsAt: string;
  endsAt: string;
  score: number;
  reason: string;
  warnings: string[];
}

export interface ScheduleDraft {
  startsOn: string;
  endsOn: string;
  assignments: ScheduleDraftAssignment[];
  warnings: string[];
}

interface Candidate {
  membership: GymUser;
  role: Role;
  score: number;
  reason: string;
  assignedMinutes: number;
}

const DEFAULT_PLANNING_HORIZON_DAYS = 14;

export class SchedulerService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock
  ) {}

  async getSettings(gymId: string) {
    const settings = await this.repositories.scheduler.getSettings(gymId);
    if (settings) {
      return toPublicSettings(settings);
    }
    const now = this.clock.now();
    const fallback: SchedulerSettings = {
      gymId,
      planningHorizonDays: DEFAULT_PLANNING_HORIZON_DAYS,
      createdAt: now,
      updatedAt: now
    };
    return toPublicSettings(await this.repositories.scheduler.upsertSettings(fallback));
  }

  async updateSettings(gymId: string, input: SchedulerSettingsUpdateInput) {
    const current = await this.repositories.scheduler.getSettings(gymId);
    const now = this.clock.now();
    const settings: SchedulerSettings = {
      gymId,
      planningHorizonDays: input.planningHorizonDays,
      createdAt: current?.createdAt ?? now,
      updatedAt: now
    };
    return toPublicSettings(await this.repositories.scheduler.upsertSettings(settings));
  }

  async listCoverageRules(gymId: string) {
    const rules = await this.repositories.scheduler.listCoverageRulesForGym(gymId);
    return rules.map(toPublicCoverageRule);
  }

  async createCoverageRule(
    gymId: string,
    actorUserId: string,
    input: SchedulerCoverageRuleCreateInput
  ) {
    await this.ensureShiftRole(gymId, input.roleId);
    if (input.locationId) {
      await this.ensureActiveLocation(gymId, input.locationId);
    }
    const now = this.clock.now();
    const rule: SchedulerCoverageRule = {
      id: randomUUID(),
      gymId,
      name: input.name,
      ...(input.locationId ? { locationId: input.locationId } : {}),
      roleId: input.roleId,
      daysOfWeek: [...new Set(input.daysOfWeek)].sort(),
      startTime: input.startTime,
      endTime: input.endTime,
      requiredStaff: input.requiredStaff,
      createdByUserId: actorUserId,
      createdAt: now,
      updatedAt: now
    };
    return toPublicCoverageRule(await this.repositories.scheduler.createCoverageRule(rule));
  }

  async listAvailabilities(gymId: string, userIds?: Set<string>) {
    const records = await this.repositories.scheduler.listAvailabilitiesForGym(gymId);
    return records
      .filter((availability) => !userIds || userIds.has(availability.userId))
      .map(toPublicAvailability);
  }

  async createAvailability(gymId: string, input: SchedulerAvailabilityCreateInput) {
    await this.ensureActiveStaff(gymId, input.userId);
    const now = this.clock.now();
    const availability: SchedulerAvailability = {
      id: randomUUID(),
      gymId,
      userId: input.userId,
      daysOfWeek: [...new Set(input.daysOfWeek)].sort(),
      startTime: input.startTime,
      endTime: input.endTime,
      preference: input.preference,
      ...(input.notes ? { notes: input.notes } : {}),
      createdAt: now,
      updatedAt: now
    };
    return toPublicAvailability(await this.repositories.scheduler.createAvailability(availability));
  }

  async listPreferenceRequests(gymId: string, userIds?: Set<string>) {
    const requests = await this.repositories.scheduler.listPreferenceRequestsForGym(gymId);
    return requests.filter((request) => !userIds || userIds.has(request.userId)).map(toPublicPreferenceRequest);
  }

  async listPreferenceRequestsForStaff(gymId: string, userId: string) {
    const requests = await this.repositories.scheduler.listPreferenceRequestsForStaff(gymId, userId);
    return requests.map(toPublicPreferenceRequest);
  }

  async createPreferenceRequest(
    gymId: string,
    userId: string,
    input: SchedulerPreferenceRequestCreateInput
  ) {
    await this.ensureActiveStaff(gymId, userId);
    const now = this.clock.now();
    const request: SchedulerPreferenceRequest = {
      id: randomUUID(),
      gymId,
      userId,
      daysOfWeek: [...new Set(input.daysOfWeek)].sort(),
      startTime: input.startTime,
      endTime: input.endTime,
      preference: input.preference,
      ...(input.notes ? { notes: input.notes } : {}),
      status: "open",
      createdAt: now,
      updatedAt: now
    };
    return toPublicPreferenceRequest(await this.repositories.scheduler.createPreferenceRequest(request));
  }

  async resolvePreferenceRequest(
    gymId: string,
    requestId: string,
    actorUserId: string,
    input: SchedulerPreferenceRequestResolveInput
  ) {
    const request = await this.repositories.scheduler.getPreferenceRequest(requestId);
    if (!request || request.gymId !== gymId) {
      throw notFound("Preference request was not found.");
    }
    if (request.status !== "open") {
      throw conflict("Preference request has already been reviewed.", "preference_request_closed");
    }
    const now = this.clock.now();
    if (input.decision === "approve") {
      const availability: SchedulerAvailability = {
        id: randomUUID(),
        gymId,
        userId: request.userId,
        daysOfWeek: request.daysOfWeek,
        startTime: request.startTime,
        endTime: request.endTime,
        preference: request.preference,
        ...(request.notes ? { notes: request.notes } : {}),
        createdAt: now,
        updatedAt: now
      };
      await this.repositories.scheduler.replaceAvailabilitiesForStaff(gymId, request.userId, [availability]);
    }
    const reviewed: SchedulerPreferenceRequest = {
      ...request,
      status: input.decision === "approve" ? "approved" : "declined",
      resolutionNote:
        input.resolutionNote ??
        (input.decision === "approve"
          ? "Long-term scheduling preference approved."
          : "Long-term scheduling preference declined."),
      resolvedByUserId: actorUserId,
      resolvedAt: now,
      updatedAt: now
    };
    return toPublicPreferenceRequest(await this.repositories.scheduler.updatePreferenceRequest(reviewed));
  }

  async listRequests(gymId: string, userIds?: Set<string>) {
    const requests = await this.repositories.scheduler.listRequestsForGym(gymId);
    return requests.filter((request) => !userIds || userIds.has(request.userId)).map(toPublicRequest);
  }

  async listRequestsForStaff(gymId: string, userId: string) {
    const requests = await this.repositories.scheduler.listRequestsForStaff(gymId, userId);
    return requests.map(toPublicRequest);
  }

  async createRequest(gymId: string, userId: string, input: SchedulerRequestCreateInput) {
    await this.ensureActiveStaff(gymId, userId);
    if (input.shiftId) {
      const shift = (await this.repositories.staffShifts.listStaffShiftsForStaff(gymId, userId)).find(
        (candidate) => candidate.id === input.shiftId
      );
      if (!shift) {
        throw notFound("Shift was not found for this employee.");
      }
    }
    const now = this.clock.now();
    const request: SchedulerRequest = {
      id: randomUUID(),
      gymId,
      userId,
      ...(input.shiftId ? { shiftId: input.shiftId } : {}),
      requestType: input.requestType,
      message: input.message,
      status: "open",
      createdAt: now,
      updatedAt: now
    };
    return toPublicRequest(await this.repositories.scheduler.createRequest(request));
  }

  async generateDraft(gymId: string, input: SchedulerGenerateInput): Promise<ScheduleDraft> {
    const endsOn = input.endsOn ?? await this.defaultEndsOn(gymId, input.startsOn);
    const rules = (await this.repositories.scheduler.listCoverageRulesForGym(gymId)).filter(
      (rule) => !input.locationId || rule.locationId === input.locationId
    );
    const memberships = await this.staffMemberships(gymId);
    const roles = await this.repositories.roles.listRolesForGym(gymId);
    const roleById = new Map(roles.map((role) => [role.id, role]));
    const availabilities = await this.repositories.scheduler.listAvailabilitiesForGym(gymId);
    const existingShifts = await this.repositories.staffShifts.listStaffShiftsForGym(gymId);
    const assignments: ScheduleDraftAssignment[] = [];
    const draftBusy = new Map<string, Array<{ startsAt: Date; endsAt: Date }>>();
    const assignedMinutes = new Map<string, number>();
    const warnings: string[] = [];

    for (const date of datesBetween(input.startsOn, endsOn)) {
      const day = date.getUTCDay();
      for (const rule of rules.filter((candidate) => candidate.daysOfWeek.includes(day))) {
        for (let slot = 0; slot < rule.requiredStaff; slot += 1) {
          const startsAt = dateTime(date, rule.startTime);
          const endsAt = dateTime(date, rule.endTime);
          const candidates = memberships
            .filter((membership) => membership.roleId === rule.roleId)
            .map((membership) =>
              this.scoreCandidate(
                membership,
                roleById,
                availabilities,
                existingShifts,
                draftBusy,
                assignedMinutes,
                startsAt,
                endsAt
              )
            )
            .filter((candidate): candidate is Candidate => Boolean(candidate))
            .sort((left, right) => right.score - left.score || left.assignedMinutes - right.assignedMinutes);
          const candidate = candidates[0];
          const assignmentWarnings: string[] = [];
          if (!candidate) {
            const role = roleById.get(rule.roleId);
            const warning = `No eligible ${role ? role.name : "staff"} found for ${rule.name} on ${formatDate(date)}.`;
            assignmentWarnings.push(warning);
            warnings.push(warning);
          } else {
            const busy = draftBusy.get(candidate.membership.userId) ?? [];
            busy.push({ startsAt, endsAt });
            draftBusy.set(candidate.membership.userId, busy);
            assignedMinutes.set(
              candidate.membership.userId,
              (assignedMinutes.get(candidate.membership.userId) ?? 0) + minutesBetween(startsAt, endsAt)
            );
          }
          assignments.push({
            id: randomUUID(),
            ruleId: rule.id,
            date: formatDate(date),
            ...(candidate ? { userId: candidate.membership.userId } : {}),
            roleId: rule.roleId,
            ...(rule.locationId ? { locationId: rule.locationId } : {}),
            startsAt: startsAt.toISOString(),
            endsAt: endsAt.toISOString(),
            score: candidate?.score ?? 0,
            reason: candidate?.reason ?? "Needs manual assignment",
            warnings: assignmentWarnings
          });
        }
      }
    }
    return { startsOn: input.startsOn, endsOn, assignments, warnings };
  }

  async publishGeneratedSchedule(
    gymId: string,
    actorUserId: string,
    input: SchedulerPublishInput
  ): Promise<{ draft: ScheduleDraft; shifts: PublicStaffShift[] }> {
    const draft = await this.generateDraft(gymId, input);
    const now = this.clock.now();
    const shifts: PublicStaffShift[] = [];
    for (const assignment of draft.assignments.filter((candidate) => candidate.userId)) {
      const shift: StaffShift = {
        id: randomUUID(),
        gymId,
        userId: assignment.userId ?? "",
        ...(assignment.locationId ? { locationId: assignment.locationId } : {}),
        roleId: assignment.roleId,
        startsAt: new Date(assignment.startsAt),
        endsAt: new Date(assignment.endsAt),
        notes: `Auto-generated scheduler coverage. ${assignment.reason}`,
        createdByUserId: actorUserId,
        createdAt: now,
        updatedAt: now
      };
      shifts.push(toPublicStaffShift(await this.repositories.staffShifts.createStaffShift(shift)));
    }
    return { draft, shifts };
  }

  async resolveRequest(
    gymId: string,
    requestId: string,
    actorUserId: string,
    input: SchedulerRequestResolveInput
  ) {
    const request = await this.repositories.scheduler.getRequest(requestId);
    if (!request || request.gymId !== gymId) {
      throw notFound("Schedule request was not found.");
    }
    const now = this.clock.now();
    if (input.decision === "decline") {
      const declined: SchedulerRequest = {
        ...request,
        status: "declined",
        resolutionNote: input.resolutionNote ?? "Declined by scheduler.",
        resolvedByUserId: actorUserId,
        updatedAt: now,
        resolvedAt: now
      };
      return toPublicRequest(await this.repositories.scheduler.updateRequest(declined));
    }
    const replacement = request.shiftId
      ? await this.findReplacementForShift(gymId, request.shiftId, request.userId)
      : undefined;
    const appliedReplacement = input.autoAssignReplacement && request.shiftId ? replacement : undefined;
    if (appliedReplacement) {
      const shift = (await this.repositories.staffShifts.listStaffShiftsForGym(gymId)).find(
        (candidate) => candidate.id === request.shiftId
      );
      if (!shift) {
        throw notFound("Shift was not found.");
      }
      await this.repositories.staffShifts.updateStaffShift({
        ...shift,
        userId: appliedReplacement.membership.userId,
        notes: `${shift.notes ? `${shift.notes}\n` : ""}Auto-resolved request ${request.id}: replacement assigned.`,
        updatedAt: now
      });
    }
    const resolved: SchedulerRequest = {
      ...request,
      status: appliedReplacement || !request.shiftId ? "resolved" : "open",
      ...(appliedReplacement ? { suggestedReplacementUserId: appliedReplacement.membership.userId } : {}),
      resolutionNote:
        input.resolutionNote ??
        (!request.shiftId
          ? "Reviewed by scheduler."
          : appliedReplacement
            ? `Replacement found: ${appliedReplacement.reason}`
            : "No eligible replacement was found. Manager review needed."),
      resolvedByUserId: actorUserId,
      updatedAt: now,
      ...(appliedReplacement || !request.shiftId ? { resolvedAt: now } : {})
    };
    return toPublicRequest(await this.repositories.scheduler.updateRequest(resolved));
  }

  private async ensureShiftRole(gymId: string, roleId: string) {
    const role = await this.repositories.roles.getRole(roleId);
    if (!role || role.gymId !== gymId || role.name === RoleName.Member) {
      throw conflict("Scheduler coverage must use a staff role.", "scheduler_role_invalid");
    }
    return role;
  }

  private async ensureActiveLocation(gymId: string, locationId: string) {
    const location = await this.repositories.locations.getLocation(locationId);
    if (!location || location.gymId !== gymId || location.status !== LocationStatus.Active) {
      throw notFound("Location was not found.");
    }
  }

  private async ensureActiveStaff(gymId: string, userId: string) {
    const membership = await this.repositories.gymUsers.findGymUser(gymId, userId);
    if (!membership || membership.status !== UserStatus.Active) {
      throw notFound("Staff member was not found.");
    }
    const role = await this.repositories.roles.getRole(membership.roleId);
    if (!role || role.name === RoleName.Member) {
      throw notFound("Staff member was not found.");
    }
  }

  private async staffMemberships(gymId: string) {
    const roles = await this.repositories.roles.listRolesForGym(gymId);
    const roleById = new Map(roles.map((role) => [role.id, role]));
    return (await this.repositories.gymUsers.listGymUsersForGym(gymId)).filter((membership) => {
      const role = roleById.get(membership.roleId);
      return membership.status === UserStatus.Active && role && role.name !== RoleName.Member;
    });
  }

  private async defaultEndsOn(gymId: string, startsOn: string) {
    const settings = await this.repositories.scheduler.getSettings(gymId);
    const horizonDays = settings?.planningHorizonDays ?? DEFAULT_PLANNING_HORIZON_DAYS;
    const start = new Date(`${startsOn}T00:00:00.000Z`);
    if (Number.isNaN(start.getTime())) {
      throw badRequest("Schedule start date is invalid.", "scheduler_date_invalid");
    }
    start.setUTCDate(start.getUTCDate() + horizonDays - 1);
    return formatDate(start);
  }

  private scoreCandidate(
    membership: GymUser,
    roleById: Map<string, Role>,
    availabilities: SchedulerAvailability[],
    existingShifts: StaffShift[],
    draftBusy: Map<string, Array<{ startsAt: Date; endsAt: Date }>>,
    assignedMinutes: Map<string, number>,
    startsAt: Date,
    endsAt: Date
  ): Candidate | undefined {
    const overlapsExisting = existingShifts.some(
      (shift) => shift.userId === membership.userId && startsAt < shift.endsAt && endsAt > shift.startsAt
    );
    const overlapsDraft = (draftBusy.get(membership.userId) ?? []).some(
      (shift) => startsAt < shift.endsAt && endsAt > shift.startsAt
    );
    if (overlapsExisting || overlapsDraft) {
      return undefined;
    }
    const day = startsAt.getUTCDay();
    const availability = availabilities.find(
      (candidate) =>
        candidate.userId === membership.userId &&
        candidate.daysOfWeek.includes(day) &&
        candidate.startTime <= timeString(startsAt) &&
        candidate.endTime >= timeString(endsAt)
    );
    if (availability?.preference === "unavailable") {
      return undefined;
    }
    const score = availability?.preference === "preferred" ? 90 : availability ? 70 : 40;
    const role = roleById.get(membership.roleId);
    return {
      membership,
      role: role ?? {
        id: membership.roleId,
        gymId: membership.gymId,
        name: "Staff",
        permissions: [],
        isSystem: false,
        createdAt: startsAt,
        updatedAt: startsAt
      },
      score,
      reason: availability
        ? `${availability.preference === "preferred" ? "Preferred" : "Available"} during this shift`
        : "No availability conflict found",
      assignedMinutes: assignedMinutes.get(membership.userId) ?? 0
    };
  }

  private async findReplacementForShift(gymId: string, shiftId: string, originalUserId: string) {
    const shift = (await this.repositories.staffShifts.listStaffShiftsForGym(gymId)).find(
      (candidate) => candidate.id === shiftId
    );
    if (!shift) {
      return undefined;
    }
    const roles = await this.repositories.roles.listRolesForGym(gymId);
    const roleById = new Map(roles.map((role) => [role.id, role]));
    const availabilities = await this.repositories.scheduler.listAvailabilitiesForGym(gymId);
    const shifts = await this.repositories.staffShifts.listStaffShiftsForGym(gymId);
    const assignedMinutes = new Map<string, number>();
    for (const existing of shifts) {
      assignedMinutes.set(
        existing.userId,
        (assignedMinutes.get(existing.userId) ?? 0) + minutesBetween(existing.startsAt, existing.endsAt)
      );
    }
    return (await this.staffMemberships(gymId))
      .filter((membership) => membership.userId !== originalUserId && membership.roleId === shift.roleId)
      .map((membership) =>
        this.scoreCandidate(
          membership,
          roleById,
          availabilities,
          shifts.filter((candidate) => candidate.id !== shift.id),
          new Map(),
          assignedMinutes,
          shift.startsAt,
          shift.endsAt
        )
      )
      .filter((candidate): candidate is Candidate => Boolean(candidate))
      .sort((left, right) => right.score - left.score || left.assignedMinutes - right.assignedMinutes)[0];
  }
}

function toPublicCoverageRule(rule: SchedulerCoverageRule): PublicSchedulerCoverageRule {
  return {
    id: rule.id,
    gymId: rule.gymId,
    name: rule.name,
    ...(rule.locationId ? { locationId: rule.locationId } : {}),
    roleId: rule.roleId,
    daysOfWeek: rule.daysOfWeek,
    startTime: rule.startTime,
    endTime: rule.endTime,
    requiredStaff: rule.requiredStaff,
    createdByUserId: rule.createdByUserId,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString()
  };
}

function toPublicAvailability(availability: SchedulerAvailability): PublicSchedulerAvailability {
  return {
    id: availability.id,
    gymId: availability.gymId,
    userId: availability.userId,
    daysOfWeek: availability.daysOfWeek,
    startTime: availability.startTime,
    endTime: availability.endTime,
    preference: availability.preference,
    ...(availability.notes ? { notes: availability.notes } : {}),
    createdAt: availability.createdAt.toISOString(),
    updatedAt: availability.updatedAt.toISOString()
  };
}

function toPublicSettings(settings: SchedulerSettings): PublicSchedulerSettings {
  return {
    gymId: settings.gymId,
    planningHorizonDays: settings.planningHorizonDays,
    createdAt: settings.createdAt.toISOString(),
    updatedAt: settings.updatedAt.toISOString()
  };
}

function toPublicPreferenceRequest(request: SchedulerPreferenceRequest): PublicSchedulerPreferenceRequest {
  return {
    id: request.id,
    gymId: request.gymId,
    userId: request.userId,
    daysOfWeek: request.daysOfWeek,
    startTime: request.startTime,
    endTime: request.endTime,
    preference: request.preference,
    ...(request.notes ? { notes: request.notes } : {}),
    status: request.status,
    ...(request.resolutionNote ? { resolutionNote: request.resolutionNote } : {}),
    ...(request.resolvedByUserId ? { resolvedByUserId: request.resolvedByUserId } : {}),
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    ...(request.resolvedAt ? { resolvedAt: request.resolvedAt.toISOString() } : {})
  };
}

function toPublicRequest(request: SchedulerRequest): PublicSchedulerRequest {
  return {
    id: request.id,
    gymId: request.gymId,
    userId: request.userId,
    ...(request.shiftId ? { shiftId: request.shiftId } : {}),
    requestType: request.requestType,
    message: request.message,
    status: request.status,
    ...(request.suggestedReplacementUserId ? { suggestedReplacementUserId: request.suggestedReplacementUserId } : {}),
    ...(request.resolutionNote ? { resolutionNote: request.resolutionNote } : {}),
    ...(request.resolvedByUserId ? { resolvedByUserId: request.resolvedByUserId } : {}),
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    ...(request.resolvedAt ? { resolvedAt: request.resolvedAt.toISOString() } : {})
  };
}

function datesBetween(startsOn: string, endsOn: string) {
  const dates: Date[] = [];
  const cursor = new Date(`${startsOn}T00:00:00.000Z`);
  const end = new Date(`${endsOn}T00:00:00.000Z`);
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(end.getTime())) {
    throw badRequest("Schedule date range is invalid.", "scheduler_date_invalid");
  }
  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  if (dates.length > 90) {
    throw badRequest("Generate at most 90 days at a time.", "scheduler_range_too_large");
  }
  return dates;
}

function dateTime(date: Date, time: string) {
  return new Date(`${formatDate(date)}T${time}:00.000Z`);
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function timeString(date: Date) {
  return date.toISOString().slice(11, 16);
}

function minutesBetween(startsAt: Date, endsAt: Date) {
  return Math.max(0, Math.round((endsAt.getTime() - startsAt.getTime()) / 60000));
}
