# Checklist Testowania Authentykacji

## Przygotowanie
- [ ] Uruchom `npm run dev`
- [ ] Otwórz przeglądarkę na http://localhost:3000
- [ ] Przygotuj okno w trybie incognito do testów niezalogowanego użytkownika

---

## Test 1: Landing Page (Niezalogowany)
**Cel:** Sprawdzić czy niezalogowani widzą stronę powitalną

- [ ] Otwórz tryb incognito
- [ ] Wejdź na http://localhost:3000/
- [ ] **Oczekiwany wynik:** Widzisz stronę "Witaj w 10xDevs Astro Starter!"
- [ ] **Status:** ✅ Pass / ❌ Fail

---

## Test 2: Dostęp do chronionej strony (Niezalogowany)
**Cel:** Sprawdzić przekierowanie do logowania

- [ ] W trybie incognito wejdź na http://localhost:3000/profiles
- [ ] **Oczekiwany wynik:** Przekierowanie do `/auth/login?redirect=/profiles`
- [ ] **Status:** ✅ Pass / ❌ Fail

---

## Test 3: Dostęp do strony logowania (Niezalogowany)
**Cel:** Sprawdzić dostęp do strony logowania

- [ ] W trybie incognito wejdź na http://localhost:3000/auth/login
- [ ] **Oczekiwany wynik:** Widzisz formularz logowania
- [ ] **Status:** ✅ Pass / ❌ Fail

---

## Test 4: Logowanie
**Cel:** Sprawdzić proces logowania i przekierowanie

- [ ] Na stronie `/auth/login` wprowadź poprawne dane logowania
- [ ] Kliknij "Zaloguj się"
- [ ] **Oczekiwany wynik:** Przekierowanie do `/profiles`
- [ ] **Dodatkowa weryfikacja:** W nagłówku widać email użytkownika i przycisk "Wyloguj"
- [ ] **Status:** ✅ Pass / ❌ Fail

---

## Test 5: Dostęp do strony głównej (Zalogowany)
**Cel:** Sprawdzić przekierowanie zalogowanego z landing page

- [ ] Po zalogowaniu wejdź na http://localhost:3000/
- [ ] **Oczekiwany wynik:** Przekierowanie do `/profiles`
- [ ] **Status:** ✅ Pass / ❌ Fail

---

## Test 6: Próba dostępu do strony logowania (Zalogowany)
**Cel:** Sprawdzić czy zalogowany nie może wejść na stronę logowania

- [ ] Po zalogowaniu wejdź na http://localhost:3000/auth/login
- [ ] **Oczekiwany wynik:** Przekierowanie do `/profiles`
- [ ] **Status:** ✅ Pass / ❌ Fail

---

## Test 7: Próba dostępu do strony rejestracji (Zalogowany)
**Cel:** Sprawdzić czy zalogowany nie może wejść na stronę rejestracji

- [ ] Po zalogowaniu wejdź na http://localhost:3000/auth/register
- [ ] **Oczekiwany wynik:** Przekierowanie do `/profiles`
- [ ] **Status:** ✅ Pass / ❌ Fail

---

## Test 8: Wylogowanie
**Cel:** Sprawdzić proces wylogowania

- [ ] Po zalogowaniu kliknij przycisk "Wyloguj" w nagłówku
- [ ] **Oczekiwany wynik:**
  - Przycisk pokazuje "Wylogowywanie..."
  - Następuje przekierowanie do `/auth/login`
- [ ] **Status:** ✅ Pass / ❌ Fail

---

## Test 9: Dostęp do chronionej strony po wylogowaniu
**Cel:** Sprawdzić czy po wylogowaniu sesja jest wyczyszczona

- [ ] Po wylogowaniu spróbuj wejść na http://localhost:3000/profiles
- [ ] **Oczekiwany wynik:** Przekierowanie do `/auth/login?redirect=/profiles`
- [ ] **Status:** ✅ Pass / ❌ Fail

---

## Test 10: Rejestracja i automatyczne logowanie
**Cel:** Sprawdzić flow rejestracji

- [ ] Otwórz tryb incognito
- [ ] Wejdź na http://localhost:3000/auth/register
- [ ] Zarejestruj nowe konto
- [ ] **Oczekiwany wynik:** Przekierowanie do `/auth/login` (lub automatyczne logowanie)
- [ ] **Status:** ✅ Pass / ❌ Fail

---

## Test 11: Zabezpieczenie API endpoints (Optional)
**Cel:** Sprawdzić czy API wymaga autoryzacji

- [ ] Otwórz DevTools (F12) → Network
- [ ] Wyloguj się
- [ ] W konsoli wykonaj:
  ```javascript
  fetch('/api/profiles').then(r => r.json()).then(console.log)
  ```
