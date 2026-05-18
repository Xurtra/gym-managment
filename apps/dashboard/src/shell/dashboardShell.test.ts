import { Permission } from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import {
  buildAccountMenu,
  buildDashboardShellLayout,
  buildDashboardHomePage,
  buildDashboardConfirmationModal,
  buildDashboardCsvUpload,
  buildDashboardDataTable,
  buildDashboardDateRangePicker,
  buildDashboardDetailDrawer,
  buildDashboardFilterDrawer,
  buildDashboardImageUpload,
  buildDashboardToastNotificationCenter,
  buildGlobalGymSearch,
  buildGroupedDashboardNavigation,
  buildMobileDashboardNavigation,
  buildPageHeader
} from "./index.js";

describe("dashboard shell", () => {
  it("builds grouped navigation from route permissions", () => {
    const groups = buildGroupedDashboardNavigation("/members", {
      permissions: [
        Permission.GymRead,
        Permission.LocationRead,
        Permission.MemberRead,
        Permission.MemberWrite,
        Permission.ClassRead,
        Permission.AccessRead
      ]
    });

    expect(groups.map((group) => group.key)).toEqual([
      "workspace",
      "people",
      "classes",
      "operations"
    ]);
    expect(groups.find((group) => group.key === "people")?.items.map((item) => item.href)).toEqual([
      "/members",
      "/check-ins"
    ]);
    expect(
      groups.find((group) => group.key === "operations")?.items.map((item) => item.href)
    ).toEqual(["/access-control"]);
  });

  it("builds shell layout with sidebar, top bar, content region, and account menu", () => {
    const shell = buildDashboardShellLayout({
      path: "/members",
      permissions: [Permission.GymRead, Permission.MemberRead],
      firstName: "Demo",
      lastName: "Owner",
      email: "owner@example.com",
      gymName: "Demo Strength Club",
      searchQuery: "jam",
      searchItems: [
        {
          id: "member-1",
          type: "member",
          title: "Jamie Rivera",
          subtitle: "Member",
          href: "/members/member-1",
          keywords: ["founding-member"],
          requiredPermissions: [Permission.MemberRead]
        }
      ],
      sidebarCollapsed: true,
      contentLoading: true
    });

    expect(shell.screen).toBe("dashboard_shell");
    expect(shell.sidebar.collapsed).toBe(true);
    expect(shell.sidebar.groups.flatMap((group) => group.items).map((item) => item.href)).toEqual([
      "/",
      "/members"
    ]);
    expect(shell.topBar.title).toBe("Members");
    expect(shell.topBar.globalSearch.results[0]?.title).toBe("Jamie Rivera");
    expect(shell.topBar.accountMenu.userName).toBe("Demo Owner");
    expect(shell.topBar.accountMenu.items.find((item) => item.key === "settings")?.disabled).toBe(
      true
    );
    expect(shell.content.id).toBe("members");
    expect(shell.content.title).toBe("Members");
    expect(shell.content.loading).toBe(true);
    expect(shell.content.pageHeader.title).toBe("Members");
    expect(shell.content.pageHeader.breadcrumbs.map((breadcrumb) => breadcrumb.label)).toEqual([
      "Dashboard",
      "Members"
    ]);
    expect(shell.mobileNavigation.itemCount).toBe(2);
    expect(shell.mobileMenuAction.icon).toBe("menu");
  });

  it("builds reusable page header state with actions, breadcrumbs, and tabs", () => {
    const header = buildPageHeader({
      title: "Members",
      eyebrow: "People",
      description: " Manage active members ",
      breadcrumbs: [
        { label: "Dashboard", href: "/" },
        { label: "Members", href: "/members" }
      ],
      primaryAction: {
        key: "create",
        label: "Add member",
        href: "/members/new",
        icon: "plus"
      },
      secondaryActions: [
        {
          key: "export",
          label: "Export",
          icon: "download"
        }
      ],
      tabs: [
        { key: "active", label: "Active", href: "/members?status=active" },
        { key: "archived", label: "Archived", href: "/members?status=archived", disabled: true }
      ],
      activeTabKey: "active"
    });

    expect(header.kind).toBe("page_header");
    expect(header.description).toBe("Manage active members");
    expect(header.breadcrumbs[1]?.current).toBe(true);
    expect(header.primaryAction?.button.icon).toBe("plus");
    expect(header.secondaryActions[0]?.button.intent).toBe("secondary");
    expect(
      header.tabs.map((tab) => ({ key: tab.key, active: tab.active, disabled: tab.disabled }))
    ).toEqual([
      { key: "active", active: true, disabled: false },
      { key: "archived", active: false, disabled: true }
    ]);
  });

  it("builds dashboard homepage summary cards from permitted metrics", () => {
    const home = buildDashboardHomePage({
      metrics: {
        activeMembers: 128,
        checkInsToday: 42,
        classesToday: 7,
        pendingTasks: 3
      },
      deltas: {
        activeMembers: 8,
        checkInsToday: -4
      },
      permissions: [Permission.MemberRead, Permission.MemberWrite, Permission.ClassRead]
    });
    const shell = buildDashboardShellLayout({
      path: "/",
      permissions: [Permission.GymRead, Permission.MemberRead, Permission.ClassRead],
      email: "owner@example.com",
      homeMetrics: {
        activeMembers: 128,
        classesToday: 7,
        pendingTasks: 3
      }
    });

    expect(home.cards.map((summaryCard) => summaryCard.key)).toEqual([
      "activeMembers",
      "checkInsToday",
      "classesToday"
    ]);
    expect(home.cards[0]?.value).toBe("128");
    expect(home.cards[0]?.trend).toBe("up");
    expect(home.cards[1]?.trend).toBe("down");
    expect(home.cards.some((summaryCard) => summaryCard.key === "pendingTasks")).toBe(false);
    expect(home.primaryActions.find((action) => action.label === "Add member")?.disabled).toBe(
      false
    );
    expect(home.primaryActions.find((action) => action.label === "Create class")?.disabled).toBe(
      true
    );
    expect(shell.content.homePage?.cards.map((summaryCard) => summaryCard.key)).toEqual([
      "activeMembers",
      "checkInsToday",
      "classesToday"
    ]);
  });

  it("builds account menu settings and logout actions", () => {
    const menu = buildAccountMenu({
      email: "manager@example.com",
      gymName: "Demo Strength Club",
      permissions: [Permission.GymUpdate]
    });

    expect(menu.userName).toBe("manager@example.com");
    expect(menu.gymName).toBe("Demo Strength Club");
    expect(menu.items.map((item) => item.key)).toEqual(["profile", "settings", "logout"]);
    expect(menu.items.find((item) => item.key === "settings")?.disabled).toBe(false);
    expect(menu.items.find((item) => item.key === "logout")?.action).toBe("logout");
  });

  it("searches routes and gym entities with permission filtering", () => {
    const search = buildGlobalGymSearch({
      query: "front",
      permissions: [Permission.GymRead, Permission.MemberRead, Permission.StaffRead],
      selectedResultId: "staff-1",
      items: [
        {
          id: "staff-1",
          type: "staff",
          title: "Front Desk Team",
          subtitle: "Staff",
          href: "/staff/front-desk",
          keywords: ["frontdesk"],
          requiredPermissions: [Permission.StaffRead]
        },
        {
          id: "plan-1",
          type: "plan",
          title: "Front Office Discount",
          subtitle: "Plan",
          href: "/membership-plans/plan-1",
          requiredPermissions: [Permission.PlanRead]
        }
      ]
    });

    expect(search.open).toBe(true);
    expect(search.queryField.value).toBe("front");
    expect(search.results.map((result) => result.id)).toEqual(["staff-1"]);
    expect(search.selectedResult?.id).toBe("staff-1");
    expect(search.empty).toBe(false);
  });

  it("returns empty state for unmatched global search", () => {
    const search = buildGlobalGymSearch({
      query: "zzzz",
      permissions: [Permission.GymRead],
      items: []
    });

    expect(search.results).toHaveLength(0);
    expect(search.empty).toBe(true);
  });

  it("builds responsive mobile dashboard navigation", () => {
    const mobileNavigation = buildMobileDashboardNavigation({
      path: "/check-ins",
      open: true,
      context: {
        permissions: [
          Permission.GymRead,
          Permission.LocationRead,
          Permission.MemberRead,
          Permission.MemberWrite
        ]
      }
    });

    expect(mobileNavigation.open).toBe(true);
    expect(mobileNavigation.activePath).toBe("/check-ins");
    expect(mobileNavigation.toggleAction.icon).toBe("menu");
    expect(mobileNavigation.closeAction.icon).toBe("x");
    expect(mobileNavigation.groups.map((group) => group.key)).toEqual(["workspace", "people"]);
    expect(
      mobileNavigation.groups
        .find((group) => group.key === "people")
        ?.items.map((item) => item.href)
    ).toEqual(["/members", "/check-ins"]);
    expect(mobileNavigation.itemCount).toBe(4);
  });

  it("builds reusable data table sorting and pagination state", () => {
    const dataTable = buildDashboardDataTable({
      columns: [
        { key: "name", label: "Name", sortable: true },
        { key: "checkIns", label: "Check-ins", sortable: true },
        { key: "status", label: "Status" }
      ],
      rows: [
        { name: "Jamie Rivera", checkIns: 8, status: "active" },
        { name: "Taylor Morgan", checkIns: 3, status: "trial" },
        { name: "Jordan Lee", checkIns: 11, status: "past_due" }
      ],
      sort: { key: "checkIns", direction: "desc" },
      page: 1,
      pageSize: 2
    });

    expect(dataTable.kind).toBe("dashboard_data_table");
    expect(dataTable.columns.find((column) => column.key === "checkIns")?.sorted).toBe(true);
    expect(dataTable.columns.find((column) => column.key === "checkIns")?.nextDirection).toBe(
      "asc"
    );
    expect(dataTable.rows.map((row) => row.name)).toEqual(["Jordan Lee", "Jamie Rivera"]);
    expect(dataTable.table.rows).toEqual(dataTable.rows);
    expect(dataTable.pagination).toMatchObject({
      page: 1,
      pageSize: 2,
      totalRows: 3,
      totalPages: 2,
      startRow: 1,
      endRow: 2,
      canPrevious: false,
      canNext: true
    });
    expect(dataTable.pagination.previousAction.disabled).toBe(true);
    expect(dataTable.pagination.nextAction.disabled).toBe(false);
  });

  it("ignores non-sortable columns and clamps pagination", () => {
    const dataTable = buildDashboardDataTable({
      columns: [
        { key: "name", label: "Name" },
        { key: "createdAt", label: "Created", sortable: true }
      ],
      rows: [
        { name: "Older", createdAt: new Date("2026-05-01T00:00:00.000Z") },
        { name: "Newer", createdAt: new Date("2026-05-02T00:00:00.000Z") }
      ],
      sort: { key: "name", direction: "asc" },
      page: 10,
      pageSize: 1
    });

    expect(dataTable.sort).toBeUndefined();
    expect(dataTable.rows.map((row) => row.name)).toEqual(["Newer"]);
    expect(dataTable.pagination.page).toBe(2);
    expect(dataTable.pagination.canNext).toBe(false);
  });

  it("builds reusable filter drawer state with active counts and validation", () => {
    const drawer = buildDashboardFilterDrawer({
      title: " Member filters ",
      open: true,
      fields: [
        { key: "query", label: "Search", type: "text", value: "jam" },
        {
          key: "status",
          label: "Status",
          type: "select",
          value: "active",
          defaultValue: "all",
          options: [
            { label: "All", value: "all" },
            { label: "Active", value: "active" }
          ]
        },
        { key: "pastDue", label: "Past due", type: "checkbox", value: false },
        { key: "joinedAfter", label: "Joined after", type: "date", error: "Invalid date" }
      ]
    });

    expect(drawer.kind).toBe("dashboard_filter_drawer");
    expect(drawer.title).toBe("Member filters");
    expect(drawer.open).toBe(true);
    expect(drawer.activeFilterCount).toBe(2);
    expect(drawer.fields.find((field) => field.key === "query")?.input?.value).toBe("jam");
    expect(drawer.fields.find((field) => field.key === "status")?.active).toBe(true);
    expect(drawer.fields.find((field) => field.key === "pastDue")?.active).toBe(false);
    expect(drawer.applyAction.disabled).toBe(true);
    expect(drawer.resetAction.disabled).toBe(false);
    expect(drawer.closeAction.icon).toBe("x");
  });

  it("builds reusable confirmation modal state", () => {
    const confirmation = buildDashboardConfirmationModal({
      title: "Remove staff access",
      body: "This staff member will lose access immediately.",
      open: true,
      confirmLabel: "Remove access",
      destructive: true
    });

    expect(confirmation.kind).toBe("dashboard_confirmation_modal");
    expect(confirmation.open).toBe(true);
    expect(confirmation.destructive).toBe(true);
    expect(confirmation.confirmAction.intent).toBe("danger");
    expect(confirmation.cancelAction.intent).toBe("secondary");
    expect(confirmation.modal.actions.map((action) => action.label)).toEqual([
      "Cancel",
      "Remove access"
    ]);
  });

  it("builds reusable detail drawer sections, actions, and empty state", () => {
    const drawer = buildDashboardDetailDrawer({
      title: "Jamie Rivera",
      subtitle: "Active member",
      open: true,
      sections: [
        {
          key: "profile",
          title: "Profile",
          items: [
            { key: "email", label: "Email", value: "jamie@example.com" },
            { key: "trial", label: "Trial", value: false },
            { key: "joined", label: "Joined", value: new Date("2026-05-01T00:00:00.000Z") },
            { key: "notes", label: "Notes", value: null }
          ]
        }
      ],
      actions: [{ key: "edit", label: "Edit", href: "/members/member-1/edit", icon: "pencil" }]
    });
    const empty = buildDashboardDetailDrawer({
      title: "Empty",
      sections: []
    });

    expect(drawer.kind).toBe("dashboard_detail_drawer");
    expect(drawer.subtitle).toBe("Active member");
    expect(drawer.sections[0]?.items.map((item) => item.value)).toEqual([
      "jamie@example.com",
      "No",
      "2026-05-01T00:00:00.000Z",
      ""
    ]);
    expect(drawer.sections[0]?.items.find((item) => item.key === "notes")?.empty).toBe(true);
    expect(drawer.actions[0]?.href).toBe("/members/member-1/edit");
    expect(drawer.actions[0]?.button.icon).toBe("pencil");
    expect(drawer.closeAction.icon).toBe("x");
    expect(empty.empty?.title).toBe("No details");
  });

  it("builds reusable toast notification center state", () => {
    const center = buildDashboardToastNotificationCenter({
      maxVisible: 2,
      placement: "bottom-right",
      toasts: [
        {
          id: "saved",
          title: "Member saved",
          message: " Jamie Rivera was updated. ",
          severity: "success",
          createdAt: "2026-05-17T12:00:00.000Z",
          autoDismissMs: 500
        },
        {
          id: "failed",
          title: "Payment failed",
          severity: "danger",
          createdAt: "2026-05-17T12:02:00.000Z",
          persistent: true,
          autoDismissMs: 4000,
          action: {
            key: "review",
            label: "Review",
            href: "/billing/review",
            icon: "arrow-right"
          }
        },
        {
          id: "queued",
          title: "Export ready",
          severity: "info",
          createdAt: "2026-05-17T12:01:00.000Z"
        }
      ]
    });
    const empty = buildDashboardToastNotificationCenter({ toasts: [] });

    expect(center.kind).toBe("dashboard_toast_notification_center");
    expect(center.placement).toBe("bottom-right");
    expect(center.toasts.map((toast) => toast.id)).toEqual(["failed", "queued", "saved"]);
    expect(center.visibleToasts.map((toast) => toast.id)).toEqual(["failed", "queued"]);
    expect(center.queuedCount).toBe(1);
    expect(center.toasts.find((toast) => toast.id === "failed")?.icon).toBe("circle-alert");
    expect(center.toasts.find((toast) => toast.id === "failed")?.autoDismissMs).toBeUndefined();
    expect(center.toasts.find((toast) => toast.id === "failed")?.action?.href).toBe(
      "/billing/review"
    );
    expect(center.toasts.find((toast) => toast.id === "saved")?.message).toBe(
      "Jamie Rivera was updated."
    );
    expect(center.toasts.find((toast) => toast.id === "saved")?.autoDismissMs).toBe(1000);
    expect(center.dismissAllAction.disabled).toBe(false);
    expect(empty.visibleToasts).toEqual([]);
    expect(empty.dismissAllAction.disabled).toBe(true);
  });

  it("builds reusable date range picker state", () => {
    const picker = buildDashboardDateRangePicker({
      label: "Report range",
      from: "2026-05-01",
      to: "2026-05-17",
      min: "2026-01-01",
      max: "2026-12-31",
      presets: [
        { key: "month", label: "This month", from: "2026-05-01", to: "2026-05-17" },
        { key: "year", label: "This year", from: "2026-01-01", to: "2026-12-31" }
      ]
    });
    const invalid = buildDashboardDateRangePicker({
      label: "Bad range",
      from: "2026-05-17",
      to: "2026-05-01"
    });

    expect(picker.kind).toBe("dashboard_date_range_picker");
    expect(picker.valid).toBe(true);
    expect(picker.fromField.value).toBe("2026-05-01");
    expect(picker.toField.value).toBe("2026-05-17");
    expect(picker.presets.find((preset) => preset.key === "month")?.active).toBe(true);
    expect(picker.applyAction.disabled).toBe(false);
    expect(picker.clearAction.disabled).toBe(false);
    expect(invalid.valid).toBe(false);
    expect(invalid.applyAction.disabled).toBe(true);
    expect(invalid.errors).toContain("From date must be before to date.");
  });

  it("builds reusable CSV upload state", () => {
    const upload = buildDashboardCsvUpload({
      label: "Import members",
      file: {
        name: "members.csv",
        sizeBytes: 2048,
        type: "text/csv",
        lastModified: "2026-05-17T12:00:00.000Z"
      },
      columns: ["email", "firstName", "lastName"],
      previewRows: [
        ["jamie@example.com", "Jamie", "Rivera"],
        ["taylor@example.com", "Taylor", "Morgan"]
      ],
      requiredColumns: ["email", "firstName"],
      templateAvailable: true
    });
    const invalid = buildDashboardCsvUpload({
      label: "Import members",
      file: { name: "members.xlsx", sizeBytes: 10_000_000, type: "application/vnd.ms-excel" },
      columns: ["email"],
      requiredColumns: ["email", "firstName"],
      maxSizeBytes: 1024
    });
    const empty = buildDashboardCsvUpload({ label: "Import members" });

    expect(upload.kind).toBe("dashboard_csv_upload");
    expect(upload.status).toBe("ready");
    expect(upload.accept).toBe(".csv,text/csv");
    expect(upload.preview?.rowCount).toBe(2);
    expect(upload.preview?.missingRequiredColumns).toEqual([]);
    expect(upload.uploadAction.disabled).toBe(false);
    expect(upload.templateAction?.icon).toBe("download");
    expect(invalid.status).toBe("error");
    expect(invalid.uploadAction.disabled).toBe(true);
    expect(invalid.errors).toContain("File must be a CSV.");
    expect(invalid.errors).toContain("Missing required columns: firstName.");
    expect(empty.empty?.title).toBe("No CSV selected");
    expect(empty.removeAction.disabled).toBe(true);
  });

  it("builds reusable image upload state", () => {
    const upload = buildDashboardImageUpload({
      label: "Gym logo",
      file: {
        name: "logo.png",
        sizeBytes: 4096,
        type: "image/png",
        width: 1200,
        height: 600,
        previewUrl: "https://example.com/logo.png"
      },
      altText: " Demo Strength Club logo ",
      minWidth: 400,
      minHeight: 200,
      aspectRatio: 2
    });
    const invalid = buildDashboardImageUpload({
      label: "Gym logo",
      file: {
        name: "logo.gif",
        sizeBytes: 10_000_000,
        type: "image/gif",
        width: 100,
        height: 100
      },
      minWidth: 400,
      minHeight: 200,
      aspectRatio: 2,
      maxSizeBytes: 1024
    });
    const empty = buildDashboardImageUpload({ label: "Gym logo" });

    expect(upload.kind).toBe("dashboard_image_upload");
    expect(upload.status).toBe("ready");
    expect(upload.previewUrl).toBe("https://example.com/logo.png");
    expect(upload.altTextField.value).toBe("Demo Strength Club logo");
    expect(upload.uploadAction.disabled).toBe(false);
    expect(invalid.status).toBe("error");
    expect(invalid.errors).toContain("File must be a PNG, JPG, or WebP image.");
    expect(invalid.errors).toContain("Image width is below the minimum.");
    expect(invalid.errors).toContain("Image aspect ratio does not match the required ratio.");
    expect(empty.empty?.title).toBe("No image selected");
    expect(empty.removeAction.disabled).toBe(true);
  });
});
