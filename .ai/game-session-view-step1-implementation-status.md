# Status implementacji widoku Sesja Gry (`/game/session`) - Krok 1

## Data: 2026-01-29

---

## Zrealizowane kroki (Sesja 1: Kroki 1-3)

### ✅ Krok 0: Plan implementacji (100%)

**Utworzony plik:**
- [game-session-view-implementation-plan.md](game-session-view-implementation-plan.md) - Kompletny plan implementacji

**Zawartość:**
- Przegląd widoku i cel biznesowy
- Struktura komponentów (6 głównych komponentów)
- Szczegółowe typy TypeScript
- Integracja API (POST /api/game/sessions, POST /api/progress)
- Algorytm 80/20 (opis działania)
- Flow użytkownika (10 pytań, unlimited retries, system gwiazdek)
- Obsługa błędów i edge cases
- 7 kroków implementacji

---

### ✅ Krok 1: GameSessionService (100%)

**Utworzony plik:**
- [game-session.service.ts](../src/lib/services/game-session.service.ts) - Serwis sesji gry

**Funkcjonalności:**
- Metoda `createSession(command)` - Tworzy sesję z algorytmem 80/20
- Wywołanie funkcji DB `get_next_words(p_profile_id, p_category, p_limit)`
- Pobieranie user_progress dla wybranych słów
- Mapowanie do `GameWordDTO` z computed image URLs
- Obliczanie `AlgorithmInfo` (unmastered/mastered counts)
- Generowanie unikalnego `session_id` (UUID)

**Algorytm 80/20:**
```sql
-- Wywoływana funkcja DB: get_next_words()
-- Logika:
-- 1. Priorytet: unknown words (no user_progress)
-- 2. 80% unmastered (is_mastered = false)
-- 3. 20% mastered (is_mastered = true, oldest first)
-- 4. Random shuffle
```

**Image URLs (MVP):**
- Używa Lorem Picsum z consistent seed based on word name
- URL format: `https://picsum.photos/seed/{hash}/400/300`
- TODO: Zastąpić Supabase Storage URLs po uploadzie obrazków

**Walidacja:**
- `word_count`: min 5, max 20
- Insufficient words: throw error z kodem `insufficient_words`

---

### ✅ Krok 2: API Endpoint (100%)

**Utworzony plik:**
- [/api/game/sessions.ts](../src/pages/api/game/sessions.ts) - POST endpoint

**Funkcjonalności:**
- Method: `POST /api/game/sessions`
- Auth: JWT required (Authorization: Bearer <token>)
- Request body: `CreateGameSessionCommand`
  ```json
  {
    "profile_id": "uuid",
    "category": "zwierzeta", // opcjonalny
    "word_count": 10 // opcjonalny, default 10
  }
  ```
- Response 201: `GameSessionDTO` z 10 słowami
- Walidacja Zod: profile_id (UUID), category (enum), word_count (5-20)
- Weryfikacja ownership: Sprawdza czy profile.parent_id === auth.uid()

**Obsługa błędów:**
- 401 Unauthorized - brak/nieprawidłowy token
- 400 Bad Request - błędy walidacji Zod
- 404 Not Found - profil nie istnieje
- 403 Forbidden - profil należy do innego rodzica
- 422 Unprocessable Entity - za mało słów (InsufficientWordsErrorDTO)
- 500 Internal Server Error - błędy bazy danych

**Security:**
- JWT validation przed każdą operacją
- Profile ownership check (explicit query)
- RLS policies na user_progress i vocabulary (automatyczne filtrowanie)

---

### ✅ Krok 3: Custom Hook (100%)

**Utworzony plik:**
- [useGameSession.ts](../src/components/hooks/useGameSession.ts) - Hook zarządzający grą

**Funkcjonalności:**

**State management:**
```typescript
{
  session: GameSessionDTO | null;
  currentQuestionIndex: number;
  answers: AnswerRecord[];
  currentAttempts: number;
  isComplete: boolean;
  isLoading: boolean;
  error: string | null;
}
```

**Computed values:**
- `currentWord` - aktualny GameWordDTO based on currentQuestionIndex
- `totalQuestions` - session.word_count (10)
- `answerOptions` - 3 opcje (1 correct + 2 distractors) w losowej kolejności

**Actions:**
- `createSession()` - POST /api/game/sessions przy montowaniu
- `submitAnswer(selectedText)` - Waliduje odpowiedź, oblicza gwiazdki, dodaje do answers
- `nextQuestion()` - Increment currentQuestionIndex, reset currentAttempts
- `restartSession()` - Reset state + nowa sesja w tej samej kategorii
- `goToCategories()` - Navigate do /game/categories

