# Przewodnik testowania widoków autentykacji

## Data: 2026-01-31

---

## Wymagania wstępne

### 1. Uruchomienie Supabase lokalnie

```bash
# Uruchom lokalną instancję Supabase
npx supabase start

# Sprawdź status (powinno pokazać wszystkie URL-e)
npx supabase status
```

**Oczekiwany output:**
```
API URL: http://127.0.0.1:54321
GraphQL URL: http://127.0.0.1:54321/graphql/v1
S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: http://127.0.0.1:54323
Inbucket URL: http://127.0.0.1:54324
JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
anon key: eyJhbGc...
service_role key: eyJhbGc...
```

### 2. Konfiguracja zmiennych środowiskowych

Sprawdź plik `.env`:

```env
# Lokalne Supabase (development)
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_ANON_KEY=<anon_key_from_supabase_status>

# Produkcja (gdy gotowe)
# PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Konfiguracja Supabase Authentication

Otwórz Supabase Studio: `http://localhost:54323`

#### Krok A: Wyłącz email confirmation (dla łatwiejszego testowania MVP)

1. Przejdź do **Authentication → Settings**
2. Znajdź sekcję **Email Settings**
3. **Disable** opcję "Enable email confirmations"
4. Kliknij **Save**

#### Krok B: Skonfiguruj URL-e

1. W **Authentication → URL Configuration:**
   - **Site URL:** `http://localhost:3000`
   - **Redirect URLs:** `http://localhost:3000/**`
2. Kliknij **Save**

#### Krok C: Sprawdź Email provider

1. W **Authentication → Providers:**
2. Upewnij się, że **Email** jest włączony (enabled)

### 4. Uruchomienie serwera deweloperskiego

```bash
# W nowym terminalu
npm run dev

# Serwer powinien uruchomić się na:
# http://localhost:3000
```

---

## Scenariusze testowe

### Scenariusz 1: Rejestracja nowego użytkownika (Happy Path)

**URL:** `http://localhost:3000/register`

**Kroki:**
1. Otwórz przeglądarkę i przejdź do `/register`
2. Wypełnij formularz:
   - Email: `testparent1@example.com`
   - Hasło: `password123`
   - Potwierdź hasło: `password123`
3. Kliknij "Zarejestruj się"

**Oczekiwany rezultat:**
- ✅ Loading state: przycisk zmienia się na "Rejestracja..."
- ✅ Inputy są disabled podczas ładowania
- ✅ Auto-login (ponieważ email confirmation jest disabled)
- ✅ Automatyczne przekierowanie do `/profiles`
- ✅ W Supabase Studio → Authentication → Users pojawia się nowy użytkownik
- ✅ W przeglądarce DevTools → Application → Cookies widoczne są cookies Supabase (`sb-*`)

**Weryfikacja w Supabase Studio:**
1. Przejdź do **Authentication → Users**
2. Powinien być widoczny nowy użytkownik z emailem `testparent1@example.com`
3. Status: **Confirmed** (jeśli email confirmation disabled)

---

### Scenariusz 2: Walidacja formularza rejestracji

**URL:** `http://localhost:3000/register`

#### Test 2.1: Niepoprawny format email

**Kroki:**
1. Email: `invalid-email` (brak @)
2. Hasło: `password123`
3. Potwierdź hasło: `password123`
4. Kliknij "Zarejestruj się"

**Oczekiwany rezultat:**
- ❌ Alert z komunikatem: "Wprowadź poprawny adres email"
- ❌ Border input email zmienia się na czerwony

#### Test 2.2: Hasło za krótkie

**Kroki:**
1. Email: `test@example.com`
2. Hasło: `pass` (mniej niż 8 znaków)
3. Potwierdź hasło: `pass`
4. Kliknij "Zarejestruj się"

**Oczekiwany rezultat:**
- ❌ Alert: "Hasło musi mieć minimum 8 znaków"
- ❌ Border input password zmienia się na czerwony

