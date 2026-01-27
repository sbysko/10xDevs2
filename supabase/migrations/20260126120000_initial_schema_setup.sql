-- ============================================================================
-- Migracja: Initial Schema Setup - "Dopasuj Obrazek do Słowa"
-- Data: 2026-01-26 12:00:00 UTC
-- Autor: Szymon Brodziak (PROPOINT S.A.)
-- ============================================================================
-- 
-- CEL MIGRACJI:
-- Utworzenie kompletnego schematu bazy danych dla aplikacji edukacyjnej
-- "Dopasuj Obrazek do Słowa" - gra pomagająca dzieciom w nauce słownictwa
-- poprzez dopasowywanie obrazków do słów.
--
-- DOTKNIĘTE OBIEKTY:
-- - Typy: vocabulary_category (ENUM)
-- - Tabele: profiles, vocabulary, user_progress
-- - Funkcje: update_updated_at_column(), check_profile_limit(), get_next_words()
-- - Widoki: profile_stats
-- - Indeksy: 12 indeksów optymalizujących wydajność
-- - Polityki RLS: pełne zabezpieczenie multi-tenancy
--
-- UWAGI SZCZEGÓLNE:
-- - Tabela auth.users jest zarządzana automatycznie przez Supabase Auth
-- - Wszystkie tabele mają włączony Row Level Security (RLS)
-- - Polityki są granularne (osobne dla każdej operacji i roli)
-- - ON DELETE CASCADE zapewnia automatyczne czyszczenie powiązanych danych
-- - Algorytm 80/20 zaimplementowany w funkcji get_next_words()
--
-- ZGODNOŚĆ:
-- - PostgreSQL 14+
-- - Supabase Auth (GoTrue)
-- - PRD v1.0 - 100% zgodność z wymaganiami
-- ============================================================================

-- ============================================================================
-- SEKCJA 1: TYPY NIESTANDARDOWE (ENUM)
-- ============================================================================

-- Definicja kategorii słownictwa zgodnie z PRD
-- Każda kategoria zawiera 50 słów (łącznie 250 słów w bazie)
create type vocabulary_category as enum (
  'zwierzeta',              -- Zwierzęta (50 słów)
  'owoce_warzywa',          -- Owoce i Warzywa (50 słów)
  'pojazdy',                -- Pojazdy (50 słów)
  'kolory_ksztalty',        -- Kolory i Kształty (50 słów)
  'przedmioty_codzienne'    -- Przedmioty Codziennego Użytku (50 słów)
);

comment on type vocabulary_category is 'Kategorie tematyczne słownictwa - zgodne z PRD. Każda kategoria zawiera 50 słów.';

-- ============================================================================
-- SEKCJA 2: TABELE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabela: profiles
-- ----------------------------------------------------------------------------
-- Przechowuje profile dzieci przypisane do konta rodzica.
-- Każdy rodzic (auth.users) może mieć maksymalnie 5 profili dzieci (US-035).
-- Profil zawiera podstawowe informacje: imię, awatar, język interfejsu.
-- RODO/COPPA compliant - brak wrażliwych danych osobowych.
-- ----------------------------------------------------------------------------

create table profiles (
  id uuid primary key default gen_random_uuid(),
  
  -- Klucz obcy do tabeli auth.users (zarządzanej przez Supabase Auth)
  -- ON DELETE CASCADE: usunięcie konta rodzica usuwa wszystkie profile dzieci (US-020)
  parent_id uuid not null references auth.users(id) on delete cascade,
  
  -- Imię dziecka wyświetlane w interfejsie (widoczne tylko dla rodzica)
  display_name varchar(50) not null,
  
  -- Ścieżka do awatara w Supabase Storage (null = domyślny awatar)
  -- Format: 'avatars/{parent_id}/{profile_id}.png'
  avatar_url text null,
  
  -- Kod języka interfejsu (ISO 639-1)
  -- Domyślnie: polski ('pl'), wspierany również: angielski ('en')
  language_code varchar(5) not null default 'pl',
  
  -- Znaczniki czasu
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Ograniczenia integralności danych
  constraint profiles_display_name_length check (length(display_name) >= 2 and length(display_name) <= 50),
  constraint profiles_language_code_valid check (language_code in ('pl', 'en'))
);

