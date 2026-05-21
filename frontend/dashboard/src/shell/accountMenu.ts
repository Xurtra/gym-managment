import { Permission } from "@gym-platform/constants";
import type { Permission as PermissionValue } from "@gym-platform/constants";
import type { AccountMenuModel } from "./types.js";

export function buildAccountMenu(inputModel: {
  firstName?: string;
  lastName?: string;
  email: string;
  gymName?: string;
  permissions?: PermissionValue[];
}): AccountMenuModel {
  const userName =
    `${inputModel.firstName ?? ""} ${inputModel.lastName ?? ""}`.trim() || inputModel.email;
  const canOpenSettings = inputModel.permissions?.includes(Permission.GymUpdate) ?? false;
  return {
    userName,
    userEmail: inputModel.email,
    ...(inputModel.gymName ? { gymName: inputModel.gymName } : {}),
    items: [
      {
        key: "profile",
        label: "Profile",
        href: "/profile",
        disabled: false
      },
      {
        key: "settings",
        label: "Settings",
        href: "/settings",
        disabled: !canOpenSettings
      },
      {
        key: "logout",
        label: "Logout",
        action: "logout",
        disabled: false
      }
    ]
  };
}
