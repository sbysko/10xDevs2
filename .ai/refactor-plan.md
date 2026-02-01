# Plan Refaktoryzacji z React Hook Form

## 1. Analiza

### 1.1 Komponenty formularzy w projekcie

| Komponent | LOC | Pola | Walidacja | API Call |
|-----------|-----|------|-----------|----------|
| `RegisterForm.tsx` | 249 | 3 | Manualna (6 if-blocks) | `/api/auth/register` |
| `ResetPasswordForm.tsx` | 245 | 2 | Manualna (4 if-blocks) | `/api/auth/reset-password` |
| `ParentalGateModal.tsx` | 228 | 1 (numeric) | Prosta | Brak (local) |
| `LoginForm.tsx` | 216 | 2 | Manualna (4 if-blocks) | `/api/auth/login` |
| `ForgotPasswordForm.tsx` | 199 | 1 | Manualna (2 if-blocks) | `/api/auth/forgot-password` |
| `CreateProfileModal.tsx` | 296 | 2 | Zod (ręcznie) | `/api/profiles` |

### 1.2 Zidentyfikowane problemy

1. **Niespójność walidacji** - `CreateProfileModal` używa Zod, reszta ma manualną walidację
2. **Duplikacja kodu** - regex email powtórzony 4x, password validation 2x
3. **Rozproszone stany** - każdy formularz ma 3-5 `useState`
4. **Brak real-time validation** - walidacja tylko przy submit
5. **API boilerplate** - identyczny wzorzec fetch we wszystkich komponentach

### 1.3 Szczegółowa analiza komponentów

#### LoginForm.tsx (216 LOC)

**Obecna logika formularza:**
```typescript
// Linie 35-40: Ręczne zarządzanie stanem
const [formData, setFormData] = useState<LoginFormData>({...});
const [error, setError] = useState<AuthError | null>(null);
const [isLoading, setIsLoading] = useState(false);

// Linie 45-48: Manualna walidacja email
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Linie 67-89: Sekwencyjna walidacja (wiele if-statements)
if (!formData.email) { setError({...}); return; }
if (!validateEmail(formData.email)) { setError({...}); return; }
```

**Problemy:**
- Brak użycia Zod (niespójność z resztą projektu)
- Manualna walidacja z wieloma if-statements
- `handleChange` wymaga `useCallback` dla każdego pola
- Brak walidacji w czasie rzeczywistym (tylko on submit)

#### RegisterForm.tsx (249 LOC)

**Obecna logika:**
```typescript
// Linie 71-108: Bardzo długa sekwencyjna walidacja
if (!formData.email) {...}
if (!validateEmail(formData.email)) {...}
if (!formData.password) {...}
if (formData.password.length < 8) {...}
if (!formData.confirmPassword) {...}
if (formData.password !== formData.confirmPassword) {...}
```

**Problemy:**
- 6 osobnych bloków walidacji
- Duplikacja walidacji email z LoginForm
- Brak Zod schema (CreateProfileModal używa Zod)
- confirmPassword walidacja ręczna

#### ForgotPasswordForm.tsx (199 LOC)

**Obecna logika:**
```typescript
// Prostsza walidacja (tylko email)
if (!formData.email) {...}
if (!validateEmail(formData.email)) {...}
```

**Problemy:**
- Duplikacja `validateEmail` regex
- Stan `emailSent` wymaga osobnej obsługi

#### ResetPasswordForm.tsx (245 LOC)

**Obecna logika:**
```typescript
// Linie 74-105: Walidacja password + confirmPassword
if (!formData.password) {...}
if (formData.password.length < 8) {...}
if (!formData.confirmPassword) {...}
if (formData.password !== formData.confirmPassword) {...}
```

**Problemy:**
- Duplikacja logiki z RegisterForm
- `hasToken` sprawdzanie przed render

#### CreateProfileModal.tsx (296 LOC)

