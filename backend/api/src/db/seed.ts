import {
  AccessDeviceType,
  BillingInterval,
  CheckInMethod,
  MemberStatus,
  MembershipStatus,
  RoleName,
  UserStatus
} from "@gym-platform/constants";
import { randomUUID } from "node:crypto";
import { createPostgresServices, createServices } from "../app.js";
import { loadConfig } from "../config/env.js";

const config = {
  ...loadConfig(),
  nodeEnv: "development" as const,
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET ?? "local-dev-secret-change-me"
};

const services =
  config.persistenceDriver === "postgres" ? createPostgresServices(config) : createServices(config);

try {
  const owner = await services.authService.register({
    email: "owner@example.com",
    password: "Password123",
    firstName: "Demo",
    lastName: "Owner",
    gymName: "Demo Strength Club",
    timezone: "America/New_York",
    locale: "en-US"
  });

  if (!owner.gym) {
    throw new Error("Demo gym was not created.");
  }

  const gymId = owner.gym.id;
  const gymSettings = await services.tenancyService.updateGym(gymId, {
    logoUrl: "https://example.com/demo-strength-club-logo.png",
    brandColors: {
      primary: "#111827",
      secondary: "#2563EB",
      accent: "#16A34A"
    },
    businessInfo: {
      legalName: "Demo Strength Club LLC",
      phone: "555-0100",
      email: "hello@example.com",
      website: "https://example.com"
    },
    operatingHours: {
      mon: [{ opensAt: "06:00", closesAt: "22:00" }],
      tue: [{ opensAt: "06:00", closesAt: "22:00" }],
      wed: [{ opensAt: "06:00", closesAt: "22:00" }],
      thu: [{ opensAt: "06:00", closesAt: "22:00" }],
      fri: [{ opensAt: "06:00", closesAt: "21:00" }],
      sat: [{ opensAt: "08:00", closesAt: "18:00" }],
      sun: [{ opensAt: "08:00", closesAt: "16:00" }]
    },
    onboardingCompletedSteps: ["gym-details", "location-details", "membership-plans"]
  });
  const location = await services.locationService.create(gymId, {
    name: "Main Floor",
    address: {
      line1: "100 Fitness Ave",
      city: "New York",
      region: "NY",
      postalCode: "10001",
      country: "US"
    },
    timezone: "America/New_York",
    phone: "555-0100",
    operatingHours: {
      mon: [{ opensAt: "06:00", closesAt: "22:00" }],
      tue: [{ opensAt: "06:00", closesAt: "22:00" }],
      wed: [{ opensAt: "06:00", closesAt: "22:00" }],
      thu: [{ opensAt: "06:00", closesAt: "22:00" }],
      fri: [{ opensAt: "06:00", closesAt: "21:00" }],
      sat: [{ opensAt: "08:00", closesAt: "18:00" }],
      sun: [{ opensAt: "08:00", closesAt: "16:00" }]
    }
  });
  const annexLocation = await services.locationService.create(gymId, {
    name: "Downtown Annex",
    address: {
      line1: "200 Market St",
      city: "New York",
      region: "NY",
      postalCode: "10002",
      country: "US"
    },
    timezone: "America/New_York",
    phone: "555-0200",
    operatingHours: {
      mon: [{ opensAt: "07:00", closesAt: "21:00" }],
      tue: [{ opensAt: "07:00", closesAt: "21:00" }],
      wed: [{ opensAt: "07:00", closesAt: "21:00" }],
      thu: [{ opensAt: "07:00", closesAt: "21:00" }],
      fri: [{ opensAt: "07:00", closesAt: "20:00" }],
      sat: [{ opensAt: "09:00", closesAt: "15:00" }]
    }
  });

  const [trainerRole, frontDeskRole, salesRole] = await Promise.all([
    services.roleService.getRoleByName(gymId, RoleName.Trainer),
    services.roleService.getRoleByName(gymId, RoleName.FrontDesk),
    services.roleService.getRoleByName(gymId, RoleName.Sales)
  ]);
  const [trainer, frontDesk] = await Promise.all([
    services.authService.register({
      email: "trainer@example.com",
      password: "Password123",
      firstName: "Demo",
      lastName: "Trainer",
      timezone: "America/New_York",
      locale: "en-US"
    }),
    services.authService.register({
      email: "frontdesk@example.com",
      password: "Password123",
      firstName: "Demo",
      lastName: "Frontdesk",
      timezone: "America/New_York",
      locale: "en-US"
    })
  ]);
  const now = services.clock.now();
  await Promise.all([
    services.repositories.gymUsers.createGymUser({
      id: randomUUID(),
      gymId,
      userId: trainer.user.id,
      roleId: trainerRole.id,
      status: UserStatus.Active,
      createdAt: now,
      updatedAt: now
    }),
    services.repositories.gymUsers.createGymUser({
      id: randomUUID(),
      gymId,
      userId: frontDesk.user.id,
      roleId: frontDeskRole.id,
      status: UserStatus.Active,
      createdAt: now,
      updatedAt: now
    })
  ]);
  const staffInvite = await services.roleService.inviteStaff(gymId, owner.user.id, {
    email: "sales@example.com",
    roleId: salesRole.id
  });

  const plans = await Promise.all([
    services.membershipPlanService.create(gymId, {
      name: "Monthly Unlimited",
      description: "Unlimited gym access with monthly billing.",
      billingInterval: BillingInterval.Monthly,
      priceCents: 9900,
      signupFeeCents: 0,
      trialDays: 7,
      autoRenew: true,
      isPublic: true
    }),
    services.membershipPlanService.create(gymId, {
      name: "Annual Unlimited",
      description: "Unlimited gym access with yearly billing.",
      billingInterval: BillingInterval.Yearly,
      priceCents: 99900,
      signupFeeCents: 0,
      trialDays: 14,
      autoRenew: true,
      contractLengthMonths: 12,
      isPublic: true
    }),
    services.membershipPlanService.create(gymId, {
      name: "10 Class Pack",
      description: "Ten public class credits.",
      billingInterval: BillingInterval.Package,
      priceCents: 18000,
      signupFeeCents: 0,
      trialDays: 0,
      autoRenew: false,
      classAccessLimit: 10,
      isPublic: true
    })
  ]);

  const members = await Promise.all([
    services.memberService.create(gymId, {
      firstName: "Jamie",
      lastName: "Rivera",
      email: "jamie@example.com",
      phone: "555-0101",
      barcode: "MEM-100",
      status: MemberStatus.Active,
      emergencyContact: {
        name: "Avery Rivera",
        phone: "555-0199",
        relationship: "Spouse"
      },
      notes: "Prefers morning classes.",
      tagNames: ["founding-member"]
    }),
    services.memberService.create(gymId, {
      firstName: "Taylor",
      lastName: "Morgan",
      email: "taylor@example.com",
      phone: "555-0102",
      barcode: "MEM-101",
      status: MemberStatus.Trial,
      tagNames: ["trial"]
    }),
    services.memberService.create(gymId, {
      firstName: "Jordan",
      lastName: "Lee",
      email: "jordan@example.com",
      phone: "555-0103",
      barcode: "MEM-102",
      status: MemberStatus.PastDue,
      notes: "Needs billing follow-up.",
      tagNames: ["billing-review"]
    })
  ]);
  const defaultPlan = plans[0];
  if (!defaultPlan) {
    throw new Error("Demo membership plans were not created.");
  }
  const memberMemberships = await Promise.all(
    members.map((member) =>
      services.memberMembershipService.assignPlan(gymId, member.id, {
        planId: defaultPlan.id,
        status: MembershipStatus.Active
      })
    )
  );

  const classType = await services.classScheduleService.createClassType(gymId, {
    name: "Strength Foundations",
    description: "Small-group full-body strength class.",
    defaultDurationMinutes: 60,
    defaultCapacity: 16,
    defaultWaitlistCapacity: 4,
    isPublic: true
  });
  const classSession = await services.classScheduleService.createSession(gymId, {
    classTypeId: classType.id,
    locationId: location.id,
    trainerUserId: trainer.user.id,
    roomName: "Studio A",
    startsAt: "2026-05-18T14:00:00.000Z",
    endsAt: "2026-05-18T15:00:00.000Z",
    capacity: 12,
    waitlistCapacity: 3,
    cancellationCutoffMinutes: 120,
    lateCancellationFeeCents: 1500
  });
  const annexClassSession = await services.classScheduleService.createSession(gymId, {
    classTypeId: classType.id,
    locationId: annexLocation.id,
    trainerUserId: trainer.user.id,
    roomName: "Lift Lab",
    startsAt: "2026-05-19T14:00:00.000Z",
    endsAt: "2026-05-19T15:00:00.000Z",
    capacity: 10,
    waitlistCapacity: 2,
    cancellationCutoffMinutes: 120,
    lateCancellationFeeCents: 1500
  });
  const locationRooms = await services.locationService.listRooms(gymId, location.id);
  const primaryMember = members[0];
  if (!primaryMember) {
    throw new Error("Demo members were not created.");
  }
  if (!primaryMember.barcode) {
    throw new Error("Primary demo member barcode was not created.");
  }
  const classBooking = await services.bookingService.createBooking(gymId, classSession.id, {
    memberId: primaryMember.id
  });
  const classCheckIn = await services.checkInService.checkIn(gymId, frontDesk.user.id, {
    barcode: primaryMember.barcode,
    locationId: location.id,
    classSessionId: classSession.id,
    method: CheckInMethod.Barcode
  });
  const accessDeviceRegistration = await services.accessControlService.registerDevice(gymId, {
    name: "Front Door Controller",
    locationId: location.id,
    deviceType: AccessDeviceType.DoorController
  });
  const accessRule = await services.accessControlService.createRule(gymId, {
    name: "Monthly Unlimited Main Floor Access",
    locationId: location.id,
    planId: defaultPlan.id
  });
  const annexAccessRule = await services.accessControlService.createRule(gymId, {
    name: "All Active Members Downtown Access",
    locationId: annexLocation.id,
    allowAllActiveMembers: true
  });
  const accessHeartbeat = await services.accessControlService.heartbeat({
    apiKey: accessDeviceRegistration.apiKey
  });
  const accessEvent = await services.accessControlService.authorizeDoor({
    apiKey: accessDeviceRegistration.apiKey,
    barcode: primaryMember.barcode
  });

  console.log(
    JSON.stringify(
      {
        owner: owner.user,
        staff: [trainer.user, frontDesk.user],
        staffInvite,
        gym: gymSettings,
        locations: [location, annexLocation],
        locationRooms,
        plans,
        members,
        memberMemberships,
        classType,
        classSessions: [classSession, annexClassSession],
        classBooking,
        classCheckIn,
        accessDevice: accessDeviceRegistration.device,
        accessDeviceApiKey: accessDeviceRegistration.apiKey,
        accessRules: [accessRule, annexAccessRule],
        accessHeartbeat,
        accessEvent,
        devCredentials: {
          owner: "owner@example.com / Password123",
          trainer: "trainer@example.com / Password123",
          frontDesk: "frontdesk@example.com / Password123"
        },
        devTokens: {
          accessToken: owner.accessToken,
          refreshToken: owner.refreshToken,
          emailVerificationToken: owner.emailVerificationToken
        }
      },
      null,
      2
    )
  );
} finally {
  if (hasClose(services)) {
    await services.close();
  }
}

function hasClose(value: unknown): value is { close: () => Promise<void> } {
  return typeof (value as { close?: unknown }).close === "function";
}
