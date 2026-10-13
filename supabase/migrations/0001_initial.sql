-- Organizations
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_by uuid references auth.users(id),
  stripe_subscription_id text,
  seat_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- User profiles (extends Supabase auth.users)
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('manager', 'engineer')),
  org_id uuid references organizations(id),
  created_at timestamptz not null default now()
);

-- Invite tokens
create table invites (
  id uuid primary key default gen_random_uuid(),
  token text unique not null default gen_random_uuid()::text,
  org_id uuid not null references organizations(id),
  created_by uuid not null references auth.users(id),
  used_by uuid references auth.users(id),
  used_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

-- Machines (one per engineer)
create table machines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  org_id uuid not null references organizations(id),
  hostname text not null,
  os_version text,
  last_synced_at timestamptz,
  health_score integer,
  created_at timestamptz not null default now(),
  unique(user_id)
);

-- Machine snapshots (JSONB for schema flexibility)
create table machine_snapshots (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references machines(id),
  scanned_at timestamptz not null,
  runtimes jsonb not null default '[]',
  venvs jsonb not null default '[]',
  global_packages jsonb not null default '[]',
  path_entries jsonb not null default '[]',
  heavy_folders jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index on machine_snapshots(machine_id, scanned_at desc);

-- Golden configs (one per org, upserted)
create table golden_configs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references organizations(id),
  updated_by uuid references auth.users(id),
  rules jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Compliance results (latest per machine)
create table compliance_results (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references machines(id),
  golden_config_id uuid not null references golden_configs(id),
  computed_at timestamptz not null default now(),
  passing jsonb not null default '[]',
  failing jsonb not null default '[]',
  warnings jsonb not null default '[]',
  unique(machine_id)
);

-- RLS policies
alter table organizations enable row level security;
alter table user_profiles enable row level security;
alter table invites enable row level security;
alter table machines enable row level security;
alter table machine_snapshots enable row level security;
alter table golden_configs enable row level security;
alter table compliance_results enable row level security;

-- Profiles: users see their own
create policy "users see own profile" on user_profiles
  for select using (auth.uid() = id);

-- Machines: users see machines in their org
create policy "org members see machines" on machines
  for select using (
    org_id in (select org_id from user_profiles where id = auth.uid())
  );

-- Compliance: same as machines
create policy "org members see compliance" on compliance_results
  for select using (
    machine_id in (select id from machines where org_id in (
      select org_id from user_profiles where id = auth.uid()
    ))
  );

-- Golden config: org members can read
create policy "org members read golden config" on golden_configs
  for select using (
    org_id in (select org_id from user_profiles where id = auth.uid())
  );
