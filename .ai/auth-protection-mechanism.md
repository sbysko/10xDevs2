# Mechanizm Ochrony Authentykacji - Dokumentacja

## Przegląd

Aplikacja wykorzystuje **uniwersalny mechanizm ochrony** oparty na middleware Astro oraz Supabase Auth z SSR (`@supabase/ssr`). Mechanizm zapewnia:

- ✅ Ochronę wszystkich tras przed nieautoryzowanym dostępem
- ✅ Automatyczne przekierowania użytkowników (zalogowanych/niezalogowanych)
- ✅ Właściwe zarządzanie sesjami przez cookies (getAll/setAll)
- ✅ Walidację JWT na każdym żądaniu (auth.getUser())
- ✅ **Cache-Control headers** zapobiegające problemowi "przycisku Wstecz"
- ✅ Zgodność z najlepszymi praktykami Supabase SSR

## Architektura

### 1. Middleware (`src/middleware/index.ts`)

Middleware działa jako **centralny punkt kontroli** dla wszystkich żądań HTTP:

```typescript
export const onRequest = defineMiddleware(async (context, next) => {
  // 1. Tworzenie Supabase client z getAll/setAll
  // 2. Walidacja JWT przez auth.getUser()
  // 3. Logika przekierowań
  // 4. Kontynuacja do następnego handlera
});
```

#### Kluczowe funkcje:

**a) Właściwe zarządzanie cookies (KRYTYCZNE!)**
```typescript
const supabase = createServerClient(supabaseUrl, supabaseKey, {
  cookies: {
    getAll() {
      return parseCookieHeader(context.request.headers.get("Cookie") ?? "");
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) => {
        context.cookies.set(name, value, options);
      });
    },
  },
});
```

**UWAGA:** NIE używamy `get()`, `set()`, `remove()` - tylko `getAll()` i `setAll()` zgodnie z wymaganiami `@supabase/ssr`.

**b) Walidacja JWT**
```typescript
const { data: { user }, error } = await supabase.auth.getUser();
```

**UWAGA:** NIE używamy `getSession()` - zawsze `getUser()`, który waliduje JWT na serwerze i zapobiega atakom z fałszywymi tokenami.

**c) Przechowywanie użytkownika w context.locals**
```typescript
if (user) {
  context.locals.user = {
    id: user.id,
    email: user.email || "",
  };
}
```

### 2. Konfiguracja Ścieżek

#### Public Paths (dostępne bez logowania)
```typescript
const PUBLIC_PATHS = [
  "/",                           // Landing page
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/api/auth/*",                 // Auth API endpoints
];
```

#### Auth Pages (przekierowanie zalogowanych do /profiles)
```typescript
const AUTH_PAGES = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password"
];
```

### 3. Logika Przekierowań

**Case 1: Zalogowany użytkownik próbuje wejść na stronę auth**
```typescript
if (user && AUTH_PAGES.includes(pathname)) {
  return context.redirect("/profiles");
}
```
Przykład: Użytkownik zalogowany wchodzi na `/auth/login` → przekierowanie do `/profiles`

**Case 2: Niezalogowany użytkownik próbuje wejść na chronioną stronę**
```typescript
if (!user && !isPublic) {
  const redirectUrl = new URL("/auth/login", context.url.origin);
  if (pathname !== "/") {
    redirectUrl.searchParams.set("redirect", pathname);
  }
  return context.redirect(redirectUrl.toString());
}
```
Przykład: Niezalogowany wchodzi na `/profiles` → przekierowanie do `/auth/login?redirect=/profiles`

**Case 3: Zalogowany użytkownik wchodzi na stronę główną**
```astro
---
// src/pages/index.astro
const user = Astro.locals.user;

if (user) {
  return Astro.redirect("/profiles");
}
---
```
Przykład: Zalogowany wchodzi na `/` → przekierowanie do `/profiles`

### 4. Cache Control (Fix przycisku "Wstecz")

**Problem:** Po zalogowaniu, kliknięcie przycisku "Wstecz" w przeglądarce pokazuje cache'owaną stronę logowania.

**Rozwiązanie:** Middleware dodaje nagłówki HTTP zapobiegające cache'owaniu stron auth:

```typescript
if (AUTH_PAGES.includes(pathname) || pathname.startsWith("/auth/")) {
  const response = await next();
  const newResponse = new Response(response.body, response);

  // Prevent browser caching
  newResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  newResponse.headers.set("Pragma", "no-cache");
  newResponse.headers.set("Expires", "0");

  return newResponse;
}
```

