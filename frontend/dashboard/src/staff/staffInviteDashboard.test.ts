import {
  Permission,
  RoleName,
  StaffAuditAction,
  StaffInviteStatus,
  UserStatus
} from "@gym-platform/constants";
import { describe, expect, it } from "vitest";
import {
  buildCustomRoleCreateScreen,
  buildCustomRoleEditScreen,
  buildFrontDeskRestrictedView,
  buildStaffCreateMemberForm,
  buildStaffEditMemberForm,
  buildStaffPermissionsScreen,
  buildStaffInviteAcceptScreen,
  buildStaffAvailabilityEditor,
  buildStaffInviteEmailSendingFlow,
  buildStaffInviteFlow,
  buildStaffListPage,
  buildStaffProfilePage,
  buildStaffScheduleAvailabilityModel,
  buildStaffShiftConflictReport,
  buildStaffShiftCalendarView,
  buildStaffStatusFlow,
  buildStaffTaskAssignmentModel,
  buildStaffTaskCompletionFlow,
  buildStaffTaskListView,
  buildTrainerRestrictedView,
  buildTrainerBioEditor,
  buildTrainerProfileImageUpload,
  buildTrainerPublicVisibilitySetting,
  buildTrainerSpecialtiesEditor,
  createCustomRoleSubmission,
  addTrainerSpecialty,
  createStaffEditSubmission,
  createStaffMemberSubmission,
  createStaffAccessRemovalSubmission,
  createStaffAvailabilitySubmission,
  createStaffInviteAcceptanceSubmission,
  createStaffInviteEmailSendSubmission,
  createStaffInviteSubmission,
  createStaffPermissionChangeSubmission,
  createStaffStatusChangeSubmission,
  createStaffTaskAssignmentSubmission,
  createStaffTaskCompletionSubmission,
  createTrainerPublicVisibilitySubmission,
  createTrainerBioSubmission,
  createTrainerProfileImageSubmission,
  createTrainerSpecialtiesSubmission,
  normalizeTrainerBio,
  addStaffAvailabilitySlot,
  removeStaffAvailabilitySlot,
  removeTrainerSpecialty
} from "./index.js";

const roles = [
  { id: "role-owner", name: RoleName.Owner, label: "Owner" },
  { id: "role-manager", name: RoleName.Manager, label: "Manager" },
  { id: "role-trainer", name: RoleName.Trainer, label: "Trainer" },
  { id: "role-member", name: RoleName.Member, label: "Member" }
];

