# Plan implementacji widoku Statystyki (`/progress`)

## 1. Przegląd

Widok **Statystyki** (Progress Dashboard) umożliwia rodzicom i dzieciom śledzenie postępów nauki. Wyświetla szczegółowe statystyki dla wybranego profilu dziecka, w tym ogólne osiągnięcia, postęp per kategoria, i listę opanowanych słów.

## 2. Routing widoku

- **Ścieżka:** `/progress`
- **Query params:** `?profileId=<uuid>` (opcjonalny, można wybrać profil w UI)
- **Typ renderowania:** Hybrid (Astro Page z React Islands)

## 3. Struktura komponentów

```
ProgressPage (Astro)
└── ProgressDashboard (React Island)
    ├── ProfileSelector (Dropdown/Tabs)
    ├── StatsOverview (Karty z kluczowymi metrykami)
    │   ├── StatCard (Total Stars)
    │   ├── StatCard (Words Mastered)
    │   ├── StatCard (Mastery Percentage)
    │   └── StatCard (Total Attempts)
    ├── CategoryProgressChart (Per-category breakdown)
    │   └── CategoryProgressBar (dla każdej kategorii)
    └── MasteredWordsList (Lista opanowanych słów)
        └── WordBadge (dla każdego słowa)
```

## 4. Szczegóły komponentów

### ProgressDashboard (Container)

**Opis:** Główny komponent zarządzający widokiem statystyk

**Główne elementy:**
- ProfileSelector - wybór profilu do wyświetlenia
- StatsOverview - karty z kluczowymi metrykami
- CategoryProgressChart - wykres postępu per kategoria
- MasteredWordsList - lista opanowanych słów

**Obsługiwane interakcje:**
- Wybór profilu z dropdown
- Pobieranie statystyk z API
- Przełączanie między kategoriami

**Typy:** `ProfileStatsDTO`, `CategoryProgressDTO`

### ProfileSelector

**Opis:** Komponent wyboru profilu (jeśli rodzic ma kilka dzieci)

**Główne elementy:**
- Dropdown lub Tabs z listą profili
- Avatar + display_name dla każdego profilu

**Obsługiwane interakcje:**
- Kliknięcie → zmiana wybranego profilu → reload stats

**Propsy:** `profiles: ProfileDTO[]`, `selectedProfileId: string`, `onSelect: (id: string) => void`

### StatsOverview

**Opis:** Grid z 4 kartami kluczowych metryk

**Karty:**
1. **Total Stars** ⭐ - Łączna liczba gwiazdek
2. **Words Mastered** 🎯 - Liczba opanowanych słów
3. **Mastery %** 📊 - Procent opanowanych słów
4. **Total Attempts** 🎮 - Łączna liczba prób

**Layout:** Grid 2x2 (mobile: 1 kolumna, tablet: 2 kolumny, desktop: 4 kolumny)

### StatCard

**Opis:** Pojedyncza karta metryki

**Główne elementy:**
- Ikona emoji (duża, kolorowa)
- Wartość (liczba, duża czcionka)
- Label (opis metryki)
- Gradient background (unique per metric)

**Propsy:** `icon: string`, `value: number | string`, `label: string`, `gradient: string`

### CategoryProgressChart

**Opis:** Wykres postępu dla każdej kategorii słownictwa

**Główne elementy:**
- Lista 5 kategorii
- CategoryProgressBar dla każdej kategorii
- Sortowanie: highest % first (pokaz sukces)

**Propsy:** `categoryProgress: CategoryProgressItem[]`

### CategoryProgressBar

**Opis:** Pasek postępu dla pojedynczej kategorii

**Główne elementy:**
- Nazwa kategorii + emoji
- Progress bar (width = completion_percentage)
- Licznik: "35/50 opanowane"
- Percentage text: "70%"

**Propsy:** `category: CategoryProgressItem`

### MasteredWordsList

**Opis:** Lista wszystkich opanowanych słów

**Główne elementy:**
- WordBadge dla każdego opanowanego słowa
- Filtrowanie po kategorii (opcjonalne)
- Sortowanie: latest first (last_attempted_at DESC)

**Propsy:** `words: DetailedProgressItem[]`, `filter?: VocabularyCategory`

### WordBadge

**Opis:** Badge z opanowanym słowem

**Główne elementy:**
- Word text
- Stars earned (⭐ x N)
- Category emoji
- Hover: pokazuje attempts_count

**Propsy:** `word: DetailedProgressItem`

## 5. Typy

Wykorzystujemy istniejące typy z `types.ts`:

