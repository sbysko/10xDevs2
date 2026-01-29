# Plan implementacji widoku Sesja Gry (`/game/session`)

## 1. Przegląd

Widok **Sesja Gry** jest kluczowym punktem rozpoczęcia rozgrywki. Jego głównym celem jest wygenerowanie zestawu 10 pytań dla wybranego profilu i kategorii, z wykorzystaniem algorytmu 80/20 (80% nieopanowanych słów + 20% opanowanych dla powtórki).

## 2. Routing widoku

- **Ścieżka:** `/game/session`
- **Query params:** `?category=<vocabulary_category>` (opcjonalny)
- **Typ renderowania:** Hybrid (Astro Page z React Island)

## 3. Struktura komponentów

```
GameSessionPage (Astro)
└── GameSessionManager (React Island)
    ├── SessionLoader (Loading state)
    ├── SessionError (Error state)
    └── GameScreen (Success state)
        ├── QuestionCard (Aktywne pytanie)
        │   ├── WordImage (Obrazek słowa)
        │   └── AnswerButtons (3 przyciski odpowiedzi)
        ├── ProgressBar (Pasek postępu 1/10, 2/10...)
        └── ResultsModal (Podsumowanie po ukończeniu)
```

## 4. Szczegóły komponentów

### GameSessionManager (Container)

**Opis:** Główny komponent zarządzający cyklem życia sesji gry

**Główne elementy:**
- SessionLoader - podczas tworzenia sesji
- SessionError - gdy błąd API
- GameScreen - podczas rozgrywki

**Obsługiwane interakcje:**
- Pobieranie sessionId z URL lub tworzenie nowej sesji
- Ładowanie słów z API
- Przejście między pytaniami
- Zapisywanie odpowiedzi

**Typy:** `GameSessionDTO`, `GameWordDTO`

### SessionLoader

**Opis:** Ekran ładowania podczas generowania sesji

**Główne elementy:**
- Spinner animowany
- Tekst "Przygotowujemy pytania..."
- Informacja o kategorii (jeśli wybrana)

**Obsługiwane interakcje:** Brak (pasywny state)

### QuestionCard

**Opis:** Karta z aktualnym pytaniem

**Główne elementy:**
- Numer pytania (1/10, 2/10...)
- Obrazek słowa (duży, centralny)
- 3 przyciski odpowiedzi (1 poprawna + 2 dystraktorzy)

**Obsługiwane interakcje:**
- Kliknięcie przycisku odpowiedzi
- Animacja feedback (sukces/błąd)

**Propsy:** `word: GameWordDTO`, `onAnswer: (isCorrect: boolean) => void`

### AnswerButtons

**Opis:** 3 duże przyciski z możliwymi odpowiedziami

**Główne elementy:**
- 3 buttony z tekstem słowa
- Losowa pozycja poprawnej odpowiedzi
- Animacje feedback

**Obsługiwane interakcje:**
- Kliknięcie → walidacja → feedback → next question

**Logika:**
- Poprawna odpowiedź: aktualny GameWordDTO.word_text
- 2 dystraktorzy: losowe słowa z tej samej kategorii

### ProgressBar

**Opis:** Wizualny pasek postępu sesji

**Główne elementy:**
- Licznik "3/10"
- Pasek wizualny (width: 30%)
- Gwiazdki za poprawne odpowiedzi (opcjonalne)

**Propsy:** `current: number`, `total: number`, `stars: number`

### ResultsModal

**Opis:** Modal z podsumowaniem po ukończeniu sesji

**Główne elementy:**
- Łączna liczba gwiazdek
- Liczba opanowanych słów
- Przycisk "Graj ponownie"
- Przycisk "Zmień kategorię"

**Obsługiwane interakcje:**
- "Graj ponownie" → nowa sesja w tej samej kategorii
- "Zmień kategorię" → powrót do `/game/categories`

## 5. Typy

Z `types.ts`:

```typescript
// Request
interface CreateGameSessionCommand {
  profile_id: string;
  category?: VocabularyCategory | null;
  word_count?: number;
}

// Response
interface GameSessionDTO {
  session_id: string;
  profile_id: string;
  category: VocabularyCategory | null;
  word_count: number;
  words: GameWordDTO[];
  algorithm: AlgorithmInfo;
  created_at: string;
}

interface GameWordDTO {
  id: string;
  word_text: string;
  category: VocabularyCategory;
  image_path: string;
  image_url: string;
  difficulty_level: number | null;
  is_mastered: boolean;
  previous_stars: number;
  previous_attempts: number;
}
```

Nowe typy dla widoku:

