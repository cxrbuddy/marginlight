export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isWithinWorkingHours(
  now: Date,
  startTime = "08:30",
  endTime = "18:30",
): boolean {
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const start = parseTime(startTime);
  const end = parseTime(endTime);

  if (start === null || end === null) {
    return true;
  }

  if (start <= end) {
    return minutesNow >= start && minutesNow <= end;
  }

  return minutesNow >= start || minutesNow <= end;
}

export function parseTime(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

export function nextMidnightDelay(now = new Date()): number {
  const next = new Date(now);
  next.setHours(24, 0, 2, 0);
  return Math.max(1_000, next.getTime() - now.getTime());
}
