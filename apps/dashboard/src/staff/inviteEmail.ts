import { StaffInviteStatus } from "@gym-platform/constants";
import { button, emptyState, input, table } from "@gym-platform/ui";
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

export function buildStaffInviteEmailSendingFlow(inputModel: {
  invites: StaffInviteView[];
  selectedInviteIds?: string[];
  deliveryStates?: StaffInviteEmailDeliveryState[];
  message?: string;
}): StaffInviteEmailSendingFlow {
  const selected = new Set(inputModel.selectedInviteIds ?? []);
  const deliveryStateLookup = new Map(
    (inputModel.deliveryStates ?? []).map((state) => [state.inviteId, state])
  );
  const rows = inputModel.invites.map((invite) =>
    buildInviteEmailRow(invite, selected, deliveryStateLookup.get(invite.id))
  );
  const sendableRows = rows.filter((row) => row.canSend);
  const selectedInviteIds = rows.filter((row) => row.selected).map((row) => row.id);
  const selectedSendableRows = rows.filter((row) => row.selected && row.canSend);
  const empty =
    rows.length === 0
      ? emptyState({
          title: "No invites to email",
          body: "Create a staff invite before sending invite email."
        })
      : undefined;

  return {
    screen: "staff_invite_email_sending",
    messageField: input({
      name: "message",
      label: "Invite email message",
      value: inputModel.message?.trim() ?? "",
      type: "text",
      required: false
    }),
    rows,
    selectedInviteIds,
    canSendSelected: selectedSendableRows.length > 0,
    canSendAll: sendableRows.length > 0,
    sendSelectedAction: button({
      label: "Send selected",
      icon: "send",
      disabled: selectedSendableRows.length === 0
    }),
    sendAllAction: button({
      label: "Send all pending",
      icon: "mail",
      intent: "secondary",
      disabled: sendableRows.length === 0
    }),
    table: table({
      columns: [
        { key: "email", label: "Email" },
        { key: "roleName", label: "Role" },
        { key: "status", label: "Invite status" },
        { key: "deliveryLabel", label: "Email status" }
      ],
      rows,
      ...(empty ? { empty } : {})
    }),
    ...(empty ? { empty } : {})
  };
}

export function createStaffInviteEmailSendSubmission(inputModel: {
  inviteIds: string[];
  message?: string;
}): StaffInviteEmailSendSubmission {
  const submission: StaffInviteEmailSendSubmission = {
    inviteIds: [...new Set(inputModel.inviteIds)]
  };
  const message = inputModel.message?.trim();
  if (message) {
    submission.message = message;
  }
  return submission;
}

function buildInviteEmailRow(
  invite: StaffInviteView,
  selectedInviteIds: Set<string>,
  deliveryState: StaffInviteEmailDeliveryState | undefined
): StaffInviteEmailRow {
  const deliveryStatus = resolveDeliveryStatus(invite, deliveryState);
  const canSend =
    invite.status === StaffInviteStatus.Pending &&
    deliveryStatus !== "sending" &&
    deliveryStatus !== "blocked";
  return {
    ...invite,
    deliveryStatus,
    deliveryLabel: deliveryLabel(deliveryStatus),
    canSend,
    selected: selectedInviteIds.has(invite.id),
    resendAction: button({
      label: deliveryStatus === "failed" ? "Retry email" : "Resend invite",
      icon: "send",
      intent: deliveryStatus === "failed" ? "danger" : "secondary",
      disabled: !canSend
    })
  };
}

function resolveDeliveryStatus(
  invite: StaffInviteView,
  deliveryState: StaffInviteEmailDeliveryState | undefined
): StaffInviteEmailDeliveryStatus {
  if (invite.status !== StaffInviteStatus.Pending) {
    return "blocked";
  }
  return deliveryState?.status ?? "ready";
}

function deliveryLabel(status: StaffInviteEmailDeliveryStatus) {
  switch (status) {
    case "ready":
      return "Ready to send";
    case "sending":
      return "Sending";
    case "sent":
      return "Sent";
    case "failed":
      return "Failed";
    case "blocked":
      return "Not eligible";
    default:
      return String(status);
  }
}
