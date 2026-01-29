# Scripts Directory

This directory contains helper scripts for local development and testing.

## Available Scripts

### 🚀 `start-local-dev.sh` / `start-local-dev.ps1`

Automated script to start the full local development environment.

**Usage (Windows PowerShell):**
```powershell
.\scripts\start-local-dev.ps1
```

**Usage (Linux/Mac):**
```bash
./scripts/start-local-dev.sh
```

**What it does:**
1. Checks if Docker is running
2. Starts local Supabase (`npx supabase start`)
3. Displays connection information
4. Verifies `.env` configuration
5. Starts Astro dev server (`npm run dev`)

**Requirements:**
- Docker Desktop must be running
- Node.js 22.14.0+
- Supabase CLI

---

### 👤 `create-test-user.sql`

SQL script to create a test parent user and sample child profiles for testing.

**Usage via Supabase Studio:**
1. Open http://localhost:54323
2. Go to SQL Editor
3. Copy and paste the content of this file
4. Click **RUN**

**Usage via CLI:**
```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -f scripts/create-test-user.sql
```

**What it creates:**

**Test Parent Account:**
- Email: `testparent@example.com`
- Password: `password123`
- UUID: `9afae696-c49f-4b2e-b7b2-5f0be3901498`

**Child Profiles (3/5):**
1. Zosia - Miś (avatar-1.svg)
2. Janek - Królik (avatar-2.svg)
3. Ania - Lew (avatar-3.svg)

*2 profile slots remain available for testing the "Add Profile" functionality*

---

## Testing Workflow

### Quick Start (First Time)

```bash
# 1. Start Docker Desktop (manual step)

# 2. Run the setup script
.\scripts\start-local-dev.ps1

# 3. In another terminal, create test user
psql postgresql://postgres:postgres@localhost:54322/postgres -f scripts/create-test-user.sql

# 4. Test the profiles view
# - Demo: http://localhost:3000/profiles-demo
# - Full: http://localhost:3000/profiles (requires login)
```

### Subsequent Runs

If Supabase is already running:

```bash
# Just start the dev server
npm run dev

# Access:
# - App: http://localhost:3000
# - Studio: http://localhost:54323
```

---

## Environment Variables

The scripts expect these environment variables in `.env`:

```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=<your-anon-key-from-supabase-status>
```

Get your anon key by running:
```bash
npx supabase status
```

---

## Troubleshooting

### Docker not running
```
Error: failed to connect to docker API
```

**Solution:** Start Docker Desktop and wait for it to fully initialize.

### Supabase already running
```
Error: port 54321 already in use
```

**Solution:**
```bash
npx supabase stop
npx supabase start
```

### Test user already exists
```
Error: duplicate key value violates unique constraint
```

**Solution:** This is expected if you've run the script before. The user already exists.

---

## Additional Resources

- [Full Testing Guide](../docs/testing-profiles-view-guide.md)
- [Implementation Status](../.ai/profiles-view-finalization-status.md)
- [Supabase Documentation](https://supabase.com/docs)

---

**Last Updated:** 2026-01-28
**Maintainer:** Claude Code
