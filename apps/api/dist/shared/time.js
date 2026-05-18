export const systemClock = {
    now: () => new Date()
};
export function addSeconds(date, seconds) {
    return new Date(date.getTime() + seconds * 1000);
}
export function addMinutes(date, minutes) {
    return addSeconds(date, minutes * 60);
}
export function addHours(date, hours) {
    return addMinutes(date, hours * 60);
}
export function addDays(date, days) {
    return addHours(date, days * 24);
}
//# sourceMappingURL=time.js.map