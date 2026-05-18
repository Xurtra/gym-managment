import { UserStatus } from "@gym-platform/constants";
import { button, emptyState, input, table } from "@gym-platform/ui";
const PRIORITIES = ["low", "normal", "high", "urgent"];
const STATUSES = ["open", "in_progress", "completed", "cancelled"];
export function buildStaffTaskAssignmentModel(inputModel) {
    const title = normalizeText(inputModel.title);
    const description = normalizeText(inputModel.description);
    const dueAt = normalizeText(inputModel.dueAt);
    const selectedPriority = inputModel.priority ?? "normal";
    const assigneeOptions = staffAssigneeOptions(inputModel.staff, inputModel.selectedAssigneeId);
    const selectedAssignee = assigneeOptions.find((option) => option.selected && !option.disabled);
    const validDueAt = !dueAt || !Number.isNaN(new Date(dueAt).getTime());
    const canSubmit = Boolean(title && selectedAssignee && validDueAt);
    return {
        screen: "staff_task_assignment",
        fields: {
            title: input({
                name: "title",
                label: "Task title",
                value: title,
                type: "text",
                required: true
            }),
            description: input({
                name: "description",
                label: "Description",
                value: description,
                type: "text",
                required: false
            }),
            dueAt: input({
                name: "dueAt",
                label: "Due date",
                value: dueAt,
                type: "text",
                required: false,
                ...(dueAt && !validDueAt ? { error: "Due date must be a valid date." } : {})
            })
        },
        assigneeOptions,
        priorityOptions: PRIORITIES.map((priority) => ({
            value: priority,
            label: priorityLabel(priority),
            selected: priority === selectedPriority
        })),
        ...(selectedAssignee ? { selectedAssigneeId: selectedAssignee.id } : {}),
        selectedPriority,
        canSubmit,
        assignAction: button({ label: "Assign task", icon: "clipboard-plus", disabled: !canSubmit }),
        cancelAction: button({ label: "Cancel", icon: "x", intent: "secondary" })
    };
}
export function createStaffTaskAssignmentSubmission(inputModel) {
    const submission = {
        title: normalizeText(inputModel.title),
        assignedToUserId: inputModel.assignedToUserId,
        priority: inputModel.priority ?? "normal"
    };
    const description = normalizeText(inputModel.description);
    const dueAt = normalizeText(inputModel.dueAt);
    if (description) {
        submission.description = description;
    }
    if (dueAt) {
        submission.dueAt = dueAt;
    }
    return submission;
}
export function buildStaffTaskCompletionFlow(inputModel) {
    const staffById = new Map(inputModel.staff.map((staff) => [staff.userId, staff]));
    const note = normalizeText(inputModel.note);
    const completedAt = inputModel.completedAt ?? new Date().toISOString();
    const blockedReason = completionBlockedReason(inputModel.task, inputModel.completedByUserId);
    const canComplete = !blockedReason;
    return {
        screen: "staff_task_completion",
        task: inputModel.task,
        assigneeName: staffName(staffById, inputModel.task.assignedToUserId),
        creatorName: staffName(staffById, inputModel.task.createdByUserId),
        ...(inputModel.completedByUserId ? { completedByUserId: inputModel.completedByUserId } : {}),
        completedAt,
        noteField: input({
            name: "completionNote",
            label: "Completion note",
            value: note,
            type: "text",
            required: false
        }),
        canComplete,
        ...(blockedReason ? { blockedReason } : {}),
        completeAction: button({
            label: "Complete task",
            icon: "check",
            disabled: !canComplete
        }),
        cancelAction: button({ label: "Cancel", icon: "x", intent: "secondary" })
    };
}
export function createStaffTaskCompletionSubmission(inputModel) {
    const submission = {
        taskId: inputModel.taskId,
        completedByUserId: inputModel.completedByUserId,
        completedAt: inputModel.completedAt
    };
    const note = normalizeText(inputModel.note);
    if (note) {
        submission.note = note;
    }
    return submission;
}
export function buildStaffTaskListView(inputModel) {
    const query = normalizeText(inputModel.filters?.query).toLowerCase();
    const filters = {
        query,
        ...(inputModel.filters?.assignedToUserId
            ? { assignedToUserId: inputModel.filters.assignedToUserId }
            : {}),
        ...(inputModel.filters?.status ? { status: inputModel.filters.status } : {}),
        ...(inputModel.filters?.priority ? { priority: inputModel.filters.priority } : {})
    };
    const staffById = new Map(inputModel.staff.map((staff) => [staff.userId, staff]));
    const today = startOfUtcDay(new Date(inputModel.today ?? new Date().toISOString()));
    const rows = inputModel.tasks
        .filter((task) => matchesTaskFilters(task, filters, staffById))
        .sort(compareTasks)
        .map((task) => buildTaskRow(task, staffById, today));
    const empty = rows.length === 0
        ? emptyState({
            title: hasActiveFilters(filters) ? "No tasks match your filters" : "No staff tasks",
            body: hasActiveFilters(filters)
                ? "Adjust the task filters and try again."
                : "Assign a staff task to start tracking team follow-up."
        })
        : undefined;
    return {
        screen: "staff_task_list",
        filters,
        searchField: input({
            name: "taskSearch",
            label: "Search tasks",
            value: query,
            type: "text",
            required: false
        }),
        assigneeOptions: staffAssigneeOptions(inputModel.staff, filters.assignedToUserId),
        statusOptions: STATUSES.map((status) => ({
            value: status,
            label: statusLabel(status),
            selected: status === filters.status
        })),
        priorityOptions: PRIORITIES.map((priority) => ({
            value: priority,
            label: priorityLabel(priority),
            selected: priority === filters.priority
        })),
        rows,
        table: table({
            columns: [
                { key: "title", label: "Task" },
                { key: "assigneeName", label: "Assignee" },
                { key: "priorityLabel", label: "Priority" },
                { key: "statusLabel", label: "Status" },
                { key: "dueLabel", label: "Due" }
            ],
            rows,
            ...(empty ? { empty } : {})
        }),
        summary: {
            totalCount: inputModel.tasks.length,
            visibleCount: rows.length,
            openCount: inputModel.tasks.filter((task) => task.status === "open").length,
            inProgressCount: inputModel.tasks.filter((task) => task.status === "in_progress").length,
            overdueCount: inputModel.tasks.filter((task) => dueState(task, today) === "overdue").length,
            completedCount: inputModel.tasks.filter((task) => task.status === "completed").length
        },
        createTaskAction: button({
            label: "Assign task",
            icon: "clipboard-plus",
            disabled: inputModel.canCreateTask === false
        }),
        ...(empty ? { empty } : {})
    };
}
function buildTaskRow(task, staffById, today) {
    const due = dueState(task, today);
    const completeDisabled = task.status === "completed" || task.status === "cancelled";
    return {
        ...task,
        assigneeName: staffName(staffById, task.assignedToUserId),
        creatorName: staffName(staffById, task.createdByUserId),
        priorityLabel: priorityLabel(task.priority),
        statusLabel: statusLabel(task.status),
        dueState: due,
        dueLabel: dueLabel(task, due),
        overdue: due === "overdue",
        detailAction: button({ label: "View task", icon: "eye", intent: "secondary" }),
        completeAction: button({
            label: "Complete task",
            icon: "check",
            disabled: completeDisabled
        }),
        reassignAction: button({
            label: "Reassign task",
            icon: "user-round-check",
            intent: "secondary",
            disabled: task.status === "completed" || task.status === "cancelled"
        })
    };
}
function staffAssigneeOptions(staff, selectedUserId) {
    return staff
        .slice()
        .sort((left, right) => staffNameValue(left).localeCompare(staffNameValue(right)))
        .map((member) => ({
        id: member.userId,
        label: staffNameValue(member),
        selected: member.userId === selectedUserId,
        disabled: member.status !== UserStatus.Active
    }));
}
function matchesTaskFilters(task, filters, staffById) {
    if (filters.assignedToUserId && task.assignedToUserId !== filters.assignedToUserId) {
        return false;
    }
    if (filters.status && task.status !== filters.status) {
        return false;
    }
    if (filters.priority && task.priority !== filters.priority) {
        return false;
    }
    if (!filters.query) {
        return true;
    }
    const haystack = [
        task.title,
        task.description,
        staffName(staffById, task.assignedToUserId),
        staffName(staffById, task.createdByUserId),
        priorityLabel(task.priority),
        statusLabel(task.status)
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
    return haystack.includes(filters.query);
}
function compareTasks(left, right) {
    return (statusSort(left.status) - statusSort(right.status) ||
        prioritySort(right.priority) - prioritySort(left.priority) ||
        dueTime(left) - dueTime(right) ||
        left.title.localeCompare(right.title));
}
function dueState(task, today) {
    if (!task.dueAt || task.status === "completed" || task.status === "cancelled") {
        return "no_due";
    }
    const dueAt = startOfUtcDay(new Date(task.dueAt));
    if (dueAt < today) {
        return "overdue";
    }
    if (dueAt.getTime() === today.getTime()) {
        return "due_today";
    }
    return "upcoming";
}
function dueLabel(task, state) {
    if (!task.dueAt) {
        return "No due date";
    }
    if (state === "overdue") {
        return "Overdue";
    }
    if (state === "due_today") {
        return "Due today";
    }
    return task.dueAt;
}
function startOfUtcDay(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
function dueTime(task) {
    return task.dueAt ? new Date(task.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
}
function statusSort(status) {
    return { open: 0, in_progress: 1, completed: 2, cancelled: 3 }[status];
}
function prioritySort(priority) {
    return { low: 0, normal: 1, high: 2, urgent: 3 }[priority];
}
function statusLabel(status) {
    return {
        open: "Open",
        in_progress: "In progress",
        completed: "Completed",
        cancelled: "Cancelled"
    }[status];
}
function priorityLabel(priority) {
    return {
        low: "Low",
        normal: "Normal",
        high: "High",
        urgent: "Urgent"
    }[priority];
}
function completionBlockedReason(task, completedByUserId) {
    if (task.status === "completed") {
        return "Task is already completed.";
    }
    if (task.status === "cancelled") {
        return "Cancelled tasks cannot be completed.";
    }
    if (!completedByUserId) {
        return "A completing staff member is required.";
    }
    return undefined;
}
function staffName(staffById, userId) {
    const staff = staffById.get(userId);
    return staff ? staffNameValue(staff) : "Unknown staff";
}
function staffNameValue(staff) {
    return `${staff.firstName} ${staff.lastName}`.trim() || staff.email;
}
function normalizeText(value) {
    return value?.trim().replace(/\s+/g, " ") ?? "";
}
function hasActiveFilters(filters) {
    return Boolean(filters.query || filters.assignedToUserId || filters.status || filters.priority);
}
//# sourceMappingURL=tasks.js.map