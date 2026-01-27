# Dokument wymagań produktu (PRD) - Dopasuj Obrazek do Słowa

## 1. Przegląd produktu

### 1.1 Nazwa produktu
Dopasuj Obrazek do Słowa

### 1.2 Wersja dokumentu
1.0 - MVP (Minimum Viable Product)

### 1.3 Data utworzenia
Styczeń 2026

### 1.4 Wizja produktu
Edukacyjna gra webowa dla dzieci w wieku 4-6 lat, umożliwiająca naukę słownictwa poprzez dopasowywanie obrazków do słów. Aplikacja oferuje przyjazny interfejs z systemem motywacji opartym na gwiazdkach oraz trwałym zapisem postępów w chmurze. Rodzice mogą zarządzać wieloma profilami dzieci w ramach jednego konta, śledząc ich rozwój edukacyjny.

### 1.5 Grupa docelowa

Użytkownicy podstawowi:
- Dzieci w wieku 4-6 lat (użytkownicy końcowi gry)

Użytkownicy zarządzający:
- Rodzice/opiekunowie dzieci w wieku przedszkolnym
- Osoby poszukujące narzędzi edukacyjnych wspierających rozwój słownictwa dziecka

### 1.6 Stack technologiczny

Framework i Frontend:
- Astro 5 (Hybrid Rendering - SSR dla stron uwierzytelniania, CSR dla gry)
- React 19 z TypeScript 5
- Tailwind CSS 4 + Shadcn/UI

Backend i infrastruktura:
- Supabase (PostgreSQL + GoTrue Auth)
- Supabase Storage dla obrazków
- @supabase/auth-ui-react dla komponentów uwierzytelniania

Deployment:
- Vercel (preferowane dla Astro)
- Supabase Cloud (Free tier)

### 1.7 Kluczowe założenia produktowe

Model kont:
- Jedno konto rodzica (email/hasło) zarządza wieloma profilami dzieci
- Maksymalnie 3-5 profili dzieci na konto
- Brak osobnych kont email dla dzieci
- Wybór profilu przez kliknięcie avatara (bez PIN dla MVP)

Treści edukacyjne:
- 250 słów w języku polskim podzielonych na 5 kategorii po 50 słów
- Kategorie: Zwierzęta, Owoce i Warzywa, Pojazdy, Kolory i Kształty, Przedmioty Codziennego Użytku
- Wszystkie obrazki generowane przez AI (Google Imagen/Banana)
- Spójny styl wizualny: kolorowe, płaskie ilustracje dla dzieci

System motywacji:
- Gwiazdki (total_stars) jako główny wskaźnik postępu
- Tracker postępu dla każdej kategorii
- Brak dodatkowych odznak czy poziomów w MVP

Tryb działania:
- Wyłącznie online
- Brak funkcjonalności offline
- Automatyczna synchronizacja postępów w chmurze

### 1.8 Ograniczenia MVP

Timeline:
- 7 dni po 1-2 godziny dziennie (7-14 godzin total)
- Praca solo w trybie ekspresowym

Zakres:
- Koncentracja na core game loop i podstawowych funkcjonalnościach
- Uproszczony UI/UX
- Minimum danych osobowych (zgodność z prywatnością)

Urządzenia:
- Aplikacja webowa (mobile + desktop)
- Tylko skalowanie elementów (bez drastycznych zmian layoutu)
- Optymalizacja dla przeglądarek: Chrome, Safari, Firefox

## 2. Problem użytkownika

### 2.1 Problem główny

Rodzice dzieci w wieku przedszkolnym (4-6 lat) potrzebują skutecznych, angażujących narzędzi edukacyjnych, które:
- Wspierają rozwój słownictwa dziecka w sposób interaktywny
- Są dostosowane do możliwości poznawczych małych dzieci
- Pozwalają śledzić postępy w nauce
- Są dostępne w dowolnym miejscu i czasie
- Nie wymagają obecności rodzica podczas każdej sesji nauki

### 2.2 Obecne alternatywy i ich ograniczenia

Tradycyjne metody:
- Fiszki papierowe: Brak interaktywności, niemożność śledzenia postępów, łatwo się gubią
- Książki obrazkowe: Ograniczona powtarzalność, brak gamifikacji, pasywna forma nauki

Istniejące aplikacje edukacyjne:
- Zbyt skomplikowane interfejsy dla dzieci 4-6 lat
- Nadmiar funkcjonalności rozpraszającej uwagę
- Wymagają stałej obecności rodzica
- Brak możliwości zarządzania wieloma profilami dzieci
- Często płatne modele subskrypcyjne

### 2.3 Dlaczego ten problem jest istotny

Rozwój poznawczy:
- Wiek 4-6 lat to krytyczny okres rozwoju słownictwa
- Wzrokowe uczenie się jest najbardziej efektywne dla tej grupy wiekowej
- Pozytywne doświadczenia edukacyjne budują motywację do dalszej nauki

Potrzeby rodziców:
- Rodzice pragną aktywnie wspierać rozwój dzieci
- Brak czasu na ciągłe sesje nauki z dzieckiem
- Potrzeba obiektywnych wskaźników postępów
- Pragnienie bezpiecznych, kontrolowanych narzędzi cyfrowych

### 2.4 Wartość proponowanego rozwiązania

Dla dzieci:
- Intuicyjny interfejs dostosowany do małych rączek i ograniczonej koordynacji
- Natychmiastowy, pozytywny feedback zwiększający motywację
- Brak frustracji - możliwość poprawy po błędzie
- Gamifikacja poprzez zbieranie gwiazdek

Dla rodziców:
- Szybka rejestracja i setup (poniżej 2 minut)
- Zarządzanie wieloma dziećmi z jednego konta
- Widoczność postępów bez dodatkowych narzędzi
- Pewność bezpieczeństwa danych (minimum danych osobowych)
- Dostęp z dowolnego urządzenia z przeglądarką

## 3. Wymagania funkcjonalne

### 3.1 System uwierzytelniania i autoryzacji

3.1.1 Rejestracja rodzica
- Formularz rejestracji zawierający pola: email, hasło
- Walidacja email (format, unikalność)
- Wymagania dotyczące hasła: minimum 8 znaków
- Wykorzystanie Supabase Auth (GoTrue)
- Integracja z @supabase/auth-ui-react dla gotowych komponentów
- Automatyczne utworzenie rekordu w tabeli profiles po rejestracji (SQL Trigger)

3.1.2 Logowanie rodzica
- Formularz logowania: email, hasło
- Obsługa błędów: nieprawidłowe dane, nieaktywne konto
- Sesja użytkownika zarządzana przez Supabase Auth
- Opcja "Zapamiętaj mnie" (optional dla MVP)

3.1.3 Protected routes
- Wszystkie ścieżki poza /login i /register wymagają uwierzytelnienia
- Middleware przekierowujący niezalogowanych użytkowników na /login
- Przekierowanie zalogowanych użytkowników z /login na /dashboard

3.1.4 Wylogowanie
- Przycisk wylogowania dostępny w menu
- Zakończenie sesji w Supabase
- Przekierowanie na stronę logowania

### 3.2 Zarządzanie profilami dzieci

3.2.1 Tworzenie profilu dziecka
- Formularz zawierający: imię dziecka (display_name)
- Wybór avatara z 6-8 predefiniowanych opcji
- Walidacja: imię wymagane, max 50 znaków
- Ograniczenie: maksymalnie 3-5 profili na konto rodzica
- Automatyczna inicjalizacja: total_stars = 0
- Zapis w tabeli profiles powiązanej z auth.users

3.2.2 Wybór aktywnego profilu
- Ekran wyboru profilu po zalogowaniu rodzica
- Wyświetlenie wszystkich profili jako karty z avatarem i imieniem
- Kliknięcie w kartę profilu aktywuje ten profil dla bieżącej sesji
- Stan aktywnego profilu przechowywany w React Context/State