- [ ] **Oczekiwany wynik:** Błąd 401 Unauthorized lub brak danych (zależnie od implementacji endpoint)
- [ ] **Status:** ✅ Pass / ❌ Fail

---

## Test 12: Cookies Security (Optional)
**Cel:** Sprawdzić czy cookies mają poprawne flagi bezpieczeństwa

- [ ] Zaloguj się
- [ ] Otwórz DevTools → Application → Cookies
- [ ] Sprawdź cookie Supabase (nazwa zaczyna się od `sb-`)
- [ ] **Oczekiwana konfiguracja:**
  - HttpOnly: ✅
  - Secure: ✅ (jeśli HTTPS)
  - SameSite: Lax lub Strict
- [ ] **Status:** ✅ Pass / ❌ Fail

---

## Test 13: Przycisk "Wstecz" (KRYTYCZNY)
**Cel:** Sprawdzić czy cache control działa i zapobiega problemowi przycisku wstecz

- [ ] Zaloguj się (powinieneś być na `/profiles`)
- [ ] Kliknij przycisk "Wstecz" w przeglądarce
- [ ] **Oczekiwany wynik:**
  - Przeglądarka wysyła żądanie do serwera (sprawdź Network w DevTools)
  - Middleware wykrywa, że jesteś zalogowany
  - Następuje przekierowanie do `/profiles`
  - **NIE widzisz** strony logowania
- [ ] **Dodatkowa weryfikacja:** Sprawdź w DevTools → Network czy są nagłówki:
  - `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`
  - `Pragma: no-cache`
  - `Expires: 0`
- [ ] **Status:** ✅ Pass / ❌ Fail

---

## Podsumowanie Testów

| Test | Status | Uwagi |
|------|--------|-------|
| 1. Landing Page (Niezalogowany) | ☐ | |
| 2. Chroniona strona (Niezalogowany) | ☐ | |
| 3. Strona logowania (Niezalogowany) | ☐ | |
| 4. Logowanie | ☐ | |
| 5. Landing page (Zalogowany) | ☐ | |
| 6. Strona logowania (Zalogowany) | ☐ | |
| 7. Strona rejestracji (Zalogowany) | ☐ | |
| 8. Wylogowanie | ☐ | |
| 9. Chroniona strona po wylogowaniu | ☐ | |
| 10. Rejestracja | ☐ | |
| 11. API Security | ☐ | Optional |
| 12. Cookies Security | ☐ | Optional |
| **13. Przycisk "Wstecz"** | ☐ | **KRYTYCZNY** |

---

## Troubleshooting

### Problem: 404 Not found po logowaniu
**Rozwiązanie:** Sprawdź czy ścieżka `/profiles` istnieje i nie ma błędów w komponencie

### Problem: Nieskończona pętla przekierowań
**Rozwiązanie:**
1. Sprawdź `PUBLIC_PATHS` w middleware
2. Upewnij się że `/auth/login` jest w `PUBLIC_PATHS`
3. Sprawdź czy `AUTH_PAGES` nie zawiera sprzecznych ścieżek

### Problem: "Missing Supabase environment variables"
**Rozwiązanie:**
1. Sprawdź plik `.env`
2. Upewnij się że zmienne zaczynają się od `PUBLIC_`
3. Zrestartuj serwer dev

### Problem: Cookies nie są ustawiane
**Rozwiązanie:**
1. Sprawdź czy middleware używa `getAll()` i `setAll()`
2. Sprawdź konsol
ę przeglądarki czy są błędy CORS
3. Upewnij się że Supabase URL i Key są poprawne

### Problem: Użytkownik pozostaje zalogowany po wylogowaniu
**Rozwiązanie:**
1. Sprawdź czy `/api/auth/logout` wywołuje `supabase.auth.signOut()`
2. Wyczyść cookies ręcznie w DevTools
3. Sprawdź czy endpoint zwraca sukces (200)

### Problem: Przycisk "Wstecz" pokazuje cache'owaną stronę logowania
**Rozwiązanie:**
1. Sprawdź czy middleware dodaje Cache-Control headers do stron auth
2. W DevTools → Network włącz "Disable cache" i przetestuj ponownie
3. Wyczyść cache przeglądarki (Ctrl+Shift+Delete)
4. Sprawdź w DevTools → Network → Response Headers czy widzisz:
   - `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`
   - `Pragma: no-cache`
   - `Expires: 0`

---

## Następne Kroki

Po pomyślnym przejściu wszystkich testów:
- [ ] Zaktualizuj `CLAUDE.md` jeśli potrzeba
- [ ] Sprawdź czy middleware jest dobrze udokumentowany
- [ ] Rozważ dodanie testów E2E (Playwright/Cypress)
- [ ] Sprawdź performance w Production build (`npm run build && npm run preview`)