**Obecna logika:**
```typescript
// Linie 88-113: Używa Zod, ale ręcznie
const validateForm = useCallback((): boolean => {
  try {
    CreateProfileSchema.parse({...});
    return true;
  } catch (err) {
    if (err instanceof z.ZodError) {
      const errors: {...} = {};
      err.errors.forEach((error) => {...});
      setValidationErrors(errors);
    }
    return false;
  }
}, [displayName, selectedAvatarUrl]);
```

**Problemy:**
- Ręczne parsowanie Zod zamiast integracji z RHF
- Stan formularza rozproszony (displayName, selectedAvatarUrl osobno)
- Mapowanie błędów ręczne

#### ParentalGateModal.tsx (228 LOC)

**Specjalny przypadek:**
- NIE jest to typowy formularz tekstowy
- Używa numerycznego keypada
- Wartość to `userAnswer` string z cyfr

**Decyzja:** RHF nie jest optymalny dla tego przypadku. Obecna implementacja z `useState` jest odpowiednia. Można wydzielić `useNumericKeypad` hook.

---

## 2. Plan Refaktoryzacji

### 2.1 Zmiany struktury plików

```
src/
├── lib/
│   ├── validation/
│   │   ├── auth.schemas.ts          # NOWY - schematy auth
│   │   ├── profile.schemas.ts       # istniejący
│   │   └── shared.schemas.ts        # NOWY - współdzielone
│   └── services/
│       └── authService.ts           # NOWY - API calls
├── components/
│   ├── forms/                       # NOWY folder
│   │   ├── FormField.tsx            # Reużywalny wrapper
│   │   └── PasswordInput.tsx        # Input z toggle visibility
│   ├── LoginForm.tsx                # refaktoryzowany
│   ├── RegisterForm.tsx             # refaktoryzowany
│   ├── ForgotPasswordForm.tsx       # refaktoryzowany
│   ├── ResetPasswordForm.tsx        # refaktoryzowany
│   └── CreateProfileModal.tsx       # refaktoryzowany
```

### 2.2 Implementacja React Hook Form

#### Krok 1: Instalacja zależności

```bash
npm install react-hook-form @hookform/resolvers
```

#### Krok 2: Nowe schematy walidacji

**`src/lib/validation/auth.schemas.ts`:**

```typescript
import { z } from "zod";

// Shared schemas
export const emailSchema = z
  .string({ required_error: "Wprowadź adres email" })
  .email("Wprowadź poprawny adres email");

export const passwordSchema = z
  .string({ required_error: "Wprowadź hasło" })
  .min(8, "Hasło musi mieć minimum 8 znaków");

// Login
export const LoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export type LoginInput = z.infer<typeof LoginSchema>;

// Register
export const RegisterSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string({ required_error: "Potwierdź hasło" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });
export type RegisterInput = z.infer<typeof RegisterSchema>;

// Forgot Password
export const ForgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

// Reset Password
export const ResetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string({ required_error: "Potwierdź hasło" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
```

#### Krok 3: Refaktoryzacja LoginForm

**Przed (fragment):**
```typescript
const [formData, setFormData] = useState<LoginFormData>({...});
const [error, setError] = useState<AuthError | null>(null);
const [isLoading, setIsLoading] = useState(false);

const handleChange = useCallback((e) => {...}, []);
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!formData.email) { setError({...}); return; }
  // ... więcej if-ów
};
```

**Po:**
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, type LoginInput } from "@/lib/validation/auth.schemas";

export default function LoginForm() {
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    mode: "onBlur", // walidacja przy blur
  });

  const onSubmit = async (data: LoginInput) => {
    setApiError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      // ... obsługa odpowiedzi
    } catch (err) {
      setApiError("Wystąpił nieoczekiwany błąd");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register("email")}
        className={errors.email ? "border-red-500" : ""}
      />
      {errors.email && <p className="text-red-500">{errors.email.message}</p>}

      <Input
        type="password"
        {...register("password")}
        className={errors.password ? "border-red-500" : ""}
      />
      {errors.password && <p>{errors.password.message}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Logowanie..." : "Zaloguj się"}
      </Button>
    </form>
  );
}
```

#### Krok 4: Refaktoryzacja CreateProfileModal z Controller

**Dla custom komponentów (AvatarSelector):**
```typescript
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateProfileSchema, type CreateProfileInput } from "@/lib/validation/profile.schemas";