#### Test 2.3: Niezgodne hasła

**Kroki:**
1. Email: `test@example.com`
2. Hasło: `password123`
3. Potwierdź hasło: `password456` (inne)
4. Kliknij "Zarejestruj się"

**Oczekiwany rezultat:**
- ❌ Alert: "Hasła nie są identyczne"
- ❌ Border input confirmPassword zmienia się na czerwony

#### Test 2.4: Email już zarejestrowany

**Kroki:**
1. Użyj tego samego email co w Scenariuszu 1: `testparent1@example.com`
2. Hasło: `password123`
3. Potwierdź hasło: `password123`
4. Kliknij "Zarejestruj się"

**Oczekiwany rezultat:**
- ❌ Alert: "Ten adres email jest już zarejestrowany"

---

### Scenariusz 3: Logowanie istniejącego użytkownika

**URL:** `http://localhost:3000/login`

**Przygotowanie:**
- Upewnij się, że użytkownik `testparent1@example.com` istnieje (Scenariusz 1)

**Kroki:**
1. Przejdź do `/login`
2. Email: `testparent1@example.com`
3. Hasło: `password123`
4. Kliknij "Zaloguj się"

**Oczekiwany rezultat:**
- ✅ Loading state: przycisk "Logowanie..."
- ✅ Automatyczne przekierowanie do `/profiles`
- ✅ W AppHeader widoczny email użytkownika
- ✅ Cookies Supabase ustawione w przeglądarce

---

### Scenariusz 4: Walidacja formularza logowania

#### Test 4.1: Nieprawidłowe hasło

**Kroki:**
1. Email: `testparent1@example.com`
2. Hasło: `wrongpassword`
3. Kliknij "Zaloguj się"

**Oczekiwany rezultat:**
- ❌ Alert: "Nieprawidłowy email lub hasło"

#### Test 4.2: Nieistniejący email

**Kroki:**
1. Email: `nonexistent@example.com`
2. Hasło: `password123`
3. Kliknij "Zaloguj się"

**Oczekiwany rezultat:**
- ❌ Alert: "Nieprawidłowy email lub hasło"

#### Test 4.3: Puste pola

**Kroki:**
1. Pozostaw pola puste
2. Kliknij "Zaloguj się"

**Oczekiwany rezultat:**
- ❌ Alert: "Wprowadź adres email" (pierwszy pusty input)

---

### Scenariusz 5: Ochrona tras (Middleware)

#### Test 5.1: Niezalogowany próbuje wejść na chronioną trasę

**Kroki:**
1. Wyloguj się (jeśli zalogowany)
2. W przeglądarce wpisz: `http://localhost:3000/profiles`

**Oczekiwany rezultat:**
- ✅ Automatyczne przekierowanie do `/login?redirect=/profiles`
- ✅ URL pokazuje query param `redirect`

**Po zalogowaniu:**
- ✅ Automatyczne przekierowanie do `/profiles` (oryginalna trasa)

#### Test 5.2: Zalogowany próbuje wejść na /login

**Kroki:**
1. Zaloguj się (Scenariusz 3)
2. W przeglądarce wpisz: `http://localhost:3000/login`

**Oczekiwany rezultat:**
- ✅ Automatyczne przekierowanie do `/profiles`
- ✅ Nie można zobaczyć strony logowania gdy zalogowany

#### Test 5.3: Zalogowany próbuje wejść na /register

**Kroki:**
1. Zaloguj się
2. Przejdź do `/register`

**Oczekiwany rezultat:**
- ✅ Automatyczne przekierowanie do `/profiles`

---

### Scenariusz 6: Wylogowanie

#### Test 6.1: Wylogowanie z przycisku w AppHeader

**Kroki:**
1. Zaloguj się (Scenariusz 3)
2. Przejdź do `/profiles` (lub dowolna chroniona strona)
3. W AppHeader kliknij przycisk "Wyloguj"

