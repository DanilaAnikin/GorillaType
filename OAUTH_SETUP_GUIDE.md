# Complete OAuth Setup Guide for Supabase

This comprehensive guide walks you through setting up GitHub, Google, and Discord OAuth authentication with your Supabase project for the Gorilla Type application.

**Prerequisites:**
- Active Supabase project already created
- Your Supabase Project Reference (find it in: Dashboard → Project Settings → General → Project Ref)
- Your Supabase Project URL (format: `https://[PROJECT_REF].supabase.co`)

> **Important:** Your callback URL for all providers will be:
> ```
> https://[PROJECT_REF].supabase.co/auth/v1/callback
> ```
> Replace `[PROJECT_REF]` with your actual project reference (the subdomain part of your Supabase URL).

---

## Table of Contents

1. [GitHub OAuth Setup](#1-github-oauth-setup)
2. [Google OAuth Setup](#2-google-oauth-setup)
3. [Discord OAuth Setup](#3-discord-oauth-setup)
4. [Supabase Dashboard Configuration](#4-supabase-dashboard-configuration)
5. [Environment Variables](#5-environment-variables)
6. [Testing Your Setup](#6-testing-your-setup)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. GitHub OAuth Setup

### Step 1: Access GitHub Developer Settings

1. Go to **https://github.com/settings/developers**
   - Or: GitHub → Settings (top right) → Developer settings (left sidebar) → OAuth Apps

### Step 2: Create a New OAuth Application

1. Click **"New OAuth App"** button
2. Fill in the form with the following details:

| Field | Value |
|-------|-------|
| **Application name** | Gorilla Type |
| **Homepage URL** | `https://yourdomain.com` (or `http://localhost:3000` for development) |
| **Application description** | A modern typing test application |
| **Authorization callback URL** | `https://[PROJECT_REF].supabase.co/auth/v1/callback` |

Example for local development:
- Homepage URL: `http://localhost:3000`
- Callback URL: `https://your-project-ref.supabase.co/auth/v1/callback`

### Step 3: Retrieve GitHub OAuth Credentials

1. After creating the app, you'll see the **Client ID** on the app page
2. Click **"Generate a new client secret"** button
3. Copy and save both:
   - **Client ID**
   - **Client Secret** (only shown once - save it immediately!)

### Step 4: (Optional) Configure Application Settings

1. You can optionally set:
   - **User authorization callback URL** (same as above)
   - **Webhook URL** (if needed)
   - **Permissions** (typically default settings are fine)

### Step 5: Verify GitHub Setup

- Client ID format: Usually 20-40 alphanumeric characters
- Client Secret format: Usually 40 alphanumeric characters

**Proceed to Supabase Configuration below ↓**

---

## 2. Google OAuth Setup

### Step 1: Access Google Cloud Console

1. Go to **https://console.cloud.google.com/**
2. Sign in with your Google account
3. Accept the terms and conditions if prompted

### Step 2: Create a New Project

1. Click the **Project dropdown** at the top (showing "My First Project" or similar)
2. Click **"NEW PROJECT"** button
3. Enter project details:
   - **Project name:** `Gorilla Type` (or any preferred name)
   - **Organization:** Leave as default (optional)
4. Click **"CREATE"**
5. Wait for the project to be created (you'll see a notification)
6. Click the notification to go to your new project, or click the Project dropdown and select it

### Step 3: Enable the Google+ API

1. In the left sidebar, click **"APIs & Services"**
2. Click **"Enabled APIs & services"**
3. Click **"+ ENABLE APIS AND SERVICES"** button at the top
4. Search for **"Google+ API"**
5. Click on **"Google+ API"** result
6. Click **"ENABLE"** button
7. You'll see "API enabled" confirmation

> **Note:** The Google+ API appears deprecated in some GCP versions. If you can't find it, search for **"Google Identity"** or **"Identity and Access Management API"** instead.

### Step 4: Create OAuth 2.0 Credentials

1. In the left sidebar, go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** button at the top
3. Select **"OAuth client ID"**
4. You'll be prompted to configure the OAuth consent screen first. Click **"CONFIGURE CONSENT SCREEN"**

### Step 5: Configure OAuth Consent Screen

1. **User Type Selection:**
   - Select **"External"** (unless you're in a Google Workspace organization)
   - Click **"CREATE"**

2. **OAuth Consent Screen - Step 1: App information**
   - **App name:** `Gorilla Type`
   - **User support email:** Your email address
   - **App logo:** (Optional) Leave blank or upload logo
   - Click **"SAVE AND CONTINUE"**

3. **Step 2: Scopes**
   - Click **"ADD OR REMOVE SCOPES"**
   - Check these scopes:
     - `userinfo.email`
     - `userinfo.profile`
     - `openid`
   - Click **"UPDATE"**
   - Click **"SAVE AND CONTINUE"**

4. **Step 3: Test users** (Optional)
   - You can add test user emails if needed
   - Click **"SAVE AND CONTINUE"**

5. **Step 4: Summary**
   - Review the information
   - Click **"BACK TO DASHBOARD"** or **"CREATE CREDENTIALS"** (button varies)

### Step 6: Create OAuth 2.0 Client ID

1. Go back to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. **Application type:** Select **"Web application"**
4. **Name:** `Gorilla Type Web`
5. **Authorized JavaScript origins:** Add the following:
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production, if applicable)
6. **Authorized redirect URIs:** Add:
   - `https://[PROJECT_REF].supabase.co/auth/v1/callback`
7. Click **"CREATE"**

### Step 7: Retrieve Google OAuth Credentials

A modal will appear with your credentials:
- **Client ID** (format: `[numbers]-[alphanumeric].apps.googleusercontent.com`)
- **Client Secret** (format: long alphanumeric string)

Copy and save both values. You can also access them later from Credentials page by clicking on the OAuth 2.0 Client ID entry.

**Proceed to Supabase Configuration below ↓**

---

## 3. Discord OAuth Setup

### Step 1: Access Discord Developer Portal

1. Go to **https://discord.com/developers/applications**
2. Sign in with your Discord account
3. Click **"New Application"** button in the top right

### Step 2: Create a New Application

1. **Application name:** `Gorilla Type`
2. Check the **"Terms of Service"** checkbox
3. Click **"Create"**

### Step 3: Navigate to OAuth Settings

1. In the left sidebar, click **"OAuth2"**
2. You'll see the **General** tab with:
   - **Client ID**
   - **Client Secret** button
3. Copy the **Client ID** and save it

### Step 4: Generate Client Secret

1. On the OAuth2 page, find the **Client Secret** section
2. Click **"Reset Secret"** button
3. Click **"Yes, do it!"** in the confirmation dialog
4. A new Client Secret will be generated
5. Copy and save it immediately (it won't be shown again)

### Step 5: Configure Redirect URIs

1. On the OAuth2 page (same page), scroll down to **Redirects**
2. Click **"Add Redirect"** button
3. Enter the callback URL:
   ```
   https://[PROJECT_REF].supabase.co/auth/v1/callback
   ```
4. Click **"Save Changes"** button
5. The URL should now appear in your redirects list

### Step 6: (Optional) Configure Scopes and Permissions

1. On the same OAuth2 page, you'll see **Scopes** section
2. For basic authentication, check:
   - `identify`
   - `email`
3. No additional permissions are typically needed for authentication only
4. Click **"Save Changes"**

### Step 7: Verify Discord Setup

- Client ID format: Usually 18 digits
- Client Secret format: Long alphanumeric string
- Redirect URL should match your Supabase callback URL exactly

**Proceed to Supabase Configuration below ↓**

---

## 4. Supabase Dashboard Configuration

Now that you have your OAuth credentials, let's configure them in Supabase.

### Step 1: Access Supabase Authentication Settings

1. Go to **https://supabase.com/dashboard**
2. Select your **Gorilla Type project**
3. In the left sidebar, go to **Authentication** (or **Auth**)
4. Click **"Providers"** tab

### Step 2: Enable and Configure GitHub

1. Find **GitHub** in the list of providers
2. Click on it to expand (or click the toggle to enable)
3. A configuration panel will appear with fields:
   - **Enabled:** Toggle to ON
   - **Client ID:** Paste your GitHub Client ID
   - **Client Secret:** Paste your GitHub Client Secret
4. Click **"Save"** (or automatically saved)

**Status:** You should see a green checkmark indicating GitHub is enabled

### Step 3: Enable and Configure Google

1. Find **Google** in the list of providers
2. Click on it to expand (or click the toggle to enable)
3. Fill in the configuration:
   - **Enabled:** Toggle to ON
   - **Client ID:** Paste your Google Client ID
   - **Client Secret:** Paste your Google Client Secret
4. Click **"Save"**

**Status:** Green checkmark confirms Google is enabled

### Step 4: Enable and Configure Discord

1. Find **Discord** in the list of providers
2. Click on it to expand (or click the toggle to enable)
3. Fill in the configuration:
   - **Enabled:** Toggle to ON
   - **Client ID:** Paste your Discord Client ID
   - **Client Secret:** Paste your Discord Client Secret
4. Click **"Save"**

**Status:** Green checkmark confirms Discord is enabled

### Step 5: Verify Provider Settings

1. In Supabase, go to **Authentication** → **Providers**
2. You should see all three providers with enabled status:
   - GitHub ✓
   - Google ✓
   - Discord ✓
3. Each should display as "Enabled" or have a green toggle

### Step 6: Check Callback URL

1. Go to **Authentication** → **URL Configuration** (or **Configuration**)
2. Verify that your **Redirect URL / Site URL** is set correctly:
   - For development: `http://localhost:3000`
   - For production: `https://yourdomain.com`
3. This should match your frontend URL where users will be redirected after authentication

---

## 5. Environment Variables

Update your environment configuration files with the OAuth provider information.

### Update .env.local

Edit `/home/anakin/programming/gorilla-type/.env.local` with your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OAuth Providers (Optional - Supabase handles this, but you can reference them)
# GitHub OAuth
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
# (Client Secret should NOT be in public env vars - kept on server only)

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
# (Client Secret should NOT be in public env vars - kept on server only)

# Discord OAuth
NEXT_PUBLIC_DISCORD_CLIENT_ID=your_discord_client_id
# (Client Secret should NOT be in public env vars - kept on server only)

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Important Notes on Environment Variables

1. **Client Secrets should NEVER be in frontend code** - Supabase securely handles these
2. The `NEXT_PUBLIC_*` prefix means these variables are exposed to the browser (safe for Client IDs only)
3. Keep `.env.local` out of version control (it's in `.gitignore`)
4. For production, set these environment variables through:
   - Your hosting platform (Vercel, Netlify, etc.)
   - Environment settings in your deployment dashboard

---

## 6. Testing Your Setup

### Test GitHub OAuth

1. Go to your application: `http://localhost:3000`
2. Look for an authentication button (Login, Sign In, etc.)
3. Click **"Sign in with GitHub"** or **GitHub** button
4. You'll be redirected to GitHub
5. GitHub will ask for authorization (first time only)
6. You'll be redirected back to your app
7. Verify you're logged in with your GitHub account

**Expected behavior:**
- Redirect to GitHub succeeds
- Authorization grant succeeds
- Redirect back to app succeeds
- User profile is created in Supabase

### Test Google OAuth

1. On the login page, click **"Sign in with Google"** or **Google** button
2. You'll be redirected to Google Sign-In
3. Select or sign in with your Google account
4. Grant permissions if prompted
5. You'll be redirected back to your app
6. Verify you're logged in with your Google account

### Test Discord OAuth

1. On the login page, click **"Sign in with Discord"** or **Discord** button
2. You'll be redirected to Discord
3. Sign in with your Discord account
4. Click **"Authorize"** to grant permissions
5. You'll be redirected back to your app
6. Verify you're logged in with your Discord account

### Verify in Supabase

After testing:
1. Go to **Supabase Dashboard** → Your Project
2. Go to **Authentication** → **Users**
3. You should see new users created from each provider
4. Each user entry shows the provider used (github, google, discord)

---

## 7. Troubleshooting

### Common Issues and Solutions

#### Issue: "Invalid redirect URI" error

**Cause:** The callback URL in Supabase doesn't match the one configured in the OAuth provider.

**Solution:**
1. Get your exact Supabase Project Reference from Project Settings
2. Use format: `https://[PROJECT_REF].supabase.co/auth/v1/callback`
3. Update all three providers with the exact same callback URL
4. Go to Supabase → Authentication → URL Configuration
5. Verify "Redirect URL" is set to your app's domain

#### Issue: "Client authentication failed" or "Invalid client"

**Cause:** Client ID or Client Secret is incorrect, mismatched, or has extra spaces.

**Solution:**
1. Double-check that you copied the entire Client ID and Secret
2. Look for any extra spaces at the beginning or end
3. Verify you're using the correct credentials for the provider
4. Delete and recreate the OAuth app if unsure
5. Re-copy the credentials carefully

#### Issue: "Callback URL mismatch" in Discord/GitHub/Google

**Cause:** The redirect URL you entered in provider settings doesn't match what's being sent.

**Solution:**
1. Verify exact spelling and capitalization
2. Check protocol (http:// vs https://)
3. Check for trailing slashes
4. For development, use: `https://[PROJECT_REF].supabase.co/auth/v1/callback`
5. For production, update to your production domain's Supabase URL

#### Issue: "Provider is disabled" in Supabase

**Cause:** The OAuth provider toggle is off in Supabase dashboard.

**Solution:**
1. Go to Supabase → Authentication → Providers
2. Click on the provider (GitHub/Google/Discord)
3. Toggle the **"Enabled"** switch to ON
4. Ensure Client ID and Secret are filled in
5. Click Save

#### Issue: Email permission error

**Cause:** OAuth provider isn't configured to return email.

**Solution:**
- **GitHub:** Email is returned by default
- **Google:** Ensure `email` and `profile` scopes are enabled
- **Discord:** Ensure `email` scope is enabled in OAuth settings

#### Issue: Users can't log in on production

**Cause:** Development credentials are used on production domain.

**Solution:**
1. Create separate OAuth apps for production domain
2. Update Supabase provider credentials for production
3. Update environment variables in production hosting
4. Test on production domain URL before going live

#### Issue: "Localhost redirect not allowed"

**Cause:** Provider doesn't allow localhost URLs (usually Google).

**Solution:**
1. Go to provider settings
2. Add `http://localhost:3000` to authorized JavaScript origins
3. Add `https://[PROJECT_REF].supabase.co/auth/v1/callback` to redirect URIs

---

## Implementation Checklist

Use this checklist to track your OAuth setup progress:

### GitHub Setup
- [ ] Created OAuth App on GitHub
- [ ] Copied Client ID
- [ ] Generated and copied Client Secret
- [ ] Set Homepage URL to your app domain
- [ ] Set Callback URL to Supabase callback URL
- [ ] Added credentials to Supabase
- [ ] Enabled GitHub provider in Supabase

### Google Setup
- [ ] Created Google Cloud project
- [ ] Enabled Google+ API (or equivalent)
- [ ] Created OAuth 2.0 Client ID
- [ ] Configured OAuth Consent Screen
- [ ] Added authorized JavaScript origins (localhost and production)
- [ ] Added authorized redirect URIs
- [ ] Copied Client ID and Client Secret
- [ ] Added credentials to Supabase
- [ ] Enabled Google provider in Supabase

### Discord Setup
- [ ] Created Discord Application
- [ ] Copied Client ID
- [ ] Generated and copied Client Secret
- [ ] Added Supabase callback URL to Discord OAuth Redirects
- [ ] Configured required scopes (identify, email)
- [ ] Added credentials to Supabase
- [ ] Enabled Discord provider in Supabase

### Supabase Configuration
- [ ] All three providers show as "Enabled"
- [ ] All Client IDs and Secrets are filled in correctly
- [ ] Redirect URL / Site URL is set correctly
- [ ] Tested GitHub OAuth login
- [ ] Tested Google OAuth login
- [ ] Tested Discord OAuth login
- [ ] Verified users appear in Supabase Auth → Users

---

## Next Steps

1. **Frontend Implementation:** Ensure your Next.js frontend has OAuth buttons
2. **User Profile Setup:** Configure user profile pages to handle OAuth user data
3. **Database Sync:** If needed, sync OAuth user data to your custom user tables
4. **Session Management:** Test session persistence and logout functionality
5. **Security:** Review Supabase security policies and RLS rules

---

## Additional Resources

- **Supabase Auth Documentation:** https://supabase.com/docs/guides/auth
- **GitHub OAuth Documentation:** https://docs.github.com/en/developers/apps/building-oauth-apps
- **Google OAuth Documentation:** https://developers.google.com/identity/protocols/oauth2
- **Discord OAuth Documentation:** https://discord.com/developers/docs/topics/oauth2

---

## Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Review Supabase logs: Dashboard → Authentication → Logs
3. Check browser console for error messages
4. Verify credentials are copied exactly (no spaces)
5. Test in incognito/private window to avoid cache issues

---

**Last Updated:** 2026-01-25
**Project:** Gorilla Type
**Status:** Complete Setup Guide
