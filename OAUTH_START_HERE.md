# OAuth Setup - START HERE

**Welcome!** This file helps you get started with OAuth setup. Choose your path below.

---

## The 60-Second Overview

You need to:
1. Create OAuth apps on GitHub, Google, and Discord
2. Get Client ID and Secret from each
3. Add them to Supabase
4. Update your `.env.local` file
5. Test!

**Total time:** 1-2 hours depending on experience

---

## Pick Your Path

### Option A: "Just give me the checklist" (5 minutes)
→ Go to: **`OAUTH_QUICK_REFERENCE.md`**
- Quick URLs
- Credential templates
- Checklists to check off

### Option B: "Show me step-by-step with pictures" (30 minutes)
→ Go to: **`OAUTH_VISUAL_WALKTHROUGH.md`**
- ASCII diagrams of forms
- Detailed "click here" instructions
- Visual descriptions of each screen

### Option C: "I want the complete guide" (20 minutes)
→ Go to: **`OAUTH_SETUP_GUIDE.md`**
- Comprehensive instructions
- All details explained
- Troubleshooting section

### Option D: "Just explain the environment setup" (15 minutes)
→ Go to: **`OAUTH_ENV_SETUP.md`**
- What each env variable does
- Where to get values
- .env.local configuration

### Option E: "Show me everything organized" (reference)
→ Go to: **`OAUTH_DOCUMENTATION_INDEX.md`**
- Master index of all docs
- File descriptions
- Quick reference table

---

## The Fastest Path (For People in a Hurry)

1. Open: **`OAUTH_QUICK_REFERENCE.md`** (2 minutes)
2. Get the callback URL format
3. Visit each provider URL (GitHub, Google, Discord)
4. Fill in the templates while setting up
5. Add to Supabase dashboard
6. Update `.env.local`
7. Run `npm run dev` and test

**Total time:** ~30 minutes

---

## Your Callback URL

This is the same for all three providers. Replace `[PROJECT_REF]` with your Supabase project reference:

```
https://[PROJECT_REF].supabase.co/auth/v1/callback
```

**Find your Project Reference:**
1. Go to https://supabase.com/dashboard
2. Click your project
3. Go to Settings → General
4. Look for "Project Ref" - that's the part before `.supabase.co`

---

## The Three Providers You're Setting Up

### GitHub
- **Sign up URL:** https://github.com/settings/developers
- **App name:** Gorilla Type
- **Time to setup:** 5 minutes
- **Get:** Client ID + Client Secret

### Google
- **Sign up URL:** https://console.cloud.google.com/
- **App name:** Gorilla Type
- **Time to setup:** 15-20 minutes (most steps)
- **Get:** Client ID + Client Secret
- **Extra steps:** Create project, enable API, consent screen

### Discord
- **Sign up URL:** https://discord.com/developers/applications
- **App name:** Gorilla Type
- **Time to setup:** 5 minutes
- **Get:** Client ID + Client Secret

**Total provider setup time:** ~30 minutes

---

## Then Configure Supabase (10 minutes)

1. Go to https://supabase.com/dashboard
2. Select your Gorilla Type project
3. Go to Authentication → Providers
4. Enable and fill in credentials for each provider
5. Done!

---

## Then Update .env.local (5 minutes)

Create/update file: `/home/anakin/programming/gorilla-type/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
SUPABASE_SERVICE_ROLE_KEY=your_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Quick Answers

**Q: What's a Client ID?**
A: A public identifier for your app. Safe to show.

**Q: What's a Client Secret?**
A: A password-like secret. Keep it private. Save it immediately when shown.

**Q: Where do I put Client IDs and Secrets?**
A: In the Supabase dashboard. NOT in your code.

**Q: What's that callback URL for?**
A: After user logs in to GitHub/Google/Discord, they get sent back to that URL.

**Q: Do I need all three providers?**
A: No, just set up the ones you want. But all three only takes ~45 minutes.

**Q: What goes in .env.local?**
A: Your Supabase connection info (not the OAuth secrets).

**Q: Is .env.local in git?**
A: NO! It's in .gitignore for security.

---

## Red Flags - Stop and Read This

❌ **If you see:** "Invalid redirect URI"
→ Check that callback URL matches EXACTLY in all places

❌ **If you see:** "Client authentication failed"
→ You probably copied a Client ID and Secret wrong. Recopy carefully.

❌ **If you see:** "Provider disabled"
→ You need to toggle it ON in Supabase dashboard

❌ **If you get stuck:**
→ Check the Troubleshooting section in OAUTH_SETUP_GUIDE.md

---

## Testing It Works (5 minutes)

After everything is set up:

```bash
cd /home/anakin/programming/gorilla-type
npm run dev
```

Then:
1. Go to http://localhost:3000
2. Click "Sign In" or "Login"
3. Try "Sign in with GitHub"
4. Try "Sign in with Google"
5. Try "Sign in with Discord"

Each should work!

---

## File Structure

```
gorilla-type/
├── OAUTH_START_HERE.md ← You are here
├── OAUTH_QUICK_REFERENCE.md ← Best for checklists
├── OAUTH_VISUAL_WALKTHROUGH.md ← Best for visual learners
├── OAUTH_SETUP_GUIDE.md ← Best for complete guide
├── OAUTH_ENV_SETUP.md ← Best for environment variables
├── OAUTH_DOCUMENTATION_INDEX.md ← Master index
├── .env.example ← Template (copy this)
└── .env.local ← Your actual config (not in git)
```

---

## The Right Doc for You

| You are... | Read This... | Time |
|-----------|--------------|------|
| A beginner | OAUTH_VISUAL_WALKTHROUGH.md | 30 min |
| Experienced | OAUTH_QUICK_REFERENCE.md | 10 min |
| Need details | OAUTH_SETUP_GUIDE.md | 20 min |
| Confused about env | OAUTH_ENV_SETUP.md | 15 min |
| Want everything | OAUTH_DOCUMENTATION_INDEX.md | 5 min |

---

## Let's Go!

**Are you ready?** Pick your path at the top and start reading!

Or if you know what you're doing, just jump to:
- **OAUTH_QUICK_REFERENCE.md** - credential templates and URLs

---

## Still here? Let me tell you what happens next...

### Step 1: Create GitHub App (5 min)
Go to https://github.com/settings/developers, create app, get credentials

### Step 2: Create Google App (15 min)
Go to https://console.cloud.google.com/, create project, create OAuth app, get credentials

### Step 3: Create Discord App (5 min)
Go to https://discord.com/developers/applications, create app, get credentials

### Step 4: Add to Supabase (10 min)
Go to https://supabase.com/dashboard, add all three providers

### Step 5: Configure .env.local (5 min)
Copy `.env.example` to `.env.local` and fill in your Supabase info

### Step 6: Test (5 min)
Run `npm run dev` and test each OAuth provider

---

## 🚀 Ready to Start?

Pick a document above and begin! Or if you're experienced, just grab:

**OAUTH_QUICK_REFERENCE.md** - Everything you need on one page

---

**Questions while reading?**
- GitHub/Google/Discord specific → OAUTH_SETUP_GUIDE.md
- Environment variables → OAUTH_ENV_SETUP.md
- Need visual guide → OAUTH_VISUAL_WALKTHROUGH.md
- Need quick lookup → OAUTH_QUICK_REFERENCE.md

**Let's get you set up!**

---

*Last Updated: 2026-01-25*
*Project: Gorilla Type*
