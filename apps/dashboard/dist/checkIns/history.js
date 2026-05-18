export function buildCheckInHistoryScreen(records, filters = {}) {
    const filtered = records
        .filter((record) => matchesFilters(record, filters))
        .sort((left, right) => Date.parse(right.checkedInAt) - Date.parse(left.checkedInAt));
    return {
        screen: "check_in_history",
        records: filtered,
        total: filtered.length,
        filters
    };
}
export function exportCheckInHistoryCsv(records) {
    const headers = [
        "checkedInAt",
        "memberId",
        "memberName",
        "status",
        "method",
        "locationId",
        "locationName",
        "classSessionId",
        "className",
        "bookingId",
        "deniedReason",
        "staffOverride",
        "overrideReason"
    ];
    return [
        headers.join(","),
        ...records.map((record) => [
            record.checkedInAt,
            record.memberId,
            record.memberName,
            record.status,
            record.method,
            record.locationId,
            record.locationName,
            record.classSessionId,
            record.className,
            record.bookingId,
            record.deniedReason,
            String(record.staffOverride),
            record.overrideReason
        ]
            .map((value) => csvCell(value))
            .join(","))
    ].join("\n");
}
function matchesFilters(record, filters) {
    if (filters.memberId && record.memberId !== filters.memberId) {
        return false;
    }
    if (filters.status && record.status !== filters.status) {
        return false;
    }
    if (filters.from && Date.parse(record.checkedInAt) < Date.parse(filters.from)) {
        return false;
    }
    if (filters.to && Date.parse(record.checkedInAt) > Date.parse(filters.to)) {
        return false;
    }
    return true;
}
function csvCell(value) {
    const text = value === undefined || value === null ? "" : String(value);
    return `"${text.replaceAll('"', '""')}"`;
}
//# sourceMappingURL=history.js.map