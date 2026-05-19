import { RoleName, StaffInviteStatus } from "@gym-platform/constants";
import { button, emptyState, input, table } from "@gym-platform/ui";
export function buildStaffInviteFlow(inputModel) {
    const email = inputModel.email?.trim().toLowerCase() ?? "";
    const message = inputModel.message?.trim() ?? "";
    const roleOptions = staffRoleOptions(inputModel.roles).map((role) => ({
        ...role,
        selected: role.id === inputModel.selectedRoleId
    }));
    const selectedRole = roleOptions.find((role) => role.selected && !role.disabled);
    const pendingInvites = inputModel.invites
        .filter((invite) => invite.status === StaffInviteStatus.Pending)
        .slice()
        .sort((left, right) => left.expiresAt.localeCompare(right.expiresAt) || left.email.localeCompare(right.email));
    const expiredInviteCount = inputModel.invites.filter((invite) => invite.status === StaffInviteStatus.Expired).length;
    const canSubmit = Boolean(email && selectedRole);
    const empty = pendingInvites.length === 0
        ? emptyState({
            title: "No pending invites",
            body: "Create a staff invite to start assigning role-based access."
        })
        : undefined;
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
        roleOptionCount: roleOptions.length,
        pendingInviteCount: pendingInvites.length,
        expiredInviteCount,
        summaryLabel: pendingInvites.length === 0
            ? "No pending invites"
            : `${pendingInvites.length} pending invite${pendingInvites.length === 1 ? "" : "s"}`,
        ...(selectedRole ? { selectedRoleId: selectedRole.id, selectedRoleName: selectedRole.label } : {}),
        pendingInvites,
        ...(empty ? { empty } : {}),
        canSubmit,
        action: button({ label: "Send invite", disabled: !canSubmit }),
        table: table({
            columns: [
                { key: "email", label: "Email" },
                { key: "roleName", label: "Role" },
                { key: "status", label: "Status" },
                { key: "expiresAt", label: "Expires" }
            ],
            rows: pendingInvites,
            ...(empty ? { empty } : {})
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
    const passwordValid = password.length >= 10;
    const completedFieldCount = [firstName, lastName, password].filter(Boolean).length;
    const errorMessage = !token
        ? "Invite token is required."
        : !firstName || !lastName
            ? "First and last name are required."
            : !passwordValid
                ? "Password must be at least 10 characters."
                : undefined;
    const canSubmit = Boolean(token && firstName && lastName && passwordValid);
    const firstNameField = input({
        name: "firstName",
        label: "First name",
        value: firstName,
        type: "text",
        required: true
    });
    const lastNameField = input({
        name: "lastName",
        label: "Last name",
        value: lastName,
        type: "text",
        required: true
    });
    const passwordField = input({
        name: "password",
        label: "Password",
        value: password,
        type: "password",
        required: true,
        ...(!passwordValid && password.length > 0
            ? { error: "Password must be at least 10 characters." }
            : {})
    });
    return {
        screen: "staff_invite_accept",
        token,
        firstNameField,
        lastNameField,
        passwordField,
        fields: [firstNameField, lastNameField, passwordField],
        completedFieldCount,
        summaryLabel: completedFieldCount === 0
            ? "Complete all required fields"
            : `${completedFieldCount} of 3 required fields completed`,
        passwordValid,
        ...(errorMessage ? { errorMessage } : {}),
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