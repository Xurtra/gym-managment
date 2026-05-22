export declare const GymStatus: {
    readonly Active: "active";
    readonly Suspended: "suspended";
    readonly Archived: "archived";
};
export type GymStatus = (typeof GymStatus)[keyof typeof GymStatus];
export declare const LocationStatus: {
    readonly Active: "active";
    readonly Archived: "archived";
};
export type LocationStatus = (typeof LocationStatus)[keyof typeof LocationStatus];
export declare const UserStatus: {
    readonly Active: "active";
    readonly Invited: "invited";
    readonly Disabled: "disabled";
};
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
export declare const StaffInviteStatus: {
    readonly Pending: "pending";
    readonly Accepted: "accepted";
    readonly Revoked: "revoked";
    readonly Expired: "expired";
};
export type StaffInviteStatus = (typeof StaffInviteStatus)[keyof typeof StaffInviteStatus];
export declare const StaffAuditAction: {
    readonly RoleChanged: "staff_role_changed";
    readonly AccessRemoved: "staff_access_removed";
};
export type StaffAuditAction = (typeof StaffAuditAction)[keyof typeof StaffAuditAction];
export declare const MembershipStatus: {
    readonly Trialing: "trialing";
    readonly Active: "active";
    readonly PastDue: "past_due";
    readonly Paused: "paused";
    readonly Canceled: "canceled";
    readonly Expired: "expired";
};
export type MembershipStatus = (typeof MembershipStatus)[keyof typeof MembershipStatus];
export declare const ConsumerRecordStatus: {
    readonly Active: "active";
    readonly Inactive: "inactive";
    readonly Archived: "archived";
};
export type ConsumerRecordStatus = (typeof ConsumerRecordStatus)[keyof typeof ConsumerRecordStatus];
export declare const LeadStage: {
    readonly None: "none";
    readonly Open: "open";
    readonly Converted: "converted";
    readonly Closed: "closed";
};
export type LeadStage = (typeof LeadStage)[keyof typeof LeadStage];
export declare const ConsumerSegment: {
    readonly Lead: "lead";
    readonly Customer: "customer";
    readonly Member: "member";
};
export type ConsumerSegment = (typeof ConsumerSegment)[keyof typeof ConsumerSegment];
export declare const MemberStatus: {
    readonly Lead: "lead";
    readonly Trial: "trial";
    readonly Active: "active";
    readonly PastDue: "past_due";
    readonly Frozen: "frozen";
    readonly Cancelled: "cancelled";
    readonly Expired: "expired";
    readonly Archived: "archived";
};
export type MemberStatus = (typeof MemberStatus)[keyof typeof MemberStatus];
export declare const PlanStatus: {
    readonly Active: "active";
    readonly Archived: "archived";
};
export type PlanStatus = (typeof PlanStatus)[keyof typeof PlanStatus];
export declare const BillingInterval: {
    readonly Monthly: "monthly";
    readonly Yearly: "yearly";
    readonly OneTime: "one_time";
    readonly Package: "package";
};
export type BillingInterval = (typeof BillingInterval)[keyof typeof BillingInterval];
export declare const ClassSessionStatus: {
    readonly Scheduled: "scheduled";
    readonly Cancelled: "cancelled";
    readonly Completed: "completed";
};
export type ClassSessionStatus = (typeof ClassSessionStatus)[keyof typeof ClassSessionStatus];
export declare const BookingStatus: {
    readonly Booked: "booked";
    readonly Waitlisted: "waitlisted";
    readonly Cancelled: "cancelled";
};
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];
export declare const BookingSource: {
    readonly Member: "member";
    readonly Staff: "staff";
};
export type BookingSource = (typeof BookingSource)[keyof typeof BookingSource];
export declare const ReservableResourceStatus: {
    readonly Active: "active";
    readonly Archived: "archived";
};
export type ReservableResourceStatus = (typeof ReservableResourceStatus)[keyof typeof ReservableResourceStatus];
export declare const ResourceAllocationSource: {
    readonly ClassSession: "class_session";
    readonly FacilityReservation: "facility_reservation";
};
export type ResourceAllocationSource = (typeof ResourceAllocationSource)[keyof typeof ResourceAllocationSource];
export declare const FacilityReservationStatus: {
    readonly Pending: "pending";
    readonly Confirmed: "confirmed";
    readonly Cancelled: "cancelled";
};
export type FacilityReservationStatus = (typeof FacilityReservationStatus)[keyof typeof FacilityReservationStatus];
export declare const ReservationPaymentRequirement: {
    readonly Free: "free";
    readonly PayUpfront: "pay_upfront";
    readonly PayLater: "pay_later";
};
export type ReservationPaymentRequirement = (typeof ReservationPaymentRequirement)[keyof typeof ReservationPaymentRequirement];
export declare const ReservationPaymentStatus: {
    readonly NotRequired: "not_required";
    readonly Unpaid: "unpaid";
    readonly Paid: "paid";
    readonly Refunded: "refunded";
};
export type ReservationPaymentStatus = (typeof ReservationPaymentStatus)[keyof typeof ReservationPaymentStatus];
export declare const ReservationConfirmationMode: {
    readonly Automatic: "automatic";
    readonly StaffApproval: "staff_approval";
};
export type ReservationConfirmationMode = (typeof ReservationConfirmationMode)[keyof typeof ReservationConfirmationMode];
export declare const NotificationEventStatus: {
    readonly Pending: "pending";
    readonly Sent: "sent";
    readonly Failed: "failed";
};
export type NotificationEventStatus = (typeof NotificationEventStatus)[keyof typeof NotificationEventStatus];
export declare const NotificationEventType: {
    readonly WaitlistPromoted: "waitlist_promoted";
};
export type NotificationEventType = (typeof NotificationEventType)[keyof typeof NotificationEventType];
export declare const CheckInStatus: {
    readonly Allowed: "allowed";
    readonly Denied: "denied";
};
export type CheckInStatus = (typeof CheckInStatus)[keyof typeof CheckInStatus];
export declare const CheckInMethod: {
    readonly StaffManual: "staff_manual";
    readonly Barcode: "barcode";
    readonly QrCode: "qr_code";
};
export type CheckInMethod = (typeof CheckInMethod)[keyof typeof CheckInMethod];
export declare const AccessDeviceStatus: {
    readonly Active: "active";
    readonly Offline: "offline";
    readonly Disabled: "disabled";
};
export type AccessDeviceStatus = (typeof AccessDeviceStatus)[keyof typeof AccessDeviceStatus];
export declare const AccessDeviceType: {
    readonly DoorController: "door_controller";
    readonly Kiosk: "kiosk";
};
export type AccessDeviceType = (typeof AccessDeviceType)[keyof typeof AccessDeviceType];
export declare const AccessEventDecision: {
    readonly Unlock: "unlock";
    readonly Deny: "deny";
};
export type AccessEventDecision = (typeof AccessEventDecision)[keyof typeof AccessEventDecision];
export declare const RoleName: {
    readonly Owner: "owner";
    readonly Manager: "manager";
    readonly Trainer: "trainer";
    readonly FrontDesk: "front_desk";
    readonly Sales: "sales";
    readonly Accountant: "accountant";
    readonly Member: "member";
};
export type RoleName = (typeof RoleName)[keyof typeof RoleName];
export declare const Permission: {
    readonly GymRead: "gym:read";
    readonly GymUpdate: "gym:update";
    readonly LocationRead: "location:read";
    readonly LocationCreate: "location:create";
    readonly LocationUpdate: "location:update";
    readonly LocationArchive: "location:archive";
    readonly StaffRead: "staff:read";
    readonly StaffInvite: "staff:invite";
    readonly StaffRoleAssign: "staff:role_assign";
    readonly StaffRemove: "staff:remove";
    readonly MemberRead: "member:read";
    readonly MemberWrite: "member:write";
    readonly PlanRead: "plan:read";
    readonly PlanWrite: "plan:write";
    readonly ClassRead: "class:read";
    readonly ClassWrite: "class:write";
    readonly BookingRead: "booking:read";
    readonly BookingWrite: "booking:write";
    readonly AccessRead: "access:read";
    readonly AccessWrite: "access:write";
    readonly PaymentRead: "payment:read";
    readonly PaymentWrite: "payment:write";
    readonly ReportRead: "report:read";
    readonly PlatformAdmin: "platform:admin";
};
export type Permission = (typeof Permission)[keyof typeof Permission];
export declare const FeatureFlag: {
    readonly OnlineSignup: "online_signup";
    readonly ClassBooking: "class_booking";
    readonly PersonalTraining: "personal_training";
    readonly MemberPortal: "member_portal";
    readonly WebsiteBuilder: "website_builder";
    readonly PointOfSale: "point_of_sale";
    readonly AccessControl: "access_control";
};
export type FeatureFlag = (typeof FeatureFlag)[keyof typeof FeatureFlag];
export declare const TokenPurpose: {
    readonly Refresh: "refresh";
    readonly PasswordReset: "password_reset";
    readonly EmailVerification: "email_verification";
};
export type TokenPurpose = (typeof TokenPurpose)[keyof typeof TokenPurpose];
export declare const DEFAULT_ROLE_PERMISSIONS: Record<RoleName, Permission[]>;
export * from "./env.js";
//# sourceMappingURL=index.d.ts.map