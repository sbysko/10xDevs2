# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Dopasuj Obrazek do Słowa** (Match Picture to Word) is an educational web game for children aged 4-6 to learn Polish vocabulary through interactive picture-to-word matching. The application features parent authentication, multi-child profile management (max 5 profiles), 250 Polish words across 5 categories, star-based progress tracking, and cloud-synchronized learning data.

**Target Users:** Children 4-6 years (primary) and their parents/guardians (account managers)
**MVP Timeline:** 7 days @ 1-2 hours/day (7-14 hours total)
**Node Version:** 22.14.0 (see `.nvmrc`)

## Tech Stack

- **Framework:** Astro 5 with hybrid rendering (SSR for auth, CSR for game)
- **UI Library:** React 19 with TypeScript 5
- **Styling:** Tailwind CSS 4 + Shadcn/UI components
- **Backend:** Supabase (PostgreSQL + GoTrue Auth + Storage)
- **Deployment:** Vercel (optimized for Astro)
- **Dev Server Port:** 3000 (configured in `astro.config.mjs`)

## Common Commands

### Development
```bash
npm run dev              # Start dev server on http://localhost:3000
npm run build            # Build for production (SSR mode)
npm run preview          # Preview production build
```

### Code Quality
```bash
npm run lint             # Check code with ESLint
npm run lint:fix         # Auto-fix linting issues
npm run format           # Format code with Prettier
```

### Supabase CLI
```bash
npx supabase migration new <description>    # Create new migration file
npx supabase db reset                       # Reset local database
npx supabase gen types typescript --local > src/db/database.types.ts  # Regenerate types
```

### Pre-commit Hooks
Husky + lint-staged automatically runs on staged files:
- `*.{ts,tsx,astro}` → ESLint with auto-fix
- `*.{json,css,md}` → Prettier formatting

## Project Architecture

### Directory Structure

```
./src
├── layouts/           # Astro layouts (common page structures)
├── pages/             # Astro pages (file-based routing)
│   └── api/          # API endpoints (server-side)
├── middleware/        # Astro middleware (index.ts)
├── db/               # Supabase clients and database types
│   └── database.types.ts  # Auto-generated from Supabase
├── types.ts          # Shared DTOs and entities (frontend + backend)
├── components/       # UI components
│   ├── ui/          # Shadcn/UI components
│   ├── *.astro      # Static Astro components
│   └── *.tsx        # Dynamic React components
├── lib/             # Services and helpers
│   └── utils.ts     # Utility functions (cn helper, etc.)
├── assets/          # Static internal assets
└── public/          # Public static files
```

### Key Architectural Patterns

#### 1. Hybrid Rendering Strategy
- **SSR (Server-Side):** Authentication pages, profile management (security-critical)
- **CSR (Client-Side):** Game session (interactive, real-time state)
- Configure per-page with `export const prerender = false` in API routes

#### 2. Database Architecture (3 Core Tables)

**profiles**
- Child profiles linked to parent via `parent_id` (FK to `auth.users`)
- Fields: `id`, `parent_id`, `display_name`, `avatar_url`, `language_code`, timestamps
- Max 5 profiles per parent (enforced by DB trigger `check_profile_limit`)

**vocabulary**
- 250 Polish words across 5 categories (read-only for users)
- Categories: `zwierzeta`, `owoce_warzywa`, `pojazdy`, `kolory_ksztalty`, `przedmioty_codzienne`
- Fields: `id`, `word_text`, `category`, `language_code`, `image_path`, `difficulty_level`

**user_progress**
- M:N relationship between profiles and vocabulary
- Tracks mastery, stars, attempts per child per word
- Fields: `profile_id`, `vocabulary_id`, `is_mastered`, `stars_earned`, `attempts_count`, `last_attempted_at`
- UPSERT pattern used for progress updates

**Key Database Functions:**
- `get_next_words()` - Implements 80/20 algorithm (80% unmastered + 20% mastered words)
- `profile_stats` VIEW - Aggregates total_stars, words_mastered, mastery_percentage

#### 3. Row Level Security (RLS)

All tables have RLS enabled with granular policies:
- **profiles:** Parent can only access their own children (`parent_id = auth.uid()`)
- **user_progress:** Access filtered through profiles ownership check
- **vocabulary:** Public read-only for authenticated users

