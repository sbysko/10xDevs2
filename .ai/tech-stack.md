# Stack Technologiczny - Dopasuj Obrazek do Słowa

## 1. Architektura Frontend (Interfejs i Logika)

Wybrany zestaw narzędzi koncentruje się na szybkości renderowania oraz responsywności, co jest kluczowe dla użytkowników w wieku 4-6 lat.

| Komponent | Technologia | Zastosowanie |
| --- | --- | --- |
| **Główny Framework** | **Astro 5** | Obsługa routingu i Hybrid Rendering (SSR dla uwierzytelniania, CSR dla gry). |
| **Biblioteka UI** | **React 19** | Zarządzanie stanem interaktywnej sesji gry oraz dynamicznymi komponentami. |
| **Język** | **TypeScript 5** | Zapewnienie bezpieczeństwa typów i minimalizacja błędów w logice gry. |
| **Stylizacja** | **Tailwind CSS 4** | Szybkie budowanie responsywnych układów (Mobile-first). |
| **Komponenty UI** | **Shadcn/UI** | Gotowe, dostępne (WCAG) komponenty takie jak przyciski, karty i modale. |

### Dlaczego Astro 5?

* **Performance:** Dzięki architekturze "Islands" tylko interaktywne części gry pobierają JavaScript, co pozwala na osiągnięcie LCP < 2s.
* **Hybrydowość:** Pozwala na serwerowe renderowanie (SSR) stron profilu rodzica, co zwiększa bezpieczeństwo danych.

---

## 2. Backend i Infrastruktura (Baza danych i Logika)

Wykorzystanie modelu Backend-as-a-Service (BaaS) pozwala na realizację projektu w założonym czasie 7-14 godzin.

* **Baza danych (PostgreSQL):** Przechowywanie 250 rekordów słownictwa, profili dzieci oraz ich postępów (`user_progress`).
* **Uwierzytelnianie (Supabase Auth):** Zarządzanie kontem rodzica (email/hasło) oraz integracja z `@supabase/auth-ui-react` dla szybkiego wdrożenia formularzy.
* **Przechowywanie plików (Supabase Storage):** Hosting dla 250 zoptymalizowanych obrazków PNG generowanych przez AI.
* **Bezpieczeństwo (RLS):** Row Level Security zapewnia, że rodzic ma dostęp wyłącznie do danych swoich dzieci.

---

## 3. Deployment i Narzędzia Deweloperskie

| Obszar | Narzędzie | Cel |
| --- | --- | --- |
| **Hosting** | **Vercel** | Optymalny deployment dla Astro z automatycznym wsparciem dla funkcji Edge. |
| **Generowanie treści** | **Google Imagen/Banana** | Tworzenie spójnych wizualnie ilustracji dla dzieci w wieku przedszkolnym. |
| **Analityka** | **Vercel Analytics** | Monitorowanie wydajności i podstawowych metryk zaangażowania. |

---

## 4. Uzasadnienie Wyboru (Business Value)

* **Niskie koszty (Free Tier):** Całość rozwiązania mieści się w darmowych planach Supabase i Vercel przy zakładanym starcie dla 20+ rodzin.
* **Skalowalność:** Wybrany stack pozwala na łatwe dodanie narracji głosowej lub nowych wersji językowych w wersji 1.1+ bez zmiany architektury.
* **Mobile-First:** Tailwind CSS 4 i Shadcn zapewniają, że elementy interaktywne (min. 80x80px) będą idealnie dopasowane do małych rączek dzieci.

---

## 5. Struktura Danych (Kluczowe Tabele)

1. **`profiles`**: Przechowuje `display_name`, `avatar_url` oraz `total_stars` dla każdego dziecka.
2. **`vocabulary`**: Centralna baza 250 słów podzielona na 5 kategorii.
3. **`user_progress`**: Tabela łącząca, śledząca opanowanie konkretnych słów przez dane dziecko.

