import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/forms/FormField";
import { ResetPasswordSchema, type ResetPasswordInput } from "@/lib/validation/auth.schemas";

export default function ResetPasswordForm() {
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    mode: "onBlur",
  });

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    setHasToken(!!accessToken);
  }, []);

  useEffect(() => {
    if (redirectUrl) {
      const timer = setTimeout(() => {
        window.location.href = redirectUrl;
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [redirectUrl]);

  const onSubmit = async (data: ResetPasswordInput) => {
    setMessage(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: data.password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage({ text: result.message || "Wystąpił błąd. Spróbuj ponownie", type: "error" });
        return;
      }

      setMessage({
        text: "Hasło zostało pomyślnie zmienione! Za chwilę zostaniesz przekierowany do logowania.",
        type: "success",
      });
      setRedirectUrl("/auth/login");
    } catch {
      setMessage({ text: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie", type: "error" });
    }
  };

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
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ustaw nowe hasło</h1>
          <p className="text-gray-600">Wprowadź nowe hasło do swojego konta</p>
        </div>

        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-4">
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="Nowe hasło"
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
            {isSubmitting ? "Resetowanie..." : "Zresetuj hasło"}
          </Button>
        </form>

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
