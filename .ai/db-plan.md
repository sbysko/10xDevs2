# Schemat Bazy Danych PostgreSQL - Dopasuj Obrazek do Słowa

## 0. Tabela Zarządzana przez Supabase Auth

### auth.users (ZARZĄDZANA AUTOMATYCZNIE - NIE TWORZYMY)

**WAŻNE:** Tabela `auth.users` jest automatycznie tworzona i zarządzana przez **Supabase Auth (GoTrue)**. NIE jest częścią naszych migracji - istnieje w schemacie `auth` i jest dostępna od razu po utworzeniu projektu Supabase.

#### Struktura (referencja)
Dla celów dokumentacyjnych, główne kolumny w `auth.users`:

| Kolumna | Typ | Opis |
|---------|-----|------|
| id | UUID | PRIMARY KEY - używane jako FK w tabeli profiles |
| email | VARCHAR | Email rodzica (unikalny) |
| encrypted_password | TEXT | Hasło (zaszyfrowane) |
| email_confirmed_at | TIMESTAMPTZ | Data potwierdzenia email |
| created_at | TIMESTAMPTZ | Data rejestracji |
| updated_at | TIMESTAMPTZ | Data ostatniej aktualizacji |

#### Nasze użycie
- **profiles.parent_id** → REFERENCES **auth.users(id)**
- Każdy rodzic zarejestrowany przez Supabase Auth automatycznie otrzymuje rekord w `auth.users`
- Nasz kod korzysta z `auth.uid()` w politykach RLS do weryfikacji tożsamości
- Rejestracja i logowanie obsługiwane przez `@supabase/auth-ui-react` i Supabase SDK

---

## 1. Typy Niestandardowe (ENUM)

### vocabulary_category
```sql
CREATE TYPE vocabulary_category AS ENUM (
  'zwierzeta',
  'owoce_warzywa',
  'pojazdy', 
  'kolory_ksztalty',
  'przedmioty_codzienne'
);
```

**Uwaga:** Nazwy kategorii dopasowane do wymagań PRD:
- Zwierzęta (50 słów)
- Owoce i Warzywa (50 słów)
- Pojazdy (50 słów)
- Kolory i Kształty (50 słów)
- Przedmioty Codziennego Użytku (50 słów)

---

## 2. Tabele (Tworzymy w Migracjach)

### 2.1 profiles
Przechowuje profile dzieci przypisane do konta rodzica.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator profilu |
| parent_id | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | FK do konta rodzica w Supabase Auth |
| display_name | VARCHAR(50) | NOT NULL | Imię dziecka wyświetlane w interfejsie |
| avatar_url | TEXT | NULL | Ścieżka do awatara w Supabase Storage |
| language_code | VARCHAR(5) | NOT NULL, DEFAULT 'pl' | Kod języka interfejsu (ISO 639-1) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data utworzenia profilu |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data ostatniej modyfikacji |

**Constraints:**
- `CHECK (LENGTH(display_name) >= 2)` - minimum 2 znaki dla imienia
- `CHECK (language_code IN ('pl', 'en'))` - obsługiwane języki
- `CHECK (LENGTH(display_name) <= 50)` - zgodnie z PRD

---

### 2.2 vocabulary
Centralna baza słownictwa z obsługą wielu języków.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator słowa |
| word_text | VARCHAR(100) | NOT NULL | Tekst słowa do nauki |
| category | vocabulary_category | NOT NULL | Kategoria tematyczna (ENUM) |
| language_code | VARCHAR(5) | NOT NULL, DEFAULT 'pl' | Język słowa |
| image_path | TEXT | NOT NULL | Relatywna ścieżka do obrazka (np. 'vocabulary/pl/zwierzeta/kot.png') |
| difficulty_level | SMALLINT | DEFAULT 1, CHECK (difficulty_level BETWEEN 1 AND 3) | Poziom trudności (1=łatwy, 3=trudny) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data dodania słowa |

**Constraints:**
- `UNIQUE (word_text, language_code)` - unikalne słowa per język
- `CHECK (LENGTH(word_text) >= 2)` - minimum 2 znaki

---

