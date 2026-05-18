import type { ButtonModel, EmptyStateModel, InputModel, TableModel } from "@gym-platform/ui";
import type { StaffInviteEmailSendSubmission, StaffInviteView } from "./types.js";
export type StaffInviteEmailDeliveryStatus = "ready" | "sending" | "sent" | "failed" | "blocked";
export interface StaffInviteEmailDeliveryState {
    inviteId: string;
    status: StaffInviteEmailDeliveryStatus;
    sentAt?: string;
    error?: string;
}
export interface StaffInviteEmailRow extends StaffInviteView {
    deliveryStatus: StaffInviteEmailDeliveryStatus;
    deliveryLabel: string;
    canSend: boolean;
    selected: boolean;
    resendAction: ButtonModel;
}
export interface StaffInviteEmailSendingFlow {
    screen: "staff_invite_email_sending";
    messageField: InputModel;
    rows: StaffInviteEmailRow[];
    selectedInviteIds: string[];
    canSendSelected: boolean;
    canSendAll: boolean;
    sendSelectedAction: ButtonModel;
    sendAllAction: ButtonModel;
    table: TableModel<StaffInviteEmailRow>;
    empty?: EmptyStateModel;
}
export declare function buildStaffInviteEmailSendingFlow(inputModel: {
    invites: StaffInviteView[];
    selectedInviteIds?: string[];
    deliveryStates?: StaffInviteEmailDeliveryState[];
    message?: string;
}): StaffInviteEmailSendingFlow;
export declare function createStaffInviteEmailSendSubmission(inputModel: {
    inviteIds: string[];
    message?: string;
}): StaffInviteEmailSendSubmission;
//# sourceMappingURL=inviteEmail.d.ts.map