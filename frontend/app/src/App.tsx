import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AccessControlDomainRoute, PaymentsDomainRoute } from "./AccessPaymentsScreens.js";
import { AuthDomainRoute } from "./AuthScreens.js";
import { BookingsDomainRoute } from "./BookingsScreens.js";
import { CheckInsDomainRoute } from "./CheckInsScreens.js";
import { ClassesDomainRoute } from "./ClassesScreens.js";
import { ConsumersDomainRoute } from "./ConsumersScreens.js";
import { GrowthDomainRoute } from "./GrowthScreens.js";
import { MembersDomainRoute } from "./MembersScreens.js";
import { PlansDomainRoute } from "./PlansScreens.js";
import { ReservationsDomainRoute } from "./ReservationsScreens.js";
import { StaffDomainRoute } from "./StaffScreens.js";
import { DashboardHomeRoute, NotFound, ShellPlaceholderRoute } from "./StubScreens.js";
import { loadSession } from "./dashboardData.js";

export function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}

function AppRoutes() {
  const session = loadSession();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={session ? "/dashboard/home" : "/dashboard/login"} replace />} />
      <Route path="/dashboard" element={<Navigate to={session ? "/dashboard/home" : "/dashboard/login"} replace />} />

      <Route path="/login" element={<Navigate to="/dashboard/login" replace />} />
      <Route path="/register" element={<Navigate to="/dashboard/register" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/dashboard/forgot-password" replace />} />
      <Route path="/reset-password" element={<Navigate to="/dashboard/reset-password" replace />} />

      <Route path="/dashboard/login" element={<AuthDomainRoute mode="login" />} />
      <Route path="/dashboard/register" element={<AuthDomainRoute mode="register" />} />
      <Route path="/dashboard/forgot-password" element={<AuthDomainRoute mode="forgot" />} />
      <Route path="/dashboard/reset-password" element={<AuthDomainRoute mode="reset" />} />
      <Route path="/dashboard/verify-email" element={<AuthDomainRoute mode="verify-email" />} />
      <Route path="/dashboard/2fa/setup" element={<AuthDomainRoute mode="two-factor-setup" />} />
      <Route path="/dashboard/2fa/verify" element={<AuthDomainRoute mode="two-factor-verify" />} />
      <Route path="/dashboard/recovery-login" element={<AuthDomainRoute mode="recovery-login" />} />
      <Route path="/dashboard/recovery-codes" element={<AuthDomainRoute mode="recovery-codes" />} />

      <Route path="/dashboard/home" element={<DashboardHomeRoute />} />
      <Route path="/dashboard/locations" element={<ShellPlaceholderRoute path="/locations" title="Locations" body="Location management migration is scheduled in a follow-up pass." />} />

      <Route path="/dashboard/consumers" element={<ConsumersDomainRoute mode="list" />} />
      <Route path="/dashboard/consumers/profile/:memberId" element={<MembersDomainRoute mode="detail" />} />
      <Route path="/dashboard/consumers/edit/:memberId" element={<MembersDomainRoute mode="edit" />} />
      <Route path="/dashboard/leads/:consumerId" element={<ConsumersDomainRoute mode="lead-detail" />} />
      <Route path="/dashboard/leads/:consumerId/convert" element={<ConsumersDomainRoute mode="lead-convert" />} />

      <Route path="/dashboard/members" element={<MembersDomainRoute mode="list" />} />
      <Route path="/dashboard/members/:memberId" element={<MembersDomainRoute mode="detail" />} />
      <Route path="/dashboard/members/:memberId/edit" element={<MembersDomainRoute mode="edit" />} />

      <Route path="/dashboard/bookings" element={<BookingsDomainRoute mode="list" />} />
      <Route path="/dashboard/bookings/:bookingId" element={<BookingsDomainRoute mode="detail" />} />
      <Route path="/dashboard/bookings/:bookingId/cancel" element={<BookingsDomainRoute mode="cancel" />} />

      <Route path="/dashboard/classes" element={<ClassesDomainRoute mode="list" />} />
      <Route path="/dashboard/classes/:sessionId" element={<ClassesDomainRoute mode="detail" />} />

      <Route path="/dashboard/check-ins" element={<CheckInsDomainRoute mode="desk" />} />
      <Route path="/dashboard/check-ins/kiosk" element={<CheckInsDomainRoute mode="kiosk" />} />
      <Route path="/dashboard/check-ins/history" element={<CheckInsDomainRoute mode="history" />} />

      <Route path="/dashboard/growth" element={<GrowthDomainRoute mode="dashboard" />} />
      <Route path="/dashboard/growth/inbox" element={<GrowthDomainRoute mode="inbox" />} />
      <Route path="/dashboard/growth/watchlist" element={<GrowthDomainRoute mode="watchlist" />} />
      <Route path="/dashboard/growth/leads/:consumerId" element={<GrowthDomainRoute mode="lead" />} />

      <Route path="/dashboard/reservations" element={<ReservationsDomainRoute mode="list" />} />
      <Route path="/dashboard/reservations/calendar" element={<ReservationsDomainRoute mode="calendar" />} />
      <Route path="/dashboard/reservations/new" element={<ReservationsDomainRoute mode="create" />} />
      <Route path="/dashboard/reservations/:reservationId/edit" element={<ReservationsDomainRoute mode="edit" />} />
      <Route path="/dashboard/reports" element={<ReservationsDomainRoute mode="list" />} />

      <Route path="/dashboard/staff" element={<StaffDomainRoute mode="directory" />} />
      <Route path="/dashboard/staff/invites" element={<StaffDomainRoute mode="invites" />} />
      <Route path="/dashboard/staff/shifts" element={<StaffDomainRoute mode="shifts" />} />
      <Route path="/dashboard/staff/time-clock" element={<StaffDomainRoute mode="time-clock" />} />
      <Route path="/dashboard/settings" element={<PlansDomainRoute />} />

      <Route path="/dashboard/access-control" element={<AccessControlDomainRoute mode="devices" />} />
      <Route path="/dashboard/access-control/register" element={<AccessControlDomainRoute mode="register" />} />
      <Route path="/dashboard/access-control/rules" element={<AccessControlDomainRoute mode="rules" />} />

      <Route path="/dashboard/payments" element={<PaymentsDomainRoute mode="history" />} />
      <Route path="/dashboard/payments/catalog" element={<PaymentsDomainRoute mode="catalog" />} />
      <Route path="/dashboard/payments/terminal" element={<PaymentsDomainRoute mode="terminal" />} />
      <Route path="/dashboard/payments/connect" element={<PaymentsDomainRoute mode="connect" />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
