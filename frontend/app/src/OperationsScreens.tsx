import { useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { Link, Navigate } from "react-router-dom";
import {
  buildDashboardShellLayout,
  buildFormsOperationsPage,
  buildLocationsOperationsPage,
  buildMarketingOperationsPage,
  buildPageHeader,
  buildPortalOperationsPage,
  buildReportsOperationsPage,
  buildSettingsOperationsPage,
  buildTrainingOperationsPage,
  type LocationOperationsPage,
  type OperationsCard,
  type OperationsFormOption,
  type OperationsHeaderModel,
  type OperationsMetricCard,
  type OperationsProductCard,
  type OperationsTableModel,
  type OperationsWorkspaceView
} from "@gym-platform/dashboard";
import {
  createLocation,
  createResource,
  loadOperationsWorkspace,
  loadSession,
  type DashboardWorkspaceData,
  type LocationCreateFormInput,
  type ResourceRecord,
  type StaffRecord,
  type StaffShiftRecord,
  type StaffTimeEntryRecord
} from "./dashboardData.js";
import { queryKeys } from "./queryKeys.js";
import { Shell } from "./Shell.js";

type OperationsData = DashboardWorkspaceData & {
  resources: ResourceRecord[];
  reservations: Array<{ id: string; resourceId: string; locationId?: string; memberId: string; status: string; startsAt: string; endsAt: string; amountCents: number }>;
  staff: StaffRecord[];
  roles: Array<{ id: string; name: string; permissions: string[]; isSystem?: boolean; createsReservableResource?: boolean }>;
  shifts: StaffShiftRecord[];
  timeEntries: StaffTimeEntryRecord[];
  stripeAccount?: { accountId?: string; chargesEnabled?: boolean; onboardingComplete?: boolean; requirementsDue?: string[]; businessName?: string };
};

type ResourceCreateInput = {
  locationId: string;
  name: string;
  resourceType: string;
  pricing: { amountCents: number };
  paymentRequirement: string;
};

export function LocationsRoute() {
  return <OperationsRoute path="/locations" title="Locations" render={(data) => <LocationsContent data={data} />} />;
}

export function TrainingRoute() {
  return <OperationsRoute path="/training" title="Training" render={(data) => <TrainingContent data={data} />} />;
}

export function PortalRoute() {
  return <OperationsRoute path="/portal" title="Portal" render={(data) => <PortalContent data={data} />} />;
}

export function FormsRoute() {
  return <OperationsRoute path="/contracts" title="Forms" render={(data) => <FormsContent data={data} />} />;
}

export function MarketingRoute() {
  return <OperationsRoute path="/marketing" title="Marketing" render={(data) => <MarketingContent data={data} />} />;
}

export function ReportsRoute() {
  return <OperationsRoute path="/reports" title="Reporting" render={(data) => <ReportsContent data={data} />} />;
}

export function SettingsRoute() {
  return <OperationsRoute path="/settings" title="Settings" render={(data) => <SettingsContent data={data} />} />;
}

function OperationsRoute({
  path,
  title,
  render
}: {
  path: string;
  title: string;
  render: (data: OperationsData) => ReactNode;
}) {
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
    return <div className="react-bootstrap-state">Loading {title.toLowerCase()}...</div>;
  }
  if (workspaceQuery.isError || !workspaceQuery.data) {
    return <div className="empty-state"><h3>{title} unavailable</h3><p>{describeError(workspaceQuery.error)}</p></div>;
  }

  const data = workspaceQuery.data as OperationsData;
  const shell = buildDashboardShellLayout({
    path,
    permissions: data.permissions,
    platformAdmin: data.platformAdmin,
    email: data.me.user.email,
    firstName: data.me.user.firstName,
    lastName: data.me.user.lastName,
    gymName: data.gym.name,
    gymSlug: data.gym.slug,
    gymLogoUrl: data.gym.logoUrl,
    pageHeader: buildPageHeader({
      title,
      eyebrow: "Dashboard",
      breadcrumbs: [
        { label: "Dashboard", href: "/" },
        { label: title, href: path }
      ]
    })
  });

  return <Shell model={shell}>{render(data)}</Shell>;
}

