<ui_architecture_planning>

1. **Analiza wymagań (PRD & Session Notes):**
* Główny cel: Nauka słownictwa dla dzieci 4-6 lat.
* Dwa światy: Strefa Rodzica (zarządzanie, statystyki, tekstowa) oraz Strefa Dziecka (gra, wizualna, beztekstowa).
* Technologia: Astro 5 (SSR dla rodzica) + React 19 (CSR dla gry).
* Kluczowe UX: Format 16:9, brak symboli negatywnych, lektor, "Parental Gate".


2. **Główne Punkty Końcowe API:**
* `GET /api/profiles`: Lista profili dla ekranu wyboru.
* `POST /api/profiles`: Dodawanie dziecka.
* `GET /api/vocabulary/categories`: Pobieranie kategorii dla menu gry.
* `POST /api/game-sessions/start`: Inicjalizacja rundy (pobranie 4 słów/obrazków).
* `POST /api/progress`: Zapisanie wyniku (aktualizacja gwiazdek).
* `GET /api/stats/:profile_id`: Dane do dashboardu rodzica.


3. **Lista Widoków:**
* **Publiczny/Auth:** `LandingPage` (/), `Login/Register` (/auth).
* **Wybór Profilu:** `ProfileSelection` (/profiles) - Island React.
* **Strefa Dziecka:** `CategorySelection` (/game/categories), `GameView` (/game/play/:id).
* **Strefa Rodzica:** `ParentDashboard` (/parent), `ChildStats` (/parent/stats/:id), `AccountSettings` (/parent/settings).


4. **Projekt Nawigacji:**
* Rodzic porusza się tradycyjnym menu (Astro).
* Dziecko porusza się wyłącznie za pomocą obrazków.
* Wyjście ze strefy dziecka wymaga przejścia przez "Parental Gate" (zadanie matematyczne).


5. **UX i Dostępność:**
* Wszystkie przyciski w grze min. 80x80px.
* Brak tekstu instruktażowego w grze – polecenia wydaje lektor.
* Animacja "shake" przy błędzie, konfetti przy sukcesie.


6. **Bezpieczeństwo:**
* RLS w Supabase chroni dane między rodzicami.
* Middleware w Astro chroni ścieżki `/parent` i `/profiles`.
* "Parental Gate" zapobiega niepożądanym zmianom ustawień przez dziecko.



</ui_architecture_planning>

Oto szczegółowa architektura interfejsu użytkownika dla aplikacji "Dopasuj Obrazek do Słowa", przygotowana zgodnie z wymaganiami PRD oraz ustaleniami technicznymi.

# Architektura UI dla "Dopasuj Obrazek do Słowa"

## 1. Przegląd struktury UI

Aplikacja wykorzystuje architekturę hybrydową **Astro 5 "Islands"**. Podzielona jest na dwie główne sfery:

* **Sfera Rodzica (SSR):** Statyczne i dynamiczne strony renderowane po stronie serwera, skupione na wydajności SEO, bezpieczeństwie i zarządzaniu danymi.
* **Sfera Dziecka (CSR - React 19):** Interaktywne "wyspy" (Islands) zapewniające płynne animacje, brak przeładowań strony podczas gry oraz natychmiastową informację zwrotną.

Całość interfejsu zaprojektowana jest w podejściu **Mobile-First** z wymuszonym układem poziomym (Landscape 16:9) dla widoku gry.

## 2. Lista widoków

### 2.1 Strona Główna (Landing Page)

* **Ścieżka:** `/`
* **Główny cel:** Prezentacja korzyści aplikacji i zachęcenie do rejestracji.
* **Kluczowe komponenty:** Hero section z przyciskiem "Zacznij naukę", sekcja "Jak to działa", stopka.
* **UX/Bezpieczeństwo:** Czysty przekaz, wyraźne Call to Action (CTA).

### 2.2 Wybór Profilu

* **Ścieżka:** `/profiles`
* **Główny cel:** Pozwolenie dziecku na wybór swojej postaci.
* **Kluczowe informacje:** Nazwy i avatary profili (max 5).
* **Kluczowe komponenty:** Duże karty avatarów (React Island), przycisk "Dodaj profil" (wymaga Parental Gate).
* **UX/Dostępność:** Brak konieczności czytania – rozpoznawanie profilu po obrazku.

### 2.3 Wybór Kategorii (Menu Gry)

