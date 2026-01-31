import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Register form data interface
 */
interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Authentication error interface
 */
interface AuthError {
  message: string;
  field?: "email" | "password" | "confirmPassword";
}

/**
 * RegisterForm Component
 *
 * Handles user registration with Supabase Auth.
 * Features:
 * - Email/password registration
 * - Password confirmation
 * - Client-side validation
 * - Error handling with user-friendly messages
 * - Auto-login after successful registration
 * - Link to login page
 */
export default function RegisterForm() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<AuthError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Create Supabase client
  const supabase = createBrowserClient(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY);

  /**
   * Validate email format
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Handle input change
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    setError(null);
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!formData.email) {
      setError({ message: "Wprowadź adres email", field: "email" });
      return;
    }

    if (!validateEmail(formData.email)) {
      setError({ message: "Wprowadź poprawny adres email", field: "email" });
      return;
    }

    if (!formData.password) {
      setError({ message: "Wprowadź hasło", field: "password" });
      return;
    }

    if (formData.password.length < 8) {
      setError({
        message: "Hasło musi mieć minimum 8 znaków",
        field: "password",
      });
      return;
    }

    if (!formData.confirmPassword) {
      setError({
        message: "Potwierdź hasło",
        field: "confirmPassword",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError({
        message: "Hasła nie są identyczne",
        field: "confirmPassword",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Sign up with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) {
        // Map Supabase errors to user-friendly messages
        let errorMessage = "Wystąpił błąd podczas rejestracji";

        if (signUpError.message.includes("User already registered")) {
          errorMessage = "Ten adres email jest już zarejestrowany";
        } else if (signUpError.message.includes("Invalid email")) {
          errorMessage = "Nieprawidłowy format adresu email";
        } else if (signUpError.message.includes("Password")) {
          errorMessage = "Hasło nie spełnia wymagań bezpieczeństwa";
        }

        setError({ message: errorMessage });
        setIsLoading(false);
        return;
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        // Email confirmation is enabled - show message and redirect to login
        setError({
          message: "Rejestracja udana! Sprawdź swoją skrzynkę email i potwierdź adres.",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 3000);
        return;
      }

      // Auto-login successful (email confirmation disabled)
      // Redirect to profiles page
      window.location.href = "/profiles";
    } catch (err) {
      console.error("Registration error:", err);
      setError({ message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie" });
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Utwórz konto</h1>
          <p className="text-gray-600">Zacznij naukę słówek ze swoim dzieckiem</p>
        </div>

        {/* Error/Success alert */}
        {error && (
          <Alert variant={error.message.includes("udana") ? "default" : "destructive"} className="mb-4">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        {/* Register form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field */}
          <div>
            <Label htmlFor="email">Adres email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="rodzic@example.com"
              className={error?.field === "email" ? "border-red-500" : ""}
              disabled={isLoading}
              autoComplete="email"
              required
            />
          </div>

          {/* Password field */}
          <div>
            <Label htmlFor="password">Hasło</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={error?.field === "password" ? "border-red-500" : ""}
              disabled={isLoading}
              autoComplete="new-password"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 8 znaków</p>
          </div>

          {/* Confirm password field */}
          <div>
            <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className={error?.field === "confirmPassword" ? "border-red-500" : ""}
              disabled={isLoading}
              autoComplete="new-password"
              required
            />
          </div>

          {/* Submit button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Rejestracja..." : "Zarejestruj się"}
          </Button>
        </form>

        {/* Login link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Masz już konto?{" "}
            <a href="/login" className="font-medium text-purple-600 hover:text-purple-700 hover:underline">
              Zaloguj się
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