```typescript
// Stan gry
interface GameState {
  session: GameSessionDTO | null;
  currentQuestionIndex: number;
  answers: AnswerRecord[];
  isComplete: boolean;
}

// Rekord odpowiedzi
interface AnswerRecord {
  vocabulary_id: string;
  is_correct: boolean;
  attempt_number: number;
  stars_earned: number;
}

// Opcje odpowiedzi
interface AnswerOption {
  text: string;
  isCorrect: boolean;
}
```

## 6. Zarządzanie stanem

Custom hook `useGameSession()`:

**Zadania:**
- Tworzenie sesji (POST /api/game/sessions)
- Zarządzanie aktualnym pytaniem
- Generowanie dystraktorów (2 losowe słowa z kategorii)
- Walidacja odpowiedzi
- Zapisywanie postępu (batch POST /api/progress po ukończeniu)
- Obliczanie gwiazdek (3/2/1 based on attempt)

**State:**
```typescript
{
  session: GameSessionDTO | null;
  currentQuestionIndex: number;
  answers: AnswerRecord[];
  isLoading: boolean;
  error: string | null;
}
```

## 7. Integracja API

### 1. Tworzenie sesji: `POST /api/game/sessions`

**Request:**
```json
{
  "profile_id": "uuid",
  "category": "zwierzeta",
  "word_count": 10
}
```

**Response:** `GameSessionDTO` z 10 słowami

**Algorytm 80/20:**
- Funkcja DB: `get_next_words(p_profile_id, p_category, p_limit)`
- Logika:
  1. Priorytet: słowa bez user_progress (unknown)
  2. 80% unmastered (is_mastered = false)
  3. 20% mastered (is_mastered = true, oldest first)
  4. Random shuffle końcowej selekcji

### 2. Zapisywanie postępu: `POST /api/progress` (batch)

**Request:**
```json
{
  "profile_id": "uuid",
  "results": [
    {
      "vocabulary_id": "uuid",
      "is_correct": true,
      "attempt_number": 1
    }
  ]
}
```

**Response:** `BatchProgressResponseDTO`

**Timing:** Po ukończeniu wszystkich 10 pytań (batch upsert)

## 8. Interakcje użytkownika

### Flow główny:

1. **Wejście na stronę:**
   - Z `/game/categories` → kliknięcie karty kategorii
   - URL: `/game/session?category=zwierzeta`
   - Pobiera profileId z sessionStorage

2. **Tworzenie sesji:**
   - Loading state (SessionLoader)
   - API call: POST /api/game/sessions
   - Success: Przejście do GameScreen
   - Error: Wyświetlenie błędu + retry

3. **Rozgrywka (10 pytań):**
   - **Pytanie 1:**
     - Wyświetl obrazek słowa
     - Wygeneruj 3 opcje (1 correct + 2 distractors)
     - Czekaj na odpowiedź
   - **Odpowiedź:**
     - Kliknięcie przycisku
     - Walidacja (correct/incorrect)
     - Feedback wizualny (zielony/czerwony)
     - Zapisz do local state
     - Liczba prób: increment (unlimited retries)
   - **Next question:**
     - Delay 1s (feedback)
     - Przejście do pytania 2/10
     - Repeat

4. **Ukończenie sesji:**
   - Po 10 pytaniach → ResultsModal
   - Batch save: POST /api/progress z wszystkimi odpowiedziami
   - Wyświetl statystyki:
     - Total stars
     - Newly mastered words
   - Opcje:
     - "Graj ponownie" → nowa sesja
     - "Zmień kategorię" → /game/categories

### Logika gwiazdek:

- **Attempt 1 correct:** 3 stars ⭐⭐⭐
- **Attempt 2 correct:** 2 stars ⭐⭐
- **Attempt 3+ correct:** 1 star ⭐
- **Incorrect:** 0 stars (unlimited retries)

### Logika mastery:

- **is_mastered = true** gdy answered correctly (pozostaje true nawet jeśli później błąd)

## 9. Warunki i walidacja

- **Profile ID:** Wymagany w sessionStorage (redirect do /profiles jeśli brak)
- **Category:** Opcjonalny query param (null = mixed categories)
- **Word count:** Default 10, min 5, max 20
- **Insufficient words:** Obsługa błędu 422 (InsufficientWordsErrorDTO)
- **Distractors:** Muszą być z tej samej kategorii co pytanie
- **No duplicate distractors:** Sprawdzenie unikalności

## 10. Obsługa błędów

- **Brak profilu:** Redirect do `/profiles` z komunikatem
- **Insufficient words:** Komunikat "Za mało słów w tej kategorii (dostępne: X, wymagane: 10)"
- **Network error:** "Nie udało się utworzyć sesji" + retry button
- **Invalid session:** Jeśli session_id w URL nie istnieje → 404
- **Progress save failed:** Wyświetl warning, ale pozwól kontynuować (opcja retry później)

## 11. Kroki implementacji

### Krok 1: API Endpoint

