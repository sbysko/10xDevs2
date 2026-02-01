# Plan Testów projektu: 10xDevs2

---

## 1. Wprowadzenie i cele testowania

Niniejszy plan testów dotyczy aplikacji edukacyjnej "Dopasuj Obrazek do Słowa", skierowanej do dzieci w wieku 4-6 lat. Głównym celem testowania jest zapewnienie wysokiej jakości interakcji, bezpieczeństwa danych użytkowników oraz płynności działania na urządzeniach mobilnych, zgodnie z założeniami architektury **Astro 5** i **Supabase**.

**Cele szczegółowe:**

* Weryfikacja poprawności logiki gry (mechanizm dopasowywania).
* Zapewnienie bezpieczeństwa danych (mechanizmy RLS w Supabase).
* Potwierdzenie wydajności (LCP < 2s) na słabszych urządzeniach.
* Sprawdzenie dostępności i użyteczności interfejsu dla dzieci (UX/UI).

## 2. Zakres testów

### Wchodzi w zakres:

* **Moduł Gry:** Mechanizm losowania słów, walidacja odpowiedzi, naliczanie gwiazdek.
* **Panel Rodzica:** Rejestracja/logowanie, tworzenie profili dzieci, przegląd postępów.
* **Integracja z Backendem:** Prawidłowość zapisów w PostgreSQL, pobieranie obrazów z Supabase Storage.
* **Warstwa wizualna:** Responsywność (Mobile-first), dostępność komponentów Shadcn/UI.

### Poza zakresem:

* Testy obciążeniowe powyżej 1000 jednoczesnych użytkowników (projekt zakłada start dla 20+ rodzin).
* Testy generatora obrazów AI (walidacja procesu generowania po stronie backendu – testujemy jedynie efekt końcowy).

## 3. Typy testów do przeprowadzenia

1. **Testy Jednostkowe (Unit Tests):** Weryfikacja czystych funkcji logicznych (np. obliczanie punktów, formatowanie danych).
2. **Testy Integracyjne:** Sprawdzenie komunikacji między komponentami React a bazą Supabase.
3. **Testy End-to-End (E2E):** Pełne ścieżki użytkownika (np. od logowania rodzica do zakończenia sesji gry przez dziecko).
4. **Testy Użyteczności (Usability):** Testy "małych rączek" – weryfikacja czy elementy interaktywne są wystarczająco duże (min. 80x80px).
5. **Testy Bezpieczeństwa:** Weryfikacja polityk Row Level Security (RLS).
6. **Testy Wydajnościowe:** Pomiary Core Web Vitals przy użyciu Lighthouse.

## 4. Scenariusze testowe dla kluczowych funkcjonalności

| ID | Scenariusz | Oczekiwany rezultat |
| --- | --- | --- |
| **ST-01** | Dopasowanie poprawnego obrazka do słowa | System dodaje gwiazdkę do tabeli `profiles`, wyświetla animację sukcesu. |
| **ST-02** | Próba dopasowania błędnego obrazka | System blokuje możliwość dopasowania, nie odejmuje punktów (przyjazny UX), zachęca do kolejnej próby. |
| **ST-03** | Dostęp rodzica do danych dziecka | Rodzic A nie może zobaczyć postępów dziecka przypisanego do Rodzica B (RLS Test). |
| **ST-04** | Ładowanie obrazów przy słabym łączu | Obrazy z Supabase Storage posiadają placeholder, a gra nie blokuje się podczas ładowania. |
| **ST-05** | Rejestracja nowego profilu dziecka | Nowy rekord pojawia się w tabeli `profiles`, a `user_progress` zostaje zainicjalizowany. |

## 5. Środowisko testowe

* **Local:** Środowisko deweloperskie (Node.js, Docker dla lokalnego Supabase).
* **Staging:** Vercel Preview Deployments (testowanie każdej gałęzi Git).
* **Production:** Środowisko docelowe na Vercel z podpiętą produkcyjną bazą Supabase.
* **Urządzenia:** Tablety (iPad, Samsung Galaxy Tab), smartfony (iOS/Android) oraz laptopy z ekranem dotykowym.

## 6. Narzędzia do testowania

* **Vitest:** Testy jednostkowe i integracyjne (szybkość dopasowana do Astro).
* **Playwright:** Testy E2E oraz testy wizualne (Visual Regression).
* **Supabase CLI:** Testowanie polityk RLS i lokalna baza danych.
* **Google Lighthouse:** Audyty wydajności i dostępności (WCAG).
* **Axe-core:** Automatyczne testy dostępności wbudowane w komponenty Shadcn.

## 7. Harmonogram testów

* **Faza 1 (Godzina 2-4):** Testy jednostkowe logiki bazy danych i modeli TS.
* **Faza 2 (Godzina 6-10):** Testy integracyjne UI z Supabase Auth i Storage.
* **Faza 3 (Godzina 11-12):** Testy E2E kluczowych ścieżek krytycznych.
* **Faza 4 (Godzina 13-14):** Testy akceptacyjne (UAT) i optymalizacja wydajności przed wdrożeniem.

## 8. Kryteria akceptacji testów

* 100% testów E2E dla ścieżki krytycznej (logowanie -> gra -> postęp) kończy się sukcesem.
* Brak błędów krytycznych (Critical) i wysokich (High) w raporcie błędów.
* Wskaźnik Performance w Lighthouse > 90 dla urządzeń mobilnych.
* Potwierdzone działanie RLS – brak wycieku danych między kontami.

## 9. Role i odpowiedzialności

* **Lead Developer / QA:** Konfiguracja środowiska testowego, pisanie testów integracyjnych i E2E.
* **Developer:** Pisanie testów jednostkowych (Unit Tests) dla dostarczanych funkcji.
* **Product Owner (Rodzic/Tester):** Testy akceptacyjne pod kątem merytorycznym i wizualnym (czy obrazki AI są zrozumiałe dla dzieci).

## 10. Procedury raportowania błędów

Każdy błąd powinien zostać zgłoszony w systemie kontroli wersji (np. GitHub Issues) i zawierać:

1. **Tytuł:** Zwięzły opis problemu.
2. **Kroki do reprodukcji:** Lista czynności prowadząca do błędu.
3. **Oczekiwany rezultat vs. Faktyczny rezultat.**
4. **Środowisko:** Przeglądarka, system operacyjny, typ urządzenia.
5. **Priorytet:** (Krytyczny, Wysoki, Średni, Niski).