### 2.3 user_progress
Tabela łącząca profile z słownictwem, śledząca postępy w nauce.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unikalny identyfikator rekordu |
| profile_id | UUID | NOT NULL, REFERENCES profiles(id) ON DELETE CASCADE | FK do profilu dziecka |
| vocabulary_id | UUID | NOT NULL, REFERENCES vocabulary(id) ON DELETE CASCADE | FK do słowa |
| is_mastered | BOOLEAN | NOT NULL, DEFAULT FALSE | Czy słowo zostało opanowane |
| stars_earned | SMALLINT | NOT NULL, DEFAULT 0, CHECK (stars_earned BETWEEN 0 AND 3) | Liczba zdobytych gwiazdek (0-3) |
| attempts_count | INTEGER | NOT NULL, DEFAULT 0 | Liczba prób |
| last_attempted_at | TIMESTAMPTZ | NULL | Data ostatniej próby |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data pierwszej próby |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Data ostatniej aktualizacji |

**Constraints:**
- `UNIQUE (profile_id, vocabulary_id)` - jedno słowo raz na profil
- `CHECK (attempts_count >= 0)` - nieujemna liczba prób

---

## 3. Relacje Między Tabelami

```
auth.users (Supabase Auth) 
     │ (1)
     │
     ├──< (N) profiles (max 5)
              │
              │ (1)
              │
              ├──< (N) user_progress (M) >──┤
                                             │
vocabulary (250 słów) (1) ──────────────<──┘
```

### Kardynalności:
- **auth.users → profiles**: 1:N (jeden rodzic, 3-5 profili dzieci)
- **profiles → user_progress**: 1:N (jeden profil, wiele słów w trakcie nauki)
- **vocabulary → user_progress**: 1:N (jedno słowo, wielu uczniów)
- **profiles ↔ vocabulary**: M:N (przez user_progress)

---

## 4. Indeksy

### 4.1 profiles
```sql
CREATE INDEX idx_profiles_parent_id ON profiles(parent_id);
CREATE INDEX idx_profiles_language_code ON profiles(language_code);
```

### 4.2 vocabulary
```sql
CREATE INDEX idx_vocabulary_category ON vocabulary(category);
CREATE INDEX idx_vocabulary_language_code ON vocabulary(language_code);
CREATE INDEX idx_vocabulary_lang_category ON vocabulary(language_code, category);
```

### 4.3 user_progress
```sql
CREATE INDEX idx_user_progress_profile_id ON user_progress(profile_id);
CREATE INDEX idx_user_progress_vocabulary_id ON user_progress(vocabulary_id);
CREATE INDEX idx_user_progress_is_mastered ON user_progress(is_mastered);
CREATE INDEX idx_user_progress_profile_mastered ON user_progress(profile_id, is_mastered);
CREATE INDEX idx_user_progress_last_attempted ON user_progress(profile_id, last_attempted_at DESC);
```

**Uzasadnienie:**
- `idx_user_progress_profile_mastered` - optymalizacja algorytmu 80/20 (filtrowanie nieopanowanych słów)
- `idx_user_progress_last_attempted` - sortowanie po dacie dla historii aktywności

---

## 5. Widoki (Views)

### 5.1 profile_stats
Agreguje statystyki per profil bez denormalizacji danych (Single Source of Truth).

```sql
CREATE VIEW profile_stats AS
SELECT 
  p.id as profile_id,
  p.display_name,
  p.avatar_url,
  COUNT(up.id) as total_words_attempted,
  SUM(CASE WHEN up.is_mastered THEN 1 ELSE 0 END)::INTEGER as words_mastered,
  SUM(up.stars_earned)::INTEGER as total_stars,
  ROUND(
    (SUM(CASE WHEN up.is_mastered THEN 1 ELSE 0 END)::NUMERIC / 
     NULLIF(COUNT(up.id), 0) * 100), 
    1
  ) as mastery_percentage
FROM profiles p
LEFT JOIN user_progress up ON p.id = up.profile_id
GROUP BY p.id, p.display_name, p.avatar_url;
```

**Użycie:** Dashboard rodzica, wyświetlanie total_stars zgodnie z PRD (US-007)

---

## 6. Funkcje i Triggery

### 6.1 Trigger: Aktualizacja updated_at

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 6.2 Trigger: Limit profili (max 5 na rodzica)

```sql
CREATE OR REPLACE FUNCTION check_profile_limit()
RETURNS TRIGGER AS $$
DECLARE
  profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count
  FROM profiles
  WHERE parent_id = NEW.parent_id;
  
  IF profile_count >= 5 THEN
    RAISE EXCEPTION 'Rodzic może mieć maksymalnie 5 profili dzieci';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_profile_limit
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_profile_limit();
```

**Zgodność z PRD:** US-035 (Próba utworzenia więcej niż 5 profili)