export default function CreateProfileModal({ isOpen, onCreated, onClose }) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProfileInput>({
    resolver: zodResolver(CreateProfileSchema),
    defaultValues: {
      display_name: "",
      avatar_url: null,
      language_code: "pl",
    },
  });

  // Reset przy otwarciu modala
  useEffect(() => {
    if (isOpen) reset();
  }, [isOpen, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input {...register("display_name")} />
        {errors.display_name && <p>{errors.display_name.message}</p>}

        {/* Controller dla custom komponenta */}
        <Controller
          name="avatar_url"
          control={control}
          render={({ field }) => (
            <AvatarSelector
              value={field.value}
              onChange={field.onChange}
              disabled={isSubmitting}
            />
          )}
        />
      </form>
    </Dialog>
  );
}
```

### 2.3 Optymalizacja logiki

#### Reużywalny komponent FormField

**`src/components/forms/FormField.tsx`:**
```typescript
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface FormFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  error?: FieldError;
  registration: UseFormRegisterReturn;
  hint?: string;
  disabled?: boolean;
}

export function FormField({
  label,
  type = "text",
  placeholder,
  error,
  registration,
  hint,
  disabled,
}: FormFieldProps) {
  return (
    <div>
      <Label htmlFor={registration.name}>{label}</Label>
      <Input
        id={registration.name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={error ? "border-red-500" : ""}
        {...registration}
      />
      {hint && !error && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
      {error && <p className="text-sm text-red-500 mt-1">{error.message}</p>}
    </div>
  );
}
```

**Użycie:**
```typescript
<FormField
  label="Adres email"
  type="email"
  placeholder="rodzic@example.com"
  registration={register("email")}
  error={errors.email}
  disabled={isSubmitting}
/>
```

### 2.4 Zarządzanie API Calls

**`src/lib/services/authService.ts`:**
```typescript
import type { LoginInput, RegisterInput, ForgotPasswordInput, ResetPasswordInput } from "@/lib/validation/auth.schemas";

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function apiCall<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.message || "Wystąpił błąd" };
    }

    return { data };
  } catch {
    return { error: "Wystąpił nieoczekiwany błąd" };
  }
}

export const authService = {
  login: (data: LoginInput) =>
    apiCall<{ user: unknown }>("/api/auth/login", data),

  register: (data: Omit<RegisterInput, "confirmPassword">) =>
    apiCall("/api/auth/register", data),

  forgotPassword: (data: ForgotPasswordInput) =>
    apiCall("/api/auth/forgot-password", data),

  resetPassword: (data: Omit<ResetPasswordInput, "confirmPassword">) =>
    apiCall("/api/auth/reset-password", data),
};
```

**Użycie w komponencie:**
```typescript
const onSubmit = async (data: LoginInput) => {
  const result = await authService.login(data);

  if (result.error) {
    setApiError(result.error);
    return;
  }

  window.location.href = "/profiles";
};
```

### 2.5 Strategia testowania

#### Testy jednostkowe schematów Zod

**`src/lib/validation/auth.schemas.test.ts`:**
```typescript
import { describe, it, expect } from "vitest";
import { LoginSchema, RegisterSchema } from "./auth.schemas";

