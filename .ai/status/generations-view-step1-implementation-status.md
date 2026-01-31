# Status implementacji widoku Wybór Profilu (`/profiles`)

## Data: 2026-01-28

## Zrealizowane kroki

### Krok 1: Przygotowanie API ✅

**Endpoint GET /api/profiles**
- Dodano metodę `getAllProfiles()` do `ProfileService` ([profile.service.ts:110-135](src/lib/services/profile.service.ts#L110-L135))
- Zaimplementowano handler `GET` w [/api/profiles](src/pages/api/profiles.ts#L35-L110)
- Endpoint zwraca tablicę `ProfileDTO[]` z automatycznym filtrowaniem RLS
- Obsługa autoryzacji JWT przez Supabase Auth
- Obsługa błędów: 401 Unauthorized, 500 Internal Server Error

### Krok 2: Bazowy Komponent Astro ✅

**Strona /src/pages/profiles.astro**
- Utworzono [profiles.astro](src/pages/profiles.astro) z wyłączonym prerenderowaniem (`prerender = false`)
- Użyto układu Layout z tytułem "Wybierz Profil - Dopasuj Obrazek do Słowa"
- Dodano nagłówek "Kto dziś gra?" z podtytułem
- Zastosowano gradientowe tło (blue-100 → purple-100)
- Osadzono React Island `<ProfileManager client:load />` dla interaktywności

### Krok 3: Hook useProfilesManager ✅

**Custom Hook do zarządzania stanem**
- Utworzono [useProfilesManager.ts](src/components/hooks/useProfilesManager.ts) w `src/components/hooks/`
- Implementuje:
  - Pobieranie profili przez `GET /api/profiles` przy montowaniu komponentu
  - Zarządzanie stanem modali: `none`, `parental_gate`, `create_profile`
  - Walidację limitu 5 profili (`canAddProfile`)
  - Akcje: `openParentalGate`, `openCreateProfile`, `closeModal`, `handleProfileCreated`, `refetchProfiles`
  - Stan ładowania (`isLoading`) i błędów (`error`)
- Używa `credentials: 'include'` dla sesji Supabase

### Krok 4: Budowa UI ProfileGrid i ProfileCard ✅

**4.1. ProfileManager.tsx**
- Główny kontener [ProfileManager.tsx](src/components/ProfileManager.tsx)
- Zarządza stanem z hooka `useProfilesManager`
- Wyświetla stan ładowania ze spinnerem animowanym
- Wyświetla błędy z przyciskiem "Spróbuj ponownie"
- Koordynuje ProfileGrid i oba modale (Parental Gate, Create Profile)

**4.2. ProfileGrid.tsx**
- Komponent layoutu [ProfileGrid.tsx](src/components/ProfileGrid.tsx)
- Responsywna siatka: 1 kolumna (mobile) → 2 kolumny (tablet) → 3 kolumny (desktop)
- Stan pusty gdy brak profili (emoji 👶 + komunikat + przycisk dodawania)
- Wyświetla karty profili + AddProfileCard

**4.3. ProfileCard.tsx**
- Karta profilu dziecka [ProfileCard.tsx](src/components/ProfileCard.tsx)
- Duży awatar w kole (128x128px) z paddingiem i cieniem
- Wielkie imię (text-2xl, font-bold, białe z drop-shadow)
- Gradientowe tło (purple-400 → pink-400)
- Animacje:
  - Hover: scale-105, awatar rotate-6, opacity glow
  - Active: scale-95
- Funkcjonalność:
  - Zapisuje `profileId` do `sessionStorage` przy kliknięciu
  - Przekierowuje do `/game/categories`
  - Fallback dla brakujących awatarów

**4.4. AddProfileCard.tsx**
- Karta dodawania profilu [AddProfileCard.tsx](src/components/AddProfileCard.tsx)
- Ikona Plus (64px) z Lucide React (strokeWidth: 3)
- Ramka przerywana (border-dashed) dla odróżnienia od profili
- Stan disabled gdy limit osiągnięty (5 profili):
  - Zmienia tekst na "Limit osiągnięty"
  - Pokazuje podpis "Maksymalnie 5 profili"
  - Wyłącza interakcje
- Animacje:
  - Hover: scale-105, rotate-90 (ikona Plus), opacity glow
  - Active: scale-95

### Krok 5: Implementacja Parental Gate ✅

**ParentalGateModal.tsx**
- Modal blokujący [ParentalGateModal.tsx](src/components/ParentalGateModal.tsx)
- Zadanie matematyczne:
  - Losowe dodawanie liczb 1-20
  - Generator `generateChallenge()` tworzy nowe pytania
  - Regeneracja przy błędnej odpowiedzi
- UI:
  - Klawiatura numeryczna (grid 3x3 + dolny rząd)
  - Wyświetlacz odpowiedzi z przyciskiem X do czyszczenia
  - Przycisk backspace (←) i submit (✓)
  - Komunikat błędu przy nieprawidłowej odpowiedzi
- Interakcje:
  - Obsługa klawiatury: Enter (submit), Backspace (usuń), Escape (zamknij)
  - Walidacja: sprawdza czy wprowadzona wartość to liczba
  - Sukces: wywołuje callback `onSuccess` → otwiera CreateProfileModal
- Używa Shadcn Dialog jako bazę

### Krok 6: Implementacja formularza tworzenia profilu ✅

**CreateProfileModal.tsx**
- Modal z formularzem [CreateProfileModal.tsx](src/components/CreateProfileModal.tsx)
- Pola formularza:
  - **Input imienia**: text input z placeholder "np. Maria, Jan"
  - **Selektor awatarów**: grid 4x4 z 8 predefiniowanymi awatarami
    - Wizualna selekcja: border-purple-600 + checkmark (✓)
    - Hover: scale-105, zmiana koloru ramki
    - Fallback dla brakujących obrazków
- Walidacja:
  - Client-side: Zod schema (`CreateProfileSchema`)
  - Walidacja inline: usuwa błędy przy zmianie wartości
  - Wyświetlanie błędów pod polami (text-red-600)
- Integracja API:
  - POST `/api/profiles` z `CreateProfileCommand`
  - Obsługa błędów:
    - 409 Conflict: "Osiągnięto maksymalną liczbę profili (5)"
    - 400 Validation: wyświetlenie komunikatu z API
    - Błędy sieciowe: generyczny komunikat
- Stan submitting:
  - Przycisk zmienia tekst na "Tworzenie..."
  - Wyłączenie wszystkich pól podczas wysyłania
  - Wyłączenie przycisku gdy brak imienia
- Reset formularza: automatyczne czyszczenie przy otwarciu modalu
- Używa Shadcn: Dialog, Input, Label, Button

### Dodatkowe usprawnienia ✅

**Instalacje Shadcn UI**
- Zainstalowano `dialog` komponent
- Zainstalowano `input` komponent
- Zainstalowano `label` komponent

**Linting i Code Quality**
- Naprawiono wszystkie błędy ESLint w nowych plikach
- Dodano `eslint-disable-next-line no-console` dla console.error (debugging)
- Usunięto `autoFocus` z inputu (a11y compliance - jsx-a11y/no-autofocus)
- Usunięto nieużywane typy `Tables` i `Views` z [types.ts](types.ts)
- Usunięto nieużywany parametr `jsonError` w catch block
- Automatyczne formatowanie przez Prettier

## Struktura plików

```
src/
├── pages/
│   ├── profiles.astro                      # Główna strona widoku
│   └── api/
│       └── profiles.ts                     # API endpoints (GET, POST)
├── components/
│   ├── ProfileManager.tsx                  # Główny kontener
│   ├── ProfileGrid.tsx                     # Layout siatki profili
│   ├── ProfileCard.tsx                     # Karta profilu dziecka
│   ├── AddProfileCard.tsx                  # Karta dodawania profilu
│   ├── ParentalGateModal.tsx              # Modal weryfikacji rodzica
│   ├── CreateProfileModal.tsx             # Modal tworzenia profilu
│   ├── hooks/
│   │   └── useProfilesManager.ts          # Custom hook zarządzania stanem
│   └── ui/
│       ├── dialog.tsx                      # Shadcn Dialog
│       ├── input.tsx                       # Shadcn Input
│       ├── label.tsx                       # Shadcn Label
│       └── button.tsx                      # Shadcn Button
└── lib/
    ├── services/
    │   └── profile.service.ts             # Serwis profili (+ getAllProfiles)
    └── validation/
        └── profile.schemas.ts             # Walidacja Zod
```

## Metryki implementacji

- **Utworzonych plików**: 7 nowych komponentów + 1 hook
- **Zmodyfikowanych plików**: 2 (ProfileService, profiles.ts API)
- **Linie kodu**: ~1500 LOC (z komentarzami i dokumentacją)
- **Komponenty Shadcn**: 4 (dialog, input, label, button)
- **Zgodność z planem**: 100% (kroki 1-6 z 8)

## Zgodność z PRD i zasadami

### PRD Requirements ✅
- ✅ Maksymalnie 5 profili na rodzica (walidacja w UI i API)
- ✅ Parental Gate dla ochrony funkcji zarządzania
- ✅ Duże elementy interaktywne (min 80x80px, faktycznie 128x128px)
- ✅ Kolorowe awatary dla łatwej identyfikacji przez dzieci
- ✅ Responsywny design (1-3 kolumny)
- ✅ Animacje hover/active dla feedbacku

### Zasady implementacji ✅
- ✅ **Astro**: Hybrid rendering, `prerender = false` dla API
- ✅ **React**: Functional components, hooks, memo callbacks
- ✅ **TypeScript**: Pełne typowanie, DTOs z types.ts
- ✅ **Tailwind**: Utility classes, responsive variants, state variants
- ✅ **Shadcn**: Komponenty z zachowaniem stylu "new-york"
- ✅ **Accessibility**: ARIA labels, semantic HTML, keyboard navigation
- ✅ **Error handling**: Guard clauses, early returns, user-friendly messages
- ✅ **Security**: RLS enforcement, Zod validation, XSS prevention

## Pozostałe kroki z planu (opcjonalne)

### Krok 7: Testy UX ⏳
- Sprawdzenie czy dziecko 4-letnie rozpoznaje swój profil bez czytania
- Weryfikacja czy awatary są wystarczająco rozróżnialne
- Test czy przyciski są wystarczająco duże dla małych palców
- Sprawdzenie intuicyjności interfejsu

**Uwaga**: Ten krok wymaga testów z prawdziwymi użytkownikami i nie jest częścią implementacji technicznej.

### Krok 8: Finalizacja (opcjonalne) ⏳
- Dodanie animacji wejścia dla kart (Framer Motion lub Tailwind Animate)
- Możliwe usprawnienia:
  - Stagger animation dla kart profili
  - Fade-in dla modali
  - Smooth transitions między stanami
  - Loading skeleton dla awatarów

**Uwaga**: Animacje są już zaimplementowane (hover, active, rotate). Dodatkowe animacje wejścia są opcjonalne.

## Stan widoku

**Status**: ✅ **GOTOWY DO TESTOWANIA**

Wszystkie główne funkcjonalności widoku `/profiles` zostały zaimplementowane zgodnie z planem:
- ✅ Pobieranie i wyświetlanie profili
- ✅ Dodawanie nowych profili przez Parental Gate
- ✅ Wybór profilu i nawigacja do gry
- ✅ Walidacja limitu 5 profili
- ✅ Obsługa błędów i stanów ładowania
- ✅ Responsywny design z animacjami

## Następne kroki

1. **Testowanie manualne**:
   - Sprawdzenie działania na lokalnym serwerze deweloperskim
   - Weryfikacja wszystkich przepływów użytkownika
   - Testowanie na różnych rozmiarach ekranów

2. **Integracja z autentykacją**:
   - Upewnienie się, że middleware Supabase poprawnie przekazuje JWT
   - Testowanie z prawdziwymi sesjami użytkownika

3. **Utworzenie awatarów**:
   - Dodanie 8 plików awatarów do `/public/avatars/`
   - Nazewnictwo: `avatar-1.png` do `avatar-8.png`
   - Dodanie `default-avatar.png` jako fallback

4. **Implementacja następnego widoku**:
   - `/game/categories` - wybór kategorii słownictwa
   - Wykorzystanie `selectedProfileId` z sessionStorage

## Uwagi techniczne

### Autoryzacja
Widok zakłada, że:
- Użytkownik jest zalogowany (Supabase Auth)
- JWT token jest dostępny dla zapytań API
- RLS policies automatycznie filtrują profile po `parent_id`

### SessionStorage
Wybrany `profileId` jest zapisywany w `sessionStorage` i będzie używany przez:
- `/game/categories` - wybór kategorii
- `/game/session` - utworzenie sesji gry
- `/game/play` - rozgrywka

### Brakujące zasoby
Do pełnego działania potrzebne są:
- Pliki awatarów w `/public/avatars/` (8 plików + default)
- Autentykacja użytkownika (login/register flow)
- Middleware Supabase dla przekazywania sesji

## Problemy i rozwiązania

### Problem 1: AutoFocus narusza a11y
**Rozwiązanie**: Usunięto `autoFocus` z inputu w CreateProfileModal

### Problem 2: Console.error w produkcji
**Rozwiązanie**: Dodano `eslint-disable-next-line no-console` - do rozważenia usunięcie przed produkcją

### Problem 3: Nieużywane typy w types.ts
**Rozwiązanie**: Usunięto `Tables` i `Views` (używany tylko `Enums`)

## Rekomendacje

1. **Przed produkcją**:
   - Usunąć lub zastąpić console.error właściwym logowaniem (np. Sentry)
   - Dodać testy jednostkowe dla useProfilesManager hook
   - Dodać testy integracyjne dla ProfileService

2. **Usprawnienia UX**:
   - Rozważyć dodanie dźwięków przy interakcjach (dla dzieci)
   - Dodać haptic feedback na urządzeniach mobilnych
   - Rozważyć animations dla lepszego feedbacku

3. **Performance**:
   - Lazy loading awatarów z loading placeholders
   - Memoizacja komponentów kart przy dużej liczbie profili
   - Optymalizacja obrazków awatarów (WebP, różne rozmiary)
