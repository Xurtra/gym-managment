import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { AccessDeviceType } from "@gym-platform/constants";
import { table } from "@gym-platform/ui";
import {
  buildAccessDeviceListScreen,
  buildAccessDeviceRegistrationScreen,
  buildDashboardShellLayout,
  buildPageHeader,
  buildStripePaymentHistoryScreen,
  type AccessDeviceView,
  type StripePaymentTransactionView
} from "@gym-platform/dashboard";
import { EmptyState, FormLayout, SelectField, StatusBadge, Table } from "@gym-platform/ui-react";
import {
  createAccessDevice,
  loadOperationsWorkspace,
  loadSession,
  type AccessDeviceRecord,
  type DashboardWorkspaceData,
  type ResourceRecord
} from "./dashboardData.js";
import { queryKeys } from "./queryKeys.js";
import { Shell } from "./Shell.js";

type AccessMode = "devices" | "register" | "rules";
type PaymentsMode = "history" | "catalog" | "terminal" | "connect";

type ReadyData = DashboardWorkspaceData & {
  accessDevices: AccessDeviceRecord[];
  resources: ResourceRecord[];
  posTransactions: StripePaymentTransactionView[];
  stripeAccount: {
    accountId?: string;
    country?: string;
    defaultCurrency?: string;
    businessName?: string;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    onboardingComplete: boolean;
    requirementsDue: string[];
    dashboardUrl?: string;
  };
};

export function AccessControlDomainRoute({ mode }: { mode: AccessMode }) {
  const session = loadSession();
  const workspaceQuery = useQuery({
    queryKey: queryKeys.operationsWorkspace,
    queryFn: () => loadOperationsWorkspace(),
    enabled: Boolean(session)
  });

  if (!session) {
    return <Navigate to="/dashboard/login" replace />;
  }
  if (workspaceQuery.isLoading) {
    return <div className="react-bootstrap-state">Loading access control...</div>;
  }
  if (workspaceQuery.isError || !workspaceQuery.data) {
    return <div className="empty-state"><h3>Access control unavailable</h3><p>{describeError(workspaceQuery.error)}</p></div>;
  }
  const data = workspaceQuery.data as ReadyData;

  const shell = buildDashboardShellLayout({
    path: "/access-control",
    permissions: data.permissions,
    platformAdmin: data.platformAdmin,
    email: data.me.user.email,
    firstName: data.me.user.firstName,
    lastName: data.me.user.lastName,
    gymName: data.gym.name,
    gymSlug: data.gym.slug,
    gymLogoUrl: data.gym.logoUrl,
    pageHeader: buildPageHeader({
      title: mode === "register" ? "Register Access Device" : mode === "rules" ? "Access Rules" : "Access Devices",
      eyebrow: "Security",
      breadcrumbs: [
        { label: "Dashboard", href: "/" },
        { label: "Access Control", href: "/access-control" }
      ]
    })
  });

  return (
    <Shell model={shell}>
      {mode === "register" ? (
        <AccessDeviceRegistrationView data={data} />
      ) : mode === "rules" ? (
        <ComingSoon title="Access rule editor" body="Rule authoring is wired to React but remains a placeholder for the dedicated integration pass." />
      ) : (
        <AccessDeviceListView data={data} />
      )}
    </Shell>
  );
}

export function PaymentsDomainRoute({ mode }: { mode: PaymentsMode }) {
  const session = loadSession();
  const workspaceQuery = useQuery({
    queryKey: queryKeys.operationsWorkspace,
    queryFn: () => loadOperationsWorkspace(),
    enabled: Boolean(session)
  });

  if (!session) {
    return <Navigate to="/dashboard/login" replace />;
  }
  if (workspaceQuery.isLoading) {
    return <div className="react-bootstrap-state">Loading payments...</div>;
  }
  if (workspaceQuery.isError || !workspaceQuery.data) {
    return <div className="empty-state"><h3>Payments unavailable</h3><p>{describeError(workspaceQuery.error)}</p></div>;
  }
  const data = workspaceQuery.data as ReadyData;

  const shell = buildDashboardShellLayout({
    path: "/payments",
    permissions: data.permissions,
    platformAdmin: data.platformAdmin,
    email: data.me.user.email,
    firstName: data.me.user.firstName,
    lastName: data.me.user.lastName,
    gymName: data.gym.name,
    gymSlug: data.gym.slug,
    gymLogoUrl: data.gym.logoUrl,
    pageHeader: buildPageHeader({
      title: mode === "catalog" ? "POS Catalog" : mode === "terminal" ? "Stripe Terminal" : mode === "connect" ? "Stripe Connect" : "Payment History",
      eyebrow: "Payments",
      breadcrumbs: [
        { label: "Dashboard", href: "/" },
        { label: "Payments", href: "/payments" }
      ]
    })
  });

  return (
    <Shell model={shell}>
      {mode === "catalog" ? (
        <PosCatalogView resources={data.resources} />
      ) : mode === "terminal" ? (
        <ComingSoon title="Stripe Terminal reader flow" body="Reader connection and payment capture UI will land in the Stripe integration pass." />
      ) : mode === "connect" ? (
        <ComingSoon title="Stripe Connect onboarding" body="Hosted onboarding components are stubbed while embedded Stripe setup is implemented." />
      ) : (
        <PaymentHistoryView data={data} />
      )}
    </Shell>
  );
}