describe("staff invite dashboard flow", () => {
  it("builds staff list page with filters, summary, and actions", () => {
    const screen = buildStaffListPage({
      roles,
      permissions: [Permission.StaffRead, Permission.StaffInvite, Permission.StaffRoleAssign],
      filters: {
        query: " trainer ",
        roleId: "role-trainer",
        status: UserStatus.Active
      },
      staff: [
        {
          membershipId: "membership-owner",
          gymId: "gym-1",
          userId: "owner-1",
          email: "owner@example.com",
          firstName: "Demo",
          lastName: "Owner",
          roleId: "role-owner",
          roleName: RoleName.Owner,
          status: UserStatus.Active,
          createdAt: "2026-05-16T12:00:00.000Z",
          updatedAt: "2026-05-16T12:00:00.000Z"
        },
        {
          membershipId: "membership-trainer",
          gymId: "gym-1",
          userId: "trainer-1",
          email: "trainer@example.com",
          firstName: "Demo",
          lastName: "Trainer",
          roleId: "role-trainer",
          roleName: RoleName.Trainer,
          status: UserStatus.Active,
          createdAt: "2026-05-16T12:00:00.000Z",
          updatedAt: "2026-05-16T12:00:00.000Z"
        },
        {
          membershipId: "membership-disabled",
          gymId: "gym-1",
          userId: "disabled-1",
          email: "disabled@example.com",
          firstName: "Disabled",
          lastName: "Staff",
          roleId: "role-manager",
          roleName: RoleName.Manager,
          status: UserStatus.Disabled,
          createdAt: "2026-05-16T12:00:00.000Z",
          updatedAt: "2026-05-16T12:00:00.000Z"
        }
      ]
    });
    const empty = buildStaffListPage({
      roles,
      permissions: [Permission.StaffRead],
      filters: { query: "missing" },
      staff: []
    });

    expect(screen.screen).toBe("staff_list");
    expect(screen.searchField.value).toBe("trainer");
    expect(screen.summary).toMatchObject({
      totalCount: 3,
      activeCount: 2,
      disabledCount: 1,
      visibleCount: 1
    });
    expect(screen.rows[0]?.fullName).toBe("Demo Trainer");
    expect(screen.rows[0]?.initials).toBe("DT");
    expect(screen.rows[0]?.roleLabel).toBe("Trainer");
    expect(screen.rows[0]?.detailHref).toBe("/staff/trainer-1");
    expect(screen.table.rows).toEqual(screen.rows);
    expect(screen.roleOptions.find((role) => role.id === "role-trainer")?.selected).toBe(true);
    expect(
      screen.statusOptions.find((status) => status.value === UserStatus.Active)?.selected
    ).toBe(true);
    expect(screen.inviteAction.disabled).toBe(false);
    expect(screen.manageRolesAction.disabled).toBe(false);
    expect(
      screen.rows[0]?.actions.find((action) => action.key === "edit_permissions")?.button.disabled
    ).toBe(false);
    expect(
      screen.rows[0]?.actions.find((action) => action.key === "remove_access")?.button.disabled
    ).toBe(true);
    expect(empty.empty?.title).toBe("No staff match your filters");
    expect(empty.inviteAction.disabled).toBe(true);
  });

  it("builds staff profile page with audit trail and permission-aware actions", () => {
    const screen = buildStaffProfilePage({
      roles,
      permissions: [Permission.StaffRead, Permission.StaffRoleAssign, Permission.StaffRemove],
      staff: {
        membershipId: "membership-trainer",
        gymId: "gym-1",
        userId: "trainer-1",
        email: "trainer@example.com",
        firstName: "Demo",
        lastName: "Trainer",
        roleId: "role-trainer",
        roleName: RoleName.Trainer,
        status: UserStatus.Active,
        createdAt: "2026-05-16T12:00:00.000Z",
        updatedAt: "2026-05-17T12:00:00.000Z"
      },
      auditEntries: [
        {
          id: "audit-older",
          gymId: "gym-1",
          actorUserId: "owner-1",
          targetUserId: "other-1",
          action: StaffAuditAction.RoleChanged,
          previousRoleId: "role-manager",
          nextRoleId: "role-trainer",
          createdAt: "2026-05-15T12:00:00.000Z"
        },
        {
          id: "audit-role",
          gymId: "gym-1",
          actorUserId: "owner-1",
          targetUserId: "trainer-1",
          action: StaffAuditAction.RoleChanged,
          previousRoleId: "role-manager",
          nextRoleId: "role-trainer",
          createdAt: "2026-05-17T12:00:00.000Z"
        },
        {
          id: "audit-remove",
          gymId: "gym-1",
          actorUserId: "owner-1",
          targetUserId: "trainer-1",
          action: StaffAuditAction.AccessRemoved,
          reason: "Seasonal team ended",
          createdAt: "2026-05-16T12:00:00.000Z"
        }
      ]
    });
    const locked = buildStaffProfilePage({
      roles,
      permissions: [Permission.StaffRead, Permission.StaffRoleAssign, Permission.StaffRemove],
      currentUserId: "trainer-1",
      staff: {
        membershipId: "membership-trainer",
        gymId: "gym-1",
        userId: "trainer-1",
        email: "trainer@example.com",
        firstName: "Demo",
        lastName: "Trainer",
        roleId: "role-trainer",
        roleName: RoleName.Trainer,
        status: UserStatus.Active,
        createdAt: "2026-05-16T12:00:00.000Z",
        updatedAt: "2026-05-17T12:00:00.000Z"
      }
    });

    expect(screen.screen).toBe("staff_profile");
    expect(screen.fullName).toBe("Demo Trainer");
    expect(screen.initials).toBe("DT");
    expect(screen.roleLabel).toBe("Trainer");
    expect(screen.statusLabel).toBe("Active");
    expect(screen.details.map((detail) => detail.key)).toEqual([
      "email",
      "role",
      "status",
      "joined",
      "updated"
    ]);
    expect(screen.actions.find((action) => action.key === "back_to_staff")?.href).toBe("/staff");
    expect(
      screen.actions.find((action) => action.key === "edit_permissions")?.button.disabled
    ).toBe(false);
    expect(screen.actions.find((action) => action.key === "remove_access")?.button.disabled).toBe(
      false
    );
    expect(screen.auditTrail.map((entry) => entry.id)).toEqual(["audit-role", "audit-remove"]);
    expect(screen.auditTrail[0]?.changeSummary).toBe("Manager to Trainer");
    expect(screen.auditTrail[1]?.changeSummary).toBe("Access removed: Seasonal team ended");
    expect(screen.auditEmpty).toBeUndefined();
    expect(locked.locked).toBe(true);
    expect(locked.auditEmpty?.title).toBe("No staff activity");
    expect(
      locked.actions.find((action) => action.key === "edit_permissions")?.button.disabled
    ).toBe(true);
  });

  it("builds create staff member form and normalized submission", () => {
    const form = buildStaffCreateMemberForm({
      roles,
      firstName: " Demo ",
      lastName: " Coach ",
      email: " Coach@Example.com ",
      selectedRoleId: "role-trainer",
      message: " Welcome aboard. "
    });
    const invalid = buildStaffCreateMemberForm({
      roles,
      firstName: "Demo",
      lastName: "Coach",
      email: "not-an-email",
      selectedRoleId: "role-owner"
    });
    const submission = createStaffMemberSubmission({
      firstName: " Demo ",
      lastName: " Coach ",
      email: " Coach@Example.com ",
      roleId: "role-trainer",
      message: " Welcome aboard. "
    });

    expect(form.screen).toBe("staff_create_member");
    expect(form.fields.firstName.value).toBe("Demo");
    expect(form.fields.lastName.value).toBe("Coach");
    expect(form.fields.email.value).toBe("coach@example.com");
    expect(form.fields.message.value).toBe("Welcome aboard.");
    expect(form.roleOptions.map((role) => role.name)).toEqual([RoleName.Manager, RoleName.Trainer]);
    expect(form.roleOptions.find((role) => role.id === "role-trainer")?.selected).toBe(true);
    expect(form.selectedRoleId).toBe("role-trainer");
    expect(form.canSubmit).toBe(true);
    expect(form.submitAction.disabled).toBe(false);
    expect(invalid.selectedRoleId).toBeUndefined();
    expect(invalid.fields.email.error).toBe("Enter a valid email address.");
    expect(invalid.canSubmit).toBe(false);
    expect(invalid.submitAction.disabled).toBe(true);
    expect(submission).toEqual({
      firstName: "Demo",
      lastName: "Coach",
      email: "coach@example.com",
      roleId: "role-trainer",
      message: "Welcome aboard."
    });
  });

  it("builds edit staff member form with change detection and normalized submission", () => {
    const staff = {
      membershipId: "membership-trainer",
      gymId: "gym-1",
      userId: "trainer-1",
      email: "trainer@example.com",
      firstName: "Demo",
      lastName: "Trainer",
      roleId: "role-trainer",
      roleName: RoleName.Trainer,
      status: UserStatus.Active,
      createdAt: "2026-05-16T12:00:00.000Z",
      updatedAt: "2026-05-16T12:00:00.000Z"
    };
    const unchanged = buildStaffEditMemberForm({ staff, roles });
    const changed = buildStaffEditMemberForm({
      staff,
      roles,
      firstName: " Demo ",
      lastName: " Coach ",
      email: " Coach@Example.com ",
      selectedRoleId: "role-manager"
    });
    const invalid = buildStaffEditMemberForm({
      staff,
      roles,
      email: "bad-email"
    });
    const locked = buildStaffEditMemberForm({
      staff: { ...staff, status: UserStatus.Disabled },
      roles,
      lastName: "Coach"
    });
    const submission = createStaffEditSubmission({
      userId: "trainer-1",
      firstName: " Demo ",
      lastName: " Coach ",
      email: " Coach@Example.com ",
      roleId: "role-manager"
    });

    expect(unchanged.screen).toBe("staff_edit_member");
    expect(unchanged.changedFields).toEqual([]);
    expect(unchanged.canSubmit).toBe(false);
    expect(unchanged.submitAction.disabled).toBe(true);
    expect(changed.fields.lastName.value).toBe("Coach");
    expect(changed.fields.email.value).toBe("coach@example.com");
    expect(changed.selectedRoleId).toBe("role-manager");
    expect(changed.changedFields).toEqual(["lastName", "email", "roleId"]);
    expect(changed.canSubmit).toBe(true);
    expect(changed.submitAction.disabled).toBe(false);
    expect(invalid.fields.email.error).toBe("Enter a valid email address.");
    expect(invalid.canSubmit).toBe(false);
    expect(locked.locked).toBe(true);
    expect(locked.canSubmit).toBe(false);
    expect(submission).toEqual({
      userId: "trainer-1",
      firstName: "Demo",
      lastName: "Coach",
      email: "coach@example.com",
      roleId: "role-manager"
    });
  });

  it("builds staff active and inactive status flow", () => {
    const activeStaff = {
      membershipId: "membership-trainer",
      gymId: "gym-1",
      userId: "trainer-1",
      email: "trainer@example.com",
      firstName: "Demo",
      lastName: "Trainer",
      roleId: "role-trainer",
      roleName: RoleName.Trainer,
      status: UserStatus.Active,
      createdAt: "2026-05-16T12:00:00.000Z",
      updatedAt: "2026-05-16T12:00:00.000Z"
    };
    const deactivate = buildStaffStatusFlow({
      staff: activeStaff,
      permissions: [Permission.StaffRead, Permission.StaffRemove],
      targetStatus: UserStatus.Disabled,
      reason: " Seasonal team ended "
    });
    const activate = buildStaffStatusFlow({
      staff: { ...activeStaff, status: UserStatus.Disabled },
      permissions: [Permission.StaffRead, Permission.StaffRoleAssign]
    });
    const locked = buildStaffStatusFlow({
      staff: activeStaff,
      permissions: [Permission.StaffRemove, Permission.StaffRoleAssign],
      currentUserId: "trainer-1"
    });
    const invited = buildStaffStatusFlow({
      staff: { ...activeStaff, status: UserStatus.Invited },
      permissions: [Permission.StaffRemove, Permission.StaffRoleAssign]
    });
    const submission = createStaffStatusChangeSubmission({
      userId: "trainer-1",
      status: UserStatus.Disabled,
      reason: " Seasonal team ended "
    });

    expect(deactivate.screen).toBe("staff_status_flow");
    expect(deactivate.currentStatus).toBe(UserStatus.Active);
    expect(deactivate.nextStatus).toBe(UserStatus.Disabled);
    expect(deactivate.canDeactivate).toBe(true);
    expect(deactivate.canActivate).toBe(false);
    expect(deactivate.canSubmit).toBe(true);
    expect(deactivate.reasonField.value).toBe("Seasonal team ended");
    expect(deactivate.deactivateAction.disabled).toBe(false);
    expect(deactivate.confirmationModal.open).toBe(true);
    expect(deactivate.confirmationModal.actions[1]?.intent).toBe("danger");
    expect(activate.nextStatus).toBe(UserStatus.Active);
    expect(activate.canActivate).toBe(true);
    expect(activate.activateAction.disabled).toBe(false);
    expect(activate.confirmationModal.actions[1]?.label).toBe("Activate staff");
    expect(locked.locked).toBe(true);
    expect(locked.canSubmit).toBe(false);
    expect(locked.deactivateAction.disabled).toBe(true);
    expect(invited.nextStatus).toBeUndefined();
    expect(invited.canSubmit).toBe(false);
    expect(submission).toEqual({
      userId: "trainer-1",
      status: UserStatus.Disabled,
      reason: "Seasonal team ended"
    });
  });

  it("builds role selection state and pending invite list", () => {
    const screen = buildStaffInviteFlow({
      roles,
      selectedRoleId: "role-trainer",
      email: " Trainer@Example.com ",
      message: " Join the team. ",
      invites: [
        {
          id: "invite-1",
          email: "frontdesk@example.com",
          roleId: "role-manager",
          roleName: RoleName.Manager,
          invitedByUserId: "owner-1",
          status: StaffInviteStatus.Pending,
          expiresAt: "2026-05-23T12:00:00.000Z",
          createdAt: "2026-05-16T12:00:00.000Z"
        },
        {
          id: "invite-2",
          email: "old@example.com",
          roleId: "role-manager",
          roleName: RoleName.Manager,
          invitedByUserId: "owner-1",
          status: StaffInviteStatus.Expired,
          expiresAt: "2026-05-01T12:00:00.000Z",
          createdAt: "2026-04-24T12:00:00.000Z"
        }
      ]
    });

    expect(screen.screen).toBe("staff_invite_flow");
    expect(screen.emailField.value).toBe("trainer@example.com");
    expect(screen.emailField.name).toBe("email");
    expect(screen.emailField.label).toBe("Email");
    expect(screen.emailField.type).toBe("email");
    expect(screen.emailField.required).toBe(true);
    expect(screen.messageField.value).toBe("Join the team.");
    expect(screen.messageField.name).toBe("message");
    expect(screen.messageField.label).toBe("Message");
    expect(screen.messageField.type).toBe("text");
    expect(screen.messageField.required).toBe(false);
    expect(screen.roleOptions.map((role) => role.name)).toEqual([
      RoleName.Manager,
      RoleName.Trainer
    ]);
    expect(screen.roleOptionCount).toBe(2);
    expect(screen.roleOptions.map((role) => role.label)).toEqual(["Manager", "Trainer"]);
    expect(screen.roleOptions.find((role) => role.id === "role-trainer")?.selected).toBe(true);
    expect(screen.selectedRoleId).toBe("role-trainer");
    expect(screen.selectedRoleName).toBe("Trainer");
    expect(screen.pendingInvites).toHaveLength(1);
    expect(screen.pendingInviteCount).toBe(1);
    expect(screen.expiredInviteCount).toBe(1);
    expect(screen.summaryLabel).toBe("1 pending invite");
    expect(screen.action.label).toBe("Send invite");
    expect(screen.table.rows).toEqual(screen.pendingInvites);
    expect(screen.canSubmit).toBe(true);
    expect(screen.action.disabled).toBe(false);
  });

  it("builds staff invite email sending flow", () => {
    const flow = buildStaffInviteEmailSendingFlow({
      selectedInviteIds: ["invite-1", "invite-2", "invite-accepted"],
      message: " Please join the team. ",
      deliveryStates: [
        { inviteId: "invite-1", status: "failed", error: "SMTP rejected" },
        { inviteId: "invite-2", status: "sending" }
      ],
      invites: [
        {
          id: "invite-1",
          email: "trainer@example.com",
          roleId: "role-trainer",
          roleName: RoleName.Trainer,
          invitedByUserId: "owner-1",
          status: StaffInviteStatus.Pending,
          expiresAt: "2026-05-23T12:00:00.000Z",
          createdAt: "2026-05-16T12:00:00.000Z"
        },
        {
          id: "invite-2",
          email: "frontdesk@example.com",
          roleId: "role-manager",
          roleName: RoleName.Manager,
          invitedByUserId: "owner-1",
          status: StaffInviteStatus.Pending,
          expiresAt: "2026-05-23T12:00:00.000Z",
          createdAt: "2026-05-16T12:00:00.000Z"
        },
        {
          id: "invite-accepted",
          email: "accepted@example.com",
          roleId: "role-trainer",
          roleName: RoleName.Trainer,
          invitedByUserId: "owner-1",
          status: StaffInviteStatus.Accepted,
          expiresAt: "2026-05-23T12:00:00.000Z",
          createdAt: "2026-05-16T12:00:00.000Z"
        }
      ]
    });
    const empty = buildStaffInviteEmailSendingFlow({ invites: [] });
    const submission = createStaffInviteEmailSendSubmission({
      inviteIds: ["invite-1", "invite-1", "invite-2"],
      message: " Please join. "
    });

    expect(flow.screen).toBe("staff_invite_email_sending");
    expect(flow.messageField.value).toBe("Please join the team.");
    expect(flow.selectedInviteIds).toEqual(["invite-1", "invite-2", "invite-accepted"]);
    expect(flow.rows.find((row) => row.id === "invite-1")?.deliveryStatus).toBe("failed");
    expect(flow.rows.find((row) => row.id === "invite-1")?.resendAction.label).toBe("Retry email");
    expect(flow.rows.find((row) => row.id === "invite-2")?.canSend).toBe(false);
    expect(flow.rows.find((row) => row.id === "invite-accepted")?.deliveryLabel).toBe(
      "Not eligible"
    );
    expect(flow.canSendSelected).toBe(true);
    expect(flow.canSendAll).toBe(true);
    expect(flow.sendSelectedAction.disabled).toBe(false);
    expect(flow.table.rows).toEqual(flow.rows);
    expect(empty.empty?.title).toBe("No invites to email");
    expect(empty.sendAllAction.disabled).toBe(true);
    expect(submission).toEqual({
      inviteIds: ["invite-1", "invite-2"],
      message: "Please join."
    });
  });

  it("builds trainer public visibility setting", () => {
    const trainer = {
      membershipId: "membership-trainer",
      gymId: "gym-1",
      userId: "trainer-1",
      email: "trainer@example.com",
      firstName: "Demo",
      lastName: "Trainer",
      roleId: "role-trainer",
      roleName: RoleName.Trainer,
      status: UserStatus.Active,
      createdAt: "2026-05-16T12:00:00.000Z",
      updatedAt: "2026-05-16T12:00:00.000Z"
    };
    const visible = buildTrainerPublicVisibilitySetting({
      staff: trainer,
      publicProfileVisible: true,
      profileSlug: " Demo Trainer ",
      basePublicUrl: "https://demo.example.com/"
    });
    const hidden = buildTrainerPublicVisibilitySetting({
      staff: trainer,
      publicProfileVisible: false,
      profileSlug: "coach demo"
    });
    const blocked = buildTrainerPublicVisibilitySetting({
      staff: { ...trainer, roleName: RoleName.Manager },
      publicProfileVisible: true,
      profileSlug: "manager-demo",
      basePublicUrl: "https://demo.example.com"
    });
    const disabled = buildTrainerPublicVisibilitySetting({
      staff: { ...trainer, status: UserStatus.Disabled },
      publicProfileVisible: true,
      profileSlug: "demo-trainer"
    });
    const submission = createTrainerPublicVisibilitySubmission({
      userId: "trainer-1",
      publicProfileVisible: true,
      profileSlug: " Demo Trainer "
    });

    expect(visible.screen).toBe("trainer_public_visibility");
    expect(visible.eligible).toBe(true);
    expect(visible.visible).toBe(true);
    expect(visible.visibilityLabel).toBe("Public profile visible");
    expect(visible.profileSlug).toBe("demo-trainer");
    expect(visible.hasPublicUrl).toBe(true);
    expect(visible.publicUrl).toBe("https://demo.example.com/trainers/demo-trainer");
    expect(visible.slugField.value).toBe("demo-trainer");
    expect(visible.actionCount).toBe(3);
    expect(visible.summaryLabel).toBe("Trainer public profile is visible");
    expect(visible.previewAction.disabled).toBe(false);
    expect(visible.publishAction.disabled).toBe(true);
    expect(visible.hideAction.disabled).toBe(false);
    expect(hidden.visible).toBe(false);
    expect(hidden.visibilityLabel).toBe("Public profile hidden");
    expect(hidden.hasPublicUrl).toBe(false);
    expect(hidden.summaryLabel).toBe("Trainer public profile is hidden");
    expect(hidden.publishAction.disabled).toBe(false);
    expect(hidden.hideAction.disabled).toBe(true);
    expect(blocked.eligible).toBe(false);
    expect(blocked.visible).toBe(false);
    expect(blocked.hasPublicUrl).toBe(true);
    expect(blocked.summaryLabel).toBe("Trainer public profile unavailable");
    expect(blocked.reason).toBe("Only trainer profiles can be made public.");
    expect(blocked.publishAction.disabled).toBe(true);
    expect(disabled.summaryLabel).toBe("Trainer public profile unavailable");
    expect(disabled.reason).toBe("Only active trainers can be made public.");
    expect(submission).toEqual({
      userId: "trainer-1",
      publicProfileVisible: true,
      profileSlug: "demo-trainer"
    });
  });

  it("builds trainer specialties editor", () => {
    const trainer = {
      membershipId: "membership-trainer",
      gymId: "gym-1",
      userId: "trainer-1",
      email: "trainer@example.com",
      firstName: "Demo",
      lastName: "Trainer",
      roleId: "role-trainer",
      roleName: RoleName.Trainer,
      status: UserStatus.Active,
      createdAt: "2026-05-16T12:00:00.000Z",
      updatedAt: "2026-05-16T12:00:00.000Z"
    };
    const editor = buildTrainerSpecialtiesEditor({
      staff: trainer,
      specialties: [" Strength ", "mobility", "strength"],
      originalSpecialties: ["Mobility"],
      pendingSpecialty: " Mobility "
    });
    const blocked = buildTrainerSpecialtiesEditor({
      staff: { ...trainer, roleName: RoleName.Manager },
      specialties: ["Strength"],
      pendingSpecialty: "Conditioning"
    });
    const disabled = buildTrainerSpecialtiesEditor({
      staff: { ...trainer, status: UserStatus.Disabled },
      specialties: ["Strength"]
    });
    const added = addTrainerSpecialty(["Strength"], " Mobility ");
    const removed = removeTrainerSpecialty(["Strength", "Mobility"], " strength ");
    const submission = createTrainerSpecialtiesSubmission({
      userId: "trainer-1",
      specialties: [" Mobility ", "Strength", "strength"]
    });

    expect(editor.screen).toBe("trainer_specialties_editor");
    expect(editor.eligible).toBe(true);
    expect(editor.specialties.map((specialty) => specialty.label)).toEqual([
      "mobility",
      "Strength"
    ]);
    expect(editor.specialtyCount).toBe(2);
    expect(editor.specialties[0]?.key).toBe("mobility");
    expect(editor.pendingSpecialtyField.value).toBe("Mobility");
    expect(editor.pendingSpecialtyField.error).toBe("Specialty already exists.");
    expect(editor.duplicatePendingSpecialty).toBe(true);
    expect(editor.hasChanges).toBe(true);
    expect(editor.summaryLabel).toBe("2 trainer specialties");
    expect(editor.canAdd).toBe(false);
    expect(editor.canSubmit).toBe(true);
    expect(editor.actionCount).toBe(2);
    expect(editor.saveAction.disabled).toBe(false);
    expect(blocked.eligible).toBe(false);
    expect(blocked.specialtyCount).toBe(1);
    expect(blocked.hasChanges).toBe(false);
    expect(blocked.summaryLabel).toBe("Trainer specialties unavailable");
    expect(blocked.reason).toBe("Only trainer profiles can manage specialties.");
    expect(blocked.addAction.disabled).toBe(true);
    expect(disabled.summaryLabel).toBe("Trainer specialties unavailable");
    expect(disabled.reason).toBe("Only active trainers can manage specialties.");
    expect(added).toEqual(["Mobility", "Strength"]);
    expect(removed).toEqual(["Mobility"]);
    expect(submission).toEqual({
      userId: "trainer-1",
      specialties: ["Mobility", "Strength"]
    });
  });

  it("builds trainer bio editor", () => {
    const trainer = {
      membershipId: "membership-trainer",
      gymId: "gym-1",
      userId: "trainer-1",
      email: "trainer@example.com",
      firstName: "Demo",
      lastName: "Trainer",
      roleId: "role-trainer",
      roleName: RoleName.Trainer,
      status: UserStatus.Active,
      createdAt: "2026-05-16T12:00:00.000Z",
      updatedAt: "2026-05-16T12:00:00.000Z"
    };
    const editor = buildTrainerBioEditor({
      staff: trainer,
      bio: " Strength coach.  \r\n\r\n\r\n  Available for beginners. ",
      originalBio: "Strength coach.",
      maxLength: 60
    });
    const unchanged = buildTrainerBioEditor({
      staff: trainer,
      bio: "Strength coach."
    });
    const overLimit = buildTrainerBioEditor({
      staff: trainer,
      bio: "123456",
      originalBio: "",
      maxLength: 5
    });
    const blocked = buildTrainerBioEditor({
      staff: { ...trainer, roleName: RoleName.Manager },
      bio: "Manager bio",
      originalBio: ""
    });
    const disabled = buildTrainerBioEditor({
      staff: { ...trainer, status: UserStatus.Disabled },
      bio: "Trainer bio",
      originalBio: ""
    });
    const submission = createTrainerBioSubmission({
      userId: "trainer-1",
      bio: " Strength coach. \n\n\n  Available for beginners. "
    });

    expect(editor.screen).toBe("trainer_bio_editor");
    expect(editor.eligible).toBe(true);
    expect(editor.bio).toBe("Strength coach.\n\nAvailable for beginners.");
    expect(editor.characterCount).toBe(41);
    expect(editor.remainingCharacters).toBe(19);
    expect(editor.hasChanges).toBe(true);
    expect(editor.bioField.kind).toBe("textarea");
    expect(editor.bioField.value).toBe("Strength coach.\n\nAvailable for beginners.");
    expect(editor.actionCount).toBe(2);
    expect(editor.summaryLabel).toBe("41 bio characters");
    expect(editor.canSubmit).toBe(true);
    expect(editor.saveAction.disabled).toBe(false);
    expect(editor.clearAction.disabled).toBe(false);
    expect(unchanged.hasChanges).toBe(false);
    expect(unchanged.summaryLabel).toBe("15 bio characters");
    expect(unchanged.canSubmit).toBe(false);
    expect(overLimit.bioField.error).toBe("Bio must be 5 characters or fewer.");
    expect(overLimit.summaryLabel).toBe("Trainer bio exceeds character limit");
    expect(overLimit.canSubmit).toBe(false);
    expect(blocked.eligible).toBe(false);
    expect(blocked.summaryLabel).toBe("Trainer bio unavailable");
    expect(blocked.reason).toBe("Only trainer profiles can manage bios.");
    expect(blocked.clearAction.disabled).toBe(true);
    expect(disabled.summaryLabel).toBe("Trainer bio unavailable");
    expect(disabled.reason).toBe("Only active trainers can manage bios.");
    expect(normalizeTrainerBio(" A \r\n  B  \n\n\n C ")).toBe("A\nB\n\nC");
    expect(submission).toEqual({
      userId: "trainer-1",
      bio: "Strength coach.\n\nAvailable for beginners."
    });
  });

  it("builds trainer profile image upload", () => {
    const trainer = {
      membershipId: "membership-trainer",
      gymId: "gym-1",
      userId: "trainer-1",
      email: "trainer@example.com",
      firstName: "Demo",
      lastName: "Trainer",
      roleId: "role-trainer",
      roleName: RoleName.Trainer,
      status: UserStatus.Active,
      createdAt: "2026-05-16T12:00:00.000Z",
      updatedAt: "2026-05-16T12:00:00.000Z"
    };
    const editor = buildTrainerProfileImageUpload({
      staff: trainer,
      currentImageUrl: " https://cdn.example.com/current.jpg ",
      file: {
        name: "trainer.webp",
        type: "image/webp",
        sizeBytes: 512_000,
        width: 640,
        height: 640,
        previewUrl: "blob://trainer"
      },
      altText: " Demo Trainer headshot "
    });
    const invalid = buildTrainerProfileImageUpload({
      staff: trainer,
      file: {
        name: "trainer.gif",
        type: "image/gif",
        sizeBytes: 3 * 1024 * 1024,
        width: 200,
        height: 300
      }
    });
    const blocked = buildTrainerProfileImageUpload({
      staff: { ...trainer, roleName: RoleName.Manager },
      currentImageUrl: "https://cdn.example.com/current.jpg"
    });
    const disabled = buildTrainerProfileImageUpload({
      staff: { ...trainer, status: UserStatus.Disabled },
      currentImageUrl: "https://cdn.example.com/current.jpg"
    });
    const createSubmission = createTrainerProfileImageSubmission({
      userId: "trainer-1",
      imageUrl: " https://cdn.example.com/new.jpg ",
      altText: " Demo   Trainer "
    });
    const removeSubmission = createTrainerProfileImageSubmission({
      userId: "trainer-1",
      imageUrl: "https://cdn.example.com/new.jpg",
      altText: "Demo Trainer",
      removeImage: true
    });

    expect(editor.screen).toBe("trainer_profile_image_upload");
    expect(editor.eligible).toBe(true);
    expect(editor.hasCurrentImage).toBe(true);
    expect(editor.currentImageUrl).toBe("https://cdn.example.com/current.jpg");
    expect(editor.hasPreview).toBe(true);
    expect(editor.previewUrl).toBe("blob://trainer");
    expect(editor.upload.label).toBe("Trainer profile image");
    expect(editor.upload.status).toBe("ready");
    expect(editor.upload.maxSizeBytes).toBe(2 * 1024 * 1024);
    expect(editor.upload.minWidth).toBe(320);
    expect(editor.upload.minHeight).toBe(320);
    expect(editor.upload.aspectRatio).toBe(1);
    expect(editor.upload.altTextField.value).toBe("Demo Trainer headshot");
    expect(editor.canUpload).toBe(true);
    expect(editor.actionCount).toBe(2);
    expect(editor.summaryLabel).toBe("Trainer profile image ready to upload");
    expect(editor.saveAction.disabled).toBe(false);
    expect(editor.canRemove).toBe(true);
    expect(editor.removeAction.disabled).toBe(false);
    expect(invalid.upload.status).toBe("error");
    expect(invalid.hasCurrentImage).toBe(false);
    expect(invalid.hasPreview).toBe(false);
    expect(invalid.summaryLabel).toBe("No trainer profile image selected");
    expect(invalid.upload.errors).toEqual([
      "File must be a PNG, JPG, or WebP image.",
      "Image is larger than the allowed size.",
      "Image width is below the minimum.",
      "Image height is below the minimum.",
      "Image aspect ratio does not match the required ratio."
    ]);
    expect(invalid.canUpload).toBe(false);
    expect(invalid.upload.removeAction.disabled).toBe(false);
    expect(blocked.eligible).toBe(false);
    expect(blocked.hasCurrentImage).toBe(true);
    expect(blocked.summaryLabel).toBe("Trainer profile image unavailable");
    expect(blocked.reason).toBe("Only trainer profiles can manage profile images.");
    expect(blocked.upload.altTextField.value).toBe("Demo Trainer profile image");
    expect(blocked.removeAction.disabled).toBe(true);
    expect(disabled.summaryLabel).toBe("Trainer profile image unavailable");
    expect(disabled.reason).toBe("Only active trainers can manage profile images.");
    expect(createSubmission).toEqual({
      userId: "trainer-1",
      imageUrl: "https://cdn.example.com/new.jpg",
      altText: "Demo Trainer",
      removeImage: false
    });
    expect(removeSubmission).toEqual({
      userId: "trainer-1",
      removeImage: true
    });
  });

  it("builds staff schedule availability model and editor", () => {
    const trainer = {
      membershipId: "membership-trainer",
      gymId: "gym-1",
      userId: "trainer-1",
      email: "trainer@example.com",
      firstName: "Demo",
      lastName: "Trainer",
      roleId: "role-trainer",
      roleName: RoleName.Trainer,
      status: UserStatus.Active,
      createdAt: "2026-05-16T12:00:00.000Z",
      updatedAt: "2026-05-16T12:00:00.000Z"
    };
    const availability = [
      { day: "mon" as const, startsAt: " 09:00 ", endsAt: "12:00", locationId: "main" },
      { day: "mon" as const, startsAt: "11:00", endsAt: "14:00", locationId: "main" },
      { day: "wed" as const, startsAt: "13:00", endsAt: "17:00" }
    ];
    const model = buildStaffScheduleAvailabilityModel({
      staff: trainer,
      availability,
      timezone: "America/New_York"
    });
    const editor = buildStaffAvailabilityEditor({
      staff: trainer,
      availability: [availability[0]!, availability[2]!],
      originalAvailability: [availability[0]!],
      selectedDay: "fri",
      startsAt: "08:00",
      endsAt: "12:00",
      selectedLocationId: "main",
      locations: [
        { id: "main", name: "Main Floor" },
        { id: "annex", name: "Annex" }
      ]
    });
    const invalidEditor = buildStaffAvailabilityEditor({
      staff: trainer,
      selectedDay: "fri",
      startsAt: "12:00",
      endsAt: "08:00"
    });
    const disabledEditor = buildStaffAvailabilityEditor({
      staff: { ...trainer, status: UserStatus.Disabled },
      availability: [availability[0]!]
    });
    const added = addStaffAvailabilitySlot([{ day: "mon", startsAt: "09:00", endsAt: "12:00" }], {
      day: "tue",
      startsAt: "10:00",
      endsAt: "12:00"
    });
    const removed = removeStaffAvailabilitySlot(added, {
      day: "mon",
      startsAt: "09:00",
      endsAt: "12:00"
    });
    const submission = createStaffAvailabilitySubmission({
      userId: "trainer-1",
      availability: [
        { day: "mon", startsAt: "09:00", endsAt: "12:00" },
        { day: "mon", startsAt: "12:00", endsAt: "09:00" }
      ]
    });

    expect(model.screen).toBe("staff_schedule_availability");
    expect(model.slots).toHaveLength(3);
    expect(model.slotCount).toBe(3);
    expect(model.conflictCount).toBe(2);
    expect(model.slots[0]?.error).toBe("Availability overlaps another range for this day.");
    expect(model.weeklyMinutes).toBe(240);
    expect(model.availableDays).toEqual(["wed"]);
    expect(model.unavailableDays).toContain("mon");
    expect(model.summaryLabel).toBe("3 availability slots");
    expect(model.canCreateShift).toBe(false);
    expect(editor.screen).toBe("staff_availability_editor");
    expect(editor.availability.canCreateShift).toBe(true);
    expect(editor.locationOptions.find((location) => location.id === "main")?.selected).toBe(true);
    expect(editor.locationOptionCount).toBe(2);
    expect(editor.hasChanges).toBe(true);
    expect(editor.summaryLabel).toBe("Availability changes ready");
    expect(editor.canAdd).toBe(true);
    expect(editor.canSubmit).toBe(true);
    expect(editor.saveAction.disabled).toBe(false);
    expect(invalidEditor.canAdd).toBe(false);
    expect(invalidEditor.hasChanges).toBe(false);
    expect(invalidEditor.summaryLabel).toBe("Pending availability range is invalid");
    expect(invalidEditor.endsAtField.error).toBe("Availability end time must be after start time.");
    expect(disabledEditor.canSubmit).toBe(false);
    expect(disabledEditor.summaryLabel).toBe("Pending availability range is invalid");
    expect(disabledEditor.clearAction.disabled).toBe(true);
    expect(added).toEqual([
      { day: "mon", startsAt: "09:00", endsAt: "12:00" },
      { day: "tue", startsAt: "10:00", endsAt: "12:00" }
    ]);
    expect(removed).toEqual([{ day: "tue", startsAt: "10:00", endsAt: "12:00" }]);
    expect(submission).toEqual({
      userId: "trainer-1",
      availability: [{ day: "mon", startsAt: "09:00", endsAt: "12:00" }]
    });
  });

  it("builds staff shift calendar view", () => {
    const trainer = {
      membershipId: "membership-trainer",
      gymId: "gym-1",
      userId: "trainer-1",
      email: "trainer@example.com",
      firstName: "Demo",
      lastName: "Trainer",
      roleId: "role-trainer",
      roleName: RoleName.Trainer,
      status: UserStatus.Active,
      createdAt: "2026-05-16T12:00:00.000Z",
      updatedAt: "2026-05-16T12:00:00.000Z"
    };
    const frontDesk = {
      ...trainer,
      membershipId: "membership-front-desk",
      userId: "front-desk-1",
      email: "frontdesk@example.com",
      firstName: "Demo",
      lastName: "Frontdesk",
      roleId: "role-front-desk",
      roleName: RoleName.FrontDesk
    };
    const view = buildStaffShiftCalendarView({
      staff: [trainer, frontDesk],
      roles: [...roles, { id: "role-front-desk", name: RoleName.FrontDesk, label: "Front desk" }],
      locations: [
        { id: "main", name: "Main Floor" },
        { id: "annex", name: "Annex" }
      ],
      weekStartsAt: "2026-05-18T10:00:00.000Z",
      today: "2026-05-18T12:00:00.000Z",
      shifts: [
        {
          id: "shift-1",
          gymId: "gym-1",
          userId: "trainer-1",
          locationId: "main",
          roleId: "role-trainer",
          startsAt: "2026-05-18T13:00:00.000Z",
          endsAt: "2026-05-18T21:00:00.000Z",
          createdByUserId: "owner-1",
          createdAt: "2026-05-16T12:00:00.000Z",
          updatedAt: "2026-05-16T12:00:00.000Z"
        },
        {
          id: "shift-2",
          gymId: "gym-1",
          userId: "trainer-1",
          locationId: "main",
          roleId: "role-trainer",
          startsAt: "2026-05-18T20:00:00.000Z",
          endsAt: "2026-05-18T23:00:00.000Z",
          createdByUserId: "owner-1",
          createdAt: "2026-05-16T12:00:00.000Z",
          updatedAt: "2026-05-16T12:00:00.000Z"
        },
        {
          id: "shift-3",
          gymId: "gym-1",
          userId: "front-desk-1",
          locationId: "annex",
          roleId: "role-front-desk",
          startsAt: "2026-05-19T14:00:00.000Z",
          endsAt: "2026-05-19T18:00:00.000Z",
          createdByUserId: "owner-1",
          createdAt: "2026-05-16T12:00:00.000Z",
          updatedAt: "2026-05-16T12:00:00.000Z"
        },
        {
          id: "shift-outside-week",
          gymId: "gym-1",
          userId: "trainer-1",
          roleId: "role-trainer",
          startsAt: "2026-05-27T13:00:00.000Z",
          endsAt: "2026-05-27T21:00:00.000Z",
          createdByUserId: "owner-1",
          createdAt: "2026-05-16T12:00:00.000Z",
          updatedAt: "2026-05-16T12:00:00.000Z"
        }
      ]
    });
    const filtered = buildStaffShiftCalendarView({
      staff: [trainer, frontDesk],
      shifts: view.visibleShifts,
      weekStartsAt: "2026-05-18T00:00:00.000Z",
      selectedLocationId: "annex"
    });
    const empty = buildStaffShiftCalendarView({
      staff: [trainer],
      shifts: [],
      weekStartsAt: "2026-05-18T00:00:00.000Z"
    });

    expect(view.screen).toBe("staff_shift_calendar");
    expect(view.weekStartsAt).toBe("2026-05-18T00:00:00.000Z");
    expect(view.weekEndsAt).toBe("2026-05-24T00:00:00.000Z");
    expect(view.days).toHaveLength(7);
    expect(view.dayCount).toBe(7);
    expect(view.days[0]?.isToday).toBe(true);
    expect(view.days[0]?.shifts.map((shift) => shift.id)).toEqual(["shift-1", "shift-2"]);
    expect(view.days[0]?.overlappingShiftCount).toBe(2);
    expect(view.days[1]?.shifts[0]?.staffName).toBe("Demo Frontdesk");
    expect(view.visibleShifts[0]?.startsAtTime).toBe("13:00");
    expect(view.visibleShifts[0]?.endsAtTime).toBe("21:00");
    expect(view.visibleShifts[0]?.durationMinutes).toBe(480);
    expect(view.visibleShifts[0]?.roleLabel).toBe("Trainer");
    expect(view.visibleShifts[0]?.locationLabel).toBe("Main Floor");
    expect(view.totalShiftCount).toBe(3);
    expect(view.totalShiftMinutes).toBe(900);
    expect(view.overlappingShiftCount).toBe(2);
    expect(view.staffOptionCount).toBe(2);
    expect(view.locationOptionCount).toBe(2);
    expect(view.summaryLabel).toBe("3 scheduled shifts");
    expect(view.previousWeekAction.icon).toBe("chevron-left");
    expect(view.nextWeekAction.icon).toBe("chevron-right");
    expect(view.createShiftAction.icon).toBe("calendar-plus");
    expect(filtered.selectedLocationId).toBe("annex");
    expect(filtered.summaryLabel).toBe("1 scheduled shift");
    expect(filtered.visibleShifts.map((shift) => shift.id)).toEqual(["shift-3"]);
    expect(empty.summaryLabel).toBe("No scheduled shifts");
    expect(empty.empty?.title).toBe("No shifts scheduled");
  });

  it("builds staff shift conflict detection", () => {
    const trainer = {
      membershipId: "membership-trainer",
      gymId: "gym-1",
      userId: "trainer-1",
      email: "trainer@example.com",
      firstName: "Demo",
      lastName: "Trainer",
      roleId: "role-trainer",
      roleName: RoleName.Trainer,
      status: UserStatus.Active,
      createdAt: "2026-05-16T12:00:00.000Z",
      updatedAt: "2026-05-16T12:00:00.000Z"
    };
    const frontDesk = {
      ...trainer,
      membershipId: "membership-front-desk",
      userId: "front-desk-1",
      email: "frontdesk@example.com",
      firstName: "Demo",
      lastName: "Frontdesk",
      roleId: "role-front-desk",
      roleName: RoleName.FrontDesk
    };
    const report = buildStaffShiftConflictReport({
      staff: [trainer, frontDesk],
      availabilityByUserId: {
        "trainer-1": [{ day: "mon", startsAt: "09:00", endsAt: "17:00", locationId: "main" }],
        "front-desk-1": [{ day: "tue", startsAt: "09:00", endsAt: "17:00" }]
      },
      shifts: [
        {
          id: "shift-1",
          gymId: "gym-1",
          userId: "trainer-1",
          locationId: "main",
          roleId: "role-trainer",
          startsAt: "2026-05-18T13:00:00.000Z",
          endsAt: "2026-05-18T21:00:00.000Z",
          createdByUserId: "owner-1",
          createdAt: "2026-05-16T12:00:00.000Z",
          updatedAt: "2026-05-16T12:00:00.000Z"
        },
        {
          id: "shift-2",
          gymId: "gym-1",
          userId: "trainer-1",
          locationId: "main",
          roleId: "role-trainer",
          startsAt: "2026-05-18T20:00:00.000Z",
          endsAt: "2026-05-18T23:00:00.000Z",
          createdByUserId: "owner-1",
          createdAt: "2026-05-16T12:00:00.000Z",
          updatedAt: "2026-05-16T12:00:00.000Z"
        },
        {
          id: "shift-3",
          gymId: "gym-1",
          userId: "front-desk-1",
          locationId: "annex",
          roleId: "role-front-desk",
          startsAt: "2026-05-21T14:00:00.000Z",
          endsAt: "2026-05-21T18:00:00.000Z",
          createdByUserId: "owner-1",
          createdAt: "2026-05-16T12:00:00.000Z",
          updatedAt: "2026-05-16T12:00:00.000Z"
        },
        {
          id: "shift-invalid",
          gymId: "gym-1",
          userId: "front-desk-1",
          roleId: "role-front-desk",
          startsAt: "2026-05-22T18:00:00.000Z",
          endsAt: "2026-05-22T14:00:00.000Z",
          createdByUserId: "owner-1",
          createdAt: "2026-05-16T12:00:00.000Z",
          updatedAt: "2026-05-16T12:00:00.000Z"
        }
      ]
    });
    const clean = buildStaffShiftConflictReport({
      staff: [trainer],
      availabilityByUserId: {
        "trainer-1": [{ day: "mon", startsAt: "09:00", endsAt: "17:00" }]
      },
      shifts: [
        {
          id: "shift-clean",
          gymId: "gym-1",
          userId: "trainer-1",
          roleId: "role-trainer",
          startsAt: "2026-05-18T13:00:00.000Z",
          endsAt: "2026-05-18T17:00:00.000Z",
          createdByUserId: "owner-1",
          createdAt: "2026-05-16T12:00:00.000Z",
          updatedAt: "2026-05-16T12:00:00.000Z"
        }
      ]
    });

    expect(report.screen).toBe("staff_shift_conflict_detection");
    expect(report.conflictCount).toBe(5);
    expect(report.blockingCount).toBe(2);
    expect(report.warningCount).toBe(3);
    expect(report.hasBlockingConflicts).toBe(true);
    expect(report.summaryLabel).toBe("5 shift conflicts");
    expect(report.conflicts.map((conflict) => conflict.kind)).toEqual([
      "overlapping_shift",
      "invalid_shift_time",
      "outside_availability",
      "outside_availability",
      "outside_availability"
    ]);
    expect(report.conflicts[0]?.shiftIds).toEqual(["shift-1", "shift-2"]);
    expect(report.conflicts[0]?.startsAt).toBe("2026-05-18T20:00:00.000Z");
    expect(report.conflicts[0]?.endsAt).toBe("2026-05-18T21:00:00.000Z");
    expect(report.conflicts[0]?.resolutionAction.intent).toBe("danger");
    expect(report.affectedStaffIds).toEqual(["front-desk-1", "trainer-1"]);
    expect(report.affectedShiftIds).toEqual(["shift-1", "shift-2", "shift-3", "shift-invalid"]);
    expect(report.reviewAction.disabled).toBe(false);
    expect(clean.conflicts).toEqual([]);
    expect(clean.conflictCount).toBe(0);
    expect(clean.summaryLabel).toBe("No shift conflicts detected");
    expect(clean.empty?.title).toBe("No shift conflicts");
    expect(clean.reviewAction.disabled).toBe(true);
  });

  it("builds staff task assignment model and list view", () => {
    const trainer = {
      membershipId: "membership-trainer",
      gymId: "gym-1",
      userId: "trainer-1",
      email: "trainer@example.com",
      firstName: "Demo",
      lastName: "Trainer",
      roleId: "role-trainer",
      roleName: RoleName.Trainer,
      status: UserStatus.Active,
      createdAt: "2026-05-16T12:00:00.000Z",
      updatedAt: "2026-05-16T12:00:00.000Z"
    };
    const disabled = {
      ...trainer,
      membershipId: "membership-disabled",
      userId: "disabled-1",
      email: "disabled@example.com",
      firstName: "Disabled",
      lastName: "Staff",
      status: UserStatus.Disabled
    };
    const assignment = buildStaffTaskAssignmentModel({
      staff: [trainer, disabled],
      title: "  Call new lead  ",
      description: " Follow up after tour ",
      selectedAssigneeId: "trainer-1",
      priority: "urgent",
      dueAt: "2026-05-18T18:00:00.000Z"
    });
    const invalidAssignment = buildStaffTaskAssignmentModel({
      staff: [trainer],
      title: "Call member",
      selectedAssigneeId: "trainer-1",
      dueAt: "not-a-date"
    });
    const submission = createStaffTaskAssignmentSubmission({
      title: "  Call new lead  ",
      assignedToUserId: "trainer-1",
      priority: "high",
      description: "  Follow up   after tour ",
      dueAt: "2026-05-18T18:00:00.000Z"
    });
    const tasks = [
      {
        id: "task-1",
        gymId: "gym-1",
        title: "Call new lead",
        description: "Follow up after tour",
        assignedToUserId: "trainer-1",
        createdByUserId: "owner-1",
        priority: "urgent" as const,
        status: "open" as const,
        dueAt: "2026-05-17T18:00:00.000Z",
        createdAt: "2026-05-16T12:00:00.000Z",
        updatedAt: "2026-05-16T12:00:00.000Z"
      },
      {
        id: "task-2",
        gymId: "gym-1",
        title: "Clean studio",
        assignedToUserId: "disabled-1",
        createdByUserId: "trainer-1",
        priority: "normal" as const,
        status: "in_progress" as const,
        dueAt: "2026-05-18T18:00:00.000Z",
        createdAt: "2026-05-16T12:00:00.000Z",
        updatedAt: "2026-05-16T12:00:00.000Z"
      },
      {
        id: "task-3",
        gymId: "gym-1",
        title: "Archive checklist",
        assignedToUserId: "trainer-1",
        createdByUserId: "trainer-1",
        priority: "low" as const,
        status: "completed" as const,
        completedAt: "2026-05-16T18:00:00.000Z",
        createdAt: "2026-05-16T12:00:00.000Z",
        updatedAt: "2026-05-16T18:00:00.000Z"
      }
    ];
    const list = buildStaffTaskListView({
      staff: [trainer, disabled],
      tasks,
      today: "2026-05-18T12:00:00.000Z",
      filters: { query: "lead", priority: "urgent" }
    });
    const empty = buildStaffTaskListView({
      staff: [trainer],
      tasks: [],
      today: "2026-05-18T12:00:00.000Z",
      canCreateTask: false
    });

    expect(assignment.screen).toBe("staff_task_assignment");
    expect(assignment.fields.title.value).toBe("Call new lead");
    expect(assignment.fields.description.value).toBe("Follow up after tour");
    expect(assignment.assigneeOptionCount).toBe(2);
    expect(assignment.selectedAssigneeId).toBe("trainer-1");
    expect(assignment.assigneeOptions.find((option) => option.id === "disabled-1")?.disabled).toBe(
      true
    );
    expect(assignment.priorityOptions.find((option) => option.value === "urgent")?.selected).toBe(
      true
    );
    expect(assignment.summaryLabel).toBe("Task assignment ready");
    expect(assignment.canSubmit).toBe(true);
    expect(invalidAssignment.summaryLabel).toBe("Task due date is invalid");
    expect(invalidAssignment.canSubmit).toBe(false);
    expect(invalidAssignment.fields.dueAt.error).toBe("Due date must be a valid date.");
    expect(submission).toEqual({
      title: "Call new lead",
      assignedToUserId: "trainer-1",
      priority: "high",
      description: "Follow up after tour",
      dueAt: "2026-05-18T18:00:00.000Z"
    });
    expect(list.screen).toBe("staff_task_list");
    expect(list.rows.map((row) => row.id)).toEqual(["task-1"]);
    expect(list.rows[0]?.assigneeName).toBe("Demo Trainer");
    expect(list.rows[0]?.creatorName).toBe("Unknown staff");
    expect(list.rows[0]?.priorityLabel).toBe("Urgent");
    expect(list.rows[0]?.dueState).toBe("overdue");
    expect(list.rows[0]?.dueLabel).toBe("Overdue");
    expect(list.rows[0]?.completeAction.disabled).toBe(false);
    expect(list.rowCount).toBe(1);
    expect(list.summaryLabel).toBe("1 staff task shown");
    expect(list.summary).toMatchObject({
      totalCount: 3,
      visibleCount: 1,
      openCount: 1,
      inProgressCount: 1,
      overdueCount: 1,
      completedCount: 1
    });
    expect(empty.rowCount).toBe(0);
    expect(empty.summaryLabel).toBe("No staff tasks");
    expect(empty.empty?.title).toBe("No staff tasks");
    expect(empty.createTaskAction.disabled).toBe(true);
  });

  it("builds staff task completion flow and submission", () => {
    const trainer = {
      membershipId: "membership-trainer",
      gymId: "gym-1",
      userId: "trainer-1",
      email: "trainer@example.com",
      firstName: "Demo",
      lastName: "Trainer",
      roleId: "role-trainer",
      roleName: RoleName.Trainer,
      status: UserStatus.Active,
      createdAt: "2026-05-16T12:00:00.000Z",
      updatedAt: "2026-05-16T12:00:00.000Z"
    };
    const task = {
      id: "task-1",
      gymId: "gym-1",
      title: "Call new lead",
      assignedToUserId: "trainer-1",
      createdByUserId: "owner-1",
      priority: "urgent" as const,
      status: "in_progress" as const,
      dueAt: "2026-05-17T18:00:00.000Z",
      createdAt: "2026-05-16T12:00:00.000Z",
      updatedAt: "2026-05-16T12:00:00.000Z"
    };
    const flow = buildStaffTaskCompletionFlow({
      task,
      staff: [trainer],
      completedByUserId: "trainer-1",
      completedAt: "2026-05-18T18:00:00.000Z",
      note: "  Lead booked consultation  "
    });
    const completed = buildStaffTaskCompletionFlow({
      task: {
        ...task,
        status: "completed" as const,
        completedAt: "2026-05-17T18:00:00.000Z"
      },
      staff: [trainer],
      completedByUserId: "trainer-1",
      completedAt: "2026-05-18T18:00:00.000Z"
    });
    const missingActor = buildStaffTaskCompletionFlow({
      task,
      staff: [trainer],
      completedAt: "2026-05-18T18:00:00.000Z"
    });
    const submission = createStaffTaskCompletionSubmission({
      taskId: "task-1",
      completedByUserId: "trainer-1",
      completedAt: "2026-05-18T18:00:00.000Z",
      note: "  Lead booked   consultation  "
    });

    expect(flow.screen).toBe("staff_task_completion");
    expect(flow.assigneeName).toBe("Demo Trainer");
    expect(flow.creatorName).toBe("Unknown staff");
    expect(flow.noteField.value).toBe("Lead booked consultation");
    expect(flow.noteLength).toBe(24);
    expect(flow.summaryLabel).toBe("Task completion ready with note");
    expect(flow.canComplete).toBe(true);
    expect(flow.completeAction.disabled).toBe(false);
    expect(completed.canComplete).toBe(false);
    expect(completed.noteLength).toBe(0);
    expect(completed.summaryLabel).toBe("Task is already completed.");
    expect(completed.blockedReason).toBe("Task is already completed.");
    expect(missingActor.summaryLabel).toBe("A completing staff member is required.");
    expect(missingActor.blockedReason).toBe("A completing staff member is required.");
    expect(submission).toEqual({
      taskId: "task-1",
      completedByUserId: "trainer-1",
      completedAt: "2026-05-18T18:00:00.000Z",
      note: "Lead booked consultation"
    });
  });

  it("creates normalized invite submissions and blocks missing role selection", () => {
    const screen = buildStaffInviteFlow({
      roles,
      email: "frontdesk@example.com",
      invites: []
    });
    const submission = createStaffInviteSubmission({
      email: " FrontDesk@Example.com ",
      roleId: "role-manager",
      message: " Welcome "
    });

    expect(screen.roleOptionCount).toBe(2);
    expect(screen.pendingInviteCount).toBe(0);
    expect(screen.expiredInviteCount).toBe(0);
    expect(screen.summaryLabel).toBe("No pending invites");
    expect(screen.selectedRoleId).toBeUndefined();
    expect(screen.empty?.title).toBe("No pending invites");
    expect(screen.empty?.body).toContain("role-based access");
    expect(screen.table.empty?.title).toBe("No pending invites");
    expect(screen.action.label).toBe("Send invite");
    expect(screen.canSubmit).toBe(false);
    expect(screen.action.disabled).toBe(true);
    expect(submission).toEqual({
      email: "frontdesk@example.com",
      roleId: "role-manager",
      message: "Welcome"
    });
  });

  it("builds accept invite state and normalized acceptance submission", () => {
    const screen = buildStaffInviteAcceptScreen({
      token: " invite-token ",
      firstName: " Demo ",
      lastName: " Frontdesk ",
      password: "Password123"
    });
    const empty = buildStaffInviteAcceptScreen({});
    const invalid = buildStaffInviteAcceptScreen({
      token: " invite-token ",
      firstName: " Demo ",
      password: "short"
    });
    const submission = createStaffInviteAcceptanceSubmission({
      token: " invite-token ",
      firstName: " Demo ",
      lastName: " Frontdesk ",
      password: "Password123"
    });

    expect(screen.screen).toBe("staff_invite_accept");
    expect(screen.token).toBe("invite-token");
    expect(screen.firstNameField.value).toBe("Demo");
    expect(screen.firstNameField.name).toBe("firstName");
    expect(screen.firstNameField.label).toBe("First name");
    expect(screen.firstNameField.type).toBe("text");
    expect(screen.firstNameField.required).toBe(true);
    expect(screen.lastNameField.value).toBe("Frontdesk");
    expect(screen.lastNameField.name).toBe("lastName");
    expect(screen.lastNameField.label).toBe("Last name");
    expect(screen.lastNameField.type).toBe("text");
    expect(screen.lastNameField.required).toBe(true);
    expect(screen.passwordField.value).toBe("Password123");
    expect(screen.passwordField.name).toBe("password");
    expect(screen.passwordField.label).toBe("Password");
    expect(screen.passwordField.type).toBe("password");
    expect(screen.passwordField.required).toBe(true);
    expect(screen.fields).toEqual([
      screen.firstNameField,
      screen.lastNameField,
      screen.passwordField
    ]);
    expect(screen.completedFieldCount).toBe(3);
    expect(screen.summaryLabel).toBe("3 of 3 required fields completed");
    expect(screen.passwordValid).toBe(true);
    expect(screen.canSubmit).toBe(true);
    expect(screen.action.label).toBe("Accept invite");
    expect(screen.action.disabled).toBe(false);
    expect(empty.token).toBe("");
    expect(empty.completedFieldCount).toBe(0);
    expect(empty.summaryLabel).toBe("Complete all required fields");
    expect(empty.passwordValid).toBe(false);
    expect(empty.errorMessage).toBe("Invite token is required.");
    expect(empty.action.label).toBe("Accept invite");
    expect(empty.action.disabled).toBe(true);
    expect(invalid.completedFieldCount).toBe(2);
    expect(invalid.summaryLabel).toBe("2 of 3 required fields completed");
    expect(invalid.passwordValid).toBe(false);
    expect(invalid.passwordField.error).toContain("at least 10 characters");
    expect(invalid.errorMessage).toContain("First and last name are required");
    expect(invalid.canSubmit).toBe(false);
    expect(invalid.action.disabled).toBe(true);
    expect(submission).toEqual({
      token: "invite-token",
      firstName: "Demo",
      lastName: "Frontdesk",
      password: "Password123"
    });
  });

  it("builds staff permission editing and removal state", () => {
    const screen = buildStaffPermissionsScreen({
      roles,
      currentUserId: "owner-1",
      ownerUserId: "owner-1",
      selectedUserId: "trainer-1",
      selectedRoleId: "role-manager",
      removalUserId: "trainer-1",
      removalReason: " Seasonal team ended ",
      permissions: [Permission.StaffRead, Permission.StaffRoleAssign, Permission.StaffRemove],
      auditEntries: [
        {
          id: "audit-1",
          gymId: "gym-1",
          actorUserId: "owner-1",
          targetUserId: "trainer-1",
          action: StaffAuditAction.RoleChanged,
          previousRoleId: "role-frontdesk",
          nextRoleId: "role-trainer",
          createdAt: "2026-05-16T12:00:00.000Z"
        }
      ],
      staff: [
        {
          membershipId: "membership-owner",
          gymId: "gym-1",
          userId: "owner-1",
          email: "owner@example.com",
          firstName: "Demo",
          lastName: "Owner",
          roleId: "role-owner",
          roleName: RoleName.Owner,
          status: UserStatus.Active,
          createdAt: "2026-05-16T12:00:00.000Z",
          updatedAt: "2026-05-16T12:00:00.000Z"
        },
        {
          membershipId: "membership-trainer",
          gymId: "gym-1",
          userId: "trainer-1",
          email: "trainer@example.com",
          firstName: "Demo",
          lastName: "Trainer",
          roleId: "role-trainer",
          roleName: RoleName.Trainer,
          status: UserStatus.Active,
          createdAt: "2026-05-16T12:00:00.000Z",
          updatedAt: "2026-05-16T12:00:00.000Z"
        }
      ]
    });
    const roleSubmission = createStaffPermissionChangeSubmission({
      userId: "trainer-1",
      roleId: "role-manager"
    });
    const removalSubmission = createStaffAccessRemovalSubmission({
      userId: "trainer-1",
      reason: " Seasonal team ended "
    });

    expect(screen.roleOptions.map((role) => role.name)).toEqual([
      RoleName.Manager,
      RoleName.Trainer
    ]);
    expect(screen.totalStaffCount).toBe(2);
    expect(screen.editableStaffCount).toBe(1);
    expect(screen.removableStaffCount).toBe(1);
    expect(screen.auditEntryCount).toBe(1);
    expect(screen.summaryLabel).toBe("1 editable staff member");
    expect(screen.selectedStaffName).toBe("Demo Trainer");
    expect(screen.rows.find((row) => row.userId === "owner-1")?.locked).toBe(true);
    expect(screen.rows.find((row) => row.userId === "owner-1")?.lockedReason).toContain("Owners");
    expect(screen.rows.find((row) => row.userId === "trainer-1")?.canRemove).toBe(true);
    expect(screen.rows.find((row) => row.userId === "trainer-1")?.selected).toBe(true);
    expect(screen.rows.find((row) => row.userId === "trainer-1")?.roleLabel).toBe("Manager");
    expect(screen.rows.find((row) => row.userId === "trainer-1")?.statusLabel).toBe("Active");
    expect(screen.canSubmitRoleChange).toBe(true);
    expect(screen.saveAction.disabled).toBe(false);
    expect(screen.removeAction.disabled).toBe(false);
    expect(screen.reasonField.value).toBe("Seasonal team ended");
    expect(screen.removalModal.body).toContain("trainer@example.com");
    expect(screen.auditTrail).toHaveLength(1);
    expect(screen.table.columns.map((column) => column.key)).toEqual([
      "fullName",
      "email",
      "roleLabel",
      "statusLabel"
    ]);
    expect(roleSubmission).toEqual({ userId: "trainer-1", roleId: "role-manager" });
    expect(removalSubmission).toEqual({
      userId: "trainer-1",
      reason: "Seasonal team ended"
    });
  });

  it("builds empty staff permission state", () => {
    const screen = buildStaffPermissionsScreen({
      staff: [],
      roles,
      permissions: [Permission.StaffRead]
    });

    expect(screen.rows).toHaveLength(0);
    expect(screen.totalStaffCount).toBe(0);
    expect(screen.summaryLabel).toBe("No staff access configured");
    expect(screen.empty?.title).toBe("No staff access to manage");
    expect(screen.table.empty?.title).toBe("No staff access to manage");
    expect(screen.canSubmitRoleChange).toBe(false);
    expect(screen.saveAction.disabled).toBe(true);
    expect(screen.removeAction.disabled).toBe(true);
  });

  it("builds custom role create and edit screens", () => {
    const createScreen = buildCustomRoleCreateScreen({
      name: " Operations Lead ",
      selectedPermissions: [Permission.GymRead, Permission.MemberRead, Permission.PlatformAdmin]
    });
    const editScreen = buildCustomRoleEditScreen({
      role: {
        id: "role-custom",
        name: "Operations Lead",
        label: "Operations Lead",
        permissions: [Permission.GymRead, Permission.MemberRead],
        isSystem: false
      },
      selectedPermissions: [Permission.GymRead, Permission.StaffRead]
    });
    const lockedSystemRole = buildCustomRoleEditScreen({
      role: {
        id: "role-manager",
        name: RoleName.Manager,
        label: "Manager",
        permissions: [Permission.GymRead, Permission.StaffRead],
        isSystem: true
      }
    });
    const invalidCreateScreen = buildCustomRoleCreateScreen({
      name: " A ",
      selectedPermissions: []
    });
    const submission = createCustomRoleSubmission({
      name: " Operations Lead ",
      permissions: [Permission.GymRead, Permission.MemberRead, Permission.MemberRead]
    });

    expect(createScreen.screen).toBe("custom_role_create");
    expect(createScreen.nameField.value).toBe("Operations Lead");
    expect(createScreen.nameField.name).toBe("name");
    expect(createScreen.nameField.label).toBe("Role name");
    expect(createScreen.nameField.type).toBe("text");
    expect(createScreen.nameField.required).toBe(true);
    expect(createScreen.selectedPermissions).toEqual([Permission.GymRead, Permission.MemberRead]);
    expect(createScreen.selectedPermissionCount).toBe(2);
    expect(createScreen.availablePermissionCount).toBe(29);
    expect(createScreen.disabledPermissionCount).toBe(1);
    expect(createScreen.summaryLabel).toBe("2 permissions selected");
    expect(createScreen.action.label).toBe("Create role");
    expect(createScreen.action.disabled).toBe(false);
    expect(createScreen.permissionGroups.map((group) => group.key)).toEqual([
      "gym",
      "locations",
      "staff",
      "members",
      "classes",
      "scheduler",
      "operations"
    ]);
    expect(createScreen.permissionGroups.map((group) => group.label)).toEqual([
      "Gym",
      "Locations",
      "Staff",
      "Members",
      "Classes",
      "Scheduler",
      "Operations"
    ]);
    expect(createScreen.permissionGroups.find((group) => group.key === "gym")?.availableCount).toBe(2);
    expect(createScreen.permissionGroups.find((group) => group.key === "gym")?.selectedCount).toBe(1);
    expect(createScreen.permissionGroups.find((group) => group.key === "members")?.summaryLabel).toBe(
      "1 of 4 selected"
    );
    expect(createScreen.permissionGroups.find((group) => group.key === "gym")?.toggles[0]).toMatchObject({
      permission: Permission.GymRead,
      label: "View gym",
      group: "gym",
      checked: true,
      disabled: false
    });
    expect(createScreen.permissionGroups.find((group) => group.key === "operations")?.toggles.at(-1)).toMatchObject({
      permission: Permission.PlatformAdmin,
      label: "Platform admin",
      group: "operations",
      checked: false,
      disabled: true
    });
    expect(createScreen.canSubmit).toBe(true);
    expect(
      createScreen.permissionGroups
        .flatMap((group) => group.toggles)
        .find((toggle) => toggle.permission === Permission.PlatformAdmin)?.disabled
    ).toBe(true);
    expect(editScreen.screen).toBe("custom_role_edit");
    expect(editScreen.roleId).toBe("role-custom");
    expect(editScreen.roleLabel).toBe("Operations Lead");
    expect(editScreen.selectedPermissions).toEqual([Permission.GymRead, Permission.StaffRead]);
    expect(editScreen.summaryLabel).toBe("2 permissions selected");
    expect(editScreen.action.label).toBe("Save role");
    expect(editScreen.action.disabled).toBe(false);
    expect(editScreen.nameField.error).toBeUndefined();
    expect(lockedSystemRole.canSubmit).toBe(false);
    expect(lockedSystemRole.action.disabled).toBe(true);
    expect(lockedSystemRole.nameField.error).toContain("System");
    expect(lockedSystemRole.lockedReason).toContain("System");
    expect(lockedSystemRole.disabledPermissionCount).toBe(30);
    expect(
      lockedSystemRole.permissionGroups.every((group) => group.toggles.every((toggle) => toggle.disabled))
    ).toBe(true);
    expect(invalidCreateScreen.canSubmit).toBe(false);
    expect(invalidCreateScreen.action.disabled).toBe(true);
    expect(invalidCreateScreen.nameField.error).toContain("at least 2 characters");
    expect(invalidCreateScreen.summaryLabel).toBe("No permissions selected");
    expect(invalidCreateScreen.permissionGroups.find((group) => group.key === "gym")?.summaryLabel).toBe(
      "0 of 2 selected"
    );
    expect(submission).toEqual({
      name: "Operations Lead",
      permissions: [Permission.GymRead, Permission.MemberRead],
      createsReservableResource: false
    });
  });

  it("builds restricted dashboard views for trainer and front desk roles", () => {
    const trainerView = buildTrainerRestrictedView();
    const frontDeskView = buildFrontDeskRestrictedView();

    expect(trainerView.screen).toBe("restricted_dashboard");
    expect(trainerView.roleName).toBe(RoleName.Trainer);
    expect(trainerView.activePath).toBe("/classes");
    expect(trainerView.permissions).toEqual([
      Permission.GymRead,
      Permission.LocationRead,
      Permission.StaffDirectoryView,
      Permission.MemberRead,
      Permission.ClassRead,
      Permission.ClassWrite,
      Permission.BookingRead,
      Permission.BookingWrite
    ]);
    expect(trainerView.visibleRoutes).toEqual(["/", "/locations", "/consumers", "/classes"]);
    expect(trainerView.visibleRouteCount).toBe(4);
    expect(trainerView.hiddenRoutes).toContain("/check-ins");
    expect(trainerView.hiddenRoutes).toContain("/settings");
    expect(trainerView.hiddenRouteCount).toBe(5);
    expect(trainerView.summaryLabel).toBe("4 dashboard routes available");
    expect(trainerView.navItems.map((item) => item.label)).toEqual([
      "Dashboard",
      "Locations",
      "Consumers",
      "Classes"
    ]);
    expect(trainerView.navItems.find((item) => item.href === "/classes")?.active).toBe(true);
    expect(trainerView.navItems.find((item) => item.href === "/classes")?.requiredPermissions).toEqual([
      Permission.ClassRead
    ]);
    expect(trainerView.primaryActionCount).toBe(2);
    expect(trainerView.primaryActions.map((action) => action.label)).toEqual([
      "Manage classes",
      "Book member"
    ]);
    expect(trainerView.primaryActions.map((action) => action.intent)).toEqual([
      "primary",
      "secondary"
    ]);
    expect(trainerView.primaryActions.every((action) => !action.disabled)).toBe(true);
    expect(frontDeskView.screen).toBe("restricted_dashboard");
    expect(frontDeskView.roleName).toBe(RoleName.FrontDesk);
    expect(frontDeskView.activePath).toBe("/check-ins");
    expect(frontDeskView.permissions).toEqual([
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
    ]);
    expect(frontDeskView.visibleRoutes).toContain("/check-ins");
    expect(frontDeskView.visibleRoutes).toContain("/access-control");
    expect(frontDeskView.visibleRouteCount).toBe(6);
    expect(frontDeskView.hiddenRoutes).toContain("/reports");
    expect(frontDeskView.hiddenRoutes).toContain("/settings");
    expect(frontDeskView.hiddenRouteCount).toBe(3);
    expect(frontDeskView.summaryLabel).toBe("6 dashboard routes available");
    expect(frontDeskView.navItems.map((item) => item.label)).toEqual([
      "Dashboard",
      "Locations",
      "Consumers",
      "Classes",
      "Check-Ins",
      "Access Control"
    ]);
    expect(frontDeskView.navItems.find((item) => item.href === "/check-ins")?.active).toBe(true);
    expect(
      frontDeskView.navItems.find((item) => item.href === "/access-control")?.requiredPermissions
    ).toEqual([Permission.AccessRead]);
    expect(frontDeskView.primaryActionCount).toBe(3);
    expect(frontDeskView.primaryActions.map((action) => action.label)).toEqual([
      "Start check-in",
      "Update member",
      "Take payment"
    ]);
    expect(frontDeskView.primaryActions.map((action) => action.intent)).toEqual([
      "primary",
      "secondary",
      "secondary"
    ]);
    expect(
      frontDeskView.primaryActions.find((action) => action.label === "Take payment")?.disabled
    ).toBe(false);
  });
});