3.2.3 Edycja profilu dziecka
- Możliwość zmiany imienia dziecka
- Możliwość zmiany avatara
- Dostęp przez menu "Zarządzaj profilami"

3.2.4 Usuwanie profilu dziecka
- Przycisk usuwania w menu "Zarządzaj profilami"
- Modal potwierdzenia z ostrzeżeniem o utracie danych
- Usunięcie profilu wraz z powiązanymi rekordami w user_progress (CASCADE)

3.2.5 Przełączanie między profilami
- Przycisk "Zmień profil" widoczny w głównym menu
- Powrót do ekranu wyboru profilu
- Możliwość przełączenia bez wylogowania rodzica

### 3.3 Baza danych słownictwa

3.3.1 Struktura danych vocabulary
- Tabela zawierająca 250 rekordów (5 kategorii × 50 słów)
- Pola: id, word (tekst słowa), image_url (URL do Supabase Storage), category, language (default: 'pl')
- Kategorie:
  - Zwierzęta (50 słów)
  - Owoce i Warzywa (50 słów)
  - Pojazdy (50 słów)
  - Kolory i Kształty (50 słów)
  - Przedmioty Codziennego Użytku (50 słów)

3.3.2 Przechowywanie obrazków
- Wszystkie obrazki przechowywane w Supabase Storage
- Naming convention: category-word.png
- Format: PNG
- Rozmiar: optymalizacja do ~50KB na obrazek
- Publiczny URL dostępny z tabeli vocabulary

3.3.3 Generowanie treści AI
- Pre-work: Wszystkie 250 obrazków generowane przez Google Imagen/Banana przed rozpoczęciem rozwoju
- Spójny prompt: "colorful flat illustration for children showing [WORD], simple, friendly, white background, vector style"
- Batch processing dla wszystkich kategorii
- Ręczna weryfikacja jakości obrazków przed uploadem

### 3.4 Core game loop

3.4.1 Wybór kategorii
- Dashboard wyświetlający 5 dostępnych kategorii
- Każda kategoria jako duża, interaktywna karta z ikoną
- Wyświetlanie trackera postępu: "Zwierzęta: 35/50" (opanowane słowa / wszystkie słowa)
- Kliknięcie w kategorię rozpoczyna sesję gry

3.4.2 Sesja gry
- Struktura sesji: 10 pytań z wybranej kategorii
- Każde pytanie składa się z:
  - Jednego obrazka (duży, centralny)
  - Trzech przycisków z tekstem słowa (1 poprawny, 2 dystraktory)
  
3.4.3 Algorytm doboru pytań
- SQL query losujący słowa z wybranej kategorii
- Priorytetyzacja nieopanowanych słów (80% prawdopodobieństwa)
- Opanowane słowa pojawiają się z 20% prawdopodobieństwa dla utrwalenia
- Unikanie powtórzeń w bieżącej sesji (10 pytań)

3.4.4 Algorytm doboru dystraktorów
- 2 dystraktory losowane z tej samej kategorii co poprawne słowo
- Wykluczenie poprawnego słowa z puli dystraktorów
- SQL query: `SELECT * FROM vocabulary WHERE category = $1 AND id NOT IN ($2) ORDER BY RANDOM() LIMIT 3`
- Randomizacja pozycji przycisków (poprawna odpowiedź nie zawsze w tym samym miejscu)

3.4.5 Mechanika odpowiedzi
- Kliknięcie w przycisk sprawdza poprawność odpowiedzi
- Brak limitu czasu na odpowiedź
- Po błędzie:
  - Wyświetlenie komunikatu "Spróbuj jeszcze raz!" (pozytywny ton)
  - Możliwość kliknięcia ponownie (unlimited attempts)
  - Brak kary za błąd
- Po sukcesie:
  - Animacja sukcesu (np. confetti, powiększenie przycisku)
  - Opcjonalny dźwięk (jeśli zaimplementowane)
  - Dodanie gwiazdki do total_stars
  - Automatyczne przejście do następnego pytania (delay 1-2s)

3.4.6 Zapis postępu
- Po każdej poprawnej odpowiedzi: UPSERT do tabeli user_progress
- Pola: user_id, word_id, is_mastered = true, attempts += 1, last_attempt_at = NOW()
- Jeśli słowo już istnieje: aktualizacja attempts i last_attempt_at
- Jeśli nowe słowo: utworzenie rekordu z is_mastered = true
- Update total_stars w tabeli profiles (inkrementacja o 1)

3.4.7 Definicja opanowania słowa
- Słowo uznawane za opanowane po 1 poprawnej odpowiedzi
- is_mastered = true w tabeli user_progress
- Opanowane słowa nadal mogą się pojawiać (20% prawdopodobieństwa) dla powtórek

3.4.8 Ekran podsumowania sesji
- Wyświetlany po ukończeniu 10 pytań
- Zawiera:
  - Liczba zdobytych gwiazdek w tej sesji
  - Liczba poprawnych odpowiedzi (np. "8/10")
  - Motywujący komunikat (np. "Świetna robota!", "Jesteś coraz lepszy!")
  - Wizualna reprezentacja gwiazdek
- Opcje nawigacji:
  - Przycisk "Zagraj ponownie" (reset sesji w tej samej kategorii)
  - Przycisk "Wybierz inną kategorię" (powrót do dashboardu)

### 3.5 System postępów

3.5.1 Struktura tabeli user_progress
- Relacja: wiele-do-wielu między profiles i vocabulary
- Pola:
  - id (SERIAL PRIMARY KEY)
  - user_id (UUID REFERENCES profiles)
  - word_id (INTEGER REFERENCES vocabulary)
  - is_mastered (BOOLEAN DEFAULT FALSE)
  - attempts (INTEGER DEFAULT 0)
  - last_attempt_at (TIMESTAMPTZ)
  - UNIQUE(user_id, word_id) - zapobieganie duplikatom

3.5.2 Tracker postępu na kategorie
- Wyświetlany na dashboardzie pod każdą kategorią
- Obliczenie: COUNT(is_mastered = true WHERE category = $1) / 50
- Format: "Zwierzęta: 35/50"
- Wizualizacja: progress bar (opcjonalnie)

3.5.3 Total stars w profilu
- Pole total_stars w tabeli profiles
- Inkrementacja o 1 po każdej poprawnej odpowiedzi
- Wyświetlanie w nagłówku profilu dziecka
- Nie zmniejsza się przy błędach (tylko przyrost)

3.5.4 Persistence danych
- Wszystkie dane przechowywane w Supabase (PostgreSQL)
- Automatyczna synchronizacja przy każdym zapisie
- Dostęp z różnych urządzeń: dane zawsze aktualne (wymaga refresh page dla MVP)

### 3.6 Interfejs użytkownika

3.6.1 Responsywność
- Mobile-first approach
- Breakpointy:
  - Mobile: < 640px (layout pionowy, 1 kolumna)
  - Tablet: 640px - 1023px (większe elementy, nadal 1 kolumna)
  - Desktop: >= 1024px (layout centralny z max-width, większe obrazki)
- Minimalna wielkość przycisków: 80×80px (preferowane 100×100px)
- Touch targets min. 44×44px zgodnie z WCAG
- Font sizes skalowane: minimum 18px na mobile

3.6.2 Stylizacja z Shadcn/UI
- Wykorzystanie gotowych komponentów: Button, Card, Avatar, Input, Label
- Spójny design system z Tailwind CSS 4
- Paleta kolorów: jasne, przyjazne kolory dla dzieci
- Rounded corners: preferowane duże zaokrąglenia (rounded-2xl)

3.6.3 Animacje
- Subtelne animacje przejść (Framer Motion opcjonalnie)
- Animacja sukcesu po poprawnej odpowiedzi
- Loading states dla async operacji
- Smooth transitions między ekranami

3.6.4 Dostępność
- Wysokie kontrasty dla czytelności
- Alternatywne teksty dla obrazków (alt tags)
- Keyboard navigation (opcjonalnie dla MVP)
- Focus indicators na przyciskach

