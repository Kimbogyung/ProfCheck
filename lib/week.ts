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

// weekStart를 deltaWeeks만큼 이동한 날짜 문자열을 반환한다.
export function shiftWeek(weekStart: string, deltaWeeks: number): string {
  const [year, month, day] = weekStart.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + deltaWeeks * 7);
  return date.toISOString().slice(0, 10);
}

// 브라우저의 로컬 "오늘"이 속한 주의 월요일 날짜 문자열을 반환한다.
export function getCurrentWeekStart(): string {
  const now = new Date();
  // 로컬 달력 날짜(연/월/일)를 그대로 UTC 자정으로 고정해, 이후 계산에서
  // getWeekDates/shiftWeek와 동일한 UTC 기반 날짜 연산을 쓸 수 있게 한다.
  const anchor = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayOfWeek = anchor.getUTCDay(); // 0=일 ~ 6=토
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  anchor.setUTCDate(anchor.getUTCDate() + diffToMonday);
  return anchor.toISOString().slice(0, 10);
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// date(YYYY-MM-DD)의 요일 라벨("월"~"일")을 반환한다.
export function getWeekdayLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return WEEKDAY_LABELS[date.getUTCDay()];
}
