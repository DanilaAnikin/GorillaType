# OAuth Setup Quick Reference

A quick-lookup guide for OAuth provider credentials and Supabase configuration.

## Callback URL

Use this URL for ALL providers (replace `[PROJECT_REF]` with your Supabase project reference):

```
https://[PROJECT_REF].supabase.co/auth/v1/callback
```

Find your Project Reference at: Dashboard → Settings → General → Project Ref

---

## Provider Setup URLs

| Provider | Setup URL | Documentation |
|----------|-----------|----------------|
| **GitHub** | https://github.com/settings/developers | https://docs.github.com/en/developers/apps/building-oauth-apps |
| **Google** | https://console.cloud.google.com/ | https://developers.google.com/identity/protocols/oauth2 |
| **Discord** | https://discord.com/developers/applications | https://discord.com/developers/docs/topics/oauth2 |
| **Supabase** | https://supabase.com/dashboard | https://supabase.com/docs/guides/auth |

---

## GitHub OAuth Credentials Template

```
Provider: GitHub
Enabled: ☐

Client ID: _________________________________
Client Secret: _________________________________

Homepage URL: http://localhost:3000
Callback URL: https://[PROJECT_REF].supabase.co/auth/v1/callback

Steps:
1. Go to https://github.com/settings/developers
2. Click "OAuth Apps" → "New OAuth App"
3. Fill in application details
4. Copy Client ID
5. Click "Generate a new client secret"
6. Copy Client Secret
7. Add to Supabase
```

---

## Google OAuth Credentials Template

```
Provider: Google
Enabled: ☐

Client ID: _________________________________
Client Secret: _________________________________

Project ID: _________________________________
Project Name: Gorilla Type

Steps:
1. Go to https://console.cloud.google.com/
2. Create new project named "Gorilla Type"
3. Enable Google+ API
4. Create OAuth 2.0 Client ID (Web application)
5. Add authorized JavaScript origins:
   - http://localhost:3000
   - https://yourdomain.com
6. Add authorized redirect URIs:
   - https://[PROJECT_REF].supabase.co/auth/v1/callback
7. Copy Client ID and Client Secret
8. Add to Supabase
```

---

## Discord OAuth Credentials Template

```
Provider: Discord
Enabled: ☐

Client ID: _________________________________
Client Secret: _________________________________

Application ID: _________________________________

Steps:
1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Name: Gorilla Type
4. Go to OAuth2 section
5. Copy Client ID
6. Click "Reset Secret" and copy Client Secret
7. Add Redirect URL:
   https://[PROJECT_REF].supabase.co/auth/v1/callback
8. Enable scopes:
   ☐ identify
   ☐ email
9. Add to Supabase
```

---

## Supabase Configuration Checklist

1. Go to https://supabase.com/dashboard
2. Select your project: **Gorilla Type**
3. Navigate to: **Authentication** → **Providers**

### GitHub Configuration
- [ ] Provider enabled (toggle ON)
- [ ] Client ID: ___________________________
- [ ] Client Secret: ___________________________
- [ ] Saved successfully (green checkmark)

### Google Configuration
- [ ] Provider enabled (toggle ON)
- [ ] Client ID: ___________________________
- [ ] Client Secret: ___________________________
- [ ] Saved successfully (green checkmark)

### Discord Configuration
- [ ] Provider enabled (toggle ON)
- [ ] Client ID: ___________________________
- [ ] Client Secret: ___________________________
- [ ] Saved successfully (green checkmark)

### Additional Configuration
- [ ] URL Configuration: Redirect URL = `http://localhost:3000` (dev) or `https://yourdomain.com` (prod)
- [ ] Email confirmations: Configured as needed
- [ ] Session duration: Set to desired time
- [ ] Rate limiting: Enabled for security

---

## Environment Variables

File: `.env.local`

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Server-only (never exposed to browser)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Optional Client IDs (for reference)
NEXT_PUBLIC_GITHUB_CLIENT_ID=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_DISCORD_CLIENT_ID=

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important:**
- Client Secrets are handled by Supabase, not your application
- Keep `.env.local` out of version control
- Update environment variables in production hosting dashboard

---

## Testing Credentials Access

### View Supabase Credentials
1. Dashboard → Settings → API
2. Find: Project URL, Anon Key, Service Role Key

### View GitHub Credentials
1. https://github.com/settings/developers
2. Click on your OAuth App
3. Shows: Client ID
4. For Client Secret: You must have created it previously (shows only once)

### View Google Credentials
1. https://console.cloud.google.com/
2. APIs & Services → Credentials
3. Click on your OAuth 2.0 Client ID
4. Shows: Client ID, Client Secret, Redirect URIs

### View Discord Credentials
1. https://discord.com/developers/applications
2. Click on your application
3. OAuth2 section
4. Shows: Client ID
5. Client Secret: Click "Reset Secret" if needed

---

## Common Error Messages and Solutions

| Error | Cause | Fix |
|-------|-------|-----|
| Invalid redirect URI | Callback URL mismatch | Verify exact URL in all 4 places (provider, Supabase, config) |
| Client authentication failed | Wrong Client ID or Secret | Recopy credentials carefully (watch for spaces) |
| Unauthorized client | Not enabled in Supabase | Toggle provider ON in Supabase dashboard |
| Scope not available | Missing permissions in provider | Add required scopes: email, profile, identify |
| Provider disabled | OAuth disabled in Supabase | Go to Authentication → Providers → Enable provider |
| Localhost not allowed | Provider doesn't allow localhost | Add http://localhost:3000 to authorized origins |

---

## Post-Setup Verification

After configuration, verify everything works:

```bash
# 1. Check environment variables are loaded
echo $NEXT_PUBLIC_SUPABASE_URL

# 2. Start development server
npm run dev

# 3. Open browser
open http://localhost:3000

# 4. Test each OAuth provider
# - Click Sign In
# - Try GitHub login
# - Try Google login
# - Try Discord login

# 5. Verify in Supabase
# - Dashboard → Authentication → Users
# - Should see 3 new users (one from each provider)
```

---

## Supabase Dashboard Locations

| Function | Path | URL |
|----------|------|-----|
| View Users | Authentication → Users | https://supabase.com/dashboard/project/[REF]/auth/users |
| View Providers | Authentication → Providers | https://supabase.com/dashboard/project/[REF]/auth/providers |
| Configure URLs | Authentication → URL Configuration | https://supabase.com/dashboard/project/[REF]/auth/url-configuration |
| View Logs | Authentication → Logs | https://supabase.com/dashboard/project/[REF]/auth/logs |
| API Settings | Settings → API | https://supabase.com/dashboard/project/[REF]/settings/api |

---

## Quick Credential Lookup

**After setting up all providers, write your credentials here (keep this file secure!):**

### GitHub
```
Client ID: _________________________________________________
Client Secret: ________________________________________________
```

### Google
```
Client ID: _________________________________________________
Client Secret: ________________________________________________
```

### Discord
```
Client ID: _________________________________________________
Client Secret: ________________________________________________
```

### Supabase
```
Project URL: _________________________________________________
Project Ref: _________________________________________________
Anon Key: _________________________________________________
```

---

**Last Updated:** 2026-01-25
**For Full Details:** See OAUTH_SETUP_GUIDE.md
