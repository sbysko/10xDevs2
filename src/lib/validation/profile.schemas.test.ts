/**
 * Unit Tests for Profile Validation Schemas
 *
 * Tests cover critical validation rules:
 * - display_name validation (length, characters)
 * - avatar_url validation (pattern matching, security)
 * - language_code validation (enum, defaults)
 * - Edge cases and security concerns (XSS, path traversal)
 *
 * Key Business Rules (from CLAUDE.md and profile.schemas.ts):
 * - display_name: 2-50 characters, Unicode letters and spaces only
 * - avatar_url: Must match "avatars/avatar-[1-8].svg" or be null
 * - language_code: Must be 'pl' or 'en', defaults to 'pl'
 * - Security: Prevent XSS, path traversal attacks
 */

import { describe, it, expect } from "vitest";
import { CreateProfileSchema } from "./profile.schemas";
import type { CreateProfileInput } from "./profile.schemas";

// ===================================================================
// TEST SUITE: display_name Validation
// ===================================================================

describe("CreateProfileSchema - display_name Validation", () => {
  it("should accept valid display name with 2 characters", () => {
    const input = {
      display_name: "Al",
    };

    const result = CreateProfileSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.display_name).toBe("Al");
    }
  });

  it("should accept valid display name with 50 characters", () => {
    const input = {
      display_name: "A".repeat(50), // Exactly 50 characters
    };

    const result = CreateProfileSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.display_name).toHaveLength(50);
    }
  });

  it("should accept display name with Unicode letters (Polish characters)", () => {
    const input = {
      display_name: "Zofia Łąka",
    };

    const result = CreateProfileSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.display_name).toBe("Zofia Łąka");
    }
  });

  it("should accept display name with spaces", () => {
    const input = {
      display_name: "Jan Kowalski",
    };

    const result = CreateProfileSchema.safeParse(input);

    expect(result.success).toBe(true);
  });

  it("should reject display name with only 1 character", () => {
    const input = {
      display_name: "M",
    };

    const result = CreateProfileSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Display name must be at least 2 characters");
    }
  });

  it("should reject display name with more than 50 characters", () => {
    const input = {
      display_name: "A".repeat(51), // 51 characters
    };

    const result = CreateProfileSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Display name must be at most 50 characters");
    }
  });

  it("should reject display name with digits", () => {
    const input = {
      display_name: "Maria123",
    };

    const result = CreateProfileSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Display name must contain only letters and spaces");
    }
  });

  it("should reject display name with special characters (@, #, etc.)", () => {
    const invalidNames = ["Jan@Home", "Maria#1", "Test!", "User_Name", "Name.Test"];

    invalidNames.forEach((name) => {
      const result = CreateProfileSchema.safeParse({ display_name: name });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Display name must contain only letters and spaces");
      }
    });
  });

  it("should reject empty display name", () => {
    const input = {
      display_name: "",
    };

    const result = CreateProfileSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Display name must be at least 2 characters");
    }
  });

  it("should reject missing display_name (required field)", () => {
    const input = {
      avatar_url: "avatars/avatar-1.svg",
    };

    const result = CreateProfileSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Display name is required");
    }
  });

  it("should reject display_name with wrong type (number)", () => {
    const input = {
      display_name: 12345,
    };

    const result = CreateProfileSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Display name must be a string");
    }
  });
});

// ===================================================================
// TEST SUITE: avatar_url Validation
// ===================================================================

describe("CreateProfileSchema - avatar_url Validation", () => {
  it("should accept valid avatar URLs (avatar-1 to avatar-8)", () => {
    for (let i = 1; i <= 8; i++) {
      const input = {
        display_name: "Maria",
        avatar_url: `avatars/avatar-${i}.svg`,
      };

      const result = CreateProfileSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.avatar_url).toBe(`avatars/avatar-${i}.svg`);
      }
    }
  });

  it("should accept null avatar_url (no avatar selected)", () => {
    const input = {
      display_name: "Maria",
      avatar_url: null,
    };

    const result = CreateProfileSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.avatar_url).toBeNull();
    }
  });

  it("should accept undefined avatar_url (optional field)", () => {
    const input = {
      display_name: "Maria",
      // avatar_url not provided
    };

    const result = CreateProfileSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.avatar_url).toBeUndefined();
    }
  });

  it("should reject avatar-0 (out of range)", () => {
    const input = {
      display_name: "Maria",
      avatar_url: "avatars/avatar-0.svg",
    };

    const result = CreateProfileSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("Avatar must be one of the predefined options");
    }
  });

  it("should reject avatar-9 (out of range)", () => {
    const input = {
      display_name: "Maria",
      avatar_url: "avatars/avatar-9.svg",
    };

    const result = CreateProfileSchema.safeParse(input);

    expect(result.success).toBe(false);
  });

  it("should reject custom avatar paths (security: path traversal)", () => {
    const maliciousPaths = [
      "../../../etc/passwd",
      "custom/avatar.svg",
      "/absolute/path/avatar.svg",
      "avatars/../sensitive/file.svg",
      "avatars/./avatar-1.svg",
    ];

    maliciousPaths.forEach((path) => {
      const result = CreateProfileSchema.safeParse({
        display_name: "Maria",
        avatar_url: path,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("Avatar must be one of the predefined options");
      }
    });
  });

  it("should reject avatar with wrong file extension", () => {
    const input = {
      display_name: "Maria",
      avatar_url: "avatars/avatar-1.png", // Should be .svg
    };

    const result = CreateProfileSchema.safeParse(input);

    expect(result.success).toBe(false);
  });

  it("should reject avatar with extra path segments", () => {
    const input = {
      display_name: "Maria",
      avatar_url: "public/avatars/avatar-1.svg",
    };

    const result = CreateProfileSchema.safeParse(input);

    expect(result.success).toBe(false);
  });
});

