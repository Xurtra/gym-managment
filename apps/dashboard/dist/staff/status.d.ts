import { UserStatus } from "@gym-platform/constants";
import type { ButtonModel, InputModel, ModalModel } from "@gym-platform/ui";
import type { StaffMemberView, StaffStatusChangeSubmission } from "./types.js";
export interface StaffStatusFlow {
    screen: "staff_status_flow";
    staff: StaffMemberView;
    currentStatus: UserStatus;
    nextStatus?: UserStatus;
    locked: boolean;
    canActivate: boolean;
    canDeactivate: boolean;
    canSubmit: boolean;
    reasonField: InputModel;
    activateAction: ButtonModel;
    deactivateAction: ButtonModel;
    cancelAction: ButtonModel;
    confirmationModal: ModalModel;
}
export declare function buildStaffStatusFlow(inputModel: {
    staff: StaffMemberView;
    permissions: string[];
    currentUserId?: string;
    ownerUserId?: string;
    targetStatus?: UserStatus;
    reason?: string;
}): StaffStatusFlow;
export declare function createStaffStatusChangeSubmission(inputModel: {
    userId: string;
    status: UserStatus;
    reason?: string;
}): StaffStatusChangeSubmission;
//# sourceMappingURL=status.d.ts.map