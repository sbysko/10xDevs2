import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/forms/FormField";
import { LoginSchema, type LoginInput } from "@/lib/validation/auth.schemas";

export default function LoginForm() {
  const [apiError, setApiError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    mode: "onBlur",
  });

  useEffect(() => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }, [redirectUrl]);

  const onSubmit = async (data: LoginInput) => {
    setApiError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setApiError(result.message || "Wystąpił błąd podczas logowania");
        return;
      }

      // Smart redirect logic
      let targetUrl = "/profiles";
      const urlParams = new URLSearchParams(window.location.search);
      const redirectParam = urlParams.get("redirect");

      if (redirectParam) {
        targetUrl = redirectParam;
      }

      setRedirectUrl(targetUrl);
    } catch {
      setApiError("Wystąpił nieoczekiwany błąd. Spróbuj ponownie");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Witaj ponownie!</h1>
          <p className="text-gray-600">Zaloguj się do swojego konta</p>
        </div>

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
            autoComplete="current-password"
          />

          <div className="text-right">
            <a
              href="/auth/forgot-password"
              className="text-sm font-medium text-purple-600 hover:text-purple-700 hover:underline"
            >
              Zapomniałeś hasła?
            </a>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Logowanie..." : "Zaloguj się"}
          </Button>
        </form>

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
