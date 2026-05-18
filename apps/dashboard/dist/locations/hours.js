import { table } from "@gym-platform/ui";
const dayOrder = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export function buildLocationBusinessHoursEditor(operatingHours) {
    const rows = dayOrder.flatMap((day) => (operatingHours[day] ?? []).map((range) => ({
        day,
        opensAt: range.opensAt,
        closesAt: range.closesAt,
        valid: isValidTimeRange(range.opensAt, range.closesAt)
    })));
    const invalidRows = rows.filter((row) => !row.valid);
    return {
        screen: "location_business_hours",
        rows,
        invalidRows,
        canSubmit: invalidRows.length === 0,
        table: table({
            columns: [
                { key: "day", label: "Day" },
                { key: "opensAt", label: "Opens" },
                { key: "closesAt", label: "Closes" },
                { key: "valid", label: "Valid" }
            ],
            rows
        })
    };
}
function isValidTimeRange(opensAt, closesAt) {
    return /^\d{2}:\d{2}$/.test(opensAt) && /^\d{2}:\d{2}$/.test(closesAt) && closesAt > opensAt;
}
//# sourceMappingURL=hours.js.map