import {
  FacilityReservationStatus,
  LocationStatus,
  ReservableResourceStatus,
  ReservationConfirmationMode,
  ReservationPaymentRequirement,
  ReservationPaymentStatus,
  ResourceAllocationSource
} from "@gym-platform/constants";
import type {
  ClassSessionResourceAllocationInput,
  FacilityReservationCancelInput,
  FacilityReservationCreateInput,
  ResourceCreateInput,
  ResourceUpdateInput
} from "@gym-platform/validation";
import { randomUUID } from "node:crypto";
import { badRequest, conflict, notFound } from "../../http/errors.js";
import type {
  FacilityReservation,
  OperatingHours,
  ReservableResource,
  ResourceAllocation
} from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";
import { ensureStaffCanHaveLinkedResource } from "./staffResourceLinking.js";

export class ReservationResourceService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock
  ) {}

  async listResources(gymId: string, locationId?: string) {
    return (await this.repositories.reservationResources.listResourcesForGym(gymId)).filter(
      (resource) =>
        resource.status !== ReservableResourceStatus.Archived &&
        (!locationId || resource.locationId === locationId)
    );
  }

  async createResource(gymId: string, input: ResourceCreateInput) {
    const role = input.linkedStaffUserId
      ? await ensureStaffCanHaveLinkedResource(this.repositories, gymId, input.linkedStaffUserId)
      : undefined;
    if (input.linkedStaffUserId) {
      const existing = (await this.repositories.reservationResources.listResourcesForGym(gymId)).find(
        (resource) =>
          resource.linkedStaffUserId === input.linkedStaffUserId &&
          resource.status !== ReservableResourceStatus.Archived
      );
      if (existing) {
        throw conflict("This staff member already has an active reservable resource.", "staff_resource_exists");
      }
    }
    if (input.locationId) {
      await this.getActiveLocation(gymId, input.locationId);
    }
    if (input.parentResourceId) {
      if (!input.locationId) {
        throw badRequest("Resource units require a location.", "resource_location_required");
      }
      const parent = await this.getActiveResource(gymId, input.parentResourceId);
      if (parent.locationId !== input.locationId) {
        throw badRequest("Resource unit must belong to the same location as its group.", "resource_location_mismatch");
      }
    }
    const now = this.clock.now();
    const resource: ReservableResource = {
      id: randomUUID(),
      gymId,
      ...(input.locationId ? { locationId: input.locationId } : {}),
      ...(input.parentResourceId ? { parentResourceId: input.parentResourceId } : {}),
      name: input.name,
      resourceType: input.resourceType,
      status: ReservableResourceStatus.Active,
      isBookable: input.isBookable ?? true,
      isExclusive: input.isExclusive ?? true,
      capacity: input.capacity ?? 1,
      amenities: input.amenities ?? [],
      ...(input.rentableHours ? { rentableHours: input.rentableHours } : {}),
      slotRules: {
        minDurationMinutes: input.slotRules?.minDurationMinutes ?? 30,
        maxDurationMinutes: input.slotRules?.maxDurationMinutes ?? 120,
        incrementMinutes: input.slotRules?.incrementMinutes ?? 30,
        bufferBeforeMinutes: input.slotRules?.bufferBeforeMinutes ?? 0,
        bufferAfterMinutes: input.slotRules?.bufferAfterMinutes ?? 0
      },
      pricing: {
        amountCents: input.pricing?.amountCents ?? 0
      },
      paymentRequirement: input.paymentRequirement ?? ReservationPaymentRequirement.Free,
      confirmationMode: input.confirmationMode ?? ReservationConfirmationMode.Automatic,
      cancellationPolicy: {
        cutoffMinutes: input.cancellationPolicy?.cutoffMinutes ?? 0,
        feeCents: input.cancellationPolicy?.feeCents ?? 0
      },
      ...(input.linkedStaffUserId
        ? {
            linkedStaffUserId: input.linkedStaffUserId,
            createdFromRoleId: role!.id,
            autoManaged: false
          }
        : {}),
      createdAt: now,
      updatedAt: now
    };
    this.ensureValidSlotRules(resource);
    return this.repositories.reservationResources.createResource(resource);
  }

  async updateResource(gymId: string, resourceId: string, input: ResourceUpdateInput) {
    const existing = await this.getActiveResource(gymId, resourceId);
    const updated: ReservableResource = {
      ...existing,
      name: input.name ?? existing.name,
      resourceType: input.resourceType ?? existing.resourceType,
      isBookable: input.isBookable ?? existing.isBookable,
      isExclusive: input.isExclusive ?? existing.isExclusive,
      capacity: input.capacity ?? existing.capacity,
      amenities: input.amenities ?? existing.amenities,
      slotRules: input.slotRules
        ? {
            minDurationMinutes:
              input.slotRules.minDurationMinutes ?? existing.slotRules.minDurationMinutes,
            maxDurationMinutes:
              input.slotRules.maxDurationMinutes ?? existing.slotRules.maxDurationMinutes,
            incrementMinutes: input.slotRules.incrementMinutes ?? existing.slotRules.incrementMinutes,
            bufferBeforeMinutes:
              input.slotRules.bufferBeforeMinutes ?? existing.slotRules.bufferBeforeMinutes,
            bufferAfterMinutes:
              input.slotRules.bufferAfterMinutes ?? existing.slotRules.bufferAfterMinutes
          }
        : existing.slotRules,
      pricing: input.pricing
        ? { amountCents: input.pricing.amountCents ?? existing.pricing.amountCents }
        : existing.pricing,
      paymentRequirement: input.paymentRequirement ?? existing.paymentRequirement,
      confirmationMode: input.confirmationMode ?? existing.confirmationMode,
      cancellationPolicy: input.cancellationPolicy
        ? {
            cutoffMinutes:
              input.cancellationPolicy.cutoffMinutes ?? existing.cancellationPolicy.cutoffMinutes,
            feeCents: input.cancellationPolicy.feeCents ?? existing.cancellationPolicy.feeCents
          }
        : existing.cancellationPolicy,
      updatedAt: this.clock.now()
    };
    if (input.rentableHours !== undefined) {
      if (input.rentableHours) {
        updated.rentableHours = input.rentableHours;
      } else {
        delete updated.rentableHours;
      }
    }
    this.ensureValidSlotRules(updated);
    return this.repositories.reservationResources.updateResource(updated);
  }

  async archiveResource(gymId: string, resourceId: string) {
    const existing = await this.getActiveResource(gymId, resourceId);
    const now = this.clock.now();
    return this.repositories.reservationResources.updateResource({
      ...existing,
      status: ReservableResourceStatus.Archived,
      archivedAt: now,
      updatedAt: now
    });
  }

  async availability(gymId: string, resourceId: string, from: Date, to: Date) {
    if (to <= from) {
      throw badRequest("Availability end time must be after start time.", "invalid_availability_range");
    }
    const resource = await this.getActiveResource(gymId, resourceId);
    const allocations = await this.activeAllocations(resource.id, from, to);
    return {
      resource,
      from,
      to,
      available: this.hasCapacity(resource, allocations),
      allocations
    };
  }

  async allocateClassSession(
    gymId: string,
    classSessionId: string,
    input: ClassSessionResourceAllocationInput
  ) {
    return this.repositories.transaction(async (repositories) => {
      const session = await repositories.classes.getClassSession(classSessionId);
      if (!session || session.gymId !== gymId) {
        throw notFound("Class session was not found.");
      }
      const resource = await this.getActiveResourceWith(repositories, gymId, input.resourceId);
      if (resource.locationId && resource.locationId !== session.locationId) {
        throw badRequest("Resource must belong to the class session location.", "resource_location_mismatch");
      }
      const startsAt = input.startsAt ? new Date(input.startsAt) : session.startsAt;
      const endsAt = input.endsAt ? new Date(input.endsAt) : session.endsAt;
      this.ensureValidRange(startsAt, endsAt);
      await this.ensureNoConflicts(repositories, resource, startsAt, endsAt, {
        overrideConflict: input.overrideConflict ?? false,
        ...(input.overrideReason ? { overrideReason: input.overrideReason } : {})
      });
      const now = this.clock.now();
      return repositories.reservationResources.createAllocation({
        id: randomUUID(),
        gymId,
        resourceId: resource.id,
        source: ResourceAllocationSource.ClassSession,
        classSessionId: session.id,
        startsAt,
        endsAt,
        bufferBeforeMinutes: resource.slotRules.bufferBeforeMinutes,
        bufferAfterMinutes: resource.slotRules.bufferAfterMinutes,
        staffOverride: input.overrideConflict ?? false,
        ...(input.overrideReason ? { overrideReason: input.overrideReason } : {}),
        createdAt: now,
        updatedAt: now
      });
    });
  }

  async listClassSessionAllocations(gymId: string, classSessionId: string) {
    const session = await this.repositories.classes.getClassSession(classSessionId);
    if (!session || session.gymId !== gymId) {
      throw notFound("Class session was not found.");
    }
    return this.repositories.reservationResources.listAllocationsForClassSession(classSessionId);
  }

  async createFacilityReservation(
    gymId: string,
    staffUserId: string,
    input: FacilityReservationCreateInput
  ) {
    return this.repositories.transaction(async (repositories) => {
      const resource = await this.getActiveResourceWith(repositories, gymId, input.resourceId);
      if (!resource.isBookable) {
        throw conflict("Resource is not bookable.", "resource_not_bookable");
      }
      if (resource.linkedStaffUserId) {
        await ensureStaffCanHaveLinkedResource(repositories, gymId, resource.linkedStaffUserId);
      }
      const member = await repositories.members.getMember(input.memberId);
      if (!member || member.gymId !== gymId || member.recordStatus === "archived" || member.status === "archived") {
        throw notFound("Customer was not found.");
      }
      if (resource.locationId && input.locationId && resource.locationId !== input.locationId) {
        throw badRequest("Reservation location must match the resource location.", "resource_location_mismatch");
      }
      const locationId = input.locationId ?? resource.locationId;
      const location = locationId
        ? await this.getActiveLocationWith(repositories, gymId, locationId)
        : undefined;
      const startsAt = new Date(input.startsAt);
      const endsAt = new Date(input.endsAt);
      this.ensureValidRange(startsAt, endsAt);
      this.ensureSlotRules(resource, startsAt, endsAt);
      this.ensureInsideRentableHours(resource, location?.operatingHours ?? {}, startsAt, endsAt);
      await this.ensureNoConflicts(repositories, resource, startsAt, endsAt, {
        overrideConflict: input.overrideConflict ?? false,
        ...(input.overrideReason ? { overrideReason: input.overrideReason } : {})
      });
      const now = this.clock.now();
      const reservation: FacilityReservation = {
        id: randomUUID(),
        gymId,
        resourceId: resource.id,
        ...(locationId ? { locationId } : {}),
        memberId: member.id,
        createdByUserId: staffUserId,
        status:
          resource.confirmationMode === ReservationConfirmationMode.Automatic
            ? FacilityReservationStatus.Confirmed
            : FacilityReservationStatus.Pending,
        startsAt,
        endsAt,
        amountCents: resource.pricing.amountCents,
        paymentRequirement:
          resource.pricing.amountCents > 0
            ? resource.paymentRequirement
            : ReservationPaymentRequirement.Free,
        paymentStatus: paymentStatusFor(resource),
        ...(input.paymentReference ? { paymentReference: input.paymentReference } : {}),
        cancellationFeeCents: 0,
        refundAmountCents: 0,
        ...(input.note ? { note: input.note } : {}),
        createdAt: now,
        updatedAt: now
      };
      const savedReservation =
        await repositories.reservationResources.createFacilityReservation(reservation);
      const allocation = await repositories.reservationResources.createAllocation({
        id: randomUUID(),
        gymId,
        resourceId: resource.id,
        source: ResourceAllocationSource.FacilityReservation,
        facilityReservationId: savedReservation.id,
        startsAt,
        endsAt,
        bufferBeforeMinutes: resource.slotRules.bufferBeforeMinutes,
        bufferAfterMinutes: resource.slotRules.bufferAfterMinutes,
        staffOverride: input.overrideConflict ?? false,
        ...(input.overrideReason ? { overrideReason: input.overrideReason } : {}),
        createdAt: now,
        updatedAt: now
      });
      return repositories.reservationResources.updateFacilityReservation({
        ...savedReservation,
        allocationId: allocation.id,
        updatedAt: now
      });
    });
  }

  async listFacilityReservations(gymId: string) {
    return this.repositories.reservationResources.listFacilityReservationsForGym(gymId);
  }

  async getFacilityReservation(gymId: string, reservationId: string) {
    const reservation =
      await this.repositories.reservationResources.getFacilityReservation(reservationId);
    if (!reservation || reservation.gymId !== gymId) {
      throw notFound("Facility reservation was not found.");
    }
    return reservation;
  }

  async cancelFacilityReservation(
    gymId: string,
    reservationId: string,
    cancelledByUserId: string,
    input: FacilityReservationCancelInput = {}
  ) {
    return this.repositories.transaction(async (repositories) => {
      const reservation = await repositories.reservationResources.getFacilityReservation(reservationId);
      if (!reservation || reservation.gymId !== gymId) {
        throw notFound("Facility reservation was not found.");
      }
      if (reservation.status === FacilityReservationStatus.Cancelled) {
        throw conflict("Facility reservation is already cancelled.", "reservation_already_cancelled");
      }
      const resource = await this.getActiveResourceWith(repositories, gymId, reservation.resourceId);
      const now = this.clock.now();
      const insideCutoff = isInsideCancellationCutoff(resource, reservation.startsAt, now);
      const feeCents = insideCutoff ? resource.cancellationPolicy.feeCents : 0;
      const cancelled = await repositories.reservationResources.updateFacilityReservation({
        ...reservation,
        status: FacilityReservationStatus.Cancelled,
        cancelledAt: now,
        cancelledByUserId,
        ...(input.reason ? { cancellationReason: input.reason } : {}),
        cancellationFeeCents: feeCents,
        refundAmountCents:
          reservation.paymentStatus === ReservationPaymentStatus.Paid
            ? Math.max(reservation.amountCents - feeCents, 0)
            : 0,
        updatedAt: now
      });
      if (reservation.allocationId) {
        const allocation = await repositories.reservationResources.getAllocation(reservation.allocationId);
        if (allocation) {
          const allocationEndsAt = now < allocation.endsAt ? now : allocation.endsAt;
          const truncateToImmediateWindow = allocationEndsAt <= allocation.startsAt;
          await repositories.reservationResources.updateAllocation({
            ...allocation,
            ...(truncateToImmediateWindow
              ? {
                  startsAt: now,
                  endsAt: new Date(now.getTime() + 1)
                }
              : {
                  endsAt: allocationEndsAt
                }),
            updatedAt: now
          });
        }
      }
      return cancelled;
    });
  }

  private async getActiveLocation(gymId: string, locationId: string) {
    return this.getActiveLocationWith(this.repositories, gymId, locationId);
  }

  private async getActiveLocationWith(repositories: Repositories, gymId: string, locationId: string) {
    const location = await repositories.locations.getLocation(locationId);
    if (!location || location.gymId !== gymId || location.status === LocationStatus.Archived) {
      throw notFound("Location was not found.");
    }
    return location;
  }

  private async getActiveResource(gymId: string, resourceId: string) {
    return this.getActiveResourceWith(this.repositories, gymId, resourceId);
  }

  private async getActiveResourceWith(repositories: Repositories, gymId: string, resourceId: string) {
    const resource = await repositories.reservationResources.getResource(resourceId);
    if (!resource || resource.gymId !== gymId || resource.status === ReservableResourceStatus.Archived) {
      throw notFound("Reservable resource was not found.");
    }
    return resource;
  }

  private ensureValidRange(startsAt: Date, endsAt: Date) {
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      throw badRequest("Reservation time range is invalid.", "invalid_reservation_time");
    }
  }

  private ensureValidSlotRules(resource: ReservableResource) {
    if (resource.slotRules.maxDurationMinutes < resource.slotRules.minDurationMinutes) {
      throw badRequest("Maximum duration must be at least the minimum duration.", "invalid_slot_rules");
    }
  }

  private ensureSlotRules(resource: ReservableResource, startsAt: Date, endsAt: Date) {
    const durationMinutes = Math.round((endsAt.getTime() - startsAt.getTime()) / 60000);
    if (
      durationMinutes < resource.slotRules.minDurationMinutes ||
      durationMinutes > resource.slotRules.maxDurationMinutes
    ) {
      throw conflict("Reservation duration is outside this resource's slot rules.", "invalid_reservation_duration");
    }
    if (durationMinutes % resource.slotRules.incrementMinutes !== 0) {
      throw conflict("Reservation duration must align to the resource increment.", "invalid_reservation_increment");
    }
  }

  private ensureInsideRentableHours(
    resource: ReservableResource,
    locationHours: OperatingHours,
    startsAt: Date,
    endsAt: Date
  ) {
    const hours = resource.rentableHours ?? locationHours;
    const dayRanges = hours[dayKey(startsAt)];
    if (!dayRanges || dayRanges.length === 0) {
      return;
    }
    const startMinute = startsAt.getUTCHours() * 60 + startsAt.getUTCMinutes();
    const endMinute = endsAt.getUTCHours() * 60 + endsAt.getUTCMinutes();
    const inside = dayRanges.some(
      (range) => minutes(range.opensAt) <= startMinute && minutes(range.closesAt) >= endMinute
    );
    if (!inside) {
      throw conflict("Reservation is outside this resource's rentable hours.", "outside_rentable_hours");
    }
  }

  private async activeAllocations(resourceId: string, startsAt: Date, endsAt: Date) {
    const allocations =
      await this.repositories.reservationResources.listAllocationsForResource(resourceId);
    return allocations.filter((allocation) => overlapsWithBuffers(allocation, startsAt, endsAt));
  }

  private async ensureNoConflicts(
    repositories: Repositories,
    resource: ReservableResource,
    startsAt: Date,
    endsAt: Date,
    override: { overrideConflict?: boolean; overrideReason?: string }
  ) {
    const allocations = (
      await repositories.reservationResources.listAllocationsForResource(resource.id)
    ).filter((allocation) => overlapsWithBuffers(allocation, startsAt, endsAt));
    if (this.hasCapacity(resource, allocations)) {
      return;
    }
    if (override.overrideConflict && override.overrideReason) {
      return;
    }
    throw conflict("Resource is already reserved for this time.", "resource_conflict");
  }

  private hasCapacity(resource: ReservableResource, allocations: ResourceAllocation[]) {
    return resource.isExclusive ? allocations.length === 0 : allocations.length < resource.capacity;
  }
}

