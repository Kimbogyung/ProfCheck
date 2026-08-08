export const BUSINESS_START = "09:00";
export const BUSINESS_END = "21:00";

// date(YYYY-MM-DD) + time(HH:mm)을 UTC 기준 timestamptz 문자열로 결합한다.
export function combineDateAndTime(date: string, time: string): string {
  return `${date}T${time}:00.000Z`;
}

// timestamptz 값에서 시:분(HH:mm)만 추출한다.
export function formatTimeOfDay(timestamp: string): string {
  return new Date(timestamp).toISOString().slice(11, 16);
}
