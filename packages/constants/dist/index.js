export const GymStatus = {
    Active: "active",
    Suspended: "suspended",
    Archived: "archived"
};
export const LocationStatus = {
    Active: "active",
    Archived: "archived"
};
export const UserStatus = {
    Active: "active",
    Invited: "invited",
    Disabled: "disabled"
};
export const StaffInviteStatus = {
    Pending: "pending",
    Accepted: "accepted",
    Revoked: "revoked",
    Expired: "expired"
};
export const StaffAuditAction = {
    RoleChanged: "staff_role_changed",
    AccessRemoved: "staff_access_removed"
};
export const MembershipStatus = {
    Trialing: "trialing",
    Active: "active",
    PastDue: "past_due",
    Paused: "paused",
    Canceled: "canceled",
    Expired: "expired"
};
export const ConsumerRecordStatus = {
    Active: "active",
    Inactive: "inactive",
    Archived: "archived"
};
export const LeadStage = {
    None: "none",
    Open: "open",
    Converted: "converted",
    Closed: "closed"
};
export const ConsumerSegment = {
    Lead: "lead",
    Customer: "customer",
    Member: "member"
};
export const MemberStatus = {
    Lead: "lead",
    Trial: "trial",
    Active: "active",
    PastDue: "past_due",
    Frozen: "frozen",
    Cancelled: "cancelled",
    Expired: "expired",
    Archived: "archived"
};
export const PlanStatus = {
    Active: "active",
    Archived: "archived"
};
export const BillingInterval = {
    Monthly: "monthly",
    Yearly: "yearly",
    OneTime: "one_time",
    Package: "package"
};
export const ClassSessionStatus = {
    Scheduled: "scheduled",
    Cancelled: "cancelled",
    Completed: "completed"
};
export const BookingStatus = {
    Booked: "booked",
    Waitlisted: "waitlisted",
    Cancelled: "cancelled"
};
export const BookingSource = {
    Member: "member",
    Staff: "staff"
};
export const ReservableResourceStatus = {
    Active: "active",
    Archived: "archived"
};
export const ResourceAllocationSource = {
    ClassSession: "class_session",
    FacilityReservation: "facility_reservation"
};
export const FacilityReservationStatus = {
    Pending: "pending",
    Confirmed: "confirmed",
    Cancelled: "cancelled"
};
export const ReservationPaymentRequirement = {
    Free: "free",
    PayUpfront: "pay_upfront",
    PayLater: "pay_later"
};
export const ReservationPaymentStatus = {
    NotRequired: "not_required",
    Unpaid: "unpaid",
    Paid: "paid",
    Refunded: "refunded"
};
export const ReservationConfirmationMode = {
    Automatic: "automatic",
    StaffApproval: "staff_approval"
};
export const NotificationEventStatus = {
    Pending: "pending",
    Sent: "sent",
    Failed: "failed"
};
export const NotificationEventType = {
    WaitlistPromoted: "waitlist_promoted"
};
export const CheckInStatus = {
    Allowed: "allowed",
    Denied: "denied"
};
export const CheckInMethod = {
    StaffManual: "staff_manual",
    Barcode: "barcode",
    QrCode: "qr_code"
};
export const AccessDeviceStatus = {
    Active: "active",
    Offline: "offline",
    Disabled: "disabled"
};
export const AccessDeviceType = {
    DoorController: "door_controller",
    Kiosk: "kiosk"
};
export const AccessEventDecision = {
    Unlock: "unlock",
    Deny: "deny"
};
export const RoleName = {
    Owner: "owner",
    Manager: "manager",
    Trainer: "trainer",
    FrontDesk: "front_desk",
    Sales: "sales",
    Accountant: "accountant",
    Member: "member"
};
export const Permission = {
    GymRead: "gym:read",
    GymUpdate: "gym:update",
    LocationRead: "location:read",
    LocationCreate: "location:create",
    LocationUpdate: "location:update",
    LocationArchive: "location:archive",
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
    PlatformAdmin: "platform:admin"
};
export const FeatureFlag = {
    OnlineSignup: "online_signup",
    ClassBooking: "class_booking",
    PersonalTraining: "personal_training",
    MemberPortal: "member_portal",
    WebsiteBuilder: "website_builder",
    PointOfSale: "point_of_sale",
    AccessControl: "access_control",
    AnonymousWalkInPos: "anonymous_walk_in_pos"
};
export const TokenPurpose = {
    Refresh: "refresh",
    PasswordReset: "password_reset",
    EmailVerification: "email_verification"
};
export const DEFAULT_ROLE_PERMISSIONS = {
    [RoleName.Owner]: Object.values(Permission).filter((permission) => permission !== Permission.PlatformAdmin),
    [RoleName.Manager]: [
        Permission.GymRead,
        Permission.GymUpdate,
        Permission.LocationRead,
        Permission.LocationCreate,
        Permission.LocationUpdate,
        Permission.LocationArchive,
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
        Permission.MemberRead,
        Permission.ClassRead,
        Permission.ClassWrite,
        Permission.BookingRead,
        Permission.BookingWrite
    ],
    [RoleName.FrontDesk]: [
        Permission.GymRead,
        Permission.LocationRead,
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
        Permission.MemberRead,
        Permission.MemberWrite,
        Permission.PlanRead,
        Permission.PaymentRead
    ],
    [RoleName.Accountant]: [
        Permission.GymRead,
        Permission.LocationRead,
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
//# sourceMappingURL=index.js.map