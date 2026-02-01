import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
      // Call API endpoint instead of direct Supabase
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle API errors
        setError({ message: data.message || "Wystąpił błąd podczas logowania" });
        setIsLoading(false);
        return;
      }

      // SUCCESS - Redirect to /profiles
      // Smart redirect logic (0→show create, 1→auto-select, 2+→select) is handled in profiles.astro
      let redirectUrl = "/profiles";

      // Check for redirect query param
      const urlParams = new URLSearchParams(window.location.search);
      const redirectParam = urlParams.get("redirect");

      if (redirectParam) {
        redirectUrl = redirectParam;
      }

      // Full page reload to refresh server session
      window.location.href = redirectUrl;
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

          {/* Forgot password link */}
          <div className="text-right">
            <a
              href="/auth/forgot-password"
              className="text-sm font-medium text-purple-600 hover:text-purple-700 hover:underline"
            >
              Zapomniałeś hasła?
            </a>
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
            <a href="/auth/register" className="font-medium text-purple-600 hover:text-purple-700 hover:underline">
              Zarejestruj się
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
