# 교수님 일정 트래킹 시스템 - 기술 설계 문서

- 문서 버전: v1.0
- 작성일: 2026-08-08
- 기반 문서: professor_schedule_tracker_prd3.md (PRD v1.0)
- 목적: PRD의 요구사항을 실제 개발(Claude Code 프롬프트 작성 포함)에 바로 쓸 수 있도록 구체화한 기술 설계 문서. 신규 요구사항을 추가하지 않으며, PRD의 필드/규칙을 실제 스키마·API·화면 구조로 변환하는 것이 목적이다.

---

## 0. 확정된 결정 사항

- 기술 스택: Next.js(App Router, TypeScript) + Tailwind CSS + Supabase(PostgreSQL, `@supabase/supabase-js` 직접 사용)
- 인증: 커스텀 인증 (학번 로그인 + bcrypt 비밀번호 해시 + 세션/JWT). Supabase Auth는 사용하지 않고, `users` 테이블을 직접 관리.
- DB 접근: 모든 DB 접근은 Next.js API 라우트(서버)에서만 수행. `SUPABASE_SERVICE_ROLE_KEY`로 서버 전용 클라이언트를 만들어 사용하고, 클라이언트(브라우저)에서 Supabase에 직접 접근하지 않음 → RLS(Row Level Security) 정책을 별도로 설계할 필요 없이 API 라우트에서 권한 체크로 대체.
- 배포: Vercel
- 캘린더 범위: 월~일 7일, 09:00~21:00

> 변경 이력: 최초에는 Prisma + PostgreSQL로 설계했으나, Vercel 배포 중 Prisma 7.x의 스키마 설정 방식 변경(breaking change)으로 인한 빌드 실패를 겪은 뒤 Supabase 직접 연동 방식으로 전환 (cravemap 프로젝트에서 검증된 패턴).

---

## 1. DB 스키마 (Supabase SQL)

Supabase 프로젝트의 SQL Editor에서 아래 스크립트를 그대로 실행해 테이블을 생성한다.

```sql
create extension if not exists pgcrypto;

create type role as enum ('MEMBER', 'ADMIN');
create type day_status as enum ('ON', 'OFF');

create table users (
  id               uuid primary key default gen_random_uuid(),
  student_id       text unique not null,      -- 로그인 ID = 학번
  password_hash    text not null,
  role             role not null default 'MEMBER',
  password_changed boolean not null default false, -- 최초 비번 변경 완료 여부
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table daily_status (
  id         uuid primary key default gen_random_uuid(),
  date       date unique not null,             -- 날짜당 1행만 존재
  status     day_status not null default 'ON',
  updated_by uuid not null references users(id),
  updated_at timestamptz not null default now()
);

create table time_off (
  id         uuid primary key default gen_random_uuid(),
  date       date not null,
  start_time timestamptz not null,             -- date + 시:분 결합
  end_time   timestamptz not null,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_by uuid references users(id),
  updated_at timestamptz not null default now()
);

create index idx_time_off_date on time_off(date);

-- RLS는 활성화하되, 서버(API 라우트)에서 service_role 키로만 접근하므로
-- 별도 정책(policy)을 추가하지 않아도 service_role은 RLS를 우회한다.
alter table users enable row level security;
alter table daily_status enable row level security;
alter table time_off enable row level security;
```

비고
- `daily_status`는 날짜당 1행만 존재 (unique). 레코드가 없으면 애플리케이션 레벨에서 기본값 `ON`으로 간주(레코드 부재 = ON), 또는 주 시작 시 7일치를 미리 insert 해두는 방식 중 선택.
- `time_off.start_time/end_time`은 09:00~21:00 범위, `start_time < end_time` 검증은 API 레벨에서 수행.
- 사유·장소 등 PRD 7.3에서 명시적으로 제외한 필드는 스키마에 포함하지 않음.
- 클라이언트(브라우저)는 Supabase에 직접 접근하지 않고 항상 Next.js API 라우트를 거치므로, RLS policy를 세밀하게 만들 필요 없이 `SUPABASE_SERVICE_ROLE_KEY`로 서버에서만 접근한다.

---

## 2. API 엔드포인트 명세

### 인증

| Method | Path | Body | 설명 |
|---|---|---|---|
| POST | /api/auth/login | `{ studentId, password }` | 로그인. 응답에 `mustChangePassword` 포함 |
| POST | /api/auth/change-password | `{ currentPassword, newPassword }` | 최초 비번 변경 포함, 인증 필요 |
| POST | /api/auth/logout | - | 세션 종료 |

### Daily Status (하루 전체 부재)

| Method | Path | Body | 설명 |
|---|---|---|---|
| GET | /api/daily-status?weekStart=YYYY-MM-DD | - | 해당 주 7일치 상태 조회 |
| PATCH | /api/daily-status/:date | `{ status: "ON" \| "OFF" }` | OFF 전환 시 서버에서 해당 date의 TimeOff 레코드 전체 삭제 (10.1, 10.2) |

### Time Off (특정 시간 부재)

