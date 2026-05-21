import { LocationStatus } from "@gym-platform/constants";
import type { LocationCreateInput, LocationUpdateInput } from "@gym-platform/validation";
import { randomUUID } from "node:crypto";
import { conflict, notFound } from "../../http/errors.js";
import type { Address, Location } from "../../infrastructure/store/entities.js";
import type { Repositories } from "../../infrastructure/store/repositories.js";
import type { Clock } from "../../shared/time.js";

export class LocationService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: Clock
  ) {}

  async list(gymId: string) {
    return (await this.repositories.locations.listLocationsForGym(gymId)).filter(
      (location) => location.status !== LocationStatus.Archived
    );
  }

  async get(gymId: string, locationId: string) {
    return this.getActive(gymId, locationId);
  }

  async listRooms(gymId: string, locationId: string) {
    await this.getActive(gymId, locationId);
    const rooms = new Map<
      string,
      {
        locationId: string;
        name: string;
        sessionCount: number;
        nextSessionAt?: Date;
      }
    >();

    for (const session of await this.repositories.classes.listClassSessionsForGym(gymId)) {
      const roomName = session.roomName?.trim();
      if (session.locationId !== locationId || !roomName) {
        continue;
      }
      const key = roomName.toLowerCase();
      const existing = rooms.get(key) ?? {
        locationId,
        name: roomName,
        sessionCount: 0
      };
      const nextSessionAt =
        session.startsAt >= this.clock.now() &&
        (!existing.nextSessionAt || session.startsAt < existing.nextSessionAt)
          ? session.startsAt
          : existing.nextSessionAt;
      rooms.set(key, {
        ...existing,
        sessionCount: existing.sessionCount + 1,
        ...(nextSessionAt ? { nextSessionAt } : {})
      });
    }

    return [...rooms.values()].sort((left, right) => left.name.localeCompare(right.name));
  }

  async create(gymId: string, input: LocationCreateInput) {
    if (!(await this.repositories.gyms.getGym(gymId))) {
      throw notFound("Gym was not found.");
    }
    const duplicate = (await this.list(gymId)).find(
      (location) => location.name.toLowerCase() === input.name.toLowerCase()
    );
    if (duplicate) {
      throw conflict("A location with this name already exists.", "location_name_exists");
    }
    const now = this.clock.now();
    const location: Location = {
      id: randomUUID(),
      gymId,
      name: input.name,
      address: normalizeAddress(input.address),
      timezone: input.timezone,
      operatingHours: input.operatingHours,
      status: LocationStatus.Active,
      createdAt: now,
      updatedAt: now
    };
    if (input.phone) {
      location.phone = input.phone;
    }
    return this.repositories.locations.createLocation(location);
  }

  async update(gymId: string, locationId: string, input: LocationUpdateInput) {
    const existing = await this.getActive(gymId, locationId);
    if (input.name) {
      const duplicate = (await this.list(gymId)).find(
        (location) =>
          location.id !== locationId && location.name.toLowerCase() === input.name?.toLowerCase()
      );
      if (duplicate) {
        throw conflict("A location with this name already exists.", "location_name_exists");
      }
    }
    const updated: Location = {
      ...existing,
      name: input.name ?? existing.name,
      timezone: input.timezone ?? existing.timezone,
      address: input.address ? normalizeAddress(input.address) : existing.address,
      operatingHours: input.operatingHours ?? existing.operatingHours,
      updatedAt: this.clock.now()
    };
    if (input.phone !== undefined) {
      if (input.phone) {
        updated.phone = input.phone;
      } else {
        delete updated.phone;
      }
    }
    return this.repositories.locations.updateLocation(updated);
  }

  async archive(gymId: string, locationId: string) {
    const existing = await this.getActive(gymId, locationId);
    const now = this.clock.now();
    const archived = {
      ...existing,
      status: LocationStatus.Archived,
      archivedAt: now,
      updatedAt: now
    };
    return this.repositories.locations.updateLocation(archived);
  }

  private async getActive(gymId: string, locationId: string) {
    const location = await this.repositories.locations.getLocation(locationId);
    if (!location || location.gymId !== gymId || location.status === LocationStatus.Archived) {
      throw notFound("Location was not found.");
    }
    return location;
  }
}

type AddressInput = Omit<Address, "line2"> & { line2?: string | undefined };

function normalizeAddress(address: AddressInput): Address {
  const normalized: Address = {
    line1: address.line1,
    city: address.city,
    region: address.region,
    postalCode: address.postalCode,
    country: address.country
  };
  if (address.line2) {
    normalized.line2 = address.line2;
  }
  return normalized;
}