### 3.7 Onboarding użytkownika

3.7.1 Flow dla nowego rodzica
1. Wejście na landing page
2. Przycisk "Zarejestruj się" / "Rozpocznij naukę"
3. Formularz rejestracji (email, hasło)
4. Automatyczne przekierowanie do "Utwórz profil dziecka"
5. Formularz profilu: imię + wybór avatara
6. Przekierowanie do dashboardu z kategoriami
7. Możliwość natychmiastowego rozpoczęcia gry

3.7.2 Wskazówki dla rodzica (opcjonalne dla MVP)
- Tooltips wyjaśniające podstawowe funkcje
- Krótki modal powitalny z instrukcjami
- Link do FAQ lub pomocy

### 3.8 Zarządzanie sesją

3.8.1 Sesja użytkownika
- Sesja zarządzana przez Supabase Auth
- Token przechowywany w localStorage/sessionStorage
- Automatyczne odświeżanie tokenu
- Timeout sesji: zgodnie z defaults Supabase (1 godzina aktywności)

3.8.2 Stan aplikacji
- Stan aktywnego profilu dziecka w React Context
- Persistent storage dla session_id (opcjonalnie dla v2)
- Zapisywanie stanu gry przy przerwaniu sesji (opcjonalnie dla v2)

## 4. Granice produktu

### 4.1 Funkcjonalności wykluczone z MVP

4.1.1 Zaawansowane raporty postępów
- Szczegółowe wykresy i statystyki
- Eksport raportów do PDF/CSV
- Historia sesji z datami
- Analiza czasu odpowiedzi
- Przewidywane w wersji 1.1

4.1.2 Panel administracyjny/CMS
- Dodawanie własnych słów przez rodziców
- Edycja istniejących kategorii
- Upload własnych obrazków
- Zarządzanie użytkownikami (admin panel)
- Przewidywane w wersji 2.0

4.1.3 Multimedia
- Dźwięki i muzyka (opcjonalnie jako nice-to-have)
- Narracja głosowa słów
- Video tutorials
- Przewidywane w wersji 1.1

4.1.4 Rozbudowane animacje
- Zaawansowane animacje 3D
- Interaktywne tła
- Animated characters
- MVP skupia się na prostych, wydajnych animacjach

4.1.5 System osiągnięć
- Odznaki i trofea
- Poziomy trudności
- Leaderboardy
- Daily challenges
- Przewidywane w wersji 1.2

4.1.6 Funkcjonalności społecznościowe
- Sharing postępów na social media
- Porównywanie wyników z innymi dziećmi
- Komentarze i reviews
- Poza zakresem MVP

4.1.7 Eksport i backup danych
- Manual backup profili
- Eksport postępów do plików
- Import danych z innych aplikacji
- Przewidywane w wersji 1.3

4.1.8 Dark mode
- Ciemny motyw interfejsu
- Automatyczne przełączanie trybu
- Przewidywane w wersji 1.1

4.1.9 Funkcjonalności offline
- Działanie bez połączenia internetowego
- Local storage cache
- Sync po ponownym połączeniu
- Poza zakresem MVP (wymagana architektura online)

### 4.2 Ograniczenia techniczne

4.2.1 Języki
- Tylko język polski w MVP
- Struktura DB przygotowana dla przyszłej multilingwalności
- Dodatkowe języki w wersji 1.2+

4.2.2 Przeglądarki
- Wsparcie dla Chrome, Safari, Firefox (ostatnie 2 wersje)
- Brak wsparcia dla Internet Explorer
- Minimalne wsparcie dla starszych przeglądarek mobile

4.2.3 Urządzenia
- Aplikacja webowa (brak native apps)
- Brak dedykowanych aplikacji iOS/Android
- PWA jako future consideration (v2.0)

4.2.4 Limity free tier
- Supabase Free tier:
  - 500MB database
  - 1GB file storage
  - 2GB bandwidth/month
- Vercel Free tier:
  - 100GB bandwidth/month
  - Serverless Functions: 100GB-Hrs
- Wystarczające dla MVP i early testing

### 4.3 Ograniczenia danych użytkownika

4.3.1 Dane osobowe
- Minimum danych osobowych (tylko email rodzica)
- Brak pełnego imienia, adresu, telefonu
- Brak daty urodzenia dziecka
- Zgodność z zasadami ochrony prywatności dzieci

4.3.2 Limity kont
- Maksymalnie 3-5 profili dzieci na konto rodzica
- Brak możliwości współdzielenia profilu między kontami rodziców
- Jedno urządzenie na raz dla MVP (brak concurrent sessions handling)

4.3.3 Tracking i analytics
- Minimalne analytics (opcjonalnie Google Analytics lub Plausible)
- Brak zaawansowanego user tracking
- Privacy-first approach
- Zgodność z RODO jeśli planowane wdrożenie w UE

### 4.4 Granice czasowe

4.4.1 MVP Timeline
- 7 dni development (1-2h/dzień = 7-14h total)
- Praca solo (brak team collaboration)
- Tight deadline wymusza priorytetyzację
- Focus na core features tylko

4.4.2 Post-MVP
- User testing planowane po MVP (Dzień 8-14)
- Feedback loop i iteracje w v1.1
- Rozbudowa funkcjonalności w kolejnych wersjach

### 4.5 Zakres testowania

4.5.1 MVP testing scope
- Manual E2E testing całego user flow
- Podstawowe cross-browser testing
- Mobile responsiveness testing
- Brak automated testing (unit tests, integration tests)
- Brak load testing

4.5.2 Quality assurance
- Zero critical bugs dla MVP
- Known issues mogą być zadokumentowane dla v1.1
- Performance baseline: <2s czas ładowania (LCP)

## 5. Historyjki użytkowników

### 5.1 Uwierzytelnianie i zarządzanie kontem

US-001: Rejestracja rodzica
- Tytuł: Rejestracja nowego konta rodzica
- Opis: Jako nowy rodzic chcę zarejestrować się w aplikacji używając mojego adresu email i hasła, aby uzyskać dostęp do funkcjonalności edukacyjnych dla mojego dziecka.
- Kryteria akceptacji:
  - Formularz rejestracji zawiera pola: email, hasło, powtórz hasło
  - Walidacja email: sprawdzenie poprawności formatu i unikalności w systemie
  - Walidacja hasła: minimum 8 znaków, wyświetlenie komunikatu o wymaganiach
  - Hasła muszą być identyczne (walidacja "powtórz hasło")
  - Komunikaty błędów są jasne i pomocne (np. "Ten email jest już zarejestrowany")
  - Po udanej rejestracji automatyczne przekierowanie do tworzenia profilu dziecka
  - Rekord w tabeli profiles jest automatycznie tworzony przez SQL Trigger
  - Sesja użytkownika jest aktywna po rejestracji (brak konieczności ponownego logowania)

US-002: Logowanie rodzica
- Tytuł: Logowanie do istniejącego konta
- Opis: Jako zarejestrowany rodzic chcę zalogować się do aplikacji używając mojego emaila i hasła, aby uzyskać dostęp do profili moich dzieci i ich postępów.
- Kryteria akceptacji:
  - Formularz logowania zawiera pola: email, hasło
  - Przycisk "Zaloguj się" aktywny tylko gdy oba pola są wypełnione
  - Walidacja danych po stronie Supabase Auth
  - Komunikat błędu przy nieprawidłowych danych: "Nieprawidłowy email lub hasło"
  - Po udanym logowaniu przekierowanie do ekranu wyboru profilu dziecka
  - Sesja użytkownika zachowana zgodnie z Supabase defaults
  - Link "Nie masz konta? Zarejestruj się" prowadzący do formularza rejestracji

