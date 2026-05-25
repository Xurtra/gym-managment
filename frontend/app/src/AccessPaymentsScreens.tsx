import { useEffect, useMemo, useState } from "react";
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

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: ReadyData }
  | { status: "failed"; message: string };

export function AccessControlDomainRoute({ mode }: { mode: AccessMode }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const reload = async () => {
    setState({ status: "loading" });
    try {
      const loaded = await loadOperationsWorkspace();
      setState({ status: "ready", data: loaded as ReadyData });
    } catch (error) {
      setState({ status: "failed", message: describeError(error) });
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  if (!loadSession()) {
    return <Navigate to="/dashboard/login" replace />;
  }
  if (state.status === "loading") {
    return <div className="react-bootstrap-state">Loading access control...</div>;
  }
  if (state.status === "failed") {
    return <div className="empty-state"><h3>Access control unavailable</h3><p>{state.message}</p></div>;
  }

  const shell = buildDashboardShellLayout({
    path: "/access-control",
    permissions: state.data.permissions,
    platformAdmin: state.data.platformAdmin,
    email: state.data.me.user.email,
    firstName: state.data.me.user.firstName,
    lastName: state.data.me.user.lastName,
    gymName: state.data.gym.name,
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
        <AccessDeviceRegistrationView data={state.data} onSaved={reload} />
      ) : mode === "rules" ? (
        <ComingSoon title="Access rule editor" body="Rule authoring is wired to React but remains a placeholder for the dedicated integration pass." />
      ) : (
        <AccessDeviceListView data={state.data} />
      )}
    </Shell>
  );
}

export function PaymentsDomainRoute({ mode }: { mode: PaymentsMode }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    setState({ status: "loading" });
    loadOperationsWorkspace()
      .then((loaded) => setState({ status: "ready", data: loaded as ReadyData }))
      .catch((error) => setState({ status: "failed", message: describeError(error) }));
  }, []);

  if (!loadSession()) {
    return <Navigate to="/dashboard/login" replace />;
  }
  if (state.status === "loading") {
    return <div className="react-bootstrap-state">Loading payments...</div>;
  }
  if (state.status === "failed") {
    return <div className="empty-state"><h3>Payments unavailable</h3><p>{state.message}</p></div>;
  }

  const shell = buildDashboardShellLayout({
    path: "/reports",
    permissions: state.data.permissions,
    platformAdmin: state.data.platformAdmin,
    email: state.data.me.user.email,
    firstName: state.data.me.user.firstName,
    lastName: state.data.me.user.lastName,
    gymName: state.data.gym.name,
    pageHeader: buildPageHeader({
      title: mode === "catalog" ? "POS Catalog" : mode === "terminal" ? "Stripe Terminal" : mode === "connect" ? "Stripe Connect" : "Payment History",
      eyebrow: "Payments",
      breadcrumbs: [
        { label: "Dashboard", href: "/" },
        { label: "Payments", href: "/reports" }
      ]
    })
  });

  return (
    <Shell model={shell}>
      {mode === "catalog" ? (
        <PosCatalogView resources={state.data.resources} />
      ) : mode === "terminal" ? (
        <ComingSoon title="Stripe Terminal reader flow" body="Reader connection and payment capture UI will land in the Stripe integration pass." />
      ) : mode === "connect" ? (
        <ComingSoon title="Stripe Connect onboarding" body="Hosted onboarding components are stubbed while embedded Stripe setup is implemented." />
      ) : (
        <PaymentHistoryView data={state.data} />
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

function AccessDeviceRegistrationView({ data, onSaved }: { data: ReadyData; onSaved: () => Promise<void> }) {
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

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
          setPending(true);
          setError(undefined);
          void (async () => {
            try {
              await createAccessDevice(data.gym.id, {
                name: String(form.get("name") ?? ""),
                locationId: String(form.get("locationId") ?? ""),
                deviceType: String(form.get("deviceType") ?? AccessDeviceType.DoorController) as AccessDeviceType
              });
              await onSaved();
            } catch (caught) {
              setError(describeError(caught));
            } finally {
              setPending(false);
            }
          })();
        }}
      >
        <label className="field">
          <span>Name</span>
          <input name="name" defaultValue={model.name} required disabled={pending} />
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
          disabled={pending}
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
          disabled={pending}
        />
        <button className="save-button" type="submit" disabled={pending || !model.canSubmit}>Register device</button>
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
    <section className="club-panel">
      <div className="card-head">
        <h2>Transactions</h2>
        <span>{history.summaryLabel}</span>
      </div>
      {history.empty ? <EmptyState model={history.empty} /> : null}
      {history.rows.length > 0 ? <Table model={tableModel} getRowKey={(row) => row.id} /> : null}
    </section>
  );
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
