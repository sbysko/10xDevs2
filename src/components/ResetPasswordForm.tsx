import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Reset password form data interface
 */
interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

/**
 * Authentication error interface
 */
interface AuthError {
  message: string;
  field?: "password" | "confirmPassword";
  type: "error" | "success";
}

/**
 * ResetPasswordForm Component
 *
 * Handles password reset with Supabase Auth.
 * Features:
 * - New password input with confirmation
 * - Client-side validation
 * - Success/error handling with user-friendly messages
 * - Auto-redirect to login after successful reset
 */
export default function ResetPasswordForm() {
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState<AuthError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  /**
   * Check if we have access_token in URL hash (from Supabase email link)
   */
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");

    if (accessToken) {
      setHasToken(true);
    } else {
      setHasToken(false);
    }
  }, []);

  /**
   * Handle input change
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear message when user starts typing
    setMessage(null);
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Client-side validation
    if (!formData.password) {
      setMessage({ message: "Wprowadź nowe hasło", field: "password", type: "error" });
      return;
    }

    if (formData.password.length < 8) {
      setMessage({
        message: "Hasło musi mieć minimum 8 znaków",
        field: "password",
        type: "error",
      });
      return;
    }

    if (!formData.confirmPassword) {
      setMessage({
        message: "Potwierdź hasło",
        field: "confirmPassword",
        type: "error",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage({
        message: "Hasła nie są identyczne",
        field: "confirmPassword",
        type: "error",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Call API endpoint instead of direct Supabase
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: formData.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ message: data.message || "Wystąpił błąd. Spróbuj ponownie", type: "error" });
        setIsLoading(false);
        return;
      }

      // Success - show confirmation message
      setMessage({
        message: "Hasło zostało pomyślnie zmienione! Za chwilę zostaniesz przekierowany do logowania.",
        type: "success",
      });
      setIsLoading(false);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 2000);
    } catch (err) {
      console.error("Reset password error:", err);
      setMessage({ message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie", type: "error" });
      setIsLoading(false);
    }
  };

  // Show error if token is invalid
  if (!hasToken) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Link wygasł</h1>
            <p className="text-gray-600">Link do resetowania hasła jest nieprawidłowy lub wygasł</p>
          </div>

          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              Link do resetowania hasła wygasł lub został już użyty. Spróbuj ponownie zresetować hasło.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <a href="/auth/forgot-password">Wyślij nowy link</a>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <a href="/auth/login">Powrót do logowania</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ustaw nowe hasło</h1>
          <p className="text-gray-600">Wprowadź nowe hasło do swojego konta</p>
        </div>

        {/* Error/Success alert */}
        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-4">
            <AlertDescription>{message.message}</AlertDescription>
          </Alert>
        )}

        {/* Reset password form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password field */}
          <div>
            <Label htmlFor="password">Nowe hasło</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={message?.field === "password" ? "border-red-500" : ""}
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
              className={message?.field === "confirmPassword" ? "border-red-500" : ""}
              disabled={isLoading}
              autoComplete="new-password"
              required
            />
          </div>

          {/* Submit button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Resetowanie..." : "Zresetuj hasło"}
          </Button>
        </form>

        {/* Login link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Pamiętasz hasło?{" "}
            <a href="/auth/login" className="font-medium text-purple-600 hover:text-purple-700 hover:underline">
              Zaloguj się
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
