import { DateTime, IANAZone } from "luxon";

export function validateTimezone(zone: string): string {
  const value = zone.trim();
  if (value !== "UTC" && !IANAZone.isValidZone(value)) throw new Error("Use an IANA timezone such as America/Los_Angeles.");
  return value;
}

export function parseSchedule(raw: string, timezone: string, now = Date.now()): Date {
  const zone = validateTimezone(timezone);
  const value = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})?$/.test(value)) {
    throw new Error("Use YYYY-MM-DDTHH:mm, optionally with an explicit UTC offset.");
  }
  const explicitOffset = /(?:Z|[+-]\d{2}:\d{2})$/.test(value);
  const parsed = DateTime.fromISO(value, { zone, setZone: true });
  if (!parsed.isValid) throw new Error("Invalid date or timezone.");
  if (!explicitOffset && (parsed.toFormat("yyyy-MM-dd'T'HH:mm") !== value.slice(0, 16) || parsed.getPossibleOffsets().length > 1)) {
    throw new Error("That local time is skipped or ambiguous at a daylight-saving transition. Supply an explicit UTC offset.");
  }
  if (parsed.toMillis() <= now) throw new Error("Choose a future time.");
  return parsed.toUTC().toJSDate();
}
