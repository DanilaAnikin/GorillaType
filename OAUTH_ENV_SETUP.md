# OAuth Environment Variables Configuration

This guide explains how to properly configure your environment variables for OAuth authentication with Gorilla Type.

## Overview

Your Gorilla Type application requires Supabase credentials to function. Supabase OAuth providers are configured in the Supabase dashboard and automatically handle the OAuth flow - you don't need to add provider secrets to your application code.

---

## Environment Variables Explained

### Required Variables

These variables are required for your application to connect to Supabase:

#### `NEXT_PUBLIC_SUPABASE_URL`

**What it is:** The URL endpoint for your Supabase project

**Format:** `https://[PROJECT_REF].supabase.co`

**Example:** `https://xyzabc123.supabase.co`

**Where to find it:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy "Project URL"

**Why NEXT_PUBLIC:** This is safe to be public because it only identifies your Supabase instance, not credentials

**In .env.local:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xyzabc123.supabase.co
```

---

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**What it is:** The anonymous/public API key for Supabase

**Format:** Long alphanumeric string starting with `eyJh...`

**Where to find it:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy "anon public" key

**Why NEXT_PUBLIC:** This is intentionally public. It has limited permissions and is safe to expose in browser code.

**What it allows:** Unauthenticated read/write to public data (limited by Row Level Security policies)

**In .env.local:**
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

#### `SUPABASE_SERVICE_ROLE_KEY`

**What it is:** The server-side API key with full admin access

**Format:** Long alphanumeric string starting with `eyJh...`

**Where to find it:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Scroll down to find "service_role" key
5. Copy it

**Why NOT NEXT_PUBLIC:** This is a secret that should NEVER be exposed to the browser. It has unrestricted access and could be dangerous if leaked.

**What it allows:** Full admin access to database, auth system, and all data

**In .env.local:**
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Never in .env.local for production:**
- Don't commit this to version control
- Keep it in `.gitignore` (already included)
- Only set in production through your hosting dashboard

---

### Optional Variables

These variables are optional but recommended for reference:

#### `NEXT_PUBLIC_APP_URL`

**What it is:** Your application's frontend URL

**Format:** Full URL including protocol

**Examples:**
- Development: `http://localhost:3000`
- Production: `https://gorilla-type.com`

**Where to use it:**
- OAuth redirect verification
- Session configuration
- Cookie domain settings

**In .env.local:**
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

#### OAuth Provider Client IDs (For Reference Only)

These can be added for reference, but are not required since Supabase handles OAuth:

```env
NEXT_PUBLIC_GITHUB_CLIENT_ID=abc123...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456...-abc.apps.googleusercontent.com
NEXT_PUBLIC_DISCORD_CLIENT_ID=123456789...
```

**Important:** NEVER add provider client secrets to your application code. Supabase securely manages these.

---

## Complete .env.local File Example

Here's what your complete `.env.local` file should look like:

```env
# ============================================
# SUPABASE CONFIGURATION (Required)
# ============================================

# Your Supabase project URL
NEXT_PUBLIC_SUPABASE_URL=https://xyzabc123.supabase.co

# Supabase anonymous/public key (safe to expose)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emFiYzEyMyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjk0NTA4ODAwLCJleHAiOjE5NTA0ODQ4MDB9.XXXXXXXXXXXXXXX

# Supabase service role key (server-side only - DO NOT EXPOSE TO BROWSER)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emFiYzEyMyIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2OTQ1MDg4MDAsImV4cCI6MTk1MDQ4NDgwMH0.XXXXXXXXXXXXXXX

# ============================================
# APPLICATION CONFIGURATION (Recommended)
# ============================================

# Your application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ============================================
# OAUTH PROVIDER CLIENT IDs (Optional Reference)
# ============================================
# Note: Secrets are handled by Supabase - DO NOT add them here

NEXT_PUBLIC_GITHUB_CLIENT_ID=abc123def456
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefghij.apps.googleusercontent.com
NEXT_PUBLIC_DISCORD_CLIENT_ID=987654321098765432
```

---

## Step-by-Step Setup Instructions

### 1. Copy the Template File

```bash
cd /home/anakin/programming/gorilla-type
cp .env.example .env.local
```

### 2. Get Your Supabase Credentials

1. Go to https://supabase.com/dashboard
2. Select your Gorilla Type project
3. Click Settings → API (left sidebar)
4. You'll see:
   - **Project URL** (copy this)
   - **anon public** key (copy this)
   - **service_role** key (copy this - scroll down if needed)

### 3. Edit .env.local

