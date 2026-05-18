import { RoleName, StaffInviteStatus } from "@gym-platform/constants";
import { button, input, table } from "@gym-platform/ui";
export function buildStaffInviteFlow(inputModel) {
    const email = inputModel.email?.trim().toLowerCase() ?? "";
    const message = inputModel.message?.trim() ?? "";
    const roleOptions = staffRoleOptions(inputModel.roles).map((role) => ({
        ...role,
        selected: role.id === inputModel.selectedRoleId
    }));
    const selectedRole = roleOptions.find((role) => role.selected && !role.disabled);
    const pendingInvites = inputModel.invites.filter((invite) => invite.status === StaffInviteStatus.Pending);
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
export function createStaffInviteSubmission(inputModel) {
    const submission = {
        email: inputModel.email.trim().toLowerCase(),
        roleId: inputModel.roleId
    };
    const message = inputModel.message?.trim();
    if (message) {
        submission.message = message;
    }
    return submission;
}
export function buildStaffInviteAcceptScreen(inputModel) {
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
export function createStaffInviteAcceptanceSubmission(inputModel) {
    return {
        token: inputModel.token.trim(),
        firstName: inputModel.firstName.trim(),
        lastName: inputModel.lastName.trim(),
        password: inputModel.password
    };
}
function staffRoleOptions(roles) {
    return roles
        .filter((role) => role.name !== RoleName.Member && role.name !== RoleName.Owner)
        .map((role) => ({
        ...role,
        disabled: role.disabled ?? false
    }));
}
//# sourceMappingURL=invites.js.map