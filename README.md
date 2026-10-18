<div align="center">

<img src="assets/icon.png" width="128" alt="CalMon mascot" />

# CalMon

**Snap your meal, get the calories, and know what to eat next.**
<br/>A minimal daily calorie tracker for Android and iOS, powered by Gemini.
<br/>Rate-limited? Hand it to your Gemini/ChatGPT app instead.

![Expo SDK 57](https://img.shields.io/badge/Expo-SDK%2057-5B5BD6?style=flat-square&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.86-1E9BD7?style=flat-square&logo=react&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-vision-22A55B?style=flat-square&logo=googlegemini&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-F2A516?style=flat-square&logo=typescript&logoColor=white)

</div>

---

## What is this?

CalMon is a pocket-sized calorie tracker that doesn't make you type every ingredient.

Take a photo of your plate and one Gemini request does two things:

1. **Works out what's on it.** Each food is listed separately with its portion, calories, and macros.
2. **Suggests your next meal.** It looks at what you've already eaten today and suggests what to eat next, when, and roughly how many calories.

Everything else stays **on your phone**: meals, photos, profile, and API key. No accounts, no servers, no tracking.

When the free Gemini API says *"429: quota exceeded"*, you're still not stuck: **[ask a chat app](#ask-a-chat-app)**. CalMon writes the prompt, you send it to the Gemini or ChatGPT app you already have, and the answer is imported straight back.

Meet **Mon**, the little calorie monster whose face follows your day: sleepy before your first meal, happy as you go, and dizzy if you overshoot.

---

## How it works

1. **First launch.** Enter your body stats and CalMon calculates a daily calorie target with the Mifflin-St Jeor formula (or set your own number). Then paste a Gemini API key.
2. **Log a meal.** The meal slot is picked from the clock (breakfast, lunch, snack, dinner, late snack). Take a photo or pick one from your gallery, optionally add a note like *"ate half the rice"*, and tap **Analyze**.
3. **Review and save.** Every item comes back with portion, kcal, and macros. Tap **+ / −** to change quantities and the numbers rescale on-device. Rename items, change units, fix kcal, add or remove items. Below that is a **Next up** suggestion.
4. **Your day.** The calorie ring shows how much is left today, with macro bars for protein, carbs, and fat. Each meal fills its own tile with its photo. Tap a meal to see the full breakdown, edit it, or delete it.
5. **Stats.** Log your weight for any day (skip days whenever you like; they show as gaps). See a weight line chart and a daily calorie chart over 7, 30, or 90 days. Filter calories by breakfast, lunch, dinner, or snacks, or see them all stacked against your target. Tap a day for details.
6. **History and settings.** Look back at the last 7 days and the month calendar, where each day gets a dot: amber for under, green for on target, red for over. In Settings you can switch between light and dark mode, change your profile, pick a Gemini model, and back up your data.

---

## Features

| Feature | Details |
|---|---|
| Photo logging | Take a photo or pick from the gallery. Gemini identifies each food with portion, kcal, protein, carbs, and fat |
| Describe it | No photo? Type *"a cup of masala chai and 4 Parle-G biscuits"* |
| Manual entry | Add items yourself, no AI needed |
| Notes for Gemini | e.g. *"ate half the rice"* or *"no oil"*, for better estimates |
| Smart meal slot | Picked from the time of day. Falls back to *snack* if that meal is already logged |
| Editable review | Quantity steppers rescale kcal and macros locally. Edit names, units, and kcal; add or remove items |
| Next up suggestion | Next meal, time, kcal budget, 2–3 ideas, and a tip, all from the same request. A refresh button appears if you change the meal by more than 15% |
| Log any day | Add earlier meals, log other days, and edit or delete past meals |
| Day view | Calorie ring, macro bars, and a meal grid with photos |
| Stats | Daily weight log, weight trend with gaps for skipped days, calorie chart by meal (all stacked or one meal), daily averages per meal |
| History | 7-day chart and a month calendar with under / on target / over dots. Tap a day to jump to it |
| Personal targets | BMR/TDEE with Mifflin-St Jeor plus activity level and goal (lose / maintain / gain), or your own number |
| Gemini model picker | With automatic fallback, see [Gemini models](#gemini-models) |
| Ask a chat app | Gemini API rate-limited? Share the prompt and photo to the Gemini / ChatGPT app and paste the reply back |
| Themes | Light, Dark, or Auto (follows the system) |
| Backup | JSON export and import of meals, weights, and profile (photos not included) |
| Private by design | SQLite on-device, API key in the secure store (`expo-secure-store`), never in the source |

---

## Setup and run

### What you need

- **Node.js 20+** and npm
- **A phone with [Expo Go](https://expo.dev/go)**, *or* an Android emulator / iOS simulator
- **A Gemini API key**, free at **[aistudio.google.com/apikey](https://aistudio.google.com/apikey)**

### 1. Install

```bash
git clone <repo-url> CalMon
cd CalMon
npm install
```

### 2. Start the dev server

```bash
npx expo start
```

Then:

- **Phone:** scan the QR code with Expo Go (Android) or the Camera app (iOS). Your phone and computer need to be on the same Wi-Fi.
- **Android emulator:** press `a`
- **iOS simulator (macOS):** press `i`

> If the phone can't reach your computer (campus or office Wi-Fi), try `npx expo start --tunnel`.

### 3. First launch

1. Fill in **About you** (age, height, weight, activity, goal). Your daily target is calculated for you.
2. Paste your **Gemini API key** and tap **Test** to check it works.
3. Log your first meal.

Your key is stored only on the device (secure store). It's never committed or sent anywhere except Google's Gemini API.

### 4. (Optional) Build a real app

CalMon uses Continuous Native Generation, so the `android/` and `ios/` folders are generated and you never edit them by hand.

```bash
# Local build on a connected Android device / emulator (needs Android Studio + JDK 17+)
npx expo run:android --variant release

# Or build in the cloud with EAS (no local Android Studio / Xcode needed)
npx eas-cli@latest build:configure     # first time only, creates eas.json
npx eas-cli@latest build --platform android
```

---

## Gemini models

The default is **`gemini-pro-latest`**. If Pro has no quota (free-tier keys get 0 Pro requests) or is overloaded, CalMon falls back automatically:

```
gemini-pro-latest → gemini-3.1-pro-preview → gemini-3.8-flash → gemini-3.5-flash → gemini-flash-latest
```

It remembers models that failed for a while, so later calls go straight to one that works. In **Settings** you can pick a model, type any model id, or turn the fallback off.

---

## Ask a chat app

The free Gemini API runs out fast. Your **Gemini app** (or ChatGPT) doesn't. If an analysis fails, the error card offers **Ask Gemini / ChatGPT app**.

1. **Tap "Ask a chat app instead"**, or pick it from the error card.
2. **Tap "Copy prompt & share photo".** CalMon copies a prompt with your whole day in it (what you've eaten, your targets, the time, and the exact JSON format it needs) and opens the share sheet with your photo.
3. **Pick Gemini, paste, send.**
4. **Tap "Copy code" on the reply and come back.** CalMon spots the answer on your clipboard and fills it in.
5. **Tap "Import meal".** You land on the normal review screen with every item and the **Next up** suggestion.

The import tolerates messy replies: code fences, chatty text around the JSON, smart quotes, and trailing commas all parse fine. The prompt starts with a `CALMON v1` marker, so the app never mistakes its own prompt on the clipboard for a reply.

---

## Code map

| Path | What's inside |
| --- | --- |
| `src/app/` | Screens (Expo Router): `(tabs)/index` Today, `(tabs)/history`, `(tabs)/stats`, `(tabs)/settings`, `capture`, `review`, `meal/[id]`, `onboarding`, `profile`, `handoff` |
| `src/components/` | `Mascot` (Mon), `CalorieRing`, `MealGrid`, `MacroBars`, `FoodItemRow`, `RecommendationCard`, `AnalyzingLoader`, … |
| `src/lib/prompt.ts` | Shared prompt, JSON schema, response parsing |
| `src/lib/gemini.ts` | Gemini API transport + model fallback chain |
| `src/lib/handoff.ts` | Chat-app prompt + tolerant paste-back parser |
| `scripts/build-android.sh` | One-command Android build (checks tools, disk and network, then builds the APK) |
| `src/lib/db.ts` | SQLite schema + queries (profile, settings, meals, food_items, weights) |
| `src/lib/stats.ts`, `src/components/charts/` | Stats calculations (day ranges, per-meal totals, weight gaps, axis ticks) and the SVG weight / calorie charts |
| `src/lib/mealSlot.ts`, `nutrition.ts` | Time → meal slot, BMR/TDEE/targets, per-unit scaling |
| `src/lib/backup.ts` | JSON export / import |
| `src/theme/` | Light / dark tokens + `ThemeProvider` |
| `src/store/` | Zustand app store |

---

## Checks

```bash
npm test            # unit tests: slot logic, nutrition math, response parsing, chat-app handoff, stats
npx tsc --noEmit    # typecheck
npx expo-doctor     # dependency / config health check
```

---

<sub>Calorie values are AI estimates. Please don't use them for medical decisions.</sub>
