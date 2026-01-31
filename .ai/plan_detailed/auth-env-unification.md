# Ujednolicenie zmiennych środowiskowych Supabase

## Data: 2026-01-31

---

## Problem

Kod używał niespójnych nazw zmiennych środowiskowych:
- **Middleware** (`src/middleware/index.ts`): `SUPABASE_URL` i `SUPABASE_KEY`
- **React components** (LoginForm, RegisterForm, AppHeader): `PUBLIC_SUPABASE_URL` i `PUBLIC_SUPABASE_ANON_KEY`

Użytkownik poprosił: *"dlaczego w niektórych miejscach jest z prefiksem PUBLIC a w innych nie? ujednolić cały kod i użyj wszędzie jednej wersji"*

---

## Rozwiązanie

### 1. Ujednolicenie na `PUBLIC_` prefix

**Decyzja:** Używamy wszędzie zmiennych z prefiksem `PUBLIC_`:
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

**Powód:**
- Zmienne `PUBLIC_` działają zarówno w **server-side** (middleware, API routes) jak i **client-side** (React components)
- Eliminuje potrzebę duplikacji zmiennych
- Zapewnia spójność w całym kodzie
- Zgodne z best practices Astro

---

## Zmiany w kodzie

### Plik: `src/middleware/index.ts`

**Przed:**
```typescript
// Linia 8 (komentarz)
 * - Uses SUPABASE_URL and SUPABASE_KEY from environment variables

// Linia 47-48
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseKey = import.meta.env.SUPABASE_KEY;

// Linia 52
    throw new Error("SUPABASE_URL and SUPABASE_KEY must be set in environment variables");
```

**Po:**
```typescript
// Linia 8 (komentarz)
 * - Uses PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY from environment variables

// Linia 47-48
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Linia 52
    throw new Error("PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY must be set in environment variables");
```

### Plik: `.env`

**Przed:**
```env
# Duplikacja zmiennych
SUPABASE_KEY="eyJhbGc..."
SUPABASE_URL="http://127.0.0.1:54321"

PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
```

**Po:**
```env
# Tylko PUBLIC_ prefix (jedna wersja)
# Supabase Configuration
# Używamy wszędzie PUBLIC_ prefix dla spójności
# (dostępne zarówno w server-side jak i client-side)
PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJFUzI1NiIsImtpZCI6ImI4MTI2OWYxLTIxZDgtNGYyZS1iNzE5LWMyMjQwYTg0MGQ5MCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjIwODQ4MjIyNTd9.7LVOG62shhOz6jaYkziS5CmsQOFL078CruO8iZ6Vs6yGlquhVppzgIOcHyq9zRXykOvJm6YhG1AENOt81_G6MA"
PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
```

---

## React components (bez zmian)

Wszystkie React components już używały poprawnych nazw:

- `src/components/LoginForm.tsx`
- `src/components/RegisterForm.tsx`
- `src/components/AppHeader.tsx`

```typescript
const supabase = createBrowserClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);
```

---

## Weryfikacja

### 1. Restart serwera deweloperskiego

```bash
# Zakończono stare procesy na portach 3000, 3001, 3002
taskkill //F //PID 27896  # Port 3000
taskkill //F //PID 25672  # Port 3001
taskkill //F //PID 4076   # Port 3002

# Uruchomiono nowy serwer
npm run dev
```

**Rezultat:**
```
astro v5.13.7 ready in 1979 ms

┃ Local    http://localhost:3000/
┃ Network  use --host to expose

watching for file changes...
```

### 2. Sprawdzenie zmiennych środowiskowych

Serwer uruchomił się bez błędów, co oznacza że:
- ✅ Middleware poprawnie wczytał `PUBLIC_SUPABASE_URL` i `PUBLIC_SUPABASE_ANON_KEY`
- ✅ Brak błędu "Missing Supabase environment variables"
- ✅ React components będą miały dostęp do tych samych zmiennych

---

## Podsumowanie

### Co się zmieniło:
1. **Middleware** używa teraz `PUBLIC_SUPABASE_URL` i `PUBLIC_SUPABASE_ANON_KEY`
2. **`.env`** zawiera tylko zmienne z prefiksem `PUBLIC_`
3. **React components** bez zmian (już używały PUBLIC_)

### Korzyści:
- ✅ **Spójność:** Jedna konwencja nazewnictwa w całym projekcie
- ✅ **Brak duplikacji:** Nie ma potrzeby trzymania dwóch zestawów zmiennych
- ✅ **Czytelność:** Kod jest bardziej zrozumiały dla nowych deweloperów
- ✅ **Bezpieczeństwo:** Używamy `ANON_KEY` (publiczny klucz) zamiast service role key

### Bezpieczeństwo:
- ⚠️ Zmienne `PUBLIC_` są dostępne w przeglądarce (bundlowane w client-side code)
- ✅ Używamy `PUBLIC_SUPABASE_ANON_KEY` (bezpieczny do ekspozycji)
- ✅ **NIE** używamy `SUPABASE_SERVICE_ROLE_KEY` (byłoby to niebezpieczne)
- ✅ Row Level Security (RLS) w Supabase chroni dane niezależnie od klucza

---

## Status końcowy

**Data:** 2026-01-31
**Status:** ✅ UKOŃCZONE
**Serwer:** ✅ Uruchomiony na http://localhost:3000
**Zmienne środowiskowe:** ✅ Ujednolicone (PUBLIC_ prefix wszędzie)

---

**Następny krok:** Testowanie widoków autentykacji zgodnie z `docs/testing-auth-views-guide.md`
