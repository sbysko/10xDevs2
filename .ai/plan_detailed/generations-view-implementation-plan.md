Aby stworzyć kompleksowy plan wdrożenia widoku **Wybór Profilu** (`/profiles`), przeanalizowałem dostarczoną dokumentację PRD, specyfikację API oraz istniejące typy i serwisy. Poniżej znajduje się szczegółowy plan implementacji.

---

# Plan implementacji widoku Wybór Profilu

## 1. Przegląd

Widok **Wybór Profilu** jest kluczowym punktem wejścia do gry dla dziecka. Jego głównym celem jest umożliwienie dziecku identyfikacji swojego profilu poprzez rozpoznanie własnego imienia i awatara. Widok ten pełni również funkcję zarządzania profilami dla rodzica, chronioną przez mechanizm "Parental Gate". Projekt kładzie nacisk na dostępność (duże elementy interaktywne) oraz bezpieczeństwo (limit 5 profili).

## 2. Routing widoku

* **Ścieżka:** `/profiles`
* **Typ renderowania:** Hybrid (Astro Page z React Island dla interaktywnej siatki profili).

## 3. Struktura komponentów

Widok będzie zorganizowany w hierarchię komponentów React, osadzoną wewnątrz układu strony Astro.

```
ProfileSelectionPage (Astro)
└── ProfileManager (React Island)
    ├── ProfileGrid (Layout)
    │   ├── ProfileCard (Dla każdego profilu)
    │   └── AddProfileCard (Trigger dla rodzica)
    ├── ParentalGateModal (Zadanie matematyczne)
    └── CreateProfileModal (Formularz dodawania)

```

## 4. Szczegóły komponentów

### ProfileManager (Container)

* **Opis:** Główny komponent zarządzający stanem profili, pobieraniem danych i koordynacją miodali.
* **Główne elementy:** `ProfileGrid`, `ParentalGateModal`, `CreateProfileModal`.
* **Obsługiwane interakcje:** Ładowanie listy profili przy montowaniu, otwieranie Parental Gate.
* **Typy:** `ProfileDTO[]`, `ViewState`.

### ProfileCard

* **Opis:** Duża, kolorowa karta prezentująca awatar i imię dziecka.
* **Główne elementy:** `<img>` (Avatar), `<h3>` (Display Name), animowany `button`.
* **Obsługiwane interakcje:** Kliknięcie wybiera profil i przekierowuje do `/game/categories`.
* **Propsy:** `profile: ProfileDTO`, `onSelect: (id: string) => void`.

### AddProfileCard

* **Opis:** Specjalna karta z ikoną "+" zachęcająca do dodania nowego profilu. Wyświetlana tylko, gdy liczba profili < 5.
* **Główne elementy:** Ikona Plus (Lucide-React), tekst "Dodaj profil".
* **Obsługiwane interakcje:** Kliknięcie otwiera `ParentalGateModal`.
* **Propsy:** `disabled: boolean`.

### ParentalGateModal

* **Opis:** Modal blokujący dostęp dzieciom do funkcji zarządzania.
* **Główne elementy:** Generator prostych zadań (np. "12 + 5"), klawiatura numeryczna (Grid).
* **Obsługiwana walidacja:** Sprawdzenie poprawności wyniku przed otwarciem formularza tworzenia.
* **Propsy:** `isOpen: boolean`, `onSuccess: () => void`, `onClose: () => void`.

### CreateProfileModal

* **Opis:** Formularz tworzenia nowego profilu.
* **Główne elementy:** Input na imię, selektor predefiniowanych awatarów, przycisk zapisu.
* **Obsługiwana walidacja:** Imię wymagane (min. 2 znaki), wybór awatara.
* **Typy:** `CreateProfileCommand`.
* **Propsy:** `isOpen: boolean`, `onCreated: (newProfile: ProfileDTO) => void`.

## 5. Typy

Wykorzystamy istniejące definicje z `types.ts` oraz rozszerzymy je o modele widoku:

