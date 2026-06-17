-- ════════════════════════════════════════════════════════════════════════
--  Migration 0004 — collect structured profile fields at sign-up
--  Run AFTER 0003 in the Supabase SQL editor.
--  Stores first/last name, gender, phone in public.profiles (email lives in
--  auth.users). Passwords are NEVER stored here — Supabase Auth hashes them.
-- ════════════════════════════════════════════════════════════════════════
begin;

alter table profiles add column if not exists first_name text;
alter table profiles add column if not exists last_name  text;
alter table profiles add column if not exists gender     text
  check (gender is null or gender in ('male', 'female', 'undisclosed'));
alter table profiles add column if not exists phone      text;

-- Recreate the new-user trigger to populate the structured fields from the
-- sign-up metadata (raw_user_meta_data). display_name (used as the public
-- review author name) is derived from first + last name.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  m jsonb := new.raw_user_meta_data;
begin
  insert into profiles (id, display_name, first_name, last_name, gender, phone)
  values (
    new.id,
    coalesce(
      nullif(trim(concat_ws(' ', m->>'first_name', m->>'last_name')), ''),
      'Parent'
    ),
    nullif(trim(m->>'first_name'), ''),
    nullif(trim(m->>'last_name'), ''),
    nullif(m->>'gender', ''),
    nullif(trim(m->>'phone'), '')
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    first_name   = excluded.first_name,
    last_name    = excluded.last_name,
    gender       = excluded.gender,
    phone        = excluded.phone;
  return new;
end $$;

commit;