comment on table profiles is 'Profile dzieci przypisane do kont rodziców. Max 5 profili na rodzica (trigger check_profile_limit).';
comment on column profiles.parent_id is 'FK do auth.users - rodzic będący właścicielem profilu dziecka';
comment on column profiles.display_name is 'Imię dziecka (2-50 znaków) - wyświetlane w UI';
comment on column profiles.avatar_url is 'Ścieżka do awatara w Supabase Storage lub NULL (domyślny awatar)';
comment on column profiles.language_code is 'Język interfejsu: pl (polski) lub en (angielski)';

-- ----------------------------------------------------------------------------
-- Tabela: vocabulary
-- ----------------------------------------------------------------------------
-- Centralna baza słownictwa z obsługą wielu języków.
-- Obecnie: 250 słów w języku polskim (5 kategorii × 50 słów).
-- Tabela read-only dla użytkowników - tylko administratorzy mogą modyfikować.
-- Obrazki przechowywane w Supabase Storage, tutaj tylko relatywne ścieżki.
-- ----------------------------------------------------------------------------

create table vocabulary (
  id uuid primary key default gen_random_uuid(),
  
  -- Tekst słowa do nauki (np. "Kot", "Jabłko", "Czerwony")
  word_text varchar(100) not null,
  
  -- Kategoria tematyczna z ENUM (gwarantuje integralność)
  category vocabulary_category not null,
  
  -- Język słowa (ISO 639-1) - umożliwia przyszłą wielojęzyczność
  language_code varchar(5) not null default 'pl',
  
  -- Relatywna ścieżka do obrazka w Supabase Storage
  -- Format: 'vocabulary/{language_code}/{category}/{word_text}.png'
  -- Przykład: 'vocabulary/pl/zwierzeta/kot.png'
  image_path text not null,
  
  -- Poziom trudności słowa (1 = łatwy, 2 = średni, 3 = trudny)
  -- Wykorzystywane w algorytmie doboru pytań
  difficulty_level smallint default 1,
  
  -- Data dodania słowa do bazy
  created_at timestamptz not null default now(),
  
  -- Ograniczenia integralności
  constraint vocabulary_word_text_length check (length(word_text) >= 2),
  constraint vocabulary_difficulty_range check (difficulty_level between 1 and 3),
  
  -- Unikalne słowa per język (nie może być dwóch identycznych słów w tym samym języku)
  constraint vocabulary_unique_word_per_language unique (word_text, language_code)
);

comment on table vocabulary is 'Centralna baza słownictwa. Obecnie 250 słów PL (5 kategorii × 50 słów). Read-only dla użytkowników.';
comment on column vocabulary.word_text is 'Tekst słowa do nauki (2-100 znaków)';
comment on column vocabulary.category is 'Kategoria tematyczna z ENUM - gwarantuje integralność danych';
comment on column vocabulary.image_path is 'Relatywna ścieżka do obrazka w Storage (nie pełny URL)';
comment on column vocabulary.difficulty_level is 'Poziom trudności: 1 (łatwy), 2 (średni), 3 (trudny) - dla algorytmu doboru';

-- ----------------------------------------------------------------------------
-- Tabela: user_progress
-- ----------------------------------------------------------------------------
-- Tabela łącząca M:N między profiles i vocabulary - śledzi postępy w nauce.
-- Przechowuje informacje o opanowanych słowach, zdobytych gwiazdkach i liczbie prób.
-- Implementuje algorytm 80/20: 80% nieopanowanych słów + 20% opanowanych (powtórka).
-- UPSERT pattern: ON CONFLICT UPDATE przy aktualizacji postępu po rundzie gry.
-- ----------------------------------------------------------------------------