### 6.3 Funkcja: Losowanie słów według algorytmu 80/20

```sql
CREATE OR REPLACE FUNCTION get_next_words(
  p_profile_id UUID,
  p_language_code VARCHAR(5) DEFAULT 'pl',
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  vocabulary_id UUID,
  word_text VARCHAR,
  image_path TEXT,
  category vocabulary_category,
  is_mastered BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH vocabulary_pool AS (
    SELECT 
      v.id,
      v.word_text,
      v.image_path,
      v.category,
      COALESCE(up.is_mastered, FALSE) as is_mastered,
      up.last_attempted_at
    FROM vocabulary v
    LEFT JOIN user_progress up ON v.id = up.vocabulary_id AND up.profile_id = p_profile_id
    WHERE v.language_code = p_language_code
  ),
  unmastered AS (
    SELECT * FROM vocabulary_pool WHERE is_mastered = FALSE
    ORDER BY RANDOM()
    LIMIT CEIL(p_limit * 0.8)
  ),
  mastered AS (
    SELECT * FROM vocabulary_pool WHERE is_mastered = TRUE
    ORDER BY last_attempted_at ASC NULLS LAST, RANDOM()
    LIMIT CEIL(p_limit * 0.2)
  )
  SELECT 
    id as vocabulary_id,
    word_text,
    image_path,
    category,
    is_mastered
  FROM (
    SELECT * FROM unmastered
    UNION ALL
    SELECT * FROM mastered
  ) combined
  ORDER BY RANDOM()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;
```

**Zgodność z PRD:** US-017 (Algorytm 80/20 dla doboru pytań)

---

## 7. Row Level Security (RLS)

### 7.1 Włączenie RLS

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;
```

### 7.2 Polityki dla profiles

```sql
-- Rodzic widzi tylko swoje profile dzieci
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT
  USING (parent_id = auth.uid());

-- Rodzic może tworzyć profile dla siebie
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT
  WITH CHECK (parent_id = auth.uid());

-- Rodzic może aktualizować swoje profile dzieci
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

-- Rodzic może usuwać swoje profile dzieci
CREATE POLICY "profiles_delete_policy" ON profiles
  FOR DELETE
  USING (parent_id = auth.uid());
```

**Bezpieczeństwo:** `auth.uid()` zwraca UUID zalogowanego użytkownika z `auth.users`

### 7.3 Polityki dla user_progress

```sql
-- Odczyt postępów tylko dla własnych dzieci
CREATE POLICY "user_progress_select_policy" ON user_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = user_progress.profile_id 
      AND profiles.parent_id = auth.uid()
    )
  );

-- Tworzenie postępów tylko dla własnych dzieci
CREATE POLICY "user_progress_insert_policy" ON user_progress
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = user_progress.profile_id 
      AND profiles.parent_id = auth.uid()
    )
  );

-- Aktualizacja postępów tylko dla własnych dzieci
CREATE POLICY "user_progress_update_policy" ON user_progress
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = user_progress.profile_id 
      AND profiles.parent_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = user_progress.profile_id 
      AND profiles.parent_id = auth.uid()
    )
  );

-- Usuwanie postępów tylko dla własnych dzieci
CREATE POLICY "user_progress_delete_policy" ON user_progress
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = user_progress.profile_id 
      AND profiles.parent_id = auth.uid()
    )
  );
```

**Mechanizm:** Zagnieżdżone zapytania weryfikują własność przez `parent_id`

### 7.4 Polityki dla vocabulary (odczyt publiczny)

```sql
-- Wszyscy uwierzytelnieni użytkownicy mogą czytać słownictwo
CREATE POLICY "vocabulary_select_policy" ON vocabulary
  FOR SELECT
  TO authenticated
  USING (true);
```

**Uwaga:** Tylko odczyt, tabela vocabulary jest read-only dla użytkowników

---

## 8. Integracja z Supabase Auth

### 8.1 Flow Rejestracji

```
1. Rodzic wypełnia formularz (email + hasło)
   ↓
2. @supabase/auth-ui-react wysyła request do Supabase Auth
   ↓
3. Supabase Auth tworzy rekord w auth.users
   ↓
4. Aplikacja otrzymuje auth.user.id
   ↓
