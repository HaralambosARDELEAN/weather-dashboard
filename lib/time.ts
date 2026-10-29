/** "Fri 19:40" in the place's own timezone. */
export function formatLocalTime(timezone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
}

export function localHour(timezone: string, now: Date = new Date()): number {
  const hour = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", hourCycle: "h23" }).format(now);
  return Number(hour);
}

/** 1 to 12, in the place's own timezone. */
export function localMonth(timezone: string, now: Date = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: timezone, month: "numeric" }).format(now));
}

/** Daylight comes from the weather API (is_day), so polar days and nights are right too. */
export function timeOfDay(hour: number, isDay: boolean): string {
  if (!isDay) return "at night";
  if (hour < 9) return "in the early morning";
  if (hour < 12) return "in the late morning";
  if (hour < 17) return "in the afternoon";
  return "in the evening";
}
