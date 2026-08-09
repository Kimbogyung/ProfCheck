create extension if not exists pgcrypto;

create type role as enum ('MEMBER', 'ADMIN');
create type day_status as enum ('ON', 'OFF');

create table users (
  id               uuid primary key default gen_random_uuid(),
  student_id       text unique not null,      -- 로그인 ID = 학번
  password_hash    text not null,
  role             role not null default 'MEMBER',
  password_changed boolean not null default false, -- 최초 비번 변경 완료 여부
  nickname         text,                      -- 최초 설정 화면에서 입력 (nullable)
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
