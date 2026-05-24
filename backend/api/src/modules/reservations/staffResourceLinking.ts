import {
  ReservableResourceStatus,
  ReservationConfirmationMode,
  ReservationPaymentRequirement,
  RoleName,
  UserStatus
} from "@gym-platform/constants";
import { randomUUID } from "node:crypto";
import { conflict, notFound } from "../../http/errors.js";
import type { ReservableResource, Role } from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";

export async function reconcileStaffResourceForMembership(
  repositories: Repositories,
  clock: Clock,
  gymId: string,
  userId: string
) {
  const membership = await repositories.gymUsers.findGymUser(gymId, userId);
  if (!membership || membership.status !== UserStatus.Active) {
    await archiveAutoManagedStaffResources(repositories, clock, gymId, userId);
    return;
  }
  const role = await repositories.roles.getRole(membership.roleId);
  if (!role || role.gymId !== gymId || !role.createsReservableResource) {
    await archiveAutoManagedStaffResources(repositories, clock, gymId, userId);
    return;
  }
  await ensureLinkedStaffResource(repositories, clock, gymId, userId, role);
}

export async function ensureLinkedStaffResource(
  repositories: Repositories,
  clock: Clock,
  gymId: string,
  userId: string,
  role: Role
) {
  if (!role.createsReservableResource) {
    throw conflict(
      "This role is not configured to create reservable staff resources.",
      "role_resource_link_disabled"
    );
  }
  const user = await repositories.users.getUser(userId);
  if (!user || user.status !== UserStatus.Active) {
    throw notFound("Staff user was not found.");
  }
  const resources = await repositories.reservationResources.listResourcesForGym(gymId);
  const active = resources.find(
    (resource) =>
      resource.linkedStaffUserId === userId &&
      resource.status !== ReservableResourceStatus.Archived
  );
  const now = clock.now();
  if (active) {
    if (active.createdFromRoleId === role.id && active.autoManaged) {
      return active;
    }
    return repositories.reservationResources.updateResource({
      ...active,
      createdFromRoleId: role.id,
      autoManaged: true,
      updatedAt: now
    });
  }
  const resource: ReservableResource = {
    id: randomUUID(),
    gymId,
    name: staffResourceName(user.firstName, user.lastName),
    resourceType: roleResourceType(role),
    status: ReservableResourceStatus.Active,
    isBookable: true,
    isExclusive: true,
    capacity: 1,
    amenities: [],
    slotRules: {
      minDurationMinutes: 30,
      maxDurationMinutes: 120,
      incrementMinutes: 30,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0
    },
    pricing: { amountCents: 0 },
    paymentRequirement: ReservationPaymentRequirement.Free,
    confirmationMode: ReservationConfirmationMode.Automatic,
    cancellationPolicy: { cutoffMinutes: 0, feeCents: 0 },
    linkedStaffUserId: userId,
    createdFromRoleId: role.id,
    autoManaged: true,
    createdAt: now,
    updatedAt: now
  };
  return repositories.reservationResources.createResource(resource);
}

export async function archiveAutoManagedStaffResources(
  repositories: Repositories,
  clock: Clock,
  gymId: string,
  userId: string
) {
  const now = clock.now();
  const resources = await repositories.reservationResources.listResourcesForGym(gymId);
  await Promise.all(
    resources
      .filter(
        (resource) =>
          resource.linkedStaffUserId === userId &&
          resource.status !== ReservableResourceStatus.Archived
      )
      .map((resource) =>
        repositories.reservationResources.updateResource({
          ...resource,
          status: ReservableResourceStatus.Archived,
          archivedAt: now,
          updatedAt: now
        })
      )
  );
}

export async function backfillRoleLinkedStaffResources(
  repositories: Repositories,
  clock: Clock,
  gymId: string,
  role: Role
) {
  if (!role.createsReservableResource) {
    return [];
  }
  const memberships = await repositories.gymUsers.listGymUsersForGym(gymId);
  return Promise.all(
    memberships
      .filter(
        (membership) =>
          membership.roleId === role.id && membership.status === UserStatus.Active
      )
      .map((membership) =>
        ensureLinkedStaffResource(repositories, clock, gymId, membership.userId, role)
      )
  );
}

export async function getActiveLinkedStaffResource(
  repositories: Repositories,
  gymId: string,
  userId: string
) {
  const resources = await repositories.reservationResources.listResourcesForGym(gymId);
  return resources.find(
    (resource) =>
      resource.linkedStaffUserId === userId &&
      resource.status !== ReservableResourceStatus.Archived
  );
}

export async function ensureStaffCanHaveLinkedResource(
  repositories: Repositories,
  gymId: string,
  userId: string
) {
  const membership = await repositories.gymUsers.findGymUser(gymId, userId);
  if (!membership || membership.status !== UserStatus.Active) {
    throw conflict("Linked staff resources require active staff access.", "staff_resource_role_required");
  }
  const role = await repositories.roles.getRole(membership.roleId);
  if (!role || role.gymId !== gymId || !role.createsReservableResource) {
    throw conflict(
      "Linked staff resources require a role configured for reservable resources.",
      "staff_resource_role_required"
    );
  }
  return role;
}

function staffResourceName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

function roleResourceType(role: Role) {
  if (role.name === RoleName.Trainer) {
    return "trainer";
  }
  return (
    role.name
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "staff"
  );
}
