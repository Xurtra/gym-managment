export const GymStatus = {
  Active: "active",
  Suspended: "suspended",
  Archived: "archived"
} as const;

export type GymStatus = (typeof GymStatus)[keyof typeof GymStatus];

export const LocationStatus = {
  Active: "active",
  Archived: "archived"
} as const;

export type LocationStatus = (typeof LocationStatus)[keyof typeof LocationStatus];

export const UserStatus = {
  Active: "active",
  Invited: "invited",
  Disabled: "disabled"
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const StaffInviteStatus = {
  Pending: "pending",
  Accepted: "accepted",
  Revoked: "revoked",
  Expired: "expired"
} as const;

export type StaffInviteStatus = (typeof StaffInviteStatus)[keyof typeof StaffInviteStatus];

export const StaffAuditAction = {
  RoleChanged: "staff_role_changed",
  AccessRemoved: "staff_access_removed"
} as const;

export type StaffAuditAction = (typeof StaffAuditAction)[keyof typeof StaffAuditAction];

export const MembershipStatus = {
  Trialing: "trialing",
  Active: "active",
  PastDue: "past_due",
  Paused: "paused",
  Canceled: "canceled",
  Expired: "expired"
} as const;

export type MembershipStatus = (typeof MembershipStatus)[keyof typeof MembershipStatus];

export const ConsumerRecordStatus = {
  Active: "active",
  Inactive: "inactive",
  Archived: "archived"
} as const;

export type ConsumerRecordStatus =
  (typeof ConsumerRecordStatus)[keyof typeof ConsumerRecordStatus];

export const LeadStage = {
  None: "none",
  Open: "open",
  Converted: "converted",
  Closed: "closed"
} as const;

export type LeadStage = (typeof LeadStage)[keyof typeof LeadStage];

export const ConsumerSegment = {
  Lead: "lead",
  Customer: "customer",
  Member: "member"
} as const;

export type ConsumerSegment = (typeof ConsumerSegment)[keyof typeof ConsumerSegment];

export const MemberStatus = {
  Lead: "lead",
  Trial: "trial",
  Active: "active",
  PastDue: "past_due",
  Frozen: "frozen",
  Cancelled: "cancelled",
  Expired: "expired",
  Archived: "archived"
} as const;

export type MemberStatus = (typeof MemberStatus)[keyof typeof MemberStatus];

export const PlanStatus = {
  Active: "active",
  Archived: "archived"
} as const;

export type PlanStatus = (typeof PlanStatus)[keyof typeof PlanStatus];

export const BillingInterval = {
  Monthly: "monthly",
  Yearly: "yearly",
  OneTime: "one_time",
  Package: "package"
} as const;

export type BillingInterval = (typeof BillingInterval)[keyof typeof BillingInterval];

export const ClassSessionStatus = {
  Scheduled: "scheduled",
  Cancelled: "cancelled",
  Completed: "completed"
} as const;

export type ClassSessionStatus = (typeof ClassSessionStatus)[keyof typeof ClassSessionStatus];

export const BookingStatus = {
  Booked: "booked",
  Waitlisted: "waitlisted",
  Cancelled: "cancelled"
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const BookingSource = {
  Member: "member",
  Staff: "staff"
} as const;

export type BookingSource = (typeof BookingSource)[keyof typeof BookingSource];

export const ReservableResourceStatus = {
  Active: "active",
  Archived: "archived"
} as const;

export type ReservableResourceStatus =
  (typeof ReservableResourceStatus)[keyof typeof ReservableResourceStatus];

export const ResourceAllocationSource = {
  ClassSession: "class_session",
  FacilityReservation: "facility_reservation"
} as const;

export type ResourceAllocationSource =
  (typeof ResourceAllocationSource)[keyof typeof ResourceAllocationSource];

export const FacilityReservationStatus = {
  Pending: "pending",
  Confirmed: "confirmed",
  Cancelled: "cancelled"
} as const;

export type FacilityReservationStatus =
  (typeof FacilityReservationStatus)[keyof typeof FacilityReservationStatus];

export const ReservationPaymentRequirement = {
  Free: "free",
  PayUpfront: "pay_upfront",
  PayLater: "pay_later"
} as const;

export type ReservationPaymentRequirement =
  (typeof ReservationPaymentRequirement)[keyof typeof ReservationPaymentRequirement];

export const ReservationPaymentStatus = {
  NotRequired: "not_required",
  Unpaid: "unpaid",
  Paid: "paid",
  Refunded: "refunded"
} as const;

export type ReservationPaymentStatus =
  (typeof ReservationPaymentStatus)[keyof typeof ReservationPaymentStatus];

export const ReservationConfirmationMode = {
  Automatic: "automatic",
  StaffApproval: "staff_approval"
} as const;

export type ReservationConfirmationMode =
  (typeof ReservationConfirmationMode)[keyof typeof ReservationConfirmationMode];

export const NotificationEventStatus = {
  Pending: "pending",
  Sent: "sent",
  Failed: "failed"
} as const;

export type NotificationEventStatus =
  (typeof NotificationEventStatus)[keyof typeof NotificationEventStatus];

export const NotificationEventType = {
  WaitlistPromoted: "waitlist_promoted"
} as const;

export type NotificationEventType =
  (typeof NotificationEventType)[keyof typeof NotificationEventType];

export const CheckInStatus = {
  Allowed: "allowed",
  Denied: "denied"
} as const;

export type CheckInStatus = (typeof CheckInStatus)[keyof typeof CheckInStatus];

export const CheckInMethod = {
  StaffManual: "staff_manual",
  Barcode: "barcode",
  QrCode: "qr_code"
} as const;

export type CheckInMethod = (typeof CheckInMethod)[keyof typeof CheckInMethod];

export const AccessDeviceStatus = {
  Active: "active",
  Offline: "offline",
  Disabled: "disabled"
} as const;

export type AccessDeviceStatus = (typeof AccessDeviceStatus)[keyof typeof AccessDeviceStatus];

export const AccessDeviceType = {
  DoorController: "door_controller",
  Kiosk: "kiosk"
} as const;

export type AccessDeviceType = (typeof AccessDeviceType)[keyof typeof AccessDeviceType];

export const AccessEventDecision = {
  Unlock: "unlock",
  Deny: "deny"
} as const;

export type AccessEventDecision = (typeof AccessEventDecision)[keyof typeof AccessEventDecision];

export const RoleName = {
  Owner: "owner",
  Manager: "manager",
  Trainer: "trainer",
  FrontDesk: "front_desk",
  Sales: "sales",
  Accountant: "accountant",
  Member: "member"
} as const;

export type RoleName = (typeof RoleName)[keyof typeof RoleName];

export const Permission = {
  GymRead: "gym:read",
  GymUpdate: "gym:update",
  LocationRead: "location:read",
  LocationCreate: "location:create",
  LocationUpdate: "location:update",
  LocationArchive: "location:archive",
  StaffDirectoryView: "staff:directory_view",
  StaffRead: "staff:read",
  StaffInvite: "staff:invite",
  StaffRoleAssign: "staff:role_assign",
  StaffRemove: "staff:remove",
  MemberRead: "member:read",
  MemberWrite: "member:write",
  PlanRead: "plan:read",
  PlanWrite: "plan:write",
  ClassRead: "class:read",
  ClassWrite: "class:write",
  BookingRead: "booking:read",
  BookingWrite: "booking:write",
  AccessRead: "access:read",
  AccessWrite: "access:write",
  PaymentRead: "payment:read",
  PaymentWrite: "payment:write",
  ReportRead: "report:read",
  ScheduleRead: "schedule:read",
  ScheduleCreate: "schedule:create",
  SchedulePublish: "schedule:publish",
  ScheduleRequestsManage: "schedule:requests_manage",
  ScheduleAutoResolve: "schedule:auto_resolve",
  PlatformAdmin: "platform:admin"
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export const FeatureFlag = {
  OnlineSignup: "online_signup",
  ClassBooking: "class_booking",
  PersonalTraining: "personal_training",
  MemberPortal: "member_portal",
  WebsiteBuilder: "website_builder",
  PointOfSale: "point_of_sale",
  AccessControl: "access_control",
  AnonymousWalkInPos: "anonymous_walk_in_pos"
} as const;

export type FeatureFlag = (typeof FeatureFlag)[keyof typeof FeatureFlag];

export const TokenPurpose = {
  Refresh: "refresh",
  PasswordReset: "password_reset",
  EmailVerification: "email_verification"
} as const;

export type TokenPurpose = (typeof TokenPurpose)[keyof typeof TokenPurpose];

export const DEFAULT_ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  [RoleName.Owner]: Object.values(Permission).filter(
    (permission) => permission !== Permission.PlatformAdmin
  ),
  [RoleName.Manager]: [
    Permission.GymRead,
    Permission.GymUpdate,
    Permission.LocationRead,
    Permission.LocationCreate,
    Permission.LocationUpdate,
    Permission.LocationArchive,
    Permission.StaffDirectoryView,
    Permission.StaffRead,
    Permission.StaffInvite,
    Permission.StaffRoleAssign,
    Permission.StaffRemove,
    Permission.MemberRead,
    Permission.MemberWrite,
    Permission.PlanRead,
    Permission.PlanWrite,
    Permission.ClassRead,
    Permission.ClassWrite,
    Permission.BookingRead,
    Permission.BookingWrite,
    Permission.AccessRead,
    Permission.AccessWrite,
    Permission.PaymentRead,
    Permission.ReportRead
  ],
  [RoleName.Trainer]: [
    Permission.GymRead,
    Permission.LocationRead,
    Permission.StaffDirectoryView,
    Permission.MemberRead,
    Permission.ClassRead,
    Permission.ClassWrite,
    Permission.BookingRead,
    Permission.BookingWrite
  ],
  [RoleName.FrontDesk]: [
    Permission.GymRead,
    Permission.LocationRead,
    Permission.StaffDirectoryView,
    Permission.MemberRead,
    Permission.MemberWrite,
    Permission.ClassRead,
    Permission.BookingRead,
    Permission.BookingWrite,
    Permission.AccessRead,
    Permission.PaymentRead,
    Permission.PaymentWrite
  ],
  [RoleName.Sales]: [
    Permission.GymRead,
    Permission.StaffDirectoryView,
    Permission.MemberRead,
    Permission.MemberWrite,
    Permission.PlanRead,
    Permission.PaymentRead
  ],
  [RoleName.Accountant]: [
    Permission.GymRead,
    Permission.LocationRead,
    Permission.StaffDirectoryView,
    Permission.MemberRead,
    Permission.PlanRead,
    Permission.PaymentRead,
    Permission.ReportRead
  ],
  [RoleName.Member]: [
    Permission.GymRead,
    Permission.LocationRead,
    Permission.ClassRead,
    Permission.BookingRead,
    Permission.BookingWrite
  ]
};

export * from "./env.js";
