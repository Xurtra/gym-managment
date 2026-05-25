export const queryKeys = {
  dashboardWorkspace: ["dashboard-workspace"] as const,
  operationsWorkspace: ["operations-workspace"] as const,
  growthWorkspace: ["growth-workspace"] as const,
  classBookingsWorkspace: ["class-bookings-workspace"] as const,
  plansWorkspace: ["plans-workspace"] as const,
  memberMemberships: (gymId: string, memberId: string) =>
    ["member-memberships", gymId, memberId] as const,
  growthInteractions: (gymId: string, consumerId: string) =>
    ["growth-interactions", gymId, consumerId] as const,
  publicGym: (gymSlug: string) => ["public-gym", gymSlug] as const,
  allWorkspaces: [
    ["dashboard-workspace"],
    ["operations-workspace"],
    ["growth-workspace"],
    ["class-bookings-workspace"],
    ["plans-workspace"]
  ] as const
};