**Efekt:**
- ❌ **Przed:** Przycisk "Wstecz" pokazuje starą stronę logowania (z cache)
- ✅ **Po:** Przycisk "Wstecz" wymusza nowe żądanie → middleware przekierowuje do `/profiles`

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         HTTP Request                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Middleware (index.ts)                         │
│  1. Tworzy Supabase client (getAll/setAll)                      │
│  2. Waliduje JWT (auth.getUser())                               │
│  3. Zapisuje user w context.locals                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
             ┌──────▼──────┐    ┌──────▼──────┐
             │ Authenticated│    │ Unauthenticated│
             └──────┬──────┘    └──────┬──────┘
                    │                   │
        ┌───────────┼───────────┐      │
        │           │           │      │
   ┌────▼────┐ ┌───▼────┐ ┌───▼────┐ │
   │   /     │ │/auth/* │ │/profiles│ │
   │Landing  │ │Auth    │ │Protected│ │
   └────┬────┘ └───┬────┘ └───┬────┘ │
        │          │          │      │
        │    Redirect to      │      │
        │    /profiles        │      │
        │          │          │      │
        └──────────┴──────────▼──────┘
                              │
                    Continue to page
```

## Testowanie Mechanizmu

### Test 1: Dostęp do strony publicznej (niezalogowany)
```bash
# Otwórz przeglądarkę w trybie incognito
http://localhost:3000/

# Oczekiwany wynik: Wyświetla stronę powitalną
```

### Test 2: Dostęp do chronionej strony (niezalogowany)
```bash
# Otwórz przeglądarkę w trybie incognito
http://localhost:3000/profiles

# Oczekiwany wynik: Przekierowanie do /auth/login?redirect=/profiles
```

### Test 3: Logowanie i przekierowanie
```bash
# 1. Zaloguj się na /auth/login
# 2. Po logowaniu: przekierowanie do /profiles
```

### Test 4: Próba dostępu do strony auth (zalogowany)
```bash
# 1. Zaloguj się
# 2. Wejdź na http://localhost:3000/auth/login

# Oczekiwany wynik: Przekierowanie do /profiles
```

### Test 5: Wylogowanie
```bash
# 1. Zaloguj się
# 2. Kliknij "Wyloguj" w AppHeader
# 3. Oczekiwany wynik: Przekierowanie do /auth/login
```

### Test 6: Dostęp do strony głównej (zalogowany)
```bash
# 1. Zaloguj się
# 2. Wejdź na http://localhost:3000/

# Oczekiwany wynik: Przekierowanie do /profiles
```

## Rollback Plan

Jeśli mechanizm ochrony powoduje problemy, można go wyłączyć/przywrócić starą wersję:

### Opcja 1: Wyłączenie ochrony strony głównej
```astro
---
// src/pages/index.astro
// ZAKOMENTUJ te linie:
// const user = Astro.locals.user;
// if (user) {
//   return Astro.redirect("/profiles");
// }
---
```

### Opcja 2: Revert middleware do poprzedniej wersji
```bash
git diff src/middleware/index.ts
git checkout HEAD~1 -- src/middleware/index.ts
```

### Opcja 3: Dodanie ścieżki do PUBLIC_PATHS (tymczasowe wyłączenie ochrony)
```typescript
// src/middleware/index.ts
const PUBLIC_PATHS = [
  "/",
  "/profiles",  // Tymczasowo publiczne
  // ...
];
```

## Najlepsze Praktyki

### ✅ DO:
- Używaj `getAll()` i `setAll()` dla cookies
- Używaj `auth.getUser()` do walidacji JWT
- Dodawaj komentarze do logiki przekierowań
- Testuj wszystkie flow przed deploym
- Przechowuj user w `context.locals`

### ❌ DON'T:
- NIE używaj `get()`, `set()`, `remove()` dla cookies
- NIE używaj `getSession()` - tylko `getUser()`
- NIE importuj Supabase client bezpośrednio w route'ach
- NIE modyfikuj cookie handling bez konsultacji z dokumentacją `@supabase/ssr`
- NIE pomijaj walidacji JWT w middleware

## Bezpieczeństwo

### Zabezpieczenia wbudowane:
1. **JWT Validation:** Każde żądanie waliduje JWT przez `auth.getUser()`
2. **Cookie Security:** httpOnly, secure, sameSite=lax
3. **CSRF Protection:** sameSite cookies
4. **Session Refresh:** Automatyczne odświeżanie tokenu przez `@supabase/ssr`
5. **RLS (Row Level Security):** Polityki bezpieczeństwa na poziomie bazy danych

### Potencjalne zagrożenia i mitigation:
| Zagrożenie | Mitigation |
|------------|-----------|
| Sfałszowany JWT | `auth.getUser()` waliduje token na serwerze |
| Cookie theft | httpOnly=true (brak dostępu przez JS) |
| CSRF | sameSite=lax + httpOnly |
| XSS | React automatic escaping + CSP headers |
| Session fixation | Supabase automatycznie rotuje tokeny |

## Zgodność z PRD

Mechanizm ochrony jest zgodny z wymogami z `prd.md`:

- ✅ **Autoryzacja rodzica:** RLS policies w bazie danych (`parent_id = auth.uid()`)
- ✅ **Middleware auth:** Implementacja w `src/middleware/index.ts`
- ✅ **Ochrona wszystkich route:** Wszystkie ścieżki poza PUBLIC_PATHS wymagają logowania
- ✅ **GDPR/COPPA compliance:** Minimalna kolekcja danych, tylko email rodzica

## Dodatkowe Zasoby

- [Supabase SSR Documentation](https://supabase.com/docs/guides/auth/server-side-rendering)
- [Astro Middleware Guide](https://docs.astro.build/en/guides/middleware/)
- [.cursor/rules/supabase-auth.mdc](.cursor/rules/supabase-auth.mdc) - Wewnętrzne wytyczne projektu
