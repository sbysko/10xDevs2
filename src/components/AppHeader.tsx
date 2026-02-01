import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

/**
 * AppHeader Component
 *
 * Displays user information and logout button.
 * Features:
 * - Shows logged-in user's email
 * - Logout button
 * - Responsive design
 * - Error handling
 */
export default function AppHeader() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Create Supabase client
  const supabase = createBrowserClient(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY);

  // Get user email on mount
  useState(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || null);
      }
    };
    getUser();
  });

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      // Call logout API endpoint
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Logout failed:", await response.text());
        setIsLoggingOut(false);
        return;
      }

      // Redirect to login page
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - App name */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-purple-600">Dopasuj Obrazek do Słowa</h1>
          </div>

          {/* Right side - User info and logout */}
          <div className="flex items-center gap-4">
            {/* User email */}
            {userEmail && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{userEmail}</span>
              </div>
            )}

            {/* Logout button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{isLoggingOut ? "Wylogowywanie..." : "Wyloguj"}</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