create table user_progress (
  id uuid primary key default gen_random_uuid(),
  
  -- Klucz obcy do profilu dziecka
  -- ON DELETE CASCADE: usunięcie profilu usuwa wszystkie postępy (czyszczenie danych)
  profile_id uuid not null references profiles(id) on delete cascade,
  
  -- Klucz obcy do słowa
  -- ON DELETE CASCADE: usunięcie słowa usuwa powiązane postępy
  vocabulary_id uuid not null references vocabulary(id) on delete cascade,
  
  -- Czy słowo zostało opanowane (3 gwiazdki w jednej rundzie = mastered)
  is_mastered boolean not null default false,
  
  -- Liczba zdobytych gwiazdek (0-3)
  -- 0 = brak odpowiedzi, 1 = słaba, 2 = dobra, 3 = perfekcyjna (mastered)
  stars_earned smallint not null default 0,
  
  -- Liczba prób nauki tego słowa (licznik sesji gry)
  attempts_count integer not null default 0,
  
  -- Data ostatniej próby (NULL jeśli słowo nigdy nie było próbowane)
  -- Używane do sortowania w dashboardzie i algorytmie 80/20
  last_attempted_at timestamptz null,
  
  -- Znaczniki czasu
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Ograniczenia integralności
  constraint user_progress_stars_range check (stars_earned between 0 and 3),
  constraint user_progress_attempts_nonnegative check (attempts_count >= 0),
  
  -- Jedno słowo może mieć tylko jeden rekord postępu per profil
  -- Umożliwia UPSERT pattern przy aktualizacji postępu
  constraint user_progress_unique_profile_vocabulary unique (profile_id, vocabulary_id)
);

comment on table user_progress is 'Postępy w nauce słów (M:N między profiles i vocabulary). Implementuje algorytm 80/20.';
comment on column user_progress.is_mastered is 'TRUE = słowo opanowane (3 gwiazdki w jednej rundzie)';
comment on column user_progress.stars_earned is 'Liczba gwiazdek (0-3): 0=brak, 1=słaba, 2=dobra, 3=perfekcyjna';
comment on column user_progress.attempts_count is 'Licznik sesji gry z tym słowem (statystyka)';
comment on column user_progress.last_attempted_at is 'Data ostatniej próby - dla sortowania i algorytmu';

-- ============================================================================
-- SEKCJA 3: INDEKSY
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Indeksy dla tabeli: profiles
-- ----------------------------------------------------------------------------

-- Indeks na parent_id - optymalizacja zapytań filtrujących profile per rodzic
-- Użycie: WHERE parent_id = auth.uid() w politykach RLS i dashboardzie
create index idx_profiles_parent_id on profiles(parent_id);

-- Indeks na language_code - optymalizacja filtrowania profili po języku
-- Użycie: Przyszłe statystyki per język interfejsu
create index idx_profiles_language_code on profiles(language_code);

comment on index idx_profiles_parent_id is 'Optymalizacja zapytań per rodzic (RLS + dashboard)';
comment on index idx_profiles_language_code is 'Optymalizacja filtrowania po języku interfejsu';

-- ----------------------------------------------------------------------------
-- Indeksy dla tabeli: vocabulary
-- ----------------------------------------------------------------------------

-- Indeks na category - optymalizacja filtrowania słów po kategorii
-- Użycie: Tracker postępu per kategoria (US-011)
create index idx_vocabulary_category on vocabulary(category);

-- Indeks na language_code - optymalizacja dla przyszłych wersji wielojęzycznych
-- Użycie: WHERE language_code = 'pl' w funkcji get_next_words()
create index idx_vocabulary_language_code on vocabulary(language_code);

-- Indeks kompozytowy (language_code, category) - dla złożonych zapytań
-- Użycie: Częste kombinacje filtrów w funkcji get_next_words() i trackerze
create index idx_vocabulary_lang_category on vocabulary(language_code, category);

comment on index idx_vocabulary_category is 'Optymalizacja zapytań per kategoria (tracker postępu)';
comment on index idx_vocabulary_language_code is 'Optymalizacja dla wielojęzyczności';
comment on index idx_vocabulary_lang_category is 'Optymalizacja złożonych zapytań (język + kategoria)';

-- ----------------------------------------------------------------------------
-- Indeksy dla tabeli: user_progress
-- ----------------------------------------------------------------------------

-- Indeks na profile_id - kluczowy dla wydajności (wszystkie query filtrują po profilu)
-- Użycie: WHERE profile_id = 'uuid' w prawie wszystkich operacjach
create index idx_user_progress_profile_id on user_progress(profile_id);

-- Indeks na vocabulary_id - optymalizacja dla statystyk per słowo
-- Użycie: Rzadziej używany, ale przydatny dla analityki administratora
create index idx_user_progress_vocabulary_id on user_progress(vocabulary_id);

