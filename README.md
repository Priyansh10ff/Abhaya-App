# Abhaya App — Mobile (Expo + React Native)

Android-first women's safety app. Phase 1 MVP.

## What's built in Phase 1

- **Onboarding** — 3 slides + language selection (6 languages)
- **Home** — Dashboard, SOS button, quick access, helplines
- **Emergency Guide** — 7-step offline protocol for the first 72 hours
- **Legal Rights AI** — Claude-powered chat in regional languages
- **FIR Escalator** — Generates SP complaint letters by state/district
- **More** — Language switcher, helplines, coming soon features

## Setup

### 1. Install dependencies

```bash
cd abhaya-app
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
```

Open `.env` and fill in:
- `CLAUDE_API_KEY` — from console.anthropic.com
- `SUPABASE_URL` — same project as your marketing site
- `SUPABASE_ANON_KEY` — the anon/public key (not service role)

Also install dotenv for app.config.js:
```bash
npm install dotenv
```

### 3. Download fonts

Download these fonts and put them in `assets/fonts/`:
- **DM Sans**: https://fonts.google.com/specimen/DM+Sans
  - DMSans-Regular.ttf
  - DMSans-Medium.ttf
  - DMSans-SemiBold.ttf
- **Lora**: https://fonts.google.com/specimen/Lora
  - Lora-Regular.ttf
  - Lora-SemiBold.ttf
  - Lora-Italic.ttf

Or run this to download them automatically:
```bash
npx expo install @expo-google-fonts/dm-sans @expo-google-fonts/lora
```
Then update the font imports in `app/_layout.tsx` accordingly.

### 4. Add placeholder assets

Create placeholder files for now (replace later):
```bash
# Create a simple icon placeholder
# assets/icon.png (1024x1024)
# assets/splash.png (1242x2436)
# assets/adaptive-icon.png (1024x1024)
```

### 5. Run on Android

```bash
# Start Expo
npm start

# Press 'a' to open on Android emulator
# Or scan QR with Expo Go app on your phone
```

### 6. Run on physical device

Install **Expo Go** from Google Play Store on your Android phone.
Run `npm start` → scan the QR code.

## File structure

```
app/
  _layout.tsx         Root layout, fonts, navigation
  index.tsx           Entry — redirects to onboarding or tabs
  onboarding.tsx      3-slide onboarding + language picker
  tabs/
    _layout.tsx       Bottom tab bar
    home.tsx          Dashboard
    guide.tsx         Emergency guide step list
    legal.tsx         Legal AI chat
    fir.tsx           FIR escalator
    more.tsx          Settings, helplines, about
  guide/
    index.tsx         Individual step detail screen

components/
  ui/
    Button.tsx        Reusable button
    Card.tsx          Reusable card

constants/
  colors.ts           Design tokens
  guide-data.ts       All emergency guide content (offline)

lib/
  claude.ts           Claude API integration
  storage.ts          AsyncStorage utilities

store/
  app.ts              Zustand global state
```

## Build for Android

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build APK (for testing)
eas build --platform android --profile preview

# Build for Play Store
eas build --platform android --profile production
```

## What's next (Phase 2)

- Evidence vault with E2E encryption + RFC 3161 timestamps
- eCourts case tracker with hearing reminders
- Safety map with anonymous crowd-sourced pins
- Anonymous peer support community
- Period health tracker