US-003: Wylogowanie rodzica
- Tytuł: Bezpieczne wylogowanie z aplikacji
- Opis: Jako zalogowany rodzic chcę móc się wylogować z aplikacji, aby zabezpieczyć dane przed dostępem osób trzecich na wspólnym urządzeniu.
- Kryteria akceptacji:
  - Przycisk "Wyloguj się" widoczny w głównym menu/hamburger menu
  - Kliknięcie przycisku kończy sesję w Supabase Auth
  - Użytkownik jest przekierowywany na stronę logowania
  - Stan aktywnego profilu dziecka jest czyszczony
  - Próba dostępu do protected routes po wylogowaniu przekierowuje na /login
  - Komunikat potwierdzający wylogowanie (opcjonalnie)

US-004: Ochrona tras przed nieautoryzowanym dostępem
- Tytuł: Protected routes dla zalogowanych użytkowników
- Opis: Jako system chcę blokować dostęp do gry i dashboardu dla niezalogowanych użytkowników, aby chronić dane i funkcjonalności aplikacji.
- Kryteria akceptacji:
  - Middleware sprawdza sesję użytkownika przed dostępem do /dashboard, /game, /profiles
  - Niezalogowani użytkownicy są automatycznie przekierowywani na /login
  - Zalogowani użytkownicy wchodzący na /login są przekierowywani na /dashboard
  - Przekierowania zachowują intended URL (opcjonalnie dla MVP)
  - Brak "błysku" protected content przed przekierowaniem
  - Loading state podczas weryfikacji sesji

### 5.2 Zarządzanie profilami dzieci

US-005: Tworzenie pierwszego profilu dziecka (Onboarding)
- Tytuł: Utworzenie profilu dziecka podczas pierwszego logowania
- Opis: Jako nowo zarejestrowany rodzic chcę natychmiast utworzyć profil dla mojego dziecka po rejestracji, aby dziecko mogło rozpocząć naukę bez zbędnych opóźnień.
- Kryteria akceptacji:
  - Po rejestracji automatyczne przekierowanie na ekran "Utwórz profil dziecka"
  - Formularz zawiera: pole tekstowe na imię (wymagane, max 50 znaków)
  - Wybór avatara: 6-8 opcji wyświetlonych jako grid z dużymi ikonami
  - Walidacja: imię nie może być puste, komunikat błędu przy próbie zapisu pustego pola
  - Przycisk "Utwórz profil" zapisuje dane w tabeli profiles
  - Inicjalizacja total_stars = 0 dla nowego profilu
  - Po utworzeniu przekierowanie na dashboard z kategoriami
  - Profil jest automatycznie ustawiony jako aktywny (brak konieczności ponownego wyboru)

US-006: Dodawanie kolejnych profili dzieci
- Tytuł: Dodanie profilu dla kolejnego dziecka
- Opis: Jako rodzic z wieloma dziećmi chcę dodać dodatkowe profile dla moich pozostałych dzieci, aby każde miało osobny postęp edukacyjny.
- Kryteria akceptacji:
  - Dostęp przez menu "Zarządzaj profilami" z głównego menu
  - Przycisk "+ Dodaj dziecko" widoczny gdy liczba profili < 5
  - Formularz identyczny jak przy tworzeniu pierwszego profilu (imię + avatar)
  - Walidacja: sprawdzenie czy limit profili (3-5) nie został przekroczony
  - Komunikat błędu przy przekroczeniu limitu: "Możesz mieć maksymalnie 5 profili dzieci"
  - Po utworzeniu powrót do listy profili w "Zarządzaj profilami"
  - Nowy profil pojawia się na ekranie wyboru profilu

US-007: Wybór aktywnego profilu dziecka
- Tytuł: Wybór profilu dziecka przed rozpoczęciem gry
- Opis: Jako rodzic z wieloma profilami dzieci chcę wybrać profil konkretnego dziecka, aby gra zapisywała postępy właściwego ucznia.
- Kryteria akceptacji:
  - Po zalogowaniu wyświetlany jest ekran "Wybierz profil"
  - Każdy profil reprezentowany jako karta z: avatar, imię, total_stars
  - Karty są duże i łatwe do kliknięcia (minimum 150×150px)
  - Kliknięcie w kartę ustawia profil jako aktywny w React Context/State
  - Przekierowanie na dashboard z kategoriami
  - Aktywny profil wyświetlony w nagłówku aplikacji (imię + avatar)
  - Przycisk "Zmień profil" dostępny w menu

US-008: Przełączanie między profilami dzieci
- Tytuł: Szybka zmiana aktywnego profilu
- Opis: Jako rodzic chcę móc szybko przełączyć się na profil innego dziecka, aby kolejne dziecko mogło rozpocząć swoją sesję nauki.
- Kryteria akceptacji:
  - Przycisk "Zmień profil" widoczny w głównym menu (dostępny z każdego ekranu)
  - Kliknięcie przekierowuje na ekran wyboru profilu
  - Postęp bieżącej sesji jest zapisywany przed przełączeniem (jeśli sesja w toku)
  - Po wyborze nowego profilu: przekierowanie na dashboard nowego profilu
  - Brak wylogowania rodzica podczas przełączania profili
  - Maksymalnie 3 kliknięcia do zmiany profilu

US-009: Edycja profilu dziecka
- Tytuł: Zmiana danych profilu dziecka
- Opis: Jako rodzic chcę móc zmienić imię lub avatar mojego dziecka, aby profil był aktualny i odpowiadał preferencjom dziecka.
- Kryteria akceptacji:
  - Dostęp przez menu "Zarządzaj profilami"
  - Lista wszystkich profili z przyciskiem "Edytuj" przy każdym
  - Formularz edycji zawiera: pole imienia (prefilowane), wybór avatara (current zaznaczony)
  - Walidacja identyczna jak przy tworzeniu profilu
  - Przycisk "Zapisz zmiany" aktualizuje rekord w tabeli profiles
  - Przycisk "Anuluj" bez zapisywania zmian
  - Po zapisaniu komunikat sukcesu: "Profil zaktualizowany"
  - total_stars i user_progress pozostają niezmienione

US-010: Usuwanie profilu dziecka
- Tytuł: Usunięcie profilu dziecka i jego danych
- Opis: Jako rodzic chcę móc usunąć profil dziecka, gdy nie jest już potrzebny, aby zachować porządek w aplikacji.
- Kryteria akceptacji:
  - Dostęp przez menu "Zarządzaj profilami"
  - Przycisk "Usuń" przy każdym profilu (icon kosza lub tekst)
  - Modal potwierdzenia z ostrzeżeniem: "Czy na pewno chcesz usunąć profil [IMIĘ]? Wszystkie postępy zostaną utracone."
  - Opcje w modalu: "Usuń" (czerwony) i "Anuluj" (neutralny)
  - Po potwierdzeniu usunięcie rekordu z profiles i cascade delete z user_progress
  - Komunikat sukcesu: "Profil został usunięty"
  - Jeśli usunięto aktywny profil: przekierowanie na ekran wyboru profilu
  - Nie można usunąć ostatniego profilu (minimum 1 profil musi pozostać)

### 5.3 Przeglądanie kategorii i rozpoczynanie gry

US-011: Wyświetlanie dashboardu z kategoriami
- Tytuł: Przeglądanie dostępnych kategorii słownictwa
- Opis: Jako rodzic/dziecko chcę widzieć wszystkie dostępne kategorie słownictwa na dashboardzie, aby wybrać interesujący temat do nauki.
- Kryteria akceptacji:
  - Dashboard wyświetla 5 kart kategorii: Zwierzęta, Owoce i Warzywa, Pojazdy, Kolory i Kształty, Przedmioty Codziennego Użytku
  - Każda karta zawiera: nazwę kategorii, ikonę reprezentującą kategorię, tracker postępu (np. "35/50")
  - Karty są duże i łatwe do kliknięcia dla małych dzieci (minimum 200×200px na mobile)
  - Layout responsywny: 1 kolumna na mobile, 2-3 kolumny na desktop
  - Tracker postępu pokazuje liczbę opanowanych słów / wszystkie słowa w kategorii
  - Imię i avatar aktywnego profilu widoczne w nagłówku
  - Total_stars aktywnego profilu wyświetlone w widocznym miejscu

