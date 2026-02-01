import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface FormFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  error?: FieldError;
  registration: UseFormRegisterReturn;
  hint?: string;
  disabled?: boolean;
  autoComplete?: string;
}

export function FormField({
  label,
  type = "text",
  placeholder,
  error,
  registration,
  hint,
  disabled,
  autoComplete,
}: FormFieldProps) {
  return (
    <div>
      <Label htmlFor={registration.name}>{label}</Label>
      <Input
        id={registration.name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        className={error ? "border-red-500" : ""}
        {...registration}
      />
      {hint && !error && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
      {error && <p className="text-sm text-red-500 mt-1">{error.message}</p>}
    </div>
  );
}
