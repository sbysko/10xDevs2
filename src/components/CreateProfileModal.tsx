/**
 * CreateProfileModal Component
 *
 * Modal form for creating a new child profile.
 * Shown after parent passes the Parental Gate challenge.
 *
 * Features:
 * - Name input field with validation (2-50 characters, letters only)
 * - Avatar selector with 8 predefined avatars
 * - Submit to POST /api/profiles
 * - Error handling (validation, API errors, profile limit)
 *
 * Validation:
 * - Client-side validation with Zod schema
 * - Server-side validation enforced by API
 *
 * Props:
 * - isOpen: Whether modal is visible
 * - onCreated: Callback with newly created profile
 * - onClose: Callback to close modal
 */

import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CreateProfileSchema } from "@/lib/validation/profile.schemas";
import type { ProfileDTO, CreateProfileCommand } from "@/types";
import { z } from "zod";

interface CreateProfileModalProps {
  isOpen: boolean;
  onCreated: (profile: ProfileDTO) => void;
  onClose: () => void;
}

/**
 * Predefined avatar options (1-8)
 */
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
  // ===================================================================
  // STATE
  // ===================================================================

  const [displayName, setDisplayName] = useState<string>("");
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<{
    display_name?: string;
    avatar_url?: string;
  }>({});

  // ===================================================================
  // EFFECTS
  // ===================================================================

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setDisplayName("");
      setSelectedAvatarUrl(null);
      setError("");
      setValidationErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // ===================================================================
  // VALIDATION
  // ===================================================================

  /**
   * Validate form data with Zod schema
   */
  const validateForm = useCallback((): boolean => {
    setValidationErrors({});
    setError("");

    try {
      CreateProfileSchema.parse({
        display_name: displayName,
        avatar_url: selectedAvatarUrl,
        language_code: "pl",
      });
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: { display_name?: string; avatar_url?: string } = {};

        err.errors.forEach((error) => {
          const field = error.path[0] as "display_name" | "avatar_url";
          errors[field] = error.message;
        });

        setValidationErrors(errors);
      }
      return false;
    }
  }, [displayName, selectedAvatarUrl]);

  // ===================================================================
  // HANDLERS
  // ===================================================================

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate form
      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);
      setError("");

      try {
        // Prepare request body
        const requestBody: CreateProfileCommand = {
          display_name: displayName,
          avatar_url: selectedAvatarUrl,
          language_code: "pl",
        };

        // Call API
        const response = await fetch("/api/profiles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          // Handle error responses
          const errorData = await response.json();

          // Special case: Profile limit exceeded
          if (response.status === 409) {
            setError("Osiągnięto maksymalną liczbę profili (5). Usuń istniejący profil, aby dodać nowy.");
            return;
          }

          // Validation error from server
          if (response.status === 400) {
            setError(errorData.message || "Nieprawidłowe dane");
            return;
          }

          // Generic error
          throw new Error(errorData.message || "Nie udało się utworzyć profilu");
        }

        // Success!
        const newProfile: ProfileDTO = await response.json();
        onCreated(newProfile);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Nieznany błąd";
        setError(errorMessage);
        // eslint-disable-next-line no-console
        console.error("Error creating profile:", err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [displayName, selectedAvatarUrl, validateForm, onCreated]
  );

  /**
   * Handle avatar selection
   */
  const handleAvatarSelect = useCallback((avatarUrl: string) => {
    setSelectedAvatarUrl(avatarUrl);
    setValidationErrors((prev) => ({ ...prev, avatar_url: undefined }));
  }, []);

  // ===================================================================
  // RENDER
  // ===================================================================

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Dodaj nowy profil</DialogTitle>
          <DialogDescription>Wprowadź imię dziecka i wybierz awatar</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Display Name Input */}
          <div className="space-y-2">
            <Label htmlFor="display_name" className="text-base font-semibold">
              Imię dziecka
            </Label>
            <Input
              id="display_name"
              type="text"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setValidationErrors((prev) => ({
                  ...prev,
                  display_name: undefined,
                }));
              }}
              placeholder="np. Maria, Jan"
              className="text-lg"
              disabled={isSubmitting}
            />
            {validationErrors.display_name && <p className="text-sm text-red-600">{validationErrors.display_name}</p>}
          </div>

          {/* Avatar Selector */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Wybierz awatar (opcjonalnie)</Label>
            <div className="grid grid-cols-4 gap-3">
              {AVATAR_OPTIONS.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => handleAvatarSelect(avatar.url)}
                  disabled={isSubmitting}
                  className={`relative overflow-hidden rounded-lg border-4 p-2 transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                    selectedAvatarUrl === avatar.url
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
                  {selectedAvatarUrl === avatar.url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-purple-600 bg-opacity-20">
                      <div className="rounded-full bg-purple-600 p-1 text-white">✓</div>
                    </div>
                  )}
                </button>
              ))}
            </div>
            {validationErrors.avatar_url && <p className="text-sm text-red-600">{validationErrors.avatar_url}</p>}
          </div>

          {/* Error Message */}
          {error && <div className="rounded-lg bg-red-50 p-3 text-center text-red-700">{error}</div>}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="flex-1">
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !displayName.trim()}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? "Tworzenie..." : "Utwórz profil"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