US-012: Rozpoczęcie sesji gry z wybranej kategorii
- Tytuł: Start gry po wyborze kategorii
- Opis: Jako dziecko chcę kliknąć w wybraną kategorię i natychmiast rozpocząć sesję nauki, aby szybko zaangażować się w grę.
- Kryteria akceptacji:
  - Kliknięcie w kartę kategorii przekierowuje na /game/[category]
  - Wyświetlenie loading state z komunikatem "Przygotowuję pytania..." (maksymalnie 2s)
  - Ładowanie 10 pytań z bazy danych (losowanie zgodne z algorytmem - 80% nieopanowane, 20% opanowane)
  - Dla każdego pytania: fetch 1 poprawne słowo + 2 dystraktory z tej samej kategorii
  - Randomizacja kolejności przycisków (poprawna odpowiedź w różnych pozycjach)
  - Wyświetlenie pierwszego pytania automatycznie po załadowaniu
  - Licznik pytań: "Pytanie 1/10" widoczny w nagłówku
  - Przycisk "Wyjdź" dostępny w menu (powrót do dashboardu)

### 5.4 Rozgrywka - Core game loop

US-013: Wyświetlanie pytania
- Tytuł: Prezentacja pytania z obrazkiem i opcjami odpowiedzi
- Opis: Jako dziecko chcę widzieć duży, wyraźny obrazek i trzy łatwe do kliknięcia przyciski z tekstem, aby móc intuicyjnie dopasować słowo do obrazka.
- Kryteria akceptacji:
  - Layout pytania: obrazek na górze (zajmuje 50-60% wysokości ekranu), 3 przyciski poniżej
  - Obrazek: centralny, wyraźny, z białym/neutralnym tłem
  - Przyciski: minimum 80×80px, duży font (24-30px), rounded corners
  - 3 przyciski ułożone w kolumnie na mobile, w wierszu na desktop
  - Tekst na przyciskach: 1 poprawny + 2 dystraktory z tej samej kategorii
  - Losowa pozycja poprawnej odpowiedzi (nie zawsze pierwszy przycisk)
  - Odstępy między przyciskami: minimum 20px dla łatwości klikania
  - Brak timera (dziecko ma nieograniczony czas)

US-014: Obsługa poprawnej odpowiedzi
- Tytuł: Pozytywny feedback po poprawnym kliknięciu
- Opis: Jako dziecko chcę otrzymać natychmiastowy, pozytywny feedback po wybraniu poprawnej odpowiedzi, aby czuć się zmotywowane i wiedzieć, że zrobiłem dobrze.
- Kryteria akceptacji:
  - Po kliknięciu poprawnej odpowiedzi: wizualna animacja sukcesu (np. powiększenie przycisku, zmiana koloru na zielony, confetti)
  - Opcjonalny dźwięk sukcesu (jeśli zaimplementowane)
  - Komunikat motywujący: "Świetnie!", "Brawo!", "Doskonale!" (rotacja komunikatów)
  - Dodanie 1 gwiazdki do total_stars (widoczna inkrementacja licznika w nagłówku)
  - Zapis postępu w bazie: UPSERT do user_progress (is_mastered = true, attempts += 1)
  - Delay 1-2 sekundy przed przejściem do następnego pytania
  - Automatyczne przejście do następnego pytania (bez konieczności klikania)

US-015: Obsługa błędnej odpowiedzi
- Tytuł: Pozytywny feedback po błędnej odpowiedzi
- Opis: Jako dziecko chcę otrzymać przyjazny, niekarący feedback po błędzie, aby nie czuć się zniechęcone i móc spróbować ponownie.
- Kryteria akceptacji:
  - Po kliknięciu błędnej odpowiedzi: subtelna animacja (np. delikatne potrząśnięcie przycisku)
  - Komunikat pozytywny: "Spróbuj jeszcze raz!", "Prawie! Spróbuj ponownie"
  - Brak koloru czerwonego lub negatywnych wizualizacji
  - Możliwość natychmiastowego ponownego kliknięcia (unlimited attempts)
  - Brak kary: nie tracenie gwiazdek, brak ujemnych punktów
  - Obrazek i przyciski pozostają na ekranie (brak zmiany pytania)
  - Dziecko może klikać aż wybierze poprawną odpowiedź
  - Attempts NIE są zapisywane dla błędnych odpowiedzi (tylko dla poprawnych)

US-016: Nawigacja przez 10 pytań w sesji
- Tytuł: Płynne przejścia między pytaniami
- Opis: Jako dziecko chcę płynnie przechodzić przez kolejne pytania w sesji, aby gra była dynamiczna i nie tracić zainteresowania.
- Kryteria akceptacji:
  - Licznik "Pytanie X/10" aktualizowany po każdym pytaniu
  - Smooth transition między pytaniami (fade in/out lub slide)
  - Brak konieczności ręcznego klikania "Następne pytanie"
  - Loading state między pytaniami (maksymalnie 0.5s)
  - Po 10 pytaniu automatyczne przekierowanie na ekran podsumowania
  - Możliwość przerwania sesji: przycisk "Wyjdź" w menu (z potwierdzeniem)
  - Aktualny postęp zapisywany po każdym pytaniu (brak utraty danych przy przerwaniu)

US-017: Ekran podsumowania sesji
- Tytuł: Podsumowanie wyników po ukończeniu 10 pytań
- Opis: Jako dziecko chcę zobaczyć podsumowanie mojej sesji z liczbą zdobytych gwiazdek i motywującym komunikatem, aby czuć satysfakcję z ukończenia sesji.
- Kryteria akceptacji:
  - Ekran podsumowania wyświetlany automatycznie po 10. pytaniu
  - Wyświetlane informacje:
    - Liczba zdobytych gwiazdek w tej sesji (np. "8 gwiazdek!")
    - Procent poprawnych odpowiedzi (opcjonalnie: "8/10")
    - Motywujący komunikat: "Świetna robota!", "Jesteś coraz lepszy!", "Niesamowite!"
  - Wizualna reprezentacja gwiazdek (ikony gwiazdek, animowane)
  - Opcje nawigacji:
    - Przycisk "Zagraj ponownie" (reset sesji w tej samej kategorii, nowe losowanie pytań)
    - Przycisk "Wybierz inną kategorię" (powrót do dashboardu)
  - Duże, łatwe do kliknięcia przyciski (minimum 100×50px)
  - Brak automatycznego powrotu do dashboardu (dziecko decyduje)

### 5.5 System postępów i persistence

US-018: Zapis postępu po każdym poprawnym pytaniu
- Tytuł: Trwałe zapisywanie postępu w chmurze
- Opis: Jako rodzic chcę mieć pewność, że każda poprawna odpowiedź mojego dziecka jest natychmiast zapisywana w bazie danych, aby postępy były bezpieczne i dostępne z różnych urządzeń.
- Kryteria akceptacji:
  - Po każdej poprawnej odpowiedzi wywołanie UPSERT do tabeli user_progress
  - Jeśli rekord (user_id, word_id) już istnieje: aktualizacja attempts i last_attempt_at
  - Jeśli rekord nie istnieje: utworzenie nowego z is_mastered = true, attempts = 1
  - Update total_stars w tabeli profiles (inkrementacja o 1)
  - Operacja asynchroniczna (nie blokuje UI)
  - Error handling: retry mechanism przy błędzie zapisu (maksymalnie 3 próby)
  - Jeśli zapis nie powiedzie się: wyświetlenie komunikatu "Problem z zapisem postępu. Sprawdź połączenie."
  - Zapisane dane widoczne natychmiast po refresh page

