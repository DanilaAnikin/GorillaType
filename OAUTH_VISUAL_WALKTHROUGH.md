# OAuth Setup Visual Walkthrough

Step-by-step walkthroughs with detailed descriptions for each OAuth provider setup.

---

## GITHUB OAUTH SETUP - DETAILED WALKTHROUGH

### Step 1: Navigate to GitHub Developer Settings

```
GitHub Homepage (github.com)
    ↓
Click Profile Picture (top right)
    ↓
Select "Settings"
    ↓
In left sidebar, click "Developer settings"
    ↓
In left sidebar, click "OAuth Apps"
```

**Direct URL:** https://github.com/settings/developers

**What you should see:**
- A list of OAuth Apps (may be empty if this is your first time)
- A button labeled "New OAuth App"

### Step 2: Create a New OAuth App

**Click "New OAuth App" button**

You'll see a form with 4 fields:

```
┌─────────────────────────────────────────────┐
│ Register a new OAuth application            │
├─────────────────────────────────────────────┤
│ Application name *                          │
│ ┌───────────────────────────────────────┐   │
│ │ Gorilla Type                          │   │
│ └───────────────────────────────────────┘   │
│                                             │
│ Homepage URL *                              │
│ ┌───────────────────────────────────────┐   │
│ │ http://localhost:3000                 │   │
│ │ (for development)                     │   │
│ └───────────────────────────────────────┘   │
│                                             │
│ Application description                     │
│ ┌───────────────────────────────────────┐   │
│ │ A modern typing test application      │   │
│ └───────────────────────────────────────┘   │
│                                             │
│ Authorization callback URL *                │
│ ┌───────────────────────────────────────┐   │
│ │ https://[PROJECT_REF].supabase.co/    │   │
│ │ auth/v1/callback                      │   │
│ └───────────────────────────────────────┘   │
│                                             │
│ [ ] I agree to the GitHub terms             │
│                                             │
│ ┌──────────────┐  ┌──────────────┐         │
│ │ Cancel       │  │ Register app │         │
│ └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────┘
```

**Fill in the fields:**

1. **Application name:** `Gorilla Type`
2. **Homepage URL:** `http://localhost:3000` (dev) or `https://yourdomain.com` (prod)
3. **Application description:** `A modern typing test application`
4. **Authorization callback URL:** `https://your-project-ref.supabase.co/auth/v1/callback`
5. Check the agreement checkbox
6. Click **"Register application"**

### Step 3: Get Your Credentials

After registration, you'll see the app details page:

```
┌────────────────────────────────────────────────┐
│ Gorilla Type                                   │
├────────────────────────────────────────────────┤
│                                                │
│ ✓ Application name: Gorilla Type              │
│                                                │
│ CLIENT ID                                      │
│ ┌──────────────────────────────────────────┐  │
│ │ abc123def456ghij                         │  │
│ │                            [Copy button] │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ CLIENT SECRET                                  │
│ ┌──────────────────────────────────────────┐  │
│ │ Generate a new client secret             │  │
│ │                            [Click here]  │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ Homepage URL: http://localhost:3000           │
│ Callback URL: https://[...]/auth/v1/callback  │
│                                                │
└────────────────────────────────────────────────┘
```

