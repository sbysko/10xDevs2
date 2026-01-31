# Plan implementacji widoków autentykacji

## 1. Przegląd

Widoki autentykacji stanowią punkt wejścia do aplikacji dla rodziców. Umożliwiają rejestrację, logowanie oraz zarządzanie sesją. Wszystkie chroniące trasy wymagają autentykacji JWT poprzez Supabase Auth.

## 2. Routing widoków

- **Ścieżka logowania:** `/login`
- **Ścieżka rejestracji:** `/register`
- **Ścieżka wylogowania:** `/logout` (API endpoint)
- **Typ renderowania:** Hybrid (SSR dla bezpieczeństwa)

## 3. Struktura komponentów

```
LoginPage (Astro)
└── LoginForm (React Island)
    ├── EmailInput (Shadcn Input)
    ├── PasswordInput (Shadcn Input)
    └── SubmitButton (Shadcn Button)

RegisterPage (Astro)
└── RegisterForm (React Island)
    ├── EmailInput (Shadcn Input)
    ├── PasswordInput (Shadcn Input)
    ├── ConfirmPasswordInput (Shadcn Input)
    └── SubmitButton (Shadcn Button)

AuthMiddleware (Middleware)
└── Protected routes check
```

## 4. Szczegóły komponentów

### LoginForm (React Component)

**Opis:** Formularz logowania rodzica

**Główne elementy:**
- Input email (validation: format email)
- Input password (type: password)
- Przycisk "Zaloguj się"
- Link do strony rejestracji
- Komunikaty błędów

**Obsługiwane interakcje:**
- Submit → Wywołanie `supabase.auth.signInWithPassword()`
- Success → Redirect do `/profiles`
- Error → Wyświetlenie komunikatu

**Typy:**
```typescript
interface LoginFormData {
  email: string;
  password: string;
}

interface AuthError {
  message: string;
  field?: 'email' | 'password';
}
```

### RegisterForm (React Component)

**Opis:** Formularz rejestracji rodzica

**Główne elementy:**
- Input email
- Input password (min 8 znaków)
- Input confirm password
- Przycisk "Zarejestruj się"
- Link do strony logowania
- Checkbox akceptacji regulaminu (optional for MVP)

**Obsługiwane interakcje:**
- Submit → Walidacja → `supabase.auth.signUp()`
- Success → Redirect do `/profiles` (auto-login) lub `/login` (z komunikatem o potwierdzeniu email)
- Error → Wyświetlenie komunikatu

**Walidacja:**
- Email: format, unikalność (backend)
- Password: min 8 znaków, match z confirm password
- Confirm password: musi być identyczne z password

**Typy:**
```typescript
interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}
```

## 5. Middleware ochrony tras

### Protected Routes

**Zadania:**
- Sprawdzenie sesji użytkownika w każdym request
- Przekierowanie niezalogowanych użytkowników
- Przekierowanie zalogowanych z `/login` do `/profiles`

**Logika:**
```typescript
// Trasy publiczne (bez autentykacji)
const PUBLIC_ROUTES = ['/login', '/register'];

// Trasy chronione (wymagają autentykacji)
const PROTECTED_ROUTES = ['/profiles', '/game/*', '/progress'];

// Middleware flow:
1. Pobierz aktualny URL
2. Jeśli PUBLIC_ROUTE → sprawdź czy zalogowany → redirect do /profiles
3. Jeśli PROTECTED_ROUTE → sprawdź czy zalogowany → jeśli nie, redirect do /login
4. Continue
```

**Implementacja:**
- Rozszerzenie istniejącego middleware w `src/middleware/index.ts`
- Użycie `supabase.auth.getSession()` do sprawdzenia sesji
- Cookie-based session management (już zaimplementowane)

## 6. API Endpoints

### POST /api/auth/logout

**Opis:** Endpoint wylogowania

**Request:** Brak body (session z cookie)

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Logika:**
```typescript
1. Wywołaj supabase.auth.signOut()
2. Usuń cookie sesji
3. Zwróć sukces
```

## 7. Integracja z Supabase Auth

