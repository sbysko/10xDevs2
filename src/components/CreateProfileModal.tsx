/**
 * CreateProfileModal Component
 *
 * Modal form for creating a new child profile.
 * Uses React Hook Form with Zod validation.
 */

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CreateProfileSchema, type CreateProfileInput } from "@/lib/validation/profile.schemas";
import type { ProfileDTO } from "@/types";
import { getAccessToken } from "@/lib/supabase-browser";

interface CreateProfileModalProps {
  isOpen: boolean;
  onCreated: (profile: ProfileDTO) => void;
  onClose: () => void;
}

const AVATAR_OPTIONS = [
  { id: 1, url: "avatars/avatar-1.svg", label: "Miś" },
  { id: 2, url: "avatars/avatar-2.svg", label: "Królik" },
  { id: 3, url: "avatars/avatar-3.svg", label: "Lew" },
  { id: 4, url: "avatars/avatar-4.svg", label: "Żaba" },
  { id: 5, url: "avatars/avatar-5.svg", label: "Lis" },
  { id: 6, url: "avatars/avatar-6.svg", label: "Panda" },
  { id: 7, url: "avatars/avatar-7.svg", label: "Kot" },
  { id: 8, url: "avatars/avatar-8.svg", label: "Pies" },
];

export default function CreateProfileModal({ isOpen, onCreated, onClose }: CreateProfileModalProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateProfileInput>({
    resolver: zodResolver(CreateProfileSchema),
    defaultValues: {
      display_name: "",
      avatar_url: null,
      language_code: "pl",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: CreateProfileInput) => {
    try {
      const token = await getAccessToken();

      if (!token) {
        setError("root", { message: "Sesja wygasła. Zaloguj się ponownie." });
        return;
      }

      const response = await fetch("/api/profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 409) {
          setError("root", {
            message: "Osiągnięto maksymalną liczbę profili (5). Usuń istniejący profil, aby dodać nowy.",
          });
          return;
        }

        if (response.status === 400) {
          setError("root", { message: errorData.message || "Nieprawidłowe dane" });
          return;
        }

        throw new Error(errorData.message || "Nie udało się utworzyć profilu");
      }

      const newProfile: ProfileDTO = await response.json();
      onCreated(newProfile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nieznany błąd";
      setError("root", { message: errorMessage });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Dodaj nowy profil</DialogTitle>
          <DialogDescription>Wprowadź imię dziecka i wybierz awatar</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="display_name" className="text-base font-semibold">
              Imię dziecka
            </Label>
            <Input
              id="display_name"
              type="text"
              placeholder="np. Maria, Jan"
              className={`text-lg ${errors.display_name ? "border-red-500" : ""}`}
              disabled={isSubmitting}
              {...register("display_name")}
            />
            {errors.display_name && <p className="text-sm text-red-600">{errors.display_name.message}</p>}
          </div>

          <Controller
            name="avatar_url"
            control={control}
            render={({ field }) => (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Wybierz awatar (opcjonalnie)</Label>
                <div className="grid grid-cols-4 gap-3">
                  {AVATAR_OPTIONS.map((avatar) => (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => field.onChange(avatar.url)}
                      disabled={isSubmitting}
                      className={`relative overflow-hidden rounded-lg border-4 p-2 transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                        field.value === avatar.url
                          ? "border-purple-600 bg-purple-50"
                          : "border-gray-200 hover:border-purple-300"
                      }`}
                      aria-label={avatar.label}
                    >
                      <img
                        src={`/${avatar.url}`}
                        alt={avatar.label}
                        className="h-full w-full rounded-md object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/avatars/default-avatar.svg";
                        }}
                      />
                      {field.value === avatar.url && (
                        <div className="absolute inset-0 flex items-center justify-center bg-purple-600 bg-opacity-20">
                          <div className="rounded-full bg-purple-600 p-1 text-white">✓</div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                {errors.avatar_url && <p className="text-sm text-red-600">{errors.avatar_url.message}</p>}
              </div>
            )}
          />

          {errors.root && (
            <div className="rounded-lg bg-red-50 p-3 text-center text-red-700">{errors.root.message}</div>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="flex-1">
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-purple-600 hover:bg-purple-700">
              {isSubmitting ? "Tworzenie..." : "Utwórz profil"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