function AccessDeviceListView({ data }: { data: ReadyData }) {
  const screen = buildAccessDeviceListScreen(data.accessDevices as unknown as AccessDeviceView[]);

  return (
    <section className="club-panel">
      <div className="card-head">
        <h2>Connected access devices</h2>
        <span>{screen.offlineCount} offline</span>
      </div>
      <div className="data-card">
        <Table
          model={{
            kind: "table",
            columns: [
              { key: "name", label: "Device" },
              { key: "locationName", label: "Location" },
              { key: "deviceType", label: "Type" },
              { key: "status", label: "Status" },
              { key: "apiKeyPreview", label: "API key" }
            ],
            rows: screen.devices
          }}
          getRowKey={(row) => row.id}
          renderCell={(row, columnKey) => {
            if (columnKey === "status") {
              const tone = row.status === "offline" ? "warning" : "success";
              return <StatusBadge model={{ label: row.status, tone }} />;
            }
            return String((row as unknown as Record<string, unknown>)[columnKey] ?? "-");
          }}
        />
      </div>
    </section>
  );
}

function AccessDeviceRegistrationView({ data }: { data: ReadyData }) {
  const [error, setError] = useState<string | undefined>();
  const queryClient = useQueryClient();
  const createDeviceMutation = useMutation({
    mutationFn: (input: Parameters<typeof createAccessDevice>[1]) => createAccessDevice(data.gym.id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.operationsWorkspace })
  });

  const model = buildAccessDeviceRegistrationScreen({
    deviceType: AccessDeviceType.DoorController,
    locationId: data.locations[0]?.id
  });

  return (
    <FormLayout model={{ title: "Register access device", description: "Create a new kiosk, door controller, or scanner." }}>
      {error ? <div className="banner error">{error}</div> : null}
      <form
        className="compact-form"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setError(undefined);
          void (async () => {
            try {
              await createDeviceMutation.mutateAsync({
                name: String(form.get("name") ?? ""),
                locationId: String(form.get("locationId") ?? ""),
                deviceType: String(form.get("deviceType") ?? AccessDeviceType.DoorController) as AccessDeviceType
              });
            } catch (caught) {
              setError(describeError(caught));
            }
          })();
        }}
      >
        <label className="field">
          <span>Name</span>
          <input name="name" defaultValue={model.name} required disabled={createDeviceMutation.isPending} />
        </label>
        <SelectField
          model={{
            name: "locationId",
            label: "Location",
            required: true,
            options: data.locations.map((location) => ({
              value: location.id,
              label: location.name,
              selected: location.id === model.locationId
            }))
          }}
          disabled={createDeviceMutation.isPending}
        />
        <SelectField
          model={{
            name: "deviceType",
            label: "Device type",
            required: true,
            options: Object.values(AccessDeviceType).map((type) => ({
              value: type,
              label: type,
              selected: type === model.deviceType
            }))
          }}
          disabled={createDeviceMutation.isPending}
        />
        <button className="save-button" type="submit" disabled={createDeviceMutation.isPending || !model.canSubmit}>Register device</button>
      </form>
    </FormLayout>
  );
}