5. (Opcjonalnie) Trigger DB tworzy pierwszy profil dziecka
```

### 8.2 Dostęp do auth.uid() w Politykach

Funkcja `auth.uid()` jest dostępna w PostgreSQL dzięki Supabase:
- Zwraca UUID aktualnie zalogowanego użytkownika
- Null dla niezalogowanych requestów
- Używana we wszystkich politykach RLS jako punkt weryfikacji

### 8.3 Bezpieczeństwo Multi-Tenancy

```sql
-- Przykład: Rodzic A (uuid-aaa) nie może zobaczyć profili Rodzica B (uuid-bbb)
SELECT * FROM profiles; -- RLS automatycznie filtruje:

-- Faktyczne wykonane query:
SELECT * FROM profiles WHERE parent_id = auth.uid();
-- Dla Rodzica A zwróci tylko profiles gdzie parent_id = 'uuid-aaa'
```

---

## 9. Dodatkowe Uwagi Projektowe

### 9.1 Decyzje Architektoniczne

1. **auth.users jako External Dependency**: Polegamy na Supabase Auth do zarządzania użytkownikami, co eliminuje ryzyko błędów bezpieczeństwa w implementacji uwierzytelniania.

2. **Single Source of Truth**: Liczba gwiazdek i statystyki obliczane dynamicznie z widoku `profile_stats` zamiast denormalizacji, co eliminuje ryzyko rozbieżności danych.

3. **ENUM dla kategorii**: Gwarantuje integralność danych na poziomie bazy, zapobiegając błędom typu "Zwierzeta" vs "zwierzęta".

4. **ON DELETE CASCADE**: Automatyczne usuwanie powiązanych danych przy usunięciu profilu lub konta rodzica zgodnie z PRD (US-020).

5. **Indeksy pod algorytm 80/20**: Złożone indeksy `(profile_id, is_mastered)` wspierają szybkie filtrowanie nieopanowanych słów.

6. **Ścieżki relatywne**: `image_path` przechowuje tylko ścieżkę względem bucketa Supabase Storage, co ułatwia migrację infrastruktury.

### 9.2 Skalowalność

- **Nowe języki**: Dodanie wymaga tylko wstawienia rekordów do `vocabulary` z odpowiednim `language_code`.
- **Nowe kategorie**: Rozszerzenie typu ENUM:
  ```sql
  ALTER TYPE vocabulary_category ADD VALUE 'nowa_kategoria';
  ```
- **Wzrost użytkowników**: Indeksy B-tree zapewniają wydajność O(log N) nawet przy tysiącach użytkowników.

### 9.3 Bezpieczeństwo i Prywatność

- **RLS jako główna linia obrony**: Zagnieżdżone zapytania w politykach weryfikują własność przez `parent_id`.
- **Trigger limitu profili**: Twardy limit (max 5) na poziomie bazy zgodnie z PRD.
- **Brak danych wrażliwych**: Tabela `profiles` nie przechowuje danych osobowych dzieci (RODO/COPPA compliant).
- **Minimalizacja danych**: Zgodnie z PRD (sekcja 4.3), przechowujemy tylko niezbędne informacje.

### 9.4 Gotowe Zapytania dla Aplikacji

```sql
-- Dashboard rodzica: lista profili z statystykami
SELECT * FROM profile_stats WHERE profile_id IN (
  SELECT id FROM profiles WHERE parent_id = auth.uid()
);

-- Sesja gry: 10 losowych słów według algorytmu 80/20
SELECT * FROM get_next_words('profile-uuid', 'pl', 10);

-- Aktualizacja postępu po ukończeniu rundy (UPSERT)
INSERT INTO user_progress (profile_id, vocabulary_id, stars_earned, is_mastered, attempts_count, last_attempted_at)
VALUES ('profile-uuid', 'word-uuid', 3, true, 1, NOW())
ON CONFLICT (profile_id, vocabulary_id) 
DO UPDATE SET 
  stars_earned = user_progress.stars_earned + EXCLUDED.stars_earned,
  is_mastered = EXCLUDED.is_mastered,
  attempts_count = user_progress.attempts_count + 1,
  last_attempted_at = NOW();

-- Tracker postępu dla kategorii (US-011)
SELECT 
  v.category,
  COUNT(DISTINCT v.id) as total_words,
  COUNT(DISTINCT CASE WHEN up.is_mastered THEN v.id END) as mastered_words,
  ROUND(
    COUNT(DISTINCT CASE WHEN up.is_mastered THEN v.id END)::NUMERIC / 
    COUNT(DISTINCT v.id) * 100, 
    1
  ) as completion_percentage
