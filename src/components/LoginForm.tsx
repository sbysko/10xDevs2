import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Login form data interface
 */
interface LoginFormData {
  email: string;
  password: string;
}

/**
 * Authentication error interface
 */
interface AuthError {
  message: string;
  field?: "email" | "password";
}

/**
 * LoginForm Component
 *
 * Handles user authentication with Supabase Auth.
 * Features:
 * - Email/password login
 * - Client-side validation
 * - Error handling with user-friendly messages
 * - Redirect after successful login
 * - Link to registration page
 */
export default function LoginForm() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
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

    setIsLoading(true);

    try {
      // Sign in with Supabase Auth
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        // Map Supabase errors to user-friendly messages
        let errorMessage = "Wystąpił błąd podczas logowania";

        if (signInError.message.includes("Invalid login credentials")) {
          errorMessage = "Nieprawidłowy email lub hasło";
        } else if (signInError.message.includes("Email not confirmed")) {
          errorMessage = "Potwierdź swój adres email";
        } else if (signInError.message.includes("Too many requests")) {
          errorMessage = "Zbyt wiele prób logowania. Spróbuj ponownie za chwilę";
        }

        setError({ message: errorMessage });
        setIsLoading(false);
        return;
      }

      // Get redirect URL from query params
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get("redirect") || "/profiles";

      // Redirect to profiles or original page
      window.location.href = redirect;
    } catch (err) {
      console.error("Login error:", err);
      setError({ message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie" });
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Witaj ponownie!</h1>
          <p className="text-gray-600">Zaloguj się do swojego konta</p>
        </div>

        {/* Error alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        {/* Login form */}
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
              autoComplete="current-password"
              required
            />
          </div>

          {/* Submit button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logowanie..." : "Zaloguj się"}
          </Button>
        </form>

        {/* Register link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Nie masz konta?{" "}
            <a href="/register" className="font-medium text-purple-600 hover:text-purple-700 hover:underline">
              Zarejestruj się
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
