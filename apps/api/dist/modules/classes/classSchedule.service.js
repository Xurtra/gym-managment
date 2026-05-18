import { ClassSessionStatus, LocationStatus, UserStatus } from "@gym-platform/constants";
import { randomUUID } from "node:crypto";
import { badRequest, conflict, notFound } from "../../http/errors.js";
export class ClassScheduleService {
    repositories;
    clock;
    constructor(repositories, clock) {
        this.repositories = repositories;
        this.clock = clock;
    }
    async createClassType(gymId, input) {
        const duplicate = (await this.repositories.classes.listClassTypesForGym(gymId)).find((classType) => classType.name.toLowerCase() === input.name.toLowerCase());
        if (duplicate) {
            throw conflict("A class type with this name already exists.", "class_type_name_exists");
        }
        const now = this.clock.now();
        const classType = {
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
    async listClassTypes(gymId) {
        return this.repositories.classes.listClassTypesForGym(gymId);
    }
    async createSession(gymId, input) {
        const classType = await this.repositories.classes.getClassType(input.classTypeId);
        if (!classType || classType.gymId !== gymId) {
            throw notFound("Class type was not found.");
        }
        const location = await this.repositories.locations.getLocation(input.locationId);
        if (!location || location.gymId !== gymId || location.status === LocationStatus.Archived) {
            throw notFound("Location was not found.");
        }
        if (input.trainerUserId) {
            const trainerMembership = await this.repositories.gymUsers.findGymUser(gymId, input.trainerUserId);
            if (!trainerMembership || trainerMembership.status !== UserStatus.Active) {
                throw notFound("Trainer was not found.");
            }
        }
        const startsAt = new Date(input.startsAt);
        const endsAt = new Date(input.endsAt);
        if (endsAt <= startsAt) {
            throw badRequest("Class session end time must be after start time.", "invalid_class_time");
        }
        const now = this.clock.now();
        const session = {
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
        return this.repositories.classes.createClassSession(session);
    }
    async publicSchedule(gymSlug, from, to, filters = {}) {
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
}
//# sourceMappingURL=classSchedule.service.js.map