// weekStart(YYYY-MM-DD)로부터 7일치 날짜 문자열을 반환한다.
export function getWeekDates(weekStart: string): string[] {
  const [year, month, day] = weekStart.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + i);
    return date.toISOString().slice(0, 10);
  });
}