RLS policies are split per operation (SELECT, INSERT, UPDATE, DELETE) and per role (`anon`, `authenticated`).

#### 4. Authentication Flow

- Managed by Supabase Auth (GoTrue)
- JWT tokens in Authorization header: `Bearer <token>`
- Access Supabase client via `context.locals.supabase` in Astro routes (NOT direct import)
- Use `SupabaseClient` type from `src/db/supabase.client.ts`, not from `@supabase/supabase-js`
- Middleware in `src/middleware/index.ts` injects Supabase client into `context.locals`

#### 5. API Endpoint Structure

Located in `src/pages/api/`, using Astro server endpoints:
- Use uppercase HTTP method handlers: `GET`, `POST`, `PATCH`, `DELETE`
- Always add `export const prerender = false` for API routes
- Validation with Zod schemas (define schemas inline or in separate validation files)
- Extract business logic into services in `src/lib/services/`

**Zod Validation Pattern:**
```typescript
import { z } from 'zod';

const schema = z.object({
  display_name: z.string().min(1).max(50),
  avatar_url: z.string().url().optional().nullable()
});

// Validate request body
const validated = schema.parse(requestBody);
```

#### 6. Type System Strategy

**snake_case everywhere:** Database, TypeScript types, API responses all use `snake_case` (no camelCase conversion)

**Type sources:**
- `src/db/database.types.ts` - Auto-generated from Supabase schema (base types)
- `src/types.ts` - DTOs for API requests/responses (derived from database types)

**Naming conventions:**
- Timestamps: `*_at` suffix (`created_at`, `last_attempted_at`)
- Counters: `*_count` suffix (`attempts_count`, `word_count`)
- Booleans: `is_*` prefix (`is_mastered`, `is_correct`)
- Foreign keys: `*_id` suffix (`profile_id`, `vocabulary_id`)
- Aggregations: `total_*` prefix (`total_stars`, `total_words_attempted`)

#### 7. 80/20 Learning Algorithm

Implemented in `get_next_words()` database function:
1. Prioritize unknown words (no `user_progress` record)
2. If known words exist: 80% unmastered (`is_mastered = false`) + 20% mastered for review
3. Order mastered words by `last_attempted_at` ASC (oldest first)
4. Random shuffle final selection

#### 8. Stars & Mastery Logic

Stars awarded based on attempt number:
- 1st attempt correct: 3 stars
- 2nd attempt correct: 2 stars
- 3rd+ attempt correct: 1 star
- Incorrect: 0 stars (unlimited retries)

`is_mastered = true` when answered correctly (remains true even if answered wrong later).

## Supabase Database Migrations

### Migration File Naming Convention
Files must be in `supabase/migrations/` with format:
```
YYYYMMDDHHmmss_description.sql
```
Example: `20260126120000_initial_schema_setup.sql`

### SQL Guidelines
- Write lowercase SQL
- Include header comments with migration metadata
- Enable RLS on all tables (even public ones)
- Granular RLS policies: one per operation (SELECT, INSERT, UPDATE, DELETE) and per role (`anon`, `authenticated`)
- Add copious comments for destructive operations
- Never combine policies even if functionality is identical

## Development Best Practices

### General Guidelines

- Use feedback from linters to improve code quality
- Prioritize error handling and edge cases
- Handle errors and edge cases at the beginning of functions
- Use early returns for error conditions to avoid deeply nested if statements
- Place the happy path last in the function for improved readability
- Avoid unnecessary `else` statements; use if-return pattern instead
- Use guard clauses to handle preconditions and invalid states early
- Implement proper error logging with user-friendly error messages

### Frontend

**Component Selection:**
- Use Astro components (.astro) for static content and layout
- Implement React components (.tsx) only when interactivity is needed

**Styling with Tailwind:**
- Use the `@layer` directive to organize styles into components, utilities, and base layers
- Use arbitrary values with square brackets (e.g., `w-[123px]`) for precise one-off designs
- Implement dark mode with the `dark:` variant
- Use responsive variants (`sm:`, `md:`, `lg:`, etc.) for adaptive designs
- Leverage state variants (`hover:`, `focus-visible:`, `active:`, etc.) for interactive elements