```typescript
// API Responses (już zdefiniowane)
interface ProfileStatsDTO {
  profile_id: string;
  display_name: string;
  avatar_url: string | null;
  total_words_attempted: number;
  words_mastered: number;
  total_stars: number;
  mastery_percentage: number;
}

interface CategoryProgressDTO {
  profile_id: string;
  language: string;
  categories: CategoryProgressItem[];
  overall: OverallProgressSummary;
}

interface CategoryProgressItem {
  category: VocabularyCategory;
  total_words: number;
  mastered_words: number;
  completion_percentage: number;
}

interface DetailedProgressDTO {
  profile_id: string;
  progress: DetailedProgressItem[];
  pagination: PaginationMeta;
}

interface DetailedProgressItem {
  id: string;
  vocabulary_id: string;
  word_text: string;
  category: VocabularyCategory;
  image_path: string;
  is_mastered: boolean;
  stars_earned: number;
  attempts_count: number;
  last_attempted_at: string | null;
  created_at: string;
}
```

## 6. Zarządzanie stanem

Custom hook `useProgressStats()`:

**Zadania:**
- Fetch profiles (GET /api/profiles)
- Fetch profile stats (GET /api/profiles/:id/stats)
- Fetch category progress (GET /api/profiles/:id/progress/categories)
- Fetch mastered words (GET /api/profiles/:id/progress?is_mastered=true)
- Handle profile selection

**State:**
```typescript
{
  profiles: ProfileDTO[];
  selectedProfileId: string | null;
  stats: ProfileStatsDTO | null;
  categoryProgress: CategoryProgressDTO | null;
  masteredWords: DetailedProgressItem[];
  isLoading: boolean;
  error: string | null;
}
```

## 7. Integracja API

### 1. Fetch all profiles: `GET /api/profiles`

**Response:** `ProfileDTO[]`

### 2. Fetch profile stats: `GET /api/profiles/:id/stats`

**Response:** `ProfileStatsDTO`

**Dane:**
- total_words_attempted
- words_mastered
- total_stars
- mastery_percentage

**Źródło:** View `profile_stats` w bazie danych

### 3. Fetch category progress: `GET /api/profiles/:id/progress/categories`

**Response:** `CategoryProgressDTO`

**Dane:**
- categories: array of CategoryProgressItem (5 kategorii)
- overall: OverallProgressSummary

**Implementacja:** Już istnieje (zaimplementowane w ProfileService)

### 4. Fetch mastered words: `GET /api/profiles/:id/progress?is_mastered=true`

**Response:** `DetailedProgressDTO`

**Query params:**
- `is_mastered=true` - tylko opanowane słowa
- `limit=100` - max 100 słów (pagination)

**Implementacja:** Trzeba stworzyć endpoint

## 8. Interakcje użytkownika

### Flow główny:

1. **Wejście na stronę:**
   - Z `/game/categories` → przycisk "Statystyki" w header
   - Z `/profiles` → przycisk "Zobacz postępy" przy profilu
   - Direct URL: `/progress?profileId=<uuid>`

2. **Wybór profilu:**
   - Jeśli profileId w URL → auto-select
   - Jeśli brak → pokaż wszystkie profile do wyboru
   - Dropdown/Tabs z avatarem + imieniem

3. **Wyświetlanie statystyk:**
   - Loading state (skeleton cards)
   - Fetch 3 endpointy równolegle
   - Render all sections

4. **Interakcje:**
   - Zmiana profilu → re-fetch stats
   - Kliknięcie kategorii → scroll do listy słów + filter
   - Hover na WordBadge → tooltip z attempts_count

## 9. Warunki i walidacja

- **Profile ID:** Musi należeć do zalogowanego rodzica (RLS check)
- **Empty state:** Jeśli brak postępu → komunikat "Rozpocznij grę, aby zobaczyć statystyki"
- **Partial progress:** Jeśli 0 opanowanych słów → pokazuj 0%, nie błąd
- **Pagination:** Limit 100 słów w MasteredWordsList (TODO: infinite scroll)

## 10. Obsługa błędów

- **Brak profilu:** Redirect do `/profiles`
- **Unauthorized:** Redirect do `/login`
- **Network error:** "Nie udało się załadować statystyk" + retry button
- **Profile not found:** "Profil nie istnieje"
- **RLS violation:** "Brak dostępu do tego profilu"

## 11. Kroki implementacji

### Krok 1: Endpoint GET /api/profiles/:id/stats

**Plik:** `src/pages/api/profiles/[id]/stats.ts`

**Zadania:**
1. Verify JWT authentication
2. Verify profile ownership
3. Query `profile_stats` view
4. Return ProfileStatsDTO

