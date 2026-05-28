import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckInMethod, CheckInStatus } from "@gym-platform/constants";
import { input } from "@gym-platform/ui";
import {
  buildBarcodeInputScreen,
  buildCheckInHistoryScreen,
  buildCheckInKioskScreen,
  buildFrontDeskCheckInScreen,
  buildMemberSearchScreen,
  buildQrScannerScreen,
  createManualCheckInSubmission,
  warningForMember,
  type CheckInRecord as CheckInModelRecord
} from "@gym-platform/dashboard";
import { EmptyState, InputField, LogList, SelectField, StatusBadge, Table } from "@gym-platform/ui-react";
import {
  createManualCheckIn,
  loadOperationsWorkspace,
  type CheckInRecord,
  type DashboardWorkspaceData
} from "./dashboardData.js";
import { buildDashboardShellLayout, buildPageHeader } from "@gym-platform/dashboard";
import { queryKeys } from "./queryKeys.js";
import { Shell } from "./Shell.js";

type Mode = "desk" | "kiosk" | "history";

type ReadyData = DashboardWorkspaceData & {
  checkIns: CheckInRecord[];
  locations: Array<{ id: string; name: string }>;
};

export function CheckInsDomainRoute({ mode }: { mode: Mode }) {
  const [query, setQuery] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>();
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>();
  const [selectedClassSessionId, setSelectedClassSessionId] = useState<string | undefined>();
  const [lastResult, setLastResult] = useState<CheckInModelRecord | undefined>();
  const [kioskMode, setKioskMode] = useState<"qr" | "barcode">("barcode");
  const queryClient = useQueryClient();
  const workspaceQuery = useQuery({
    queryKey: queryKeys.operationsWorkspace,
    queryFn: () => loadOperationsWorkspace()
  });
  const checkInMutation = useMutation({
    mutationFn: (submission: Parameters<typeof createManualCheckIn>[1]) =>
      createManualCheckIn((workspaceQuery.data as ReadyData).gym.id, submission),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.operationsWorkspace })
  });

  useEffect(() => {
    if (!selectedLocationId && workspaceQuery.data?.locations[0]) {
      setSelectedLocationId(workspaceQuery.data.locations[0].id);
    }
  }, [selectedLocationId, workspaceQuery.data]);

  if (workspaceQuery.isLoading) {
    return <div className="react-bootstrap-state">Loading check-ins...</div>;
  }
  if (workspaceQuery.isError || !workspaceQuery.data) {
    return (
      <div className="empty-state" role="alert">
        <h3>Unable to load check-ins</h3>
        <p>{describeError(workspaceQuery.error)}</p>
      </div>
    );
  }
  const data = workspaceQuery.data as ReadyData;

  const members = data.members.map((member) => ({
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    status: member.status,
    email: member.email,
    phone: member.phone,
    barcode: member.barcode
  }));
  const memberSearch = buildMemberSearchScreen(members, query, selectedMemberId);
  const checkInScreen = buildFrontDeskCheckInScreen({
    members: memberSearch.results,
    locations: toLocationOptions(data.locations),
    classes: data.classSessions
      .filter((session) => !selectedLocationId || session.locationId === selectedLocationId)
      .map((session) => ({ id: session.id, name: session.id, startsAt: session.startsAt })),
    selectedLocationId,
    selectedClassSessionId
  });
  const history = buildCheckInHistoryScreen(data.checkIns as CheckInModelRecord[]);
  const kiosk = buildCheckInKioskScreen({
    mode: kioskMode,
    barcodeValue: query,
    qrPayload: query,
    result: lastResult
  });

  const shell = buildDashboardShellLayout({
    path: "/check-ins",
    permissions: data.permissions,
    platformAdmin: data.platformAdmin,
    email: data.me.user.email,
    firstName: data.me.user.firstName,
    lastName: data.me.user.lastName,
    gymName: data.gym.name,
    gymSlug: data.gym.slug,
    gymLogoUrl: data.gym.logoUrl,
    pageHeader: buildPageHeader({
      title: mode === "history" ? "Check-In History" : mode === "kiosk" ? "Kiosk Check-In" : "Club Check In",
      eyebrow: "Operations",
      breadcrumbs: [
        { label: "Dashboard", href: "/" },
        { label: "Check-Ins", href: "/check-ins" }
      ]
    })
  });

  return (
    <Shell model={shell}>
      {mode === "history" ? (
        <CheckInHistoryScreenView history={history} />
      ) : mode === "kiosk" ? (
        <CheckInKioskScreenView
          kiosk={kiosk}
          query={query}
          onQueryChange={setQuery}
          mode={kioskMode}
          onModeChange={setKioskMode}
        />
      ) : (
        <FrontDeskCheckInScreenView
          search={memberSearch}
          screen={checkInScreen}
          locations={data.locations}
          selectedLocationId={selectedLocationId}
          selectedClassSessionId={selectedClassSessionId}
          onSelectLocation={setSelectedLocationId}
          onSelectClass={setSelectedClassSessionId}
          onSelectMember={setSelectedMemberId}
          onSearchChange={setQuery}
          onSubmit={async () => {
            const memberId = selectedMemberId ?? memberSearch.selectedMember?.id;
            if (!memberId || !selectedLocationId) {
              return;
            }
            const submission = createManualCheckInSubmission({
              memberId,
              locationId: selectedLocationId,
              classSessionId: selectedClassSessionId
            });
            const response = (await checkInMutation.mutateAsync(submission)) as CheckInRecord;
            setLastResult(response as unknown as CheckInModelRecord);
          }}
        />
      )}
    </Shell>
  );
}