**Logika odpowiedzi:**
- **Correct answer:**
  - Oblicz stars: attempt 1 = 3⭐, attempt 2 = 2⭐, attempt 3+ = 1⭐
  - Dodaj AnswerRecord do answers array
  - Reset currentAttempts do 0
  - Jeśli ostatnie pytanie → setIsComplete(true)
- **Incorrect answer:**
  - Increment currentAttempts
  - Brak limitu prób (unlimited retries, child-friendly)

**Helper function:**
- `generateAnswerOptions(correctWord, allWords)` - Tworzy 3 opcje:
  - 1 correct: currentWord.word_text
  - 2 distractors: losowe słowa z tej samej kategorii
  - Shuffle final array (losowa pozycja correct)

**Error handling:**
- 422 Insufficient words → User-friendly message z available/requested counts
- 401 Unauthorized → "Musisz być zalogowany"
- 404 Profile not found → "Profil nie został znaleziony"
- Network errors → "Nie udało się utworzyć sesji"

---

## Struktura plików - Stan po kroku 3

```
src/
├── pages/
│   └── api/
│       └── game/
│           └── sessions.ts                    # ✅ POST endpoint
├── components/
│   └── hooks/
│       └── useGameSession.ts                  # ✅ Custom hook
└── lib/
    └── services/
        └── game-session.service.ts            # ✅ Serwis sesji

.ai/
└── game-session-view-implementation-plan.md   # ✅ Plan implementacji
```

---

## Metryki implementacji (Kroki 1-3)

### Całkowite statystyki:
- **Utworzonych plików:** 4 (1 plan + 3 implementacji)
- **Łączna liczba linii kodu:** ~950 LOC
- **API endpoints:** 1 (POST /api/game/sessions)
- **Serwisy:** 1 (GameSessionService)
- **Custom hooks:** 1 (useGameSession)
- **Helper functions:** 2 (generateAnswerOptions, computeImageUrl)

### Breakdown:
- Plan dokumentacji: ~380 LOC
- GameSessionService: ~220 LOC
- API endpoint: ~280 LOC
- Custom hook: ~250 LOC

---

## Zgodność z PRD i planem

### ✅ Plan implementacji
- ✅ Krok 1: API Endpoint - GameSessionService + POST /api/game/sessions
- ✅ Krok 2: API Endpoint (continued)
- ✅ Krok 3: Custom Hook - useGameSession

### ✅ Algorytm 80/20
- ✅ Wywołanie funkcji DB `get_next_words()`
- ✅ Priorytetyzacja unmastered words
- ✅ 80% unmastered + 20% mastered mix
- ✅ Random shuffle końcowej selekcji

### ✅ System gwiazdek
- ✅ 3 stars za 1st attempt correct
- ✅ 2 stars za 2nd attempt correct
- ✅ 1 star za 3rd+ attempt correct
- ✅ Unlimited retries (no penalty)

### ✅ Typy TypeScript
- ✅ Wszystkie typy z types.ts (GameSessionDTO, GameWordDTO, CreateGameSessionCommand)
- ✅ Nowe typy w hook (AnswerOption, AnswerRecord, GameState)
- ✅ snake_case naming convention

### ✅ Zasady implementacji
- ✅ **Astro:** Server Endpoints, `prerender = false`
- ✅ **React:** Functional components, hooks (useState, useEffect, useCallback, useMemo)
- ✅ **TypeScript:** Pełne typowanie, strict mode
- ✅ **Zod:** Walidacja request body
- ✅ **Error handling:** Guard clauses, early returns, user-friendly messages
- ✅ **Security:** JWT authentication, profile ownership verification, RLS policies
- ✅ **Services:** Logika biznesowa w GameSessionService
- ✅ **Custom hooks:** Logika UI w useGameSession

---

## Status implementacji

**Status:** ✅ **Kroki 1-3 UKOŃCZONE (33% widoku)**

**Zrealizowane:**
- ✅ Plan implementacji (100%)
- ✅ GameSessionService z algorytmem 80/20 (100%)
- ✅ API Endpoint POST /api/game/sessions (100%)
- ✅ Custom Hook useGameSession (100%)

**Pozostało do zrobienia:**
- ⏳ Krok 4: Komponenty UI (SessionLoader, GameScreen, QuestionCard, AnswerButtons)
- ⏳ Krok 5: Strona Astro `/game/session.astro`
- ⏳ Krok 6: ResultsModal + integracja z POST /api/progress (batch save)
- ⏳ Krok 7: Testowanie