```bash
# Open the file in your editor
nano .env.local
```

Or use your preferred editor (VS Code, Vim, etc.)

### 4. Fill in Required Variables

Replace the placeholder values with your actual Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Save and Verify

```bash
# Verify the file was saved
cat .env.local

# Check that variables are loaded (in a new terminal after running dev)
npm run dev
```

### 6. Test Connection

```bash
# The development server should start without errors
# If there are errors about missing env vars, check that .env.local was saved correctly
```

---

## Environment Variables for Different Environments

### Development (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_dev_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**File location:** `/home/anakin/programming/gorilla-type/.env.local`

**Important:** This file is ignored by git (in `.gitignore`)

### Production

For production deployment (Vercel, Netlify, etc.):

1. **Never commit `.env.local` to git**
2. **Set variables in your hosting platform:**
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site settings → Build & deploy → Environment
   - Railway, Render, etc.: Project settings
3. **Variables to set:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (production domain)

**Production example:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xyzabc123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=https://gorilla-type.com
```

---

## Where Variables Are Used in Your Application

### Next.js Configuration

```typescript
// src/lib/supabase/client.ts (Frontend)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,      // Anon client for browser
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// src/lib/supabase/server.ts (Backend)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,      // Server client with full access
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### Authentication Flow

1. **Client-side:** Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to authenticate users
2. **Server-side:** Uses `SUPABASE_SERVICE_ROLE_KEY` for admin operations
3. **OAuth:** Supabase handles OAuth using credentials configured in the dashboard (not from env vars)

---

## Security Checklist

- [ ] `.env.local` is listed in `.gitignore` (should be present)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is NOT used in client-side code
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is NOT committed to git
- [ ] Production environment variables are set in hosting dashboard
- [ ] OAuth Client Secrets are NOT in environment variables
- [ ] OAuth Client Secrets are only stored in Supabase dashboard
- [ ] .env.local is not shared with team members (use docs instead)
- [ ] Credentials are rotated periodically

---

## Troubleshooting

### Problem: "Error: NEXT_PUBLIC_SUPABASE_URL is not defined"

**Cause:** The environment variable wasn't loaded

**Solution:**
1. Check `.env.local` exists in the project root
2. Verify the variable name is spelled correctly
3. Restart the development server: `npm run dev`
4. Check that `.env.local` contains the value

### Problem: "Supabase project not accessible"

**Cause:** Wrong URL or the Supabase project is down

**Solution:**
1. Verify the URL in `.env.local` is correct
2. Go to https://supabase.com/dashboard to confirm the project exists
3. Check that the project status is "Active"
4. Try copying the URL again from the dashboard

### Problem: "Permission denied" errors in app

**Cause:** Using wrong API key or Row Level Security policy blocks access

**Solution:**
1. Verify you're using the correct anon key (public key, not service role)
2. Check Supabase RLS policies: Database → Tables → [table] → RLS
3. Ensure policies allow the operation (SELECT, INSERT, UPDATE, etc.)

### Problem: OAuth providers show "Not configured"

**Cause:** OAuth credentials not added in Supabase dashboard (not env vars)

**Solution:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Authentication → Providers
4. Add credentials for each provider (GitHub, Google, Discord)
5. Verify toggle is ON for each provider

---

## Variables Reference

| Variable | Required | Public | Purpose |
|----------|----------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes | Supabase endpoint URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes | Public API key for browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes* | No | Admin API key for server |
| `NEXT_PUBLIC_APP_URL` | No | Yes | Application frontend URL |
| `NEXT_PUBLIC_GITHUB_CLIENT_ID` | No | Yes | GitHub OAuth reference (optional) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No | Yes | Google OAuth reference (optional) |
| `NEXT_PUBLIC_DISCORD_CLIENT_ID` | No | Yes | Discord OAuth reference (optional) |

*Required if using server-side features (API routes, middleware, database operations)

---

## Key Takeaways

1. **Required:** Supabase URL and both API keys
2. **Public (NEXT_PUBLIC_):** Safe in browser, limited permissions
3. **Private (no prefix):** Only in `.env.local` and production secrets, never in browser
4. **OAuth Secrets:** Managed by Supabase, NOT in your environment
5. **Security:** Keep `.env.local` out of git, rotate keys periodically
6. **Production:** Use hosting platform's environment variable management

---

**Last Updated:** 2026-01-25
**Project:** Gorilla Type
**Related Files:**
- OAUTH_SETUP_GUIDE.md
- OAUTH_QUICK_REFERENCE.md
- .env.example
- .env.local (local only, not in git)