// ===================================================================
// TEST SUITE: language_code Validation
// ===================================================================

describe("CreateProfileSchema - language_code Validation", () => {
  it('should accept "pl" (Polish)', () => {
    const input = {
      display_name: "Maria",
      language_code: "pl" as const,
    };

    const result = CreateProfileSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.language_code).toBe("pl");
    }
  });

  it('should accept "en" (English)', () => {
    const input = {
      display_name: "Maria",
      language_code: "en" as const,
    };

    const result = CreateProfileSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.language_code).toBe("en");
    }
  });

  it('should default to "pl" if not provided', () => {
    const input = {
      display_name: "Maria",
      // language_code not provided
    };

    const result = CreateProfileSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.language_code).toBe("pl");
    }
  });

  it("should reject unsupported language codes", () => {
    const unsupportedCodes = ["de", "fr", "es", "it", "ru", "zh"];

    unsupportedCodes.forEach((code) => {
      const result = CreateProfileSchema.safeParse({
        display_name: "Maria",
        language_code: code,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Language must be 'pl' or 'en'");
      }
    });
  });

  it("should reject invalid language code formats", () => {
    const invalidFormats = ["PL", "EN", "pl-PL", "en-US", "polish"];

    invalidFormats.forEach((code) => {
      const result = CreateProfileSchema.safeParse({
        display_name: "Maria",
        language_code: code,
      });

      expect(result.success).toBe(false);
    });
  });
});

// ===================================================================
// TEST SUITE: Complete Valid Inputs
// ===================================================================

describe("CreateProfileSchema - Complete Valid Inputs", () => {
  it("should accept minimal valid input (only display_name)", () => {
    const input = {
      display_name: "Maria",
    };

    const result = CreateProfileSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.display_name).toBe("Maria");
      expect(result.data.avatar_url).toBeUndefined();
      expect(result.data.language_code).toBe("pl"); // Default
    }
  });

  it("should accept complete valid input (all fields)", () => {
    const input: CreateProfileInput = {
      display_name: "Maria",
      avatar_url: "avatars/avatar-1.svg",
      language_code: "pl",
    };

    const result = CreateProfileSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(input);
    }
  });

  it("should accept input with null avatar and English language", () => {
    const input = {
      display_name: "John",
      avatar_url: null,
      language_code: "en" as const,
    };

    const result = CreateProfileSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.display_name).toBe("John");
      expect(result.data.avatar_url).toBeNull();
      expect(result.data.language_code).toBe("en");
    }
  });
});

// ===================================================================
// TEST SUITE: Security Edge Cases
// ===================================================================

describe("CreateProfileSchema - Security Edge Cases", () => {
  it("should prevent XSS via display_name (script tags)", () => {
    const xssAttempts = ['<script>alert("XSS")</script>', "Maria<script>alert(1)</script>", "'; DROP TABLE users;--"];

    xssAttempts.forEach((malicious) => {
      const result = CreateProfileSchema.safeParse({
        display_name: malicious,
      });

      // Should fail regex validation (no special characters)
      expect(result.success).toBe(false);
    });
  });

  it("should prevent SQL injection via display_name", () => {
    const sqlInjections = ["'; DROP TABLE profiles;--", "1' OR '1'='1", "admin'--"];

    sqlInjections.forEach((malicious) => {
      const result = CreateProfileSchema.safeParse({
        display_name: malicious,
      });

      // Should fail regex validation (no special characters)
      expect(result.success).toBe(false);
    });
  });

  it("should prevent path traversal via avatar_url", () => {
    const pathTraversalAttempts = [
      "../../../etc/passwd",
      "..\\..\\..\\windows\\system32\\config\\sam",
      "avatars/../../../etc/passwd",
      "./avatars/avatar-1.svg",
    ];

    pathTraversalAttempts.forEach((malicious) => {
      const result = CreateProfileSchema.safeParse({
        display_name: "Maria",
        avatar_url: malicious,
      });

      // Should fail pattern validation
      expect(result.success).toBe(false);
    });
  });

  it("should prevent URL injection via avatar_url", () => {
    const urlInjections = [
      "http://malicious.com/avatar.svg",
      "https://evil.com/steal-data",
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
    ];

    urlInjections.forEach((malicious) => {
      const result = CreateProfileSchema.safeParse({
        display_name: "Maria",
        avatar_url: malicious,
      });

      // Should fail pattern validation (only avatars/avatar-[1-8].svg allowed)
      expect(result.success).toBe(false);
    });
  });
});

// ===================================================================
// TEST SUITE: Type Safety
// ===================================================================

describe("CreateProfileSchema - Type Safety", () => {
  it("should infer correct TypeScript types", () => {
    const input = {
      display_name: "Maria",
      avatar_url: "avatars/avatar-1.svg",
      language_code: "pl" as const,
    };

    const result = CreateProfileSchema.safeParse(input);

    if (result.success) {
      // Type assertions to verify TypeScript inference
      const data: CreateProfileInput = result.data;

      expect(typeof data.display_name).toBe("string");
      expect(data.avatar_url === null || typeof data.avatar_url === "string" || data.avatar_url === undefined).toBe(
        true
      );
      expect(data.language_code === "pl" || data.language_code === "en" || data.language_code === undefined).toBe(true);
    }
  });

  it("should handle extra unknown fields (strip mode)", () => {
    const input = {
      display_name: "Maria",
      extra_field: "should be ignored",
      another_unknown: 123,
    };

    const result = CreateProfileSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      // Zod strips unknown fields by default
      expect(result.data).not.toHaveProperty("extra_field");
      expect(result.data).not.toHaveProperty("another_unknown");
    }
  });
});
