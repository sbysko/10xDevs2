import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Forgot password form data interface
 */
interface ForgotPasswordFormData {
  email: string;
}

/**
 * Authentication error interface
 */
interface AuthError {
  message: string;
  type: "error" | "success";
}

/**
 * ForgotPasswordForm Component
 *
 * Handles password recovery with Supabase Auth.
 * Features:
 * - Email input for password reset
 * - Client-side validation
 * - Success/error handling with user-friendly messages
 * - Link back to login page
 */
export default function ForgotPasswordForm() {
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: "",
  });
  const [message, setMessage] = useState<AuthError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

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
    const { value } = e.target;
    setFormData({ email: value });
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
    if (!formData.email) {
      setMessage({ message: "Wprowadź adres email", type: "error" });
      return;
    }

    if (!validateEmail(formData.email)) {
      setMessage({ message: "Wprowadź poprawny adres email", type: "error" });
      return;
    }

    setIsLoading(true);

    try {
      // Call API endpoint instead of direct Supabase
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ message: data.message || "Wystąpił błąd. Spróbuj ponownie", type: "error" });
        setIsLoading(false);
        return;
      }

      // Success - show confirmation message
      setMessage({
        message: "Link do resetowania hasła został wysłany na Twój adres email. Sprawdź swoją skrzynkę odbiorczą.",
        type: "success",
      });
      setEmailSent(true);
      setIsLoading(false);
    } catch (err) {
      console.error("Password reset error:", err);
      setMessage({ message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie", type: "error" });
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resetowanie hasła</h1>
          <p className="text-gray-600">Wyślemy Ci link do zresetowania hasła</p>
        </div>

        {/* Error/Success alert */}
        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-4">
            <AlertDescription>{message.message}</AlertDescription>
          </Alert>
        )}

        {!emailSent ? (
          <>
            {/* Forgot password form */}
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
                  disabled={isLoading}
                  autoComplete="email"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Podaj adres email użyty podczas rejestracji</p>
              </div>

              {/* Submit button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
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
          </>
        ) : (
          <>
            {/* Email sent confirmation */}
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Jeśli konto z tym adresem email istnieje, wkrótce otrzymasz wiadomość z instrukcjami resetowania hasła.
              </p>
              <p className="text-sm text-gray-500">Nie otrzymałeś emaila? Sprawdź folder spam lub spróbuj ponownie.</p>

              {/* Resend button */}
              <Button
                onClick={() => {
                  setEmailSent(false);
                  setMessage(null);
                }}
                variant="outline"
                className="w-full"
              >
                Wyślij ponownie
              </Button>

              {/* Back to login */}
              <div className="pt-2">
                <a
                  href="/auth/login"
                  className="text-sm font-medium text-purple-600 hover:text-purple-700 hover:underline"
                >
                  Powrót do logowania
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