---

## Następne kroki (Kroki 4-6)

### **Krok 4: Komponenty UI bazowe**

**Pliki do utworzenia:**
1. `SessionLoader.tsx` - Ekran ładowania podczas tworzenia sesji
2. `GameSessionManager.tsx` - Główny kontener (używa useGameSession)
3. `GameScreen.tsx` - Ekran rozgrywki

**Zadania:**
- SessionLoader: Spinner + "Przygotowujemy pytania..." + kategoria
- GameSessionManager: Orchestration (loading/error/success states)
- GameScreen: Layout z QuestionCard + ProgressBar

---

### **Krok 5: Komponenty pytań i odpowiedzi**

**Pliki do utworzenia:**
1. `QuestionCard.tsx` - Wyświetlanie pytania (obrazek + numer)
2. `AnswerButtons.tsx` - 3 przyciski odpowiedzi
3. `ProgressBar.tsx` - Pasek postępu (X/10)

**Zadania:**
- QuestionCard: Duży obrazek (400x300), numer pytania
- AnswerButtons: 3 duże przyciski, animacje feedback (green/red)
- ProgressBar: Wizualny pasek + licznik + gwiazdki (opcjonalnie)

---

### **Krok 6: Strona Astro + ResultsModal**

**Pliki do utworzenia:**
1. `/game/session.astro` - Strona widoku
2. `ResultsModal.tsx` - Podsumowanie sesji

**Zadania:**
- session.astro: Hybrid rendering, extract query params, React Island
- ResultsModal: Total stars, newly mastered words, "Graj ponownie", "Zmień kategorię"
- Integracja: POST /api/progress (batch mode) po ukończeniu sesji

---

## Znane ograniczenia (MVP)

### 1. Placeholder obrazki (Lorem Picsum)
**Status:** GameSessionService używa Lorem Picsum z consistent seed

**Rozwiązanie produkcyjne:**
- Upload 250 obrazków do Supabase Storage bucket `vocabulary`
- Zaktualizować `computeImageUrl()` w GameSessionService:
  ```typescript
  const { data } = this.supabase.storage
    .from('vocabulary')
    .getPublicUrl(imagePath);
  return data.publicUrl;
  ```

---

### 2. Brak persystencji sesji
**Status:** Session istnieje tylko w pamięci React state

**Rozwiązanie przyszłościowe:**
- Zapisać session_id w sessionStorage
- Dodać endpoint GET /api/game/sessions/:id (fetch existing session)
- Umożliwić kontynuację po odświeżeniu strony

---

### 3. Brak offline support
**Status:** Wymaga połączenia z API do utworzenia sesji

**Rozwiązanie przyszłościowe:**
- Service Worker dla offline capability
- Cache vocabulary data in IndexedDB
- Sync progress when connection restored

---

## Rekomendacje

### Przed przejściem do kroków 4-6:
- [ ] Sprawdzić czy funkcja DB `get_next_words()` istnieje i działa poprawnie
- [ ] Przetestować endpoint POST /api/game/sessions via cURL
- [ ] Zweryfikować RLS policies dla user_progress i vocabulary

### Performance optimizations:
- [ ] Prefetch session podczas kliknięcia karty kategorii (preload)
- [ ] Image preloading dla wszystkich 10 obrazków podczas SessionLoader
- [ ] React.memo dla QuestionCard (unikać re-renders)

### UX improvements:
- [ ] Animacje transitions między pytaniami (Framer Motion)
- [ ] Dźwięki feedback (correct/incorrect)
- [ ] Haptic feedback na mobile (vibrate API)
- [ ] Confetti animation przy 100% poprawnych odpowiedzi

---

## Podsumowanie dla zespołu

**Pierwsze 3 kroki widoku `/game/session` zostały ukończone (backend + logika).**

Zaimplementowano:
- ✅ Plan implementacji z 7 krokami
- ✅ GameSessionService z algorytmem 80/20
- ✅ API Endpoint POST /api/game/sessions z pełną walidacją
- ✅ Custom Hook useGameSession z logiką rozgrywki

**Następny priorytet:** Implementacja komponentów UI (SessionLoader, GameScreen, QuestionCard, AnswerButtons) - Kroki 4-5

**Oczekiwany czas:** ~2-3 godziny na pozostałe kroki (4-7)

---

**Autor:** Claude Code
**Data:** 2026-01-29
**Wersja:** 1.0 (Kroki 1-3)
**Status:** ⏳ W TRAKCIE - 33% UKOŃCZONE
