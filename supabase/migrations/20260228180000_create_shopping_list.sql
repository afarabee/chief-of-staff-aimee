create table public.shopping_list (
  id uuid not null default gen_random_uuid() primary key,
  name text not null,
  checked boolean not null default false,
  created_at timestamp with time zone not null default now()
);

alter table public.shopping_list enable row level security;

create policy "Allow all access to shopping_list"
  on public.shopping_list
  for all
  using (true)
  with check (true);
