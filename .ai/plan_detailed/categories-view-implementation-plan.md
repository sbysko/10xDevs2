# Plan implementacji widoku Wybór Kategorii (`/game/categories`)

## Data: 2026-01-28

## 1. Przegląd

Widok **Wybór Kategorii** jest punktem startowym sesji gry. Dziecko wybiera kategorię słownictwa, którą chce ćwiczyć, a następnie rozpoczyna sesję z 10 pytaniami. Widok wyświetla postęp w każdej kategorii, motywując do nauki.

## 2. Routing widoku

* **Ścieżka:** `/game/categories`
* **Typ renderowania:** Hybrid (Astro Page z React Island)
* **Wymaga autoryzacji:** TAK (wybrany profil w sessionStorage)

## 3. Wymagania funkcjonalne (z PRD)

### 3.1. Dashboard kategorii
- Wyświetlanie 5 dostępnych kategorii:
  1. **Zwierzęta** (`zwierzeta`)
  2. **Owoce i Warzywa** (`owoce_warzywa`)
  3. **Pojazdy** (`pojazdy`)
  4. **Kolory i Kształty** (`kolory_ksztalty`)
  5. **Przedmioty Codziennego Użytku** (`przedmioty_codzienne`)

### 3.2. Karta kategorii
- **Duża, interaktywna karta** z:
  - Ikoną reprezentującą kategorię (emoji lub SVG)
  - Nazwą kategorii (czytelna, duża czcionka)
  - Trackerem postępu: "35/50" (opanowane słowa / wszystkie słowa)
  - Paskiem postępu wizualnym

### 3.3. Interakcja
- **Kliknięcie w kartę:**
  - Rozpoczyna sesję gry dla wybranej kategorii
  - Przekierowanie do `/game/session?category=<kod>`
  - Zapisanie kategorii w sessionStorage

### 3.4. Responsywność
- Mobile (<768px): 1 kolumna
- Tablet (768-1024px): 2 kolumny
- Desktop (>1024px): 2-3 kolumny (maksymalnie)

### 3.5. Accessibility
- Duże przyciski (min 80x80px)
- ARIA labels
- Keyboard navigation (Tab, Enter)
- Focus states wyraźne

## 4. Struktura komponentów

```
CategorySelectionPage (Astro)
└── CategoryDashboard (React Island)
    ├── ProfileHeader (Pokazuje wybrany profil)
    ├── CategoryGrid (Layout)
    │   └── CategoryCard × 5 (Dla każdej kategorii)
    │       ├── CategoryIcon
    │       ├── CategoryName
    │       ├── ProgressTracker
    │       └── ProgressBar
    └── BackButton (Powrót do /profiles)
```

## 5. Szczegóły komponentów

### CategoryDashboard (Container)

**Opis:** Główny komponent zarządzający stanem kategorii i postępu

**Główne elementy:** `ProfileHeader`, `CategoryGrid`, `BackButton`

**Obsługiwane interakcje:**
- Pobieranie listy kategorii (`GET /api/categories`)
- Pobieranie postępu profilu (`GET /api/profiles/:id/progress/categories`)
- Walidacja wybranego profilu z sessionStorage

**Typy:** `CategoryDTO[]`, `CategoryProgressDTO`, `ViewState`

**State:**
```typescript
{
  categories: CategoryDTO[];
  progress: CategoryProgressDTO | null;
  isLoading: boolean;
  error: string | null;
  selectedProfile: { id: string; name: string } | null;
}
```

---

### ProfileHeader

**Opis:** Nagłówek pokazujący wybrany profil dziecka

**Główne elementy:**
- Awatar profilu (mały, 48x48px)
- Imię dziecka
- Opcjonalnie: Total stars

**Propsy:** `profile: { id: string; display_name: string; avatar_url: string; total_stars?: number }`

---

### CategoryCard

**Opis:** Duża, kolorowa karta prezentująca kategorię

**Główne elementy:**
- `CategoryIcon` (emoji lub SVG, 64x64px)
- `CategoryName` (h3, text-2xl)
- `ProgressTracker` (tekst: "35/50")
- `ProgressBar` (wizualny pasek postępu)

**Obsługiwane interakcje:**
- Kliknięcie → Zapisanie kategorii → Przekierowanie do `/game/session`

