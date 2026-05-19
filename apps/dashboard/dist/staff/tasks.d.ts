import type { ButtonModel, EmptyStateModel, InputModel, TableModel } from "@gym-platform/ui";
import type { StaffMemberView, StaffTaskAssignmentSubmission, StaffTaskCompletionSubmission, StaffTaskPriority, StaffTaskStatus, StaffTaskView } from "./types.js";
export interface StaffTaskAssigneeOption {
    id: string;
    label: string;
    selected: boolean;
    disabled: boolean;
}
export interface StaffTaskPriorityOption {
    value: StaffTaskPriority;
    label: string;
    selected: boolean;
}
export interface StaffTaskAssignmentModel {
    screen: "staff_task_assignment";
    fields: {
        title: InputModel;
        description: InputModel;
        dueAt: InputModel;
    };
    assigneeOptions: StaffTaskAssigneeOption[];
    priorityOptions: StaffTaskPriorityOption[];
    assigneeOptionCount: number;
    selectedAssigneeId?: string;
    selectedPriority: StaffTaskPriority;
    summaryLabel: string;
    canSubmit: boolean;
    assignAction: ButtonModel;
    cancelAction: ButtonModel;
}
export interface StaffTaskListFilters {
    query?: string;
    assignedToUserId?: string;
    status?: StaffTaskStatus;
    priority?: StaffTaskPriority;
}
export type StaffTaskDueState = "overdue" | "due_today" | "upcoming" | "no_due";
export interface StaffTaskListRow extends StaffTaskView {
    assigneeName: string;
    creatorName: string;
    priorityLabel: string;
    statusLabel: string;
    dueState: StaffTaskDueState;
    dueLabel: string;
    overdue: boolean;
    detailAction: ButtonModel;
    completeAction: ButtonModel;
    reassignAction: ButtonModel;
}
export interface StaffTaskListView {
    screen: "staff_task_list";
    filters: StaffTaskListFilters & {
        query: string;
    };
    searchField: InputModel;
    assigneeOptions: StaffTaskAssigneeOption[];
    statusOptions: Array<{
        value: StaffTaskStatus;
        label: string;
        selected: boolean;
    }>;
    priorityOptions: StaffTaskPriorityOption[];
    rows: StaffTaskListRow[];
    rowCount: number;
    summaryLabel: string;
    table: TableModel<StaffTaskListRow>;
    summary: {
        totalCount: number;
        visibleCount: number;
        openCount: number;
        inProgressCount: number;
        overdueCount: number;
        completedCount: number;
    };
    createTaskAction: ButtonModel;
    empty?: EmptyStateModel;
}
export interface StaffTaskCompletionFlow {
    screen: "staff_task_completion";
    task: StaffTaskView;
    assigneeName: string;
    creatorName: string;
    completedByUserId?: string;
    completedAt: string;
    noteField: InputModel;
    noteLength: number;
    summaryLabel: string;
    canComplete: boolean;
    blockedReason?: string;
    completeAction: ButtonModel;
    cancelAction: ButtonModel;
}
export declare function buildStaffTaskAssignmentModel(inputModel: {
    staff: StaffMemberView[];
    title?: string;
    description?: string;
    selectedAssigneeId?: string;
    priority?: StaffTaskPriority;
    dueAt?: string;
}): StaffTaskAssignmentModel;
export declare function createStaffTaskAssignmentSubmission(inputModel: {
    title: string;
    assignedToUserId: string;
    priority?: StaffTaskPriority;
    description?: string;
    dueAt?: string;
}): StaffTaskAssignmentSubmission;
export declare function buildStaffTaskCompletionFlow(inputModel: {
    task: StaffTaskView;
    staff: StaffMemberView[];
    completedByUserId?: string;
    completedAt?: string;
    note?: string;
}): StaffTaskCompletionFlow;
export declare function createStaffTaskCompletionSubmission(inputModel: {
    taskId: string;
    completedByUserId: string;
    completedAt: string;
    note?: string;
}): StaffTaskCompletionSubmission;
export declare function buildStaffTaskListView(inputModel: {
    staff: StaffMemberView[];
    tasks: StaffTaskView[];
    filters?: StaffTaskListFilters;
    today?: string;
    canCreateTask?: boolean;
}): StaffTaskListView;
//# sourceMappingURL=tasks.d.ts.map