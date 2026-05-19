import { button, emptyState, table } from "@gym-platform/ui";
const dayOrder = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const dayLabels = {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
    sun: "Sunday"
};
export function buildLocationBusinessHoursEditor(operatingHours) {
    const rows = dayOrder.flatMap((day) => (operatingHours[day] ?? []).map((range) => buildHoursRow(day, range.opensAt, range.closesAt)));
    const invalidRows = rows.filter((row) => !row.valid);
    const coveredDays = [...new Set(rows.map((row) => row.day))];
    const validRowCount = rows.length - invalidRows.length;
    const invalidRowCount = invalidRows.length;
    const empty = rows.length === 0
        ? emptyState({
            title: "No business hours configured",
            body: "Add opening and closing hours for each day this location is available.",
            action: button({ label: "Add hours", icon: "plus" })
        })
        : undefined;
    const canSubmit = invalidRowCount === 0;
    return {
        screen: "location_business_hours",
        rows,
        invalidRows,
        coveredDays,
        validRowCount,
        invalidRowCount,
        summaryLabel: `${validRowCount} valid hours block${validRowCount === 1 ? "" : "s"}`,
        canSubmit,
        ...(empty ? { empty } : {}),
        saveAction: button({ label: "Save hours", disabled: !canSubmit }),
        table: table({
            columns: [
                { key: "dayLabel", label: "Day" },
                { key: "opensAt", label: "Opens" },
                { key: "closesAt", label: "Closes" },
                { key: "valid", label: "Valid" },
                { key: "error", label: "Issue" }
            ],
            rows,
            ...(empty ? { empty } : {})
        })
    };
}
function buildHoursRow(day, opensAt, closesAt) {
    const error = hoursRowError(opensAt, closesAt);
    return {
        day,
        dayLabel: dayLabels[day],
        opensAt,
        closesAt,
        valid: !error,
        ...(error ? { error } : {})
    };
}
function hoursRowError(opensAt, closesAt) {
    if (!/^\d{2}:\d{2}$/.test(opensAt) || !/^\d{2}:\d{2}$/.test(closesAt)) {
        return "Use HH:MM format.";
    }
    if (closesAt <= opensAt) {
        return "Closing time must be after opening time.";
    }
    return undefined;
}
//# sourceMappingURL=hours.js.map