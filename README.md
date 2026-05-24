# Reta Protocol Tracker — Personal PWA

Your personal retatrutide + peptide tracker, ready to deploy as a Progressive Web App that installs to your phone's Home Screen like a real app.

## What you get

- 📊 Weight + dose tracking with phase awareness (Week N, current phase)
- 🧬 Peptide stack builder with MOTS-c pre-seeded
- 🧮 Reconstitution calculator with syringe visualization
- 🥩 Food log with AI calorie lookup (text + photo scan)
- 🏋️ Workout log
- 💊 Supplement protocol overview
- 🧠 AI Health Breakdown using your full data
- 💾 All data stored in your browser (localStorage) — never leaves your device
- 🔐 Your API key stays on your device only

## Deploy to Vercel (free, ~5 minutes)

### Step 1: Sign up
1. Go to **vercel.com** and sign up with GitHub, GitLab, or email (free)

### Step 2: Deploy
**Easiest path — drag and drop:**
1. Run the build locally first (see "Build" below), OR
2. Use Vercel's drag-and-drop deploy at **vercel.com/new** — drop the entire folder

**OR via GitHub (recommended for updates):**
1. Create a free GitHub account
2. Create a new repo, upload these files
3. On Vercel, click "Add New → Project" → import your repo
4. Vercel auto-detects Vite. Click Deploy. Done.

You'll get a URL like `https://reta-tracker-yourname.vercel.app`

### Step 3: Add to Home Screen
**iPhone (Safari):**
1. Open your Vercel URL in Safari
2. Tap the **Share** button (square with arrow up)
3. Scroll down → tap **"Add to Home Screen"**
4. Tap **Add**

**Android (Chrome):**
1. Open URL in Chrome
2. Tap the **⋮** menu → **"Install app"** or **"Add to Home screen"**

Now it lives on your Home Screen as a full-screen app icon.

## Build (if deploying locally first)

You need **Node.js 18+** installed (nodejs.org).

```bash
npm install
npm run build
```

The `dist/` folder is what gets deployed. You can drag-and-drop the `dist/` folder to Vercel, Netlify, or Cloudflare Pages.

## Add AI features (optional)

The AI Health Breakdown and Food Scanner work via your own Anthropic API key.

1. Go to **console.anthropic.com**, sign up
2. Add ~$5 in credits (Billing section)
3. Create an API key (starts with `sk-ant-api03-...`)
4. In the app, tap **⚙️ Settings** → paste key → Save

Your key is stored only in your browser's localStorage on your device. Personal use typically costs pennies per month.

**Without an API key:** Everything else still works perfectly — only AI features are disabled.

## Alternative free hosts

- **Netlify** — drop the `dist/` folder at netlify.com/drop
- **Cloudflare Pages** — pages.cloudflare.com
- **GitHub Pages** — free, but requires GitHub repo

## Data backup

Your data is in browser localStorage. To back up:
1. Open browser dev tools (F12 on desktop)
2. Application tab → Local Storage → your domain
3. Copy the values of `mr_weights`, `mr_doses`, `mr_peptides`, etc.

If you clear browser data, your tracker data is wiped. Consider periodic backups.

## Personalization

To change starting weight, goal, dose schedule, etc., edit `src/App.jsx` at the top:

```javascript
const START_WEIGHT = 223.4;
const START_DATE = "2026-05-24";
const TARGET_WEIGHT = 190;
const DOSE_DAYS = [0, 4]; // 0=Sun, 1=Mon... 6=Sat
const DOSE_TIME = "19:00";
```

Then redeploy.