**Note:** Endpoint już może istnieć - sprawdzić

---

### Krok 2: Endpoint GET /api/profiles/:id/progress

**Plik:** `src/pages/api/profiles/[id]/progress.ts`

**Zadania:**
1. Verify JWT authentication
2. Verify profile ownership
3. Query user_progress + vocabulary (JOIN)
4. Filter by query params (is_mastered, category)
5. Pagination (limit, offset)
6. Return DetailedProgressDTO

---

### Krok 3: Custom Hook useProgressStats

**Plik:** `src/components/hooks/useProgressStats.ts`

**Zadania:**
1. State management
2. fetchProfiles()
3. fetchStats(profileId)
4. fetchCategoryProgress(profileId)
5. fetchMasteredWords(profileId)
6. handleProfileChange(profileId)

---

### Krok 4: Komponenty UI - Karty statystyk

**Pliki:**
- `src/components/StatCard.tsx`
- `src/components/StatsOverview.tsx`

**Zadania:**
1. StatCard z emoji, value, label, gradient
2. StatsOverview jako grid 4 kart
3. Responsive design (1-4 kolumny)

---

### Krok 5: Komponenty UI - Wykres kategorii

**Pliki:**
- `src/components/CategoryProgressBar.tsx`
- `src/components/CategoryProgressChart.tsx`

**Zadania:**
1. CategoryProgressBar z nazwą, paskiem, licznikami
2. CategoryProgressChart jako lista 5 kategorii
3. Sortowanie: highest % first

---

### Krok 6: Komponenty UI - Lista słów

**Pliki:**
- `src/components/WordBadge.tsx`
- `src/components/MasteredWordsList.tsx`

**Zadania:**
1. WordBadge z word_text, stars, category emoji
2. MasteredWordsList jako grid badges
3. Filter by category (opcjonalne)

---

### Krok 7: ProfileSelector + ProgressDashboard

**Pliki:**
- `src/components/ProfileSelector.tsx`
- `src/components/ProgressDashboard.tsx`

**Zadania:**
1. ProfileSelector z dropdown/tabs
2. ProgressDashboard orchestration
3. Loading/error/empty states

---

### Krok 8: Strona Astro

**Plik:** `src/pages/progress.astro`

**Zadania:**
1. Hybrid rendering
2. Extract profileId from query params
3. React Island: `<ProgressDashboard />`
4. Gradient background

---

## 12. Empty States

### Brak postępu (0 słów attempted)

```jsx
<div className="text-center">
  <div className="text-6xl mb-4">📚</div>
  <h2 className="text-2xl font-bold text-purple-800 mb-2">
    Jeszcze nie rozpoczęto gry
  </h2>
  <p className="text-purple-600 mb-6">
    Wybierz kategorię i zacznij naukę, aby zobaczyć statystyki!
  </p>
  <Button onClick={() => navigate('/game/categories')}>
    Rozpocznij grę
  </Button>
</div>
```

### Brak opanowanych słów (0% mastery)

```jsx
<div className="text-center p-6 bg-purple-50 rounded-lg">
  <div className="text-4xl mb-2">💪</div>
  <p className="text-purple-700 font-semibold">
    Kontynuuj naukę, aby opanować pierwsze słowa!
  </p>
</div>
```

## 13. Performance optimizations

- **Parallel API calls:** Fetch stats + categoryProgress + masteredWords równolegle
- **React.memo:** Memoizacja StatCard, CategoryProgressBar, WordBadge
- **useMemo:** Computed values (sorted categories, filtered words)
- **Lazy loading:** MasteredWordsList z infinite scroll (future)
- **Skeleton loaders:** Placeholder UI podczas loading

## 14. Zgodność z PRD

- ✅ Wyświetlanie ogólnych statystyk (stars, mastery, attempts)
- ✅ Postęp per kategoria z wizualizacją
- ✅ Lista opanowanych słów
- ✅ Wybór profilu (dla rodziców z kilkoma dziećmi)
- ✅ Responsywny design
- ✅ Przyjazny UI dla rodziców i dzieci

## 15. Przyszłe rozszerzenia

### Analytics charts (future)
- Line chart: mastery % over time
- Bar chart: stars earned per week
- Pie chart: category distribution

### Achievements/Badges (future)
- "Pierwsza gwiazdka" 🌟
- "10 słów opanowanych" 🎯
- "Mistrz kategorii" 🏆

### Export/Share (future)
- PDF report z postępami
- Share progress link (read-only)
- Print-friendly view

---

**Status:** 📝 Plan gotowy do implementacji
**Następny krok:** Weryfikacja istniejących endpointów + implementacja brakujących