FROM vocabulary v
LEFT JOIN user_progress up ON v.id = up.vocabulary_id AND up.profile_id = 'profile-uuid'
WHERE v.language_code = 'pl'
GROUP BY v.category;
```

### 9.5 Dane Testowe (Przykład)

```sql
-- Import słownictwa (przykład dla kategorii 'zwierzeta')
INSERT INTO vocabulary (word_text, category, language_code, image_path) VALUES
('Kot', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/kot.png'),
('Pies', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/pies.png'),
('Koń', 'zwierzeta', 'pl', 'vocabulary/pl/zwierzeta/kon.png'),
-- ... kolejne 47 rekordów dla kategorii zwierzęta
('Jabłko', 'owoce_warzywa', 'pl', 'vocabulary/pl/owoce_warzywa/jablko.png');
-- ... łącznie 250 rekordów (5 kategorii × 50 słów)
```

---

## 10. Monitoring i Optymalizacja

### 10.1 Metryki do Śledzenia

- Częstość wywołań funkcji `get_next_words()` (query performance)
- Rozmiar tabeli `user_progress` (growth rate)
- Hit rate na indeksach (Postgres `pg_stat_user_indexes`)
- Query execution time dla dashboard (target: <300ms zgodnie z PRD 6.3.3)

### 10.2 Query Performance Targets (z PRD)

| Operacja | Target |
|----------|--------|
| Fetch 10 pytań | < 500ms |
| UPSERT postępu | < 200ms |
| Fetch tracker postępu | < 300ms |

### 10.3 Przyszłe Optymalizacje (v1.1+)

- **Partycjonowanie**: Tabela `user_progress` może zostać podzielona po `profile_id` przy >100k rekordów.
- **Materialized View**: `profile_stats` jako widok zmaterializowany z odświeżaniem co 5 minut dla skali >1000 rodzin.
- **Archiwizacja**: Przeniesienie starszych rekordów `user_progress` (>6 miesięcy nieaktywne) do tabeli archiwizacyjnej.

---

## 11. Checklist Implementacji

### Faza 1: Podstawowa Struktura
- [ ] Utworzenie typu ENUM `vocabulary_category`
- [ ] Utworzenie tabeli `profiles`
- [ ] Utworzenie tabeli `vocabulary`
- [ ] Utworzenie tabeli `user_progress`
- [ ] Dodanie wszystkich constraints i indexes

### Faza 2: Logika Biznesowa
- [ ] Implementacja triggera `update_updated_at_column`
- [ ] Implementacja triggera `check_profile_limit`
- [ ] Implementacja funkcji `get_next_words()`
- [ ] Utworzenie widoku `profile_stats`

### Faza 3: Bezpieczeństwo
- [ ] Włączenie RLS na wszystkich tabelach
- [ ] Implementacja polityk dla `profiles`
- [ ] Implementacja polityk dla `user_progress`
- [ ] Implementacja polityk dla `vocabulary`
- [ ] Testy bezpieczeństwa (próba dostępu do cudzych danych)

### Faza 4: Dane i Testy
- [ ] Import 250 słów do `vocabulary`
- [ ] Upload 250 obrazków do Supabase Storage
- [ ] Utworzenie testowego konta rodzica
- [ ] Utworzenie 3 testowych profili dzieci
- [ ] Testy wydajności zapytań

---

## 12. Zgodność z PRD

| Wymaganie PRD | Implementacja w DB |
|--------------|-------------------|
| US-001: Rejestracja rodzica | auth.users (Supabase Auth) |
| US-002: Logowanie | auth.users + RLS policies |
| US-003: Tworzenie profilu dziecka | profiles table + trigger limit |
| US-007: Wyświetlanie total_stars | profile_stats view |
| US-011: Tracker postępu kategorii | Query na user_progress + vocabulary |
| US-017: Algorytm 80/20 | get_next_words() function |
| US-020: Usuwanie profilu | ON DELETE CASCADE |
| US-035: Limit 5 profili | check_profile_limit trigger |
| Bezpieczeństwo 4.1.1 | RLS policies |
| Performance 6.3.3 | Indexes na key columns |

---

## Podsumowanie

Ten schemat zapewnia:
- ✅ **Bezpieczeństwo**: RLS + Supabase Auth
- ✅ **Wydajność**: Indeksy pod algorytm 80/20
- ✅ **Skalowalność**: Gotowość na nowe języki i użytkowników
- ✅ **Integralność**: ENUM, Constraints, Triggers
- ✅ **Zgodność**: 100% zgodność z PRD i session notes
- ✅ **Przyszłościowość**: Łatwa rozbudowa w v1.1+