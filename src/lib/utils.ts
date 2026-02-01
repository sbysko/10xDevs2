import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }

  return null;
}

/**
 * Check if we're in production (HTTPS) or development (HTTP)
 */
function isProduction(): boolean {
  if (typeof window === "undefined") {
    return import.meta.env.PROD;
  }
  return window.location.protocol === "https:";
}

/**
 * Set cookie with options
 */
export function setCookie(name: string, value: string, days: number = 30): void {
  if (typeof document === "undefined") {
    return;
  }

  const expiresDate = new Date();
  expiresDate.setDate(expiresDate.getDate() + days);

  // Only use secure flag in production (HTTPS)
  const securePart = isProduction() ? "; secure" : "";
  document.cookie = `${name}=${value}; path=/; expires=${expiresDate.toUTCString()}${securePart}; samesite=lax`;
}

/**
 * Delete cookie by name
 */
export function deleteCookie(name: string): void {
  if (typeof document === "undefined") {
    return;
  }

  // Only use secure flag in production (HTTPS)
  const securePart = isProduction() ? "; secure" : "";
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT${securePart}; samesite=lax`;
}