function LocationsContent({ data }: { data: OperationsData }) {
  const [locationError, setLocationError] = useState<string | undefined>();
  const [resourceError, setResourceError] = useState<string | undefined>();
  const queryClient = useQueryClient();
  const page = buildLocationsOperationsPage(toOperationsWorkspace(data));
  const createLocationMutation = useMutation({
    mutationFn: (input: LocationCreateFormInput) => createLocation(data.gym.id, input),
    onSuccess: () => invalidateLocationData(queryClient)
  });
  const createResourceMutation = useMutation({
    mutationFn: (input: ResourceCreateInput) => createResource(data.gym.id, input),
    onSuccess: () => invalidateLocationData(queryClient)
  });

  async function handleCreateLocation(input: LocationCreateFormInput) {
    try {
      setLocationError(undefined);
      await createLocationMutation.mutateAsync(input);
    } catch (caught) {
      setLocationError(describeError(caught));
      throw caught;
    }
  }

  async function handleCreateResource(input: ResourceCreateInput) {
    try {
      setResourceError(undefined);
      await createResourceMutation.mutateAsync(input);
    } catch (caught) {
      setResourceError(describeError(caught));
      throw caught;
    }
  }

  return (
    <section className="club-panel club-page">
      <HeaderBlock header={page.header} />
      <div className="club-page-split">
        <div className="section-stack">
          <LocationCreateCard
            canCreate={page.canCreateLocation}
            error={locationError}
            isCreating={createLocationMutation.isPending}
            model={page.locationForm}
            onCreate={handleCreateLocation}
          />
          <RosterPanel model={page.roster} />
          <Panel title="Facility reservations" kicker={`${data.reservations.length} bookings`}>
            <SimpleTable model={page.reservationsTable} />
          </Panel>
        </div>
        <div className="section-stack">
          <ResourceCreateCard
            canCreate={page.canCreateResource && page.resourceForm.locationOptions.length > 0}
            error={resourceError}
            isCreating={createResourceMutation.isPending}
            model={page.resourceForm}
            onCreate={handleCreateResource}
          />
          <Panel eyebrow="Selected location" title={page.selectedLocation.title} kicker={page.selectedLocation.resourceCountLabel} focus>
            <MetricGrid metrics={page.selectedLocation.metrics} />
          </Panel>
          <ProductsPanel model={page.resources} />
        </div>
      </div>
    </section>
  );
}

function LocationCreateCard({
  canCreate,
  error,
  isCreating,
  model,
  onCreate
}: {
  canCreate: boolean;
  error?: string;
  isCreating: boolean;
  model: LocationOperationsPage["locationForm"];
  onCreate: (input: LocationCreateFormInput) => Promise<void>;
}) {
  const disabled = !canCreate || isCreating;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      await onCreate({
        name: requiredText(formData, "name"),
        address: {
          line1: requiredText(formData, "line1"),
          line2: optionalText(formData, "line2"),
          city: requiredText(formData, "city"),
          region: requiredText(formData, "region"),
          postalCode: requiredText(formData, "postalCode"),
          country: requiredText(formData, "country").toUpperCase()
        },
        timezone: requiredText(formData, "timezone"),
        phone: optionalText(formData, "phone")
      });
      form.reset();
    } catch {
      // The parent route renders the error banner.
    }
  }

  return (
    <form id="create-location-form" className="form-card compact-form" onSubmit={handleSubmit}>
      <div className="card-head">
        <h3>Add location</h3>
        <span>Facility setup</span>
      </div>
      {error ? <div className="banner error">{error}</div> : null}
      <div className="form-grid">
        <label className="field"><span>Name</span><input name="name" required disabled={disabled} /></label>
        <label className="field"><span>Phone</span><input name="phone" type="tel" disabled={disabled} /></label>
        <label className="field"><span>Address line 1</span><input name="line1" required disabled={disabled} /></label>
        <label className="field"><span>Address line 2</span><input name="line2" disabled={disabled} /></label>
        <label className="field"><span>City</span><input name="city" required disabled={disabled} /></label>
        <label className="field"><span>Region</span><input name="region" required disabled={disabled} /></label>
        <label className="field"><span>Postal code</span><input name="postalCode" required disabled={disabled} /></label>
        <label className="field"><span>Country</span><input name="country" defaultValue={model.defaultCountry} maxLength={2} required disabled={disabled} /></label>
        <label className="field"><span>Timezone</span><input name="timezone" defaultValue={model.defaultTimezone} required disabled={disabled} /></label>
      </div>
      <button className="save-button" type="submit" disabled={disabled}>{isCreating ? "Creating..." : "Create location"}</button>
      {!canCreate ? <p className="club-copy">You need location create permission to add locations.</p> : null}
    </form>
  );
}