**Oczekiwany rezultat:**
- ✅ Przycisk zmienia się na "Wylogowywanie..."
- ✅ Automatyczne przekierowanie do `/login`
- ✅ Cookies Supabase zostały usunięte (sprawdź DevTools)

**Weryfikacja:**
1. Spróbuj wejść na `/profiles` po wylogowaniu
2. Powinno przekierować do `/login`

---

### Scenariusz 7: Responsywność AppHeader

#### Test 7.1: Mobile view

**Kroki:**
1. Zaloguj się
2. Otwórz DevTools → Device Toolbar (Ctrl+Shift+M)
3. Wybierz urządzenie mobile (np. iPhone 12)

**Oczekiwany rezultat:**
- ✅ Email użytkownika jest ukryty (tylko ikona)
- ✅ Tekst "Wyloguj" jest ukryty (tylko ikona LogOut)
- ✅ Przycisk i ikony są dobrze widoczne

#### Test 7.2: Desktop view

**Kroki:**
1. Przełącz na widok desktop (>640px)

**Oczekiwany rezultat:**
- ✅ Email użytkownika jest widoczny (User icon + email)
- ✅ Tekst "Wyloguj" jest widoczny obok ikony
- ✅ Header ma odpowiedni padding i layout

---

### Scenariusz 8: Linki między stronami

#### Test 8.1: Link "Zarejestruj się" na /login

**Kroki:**
1. Przejdź do `/login`
2. Kliknij link "Zarejestruj się"

**Oczekiwany rezultat:**
- ✅ Przekierowanie do `/register`

#### Test 8.2: Link "Zaloguj się" na /register

**Kroki:**
1. Przejdź do `/register`
2. Kliknij link "Zaloguj się"

**Oczekiwany rezultat:**
- ✅ Przekierowanie do `/login`

---

## Testowanie z włączonym Email Confirmation

### Konfiguracja

1. Otwórz Supabase Studio: `http://localhost:54323`
2. Przejdź do **Authentication → Settings**
3. **Enable** opcję "Enable email confirmations"
4. Kliknij **Save**

### Scenariusz 9: Rejestracja z email confirmation

**URL:** `http://localhost:3000/register`

**Kroki:**
1. Email: `testparent2@example.com`
2. Hasło: `password123`
3. Potwierdź hasło: `password123`
4. Kliknij "Zarejestruj się"

**Oczekiwany rezultat:**
- ✅ Success alert (zielony): "Rejestracja udana! Sprawdź swoją skrzynkę email i potwierdź adres."
- ✅ Po 3 sekundach automatyczne przekierowanie do `/login`
- ✅ W Supabase Studio → Users: nowy użytkownik ze statusem **Unconfirmed**

### Weryfikacja email (Inbucket)

1. Otwórz Inbucket (lokalna skrzynka email): `http://localhost:54324`
2. Znajdź email do `testparent2@example.com`
3. Kliknij link potwierdzający
4. Użytkownik w Supabase Studio zmienia status na **Confirmed**

### Logowanie z niezweryfikowanym emailem

**Kroki:**
1. Zarejestruj użytkownika (nie potwierdzaj email)
2. Spróbuj się zalogować

**Oczekiwany rezultat:**
- ❌ Alert: "Potwierdź swój adres email" (jeśli Supabase ma włączone blokowanie)
- LUB ✅ Login działa (zależy od konfiguracji Supabase)

---

## Checklist końcowy

### Funkcjonalności ✅

- [ ] Rejestracja nowego użytkownika
- [ ] Walidacja formularza rejestracji (email, hasło, confirm)
- [ ] Logowanie istniejącego użytkownika
- [ ] Walidacja formularza logowania
- [ ] Wylogowanie z przycisku w AppHeader
- [ ] Ochrona tras (redirect niezalogowanych do /login)
- [ ] Redirect zalogowanych z /login do /profiles
- [ ] Query param `redirect` działa poprawnie
- [ ] Email użytkownika wyświetla się w AppHeader
- [ ] Responsywność AppHeader (mobile/desktop)
- [ ] Linki między /login i /register działają
- [ ] Loading states (przyciski, inputy disabled)
- [ ] Error handling (przyjazne komunikaty po polsku)
- [ ] Cookies Supabase są ustawiane/usuwane poprawnie