**Pliki:**
- `src/pages/api/game/sessions.ts` - POST endpoint
- `src/lib/services/game-session.service.ts` - Serwis

**Zadania:**
1. Utworzyć folder `src/pages/api/game/`
2. Zaimplementować `POST /api/game/sessions`
3. Wywołać funkcję DB `get_next_words()`
4. Mapować do `GameSessionDTO`
5. Obsłużyć błąd `insufficient_words` (422)

### Krok 2: Custom Hook

**Plik:** `src/components/hooks/useGameSession.ts`

**Zadania:**
1. State management dla sesji
2. Funkcja `createSession(profileId, category)`
3. Funkcja `generateAnswerOptions(currentWord, allWords)`
4. Funkcja `submitAnswer(vocabularyId, isCorrect)`
5. Funkcja `nextQuestion()`
6. Funkcja `completeSession()` → batch save progress

### Krok 3: Komponenty UI

**Pliki:**
- `src/components/GameSessionManager.tsx` - Container
- `src/components/SessionLoader.tsx` - Loading state
- `src/components/GameScreen.tsx` - Main game
- `src/components/QuestionCard.tsx` - Question display
- `src/components/AnswerButtons.tsx` - Answer options

**Zadania:**
1. SessionLoader z spinner + kategoria
2. QuestionCard z obrazkiem + progress
3. AnswerButtons z 3 opcjami
4. Feedback animations (correct/incorrect)
5. ResultsModal z statystykami

### Krok 4: Strona Astro

**Plik:** `src/pages/game/session.astro`

**Zadania:**
1. Hybrid rendering
2. Extract query params (category)
3. Walidacja profileId z sessionStorage (client-side)
4. React Island: `<GameSessionManager />`

### Krok 5: Integracja z Progress API

**Zadania:**
1. Użyć istniejącego endpoint `POST /api/progress` (batch mode)
2. Przygotować `RecordBatchProgressCommand`
3. Wywołać po ukończeniu sesji
4. Obsłużyć response (stars_earned per word)

### Krok 6: Generowanie dystraktorów

**Logika (w useGameSession):**
```typescript
function generateDistractors(
  correctWord: GameWordDTO,
  allWords: GameWordDTO[],
  count: 2
): string[] {
  // Filter words from same category
  const sameCategory = allWords.filter(
    w => w.category === correctWord.category && w.id !== correctWord.id
  );

  // Shuffle and pick 2
  const shuffled = sameCategory.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(w => w.word_text);
}
```

### Krok 7: Testowanie

**Scenariusze:**
1. Rozpoczęcie sesji dla kategorii z 50+ słowami
2. Rozpoczęcie sesji dla mixed categories
3. Odpowiedź poprawna za 1 razem (3 stars)
4. Odpowiedź poprawna za 2 razem (2 stars)
5. Odpowiedź poprawna za 3+ razem (1 star)
6. Ukończenie sesji → sprawdzenie batch save
7. Kategoria z <10 słowami → błąd 422
8. Brak profilu w sessionStorage → redirect

## 12. Obrazki słownictwa

**Problem:** Placeholder ścieżki w bazie (`vocabulary/category/word.jpg`)

**Rozwiązania:**

**Opcja A:** Supabase Storage (produkcja)
- Upload 250 obrazków do bucket `vocabulary`
- Ścieżki: `vocabulary/zwierzeta/pies.jpg`
- VocabularyDTO.image_url = computed public URL

**Opcja B:** Placeholders (development)
- Użyć Lorem Picsum: `https://picsum.photos/400/300?random=<vocabulary_id>`
- Lub Unsplash API z keyword search

**Opcja C:** Emoji fallback (MVP)
- Mapowanie słowo → emoji (temporary)
- `pies` → 🐕, `kot` → 🐈, `jabłko` → 🍎

**Rekomendacja:** Opcja C dla MVP, potem Opcja A dla produkcji

## 13. Performance optimizations

- **Prefetch session:** Rozpocznij tworzenie sesji już przy kliknięciu karty kategorii
- **Image preloading:** Załaduj wszystkie 10 obrazków podczas SessionLoader
- **Memoization:** React.memo dla QuestionCard (avoid re-renders)
- **Local state:** Zapisuj odpowiedzi lokalnie, batch save na końcu (reduce API calls)

## 14. Zgodność z PRD

- ✅ 10 pytań per sesja
- ✅ Algorytm 80/20 (prioritize unmastered)
- ✅ 3 opcje odpowiedzi (1 correct + 2 distractors)
- ✅ Unlimited retries (child-friendly)
- ✅ Star system (3/2/1 based on attempts)
- ✅ Progress tracking (UPSERT to user_progress)
- ✅ Mastery flag (is_mastered = true on first correct)

---

**Status:** 📝 Plan gotowy do implementacji
**Następny krok:** Implementacja Krok 1 (API Endpoint)
