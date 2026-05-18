import { describe, expect, it } from "vitest";
import { createServices } from "../../app.js";
import { fixedClock, testConfig } from "../../testUtils.js";
const locationInput = {
    name: "Main Floor",
    address: {
        line1: "100 Fitness Ave",
        city: "New York",
        region: "NY",
        postalCode: "10001",
        country: "US"
    },
    timezone: "America/New_York",
    operatingHours: {
        mon: [{ opensAt: "06:00", closesAt: "22:00" }]
    }
};
describe("LocationService", () => {
    it("creates, updates, and archives locations inside a gym scope", async () => {
        const services = createServices(testConfig, fixedClock);
        const owner = await services.authService.register({
            email: "owner@example.com",
            password: "Password123",
            firstName: "Demo",
            lastName: "Owner",
            gymName: "Demo Strength Club",
            timezone: "America/New_York",
            locale: "en-US"
        });
        const gymId = owner.gym?.id ?? "";
        const created = await services.locationService.create(gymId, locationInput);
        const found = await services.locationService.get(gymId, created.id);
        const updated = await services.locationService.update(gymId, created.id, { name: "Main Studio" });
        const archived = await services.locationService.archive(gymId, created.id);
        expect(created.gymId).toBe(gymId);
        expect(found.id).toBe(created.id);
        expect(updated.name).toBe("Main Studio");
        expect(archived.status).toBe("archived");
        expect(await services.locationService.list(gymId)).toHaveLength(0);
    });
    it("rejects duplicate active location names", async () => {
        const services = createServices(testConfig, fixedClock);
        const owner = await services.authService.register({
            email: "owner@example.com",
            password: "Password123",
            firstName: "Demo",
            lastName: "Owner",
            gymName: "Demo Strength Club",
            timezone: "America/New_York",
            locale: "en-US"
        });
        const gymId = owner.gym?.id ?? "";
        await services.locationService.create(gymId, locationInput);
        await expect(services.locationService.create(gymId, locationInput)).rejects.toThrow(/already exists/i);
    });
    it("lists class rooms that belong to a location", async () => {
        const services = createServices(testConfig, fixedClock);
        const owner = await services.authService.register({
            email: "owner@example.com",
            password: "Password123",
            firstName: "Demo",
            lastName: "Owner",
            gymName: "Demo Strength Club",
            timezone: "America/New_York",
            locale: "en-US"
        });
        const gymId = owner.gym?.id ?? "";
        const location = await services.locationService.create(gymId, locationInput);
        const otherLocation = await services.locationService.create(gymId, {
            ...locationInput,
            name: "Annex"
        });
        const classType = await services.classScheduleService.createClassType(gymId, {
            name: "Strength Foundations",
            defaultDurationMinutes: 60,
            defaultCapacity: 16,
            defaultWaitlistCapacity: 4,
            isPublic: true
        });
        await services.classScheduleService.createSession(gymId, {
            classTypeId: classType.id,
            locationId: location.id,
            roomName: "Studio A",
            startsAt: "2026-05-18T14:00:00.000Z",
            endsAt: "2026-05-18T15:00:00.000Z",
            capacity: 12,
            waitlistCapacity: 3
        });
        await services.classScheduleService.createSession(gymId, {
            classTypeId: classType.id,
            locationId: location.id,
            roomName: "Studio A",
            startsAt: "2026-05-19T14:00:00.000Z",
            endsAt: "2026-05-19T15:00:00.000Z",
            capacity: 12,
            waitlistCapacity: 3
        });
        await services.classScheduleService.createSession(gymId, {
            classTypeId: classType.id,
            locationId: otherLocation.id,
            roomName: "Lift Lab",
            startsAt: "2026-05-18T16:00:00.000Z",
            endsAt: "2026-05-18T17:00:00.000Z",
            capacity: 12,
            waitlistCapacity: 3
        });
        const rooms = await services.locationService.listRooms(gymId, location.id);
        expect(rooms).toHaveLength(1);
        expect(rooms[0]?.name).toBe("Studio A");
        expect(rooms[0]?.sessionCount).toBe(2);
        expect(rooms[0]?.nextSessionAt?.toISOString()).toBe("2026-05-18T14:00:00.000Z");
    });
});
//# sourceMappingURL=location.service.test.js.map