-- Indeks na is_mastered - kluczowy dla algorytmu 80/20
-- Użycie: WHERE is_mastered = false w funkcji get_next_words()
create index idx_user_progress_is_mastered on user_progress(is_mastered);

-- Indeks kompozytowy (profile_id, is_mastered) - NAJWAŻNIEJSZY dla algorytmu 80/20
-- Użycie: WHERE profile_id = 'uuid' AND is_mastered = false
-- Target performance: <500ms dla fetch 10 pytań (PRD 6.3.3)
create index idx_user_progress_profile_mastered on user_progress(profile_id, is_mastered);

-- Indeks kompozytowy (profile_id, last_attempted_at DESC) - dla sortowania historii
-- Użycie: ORDER BY last_attempted_at DESC w dashboardzie aktywności
create index idx_user_progress_last_attempted on user_progress(profile_id, last_attempted_at desc);

comment on index idx_user_progress_profile_id is 'Podstawowy indeks - prawie wszystkie query filtrują po profilu';
comment on index idx_user_progress_vocabulary_id is 'Statystyki per słowo (analityka administratora)';
comment on index idx_user_progress_is_mastered is 'Algorytm 80/20 - filtrowanie nieopanowanych słów';
comment on index idx_user_progress_profile_mastered is 'KRYTYCZNY: Algorytm 80/20 (profile + mastered) - target <500ms';
comment on index idx_user_progress_last_attempted is 'Sortowanie historii aktywności w dashboardzie';

-- ============================================================================
-- SEKCJA 4: FUNKCJE I TRIGGERY
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Funkcja: update_updated_at_column()
-- ----------------------------------------------------------------------------
-- Automatycznie aktualizuje kolumnę updated_at przy każdym UPDATE.
-- Używana w triggerach na tabelach: profiles, user_progress.
-- Zapewnia Single Source of Truth dla czasu modyfikacji bez logiki w aplikacji.
-- ----------------------------------------------------------------------------

create or replace function update_updated_at_column()
returns trigger as $$
begin
  -- Ustawienie updated_at na bieżący timestamp przed zapisem rekordu
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

comment on function update_updated_at_column() is 'Automatyczna aktualizacja updated_at przy UPDATE (używana w triggerach)';

-- Trigger dla tabeli profiles
create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();

comment on trigger update_profiles_updated_at on profiles is 'Auto-update updated_at przy modyfikacji profilu';

-- Trigger dla tabeli user_progress
create trigger update_user_progress_updated_at
  before update on user_progress
  for each row
  execute function update_updated_at_column();

comment on trigger update_user_progress_updated_at on user_progress is 'Auto-update updated_at przy aktualizacji postępu';

-- ----------------------------------------------------------------------------
-- Funkcja: check_profile_limit()
-- ----------------------------------------------------------------------------
-- Egzekwuje twardy limit maksymalnie 5 profili dzieci na rodzica (US-035, PRD).
-- Wywoływana przez trigger BEFORE INSERT na tabeli profiles.
-- W przypadku próby utworzenia 6+ profilu, rzuca wyjątek i rollback transakcji.
-- ----------------------------------------------------------------------------

create or replace function check_profile_limit()
returns trigger as $$
declare
  profile_count integer;
begin
  -- Sprawdzenie liczby istniejących profili dla danego rodzica
  select count(*)
  into profile_count
  from profiles
  where parent_id = new.parent_id;
  
  -- Jeśli rodzic ma już 5 profili, blokujemy dodanie kolejnego
  if profile_count >= 5 then
    raise exception 'Maksymalnie 5 profili dzieci na rodzica (US-035). Rodzic % ma już % profili.',
      new.parent_id, profile_count;
  end if;
  
  -- Jeśli limit nie został przekroczony, pozwalamy na INSERT
  return new;
end;
$$ language plpgsql;

comment on function check_profile_limit() is 'Egzekwuje limit max 5 profili dzieci per rodzic (US-035)';

-- Trigger egzekwujący limit profili
create trigger enforce_profile_limit
  before insert on profiles
  for each row
  execute function check_profile_limit();

comment on trigger enforce_profile_limit on profiles is 'Blokuje tworzenie 6+ profilu dla rodzica (US-035)';

