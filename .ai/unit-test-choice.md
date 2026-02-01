# Analiza fragmentów projektu do testów jednostkowych

## Pięć najlepszych fragmentów do pokrycia unit testami

### 1. **Algorytm 80/20 w `get_next_words()` (Funkcja bazodanowa)**

**Dlaczego jest krytyczny:**
- Rdzeń logiki biznesowej aplikacji - determinuje jakość doświadczenia edukacyjnego
- Złożona logika warunkowa (znane/nieznane słowa, mastered/unmastered, randomizacja)
- Bezpośredni wpływ na efektywność nauki dzieci
- Trudny do debugowania w środowisku produkcyjnym

**Co testować:**
- Czy zwraca 80% nieprzyswojonych i 20% przyswojonych słów gdy oba typy istnieją
- Czy priorytetyzuje całkowicie nieznane słowa
- Czy najstarsze przyswojone słowa (wg `last_attempted_at`) trafiają do powtórek
- Czy respektuje limit 10 słów
- Czy losowość nie wprowadza duplikatów

### 2. **Logika gwiazdek i mastery w `useGameSession.ts`**

**Dlaczego jest krytyczny:**
- Bezpośrednia gratyfikacja użytkownika - błędy frustrują dzieci i rodziców
- Matematyka przyznawania gwiazdek (3/2/1 za 1/2/3+ próbę)
- Stan `is_mastered` musi być ustawiony poprawnie dla algorytmu 80/20
- Logika retry i zliczania prób jest podatna na edge cases

**Co testować:**
```typescript
// Przykładowe przypadki testowe:
- 1. próba poprawna → 3 gwiazdki, is_mastered = true
- 2. próba poprawna → 2 gwiazdki, is_mastered = true
- 3. próba poprawna → 1 gwiazdka, is_mastered = true
- 4.+ próba poprawna → 1 gwiazdka, is_mastered = true
- Poprawna → błędna → is_mastered pozostaje true
- Czy attempts_count inkrementuje się prawidłowo
```

### 3. **Walidacja Zod w API endpoints (np. `POST /api/profiles`)**

**Dlaczego jest krytyczny:**
- Pierwsza linia obrony przed złośliwymi/błędnymi danymi
- Zapobiega naruszeniom integralności bazy danych
- Walidacja `display_name` (min/max długość, znaki specjalne)
- Walidacja `avatar_url` (format URL, whitelist domen)
- Limit 5 profili na rodzica

**Co testować:**
```typescript
// Schema validation tests:
- Odrzucenie pustego display_name
- Odrzucenie display_name > 50 znaków
- Akceptacja poprawnego avatar_url
- Odrzucenie nieprawidłowego URL
- Walidacja opcjonalnych pól (avatar_url nullable)
- Handling brakujących wymaganych pól
```

### 4. **Hook `useProfilesManager.ts` (CRUD profili)**

**Dlaczego jest krytyczny:**
- Zarządza kluczowym stanem aplikacji (lista profili dzieci)
- Implementuje regułę biznesową "max 5 profili"
- Logika "nie można usunąć ostatniego profilu"
- Synchronizacja stanu lokalnego z Supabase
- Handling błędów sieciowych i race conditions

**Co testować:**
```typescript
- fetchProfiles() pobiera tylko profile zalogowanego rodzica
- createProfile() dodaje profil i aktualizuje stan
- Blokada utworzenia 6. profilu
- deleteProfile() odmawia usunięcia ostatniego profilu
- updateProfile() aktualizuje właściwe pola
- Error handling przy problemach z siecią
- Optimistic updates (jeśli zaimplementowane)
```

### 5. **Funkcja agregacji statystyk `useProgressStats.ts`**

**Dlaczego jest krytyczny:**
- Dashboard rodziców - musi pokazywać dokładne dane postępów
- Agreguje dane z wielu źródeł (user_progress, vocabulary)
- Oblicza procenty mastery (`words_mastered / total_words * 100`)
- Sumuje gwiazdki z różnych kategorii
- Wydajność przy 250 słowach × 5 profili

**Co testować:**
```typescript
- Poprawność obliczeń total_stars
- Poprawność words_mastered count
- Mastery percentage: 0%, 50%, 100% edge cases
- Podział statystyk per kategoria
- Handling profilu bez żadnego postępu (0/0)
- Performance z dużą ilością danych
- Czy filtruje po profile_id prawidłowo
```

---

## Dodatkowe uzasadnienie wyboru

Te fragmenty spełniają kryteria **wysokiego ROI dla testów jednostkowych**:

1. ✅ **Złożona logika biznesowa** - nie proste CRUD, tylko algorytmy z warunkami
2. ✅ **Izolowalne** - można testować bez pełnego stacku (mocki Supabase, React Testing Library)
3. ✅ **Krytyczne dla UX** - błędy tutaj = frustracja użytkowników
4. ✅ **Podatne na regresję** - łatwo zepsuć przy refaktoryzacji
5. ✅ **Weryfikowalne** - jasne expected outputs dla danych inputs

### Narzędzia rekomendowane:
- **Vitest** - zgodnie z wytycznymi projektu
- **@testing-library/react** - dla hooków i komponentów React
- **msw** (Mock Service Worker) - dla mocków Supabase API
- **@supabase/supabase-js** mocks - vi.mock() dla klienta Supabase

## Status implementacji

- [x] Logika gwiazdek i mastery w `useGameSession.ts` ✅ **20+ testów**
- [x] Hook `useProfilesManager.ts` (CRUD profili) ✅ **18+ testów**
- [x] Funkcja agregacji statystyk `useProgressStats.ts` ✅ **16+ testów**
- [x] Walidacja Zod w API endpoints ✅ **35+ testów**
- [ ] Algorytm 80/20 w `get_next_words()` (testy integracyjne z bazą danych) - wymaga oddzielnej konfiguracji

**Łącznie zaimplementowano: 89+ przypadków testowych**

## Szczegóły implementacji

Zobacz [unit-tests-implementation-summary.md](./unit-tests-implementation-summary.md) dla:
- Pełnego podsumowania implementacji
- Szczegółowego pokrycia testowego
- Statusu uruchomienia i znanych problemów
- Instrukcji rozwiązania problemu z Vitest 4.x na Windows