function PaymentHistoryView({ data }: { data: ReadyData }) {
  const history = buildStripePaymentHistoryScreen({
    transactions: data.posTransactions,
    permissions: data.permissions,
    featureFlags: []
  });
  const selected = data.members.find((member) => member.status !== "archived") ?? data.members[0];
  const stripeAccount = data.stripeAccount;
  const stripeReady = Boolean(stripeAccount.accountId && stripeAccount.onboardingComplete && stripeAccount.chargesEnabled);
  const stripeStatusLabel = stripeReady
    ? "Connected"
    : stripeAccount.accountId && !stripeAccount.onboardingComplete
      ? "Onboarding required"
      : stripeAccount.accountId
        ? "Needs verification"
        : "Not connected";
  const activePlans = data.plans.slice(0, 6);

  const tableModel = table({
    columns: [
      { key: "memberName", label: "Member" },
      { key: "amountLabel", label: "Amount" },
      { key: "paymentMethodLabel", label: "Method" },
      { key: "statusLabel", label: "Status" },
      { key: "createdAt", label: "Created" }
    ],
    rows: history.rows
  });

  return (
    <section className="club-panel club-page club-pos-page">
      <div className="card-head">
        <div>
          <p className="eyebrow">Point Of Sale</p>
          <h2>Sell memberships and services</h2>
        </div>
        <span className="club-kicker">{history.summaryLabel}</span>
      </div>
      <div className="club-pos-layout">
        <div className="club-pos-main section-stack">
          <div className="club-panel pos-focus-card">
            <div className="card-head">
              <div>
                <h3>Checkout</h3>
                <p className="club-copy">Record a sale and match the buyer to an existing consumer when possible.</p>
              </div>
              <span className="club-note-label">{stripeStatusLabel}</span>
            </div>
            <div className="stat-grid compact">
              <article className="mini-card">
                <span>Buyer</span>
                <strong>{selected ? `${selected.firstName} ${selected.lastName}`.trim() || "Selected consumer" : "New customer"}</strong>
                <p className="muted">{selected ? "Selected consumer details are prefilled below." : "Record a sale and add the buyer to the consumer directory."}</p>
              </article>
              <article className="mini-card">
                <span>Stripe</span>
                <strong>{stripeStatusLabel}</strong>
                <p className="muted">{stripeAccount.accountId ? `Connected account ${stripeAccount.accountId}` : "Create or connect a Stripe account for this gym."}</p>
              </article>
            </div>
            <div className="compact-form">
              <label className="field"><span>Buyer name</span><input disabled value={selected ? `${selected.firstName} ${selected.lastName}`.trim() : ""} readOnly /></label>
              <label className="field"><span>Email</span><input disabled value={selected?.email ?? ""} readOnly /></label>
              <label className="field"><span>Amount</span><input disabled placeholder="$0.00" /></label>
              <button type="button" className="save-button" disabled={!stripeReady}>Collect payment</button>
            </div>
          </div>

          <div className="club-panel">
            <div className="card-head">
              <div>
                <h3>Transactions</h3>
                <p className="club-copy">Recent card and POS activity for this gym.</p>
              </div>
              <span>{history.summaryLabel}</span>
            </div>
            {history.empty ? <EmptyState model={history.empty} /> : null}
            {history.rows.length > 0 ? <Table model={tableModel} getRowKey={(row) => row.id} /> : null}
          </div>
        </div>

        <div className="club-pos-side section-stack">
          <div className="club-panel pos-plan-panel">
            <div className="card-head">
              <div>
                <h3>Membership Products</h3>
                <p className="club-copy">Quick-pick plans for front desk sales.</p>
              </div>
            </div>
            <div className="club-product-grid pos-plan-grid">
              {activePlans.length === 0 ? (
                <div className="settings-placeholder"><strong>No public plans yet</strong><p>Create plans before selling memberships from POS.</p></div>
              ) : (
                activePlans.map((plan) => (
                  <article className="club-product" key={plan.id}>
                    <div className="club-product-art" />
                    <strong>{plan.name}</strong>
                    <span>{formatCurrency(plan.priceCents)}</span>
                  </article>
                ))
              )}
            </div>
          </div>

          <div className="club-panel pos-stripe-setup-card">
            <div className="card-head">
              <div>
                <h3>Stripe setup</h3>
                <p className="club-copy">Connected account status and onboarding readiness.</p>
              </div>
              <LinkButton href="/dashboard/payments/connect" label="Manage" />
            </div>
            <div className="settings-grid">
              <article className="mini-card"><span>Account</span><strong>{stripeAccount.accountId ?? "None"}</strong></article>
              <article className="mini-card"><span>Charges</span><strong>{stripeAccount.chargesEnabled ? "Enabled" : "Disabled"}</strong></article>
              <article className="mini-card"><span>Onboarding</span><strong>{stripeAccount.onboardingComplete ? "Complete" : "Needed"}</strong></article>
              <article className="mini-card"><span>Requirements</span><strong>{stripeAccount.requirementsDue.length}</strong></article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LinkButton({ href, label }: { href: string; label: string }) {
  return <a className="ghost-button" href={`#${href}`}>{label}</a>;
}

function PosCatalogView({ resources }: { resources: ResourceRecord[] }) {
  const rows = useMemo(
    () =>
      resources
        .filter((resource) => resource.status === "active")
        .map((resource) => ({
          id: resource.id,
          name: resource.name,
          resourceType: resource.resourceType,
          price: `$${(resource.pricing.amountCents / 100).toFixed(2)}`,
          isBookable: resource.isBookable ? "Yes" : "No"
        })),
    [resources]
  );

  return (
    <section className="club-panel">
      <div className="card-head">
        <h2>POS item catalog</h2>
        <span>{rows.length} items</span>
      </div>
      <div className="data-card">
        <Table
          model={{
            kind: "table",
            columns: [
              { key: "name", label: "Item" },
              { key: "resourceType", label: "Type" },
              { key: "price", label: "Price" },
              { key: "isBookable", label: "Bookable" }
            ],
            rows
          }}
          getRowKey={(row) => row.id}
        />
      </div>
    </section>
  );
}

function ComingSoon({ title, body }: { title: string; body: string }) {
  return (
    <section className="club-panel">
      <EmptyState model={{ kind: "empty", title, body }} />
    </section>
  );
}

function describeError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function formatCurrency(priceCents?: number | string) {
  const cents = typeof priceCents === "number" ? priceCents : Number(priceCents ?? 0);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((Number.isFinite(cents) ? cents : 0) / 100);
}