describe("LoginSchema", () => {
  it("accepts valid login data", () => {
    const result = LoginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = LoginSchema.safeParse({
      email: "invalid-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["email"]);
  });

  it("rejects short password", () => {
    const result = LoginSchema.safeParse({
      email: "test@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });
});

describe("RegisterSchema", () => {
  it("rejects mismatched passwords", () => {
    const result = RegisterSchema.safeParse({
      email: "test@example.com",
      password: "password123",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["confirmPassword"]);
  });
});
```

#### Testy integracyjne komponentów

**`src/components/LoginForm.test.tsx`:**
```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import LoginForm from "./LoginForm";

describe("LoginForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows validation error for invalid email on blur", async () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.type(emailInput, "invalid");
    await userEvent.tab(); // trigger blur

    await waitFor(() => {
      expect(screen.getByText(/poprawny adres email/i)).toBeInTheDocument();
    });
  });

  it("submits form with valid data", async () => {
    const mockFetch = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: {} }),
    } as Response);

    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/hasło/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /zaloguj/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/auth/login", expect.any(Object));
    });
  });

  it("displays API error message", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: "Nieprawidłowe dane" }),
    } as Response);

    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/hasło/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /zaloguj/i }));

    await waitFor(() => {
      expect(screen.getByText(/nieprawidłowe dane/i)).toBeInTheDocument();
    });
  });
});
```

#### Edge cases do przetestowania

| Scenariusz | Komponent | Test |
|------------|-----------|------|
| Puste pola | Wszystkie | Submit bez danych |
| Nieprawidłowy email | Login, Register, Forgot | Różne formaty email |
| Krótkie hasło | Login, Register, Reset | < 8 znaków |
| Niezgodne hasła | Register, Reset | password !== confirmPassword |
| Błąd API 401 | Login | Nieprawidłowe dane logowania |
| Błąd API 409 | Register | Email już istnieje |
| Błąd API 429 | Wszystkie | Rate limiting |
| Timeout sieci | Wszystkie | fetch throws |
| Token wygasły | Reset | hasToken = false |
| Limit profili | CreateProfile | 409 - max 5 profili |

---

## 3. Podsumowanie zmian

### 3.1 Szacunkowa redukcja kodu

| Metryka | Przed | Po | Redukcja |
|---------|-------|-----|----------|
| LoginForm.tsx | 216 LOC | ~90 LOC | -58% |
| RegisterForm.tsx | 249 LOC | ~100 LOC | -60% |
| ResetPasswordForm.tsx | 245 LOC | ~110 LOC | -55% |
| ForgotPasswordForm.tsx | 199 LOC | ~80 LOC | -60% |
| CreateProfileModal.tsx | 296 LOC | ~150 LOC | -49% |
| Duplikacja walidacji | 4x email regex | 1x schema | -75% |

### 3.2 Korzyści

1. **Spójność** - wszystkie formularze używają Zod + RHF
2. **Real-time validation** - błędy pokazywane przy blur/change
3. **Type safety** - automatyczne typy z `z.infer`
4. **Testowalność** - schematy testowane osobno od UI
5. **Maintainability** - logika walidacji w jednym miejscu
6. **Performance** - mniej re-renderów dzięki uncontrolled inputs

### 3.3 Komponenty bez zmian

- **ParentalGateModal** - numeric keypad nie pasuje do RHF, obecna implementacja jest optymalna

### 3.4 Kolejność implementacji

1. Instalacja `react-hook-form` i `@hookform/resolvers`
2. Utworzenie `auth.schemas.ts` ze schematami walidacji
3. Utworzenie `FormField.tsx` - reużywalny komponent
4. Refaktoryzacja `LoginForm.tsx` (najprostszy)
5. Refaktoryzacja `ForgotPasswordForm.tsx`
6. Refaktoryzacja `RegisterForm.tsx`
7. Refaktoryzacja `ResetPasswordForm.tsx`
8. Refaktoryzacja `CreateProfileModal.tsx` (z Controller)
9. Utworzenie `authService.ts` (opcjonalne)
10. Dodanie testów

---

## 4. Checklist przed wdrożeniem

- [ ] Zainstalowane `react-hook-form` i `@hookform/resolvers`
- [ ] Utworzony `src/lib/validation/auth.schemas.ts`
- [ ] Testy schematów przechodzą
- [ ] Utworzony `src/components/forms/FormField.tsx`
- [ ] Zrefaktoryzowany `LoginForm.tsx`
- [ ] Zrefaktoryzowany `ForgotPasswordForm.tsx`
- [ ] Zrefaktoryzowany `RegisterForm.tsx`
- [ ] Zrefaktoryzowany `ResetPasswordForm.tsx`
- [ ] Zrefaktoryzowany `CreateProfileModal.tsx`
- [ ] Wszystkie testy E2E przechodzą
- [ ] Sprawdzone działanie na mobile
- [ ] Sprawdzona dostępność (ARIA)