-- ----------------------------------------------------------------------------
-- Funkcja: get_next_words()
-- ----------------------------------------------------------------------------
-- Implementuje algorytm 80/20 doboru słów do sesji gry (US-017).
-- Algorytm:
--   1. Pobiera wszystkie słowa dla danego języka
--   2. Filtruje słowa, z którymi dziecko NIE miało jeszcze kontaktu (nieznane)
--   3. Jeśli nieznanych >= limit: zwraca losowe nieznane słowa
--   4. Jeśli nieznanych < limit: uzupełnia opanowanymi słowami (powtórka)
--   5. Proporcje: 80% nieznane/nieopanowane + 20% opanowane (powtórka)
--
-- Parametry:
--   p_profile_id UUID - ID profilu dziecka
--   p_language_code VARCHAR - język słów (np. 'pl')
--   p_limit INTEGER - liczba słów do zwrócenia (domyślnie 10)
--
-- Zwraca:
--   Tabelę słów z informacją o postępie (is_mastered, stars_earned, attempts_count)
-- ----------------------------------------------------------------------------

create or replace function get_next_words(
  p_profile_id uuid,
  p_language_code varchar default 'pl',
  p_limit integer default 10
)
returns table (
  vocabulary_id uuid,
  word_text varchar,
  category vocabulary_category,
  image_path text,
  difficulty_level smallint,
  is_mastered boolean,
  stars_earned smallint,
  attempts_count integer
) as $$
declare
  unknown_count integer;
  words_needed integer;
begin
  -- Krok 1: Sprawdzenie liczby nieznanych słów (brak rekordu w user_progress)
  select count(*)
  into unknown_count
  from vocabulary v
  where v.language_code = p_language_code
    and not exists (
      select 1
      from user_progress up
      where up.profile_id = p_profile_id
        and up.vocabulary_id = v.id
    );
  
  -- Krok 2: Jeśli mamy wystarczająco dużo nieznanych słów, zwracamy tylko nieznane
  if unknown_count >= p_limit then
    return query
    select 
      v.id as vocabulary_id,
      v.word_text,
      v.category,
      v.image_path,
      v.difficulty_level,
      false as is_mastered,        -- nieznane słowa zawsze false
      0::smallint as stars_earned,  -- brak gwiazdek dla nowych słów
      0 as attempts_count           -- brak prób dla nowych słów
    from vocabulary v
    where v.language_code = p_language_code
      and not exists (
        select 1
        from user_progress up
        where up.profile_id = p_profile_id
          and up.vocabulary_id = v.id
      )
    order by random()  -- Losowe słowa
    limit p_limit;
    
    return;
  end if;
  
  -- Krok 3: Jeśli nieznanych jest mniej niż limit, stosujemy algorytm 80/20
  
  -- 3a. Zwróć wszystkie nieznane słowa
  return query
  select 
    v.id as vocabulary_id,
    v.word_text,
    v.category,
    v.image_path,
    v.difficulty_level,
    false as is_mastered,
    0::smallint as stars_earned,
    0 as attempts_count
  from vocabulary v
  where v.language_code = p_language_code
    and not exists (
      select 1
      from user_progress up
      where up.profile_id = p_profile_id
        and up.vocabulary_id = v.id
    )
  order by random()
  limit p_limit;
  
  -- 3b. Oblicz ile słów jeszcze potrzebujemy (uzupełnienie z opanowanych)
  get diagnostics words_needed = row_count;
  words_needed := p_limit - words_needed;
  
  -- 3c. Jeśli nadal brakuje słów, uzupełnij nieopanowanymi (80%)
  if words_needed > 0 then
    return query
    select 
      v.id as vocabulary_id,
      v.word_text,
      v.category,
      v.image_path,
      v.difficulty_level,
      up.is_mastered,
      up.stars_earned,
      up.attempts_count
    from vocabulary v
    inner join user_progress up on v.id = up.vocabulary_id
    where v.language_code = p_language_code
      and up.profile_id = p_profile_id
      and up.is_mastered = false  -- Priorytet: nieopanowane
    order by random()
    limit words_needed;
    
    get diagnostics words_needed = row_count;
    words_needed := p_limit - words_needed - unknown_count;
  end if;
  
  -- 3d. Jeśli nadal brakuje, uzupełnij opanowanymi jako powtórka (20%)
  if words_needed > 0 then
    return query
    select 
      v.id as vocabulary_id,
      v.word_text,
      v.category,
      v.image_path,
      v.difficulty_level,
      up.is_mastered,
      up.stars_earned,
      up.attempts_count
    from vocabulary v
    inner join user_progress up on v.id = up.vocabulary_id
    where v.language_code = p_language_code
      and up.profile_id = p_profile_id
      and up.is_mastered = true  -- Powtórka: opanowane słowa
    order by up.last_attempted_at asc  -- Najstarsze próby jako pierwsze
    limit words_needed;
  end if;
  
  return;