```typescript
// Z types.ts
import type { ProfileDTO, CreateProfileCommand, ErrorResponse } from '@/types';

// Nowe typy dla widoku
export interface ParentalGateChallenge {
  num1: number;
  num2: number;
  answer: number;
}

export type ModalType = 'none' | 'parental_gate' | 'create_profile';

export interface ProfileViewState {
  profiles: ProfileDTO[];
  isLoading: boolean;
  error: string | null;
  activeModal: ModalType;
}

```

## 6. Zarządzanie stanem

Zastosujemy customowy hook `useProfilesManager` do zarządzania logiką biznesową widoku:

* **Hook:** `useProfilesManager()`
* **Zadania:**
* Przechowywanie listy `profiles`.
* Obsługa zapytań `GET` i `POST` do `/api/profiles`.
* Zarządzanie stanem widoczności modali.
* Walidacja limitu 5 profili (na podstawie długości tablicy).



## 7. Integracja API

Integracja z endpointami zdefiniowanymi w `api-plan.md` i wdrożonymi w `profiles.ts`:

1. **Pobieranie:** `GET /api/profiles`
* **Request:** Brak body, wymagany JWT w Header.
* **Response:** `ProfileDTO[]`.


2. **Tworzenie:** `POST /api/profiles`
* **Request:** `CreateProfileCommand` (`display_name`, `avatar_url`, `language_code`).
* **Response:** `201 Created` z `ProfileDTO`.
* **Obsługa błędów:** Specjalna obsługa `409 Conflict` (profile_limit_exceeded).



## 8. Interakcje użytkownika

1. **Wybór profilu:** Dziecko klika w swoją kartę -> Zapisanie `profileId` w `sessionStorage` -> Nawigacja do `/game/categories`.
2. **Dodawanie profilu:** Rodzic klika "+" -> Pojawia się Parental Gate -> Rodzic rozwiązuje zadanie -> Pojawia się formularz -> Rodzic wpisuje imię i wybiera awatar -> Zatwierdzenie -> Odświeżenie listy.
3. **Animacje:** Karty powinny mieć efekt "hover" (skalowanie) oraz "tap" (naciśnięcie), aby dać dziecku jasny feedback.

## 9. Warunki i walidacja

* **Limit profili:** Komponent `AddProfileCard` jest ukryty lub nieaktywny, jeśli `profiles.length >= 5`.
* **Parental Gate:** Zadania generowane losowo (liczby 1-20), walidacja po stronie klienta.
* **Formularz:** Walidacja Zod (zgodna z `CreateProfileSchema` na backendzie) sprawdzająca długość imienia i poprawność URL awatara.

## 10. Obsługa błędów

* **Błąd ładowania:** Wyświetlenie komunikatu "Nie udało się załadować profili" z przyciskiem "Spróbuj ponownie".
* **Przekroczenie limitu:** Nawet jeśli UI pozwoli na kliknięcie, API zwróci 409, co zostanie obsłużone komunikatem o konieczności usunięcia innego profilu (zgodnie z `isProfileLimitError`).
* **Brak autoryzacji:** Przekierowanie do strony logowania, jeśli token wygasł.

## 11. Kroki implementacji

1. **Przygotowanie API:** Upewnienie się, że `GET /api/profiles` poprawnie zwraca listę dla zalogowanego użytkownika (Supabase RLS).
2. **Bazowy Komponent Astro:** Stworzenie `/src/pages/profiles.astro` i osadzenie kontenera React.
3. **Implementacja `useProfilesManager`:** Logika pobierania i wysyłania danych.
4. **Budowa UI `ProfileGrid` i `ProfileCard`:** Stylowanie Tailwind CSS (karty min. 80x80px, duże fonty).
5. **Implementacja Parental Gate:** Mechanizm blokady z klawiaturą numeryczną.
6. **Implementacja Formularza Tworzenia:** Integracja z `POST /api/profiles`.
7. **Testy UX:** Sprawdzenie czy dziecko 4-letnie jest w stanie rozpoznać swój profil bez czytania.
8. **Finalizacja:** Dodanie animacji wejścia dla kart (Framer Motion lub Tailwind Animate).