### Metody wykorzystywane:

1. **Rejestracja:**
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'parent@example.com',
  password: 'password123'
});
```

2. **Logowanie:**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'parent@example.com',
  password: 'password123'
});
```

3. **Wylogowanie:**
```typescript
const { error } = await supabase.auth.signOut();
```

4. **Sprawdzenie sesji:**
```typescript
const { data: { session } } = await supabase.auth.getSession();
```

5. **Pobierz aktualnego użytkownika:**
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

## 8. Interakcje użytkownika

### Flow rejestracji:

1. Użytkownik wchodzi na `/register`
2. Wypełnia formularz (email, password, confirm password)
3. Klika "Zarejestruj się"
4. Walidacja client-side (format, match passwords)
5. Wywołanie API Supabase
6. **Opcja A (email confirmation disabled):**
   - Auto-login → Redirect do `/profiles`
7. **Opcja B (email confirmation enabled):**
   - Komunikat "Sprawdź email" → Redirect do `/login`

### Flow logowania:

1. Użytkownik wchodzi na `/login`
2. Wypełnia formularz (email, password)
3. Klika "Zaloguj się"
4. Wywołanie API Supabase
5. Success → Redirect do `/profiles`
6. Error → Komunikat błędu (nieprawidłowe dane)

### Flow wylogowania:

1. Użytkownik klika przycisk "Wyloguj" (w menu/header)
2. Wywołanie `/api/auth/logout`
3. Usuń sesję
4. Redirect do `/login`

### Flow protected route:

1. Użytkownik próbuje wejść na `/profiles` (lub inną chronioną trasę)
2. Middleware sprawdza sesję
3. **Jeśli zalogowany:** Continue
4. **Jeśli niezalogowany:** Redirect do `/login?redirect=/profiles`
5. Po zalogowaniu → Redirect do oryginalnej trasy

## 9. Walidacja i obsługa błędów

### Client-side validation:

**Email:**
- Format: regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Komunikat: "Wprowadź poprawny adres email"

**Password:**
- Min length: 8 znaków
- Komunikat: "Hasło musi mieć minimum 8 znaków"

**Confirm password:**
- Match z password
- Komunikat: "Hasła nie są identyczne"

### Server-side errors (z Supabase):

**Rejestracja:**
- `User already registered` → "Ten email jest już zarejestrowany"
- `Invalid email` → "Nieprawidłowy format email"
- `Password too short` → "Hasło musi mieć minimum 8 znaków"

**Logowanie:**
- `Invalid login credentials` → "Nieprawidłowy email lub hasło"
- `Email not confirmed` → "Potwierdź swój adres email"
- `Too many requests` → "Zbyt wiele prób logowania. Spróbuj ponownie za chwilę"

### Wyświetlanie błędów:

- Alert/Toast dla błędów ogólnych
- Inline error pod inputem dla błędów specyficznych dla pola
- Czerwony border dla inputów z błędem

## 10. Kroki implementacji

### Krok 1: Aktualizacja middleware (ochrona tras)

**Plik:** `src/middleware/index.ts`

**Zadania:**
1. Dodać listę tras publicznych i chronionych
2. Implementować logikę sprawdzania sesji
3. Dodać przekierowania dla niezalogowanych/zalogowanych
4. Obsłużyć query param `redirect`

### Krok 2: Komponent LoginForm

**Plik:** `src/components/LoginForm.tsx`

**Zadania:**
1. Utworzyć formularz z email + password
2. Walidacja client-side
3. Integracja z Supabase Auth
4. Obsługa błędów
5. Redirect po sukcesie

### Krok 3: Strona logowania

**Plik:** `src/pages/login.astro`

**Zadania:**
1. Hybrid rendering (`prerender = false`)
2. Sprawdzić sesję server-side → jeśli zalogowany, redirect do `/profiles`
3. React Island: `<LoginForm client:load />`
4. Layout z gradientowym tłem (spójny z resztą app)

### Krok 4: Komponent RegisterForm

**Plik:** `src/components/RegisterForm.tsx`