* **Ścieżka:** `/game/categories`
* **Główny cel:** Wybór tematyki nauki (np. zwierzęta, owoce, pojazdy).
* **Kluczowe informacje:** Ikony kategorii, postęp w danej kategorii (liczba gwiazdek).
* **Kluczowe komponenty:** Siatka dużych ikon ilustrujących kategorię.
* **UX/Dostępność:** Lektor czyta nazwę kategorii po najechaniu/kliknięciu.

### 2.4 Widok Gry (Main Game Loop)

* **Ścieżka:** `/game/play/:profileId`
* **Główny cel:** Edukacyjna pętla dopasowywania słowa do obrazka.
* **Kluczowe informacje:** Centralne słowo (tekst), 4 obrazy do wyboru, pasek postępu ("ścieżka gwiazdek").
* **Kluczowe komponenty:** Canvas na konfetti, odtwarzacz audio (lektor), interaktywne karty 80x80px+.
* **UX/Dostępność:**
* Sztywny format 16:9.
* Brak negatywnych komunikatów (tylko animacja potrząsania).
* Automatyczne czytanie słowa przez lektora.



### 2.5 Panel Rodzica (Dashboard)

* **Ścieżka:** `/parent/dashboard`
* **Główny cel:** Monitorowanie postępów wszystkich dzieci.
* **Kluczowe informacje:** Zagregowane statystyki, lista profili, ostatnie aktywności.
* **Kluczowe komponenty:** Wykresy postępu (Shadcn/UI), przyciski zarządzania profilami.
* **Bezpieczeństwo:** Dostęp tylko dla zalogowanych użytkowników (Supabase Auth).

### 2.6 Parental Gate (Modal)

* **Ścieżka:** Wyzwalany przed dostępem do `/parent/*` ze strefy dziecka.
* **Główny cel:** Blokada dostępu dzieci do ustawień.
* **Kluczowe informacje:** Proste zadanie matematyczne (np. "Ile to 5 + 7?").
* **UX:** Duża klawiatura numeryczna, minimalistyczny design.

## 3. Mapa podróży użytkownika

### Przypadek użycia: Dziecko zaczyna sesję nauki

1. **Start:** Rodzic loguje się i przekazuje tablet dziecku na ekranie `/profiles`.
2. **Wybór:** Dziecko klika w swój avatar (np. Lwa).
3. **Kategoria:** Dziecko klika w ikonę "Zwierzęta". Lektor mówi: "Zwierzęta!".
4. **Gra:**
* Pojawia się słowo "KOT". Lektor mówi: "Gdzie jest kot?".
* Dziecko widzi 4 obrazki. Klika w błędny (Pies) -> obrazek trzęsie się, dziecko próbuje ponownie.
* Dziecko klika w poprawny (Kot) -> radosny dźwięk, animacja gwiazdki wskakującej na pasek postępu.


5. **Nagroda:** Po 10 poprawnych odpowiedziach pojawia się konfetti i wielka złota gwiazda.
6. **Koniec:** Powrót do wyboru kategorii lub profilu.

## 4. Układ i struktura nawigacji

* **Nawigacja dla dziecka:**
* **Liniowa i uproszczona:** Tylko przycisk "Wstecz" (duża strzałka) zabezpieczony Parental Gate, jeśli prowadzi do panelu rodzica.
* **Brak menu tekstowego:** Wszystkie interakcje oparte na gestach i ikonach.


* **Nawigacja dla rodzica:**
* **Pasek boczny/Górny (Sidebar):** Linki do Dashboardu, Zarządzania profilami, Ustawień konta i Wylogowania.
* **Przycisk "Przełącz na tryb dziecka":** Przekierowuje natychmiast do `/profiles`.



## 5. Kluczowe komponenty

1. **`GameCard` (React):** Komponent obrazka w grze. Obsługuje stany: `idle`, `correct` (zielony błysk), `wrong` (shake). Minimalny rozmiar 80x80px.
2. **`ProgressBar` (React):** Wizualna ścieżka z "dziurami" na gwiazdki, wypełniająca się w miarę postępów w sesji.
3. **`VoiceOver` (Utility):** Moduł zarządzający kolejką audio (Speech Synthesis lub pre-recorded MP3), zapewniający, że instrukcje głosowe nie nakładają się na siebie.
4. **`ParentalGateModal` (React):** Reużywalny komponent blokujący, generujący losowe proste zadania arytmetyczne.
5. **`OptimisticStar` (React):** Komponent gwiazdki, który animuje się natychmiast po kliknięciu (Optimistic UI), zanim API `/api/progress` potwierdzi zapis.