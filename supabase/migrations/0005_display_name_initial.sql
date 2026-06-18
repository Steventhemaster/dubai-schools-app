-- ════════════════════════════════════════════════════════════════════════
--  Migration 0005 — privacy-safer review author name
--  Run AFTER 0004. Display reviewers as "First L." (first name + last initial)
--  instead of full real name, to reduce defamation/privacy exposure for
--  reviewers (legal review recommendation).
-- ════════════════════════════════════════════════════════════════════════
begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  m  jsonb := new.raw_user_meta_data;
  fn text  := nullif(trim(m->>'first_name'), '');
  ln text  := nullif(trim(m->>'last_name'), '');
  dn text;
begin
  -- "Sara H." — first name + last-name initial; falls back gracefully.
  dn := trim(
    coalesce(fn, '') ||
    case when ln is not null then ' ' || upper(left(ln, 1)) || '.' else '' end
  );
  if dn is null or dn = '' then dn := 'Parent'; end if;

  insert into profiles (id, display_name, first_name, last_name, gender, phone)
  values (
    new.id, dn, fn, ln,
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

-- Shorten any existing full-name display names to "First L.".
update profiles
set display_name = trim(
  coalesce(first_name, '') ||
  case when last_name is not null and last_name <> ''
       then ' ' || upper(left(last_name, 1)) || '.' else '' end
)
where first_name is not null and first_name <> '';

commit;