### Email Confirmation (opcjonalnie) ✅

- [ ] Rejestracja z email confirmation enabled
- [ ] Email wysyłany do Inbucket
- [ ] Link potwierdzający działa
- [ ] Status użytkownika zmienia się na Confirmed

### Bezpieczeństwo ✅

- [ ] Hasła są ukryte (type="password")
- [ ] Cookies są secure (sprawdź w DevTools)
- [ ] Middleware blokuje dostęp do chronionych tras
- [ ] API /api/auth/logout działa poprawnie
- [ ] Brak console.error w przeglądarce (tylko warnings)

---

## Rozwiązywanie problemów

### Problem: "Failed to connect to Supabase"

**Rozwiązanie:**
1. Sprawdź czy Supabase działa: `npx supabase status`
2. Jeśli nie działa: `npx supabase start`
3. Sprawdź zmienne środowiskowe w `.env`
4. Zrestartuj serwer deweloperski: `npm run dev`

### Problem: "Invalid login credentials" mimo poprawnych danych

**Rozwiązanie:**
1. Sprawdź w Supabase Studio → Users czy użytkownik istnieje
2. Sprawdź status użytkownika (Confirmed/Unconfirmed)
3. Jeśli email confirmation enabled - potwierdź email w Inbucket
4. Sprawdź czy hasło jest poprawne (min 8 znaków)

### Problem: Przekierowania nie działają

**Rozwiązanie:**
1. Sprawdź middleware w DevTools → Network
2. Powinny być redirecty 302 lub 307
3. Sprawdź czy cookies są ustawione
4. Wyczyść cache przeglądarki i cookies
5. Zrestartuj serwer

### Problem: AppHeader nie pokazuje email

**Rozwiązanie:**
1. Sprawdź DevTools → Console czy są błędy
2. Sprawdź czy Supabase client jest poprawnie zainicjalizowany
3. Sprawdź czy `supabase.auth.getUser()` zwraca użytkownika
4. Sprawdź czy cookies są ustawione (DevTools → Application)

### Problem: "Email already registered" mimo że nie ma w bazie

**Rozwiązanie:**
1. Otwórz Supabase Studio → Authentication → Users
2. Sprawdź wszystkich użytkowników (również deleted)
3. Usuń użytkownika jeśli istnieje
4. Lub użyj innego adresu email

---

## Narzędzia pomocnicze

### DevTools - zakładki do sprawdzenia:

1. **Console:** Błędy JavaScript, logi
2. **Network:** Zapytania HTTP, redirecty, statusy
3. **Application → Cookies:** Cookies Supabase (`sb-*`)
4. **Application → Local Storage:** Stan aplikacji (sessionStorage)

### Supabase Studio - zakładki:

1. **Authentication → Users:** Lista użytkowników
2. **Authentication → Settings:** Konfiguracja auth
3. **Authentication → Providers:** Email, Google, etc.
4. **Logs → Postgres Logs:** Logi bazy danych

### Inbucket (lokalny email):

- URL: `http://localhost:54324`
- Wszystkie emaile wysyłane z Supabase trafiają tutaj
- Nie wymaga konfiguracji (działa out-of-the-box)

---

## Podsumowanie

Po przejściu przez wszystkie scenariusze testowe, system autentykacji powinien działać w pełni zgodnie z wymaganiami PRD. Wszystkie przepływy (rejestracja, logowanie, wylogowanie, ochrona tras) są zaimplementowane i gotowe do użycia.

**Status:** ✅ Gotowe do testowania produkcyjnego po konfiguracji zdalnego Supabase

---

**Autor:** Claude Code
**Data:** 2026-01-31
**Wersja:** 1.0