function ResourceCreateCard({
  canCreate,
  error,
  isCreating,
  model,
  onCreate
}: {
  canCreate: boolean;
  error?: string;
  isCreating: boolean;
  model: LocationOperationsPage["resourceForm"];
  onCreate: (input: ResourceCreateInput) => Promise<void>;
}) {
  const disabled = !canCreate || isCreating;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      await onCreate({
        locationId: requiredText(formData, "locationId"),
        name: requiredText(formData, "name"),
        resourceType: requiredText(formData, "resourceType"),
        pricing: { amountCents: Math.max(0, Math.round(Number(optionalText(formData, "price") ?? 0) * 100)) },
        paymentRequirement: requiredText(formData, "paymentRequirement")
      });
      form.reset();
    } catch {
      // The parent route renders the error banner.
    }
  }

  return (
    <form id="create-resource-form" className="form-card compact-form" onSubmit={handleSubmit}>
      <div className="card-head">
        <h3>Add resource</h3>
        <span>Reservable asset</span>
      </div>
      {error ? <div className="banner error">{error}</div> : null}
      <div className="form-grid">
        <SelectField name="locationId" label="Location" options={model.locationOptions} disabled={disabled} required />
        <label className="field"><span>Name</span><input name="name" required disabled={disabled} /></label>
        <SelectField name="resourceType" label="Type" options={model.typeOptions} defaultValue="room" disabled={disabled} />
        <label className="field"><span>Price</span><input name="price" type="number" min="0" step="0.01" defaultValue="0" disabled={disabled} /></label>
        <SelectField name="paymentRequirement" label="Payment" options={model.paymentOptions} defaultValue="free" disabled={disabled} />
      </div>
      <button className="save-button" type="submit" disabled={disabled}>{isCreating ? "Creating..." : "Create resource"}</button>
      {!canCreate ? <p className="club-copy">You need a location and location update permission to add resources.</p> : null}
    </form>
  );
}

function TrainingContent({ data }: { data: OperationsData }) {
  const page = buildTrainingOperationsPage(toOperationsWorkspace(data));

  return (
    <section className="club-panel club-page">
      <HeaderBlock header={page.header} />
      <div className="club-page-split">
        <div className="section-stack">
          <Panel title={page.trainers.title} kicker={page.trainers.kicker}>
            <CardGrid cards={page.trainers.cards} emptyTitle={page.trainers.emptyTitle} emptyBody={page.trainers.emptyBody} />
          </Panel>
          <Panel title="Upcoming sessions">
            <SimpleTable model={page.sessionsTable} />
          </Panel>
        </div>
        <div className="section-stack">
          <ProductsPanel model={page.products} />
          <Panel title="Trainer availability">
            <MetricGrid metrics={page.availabilityMetrics} />
          </Panel>
        </div>
      </div>
    </section>
  );
}

function PortalContent({ data }: { data: OperationsData }) {
  const page = buildPortalOperationsPage(toOperationsWorkspace(data));

  return (
    <section className="club-panel club-page">
      <HeaderBlock header={page.header} />
      <div className="club-page-split">
        <div className="section-stack">
          <Panel title={page.publicPages.title} action={page.publicPages.action}>
            <MetricGrid metrics={page.publicPages.metrics} />
          </Panel>
          <Panel title={page.portal.title} kicker={page.portal.routeCountLabel}>
            <div className="card-grid">
              {page.portal.routes.map((item) => (
                <article className={`mini-card${item.active ? " active" : ""}`} key={item.href}>
                  <span>{item.href}</span>
                  <strong>{item.label}</strong>
                  <p className="muted">{item.body}</p>
                </article>
              ))}
            </div>
          </Panel>
        </div>
        <div className="section-stack">
          <ProductsPanel model={page.plans} />
          <Panel title={page.health.title}>
            <div className="club-note"><p>{page.health.body}</p></div>
          </Panel>
        </div>
      </div>
    </section>
  );
}

