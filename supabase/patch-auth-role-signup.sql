-- Patch: allow signup metadata role to populate profiles.role

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, grade, language_pref)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case
      when coalesce(new.raw_user_meta_data->>'role', 'student') in ('student','teacher','admin')
        then (new.raw_user_meta_data->>'role')
      else 'student'
    end,
    nullif(new.raw_user_meta_data->>'grade','')::int,
    coalesce(new.raw_user_meta_data->>'language_pref', 'en')
  );
  return new;
end;
$$;
