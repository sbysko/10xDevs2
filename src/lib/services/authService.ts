/**
 * Authentication Service
 *
 * Centralized API calls for authentication operations.
 * Reduces boilerplate in form components.
 */

import type { LoginInput, RegisterInput, ForgotPasswordInput, ResetPasswordInput } from "@/lib/validation/auth.schemas";

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

interface LoginResponse {
  user: unknown;
}

interface RegisterResponse {
  email_confirmation_required?: boolean;
  message?: string;
}

async function apiCall<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.message || "Wystąpił błąd" };
    }

    return { data };
  } catch {
    return { error: "Wystąpił nieoczekiwany błąd" };
  }
}

export const authService = {
  login: (data: LoginInput) => apiCall<LoginResponse>("/api/auth/login", data),

  register: (data: Omit<RegisterInput, "confirmPassword">) => apiCall<RegisterResponse>("/api/auth/register", data),

  forgotPassword: (data: ForgotPasswordInput) => apiCall("/api/auth/forgot-password", data),

  resetPassword: (data: Omit<ResetPasswordInput, "confirmPassword">) => apiCall("/api/auth/reset-password", data),
};
