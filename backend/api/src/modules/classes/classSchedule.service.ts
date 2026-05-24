import {
  ClassSessionStatus,
  LocationStatus,
  ResourceAllocationSource,
  UserStatus
} from "@gym-platform/constants";
import type {
  ClassSessionCreateInput,
  ClassTypeCreateInput
} from "@gym-platform/validation";
import { randomUUID } from "node:crypto";
import { badRequest, conflict, notFound } from "../../http/errors.js";
import type {
  ClassSession,
  ClassType,
  ReservableResource,
  ResourceAllocation
} from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";
import { getActiveLinkedStaffResource } from "../reservations/staffResourceLinking.js";

export class ClassScheduleService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock
  ) {}

  async createClassType(gymId: string, input: ClassTypeCreateInput) {
    const duplicate = (await this.repositories.classes.listClassTypesForGym(gymId)).find(
      (classType) => classType.name.toLowerCase() === input.name.toLowerCase()
    );
    if (duplicate) {
      throw conflict("A class type with this name already exists.", "class_type_name_exists");
    }
    const now = this.clock.now();
    const classType: ClassType = {
      id: randomUUID(),
      gymId,
      name: input.name,
      defaultDurationMinutes: input.defaultDurationMinutes,
      defaultCapacity: input.defaultCapacity,
      defaultWaitlistCapacity: input.defaultWaitlistCapacity,
      isPublic: input.isPublic,
      createdAt: now,
      updatedAt: now
    };
    if (input.description) {
      classType.description = input.description;
    }
    return this.repositories.classes.createClassType(classType);
  }

  async listClassTypes(gymId: string) {
    return this.repositories.classes.listClassTypesForGym(gymId);
  }

  async createSession(gymId: string, input: ClassSessionCreateInput) {
    return this.repositories.transaction(async (repositories) => {
      const classType = await repositories.classes.getClassType(input.classTypeId);
      if (!classType || classType.gymId !== gymId) {
        throw notFound("Class type was not found.");
      }
      const location = await repositories.locations.getLocation(input.locationId);
      if (!location || location.gymId !== gymId || location.status === LocationStatus.Archived) {
        throw notFound("Location was not found.");
      }
      let trainerResource: ReservableResource | undefined;
      if (input.trainerUserId) {
        const trainerMembership = await repositories.gymUsers.findGymUser(gymId, input.trainerUserId);
        if (!trainerMembership || trainerMembership.status !== UserStatus.Active) {
          throw notFound("Trainer was not found.");
        }
        const trainerRole = await repositories.roles.getRole(trainerMembership.roleId);
        if (trainerRole?.createsReservableResource) {
          trainerResource = await getActiveLinkedStaffResource(
            repositories,
            gymId,
            input.trainerUserId
          );
          if (!trainerResource) {
            throw conflict(
              "Trainer does not have an active reservable resource.",
              "trainer_resource_missing"
            );
          }
        }
      }
      const startsAt = new Date(input.startsAt);
      const endsAt = new Date(input.endsAt);
      if (endsAt <= startsAt) {
        throw badRequest("Class session end time must be after start time.", "invalid_class_time");
      }
      const now = this.clock.now();
      const session: ClassSession = {
        id: randomUUID(),
        gymId,
        classTypeId: input.classTypeId,
        locationId: input.locationId,
        startsAt,
        endsAt,
        capacity: input.capacity,
        waitlistCapacity: input.waitlistCapacity ?? 0,
        cancellationCutoffMinutes: input.cancellationCutoffMinutes ?? 0,
        lateCancellationFeeCents: input.lateCancellationFeeCents ?? 0,
        status: ClassSessionStatus.Scheduled,
        createdAt: now,
        updatedAt: now
      };
      if (input.trainerUserId) {
        session.trainerUserId = input.trainerUserId;
      }
      if (input.roomName) {
        session.roomName = input.roomName;
      }
      const saved = await repositories.classes.createClassSession(session);
      if (trainerResource) {
        await this.allocateTrainerResource(repositories, saved, trainerResource);
      }
      return saved;
    });
  }

  async publicSchedule(
    gymSlug: string,
    from: Date,
    to: Date,
    filters: { locationId?: string } = {}
  ) {
    const gym = await this.repositories.gyms.findGymBySlug(gymSlug);
    if (!gym) {
      throw notFound("Gym was not found.");
    }
    if (filters.locationId) {
      const location = await this.repositories.locations.getLocation(filters.locationId);
      if (!location || location.gymId !== gym.id || location.status === LocationStatus.Archived) {
        throw notFound("Location was not found.");
      }
    }
    const sessions = await this.repositories.classes.listPublicClassSessionsForGym(gym.id, from, to);
    return filters.locationId
      ? sessions.filter((session) => session.locationId === filters.locationId)
      : sessions;
  }

  private async allocateTrainerResource(
    repositories: Repositories,
    session: ClassSession,
    resource: ReservableResource
  ) {
    const conflicts = (
      await repositories.reservationResources.listAllocationsForResource(resource.id)
    ).filter((allocation) => overlapsWithBuffers(allocation, session.startsAt, session.endsAt));
    if (!hasCapacity(resource, conflicts)) {
      throw conflict("Trainer is already reserved for this time.", "resource_conflict");
    }
    const now = this.clock.now();
    return repositories.reservationResources.createAllocation({
      id: randomUUID(),
      gymId: session.gymId,
      resourceId: resource.id,
      source: ResourceAllocationSource.ClassSession,
      classSessionId: session.id,
      startsAt: session.startsAt,
      endsAt: session.endsAt,
      bufferBeforeMinutes: resource.slotRules.bufferBeforeMinutes,
      bufferAfterMinutes: resource.slotRules.bufferAfterMinutes,
      staffOverride: false,
      createdAt: now,
      updatedAt: now
    });
  }
}

function hasCapacity(resource: ReservableResource, allocations: ResourceAllocation[]) {
  return resource.isExclusive ? allocations.length === 0 : allocations.length < resource.capacity;
}

function overlapsWithBuffers(allocation: ResourceAllocation, startsAt: Date, endsAt: Date) {
  const allocationStart = new Date(
    allocation.startsAt.getTime() - allocation.bufferBeforeMinutes * 60000
  );
  const allocationEnd = new Date(allocation.endsAt.getTime() + allocation.bufferAfterMinutes * 60000);
  return startsAt < allocationEnd && endsAt > allocationStart;
}