**Propsy:**
```typescript
{
  category: CategoryDTO;
  progress: CategoryProgressItem | null;
  onSelect: (categoryCode: string) => void;
}
```

**Kolory (gradient per kategoria):**
- Zwierzęta: green-400 → teal-400
- Owoce i Warzywa: yellow-400 → orange-400
- Pojazdy: blue-400 → indigo-400
- Kolory i Kształty: pink-400 → purple-400
- Przedmioty: gray-400 → slate-400

---

### CategoryIcon

**Opis:** Ikona reprezentująca kategorię

**Warianty:**
- **Emoji:** 🐾 (Zwierzęta), 🍎 (Owoce), 🚗 (Pojazdy), 🎨 (Kolory), 🏠 (Przedmioty)
- **Lub SVG** z Lucide React

**Propsy:** `category: VocabularyCategory`

---

### ProgressTracker

**Opis:** Tekstowy wskaźnik postępu

**Format:** `{mastered_words}/{total_words}` (np. "35/50")

**Propsy:** `mastered: number`, `total: number`

---

### ProgressBar

**Opis:** Wizualny pasek postępu

**Implementacja:** Tailwind gradient bar z `width` zależnym od `completion_percentage`

**Propsy:** `percentage: number` (0-100)

---

## 6. Typy

Wykorzystamy istniejące definicje z `types.ts`:

```typescript
// Z types.ts
import type {
  CategoryDTO,
  CategoriesListDTO,
  CategoryProgressDTO,
  CategoryProgressItem,
  CategoryProgressQueryParams
} from '@/types';

// Nowe typy dla widoku
export interface CategoryViewState {
  categories: CategoryDTO[];
  progress: CategoryProgressDTO | null;
  isLoading: boolean;
  error: string | null;
  selectedProfile: SelectedProfile | null;
}

export interface SelectedProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

export interface CategoryColorScheme {
  from: string;
  to: string;
}
```

## 7. Zarządzanie stanem

### Custom Hook: `useCategoriesManager()`

**Zadania:**
- Walidacja `selectedProfileId` z sessionStorage
- Pobieranie listy kategorii (`GET /api/categories?language=pl`)
- Pobieranie postępu profilu (`GET /api/profiles/:id/progress/categories?language=pl`)
- Obsługa błędów (brak profilu, błąd API)
- Akcja wyboru kategorii (zapisanie + nawigacja)

**State:**
```typescript
{
  categories: CategoryDTO[];
  progress: CategoryProgressDTO | null;
  isLoading: boolean;
  error: string | null;
  selectedProfile: SelectedProfile | null;
}
```

**Funkcje:**
- `loadCategories()`: Pobiera listę kategorii
- `loadProgress(profileId: string)`: Pobiera postęp profilu
- `selectCategory(categoryCode: string)`: Zapisuje wybór i przekierowuje
- `goBackToProfiles()`: Powrót do `/profiles`

## 8. Integracja API

### 8.1. GET /api/categories

**Request:**
```typescript
GET /api/categories?language=pl
Authorization: Bearer <jwt_token>
```

**Response:** `CategoriesListDTO`
```typescript
{
  categories: [
    {
      code: "zwierzeta",
      name: "Zwierzęta",
      word_count: 50
    },
    // ...
  ],
  total_words: 250
}
```

### 8.2. GET /api/profiles/:id/progress/categories

**Request:**
```typescript
GET /api/profiles/:id/progress/categories?language=pl
Authorization: Bearer <jwt_token>
```

**Response:** `CategoryProgressDTO`
```typescript
{
  profile_id: "uuid",
  language: "pl",
  categories: [
    {
      category: "zwierzeta",
      total_words: 50,
      mastered_words: 12,
      completion_percentage: 24.0
    },
    // ...
  ],
  overall: {
    total_words: 250,
    mastered_words: 45,
    completion_percentage: 18.0
  }
}
```

## 9. Interakcje użytkownika

### 9.1. Wybór kategorii
1. Dziecko klika na kartę kategorii (np. "Zwierzęta")
2. Zapisanie `selectedCategory` w sessionStorage
3. Nawigacja do `/game/session?category=zwierzeta`