US-019: Wyświetlanie trackera postępu dla kategorii
- Tytuł: Śledzenie liczby opanowanych słów w każdej kategorii
- Opis: Jako rodzic/dziecko chcę widzieć ile słów zostało już opanowanych w każdej kategorii, aby monitorować postęp edukacyjny.
- Kryteria akceptacji:
  - Na dashboardzie pod każdą kategorią wyświetlany tracker: "Zwierzęta: 35/50"
  - Obliczenie: COUNT(user_progress WHERE user_id = $1 AND is_mastered = true AND word_id IN (SELECT id FROM vocabulary WHERE category = $2))
  - Tracker aktualizowany po każdej sesji (przy powrocie na dashboard)
  - Progress bar wizualizujący postęp (opcjonalnie, np. 70% wypełnienia)
  - Jeśli wszystkie 50 słów opanowane: wyświetlenie "50/50 ✓" lub ikony trofeum
  - Dane pobierane asynchronicznie z cache dla szybkości

US-020: Wyświetlanie total_stars w profilu dziecka
- Tytuł: Licznik całkowitych gwiazdek
- Opis: Jako dziecko chcę widzieć ile gwiazdek zdobyłem w sumie, aby czuć dumę ze swoich osiągnięć.
- Kryteria akceptacji:
  - Total_stars wyświetlane w nagłówku aplikacji obok imienia i avatara dziecka
  - Format: duża liczba + ikona gwiazdki (np. "127 ⭐")
  - Wartość aktualizowana w czasie rzeczywistym po każdej poprawnej odpowiedzi
  - Total_stars inkrementuje się tylko (nigdy nie zmniejsza)
  - Wartość synchronizowana z bazą danych (pole total_stars w profiles)
  - Widoczne na wszystkich ekranach aplikacji (dashboard, game, podsumowanie)

US-021: Priorytetyzacja nieopanowanych słów w sesji
- Tytuł: Algorytm doboru pytań faworyzujący nowe słowa
- Opis: Jako system chcę priorytetyzować słowa nieopanowane w sesji gry, aby dziecko maksymalnie wykorzystało czas na naukę nowych treści.
- Kryteria akceptacji:
  - Algorytm: 80% pytań z nieopanowanych słów (is_mastered = false), 20% z opanowanych (is_mastered = true)
  - SQL query: SELECT z priorytetem dla WHERE is_mastered = false
  - Jeśli w kategorii brak nieopanowanych słów: 100% z opanowanych (dla utrwalenia)
  - Unikanie powtórzeń w bieżącej sesji (10 unikalnych słów)
  - Losowa kolejność pytań (brak przewidywalności)
  - Fallback: jeśli brak wystarczająco słów, dopełnienie z dostępnych

US-022: Persistence danych między urządzeniami
- Tytuł: Dostęp do postępów z różnych urządzeń
- Opis: Jako rodzic chcę móc zalogować się na tablecie i telefonie, widząc te same postępy dziecka, aby umożliwić naukę w różnych lokalizacjach.
- Kryteria akceptacji:
  - Wszystkie dane przechowywane w Supabase PostgreSQL (cloud)
  - Logowanie z różnych urządzeń: te same credentials
  - Po zalogowaniu automatyczne pobranie wszystkich profili i postępów
  - Refresh page synchronizuje najnowsze dane (dla MVP)
  - Brak real-time sync (opcjonalnie dla v2)
  - Consistent UX między urządzeniami (responsive design)

### 5.6 Responsywność i dostępność

US-023: Responsywny layout na urządzeniach mobilnych
- Tytuł: Optymalizacja interfejsu dla smartfonów
- Opis: Jako rodzic chcę, aby aplikacja działała płynnie na smartfonie mojego dziecka, z dużymi przyciskami i czytelnym tekstem.
- Kryteria akceptacji:
  - Mobile breakpoint: < 640px
  - Layout pionowy: obrazek na górze, 3 przyciski w kolumnie poniżej
  - Przyciski: minimum 80×80px, preferowane 100×100px
  - Font sizes: minimum 18px dla tekstu, 24-30px dla przycisków
  - Touch targets: minimum 44×44px (zgodność z WCAG)
  - Odstępy między elementami: minimum 20px
  - Jednokrotne scrollowanie (jeśli konieczne) - brak horizontal scroll
  - Testy na iPhone SE (375px width) i większych urządzeniach

US-024: Responsywny layout na desktopach
- Tytuł: Optymalizacja interfejsu dla większych ekranów
- Opis: Jako rodzic używający laptopa chcę, aby aplikacja wykorzystywała większy ekran, wyświetlając większe obrazki i bardziej przestrzenny layout.
- Kryteria akceptacji:
  - Desktop breakpoint: >= 1024px
  - Layout centralny z max-width (np. 1200px), wycentrowany
  - Większe obrazki (maksymalnie 600×600px)
  - Przyciski w wierszu (horizontal layout) zamiast kolumny
  - Większe fonty: 20px tekst, 32-40px przyciski
  - Wykorzystanie większej przestrzeni dla komfortowego użycia myszy
  - Testy na rozdzielczościach: 1366×768, 1920×1080

US-025: Duże, przyjazne elementy interaktywne dla małych dzieci
- Tytuł: Interfejs dostosowany do koordynacji 4-6 latków
- Opis: Jako dziecko w wieku 4-6 lat chcę mieć duże, łatwe do kliknięcia przyciski i elementy, aby móc samodzielnie korzystać z aplikacji.
- Kryteria akceptacji:
  - Wszystkie przyciski minimum 80×80px (preferowane 100×100px)
  - Touch targets minimum 44×44px dla dostępności
  - Duże odstępy między przyciskami (20-30px)
  - Wyraźne kolory i kontrasty (łatwa identyfikacja)
  - Brak małych linków lub ikon wymagających precyzji
  - Rounded corners dla przyjazności (rounded-2xl)
  - Hover states dla feedbacku (na desktop)
  - Active states przy touch (na mobile)

US-026: Czytelność i kontrasty
- Tytuł: Wysokie kontrasty dla czytelności
- Opis: Jako dziecko chcę widzieć wyraźny tekst i obrazki, aby nie męczyć oczu i łatwo czytać słowa na przyciskach.
- Kryteria akceptacji:
  - Kontrast tekstu do tła minimum 4.5:1 (zgodność WCAG AA)
  - Preferowane 7:1 dla WCAG AAA
  - Ciemny tekst na jasnym tle lub odwrotnie
  - Unikanie niskich kontrastów (szary na szarym)
  - Obrazki z białym/neutralnym tłem dla maksymalnej czytelności
  - Font size minimum 18px dla wszystkich tekstów

### 5.7 Performance i stabilność

US-027: Szybkie ładowanie aplikacji
- Tytuł: Optymalizacja czasu ładowania stron
- Opis: Jako użytkownik chcę, aby aplikacja ładowała się szybko (poniżej 2 sekund), aby dziecko nie traciło zainteresowania podczas oczekiwania.
- Kryteria akceptacji:
  - LCP (Largest Contentful Paint) < 2s
  - FID (First Input Delay) < 100ms
  - CLS (Cumulative Layout Shift) < 0.1
  - Pomiar przez Lighthouse CI
  - Obrazki zoptymalizowane: max ~50KB per image
  - Lazy loading dla obrazków poza viewport
  - Code splitting dla JavaScript (Astro domyślnie)
  - Testy na 3G network (symulacja słabszego połączenia)

US-028: Loading states dla operacji asynchronicznych
- Tytuł: Wizualne informowanie o trwających operacjach
- Opis: Jako użytkownik chcę widzieć jasne loading indicators podczas ładowania danych, aby wiedzieć, że aplikacja pracuje.
- Kryteria akceptacji:
  - Loading spinner lub skeleton screen podczas ładowania pytań
  - Komunikat tekstowy: "Przygotowuję pytania..." przy starcie sesji
  - Loading state na przyciskach podczas zapisu postępu (disabled + spinner)
  - Maksymalny czas loading state: 2s (timeout z komunikatem błędu)
  - Smooth transitions: fade in/out dla lepszego UX
  - Brak "skakania" layoutu podczas ładowania (reserved space)