function paymentStatusFor(resource: ReservableResource) {
  if (resource.pricing.amountCents <= 0 || resource.paymentRequirement === ReservationPaymentRequirement.Free) {
    return ReservationPaymentStatus.NotRequired;
  }
  return ReservationPaymentStatus.Unpaid;
}

function overlapsWithBuffers(allocation: ResourceAllocation, startsAt: Date, endsAt: Date) {
  const allocationStart = new Date(
    allocation.startsAt.getTime() - allocation.bufferBeforeMinutes * 60000
  );
  const allocationEnd = new Date(allocation.endsAt.getTime() + allocation.bufferAfterMinutes * 60000);
  return startsAt < allocationEnd && endsAt > allocationStart;
}

function isInsideCancellationCutoff(resource: ReservableResource, startsAt: Date, now: Date) {
  if (resource.cancellationPolicy.cutoffMinutes <= 0) {
    return false;
  }
  return now >= new Date(startsAt.getTime() - resource.cancellationPolicy.cutoffMinutes * 60000);
}

function minutes(value: string) {
  const [hours = "0", mins = "0"] = value.split(":");
  return Number(hours) * 60 + Number(mins);
}

function dayKey(date: Date): keyof OperatingHours {
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][date.getUTCDay()] as keyof OperatingHours;
}