### 9.2. Powrót do profili
1. Dziecko (lub rodzic) klika "Zmień profil" lub ikonę strzałki
2. Czyszczenie `selectedProfileId` z sessionStorage (opcjonalnie)
3. Nawigacja do `/profiles`

### 9.3. Animacje
- **Hover:** scale-105, zmiana koloru gradientu
- **Active:** scale-95
- **Loading:** Spinner lub skeleton cards

## 10. Warunki i walidacja

### 10.1. Walidacja profilu
- Sprawdzenie `selectedProfileId` w sessionStorage przy montowaniu
- Jeśli brak → przekierowanie do `/profiles` z komunikatem
- Jeśli istnieje → pobieranie danych profilu z API (opcjonalnie)

### 10.2. Obsługa błędów
- **Brak profilu:** Komunikat "Wybierz profil" + przycisk do `/profiles`
- **Błąd API:** Komunikat "Nie udało się załadować kategorii" + przycisk "Spróbuj ponownie"
- **Brak kategorii:** Komunikat "Brak dostępnych kategorii" (edge case)

## 11. Obsługa błędów

### Scenariusze:
1. **Brak selectedProfileId:** Przekierowanie do `/profiles`
2. **Błąd ładowania kategorii:** Wyświetlenie komunikatu z retry
3. **Błąd ładowania postępu:** Wyświetlenie kategorii bez postępu (0/50)
4. **Timeout:** Komunikat o problemach z połączeniem

## 12. Kroki implementacji

### Krok 1: API Endpoints
1. Utworzenie `/src/pages/api/categories.ts`
2. Handler `GET` zwracający listę kategorii
3. Testowanie endpointu

### Krok 2: Serwisy
1. Utworzenie `/src/lib/services/category.service.ts`
2. Metody: `getAllCategories()`, `getCategoryProgress()`

### Krok 3: Bazowy komponent Astro
1. Utworzenie `/src/pages/game/categories.astro`
2. Layout z nagłówkiem "Wybierz kategorię"
3. Osadzenie React Island `<CategoryDashboard client:load />`

### Krok 4: Custom Hook
1. Utworzenie `/src/components/hooks/useCategoriesManager.ts`
2. Implementacja logiki pobierania i zarządzania stanem

### Krok 5: Komponenty UI
1. `CategoryDashboard.tsx` - główny kontener
2. `CategoryGrid.tsx` - layout siatki
3. `CategoryCard.tsx` - karta kategorii
4. `ProfileHeader.tsx` - nagłówek z profilem
5. `ProgressBar.tsx` - pasek postępu

### Krok 6: Mapowanie ikon i kolorów
1. Utworzenie `categoryConfig.ts` z mapowaniem:
   - Ikony (emoji lub Lucide)
   - Kolory gradientów
   - Nazwy polskie

### Krok 7: Testowanie
1. Test z różnymi profilami
2. Test z różnymi poziomami postępu (0%, 50%, 100%)
3. Test responsywności
4. Test accessibility

## 13. Dane testowe

Do przetestowania widoku potrzebujemy:

1. **Profile dziecka w sessionStorage:**
   ```javascript
   sessionStorage.setItem('selectedProfileId', 'uuid-profilu');
   ```

2. **Tabela vocabulary z danymi (250 słów w 5 kategoriach)**
3. **Tabela user_progress z przykładowymi rekordami:**
   - Kategoria "zwierzeta": 12/50 opanowanych
   - Kategoria "owoce_warzywa": 8/50 opanowanych
   - Pozostałe: 0/50

## 14. Zgodność z PRD

- ✅ Dashboard z 5 kategoriami
- ✅ Duże, interaktywne karty
- ✅ Tracker postępu "35/50"
- ✅ Kliknięcie rozpoczyna sesję
- ✅ Responsywny design
- ✅ Accessibility (ARIA, keyboard)
- ✅ Kolorowe, przyjazne UI dla dzieci 4-6 lat

## 15. Metryki sukcesu

- Szybkie ładowanie kategorii (< 500ms)
- Płynne animacje (60 FPS)
- Łatwa nawigacja dla dziecka (duże przyciski)
- Jasne wizualne rozróżnienie kategorii (kolory)
- Motywujący tracker postępu (pasek + liczby)

---

**Autor:** Claude Code
**Data:** 2026-01-28
**Wersja:** 1.0