| Method | Path | Body | 설명 |
|---|---|---|---|
| GET | /api/time-off?weekStart=YYYY-MM-DD | - | 해당 주 시간 부재 목록 조회 |
| POST | /api/time-off | `{ date, startTime, endTime }` | 해당 date가 종일 OFF면 400 에러 |
| PATCH | /api/time-off/:id | `{ startTime, endTime }` | 작성자 본인 또는 관리자만 |
| DELETE | /api/time-off/:id | - | 작성자 본인 또는 관리자만 |

### 관리자

| Method | Path | Body | 설명 |
|---|---|---|---|
| GET | /api/admin/users | - | 사용자 목록 조회 |
| POST | /api/admin/users | `{ studentId }` | 계정 생성 (초기 비번 1234로 세팅) |
| POST | /api/admin/users/:id/reset-password | - | 비밀번호 1234로 초기화 |

모든 엔드포인트(로그인 제외)는 세션/토큰 인증 필수. 인증 실패 시 401.

---

## 3. 화면/라우트 구조

```
/login              로그인
/change-password    최초 로그인 시 강제 이동 (비번 미변경 상태면 다른 페이지 접근 차단)
/                   메인 주간 캘린더 (인증 필요)
/admin              관리자 화면 (role=ADMIN만 접근 가능)
```

메인 화면(`/`) 구성 요소
- 주 이동 컨트롤 (이전 주 / 이번 주 / 다음 주)
- 날짜별 ON/OFF 토글 바 (7일)
- 09:00~21:00 시간 Grid (7열 × 12행 또는 30분 단위 24행)
- 시간 셀 클릭/드래그 → 부재 등록 액션
- 종일 OFF인 날짜는 시간 Grid 선택 비활성화 (10.1)

---

## 4. 충돌 규칙 로직 (PRD 10장 → 의사코드)

**하루 전체 OFF로 전환**
```
PATCH /api/daily-status/:date { status: "OFF" }
1. DailyStatus upsert: status = OFF, updatedBy = 현재 사용자
2. 해당 date의 TimeOff 레코드 전체 삭제
3. 클라이언트: 해당 날짜 09:00~21:00 전체를 부재 색상으로 표시, 시간 선택 UI 비활성화
```

**하루 전체 ON으로 복귀**
```
PATCH /api/daily-status/:date { status: "ON" }
1. DailyStatus update: status = ON
   (TimeOff는 OFF 전환 시점에 이미 삭제되었으므로 추가 처리 없음)
2. 클라이언트: 해당 날짜 기본 흰색으로 복귀, 시간 선택 UI 활성화
```

**특정 시간 부재 등록**
```
POST /api/time-off { date, startTime, endTime }
1. 해당 date의 DailyStatus 조회
2. status === OFF → 400 에러 반환 ("종일 부재 상태에서는 등록할 수 없습니다")
3. startTime >= endTime → 400 에러
4. 09:00~21:00 범위 밖 → 400 에러
5. 통과 시 TimeOff 레코드 생성
```

---

## 5. 폴더 구조 (Next.js App Router 기준 제안)

```
/app
  /login/page.tsx
  /change-password/page.tsx
  /admin/page.tsx
  /page.tsx                     # 메인 주간 캘린더
  /api
    /auth/login/route.ts
    /auth/change-password/route.ts
    /auth/logout/route.ts
    /daily-status/route.ts
    /daily-status/[date]/route.ts
    /time-off/route.ts
    /time-off/[id]/route.ts
    /admin/users/route.ts
/lib
  /supabase.ts                  # Supabase 서버 전용 클라이언트 싱글턴 (service role key 사용)
  /auth.ts                      # 세션 검증, 비밀번호 해시 유틸
/supabase
  /schema.sql                   # 1절의 테이블 생성 스크립트 (Supabase SQL Editor에 실행)
/components
  /WeeklyCalendar.tsx
  /DayToggleBar.tsx
  /TimeGrid.tsx
/scripts
  /seed-users.ts                # 학번 리스트 기반 계정 일괄 생성
```

---

## 6. 환경 변수

```
NEXT_PUBLIC_SUPABASE_URL=      # Supabase 프로젝트 URL
SUPABASE_SERVICE_ROLE_KEY=     # 서버 전용 키. RLS를 우회하므로 절대 클라이언트에 노출 금지 (NEXT_PUBLIC_ 접두어 붙이지 않음)
SESSION_SECRET=                # 커스텀 세션/JWT 서명용 시크릿
```

두 값(`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) 모두 Supabase 대시보드 → Project Settings → API 메뉴에서 확인할 수 있다.

---

## 7. 이 문서를 개발 순서와 매칭하는 방법

각 개발 단계에서 Claude Code에 넘길 프롬프트는 이 문서의 해당 절을 그대로 인용하면 됩니다.

| 개발 단계 | 참조 절 |
|---|---|
| DB 스키마 설계 | 1. DB 스키마 |
| 인증 시스템 | 2. 인증 API, 6. 환경 변수 |
| Daily Status / Time Off API | 2. API 명세, 4. 충돌 규칙 로직 |
| 캘린더 UI | 3. 화면/라우트 구조 |
| 배포 | 6. 환경 변수 |