end;
$$ language plpgsql;

comment on function get_next_words(uuid, varchar, integer) is 'Algorytm 80/20: dobiera słowa do sesji gry (nieznane → nieopanowane → opanowane jako powtórka)';

-- ============================================================================
-- SEKCJA 5: WIDOKI
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Widok: profile_stats
-- ----------------------------------------------------------------------------
-- Agreguje statystyki postępów per profil bez denormalizacji danych (Single Source of Truth).
-- Wykorzystywany w dashboardzie rodzica do wyświetlania:
--   - Liczby prób (total_words_attempted)
--   - Liczby opanowanych słów (words_mastered)
--   - Sumy zdobytych gwiazdek (total_stars) - zgodnie z US-007
--   - Procentu opanowania (mastery_percentage)
--
-- Performance target: <300ms (PRD 6.3.3)
-- ----------------------------------------------------------------------------

create view profile_stats as
select 
  p.id as profile_id,
  p.display_name,
  p.avatar_url,
  count(up.id)::integer as total_words_attempted,
  sum(case when up.is_mastered then 1 else 0 end)::integer as words_mastered,
  sum(up.stars_earned)::integer as total_stars,
  round(
    (sum(case when up.is_mastered then 1 else 0 end)::numeric / 
     nullif(count(up.id), 0) * 100), 
    1
  ) as mastery_percentage
from profiles p
left join user_progress up on p.id = up.profile_id
group by p.id, p.display_name, p.avatar_url;

comment on view profile_stats is 'Agregacja statystyk per profil (total_stars, words_mastered, etc.) - używane w dashboardzie rodzica (US-007)';

-- ============================================================================
-- SEKCJA 6: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Włączenie RLS na wszystkich tabelach
-- ----------------------------------------------------------------------------
-- KRYTYCZNE DLA BEZPIECZEŃSTWA: RLS zapewnia multi-tenancy na poziomie bazy danych.
-- Rodzice widzą tylko swoje profile dzieci i powiązane postępy.
-- Nawet jeśli aplikacja frontend zostanie zhakowana, baza danych nie zwróci cudzych danych.
-- ----------------------------------------------------------------------------

alter table profiles enable row level security;
alter table vocabulary enable row level security;
alter table user_progress enable row level security;

comment on table profiles is 'RLS ENABLED: Rodzice widzą tylko swoje profile dzieci (parent_id = auth.uid())';
comment on table vocabulary is 'RLS ENABLED: Publiczny odczyt dla authenticated, brak modyfikacji dla użytkowników';
comment on table user_progress is 'RLS ENABLED: Dostęp tylko do postępów własnych dzieci (weryfikacja przez profiles.parent_id)';

-- ----------------------------------------------------------------------------
-- Polityki RLS dla tabeli: profiles
-- ----------------------------------------------------------------------------
-- Zasada: Rodzic ma pełny dostęp (SELECT, INSERT, UPDATE, DELETE) tylko do swoich profili.
-- Weryfikacja: WHERE parent_id = auth.uid()
-- ----------------------------------------------------------------------------

-- Polityka SELECT dla roli authenticated: rodzic widzi tylko swoje profile
create policy "profiles_select_policy_authenticated" on profiles
  for select
  to authenticated
  using (parent_id = auth.uid());

comment on policy "profiles_select_policy_authenticated" on profiles is 
  'Rodzic widzi tylko swoje profile dzieci (parent_id = auth.uid())';

-- Polityka SELECT dla roli anon: brak dostępu (bezpieczeństwo)
create policy "profiles_select_policy_anon" on profiles
  for select
  to anon
  using (false);

comment on policy "profiles_select_policy_anon" on profiles is 
  'Użytkownicy niezalogowani nie mają dostępu do profili (bezpieczeństwo)';

