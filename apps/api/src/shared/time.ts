export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date()
};

export function addSeconds(date: Date, seconds: number) {
  return new Date(date.getTime() + seconds * 1000);
}

export function addMinutes(date: Date, minutes: number) {
  return addSeconds(date, minutes * 60);
}

export function addHours(date: Date, hours: number) {
  return addMinutes(date, hours * 60);
}

export function addDays(date: Date, days: number) {
  return addHours(date, days * 24);
}
