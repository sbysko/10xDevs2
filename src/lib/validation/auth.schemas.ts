/**
 * Zod Validation Schemas for Authentication Operations
 *
 * Centralized validation for auth forms using React Hook Form + Zod
 * Replaces duplicated manual validation across LoginForm, RegisterForm, etc.
 */

import { z } from "zod";

/**
 * Shared email schema
 * Used across login, register, and forgot password forms
 */
export const emailSchema = z
  .string({ required_error: "Wprowadź adres email" })
  .min(1, "Wprowadź adres email")
  .email("Wprowadź poprawny adres email");

/**
 * Shared password schema
 * Minimum 8 characters as per business requirements
 */
export const passwordSchema = z
  .string({ required_error: "Wprowadź hasło" })
  .min(1, "Wprowadź hasło")
  .min(8, "Hasło musi mieć minimum 8 znaków");

/**
 * Login form validation schema
 * Used in: LoginForm.tsx
 */
export const LoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * Register form validation schema
 * Includes password confirmation with refinement
 * Used in: RegisterForm.tsx
 */
export const RegisterSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string({ required_error: "Potwierdź hasło" }).min(1, "Potwierdź hasło"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof RegisterSchema>;

/**
 * Forgot password form validation schema
 * Only requires email
 * Used in: ForgotPasswordForm.tsx
 */
export const ForgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

/**
 * Reset password form validation schema
 * New password with confirmation
 * Used in: ResetPasswordForm.tsx
 */
export const ResetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string({ required_error: "Potwierdź hasło" }).min(1, "Potwierdź hasło"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
