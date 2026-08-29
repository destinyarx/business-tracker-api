begin;

create table if not exists public.ping (
  id smallint primary key,
  last_ping_at timestamptz not null default now(),
  constraint ping_has_one_row check (id = 1)
);

insert into public.ping (id)
values (1)
on conflict (id) do nothing;

alter table public.ping enable row level security;

revoke all on table public.ping from public;
revoke all on table public.ping from anon;

grant select on table public.ping to anon;
grant update (last_ping_at) on table public.ping to anon;

drop policy if exists "Allow keep-alive row reads" on public.ping;
create policy "Allow keep-alive row reads"
on public.ping
for select
to anon
using (id = 1);

drop policy if exists "Allow keep-alive timestamp updates" on public.ping;
create policy "Allow keep-alive timestamp updates"
on public.ping
for update
to anon
using (id = 1)
with check (id = 1);

commit;