US-029: Obsługa błędów i edge cases
- Tytuł: Graceful degradation i error handling
- Opis: Jako użytkownik chcę otrzymywać jasne komunikaty o błędach i mieć możliwość kontynuacji pracy mimo problemów technicznych.
- Kryteria akceptacji:
  - Error boundaries w React dla crash handling
  - Komunikaty błędów przyjazne dla użytkownika (nie techniczne)
  - Przykłady komunikatów:
    - "Nie można załadować pytań. Sprawdź połączenie z internetem."
    - "Problem z zapisem postępu. Spróbuj ponownie."
  - Przyciski retry dla operacji które się nie powiodły
  - Fallback UI dla brakujących obrazków (placeholder)
  - Logowanie błędów do konsoli (dla debugging)
  - Opcjonalnie: integracja z Sentry dla error tracking (v1.1)

US-030: Zero critical bugs
- Tytuł: Stabilność aplikacji bez krytycznych błędów
- Opis: Jako użytkownik chcę, aby aplikacja działała bez crashy i data loss, gwarantując bezpieczną naukę.
- Kryteria akceptacji:
  - Brak unhandled exceptions powodujących crash aplikacji
  - Wszystkie operacje zapisu postępu z error handling i retry
  - Data integrity: brak utraty danych przy przerwaniu sesji
  - Cross-browser testing: Chrome, Safari, Firefox (ostatnie 2 wersje)
  - Mobile testing: iOS Safari, Chrome Android
  - Manual E2E testing całego user flow przed deployment
  - Known issues dokumentowane (jeśli nie-critical) dla v1.1

### 5.8 Edge cases i scenariusze alternatywne

US-031: Próba dostępu do gry bez zalogowania
- Tytuł: Przekierowanie niezalogowanych użytkowników
- Opis: Jako system chcę blokować dostęp do gry dla niezalogowanych użytkowników, chroniąc funkcjonalności przed nieautoryzowanym użyciem.
- Kryteria akceptacji:
  - Direct URL access do /game lub /dashboard przekierowuje na /login
  - Middleware sprawdza session przed renderowaniem protected pages
  - Komunikat informacyjny: "Zaloguj się, aby kontynuować"
  - Zachowanie intended URL dla przekierowania po logowaniu (opcjonalnie)
  - Brak "błysku" protected content przed przekierowaniem
  - Consistent behavior na wszystkich protected routes

US-032: Brak nieopanowanych słów w kategorii
- Tytuł: Obsługa sytuacji gdy wszystkie słowa w kategorii są opanowane
- Opis: Jako dziecko które opanowało wszystkie słowa w kategorii chcę nadal móc grać w tej kategorii dla utrwalenia wiedzy.
- Kryteria akceptacji:
  - Jeśli wszystkie 50 słów w kategorii is_mastered = true: sesja składa się w 100% z opanowanych słów
  - Komunikat na dashboardzie: "50/50 ✓ Wszystko opanowane! Graj dalej dla utrwalenia"
  - Możliwość rozpoczęcia sesji w tej kategorii (przycisk aktywny)
  - Słowa nadal losowane dla różnorodności
  - Gwiazdki nadal przyznawane za poprawne odpowiedzi
  - Brak komunikatu "Brak pytań"

US-033: Przerwanie sesji w połowie gry
- Tytuł: Bezpieczne wyjście z gry przed ukończeniem 10 pytań
- Opis: Jako użytkownik chcę móc wyjść z gry w dowolnym momencie, zapisując dotychczasowy postęp bez utraty danych.
- Kryteria akceptacji:
  - Przycisk "Wyjdź" dostępny w menu podczas gry
  - Kliknięcie pokazuje modal: "Czy na pewno chcesz wyjść? Twój postęp zostanie zapisany."
  - Opcje: "Wyjdź" i "Kontynuuj grę"
  - Po potwierdzeniu: zapis wszystkich dotychczasowych poprawnych odpowiedzi
  - Przekierowanie na dashboard
  - Total_stars aktualizowane zgodnie z ukończonymi pytaniami
  - Brak utraty gwiazdek za przerwanie sesji

US-034: Problem z połączeniem internetowym
- Tytuł: Obsługa utraty połączenia podczas gry
- Opis: Jako użytkownik chcę otrzymać jasny komunikat o problemie z internetem i możliwość ponowienia próby.
- Kryteria akceptacji:
  - Wykrywanie utraty połączenia przy operacjach fetch/Supabase
  - Komunikat: "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie."
  - Przycisk "Spróbuj ponownie" dla retry operacji
  - Timeout dla operacji sieciowych: 10s
  - Local state zachowany podczas utraty połączenia (brak reset gry)
  - Po przywróceniu połączenia: automatyczne retry zapisu postępu
  - Opcjonalnie: offline indicator w UI (v1.1)

US-035: Limit profili dzieci osiągnięty
- Tytuł: Obsługa próby dodania profilu powyżej limitu
- Opis: Jako rodzic z maksymalną liczbą profili chcę otrzymać jasny komunikat o limicie i jego przyczynie.
- Kryteria akceptacji:
  - Przycisk "+ Dodaj dziecko" disabled gdy liczba profili = 5
  - Tooltip przy hover: "Maksymalnie 5 profili"
  - Komunikat w modal przy próbie dodania: "Osiągnąłeś limit 5 profili. Usuń istniejący profil, aby dodać nowy."
  - Brak możliwości obejścia limitu (walidacja po stronie backend)
  - Link do "Zarządzaj profilami" w komunikacie
  - Wyjaśnienie limitu dla MVP (opcjonalnie w FAQ)

US-036: Próba usunięcia ostatniego profilu
- Tytuł: Blokada usunięcia ostatniego profilu dziecka
- Opis: Jako system chcę zapobiegać sytuacji gdy konto rodzica nie ma żadnego profilu dziecka, wymagając minimum jednego profilu.
- Kryteria akceptacji:
  - Przycisk "Usuń" disabled dla ostatniego profilu
  - Komunikat przy hover: "Nie można usunąć ostatniego profilu"
  - Alternatywnie: modal informacyjny gdy próba usunięcia ostatniego profilu
  - "Musisz mieć przynajmniej jeden profil dziecka. Dodaj nowy profil przed usunięciem tego."
  - Zachowanie minimum 1 profilu w bazie danych
  - Walidacja po stronie backend (FOREIGN KEY constraints)

## 6. Metryki sukcesu

### 6.1 Metryki produktowe (KPI)

6.1.1 User Acquisition (Pozyskanie Użytkowników)
- Definicja: Liczba nowo zarejestrowanych kont rodzica
- Target dla MVP: 20+ rodzin w pierwszym miesiącu po uruchomieniu
- Metoda pomiaru: Query Supabase
  ```sql
  SELECT COUNT(*) FROM auth.users 
  WHERE created_at >= '[data_uruchomienia]'
  ```
- Częstotliwość pomiaru: Tygodniowa
- Znaczenie: Wskaźnik efektywności marketingu i atrakcyjności produktu

6.1.2 Engagement (Zaangażowanie)
- Definicja: Średnia liczba ukończonych słów na profil dziecka w pierwszym tygodniu użytkowania
- Target dla MVP: 15+ opanowanych słów na dziecko
- Metoda pomiaru:
  ```sql
  SELECT AVG(word_count) 
  FROM (
    SELECT user_id, COUNT(*) as word_count 
    FROM user_progress 
    WHERE is_mastered = true 
      AND last_attempt_at >= created_at 
      AND last_attempt_at <= created_at + INTERVAL '7 days'
    GROUP BY user_id
  )
  ```
- Częstotliwość pomiaru: Po 7 dniach od rejestracji każdego użytkownika
- Znaczenie: Wskaźnik faktycznego użytkowania produktu i value delivery