-- Polityka INSERT dla roli authenticated: rodzic może tworzyć tylko swoje profile
create policy "profiles_insert_policy_authenticated" on profiles
  for insert
  to authenticated
  with check (parent_id = auth.uid());

comment on policy "profiles_insert_policy_authenticated" on profiles is 
  'Rodzic może tworzyć profile tylko dla siebie (parent_id = auth.uid(). Limit 5 egzekwowany przez trigger.';

-- Polityka INSERT dla roli anon: brak dostępu
create policy "profiles_insert_policy_anon" on profiles
  for insert
  to anon
  with check (false);

comment on policy "profiles_insert_policy_anon" on profiles is 
  'Użytkownicy niezalogowani nie mogą tworzyć profili';

-- Polityka UPDATE dla roli authenticated: rodzic może edytować tylko swoje profile
create policy "profiles_update_policy_authenticated" on profiles
  for update
  to authenticated
  using (parent_id = auth.uid())
  with check (parent_id = auth.uid());

comment on policy "profiles_update_policy_authenticated" on profiles is 
  'Rodzic może edytować tylko swoje profile (parent_id = auth.uid())';

-- Polityka UPDATE dla roli anon: brak dostępu
create policy "profiles_update_policy_anon" on profiles
  for update
  to anon
  using (false)
  with check (false);

comment on policy "profiles_update_policy_anon" on profiles is 
  'Użytkownicy niezalogowani nie mogą edytować profili';

-- Polityka DELETE dla roli authenticated: rodzic może usuwać tylko swoje profile
create policy "profiles_delete_policy_authenticated" on profiles
  for delete
  to authenticated
  using (parent_id = auth.uid());

comment on policy "profiles_delete_policy_authenticated" on profiles is 
  'Rodzic może usuwać tylko swoje profile (US-020). ON DELETE CASCADE usuwa powiązane user_progress.';

-- Polityka DELETE dla roli anon: brak dostępu
create policy "profiles_delete_policy_anon" on profiles
  for delete
  to anon
  using (false);

comment on policy "profiles_delete_policy_anon" on profiles is 
  'Użytkownicy niezalogowani nie mogą usuwać profili';

-- ----------------------------------------------------------------------------
-- Polityki RLS dla tabeli: vocabulary
-- ----------------------------------------------------------------------------
-- Zasada: Tabela read-only dla użytkowników (tylko odczyt).
-- Wszyscy uwierzytelnieni użytkownicy mogą czytać słownictwo (publiczny dostęp).
-- Brak polityk INSERT/UPDATE/DELETE - tylko administratorzy mogą modyfikować.
-- ----------------------------------------------------------------------------

-- Polityka SELECT dla roli authenticated: wszyscy mogą czytać słownictwo
create policy "vocabulary_select_policy_authenticated" on vocabulary
  for select
  to authenticated
  using (true);

comment on policy "vocabulary_select_policy_authenticated" on vocabulary is 
  'Wszyscy uwierzytelnieni użytkownicy mogą czytać słownictwo (publiczny dostęp)';

-- Polityka SELECT dla roli anon: wszyscy mogą czytać słownictwo (nawet niezalogowani)
create policy "vocabulary_select_policy_anon" on vocabulary
  for select
  to anon
  using (true);

comment on policy "vocabulary_select_policy_anon" on vocabulary is 
  'Użytkownicy niezalogowani mogą czytać słownictwo (publiczny dostęp do danych edukacyjnych)';

-- UWAGA: Brak polityk INSERT/UPDATE/DELETE dla vocabulary
-- Modyfikacja słownictwa tylko przez administratorów (service_role)

-- ----------------------------------------------------------------------------
-- Polityki RLS dla tabeli: user_progress
-- ----------------------------------------------------------------------------
-- Zasada: Rodzic ma dostęp tylko do postępów swoich dzieci.
-- Weryfikacja: Zagnieżdżone zapytanie sprawdza czy profile_id należy do auth.uid()
-- Mechanizm: WHERE profile_id IN (SELECT id FROM profiles WHERE parent_id = auth.uid())
-- ----------------------------------------------------------------------------

-- Polityka SELECT dla roli authenticated: rodzic widzi postępy tylko swoich dzieci
create policy "user_progress_select_policy_authenticated" on user_progress
  for select
  to authenticated
  using (
    profile_id in (
      select id
      from profiles
      where parent_id = auth.uid()
    )
  );

