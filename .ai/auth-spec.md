# Specyfikacja Techniczna: System Autentykacji i Zarządzania Profilami (v1.2)

## 1. Model Danych (Supabase / PostgreSQL)

### 1.1. Tabele
* **`public.parents`**:
    * `id`: UUID (Primary Key, FK do `auth.users` ON DELETE CASCADE).
    * `email`: text (Kopia z auth.users dla łatwiejszych query).
    * `created_at`: timestamp.
* **`public.profiles`** (Profile dzieci - US-005, US-006):
    * `id`: UUID (Primary Key).
    * `parent_id`: UUID (FK do `public.parents`).
    * `display_name`: text (Imię dziecka).
    * `avatar_url`: text (Klucz do predefiniowanego avatara).
    * `total_stars`: integer (Default: 0).
    * *RLS*: `parent_id == auth.uid()`.
* **`public.user_progress`** (US-018, US-019):
    * `id`: BIGSERIAL (Primary Key).
    * `profile_id`: UUID (FK do `public.profiles` ON DELETE CASCADE).
    * `word_id`: integer (FK do `vocabulary`).
    * `is_mastered`: boolean (Default: false).
    * `attempts`: integer (Default: 0).
    * `last_attempt_at`: timestamp.
    * *Constraint*: UNIQUE(`profile_id`, `word_id`).

### 1.2. Automatyzacja (SQL Trigger)
* **Funkcja `on_auth_user_created`**: Wyzwalana po `INSERT` w `auth.users`. Tworzy rekord w `public.parents`. 
* **Uwaga**: Rekordy w `public.profiles` są tworzone wyłącznie ręcznie przez formularz Onboarding (US-005) lub Dodaj Profil (US-006).

## 2. Zarządzanie Sesją i Dostępem

### 2.1. Persistence Aktywnego Profilu (US-007, US-008)
* **Mechanizm**: Cookie `app_active_profile_id` (HttpOnly: false dla dostępu z JS).
* **Middleware (Astro)**:
    1. Sprawdza `supabase.auth.getSession()`.
    2. Jeśli brak sesji -> redirect `/login` (chyba że trasa publiczna).
    3. Jeśli jest sesja, ale brak cookie `app_active_profile_id` i trasa to `/game/*` lub `/dashboard` -> redirect `/profiles/select`.
    4. Jeśli użytkownik nie ma żadnych profili w DB -> redirect `/onboarding`.

### 2.2. React Context (`ProfileContext`)
* Przechowuje obiekt aktywnego profilu (id, imię, gwiazdki).
* Inicjalizowany na podstawie cookie przy ładowaniu strony (CSR).
* Funkcja `switchProfile(id)` aktualizuje cookie i przekierowuje na `/dashboard`.

## 3. Logika Biznesowa w Implementacji US

| ID | Story | Logika Techniczna |
| --- | --- | --- |
| **US-006** | Limit profili | Przed `INSERT` do `profiles` sprawdź `COUNT` gdzie `parent_id = auth.uid()`. Blokuj jeśli >= 5. |
| **US-010** | Usuwanie | `DELETE FROM profiles WHERE id = ...`. RLS sprawdzi uprawnienia rodzica. Cascade usunie postępy. |
| **US-018** | Zapis postępu | `supabase.from('user_progress').upsert({ profile_id: activeId, word_id: id, is_mastered: true }, { onConflict: 'profile_id,word_id' })`. |
| **US-021** | Algorytm | Query: `SELECT * FROM vocabulary WHERE category = X LEFT JOIN user_progress ON vocabulary.id = user_progress.word_id AND user_progress.profile_id = Y ORDER BY user_progress.is_mastered NULLS FIRST, RANDOM() LIMIT 10`. |

## 4. Technologie
* **Auth UI**: `@supabase/auth-ui-react` (Theme: Shadcn/UI).
* **Walidacja**: Zod (sprawdzanie unikalności imion dzieci w obrębie konta rodzica).