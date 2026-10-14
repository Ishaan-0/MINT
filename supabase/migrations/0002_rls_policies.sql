-- User profiles: allow users to insert/update their own profile
create policy "users insert own profile" on user_profiles
  for insert with check (auth.uid() = id);

create policy "users update own profile" on user_profiles
  for update using (auth.uid() = id);

-- Organizations: allow authenticated users to create orgs
create policy "authenticated users create orgs" on organizations
  for insert with check (auth.uid() = created_by);

-- Orgs: members can update their org (for seat_count)
create policy "org members update org" on organizations
  for update using (
    id in (select org_id from user_profiles where id = auth.uid())
  );

-- Invites: managers can create invites for their org
create policy "managers create invites" on invites
  for insert with check (
    org_id in (select org_id from user_profiles where id = auth.uid() and role = 'manager')
  );

-- Invites: anyone can read invites by token (for invite acceptance)
create policy "anyone reads invites" on invites
  for select using (true);

-- Invites: allow accepting (update used_by)
create policy "accept invite" on invites
  for update using (used_by is null and expires_at > now());

-- Golden configs: managers can insert/update their org's config
create policy "managers write golden config" on golden_configs
  for insert with check (
    org_id in (select org_id from user_profiles where id = auth.uid() and role = 'manager')
  );

create policy "managers update golden config" on golden_configs
  for update using (
    org_id in (select org_id from user_profiles where id = auth.uid() and role = 'manager')
  );

-- RPC to atomically increment seat count
create or replace function increment_seat_count(org_id uuid)
returns void language sql security definer as $$
  update organizations set seat_count = seat_count + 1 where id = org_id;
$$;
