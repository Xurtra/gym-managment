export interface Clock {
    now(): Date;
}
export declare const systemClock: Clock;
export declare function addSeconds(date: Date, seconds: number): Date;
export declare function addMinutes(date: Date, minutes: number): Date;
export declare function addHours(date: Date, hours: number): Date;
export declare function addDays(date: Date, days: number): Date;
//# sourceMappingURL=time.d.ts.map