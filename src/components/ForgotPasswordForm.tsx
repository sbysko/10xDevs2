import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/forms/FormField";
import { ForgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation/auth.schemas";

export default function ForgotPasswordForm() {
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setMessage(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage({ text: result.message || "Wystąpił błąd. Spróbuj ponownie", type: "error" });
        return;
      }

      setMessage({
        text: "Link do resetowania hasła został wysłany na Twój adres email. Sprawdź swoją skrzynkę odbiorczą.",
        type: "success",
      });
      setEmailSent(true);
    } catch {
      setMessage({ text: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie", type: "error" });
    }
  };

  const handleResend = () => {
    setEmailSent(false);
    setMessage(null);
    reset();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resetowanie hasła</h1>
          <p className="text-gray-600">Wyślemy Ci link do zresetowania hasła</p>
        </div>

        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-4">
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {!emailSent ? (
          <>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                label="Adres email"
                type="email"
                placeholder="rodzic@example.com"
                registration={register("email")}
                error={errors.email}
                disabled={isSubmitting}
                autoComplete="email"
                hint="Podaj adres email użyty podczas rejestracji"
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Wysyłanie..." : "Wyślij link resetujący"}
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
          </>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Jeśli konto z tym adresem email istnieje, wkrótce otrzymasz wiadomość z instrukcjami resetowania hasła.
            </p>
            <p className="text-sm text-gray-500">Nie otrzymałeś emaila? Sprawdź folder spam lub spróbuj ponownie.</p>

            <Button onClick={handleResend} variant="outline" className="w-full">
              Wyślij ponownie
            </Button>

            <div className="pt-2">
              <a
                href="/auth/login"
                className="text-sm font-medium text-purple-600 hover:text-purple-700 hover:underline"
              >
                Powrót do logowania
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
