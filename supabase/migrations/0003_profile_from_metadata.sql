-- Auth uses a synthesized email, so the real phone and the full name arrive
-- in user_metadata at signup. Pull both into the profile row.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, phone, full_name)
  values (
    new.id,
    coalesce(new.phone, nullif(new.raw_user_meta_data ->> 'phone', '')),
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public;
