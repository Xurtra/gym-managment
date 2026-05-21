import { RoleName, UserStatus } from "@gym-platform/constants";
import { button, input } from "@gym-platform/ui";
import type { ButtonModel, InputModel } from "@gym-platform/ui";
import type {
  StaffCreateSubmission,
  StaffEditSubmission,
  StaffMemberView,
  StaffRoleOption
} from "./types.js";

export interface StaffCreateRoleOption extends StaffRoleOption {
  selected: boolean;
  disabled: boolean;
}

export interface StaffCreateMemberForm {
  screen: "staff_create_member";
  fields: {
    firstName: InputModel;
    lastName: InputModel;
    email: InputModel;
    message: InputModel;
  };
  roleOptions: StaffCreateRoleOption[];
  selectedRoleId?: string;
  canSubmit: boolean;
  submitAction: ButtonModel;
  cancelAction: ButtonModel;
}

export interface StaffEditMemberForm {
  screen: "staff_edit_member";
  staff: StaffMemberView;
  fields: {
    firstName: InputModel;
    lastName: InputModel;
    email: InputModel;
  };
  roleOptions: StaffCreateRoleOption[];
  selectedRoleId: string;
  changedFields: Array<"firstName" | "lastName" | "email" | "roleId">;
  locked: boolean;
  canSubmit: boolean;
  submitAction: ButtonModel;
  cancelAction: ButtonModel;
}

export function buildStaffCreateMemberForm(inputModel: {
  roles: StaffRoleOption[];
  firstName?: string;
  lastName?: string;
  email?: string;
  selectedRoleId?: string;
  message?: string;
}): StaffCreateMemberForm {
  const firstName = inputModel.firstName?.trim() ?? "";
  const lastName = inputModel.lastName?.trim() ?? "";
  const email = inputModel.email?.trim().toLowerCase() ?? "";
  const message = inputModel.message?.trim() ?? "";
  const roleOptions = staffCreateRoleOptions(inputModel.roles, inputModel.selectedRoleId);
  const selectedRole = roleOptions.find((role) => role.selected && !role.disabled);
  const validEmail = isValidEmail(email);
  const canSubmit = Boolean(firstName && lastName && validEmail && selectedRole);

  return {
    screen: "staff_create_member",
    fields: {
      firstName: input({
        name: "firstName",
        label: "First name",
        value: firstName,
        type: "text",
        required: true
      }),
      lastName: input({
        name: "lastName",
        label: "Last name",
        value: lastName,
        type: "text",
        required: true
      }),
      email: input({
        name: "email",
        label: "Email",
        value: email,
        type: "email",
        required: true,
        ...(email && !validEmail ? { error: "Enter a valid email address." } : {})
      }),
      message: input({
        name: "message",
        label: "Invite message",
        value: message,
        type: "text",
        required: false
      })
    },
    roleOptions,
    ...(selectedRole ? { selectedRoleId: selectedRole.id } : {}),
    canSubmit,
    submitAction: button({
      label: "Create staff member",
      icon: "user-plus",
      disabled: !canSubmit
    }),
    cancelAction: button({
      label: "Cancel",
      icon: "x",
      intent: "secondary"
    })
  };
}

export function createStaffMemberSubmission(inputModel: {
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  message?: string;
}): StaffCreateSubmission {
  const submission: StaffCreateSubmission = {
    firstName: inputModel.firstName.trim(),
    lastName: inputModel.lastName.trim(),
    email: inputModel.email.trim().toLowerCase(),
    roleId: inputModel.roleId
  };
  const message = inputModel.message?.trim();
  if (message) {
    submission.message = message;
  }
  return submission;
}

export function buildStaffEditMemberForm(inputModel: {
  staff: StaffMemberView;
  roles: StaffRoleOption[];
  firstName?: string;
  lastName?: string;
  email?: string;
  selectedRoleId?: string;
  locked?: boolean;
}): StaffEditMemberForm {
  const firstName = inputModel.firstName?.trim() ?? inputModel.staff.firstName;
  const lastName = inputModel.lastName?.trim() ?? inputModel.staff.lastName;
  const email = inputModel.email?.trim().toLowerCase() ?? inputModel.staff.email;
  const selectedRoleId = inputModel.selectedRoleId ?? inputModel.staff.roleId;
  const locked = inputModel.locked ?? inputModel.staff.status !== UserStatus.Active;
  const roleOptions = staffCreateRoleOptions(inputModel.roles, selectedRoleId);
  const selectedRole = roleOptions.find((role) => role.selected && !role.disabled);
  const validEmail = isValidEmail(email);
  const changedFields = changedStaffFields(inputModel.staff, {
    firstName,
    lastName,
    email,
    roleId: selectedRoleId
  });
  const canSubmit = Boolean(
    !locked && changedFields.length > 0 && firstName && lastName && validEmail && selectedRole
  );

  return {
    screen: "staff_edit_member",
    staff: inputModel.staff,
    fields: {
      firstName: input({
        name: "firstName",
        label: "First name",
        value: firstName,
        type: "text",
        required: true
      }),
      lastName: input({
        name: "lastName",
        label: "Last name",
        value: lastName,
        type: "text",
        required: true
      }),
      email: input({
        name: "email",
        label: "Email",
        value: email,
        type: "email",
        required: true,
        ...(email && !validEmail ? { error: "Enter a valid email address." } : {})
      })
    },
    roleOptions,
    selectedRoleId,
    changedFields,
    locked,
    canSubmit,
    submitAction: button({
      label: "Save staff member",
      icon: "save",
      disabled: !canSubmit
    }),
    cancelAction: button({
      label: "Cancel",
      icon: "x",
      intent: "secondary"
    })
  };
}

export function createStaffEditSubmission(inputModel: {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
}): StaffEditSubmission {
  return {
    userId: inputModel.userId,
    firstName: inputModel.firstName.trim(),
    lastName: inputModel.lastName.trim(),
    email: inputModel.email.trim().toLowerCase(),
    roleId: inputModel.roleId
  };
}

function staffCreateRoleOptions(roles: StaffRoleOption[], selectedRoleId: string | undefined) {
  return roles
    .filter((role) => role.name !== RoleName.Member && role.name !== RoleName.Owner)
    .map((role) => ({
      ...role,
      selected: role.id === selectedRoleId,
      disabled: role.disabled ?? false
    }));
}

function changedStaffFields(
  staff: StaffMemberView,
  values: {
    firstName: string;
    lastName: string;
    email: string;
    roleId: string;
  }
): StaffEditMemberForm["changedFields"] {
  const changedFields: StaffEditMemberForm["changedFields"] = [];
  if (values.firstName !== staff.firstName) {
    changedFields.push("firstName");
  }
  if (values.lastName !== staff.lastName) {
    changedFields.push("lastName");
  }
  if (values.email !== staff.email) {
    changedFields.push("email");
  }
  if (values.roleId !== staff.roleId) {
    changedFields.push("roleId");
  }
  return changedFields;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