**Accessibility (ARIA Best Practices):**
- Use ARIA landmarks to identify regions of the page (main, navigation, search, etc.)
- Apply appropriate ARIA roles to custom interface elements that lack semantic HTML equivalents
- Set `aria-expanded` and `aria-controls` for expandable content like accordions and dropdowns
- Use `aria-live` regions with appropriate politeness settings for dynamic content updates
- Implement `aria-hidden` to hide decorative or duplicative content from screen readers
- Apply `aria-label` or `aria-labelledby` for elements without visible text labels
- Use `aria-describedby` to associate descriptive text with form inputs or complex elements
- Implement `aria-current` for indicating the current item in a set, navigation, or process
- Avoid redundant ARIA that duplicates the semantics of native HTML elements

### Backend and Database

- Use Supabase for backend services, including authentication and database interactions
- Follow Supabase guidelines for security and performance
- Use Zod schemas to validate data exchanged with the backend
- Use Supabase client from `context.locals.supabase` in Astro routes (never import directly)
- Use `SupabaseClient` type from `src/db/supabase.client.ts`, not from `@supabase/supabase-js`

### Astro-Specific

- Leverage View Transitions API for smooth page transitions (use ClientRouter)
- Use content collections with type safety for blog posts, documentation, etc.
- Leverage Server Endpoints for API routes
- Use `POST`, `GET` - uppercase format for endpoint handlers
- Use `export const prerender = false` for API routes
- Use Zod for input validation in API routes
- Extract logic into services in `src/lib/services`
- Implement middleware for request/response modification
- Use image optimization with the Astro Image integration
- Implement hybrid rendering with server-side rendering where needed
- Use `Astro.cookies` for server-side cookie management
- Leverage `import.meta.env` for environment variables

### React-Specific

- Use functional components with hooks instead of class components
- Never use "use client" and other Next.js directives (we use React with Astro)
- Extract logic into custom hooks in `src/components/hooks`
- Implement `React.memo()` for expensive components that render often with the same props
- Utilize `React.lazy()` and Suspense for code-splitting and performance optimization
- Use the `useCallback` hook for event handlers passed to child components to prevent unnecessary re-renders
- Prefer `useMemo` for expensive calculations to avoid recomputation on every render
- Implement `useId()` for generating unique IDs for accessibility attributes
- Consider using the `useOptimistic` hook for optimistic UI updates in forms
- Use `useTransition` for non-urgent state updates to keep the UI responsive

### Supabase-Auth-Specific
@./cursor/rules/supabase-auth.mdc

### shadcn/ui-Specific
@./cursor/rules/ui-shadcn-helper.mdc

## Environment Variables

Required in `.env`:
```env
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Performance Targets

From PRD metrics:
- LCP (Largest Contentful Paint): < 2 seconds
- Fetch 10 game questions: < 500ms
- UPSERT progress: < 200ms
- Fetch progress tracker: < 300ms

## Success Metrics (MVP)

- 20+ registered families in first month
- 15+ mastered words per child in first week
- 40%+ day-1 retention rate
- Zero critical bugs

## Key Business Rules

1. **Profile Limits:** Max 5 child profiles per parent account (DB trigger enforced)
2. **Profile Deletion:** Cannot delete last remaining profile (prevent orphaned accounts)
3. **Language:** Polish only for MVP (structure supports multilingual in future)
4. **Game Session:** 10 questions per session
5. **Categories:** 50 words per category × 5 categories = 250 total
6. **Privacy:** Minimal data collection (GDPR/COPPA compliant - no child PII beyond display name)

## Important Files

- `prd.md` - Product Requirements Document (full feature specifications)
- `db-plan.md` - Complete database schema documentation
- `api-plan.md` - REST API specification with all endpoints
- `tech-stack.md` - Technology choices and justification
- `20260126120000_initial_schema_setup.sql` - Initial database migration
- `types.ts` - DTO definitions for API communication
- `database.types.ts` - Auto-generated Supabase types

## Common Gotchas

1. **Don't use camelCase for database fields** - Everything is snake_case
2. **Always access Supabase via context.locals** - Never import client directly in routes
3. **API routes need `export const prerender = false`** - Otherwise Astro pre-renders them
4. **Use Zod for validation** - Standard practice for API endpoint input validation
5. **RLS is your authorization layer** - Don't reimplement access control in API code
6. **Astro server runs on port 3000** - Not the default 4321 (see astro.config.mjs)
