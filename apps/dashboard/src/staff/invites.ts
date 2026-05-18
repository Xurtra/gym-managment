import { RoleName, StaffInviteStatus } from "@gym-platform/constants";
import { button, input, table } from "@gym-platform/ui";
import type { ButtonModel, InputModel, TableModel } from "@gym-platform/ui";
import type {
  StaffInviteAcceptanceSubmission,
  StaffInviteSubmission,
  StaffInviteView,
  StaffRoleOption
} from "./types.js";

export interface StaffInviteFlowScreen {
  screen: "staff_invite_flow";
  emailField: InputModel;
  messageField: InputModel;
  roleOptions: Array<StaffRoleOption & { selected: boolean }>;
  pendingInvites: StaffInviteView[];
  canSubmit: boolean;
  action: ButtonModel;
  table: TableModel<StaffInviteView>;
}

export interface StaffInviteAcceptScreen {
  screen: "staff_invite_accept";
  token: string;
  fields: InputModel[];
  canSubmit: boolean;
  action: ButtonModel;
}

export function buildStaffInviteFlow(inputModel: {
  roles: StaffRoleOption[];
  invites: StaffInviteView[];
  email?: string;
  selectedRoleId?: string;
  message?: string;
}): StaffInviteFlowScreen {
  const email = inputModel.email?.trim().toLowerCase() ?? "";
  const message = inputModel.message?.trim() ?? "";
  const roleOptions = staffRoleOptions(inputModel.roles).map((role) => ({
    ...role,
    selected: role.id === inputModel.selectedRoleId
  }));
  const selectedRole = roleOptions.find((role) => role.selected && !role.disabled);
  const pendingInvites = inputModel.invites.filter(
    (invite) => invite.status === StaffInviteStatus.Pending
  );
  const canSubmit = Boolean(email && selectedRole);

  return {
    screen: "staff_invite_flow",
    emailField: input({
      name: "email",
      label: "Email",
      value: email,
      type: "email",
      required: true
    }),
    messageField: input({
      name: "message",
      label: "Message",
      value: message,
      type: "text",
      required: false
    }),
    roleOptions,
    pendingInvites,
    canSubmit,
    action: button({ label: "Send invite", disabled: !canSubmit }),
    table: table({
      columns: [
        { key: "email", label: "Email" },
        { key: "roleName", label: "Role" },
        { key: "status", label: "Status" },
        { key: "expiresAt", label: "Expires" }
      ],
      rows: pendingInvites
    })
  };
}

export function createStaffInviteSubmission(inputModel: {
  email: string;
  roleId: string;
  message?: string;
}): StaffInviteSubmission {
  const submission: StaffInviteSubmission = {
    email: inputModel.email.trim().toLowerCase(),
    roleId: inputModel.roleId
  };
  const message = inputModel.message?.trim();
  if (message) {
    submission.message = message;
  }
  return submission;
}

export function buildStaffInviteAcceptScreen(inputModel: {
  token?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
}): StaffInviteAcceptScreen {
  const token = inputModel.token?.trim() ?? "";
  const firstName = inputModel.firstName?.trim() ?? "";
  const lastName = inputModel.lastName?.trim() ?? "";
  const password = inputModel.password ?? "";
  const canSubmit = Boolean(token && firstName && lastName && password.length >= 10);

  return {
    screen: "staff_invite_accept",
    token,
    fields: [
      input({
        name: "firstName",
        label: "First name",
        value: firstName,
        type: "text",
        required: true
      }),
      input({
        name: "lastName",
        label: "Last name",
        value: lastName,
        type: "text",
        required: true
      }),
      input({
        name: "password",
        label: "Password",
        value: password,
        type: "password",
        required: true
      })
    ],
    canSubmit,
    action: button({ label: "Accept invite", disabled: !canSubmit })
  };
}

export function createStaffInviteAcceptanceSubmission(inputModel: {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
}): StaffInviteAcceptanceSubmission {
  return {
    token: inputModel.token.trim(),
    firstName: inputModel.firstName.trim(),
    lastName: inputModel.lastName.trim(),
    password: inputModel.password
  };
}

function staffRoleOptions(roles: StaffRoleOption[]) {
  return roles
    .filter((role) => role.name !== RoleName.Member && role.name !== RoleName.Owner)
    .map((role) => ({
      ...role,
      disabled: role.disabled ?? false
    }));
}
