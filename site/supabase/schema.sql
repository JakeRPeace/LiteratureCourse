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
      score >= 0
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

create table if not exists public.courses (
  course_id text primary key,
  title text not null,
  course_type text not null,
  summary text,
  slug text not null,
  status text,
  source text not null default 'system',
  owner_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint courses_source_check check (source in ('system', 'user')),
  constraint courses_owner_check check (
    (source = 'system' and owner_id is null)
    or (source = 'user' and owner_id is not null)
  )
);

create unique index if not exists courses_slug_system_idx
  on public.courses (slug)
  where source = 'system';

create unique index if not exists courses_slug_user_idx
  on public.courses (owner_id, slug)
  where source = 'user';

create table if not exists public.course_categories (
  id uuid primary key default gen_random_uuid(),
  course_id text not null references public.courses (course_id) on delete cascade,
  name text not null,
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists course_categories_course_name_idx
  on public.course_categories (course_id, name);

create index if not exists course_categories_course_idx
  on public.course_categories (course_id);

create table if not exists public.course_docs (
  id uuid primary key default gen_random_uuid(),
  course_id text not null references public.courses (course_id) on delete cascade,
  doc_type text not null,
  label text,
  stage text,
  slug text not null,
  content_md text,
  excerpt text,
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists course_docs_course_doc_type_idx
  on public.course_docs (course_id, doc_type);

create unique index if not exists course_docs_course_slug_idx
  on public.course_docs (course_id, slug);

create index if not exists course_docs_course_idx
  on public.course_docs (course_id);

create table if not exists public.books (
  book_id text primary key,
  course_id text not null references public.courses (course_id) on delete cascade,
  category text not null,
  title text not null,
  author text,
  slug text not null,
  cover_url text,
  cover_source text,
  cover_source_id text,
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists books_course_slug_idx
  on public.books (course_id, slug);

create index if not exists books_course_idx
  on public.books (course_id);

create table if not exists public.book_guides (
  id uuid primary key default gen_random_uuid(),
  book_id text not null references public.books (book_id) on delete cascade,
  guide_type text not null,
  label text,
  stage text,
  slug text not null,
  content_md text,
  excerpt text,
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists book_guides_book_guide_type_idx
  on public.book_guides (book_id, guide_type);

create unique index if not exists book_guides_book_slug_idx
  on public.book_guides (book_id, slug);

create index if not exists book_guides_book_idx
  on public.book_guides (book_id);

create table if not exists public.content_sync (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_path text not null,
  checksum text not null,
  synced_at timestamptz not null default now(),
  constraint content_sync_source_check check (source in ('md'))
);

create unique index if not exists content_sync_source_path_idx
  on public.content_sync (source, source_path);

drop trigger if exists courses_updated_at on public.courses;
create trigger courses_updated_at
before update on public.courses
for each row
execute procedure public.set_updated_at();

drop trigger if exists course_categories_updated_at on public.course_categories;
create trigger course_categories_updated_at
before update on public.course_categories
for each row
execute procedure public.set_updated_at();

drop trigger if exists course_docs_updated_at on public.course_docs;
create trigger course_docs_updated_at
before update on public.course_docs
for each row
execute procedure public.set_updated_at();

drop trigger if exists books_updated_at on public.books;
create trigger books_updated_at
before update on public.books
for each row
execute procedure public.set_updated_at();

drop trigger if exists book_guides_updated_at on public.book_guides;
create trigger book_guides_updated_at
before update on public.book_guides
for each row
execute procedure public.set_updated_at();

alter table public.courses enable row level security;
alter table public.course_categories enable row level security;
alter table public.course_docs enable row level security;
alter table public.books enable row level security;
alter table public.book_guides enable row level security;
alter table public.content_sync enable row level security;

drop policy if exists "courses_select_visible" on public.courses;
create policy "courses_select_visible"
  on public.courses
  for select
  using (
    source = 'system'
    or owner_id = auth.uid()
  );

drop policy if exists "courses_insert_own" on public.courses;
create policy "courses_insert_own"
  on public.courses
  for insert
  with check (
    source = 'user'
    and owner_id = auth.uid()
  );

drop policy if exists "courses_update_own" on public.courses;
create policy "courses_update_own"
  on public.courses
  for update
  using (
    source = 'user'
    and owner_id = auth.uid()
  )
  with check (
    source = 'user'
    and owner_id = auth.uid()
  );

drop policy if exists "courses_delete_own" on public.courses;
create policy "courses_delete_own"
  on public.courses
  for delete
  using (
    source = 'user'
    and owner_id = auth.uid()
  );

drop policy if exists "course_categories_select_visible" on public.course_categories;
create policy "course_categories_select_visible"
  on public.course_categories
  for select
  using (
    exists (
      select 1
      from public.courses c
      where c.course_id = course_categories.course_id
        and (c.source = 'system' or c.owner_id = auth.uid())
    )
  );

drop policy if exists "course_categories_insert_own" on public.course_categories;
create policy "course_categories_insert_own"
  on public.course_categories
  for insert
  with check (
    exists (
      select 1
      from public.courses c
      where c.course_id = course_categories.course_id
        and c.source = 'user'
        and c.owner_id = auth.uid()
    )
  );

drop policy if exists "course_categories_update_own" on public.course_categories;
create policy "course_categories_update_own"
  on public.course_categories
  for update
  using (
    exists (
      select 1
      from public.courses c
      where c.course_id = course_categories.course_id
        and c.source = 'user'
        and c.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.courses c
      where c.course_id = course_categories.course_id
        and c.source = 'user'
        and c.owner_id = auth.uid()
    )
  );

drop policy if exists "course_categories_delete_own" on public.course_categories;
create policy "course_categories_delete_own"
  on public.course_categories
  for delete
  using (
    exists (
      select 1
      from public.courses c
      where c.course_id = course_categories.course_id
        and c.source = 'user'
        and c.owner_id = auth.uid()
    )
  );

drop policy if exists "course_docs_select_visible" on public.course_docs;
create policy "course_docs_select_visible"
  on public.course_docs
  for select
  using (
    exists (
      select 1
      from public.courses c
      where c.course_id = course_docs.course_id
        and (c.source = 'system' or c.owner_id = auth.uid())
    )
  );

drop policy if exists "course_docs_insert_own" on public.course_docs;
create policy "course_docs_insert_own"
  on public.course_docs
  for insert
  with check (
    exists (
      select 1
      from public.courses c
      where c.course_id = course_docs.course_id
        and c.source = 'user'
        and c.owner_id = auth.uid()
    )
  );

drop policy if exists "course_docs_update_own" on public.course_docs;
create policy "course_docs_update_own"
  on public.course_docs
  for update
  using (
    exists (
      select 1
      from public.courses c
      where c.course_id = course_docs.course_id
        and c.source = 'user'
        and c.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.courses c
      where c.course_id = course_docs.course_id
        and c.source = 'user'
        and c.owner_id = auth.uid()
    )
  );

drop policy if exists "course_docs_delete_own" on public.course_docs;
create policy "course_docs_delete_own"
  on public.course_docs
  for delete
  using (
    exists (
      select 1
      from public.courses c
      where c.course_id = course_docs.course_id
        and c.source = 'user'
        and c.owner_id = auth.uid()
    )
  );

drop policy if exists "books_select_visible" on public.books;
create policy "books_select_visible"
  on public.books
  for select
  using (
    exists (
      select 1
      from public.courses c
      where c.course_id = books.course_id
        and (c.source = 'system' or c.owner_id = auth.uid())
    )
  );

drop policy if exists "books_insert_own" on public.books;
create policy "books_insert_own"
  on public.books
  for insert
  with check (
    exists (
      select 1
      from public.courses c
      where c.course_id = books.course_id
        and c.source = 'user'
        and c.owner_id = auth.uid()
    )
  );

drop policy if exists "books_update_own" on public.books;
create policy "books_update_own"
  on public.books
  for update
  using (
    exists (
      select 1
      from public.courses c
      where c.course_id = books.course_id
        and c.source = 'user'
        and c.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.courses c
      where c.course_id = books.course_id
        and c.source = 'user'
        and c.owner_id = auth.uid()
    )
  );

drop policy if exists "books_delete_own" on public.books;
create policy "books_delete_own"
  on public.books
  for delete
  using (
    exists (
      select 1
      from public.courses c
      where c.course_id = books.course_id
        and c.source = 'user'
        and c.owner_id = auth.uid()
    )
  );

drop policy if exists "book_guides_select_visible" on public.book_guides;
create policy "book_guides_select_visible"
  on public.book_guides
  for select
  using (
    exists (
      select 1
      from public.books b
      join public.courses c on c.course_id = b.course_id
      where b.book_id = book_guides.book_id
        and (c.source = 'system' or c.owner_id = auth.uid())
    )
  );

drop policy if exists "book_guides_insert_own" on public.book_guides;
create policy "book_guides_insert_own"
  on public.book_guides
  for insert
  with check (
    exists (
      select 1
      from public.books b
      join public.courses c on c.course_id = b.course_id
      where b.book_id = book_guides.book_id
        and c.source = 'user'
        and c.owner_id = auth.uid()
    )
  );

drop policy if exists "book_guides_update_own" on public.book_guides;
create policy "book_guides_update_own"
  on public.book_guides
  for update
  using (
    exists (
      select 1
      from public.books b
      join public.courses c on c.course_id = b.course_id
      where b.book_id = book_guides.book_id
        and c.source = 'user'
        and c.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.books b
      join public.courses c on c.course_id = b.course_id
      where b.book_id = book_guides.book_id
        and c.source = 'user'
        and c.owner_id = auth.uid()
    )
  );

drop policy if exists "book_guides_delete_own" on public.book_guides;
create policy "book_guides_delete_own"
  on public.book_guides
  for delete
  using (
    exists (
      select 1
      from public.books b
      join public.courses c on c.course_id = b.course_id
      where b.book_id = book_guides.book_id
        and c.source = 'user'
        and c.owner_id = auth.uid()
    )
  );