function FrontDeskCheckInScreenView({
  search,
  screen,
  locations,
  selectedLocationId,
  selectedClassSessionId,
  onSelectLocation,
  onSelectClass,
  onSelectMember,
  onSearchChange,
  onSubmit
}: {
  search: ReturnType<typeof buildMemberSearchScreen>;
  screen: ReturnType<typeof buildFrontDeskCheckInScreen>;
  locations: Array<{ id: string; name: string }>;
  selectedLocationId?: string;
  selectedClassSessionId?: string;
  onSelectLocation: (value: string | undefined) => void;
  onSelectClass: (value: string | undefined) => void;
  onSelectMember: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSubmit: () => Promise<void>;
}) {
  const searchField = buildBarcodeInputScreen(search.query);

  return (
    <section className="club-panel">
      <div className="club-page-split">
        <form
          className="form-card compact-form"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
        >
          <div className="card-head">
            <h3>Check-in lookup</h3>
            <span>{screen.members.length} results</span>
          </div>
          <InputField
            model={input({
              name: "memberQuery",
              label: "Search members",
              value: search.query,
              type: "text",
              required: false
            })}
            onChange={(event) => onSearchChange(event.currentTarget.value)}
          />
          <SelectField
            model={{
              name: "locationId",
              label: "Location",
              required: true,
              options: locations.map((location) => ({
                value: location.id,
                label: location.name,
                selected: location.id === selectedLocationId
              }))
            }}
            onChange={(event) => onSelectLocation(event.currentTarget.value || undefined)}
          />
          <SelectField
            model={{
              name: "classSessionId",
              label: "Class session",
              options: [{ value: "", label: "No class", selected: !selectedClassSessionId }, ...screen.classes.map((item) => ({
                value: item.id,
                label: `${item.name} (${item.startsAt.slice(0, 16)})`,
                selected: item.id === selectedClassSessionId
              }))]
            }}
            onChange={(event) => onSelectClass(event.currentTarget.value || undefined)}
          />
          <button className="save-button" type="submit" disabled={!screen.canSubmit}>
            Manual check-in
          </button>
        </form>

        <div className="data-card">
          <Table
            model={{
              kind: "table",
              columns: [
                { key: "firstName", label: "Member" },
                { key: "status", label: "Status" },
                { key: "barcode", label: "Barcode" }
              ],
              rows: search.results
            }}
            getRowKey={(row) => row.id}
            renderCell={(row, columnKey) => {
              if (columnKey === "firstName") {
                return (
                  <button className="ghost-button" type="button" onClick={() => onSelectMember(row.id)}>
                    {`${row.firstName} ${row.lastName}`.trim()}
                  </button>
                );
              }
              if (columnKey === "status") {
                const warning = warningForMember(row);
                return <StatusBadge model={{ label: warning ?? row.status, tone: warning ? "warning" : "neutral" }} />;
              }
              return String((row as unknown as Record<string, unknown>)[columnKey] ?? "-");
            }}
          />
        </div>
      </div>
      {search.emptyState ? (
        <EmptyState model={{ kind: "empty", title: "No members found", body: "Try a different barcode, email, or phone." }} />
      ) : null}
    </section>
  );
}