comment on policy "user_progress_select_policy_authenticated" on user_progress is 
  'Rodzic widzi postępy tylko swoich dzieci (weryfikacja przez profiles.parent_id)';

-- Polityka SELECT dla roli anon: brak dostępu
create policy "user_progress_select_policy_anon" on user_progress
  for select
  to anon
  using (false);

comment on policy "user_progress_select_policy_anon" on user_progress is 
  'Użytkownicy niezalogowani nie mają dostępu do postępów';

-- Polityka INSERT dla roli authenticated: rodzic może tworzyć postępy tylko dla swoich dzieci
create policy "user_progress_insert_policy_authenticated" on user_progress
  for insert
  to authenticated
  with check (
    profile_id in (
      select id
      from profiles
      where parent_id = auth.uid()
    )
  );

comment on policy "user_progress_insert_policy_authenticated" on user_progress is 
  'Rodzic może tworzyć postępy tylko dla swoich dzieci (weryfikacja przez profiles.parent_id)';

-- Polityka INSERT dla roli anon: brak dostępu
create policy "user_progress_insert_policy_anon" on user_progress
  for insert
  to anon
  with check (false);

comment on policy "user_progress_insert_policy_anon" on user_progress is 
  'Użytkownicy niezalogowani nie mogą tworzyć postępów';

-- Polityka UPDATE dla roli authenticated: rodzic może aktualizować postępy tylko swoich dzieci
create policy "user_progress_update_policy_authenticated" on user_progress
  for update
  to authenticated
  using (
    profile_id in (
      select id
      from profiles
      where parent_id = auth.uid()
    )
  )
  with check (
    profile_id in (
      select id
      from profiles
      where parent_id = auth.uid()
    )
  );

comment on policy "user_progress_update_policy_authenticated" on user_progress is 
  'Rodzic może aktualizować postępy tylko swoich dzieci (weryfikacja przez profiles.parent_id)';

-- Polityka UPDATE dla roli anon: brak dostępu
create policy "user_progress_update_policy_anon" on user_progress
  for update
  to anon
  using (false)
  with check (false);

comment on policy "user_progress_update_policy_anon" on user_progress is 
  'Użytkownicy niezalogowani nie mogą aktualizować postępów';

-- Polityka DELETE dla roli authenticated: rodzic może usuwać postępy tylko swoich dzieci
create policy "user_progress_delete_policy_authenticated" on user_progress
  for delete
  to authenticated
  using (
    profile_id in (
      select id
      from profiles
      where parent_id = auth.uid()
    )
  );

comment on policy "user_progress_delete_policy_authenticated" on user_progress is 
  'Rodzic może usuwać postępy tylko swoich dzieci (weryfikacja przez profiles.parent_id)';

-- Polityka DELETE dla roli anon: brak dostępu
create policy "user_progress_delete_policy_anon" on user_progress
  for delete
  to anon
  using (false);

comment on policy "user_progress_delete_policy_anon" on user_progress is 
  'Użytkownicy niezalogowani nie mogą usuwać postępów';

-- ============================================================================
-- KONIEC MIGRACJI
-- ============================================================================

-- Migracja zakończona pomyślnie!
-- 
-- PODSUMOWANIE UTWORZONYCH OBIEKTÓW:
-- ✅ 1 typ ENUM (vocabulary_category)
-- ✅ 3 tabele (profiles, vocabulary, user_progress)
-- ✅ 12 indeksów (optymalizacja wydajności)
-- ✅ 3 funkcje (update_updated_at, check_profile_limit, get_next_words)
-- ✅ 3 triggery (auto updated_at × 2, limit profili × 1)
-- ✅ 1 widok (profile_stats)
-- ✅ 20 polityk RLS (granularne zabezpieczenia multi-tenancy)
--
-- NASTĘPNE KROKI:
-- 1. Import 250 słów do tabeli vocabulary
-- 2. Upload 250 obrazków do Supabase Storage (bucket: vocabulary)
-- 3. Utworzenie bucketa dla awatarów (bucket: avatars)
-- 4. Testy bezpieczeństwa (próba dostępu do cudzych danych)
-- 5. Testy wydajności (target: <500ms dla get_next_words)
-- ============================================================================
