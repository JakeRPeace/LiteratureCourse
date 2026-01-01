create table if not exists public.book_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  book_id text not null,
  status text not null default 'not_started',
  score numeric(3,2),
  updated_at timestamptz not null default now(),
  constraint book_status_status_check check (status in ('not_started', 'in_progress', 'read')),
  constraint book_status_score_check check (
    score is null
    or (
      score >= 1
      and score <= 5
      and score * 4 = floor(score * 4)
    )
  )
);

create unique index if not exists book_status_user_book_idx
  on public.book_status (user_id, book_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists book_status_updated_at on public.book_status;
create trigger book_status_updated_at
before update on public.book_status
for each row
execute procedure public.set_updated_at();

alter table public.book_status enable row level security;

drop policy if exists "book_status_select_own" on public.book_status;
create policy "book_status_select_own"
  on public.book_status
  for select
  using (auth.uid() = user_id);

drop policy if exists "book_status_insert_own" on public.book_status;
create policy "book_status_insert_own"
  on public.book_status
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "book_status_update_own" on public.book_status;
create policy "book_status_update_own"
  on public.book_status
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "book_status_delete_own" on public.book_status;
create policy "book_status_delete_own"
  on public.book_status
  for delete
  using (auth.uid() = user_id);
