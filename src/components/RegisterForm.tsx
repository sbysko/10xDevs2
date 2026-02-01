import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/forms/FormField";
import { RegisterSchema, type RegisterInput } from "@/lib/validation/auth.schemas";

export default function RegisterForm() {
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [redirectDelay, setRedirectDelay] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    mode: "onBlur",
  });

  useEffect(() => {
    if (redirectUrl && redirectDelay !== null) {
      const timer = setTimeout(() => {
        window.location.href = redirectUrl;
      }, redirectDelay);
      return () => clearTimeout(timer);
    }
  }, [redirectUrl, redirectDelay]);

  const onSubmit = async (data: RegisterInput) => {
    setApiError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setApiError(result.message || "Wystąpił błąd podczas rejestracji");
        return;
      }

      // Check if email confirmation is required
      if (result.email_confirmation_required) {
        setSuccessMessage(result.message || "Rejestracja udana! Sprawdź swoją skrzynkę email i potwierdź adres.");
        setRedirectUrl("/auth/login");
        setRedirectDelay(3000);
        return;
      }

      // Auto-login successful
      setRedirectUrl("/profiles");
      setRedirectDelay(100);
    } catch {
      setApiError("Wystąpił nieoczekiwany błąd. Spróbuj ponownie");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Utwórz konto</h1>
          <p className="text-gray-600">Zacznij naukę słówek ze swoim dzieckiem</p>
        </div>

        {successMessage && (
          <Alert variant="default" className="mb-4">
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {apiError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="Adres email"
            type="email"
            placeholder="rodzic@example.com"
            registration={register("email")}
            error={errors.email}
            disabled={isSubmitting}
            autoComplete="email"
          />

          <FormField
            label="Hasło"
            type="password"
            placeholder="••••••••"
            registration={register("password")}
            error={errors.password}
            disabled={isSubmitting}
            autoComplete="new-password"
            hint="Minimum 8 znaków"
          />

          <FormField
            label="Potwierdź hasło"
            type="password"
            placeholder="••••••••"
            registration={register("confirmPassword")}
            error={errors.confirmPassword}
            disabled={isSubmitting}
            autoComplete="new-password"
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Rejestracja..." : "Zarejestruj się"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Masz już konto?{" "}
            <a href="/auth/login" className="font-medium text-purple-600 hover:text-purple-700 hover:underline">
              Zaloguj się
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