function FormsContent({ data }: { data: OperationsData }) {
  const page = buildFormsOperationsPage(toOperationsWorkspace(data));

  return (
    <section className="club-panel club-page">
      <HeaderBlock header={page.header} />
      <MetricGrid className="stat-grid compact" metrics={page.summaryCards} />
      <SimpleTable model={page.table} />
    </section>
  );
}

function MarketingContent({ data }: { data: OperationsData }) {
  const page = buildMarketingOperationsPage(toOperationsWorkspace(data));

  return (
    <section className="club-panel club-page">
      <HeaderBlock header={page.header} />
      <MetricGrid className="stat-grid compact" metrics={page.metrics} />
      <div className="card-grid">
        {page.featureCards.map((card) => (
          <article className="mini-card" key={card.title}>
            <span>Website section</span>
            <strong>{card.title}</strong>
            <p className="muted">{card.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ReportsContent({ data }: { data: OperationsData }) {
  const page = buildReportsOperationsPage(toOperationsWorkspace(data));

  return (
    <section className="club-panel club-page">
      <HeaderBlock header={page.header} />
      <div className="club-page-split">
        <div className="section-stack">
          <Panel title="Operational snapshot"><MetricGrid metrics={page.snapshotMetrics} /></Panel>
          <Panel title="Payroll report" action={{ label: "Export CSV", href: "#" }}>
            <SimpleTable model={page.payrollTable} />
          </Panel>
        </div>
        <div className="section-stack">
          <Panel title="Revenue indicators"><MetricGrid metrics={page.revenueMetrics} /></Panel>
          <Panel title="Time clock"><MetricGrid metrics={page.timeClockMetrics} /></Panel>
        </div>
      </div>
    </section>
  );
}

function SettingsContent({ data }: { data: OperationsData }) {
  const page = buildSettingsOperationsPage(toOperationsWorkspace(data));

  return (
    <section className="club-panel club-page settings-page">
      <HeaderBlock header={page.header} />
      <div className="settings-shell">
        <aside className="settings-sidebar">
          {page.tabs.map((tab) => (
            <button key={tab.label} type="button" className={`settings-tab${tab.active ? " active" : ""}`}>
              {tab.label}
            </button>
          ))}
        </aside>
        <div className="settings-content">
          <div className="settings-grid settings-grid-wide">
            <div className="club-panel">
              <h3>Company Information</h3>
              <p className="club-copy">Review the gym identity that appears across the dashboard and check-in flow.</p>
              <MetricGrid metrics={page.companyMetrics} />
            </div>
            <div className="club-panel">
              <h3>Roles and Staff</h3>
              <p className="club-copy">Manage access, front desk staff, and operational roles.</p>
              <div className="settings-grid">
                {page.roleCards.map((role) => (
                  <article className={`settings-role-card${role.active ? " active" : ""}`} key={role.id}>
                    <strong>{role.title}</strong>
                    <span>{role.subtitle}</span>
                  </article>
                ))}
              </div>
            </div>
            <div className="club-panel">
              <h3>Role details</h3>
              {page.selectedRole ? (
                <>
                  <div className="role-detail-head">
                    <div>
                      <strong>{page.selectedRole.name}</strong>
                      <p>{page.selectedRole.kindLabel}</p>
                    </div>
                    <span className="club-note-label">{page.selectedRole.permissionLabel}</span>
                  </div>
                  <div className="settings-placeholder">
                    <strong>Reservable resource</strong>
                    <p>{page.selectedRole.resourceBody}</p>
                  </div>
                </>
              ) : (
                <p className="muted">Select a role to inspect its permissions.</p>
              )}
            </div>
            <div className="club-panel">
              <h3>Staff assignments</h3>
              <div className="staff-role-list">
                {page.staffRows.map((staff) => (
                  <article className="staff-role-row" key={staff.id}>
                    <div>
                      <strong>{staff.name}</strong>
                      <p>{staff.detail}</p>
                    </div>
                    <span className="staff-status-chip">{staff.status}</span>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeaderBlock({ header }: { header: OperationsHeaderModel }) {
  return (
    <div className="card-head">
      <div>
        <p className="eyebrow">{header.eyebrow}</p>
        <h2>{header.title}</h2>
      </div>
      {header.actions?.length ? (
        <div className="club-mini-nav">
          {header.actions.map((action) => <ActionLink action={action} key={action.href} />)}
          {header.kicker ? <span className="club-kicker">{header.kicker}</span> : null}
        </div>
      ) : header.kicker ? (
        <span className="club-kicker">{header.kicker}</span>
      ) : null}
    </div>
  );
}

function Panel({
  action,
  children,
  eyebrow,
  focus,
  kicker,
  title
}: {
  action?: { label: string; href: string };
  children: ReactNode;
  eyebrow?: string;
  focus?: boolean;
  kicker?: string;
  title: string;
}) {
  return (
    <div className={`club-panel${focus ? " club-focus-panel" : ""}`}>
      <div className="card-head">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h3>{title}</h3>
        </div>
        {action ? <ActionLink action={action} /> : kicker ? <span className="club-note-label">{kicker}</span> : null}
      </div>
      {children}
    </div>
  );
}

function RosterPanel({ model }: { model: LocationOperationsPage["roster"] }) {
  return (
    <Panel title={model.title} action={model.action}>
      <CardGrid cards={model.locations} compact emptyTitle={model.emptyTitle} emptyBody={model.emptyBody} />
    </Panel>
  );
}

function CardGrid({
  cards,
  compact,
  emptyBody,
  emptyTitle
}: {
  cards: OperationsCard[];
  compact?: boolean;
  emptyBody: string;
  emptyTitle: string;
}) {
  if (cards.length === 0) {
    return <Placeholder title={emptyTitle} body={emptyBody} />;
  }
  return (
    <div className={`club-customer-grid${compact ? "" : " consumer-card-grid"}`}>
      {cards.map((card) => (
        <article className={`club-customer-card${compact ? " compact" : ""}`} key={card.id}>
          {card.initials ? <div className="club-customer-avatar">{card.initials}</div> : null}
          <strong>{card.title}</strong>
          {card.subtitle ? <span className="consumer-card-segments">{card.subtitle}</span> : null}
        </article>
      ))}
    </div>
  );
}

function ProductsPanel({ model }: { model: { title: string; cards?: OperationsProductCard[]; products?: OperationsProductCard[]; emptyTitle: string; emptyBody: string } }) {
  const cards = model.cards ?? model.products ?? [];
  return (
    <Panel title={model.title}>
      <div className="club-product-grid">
        {cards.length === 0 ? (
          <Placeholder title={model.emptyTitle} body={model.emptyBody} />
        ) : (
          cards.map((product) => (
            <article className="club-product" key={product.id}>
              <div className="club-product-art" />
              <strong>{product.name}</strong>
              <span>{product.priceLabel}</span>
            </article>
          ))
        )}
      </div>
    </Panel>
  );
}

function MetricGrid({ className = "settings-grid", metrics }: { className?: string; metrics: OperationsMetricCard[] }) {
  return (
    <div className={className}>
      {metrics.map((metric) => (
        <article className="mini-card" key={metric.label}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
        </article>
      ))}
    </div>
  );
}

function SimpleTable({ model }: { model: OperationsTableModel }) {
  if (model.rows.length === 0) {
    return <Placeholder title={model.emptyTitle} body={model.emptyBody} />;
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{model.columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {model.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Placeholder({ body, title }: { body: string; title: string }) {
  return <div className="settings-placeholder"><strong>{title}</strong><p>{body}</p></div>;
}

function SelectField({
  defaultValue,
  disabled,
  label,
  name,
  options,
  required
}: {
  defaultValue?: string;
  disabled?: boolean;
  label: string;
  name: string;
  options: OperationsFormOption[];
  required?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select name={name} defaultValue={defaultValue} disabled={disabled} required={required}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function ActionLink({ action }: { action: { label: string; href: string } }) {
  if (action.href === "#") {
    return <button type="button" className="ghost-button">{action.label}</button>;
  }
  if (action.href.startsWith("#")) {
    return <a className="ghost-button" href={action.href}>{action.label}</a>;
  }
  return <Link className="ghost-button" to={action.href}>{action.label}</Link>;
}

function toOperationsWorkspace(data: OperationsData) {
  return data as unknown as OperationsWorkspaceView;
}

async function invalidateLocationData(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.operationsWorkspace }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboardWorkspace })
  ]);
}

function requiredText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalText(formData: FormData, key: string) {
  const value = requiredText(formData, key);
  return value.length > 0 ? value : undefined;
}

function describeError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
