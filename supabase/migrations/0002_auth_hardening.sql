-- Postgres grants EXECUTE on functions to PUBLIC by default, which PostgREST
-- then exposes on /rpc. None of our SECURITY DEFINER functions are meant to be
-- callable that way — they run as triggers, event triggers, or inside RLS.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.is_admin()        from public;
revoke execute on function public.rls_auto_enable() from public;
grant  execute on function public.is_admin() to postgres;

-- Auth uses a synthesized email (the phone provider needs a paid SMS gateway),
-- so the real phone number arrives in raw_user_meta_data at signup.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, phone)
  values (
    new.id,
    coalesce(new.phone, nullif(new.raw_user_meta_data ->> 'phone', ''))
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public;