**Zadania:**
1. Formularz z email + password + confirm password
2. Walidacja (match passwords, min length)
3. Integracja z Supabase Auth (signUp)
4. Obsługa błędów
5. Redirect po sukcesie

### Krok 5: Strona rejestracji

**Plik:** `src/pages/register.astro`

**Zadania:**
1. Hybrid rendering
2. Sprawdzić sesję → jeśli zalogowany, redirect
3. React Island: `<RegisterForm client:load />`
4. Layout spójny z `/login`

### Krok 6: API endpoint wylogowania

**Plik:** `src/pages/api/auth/logout.ts`

**Zadania:**
1. Endpoint POST
2. Wywołać `supabase.auth.signOut()`
3. Usunąć cookie sesji
4. Zwrócić success response

### Krok 7: Dodanie przycisku wylogowania

**Opcja A:** Osobny komponent Header/Navigation

**Plik:** `src/components/AppHeader.tsx`

**Zadania:**
1. Wyświetlić email zalogowanego użytkownika
2. Przycisk "Wyloguj"
3. Wywołanie `/api/auth/logout`
4. Redirect do `/login`

**Opcja B:** Dodać do istniejących stron

- Dodać przycisk wylogowania w `ProfileHeader.tsx`
- Widoczny na wszystkich chronionychstronach

### Krok 8: Testowanie przepływów

**Scenariusze:**
1. Rejestracja nowego użytkownika → auto-login → `/profiles`
2. Logowanie istniejącego użytkownika → `/profiles`
3. Błędne hasło → komunikat błędu
4. Próba wejścia na `/game/categories` bez logowania → redirect `/login`
5. Wejście na `/login` gdy zalogowany → redirect `/profiles`
6. Wylogowanie → redirect `/login`
7. Próba ponownego wejścia na chronioną trasę → redirect `/login`

## 11. Konfiguracja Supabase Auth

### Ustawienia w Supabase Dashboard:

1. **Email confirmation:** Disabled dla MVP (auto-login po rejestracji)
2. **Password requirements:** Min 8 znaków
3. **Session duration:** 7 dni (default)
4. **Email templates:** Użyć domyślnych (confirmation, reset password)

### Environment variables:

Już skonfigurowane w `.env`:
```env
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 12. Zgodność z zasadami implementacji

### Astro:
- ✅ Hybrid rendering (`prerender = false`)
- ✅ Server-side session check
- ✅ Middleware dla ochrony tras

### React:
- ✅ Functional components
- ✅ Custom hooks (useAuth)
- ✅ Proper form handling

### TypeScript:
- ✅ Pełne typowanie (FormData, AuthError)
- ✅ Snake_case dla API/DB

### Tailwind:
- ✅ Utility classes
- ✅ Responsive design
- ✅ Spójny gradient background

### Shadcn/UI:
- ✅ Input component
- ✅ Button component
- ✅ Label component
- ✅ Alert/Toast dla komunikatów

### Accessibility:
- ✅ Label dla wszystkich inputs
- ✅ Aria-label gdzie potrzeba
- ✅ Keyboard navigation
- ✅ Focus states

## 13. Security best practices

1. **Password handling:**
   - Nigdy nie logować haseł
   - Używać type="password" dla inputów
   - Supabase automatycznie hashuje hasła

2. **Session management:**
   - Cookie-based (już zaimplementowane)
   - Secure, HttpOnly cookies
   - Auto-refresh token

3. **CSRF protection:**
   - Supabase Auth ma wbudowaną ochronę

4. **Rate limiting:**
   - Supabase ma wbudowane rate limiting dla auth endpoints

5. **Input validation:**
   - Client-side + server-side (Supabase)
   - Sanitizacja przed zapisem

## 14. Nice-to-have (poza MVP)

- "Zapamiętaj mnie" checkbox
- Social login (Google, Facebook)
- Password reset flow
- Email change flow
- 2FA (Two-factor authentication)
- Account deletion
- Password strength meter
- Show/hide password toggle

---

**Status:** 📝 Plan gotowy do implementacji
**Następny krok:** Krok 1 - Aktualizacja middleware