function CheckInHistoryScreenView({
  history
}: {
  history: ReturnType<typeof buildCheckInHistoryScreen>;
}) {
  return (
    <section className="club-panel">
      <div className="card-head">
        <h3>Check-in events</h3>
        <span>{history.total}</span>
      </div>
      <LogList
        model={{
          entries: history.records.map((record) => ({
            key: record.id,
            title: `${record.memberName ?? record.memberId} · ${record.locationName ?? record.locationId}`,
            subtitle: `${record.method} · ${record.status}`,
            timestamp: record.checkedInAt,
            detail: record.deniedReason
          })),
          emptyMessage: "No check-ins yet."
        }}
      />
    </section>
  );
}

function CheckInKioskScreenView({
  kiosk,
  query,
  mode,
  onQueryChange,
  onModeChange
}: {
  kiosk: ReturnType<typeof buildCheckInKioskScreen>;
  query: string;
  mode: "qr" | "barcode";
  onQueryChange: (value: string) => void;
  onModeChange: (value: "qr" | "barcode") => void;
}) {
  const scanner = mode === "qr" ? buildQrScannerScreen(query) : buildBarcodeInputScreen(query);

  return (
    <section className="club-panel">
      <div className="club-page-split">
        <div className="form-card compact-form">
          <div className="card-head">
            <h3>Kiosk scanner</h3>
            <span>{kiosk.autoResetSeconds}s reset</span>
          </div>
          <SelectField
            model={{
              name: "kioskMode",
              label: "Scanner mode",
              options: [
                { value: "barcode", label: "Barcode", selected: mode === "barcode" },
                { value: "qr", label: "QR", selected: mode === "qr" }
              ]
            }}
            onChange={(event) => onModeChange(event.currentTarget.value === "qr" ? "qr" : "barcode")}
          />
          <InputField
            model={input({
              name: mode === "barcode" ? "barcode" : "qrPayload",
              label: mode === "barcode" ? "Barcode" : "QR payload",
              value: query,
              type: "text",
              required: false
            })}
            onChange={(event) => onQueryChange(event.currentTarget.value)}
          />
        </div>
        <div className="data-card">
          <div className="card-head">
            <h3>Last kiosk result</h3>
          </div>
          {kiosk.result ? (
            <div className="empty-state">
              <p>{kiosk.result.title}</p>
              <p>{kiosk.result.memberId}</p>
              <StatusBadge
                model={{
                  label: kiosk.result.status,
                  tone: kiosk.result.status === CheckInStatus.Allowed ? "success" : "danger"
                }}
              />
            </div>
          ) : (
            <EmptyState model={{ kind: "empty", title: "No scan yet", body: "Run a scan to see result state." }} />
          )}
        </div>
      </div>
    </section>
  );
}

function toLocationOptions(locations: Array<{ id: string; name: string }>) {
  return locations.map((location) => ({ id: location.id, name: location.name }));
}

function describeError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
