-- ════════════════════════════════════════════════════════════════════════
--  Migration 0006 — populate profiles from OAuth (Google) sign-ups
--  Run AFTER 0005. OAuth users don't go through our sign-up form, so their
--  metadata uses provider keys (given_name/family_name/full_name/name).
--  This makes handle_new_user fall back to those, then to splitting the full
--  name, so the "First L." display name still works for Google sign-ins.
-- ════════════════════════════════════════════════════════════════════════
begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  m    jsonb := new.raw_user_meta_data;
  fullname text;
  fn   text;
  ln   text;
  dn   text;
begin
  -- First name: our form field → Google given_name → first token of full name.
  fn := coalesce(
    nullif(trim(m->>'first_name'), ''),
    nullif(trim(m->>'given_name'), '')
  );
  ln := coalesce(
    nullif(trim(m->>'last_name'), ''),
    nullif(trim(m->>'family_name'), '')
  );

  if fn is null then
    fullname := coalesce(nullif(trim(m->>'full_name'), ''), nullif(trim(m->>'name'), ''));
    if fullname is not null then
      fn := split_part(fullname, ' ', 1);
      if position(' ' in fullname) > 0 then
        ln := substr(fullname, position(' ' in fullname) + 1);
      end if;
    end if;
  end if;

  -- "Sara H." — first name + last-name initial; safe fallback.
  dn := trim(
    coalesce(fn, '') ||
    case when ln is not null and ln <> '' then ' ' || upper(left(ln, 1)) || '.' else '' end
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
    gender       = coalesce(excluded.gender, profiles.gender),
    phone        = coalesce(excluded.phone, profiles.phone);
  return new;
end $$;

commit;
