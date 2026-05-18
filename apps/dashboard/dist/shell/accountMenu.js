import { Permission } from "@gym-platform/constants";
export function buildAccountMenu(inputModel) {
    const userName = `${inputModel.firstName ?? ""} ${inputModel.lastName ?? ""}`.trim() || inputModel.email;
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
//# sourceMappingURL=accountMenu.js.map