6.1.3 Retention (Utrzymanie Użytkowników)
- Definicja: Procent dzieci wracających następnego dnia (D1 Retention)
- Target dla MVP: 40%
- Metoda pomiaru:
  ```sql
  SELECT 
    COUNT(DISTINCT d1.user_id) * 100.0 / COUNT(DISTINCT d0.user_id) as d1_retention
  FROM user_progress d0
  LEFT JOIN user_progress d1 
    ON d0.user_id = d1.user_id 
    AND DATE(d1.last_attempt_at) = DATE(d0.created_at) + 1
  WHERE DATE(d0.created_at) = '[data_analizy]'
  ```
- Częstotliwość pomiaru: Dzienna
- Znaczenie: Wskaźnik sticky-ness produktu i przyzwyczajenia użytkowników

6.1.4 Completion Rate (Wskaźnik Ukończenia Sesji)
- Definicja: Procent rozpoczętych sesji kończących się ukończeniem wszystkich 10 pytań
- Target dla MVP: 60%
- Metoda pomiaru: Tracking session_id w tabeli pomocniczej (opcjonalnie dla v2)
  - Alternatywnie dla MVP: Manual tracking przez analytics events
- Częstotliwość pomiaru: Tygodniowa
- Znaczenie: Wskaźnik engagement i frustracji użytkowników

6.1.5 Technical Performance - Czas Ładowania
- Definicja: LCP (Largest Contentful Paint) dla ekranu gry
- Target dla MVP: < 2 sekundy
- Metoda pomiaru: 
  - Lighthouse CI w pipeline deployment
  - Web Vitals tracking w production
- Częstotliwość pomiaru: Przy każdym deployment + continuous monitoring
- Znaczenie: Wskaźnik UX i potencjalnych drop-offs z powodu wolnego ładowania

6.1.6 Technical Performance - Error Rate
- Definicja: Liczba critical bugs / errors na 100 sesji użytkownika
- Target dla MVP: 0 critical bugs (bugs powodujące crash lub data loss)
- Metoda pomiaru:
  - Manual testing przed release
  - Error tracking (Sentry lub console logging)
- Częstotliwość pomiaru: Continuous monitoring post-release
- Znaczenie: Wskaźnik stabilności i jakości kodu

### 6.2 Metryki jakościowe

6.2.1 Użyteczność dla Dzieci
- Definicja: Czy dziecko 4-6 lat potrafi samodzielnie wybrać kategorię i rozpocząć grę
- Metoda pomiaru: User testing z 5-10 dziećmi z grupy docelowej (post-MVP)
- Target: 80% dzieci wykonuje zadanie samodzielnie po pierwszym pokazaniu przez rodzica
- Znaczenie: Wskaźnik intuicyjności interfejsu

6.2.2 Brak Frustracji przy Błędach
- Definicja: Czy dziecko kontynuuje grę po popełnieniu błędu bez pomocy rodzica
- Metoda pomiaru: Obserwacja podczas user testing + ankiety rodziców
- Target: 90% dzieci kontynuuje bez frustracji
- Znaczenie: Wskaźnik pozytywności feedbacku i UX

6.2.3 Czas Setup dla Rodziców
- Definicja: Średni czas od wejścia na stronę do rozpoczęcia pierwszej sesji gry
- Target: < 2 minuty
- Metoda pomiaru: Time tracking w analytics (od page load /register do pierwszego pytania w /game)
- Znaczenie: Wskaźnik friction w onboardingu

6.2.4 Satysfakcja Rodziców
- Definicja: Net Promoter Score (NPS) lub basic satisfaction rating
- Metoda pomiaru: Prosty survey po 1 tygodniu użytkowania
- Target: > 7/10 satisfaction rating
- Pytanie: "Czy poleciłbyś tę aplikację innym rodzicom? (1-10)"
- Znaczenie: Wskaźnik word-of-mouth potential

6.2.5 Percepcja Bezpieczeństwa Danych
- Definicja: Czy rodzice czują się komfortowo z polityką prywatności
- Metoda pomiaru: Survey question: "Czy czujesz, że dane Twojego dziecka są bezpieczne?"
- Target: > 80% odpowiedzi "Tak"
- Znaczenie: Trust i willingness to continue using

### 6.3 Metryki techniczne

6.3.1 Cross-browser Compatibility
- Definicja: Brak critical bugs na głównych przeglądarkach
- Scope: Chrome, Safari, Firefox (desktop + mobile, ostatnie 2 wersje)
- Metoda pomiaru: Manual testing checklist
- Target: 100% core functionality działa na wszystkich przeglądarkach
- Znaczenie: Accessibility produktu

6.3.2 Mobile Responsiveness
- Definicja: Poprawne wyświetlanie na urządzeniach mobile
- Scope: iPhone SE (375px), iPhone 12 (390px), Samsung Galaxy (360px), Tablet (768px)
- Metoda pomiaru: Manual testing + automated responsive testing
- Target: Perfect layout na wszystkich testowanych urządzeniach
- Znaczenie: Primary platform dla dzieci (tablety, telefony rodziców)

6.3.3 Database Performance
- Definicja: Czas wykonania queries dla core operations
- Queries:
  - Fetch 10 pytań: < 500ms
  - UPSERT postępu: < 200ms
  - Fetch tracker postępu: < 300ms
- Metoda pomiaru: Database query logging w Supabase
- Znaczenie: Smooth UX bez lagów

6.3.4 Image Optimization
- Definicja: Rozmiar obrazków i czas ładowania
- Target: Średni rozmiar obrazka < 50KB
- Total storage: 250 obrazków × 50KB = ~12.5MB (w ramach free tier 1GB)
- Metoda pomiaru: Manual check rozmiarów plików przed upload
- Znaczenie: Szybkie ładowanie, oszczędność bandwidth

### 6.4 Business/Growth Metrics (Post-MVP)

6.4.1 Referral Rate
- Definicja: Procent użytkowników polecających aplikację innym
- Metoda pomiaru: Tracking referral codes (future feature)
- Target dla v1.1: 15% użytkowników poleca przynajmniej jednej osobie
- Znaczenie: Organic growth potential

6.4.2 Average Session Duration
- Definicja: Średni czas spędzony w aplikacji na sesję
- Target: 5-10 minut (1 sesja = 10 pytań + navigation)
- Metoda pomiaru: Analytics tracking
- Znaczenie: Engagement level i attention span

6.4.3 Category Completion Rate
- Definicja: Procent użytkowników opanowujących całą kategorię (50/50)
- Target dla v1.1: 20% użytkowników ukończy przynajmniej 1 kategorię w pierwszym miesiącu
- Metoda pomiaru: Query user_progress
- Znaczenie: Deep engagement i value delivery

### 6.5 Monitoring i reporting

6.5.1 Dashboard metryk (Post-MVP)
- Real-time view podstawowych KPI
- Weekly reports dla User Acquisition, Engagement, Retention
- Automated alerts dla critical metrics (np. Error Rate > 5%)

6.5.2 Narzędzia
- Supabase Dashboard: Database queries, user counts
- Vercel Analytics: Page views, performance
- Lighthouse CI: Automated performance testing
- Opcjonalnie: Google Analytics / Plausible dla advanced tracking
- Opcjonalnie: Sentry dla error monitoring

6.5.3 Częstotliwość review
- Daily: Error Rate, Critical bugs
- Weekly: User Acquisition, Engagement, Technical Performance
- Monthly: Retention, Completion Rate, Qualitative feedback
- Post-user testing: Qualitative metrics (usability, satisfaction)

### 6.6 Success criteria dla MVP launch

MVP uznawany za sukces jeśli w pierwszym miesiącu:
1. 20+ zarejestrowanych rodzin (User Acquisition)
2. Średnio 15+ opanowanych słów na dziecko w pierwszym tygodniu (Engagement)
3. 40%+ D1 Retention
4. 0 critical bugs (Technical)
5. < 2s LCP (Performance)
6. 80%+ dzieci potrafi korzystać samodzielnie (Usability - post user testing)

Jeśli którykolwiek z powyższych kryteriów nie jest spełniony, priorytetyzacja fixów w v1.1 zgodnie z impact/effort matrix.