**Actions:**
1. Copy the **Client ID** and save it somewhere safe
2. Click **"Generate a new client secret"**
3. You'll be prompted to confirm (click "I understand...")
4. A **Client Secret** will be generated and shown once
5. **Copy it immediately** and save it (won't be shown again)

**Save these values:**
```
GitHub Client ID: ___________________________
GitHub Client Secret: ___________________________
```

---

## GOOGLE OAUTH SETUP - DETAILED WALKTHROUGH

### Step 1: Create Google Cloud Project

```
Google Cloud Console (console.cloud.google.com)
    ↓
Sign in with Google account
    ↓
Click Project dropdown (top left, shows "My First Project")
    ↓
Click "NEW PROJECT"
```

**Project creation form:**

```
┌──────────────────────────────────┐
│ Create a new project             │
├──────────────────────────────────┤
│                                  │
│ Project name *                   │
│ ┌──────────────────────────────┐ │
│ │ Gorilla Type                 │ │
│ └──────────────────────────────┘ │
│                                  │
│ Organization (optional)          │
│ ┌──────────────────────────────┐ │
│ │ [Dropdown]                   │ │
│ └──────────────────────────────┘ │
│                                  │
│ Location (optional)              │
│ ┌──────────────────────────────┐ │
│ │ [Dropdown]                   │ │
│ └──────────────────────────────┘ │
│                                  │
│          [ CREATE ]              │
│                                  │
└──────────────────────────────────┘
```

**Fill in:**
- Project name: `Gorilla Type`
- Leave Organization and Location as default
- Click **"CREATE"**

**Wait for project creation** (you'll see a spinner)

When ready, you'll be notified. Select the new project.

### Step 2: Enable Google+ API

```
Left sidebar:
    ↓
Click "APIs & Services"
    ↓
Click "Enabled APIs & services"
    ↓
Click "+ ENABLE APIS AND SERVICES" (blue button, top)
```

**Search and enable:**

```
┌────────────────────────────────────┐
│ Search for APIs                    │
├────────────────────────────────────┤
│ ┌──────────────────────────────┐   │
│ │ Search...                    │   │
│ │ (Type "Google+ API")         │   │
│ └──────────────────────────────┘   │
│                                    │
│ Results:                           │
│ ┌──────────────────────────────┐   │
│ │ Google+ API        (Official │   │
│ │ ┌─────────────────────────┐  │   │
│ │ │ ENABLE                  │  │   │
│ │ └─────────────────────────┘  │   │
│ └──────────────────────────────┘   │
│                                    │
└────────────────────────────────────┘
```

1. In the search box, type: `Google+ API`
2. Click on "Google+ API" in results
3. Click **"ENABLE"** button

Wait for API to be enabled (you'll see confirmation).

### Step 3: Create OAuth Consent Screen

```
Left sidebar:
    ↓
Click "APIs & Services"
    ↓
Click "OAuth consent screen"
```

**Consent screen setup:**

```
┌─────────────────────────────────────┐
│ OAuth consent screen                │
├─────────────────────────────────────┤
│                                     │
│ User Type *                         │
│ ( ) Internal   (*) External         │
│                                     │
│ [CREATE] or [EDIT]                  │
│                                     │
└─────────────────────────────────────┘
```

1. Select **"External"** (unless you have Google Workspace)
2. Click **"CREATE"** (or "EDIT" if already exists)

**Fill the form:**

**Screen 1: App information**
```
┌──────────────────────────────────────────┐
│ App name *                               │
│ ┌───────────────────────────────────┐    │
│ │ Gorilla Type                      │    │
│ └───────────────────────────────────┘    │
│                                          │
│ User support email *                     │
│ ┌───────────────────────────────────┐    │
│ │ your.email@gmail.com              │    │
│ └───────────────────────────────────┘    │
│                                          │
│ App logo (optional)                      │
│ [Upload logo or leave blank]             │
│                                          │
│ [SAVE AND CONTINUE]                      │
│                                          │
└──────────────────────────────────────────┘
```

**Screen 2: Scopes**
```
┌──────────────────────────────────────────┐
│ Scopes                                   │
│                                          │
│ [+ ADD OR REMOVE SCOPES]                 │
│                                          │
│ A table will appear with:                │
│ [ ] userinfo.email    (user email)       │
│ [ ] userinfo.profile  (user profile)     │
│ [ ] openid                               │
│                                          │
│ Check all three boxes, then [UPDATE]     │
│                                          │
│ [SAVE AND CONTINUE]                      │
│                                          │
└──────────────────────────────────────────┘
```

**Screen 3: Test users (Optional)**
- Can be left empty
- Click **"SAVE AND CONTINUE"**

**Screen 4: Summary**
- Review the information
- Click **"BACK TO DASHBOARD"**

### Step 4: Create OAuth Client ID

```
Left sidebar:
    ↓
Click "APIs & Services"
    ↓
Click "Credentials"
    ↓
Click "+ CREATE CREDENTIALS" (blue button, top)
    ↓
Select "OAuth client ID"
```

**OAuth client ID form:**

```
┌────────────────────────────────────────┐
│ Create OAuth 2.0 Client ID             │
├────────────────────────────────────────┤
│                                        │
│ Application type *                     │
│ ( ) Desktop app                        │
│ ( ) Mobile app                         │
│ (X) Web application    [Required]      │
│                                        │
│ Name *                                 │
│ ┌──────────────────────────────────┐   │
│ │ Gorilla Type Web Client          │   │
│ └──────────────────────────────────┘   │
│                                        │
│ Authorized JavaScript origins          │
│ + [ADD URI]                            │
│                                        │
│ Authorized redirect URIs               │
│ + [ADD URI]                            │
│                                        │
│          [ CREATE ]                    │
│                                        │
└────────────────────────────────────────┘
```

**Fill in:**

1. **Application type:** Select "Web application"
2. **Name:** `Gorilla Type Web Client`
3. **Authorized JavaScript origins:** Click + ADD URI and add:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production, if applicable)
4. **Authorized redirect URIs:** Click + ADD URI and add:
   - `https://[PROJECT_REF].supabase.co/auth/v1/callback`
5. Click **"CREATE"**

### Step 5: View Your Credentials

```
A modal will pop up showing:

┌──────────────────────────────────────┐
│ OAuth 2.0 Client Created              │
├──────────────────────────────────────┤
│                                      │
│ Client ID                            │
│ ┌──────────────────────────────────┐ │
│ │ 123456789-                       │ │
│ │ abcdefghijklmnop.apps.            │ │
│ │ googleusercontent.com            │ │
│ │                        [Copy]    │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Client Secret                        │
│ ┌──────────────────────────────────┐ │
│ │ GOCSPX-AbCdEfGhIjKlMn...        │ │
│ │                        [Copy]    │ │
│ └──────────────────────────────────┘ │
│                                      │
│ [Download as JSON]  [OKAY]          │
│                                      │
└──────────────────────────────────────┘
```

**Save these values:**
```
Google Client ID: ___________________________
Google Client Secret: ___________________________
```

---

## DISCORD OAUTH SETUP - DETAILED WALKTHROUGH

### Step 1: Create Discord Application

```
Discord Developer Portal (discord.com/developers/applications)
    ↓
Sign in with Discord account
    ↓
Click "New Application" (top right)
```

**Application creation:**

```
┌───────────────────────────────────┐
│ Create an application              │
├───────────────────────────────────┤
│                                   │
│ What would you like to name it? * │
│ ┌───────────────────────────────┐ │
│ │ Gorilla Type                  │ │
│ └───────────────────────────────┘ │
│                                   │
│ [ ] Terms                          │
│ I agree to the Developer Terms     │
│ of Service and Developer Policy    │
│                                   │
│      [Create Application]          │
│                                   │
└───────────────────────────────────┘
```

1. **Application name:** `Gorilla Type`
2. Check the "I agree to..." checkbox
3. Click **"Create"**

### Step 2: Get Your Client ID

After creation, you'll see the app dashboard:

```
┌──────────────────────────────────────────┐
│ Gorilla Type                             │
│ ─────────────────────────────────────── │
│ Left Sidebar:                            │
│ • General Information (selected)         │
│ • OAuth2                                 │
│ • Roles                                  │
│ • etc.                                   │
├──────────────────────────────────────────┤
│                                          │
│ APPLICATION ID                           │
│ ┌──────────────────────────────────────┐ │
│ │ 123456789098765432                   │ │
│ │                           [Copy]     │ │
│ └──────────────────────────────────────┘ │
│ (This is your Client ID)                 │
│                                          │
│ PUBLIC KEY                               │
│ ┌──────────────────────────────────────┐ │
│ │ [long hex string]     [Copy] [Reset] │ │
│ └──────────────────────────────────────┘ │
│                                          │
└──────────────────────────────────────────┘
```

1. Copy the **Application ID** (this is your Client ID)

**Save:**
```
Discord Client ID: ___________________________
```

### Step 3: Navigate to OAuth2 Settings

1. In the left sidebar, click **"OAuth2"**
2. Click **"General"** in the sub-menu

**You'll see:**

```
┌─────────────────────────────────────┐
│ OAuth2                              │
├─────────────────────────────────────┤
│                                     │
│ CLIENT ID                           │
│ ┌─────────────────────────────────┐ │
│ │ 123456789098765432              │ │
│ │                      [Copy]     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ CLIENT SECRET                       │
│ ┌─────────────────────────────────┐ │
│ │ [hidden secret]                 │ │
│ │              [Reset Secret]     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ REDIRECTS                           │
│ ┌─────────────────────────────────┐ │
│ │ [+ Add Redirect]                │ │
│ │                                 │ │
│ │ No redirects added yet          │ │
│ │                  [Save Changes] │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Step 4: Generate Client Secret

1. Click **"Reset Secret"** button next to CLIENT SECRET
2. Confirm: Click **"Yes, do it!"**
3. A new secret will be generated and shown
4. Click **"Copy"** and save it immediately

**Save:**
```
Discord Client Secret: ___________________________
```

### Step 5: Configure Redirect URI

In the **REDIRECTS** section:

1. Click **"+ Add Redirect"**
2. Enter your callback URL:
   ```
   https://[PROJECT_REF].supabase.co/auth/v1/callback
   ```
3. Click **"Save Changes"** button

**Visual:**

```
┌──────────────────────────────────────┐
│ REDIRECTS                            │
├──────────────────────────────────────┤
│ [+ Add Redirect]                     │
│                                      │
│ https://your-project-ref.supabase.   │
│ co/auth/v1/callback                  │
│                         [X Remove]   │
│                                      │
│ ┌────────────────────────────────┐   │
│ │       [Save Changes]           │   │
│ └────────────────────────────────┘   │
│                                      │
└──────────────────────────────────────┘
```

### Step 6: Scroll to Scopes (Optional)

Further down on the same OAuth2 page, you'll see **Scopes**:

```
┌──────────────────────────────┐
│ SCOPES                       │
├──────────────────────────────┤
│                              │
│ [X] identify                 │
│ [X] email                    │
│ [ ] connections              │
│ [ ] guilds                   │
│ [ ] bot                      │
│ (etc.)                       │
│                              │
│ [Save Changes]               │
│                              │
└──────────────────────────────┘
```

Ensure these are checked:
- ✓ `identify`
- ✓ `email`

---

## SUPABASE DASHBOARD CONFIGURATION - DETAILED WALKTHROUGH

### Step 1: Access Supabase Dashboard

```
Supabase Dashboard (supabase.com/dashboard)
    ↓
Sign in with your account
    ↓
Select "Gorilla Type" project
    ↓
Left sidebar → "Authentication" (or "Auth")
    ↓
Click "Providers" tab
```

**What you should see:**

```
┌────────────────────────────────────────┐
│ Authentication → Providers             │
├────────────────────────────────────────┤
│                                        │
│ Enabled Providers:                     │
│ • Email & Password (default)           │
│ • Phone                                │
│ • Magic Link                           │
│                                        │
│ OAuth Providers:                       │
│ • GitHub          [ Toggle ] [Config]  │
│ • Google          [ Toggle ] [Config]  │
│ • Discord         [ Toggle ] [Config]  │
│ • (Others)                             │
│                                        │
│ All providers show as "Disabled" ●     │
│ until configured                       │
│                                        │
└────────────────────────────────────────┘
```

### Step 2: Configure GitHub

1. Find **"GitHub"** in the list
2. Click on it or the **"[Config]"** button next to it

**Configuration panel:**

```
┌──────────────────────────────────────────┐
│ GitHub OAuth Configuration               │
├──────────────────────────────────────────┤
│                                          │
│ Enabled                                  │
│ [ ] Enable this provider                 │
│                                          │
│ Client ID (from GitHub) *                │
│ ┌──────────────────────────────────────┐ │
│ │ [Paste your GitHub Client ID]        │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Client Secret (from GitHub) *            │
│ ┌──────────────────────────────────────┐ │
│ │ [Paste your GitHub Client Secret]    │ │
│ │                              [✓]●●●●●│ │
│ │                           [Show]     │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ [SAVE]                                   │
│                                          │
└──────────────────────────────────────────┘
```

**Steps:**
1. Check the **"Enable this provider"** checkbox
2. Paste your **GitHub Client ID** from Step 1
3. Paste your **GitHub Client Secret**
4. Click **"SAVE"**

**Result:** GitHub will show green checkmark indicating it's enabled

### Step 3: Configure Google

1. Find **"Google"** in the list
2. Click on it or the **"[Config]"** button

**Configuration panel:**

```
┌──────────────────────────────────────────┐
│ Google OAuth Configuration               │
├──────────────────────────────────────────┤
│                                          │
│ Enabled                                  │
│ [ ] Enable this provider                 │
│                                          │
│ Client ID (from Google) *                │
│ ┌──────────────────────────────────────┐ │
│ │ [Paste your Google Client ID]        │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Client Secret (from Google) *            │
│ ┌──────────────────────────────────────┐ │
│ │ [Paste your Google Client Secret]    │ │
│ │                              [✓]●●●●●│ │
│ │                           [Show]     │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ [SAVE]                                   │
│                                          │
└──────────────────────────────────────────┘
```

**Steps:**
1. Check **"Enable this provider"**
2. Paste your **Google Client ID**
3. Paste your **Google Client Secret**
4. Click **"SAVE"**

**Result:** Google will show green checkmark

### Step 4: Configure Discord

1. Find **"Discord"** in the list
2. Click on it or the **"[Config]"** button

**Configuration panel:**

```
┌──────────────────────────────────────────┐
│ Discord OAuth Configuration              │
├──────────────────────────────────────────┤
│                                          │
│ Enabled                                  │
│ [ ] Enable this provider                 │
│                                          │
│ Client ID (from Discord) *               │
│ ┌──────────────────────────────────────┐ │
│ │ [Paste your Discord Client ID]       │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Client Secret (from Discord) *           │
│ ┌──────────────────────────────────────┐ │
│ │ [Paste your Discord Client Secret]   │ │
│ │                              [✓]●●●●●│ │
│ │                           [Show]     │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ [SAVE]                                   │
│                                          │
└──────────────────────────────────────────┘
```

**Steps:**
1. Check **"Enable this provider"**
2. Paste your **Discord Client ID**
3. Paste your **Discord Client Secret**
4. Click **"SAVE"**

**Result:** Discord will show green checkmark

### Step 5: Verify All Providers

After configuring all three, your providers list should show:

```
┌────────────────────────────────────────┐
│ OAuth Providers                        │
├────────────────────────────────────────┤
│                                        │
│ ✓ GitHub      [Enabled]   [Config]    │
│ ✓ Google      [Enabled]   [Config]    │
│ ✓ Discord     [Enabled]   [Config]    │
│                                        │
│ All three show green checkmarks!       │
│                                        │
└────────────────────────────────────────┘
```

---

## FINAL VERIFICATION CHECKLIST

After completing all setup, verify with this checklist:

```
PROVIDER CREDENTIALS SAVED:
[✓] GitHub Client ID: ____________________
[✓] GitHub Client Secret: ____________________
[✓] Google Client ID: ____________________
[✓] Google Client Secret: ____________________
[✓] Discord Client ID: ____________________
[✓] Discord Client Secret: ____________________

SUPABASE CONFIGURATION:
[✓] GitHub enabled in Supabase
[✓] Google enabled in Supabase
[✓] Discord enabled in Supabase
[✓] Callback URL verified in all 3 providers
[✓] Callback URL format: https://[PROJECT_REF].supabase.co/auth/v1/callback

ENVIRONMENT VARIABLES (.env.local):
[✓] NEXT_PUBLIC_SUPABASE_URL is set
[✓] NEXT_PUBLIC_SUPABASE_ANON_KEY is set
[✓] SUPABASE_SERVICE_ROLE_KEY is set
[✓] NEXT_PUBLIC_APP_URL is set (localhost:3000 for dev)

READY TO TEST:
[ ] Start npm run dev
[ ] Test GitHub OAuth login
[ ] Test Google OAuth login
[ ] Test Discord OAuth login
[ ] Check Supabase Auth → Users to verify new users created
```

---

**Last Updated:** 2026-01-25
**Project:** Gorilla Type
**Status:** Complete Visual Walkthrough
