# Stocky: Product & Technical Spec (v1 draft)

Status: **DRAFT, awaiting review.** No implementation has started. Section 13 lists the open questions.

## 1. Overview

Stocky is a mobile-first website for tracking daily calorie intake, in the style of MyFitnessPal. A user signs in, logs the foods they eat under meals (breakfast, lunch, dinner, snacks), and sees how they are doing against a daily calorie goal. Every user keeps their own food library, so a food created once can be logged again on any later day.

### Goals
- Fast logging on a phone (few taps, large touch targets).
- Per-user private food library that is searchable and reusable.
- Clear daily total and remaining calories.
- Review of previous days, plus a 7-day trend.

### Non-goals for v1
- Macros or micronutrients (calories only).
- Public or shared food database, barcode scanning.
- Offline-first support, push notifications, native apps.
- Exercise tracking, weight tracking, social features.
- Dark mode.

## 2. Tech stack

| Area | Choice |
|---|---|
| Framework | Vue 3 + Vite (existing scaffold in `stockyapp/`, plain JavaScript) |
| Styling | Tailwind CSS v4 via `tailwindcss` + `@tailwindcss/vite` |
| Auth | Firebase Authentication (email/password + Google) |
| Database | Cloud Firestore |
| Routing | `vue-router` (**new dependency, needs approval**) |
| State | `pinia` (**new dependency, needs approval**) |
| Firebase SDK | `firebase` (modular v9+ API) |
| Chart | Hand-built inline SVG bars (no library). Revisit if more chart types are needed. |

Project conventions stay as in `CLAUDE.md`: no semicolons, single quotes, print width 100, `@` alias for `src/`.

## 3. User flows

### 3.1 Authentication
1. The signed-out user lands on **Login**.
2. They can sign in with email and password, tap **Continue with Google**, or switch to **Sign up** (email, password, confirm password).
3. **Forgot password** sends a Firebase reset email.
4. After a successful sign-in:
   - New user: create the `users/{uid}` document and go to the **goal setup** step (3.2).
   - Returning user: go to the **Diary**.
5. **Log out** (in Settings) returns to Login and clears local state.

### 3.2 First run: set a daily goal
A single-field screen asks for a daily calorie goal (default suggestion 2000). It can be changed later in Settings.

### 3.3 Diary (home)
1. Opens on today's date.
2. The header shows the date with previous and next arrows and a tap-to-pick date control.
3. A summary card shows **Goal − Food = Remaining**, with a progress bar.
4. Four meal sections: Breakfast, Lunch, Dinner, Snacks. Each shows a subtotal and its entries, plus an **Add food** button.
5. Tapping an entry opens **Edit entry** (3.5).

### 3.4 Add food to a meal
1. Tapping **Add food** on a meal opens the **Add Food** screen with that meal and date preselected.
2. A search box filters the user's saved foods as they type.
3. With an empty search box, the list shows **Recent** foods (ordered by `lastUsedAt`).
4. Tapping a food opens a bottom sheet where the user picks the number of servings and sees the calories update. **Add** saves the entry and returns to the Diary.
5. If nothing matches, the screen offers **Create "<query>"**. This opens the new-food form:
   - Name (required)
   - Serving description (required, for example "1 slice" or "100 g")
   - Calories per serving (required, whole number ≥ 0)
6. Saving the new food adds it to the user's library and goes to the servings sheet to log it in one step.

### 3.5 Edit or delete an entry
- From the Diary, tap an entry. The user can change servings, move it to another meal, or delete it (with a confirm).
- Editing an entry never changes the food in the library.

### 3.6 Manage foods
- The **Foods** tab lists the library with search.
- The user can edit a food's name, serving and calories, or delete it.
- Changing or deleting a food does not alter past entries, because entries store a snapshot (section 5).

### 3.7 History
- The **History** tab shows a bar chart of total calories for the last 7 days (today last), with a horizontal line at the daily goal.
- Tapping a bar opens that day in the Diary.
- Days with no entries show a zero-height bar.

### 3.8 Settings
- Change daily calorie goal.
- Show the signed-in email.
- Log out.

## 4. Screens

All screens target a 360 px wide baseline and scale up. On wider screens the content is centered in a column about 480 px wide.

| Screen | Route | Notes |
|---|---|---|
| Login / Sign up | `/login` | Email form, Google button, toggle between modes, forgot-password link |
| Goal setup | `/setup` | Shown once, only if `dailyGoal` is missing |
| Diary | `/` (optional `?date=YYYY-MM-DD`) | Home, bottom tab bar |
| Add Food | `/add?meal=&date=` | Search, recents, create-new form, servings sheet |
| Foods | `/foods` | Library list, edit and delete |
| History | `/history` | 7-day chart |
| Settings | `/settings` | Goal, account, log out |

Every data screen has three states: **loading** (skeleton or spinner), **empty** (friendly message with a call to action), and **error** (message with a retry button).

### Navigation
A fixed **bottom tab bar** on Diary, Foods, History and Settings. Add Food and Login hide it.

## 5. Data model (Firestore)

```
users/{uid}
  dailyGoal: number          // kcal
  createdAt: timestamp

users/{uid}/foods/{foodId}
  name: string
  nameLower: string          // for case-insensitive prefix search
  servingLabel: string       // "1 slice", "100 g"
  calories: number           // per serving
  createdAt: timestamp
  lastUsedAt: timestamp      // drives "Recent"

users/{uid}/entries/{entryId}
  date: string               // "YYYY-MM-DD", the user's local day
  meal: "breakfast" | "lunch" | "dinner" | "snacks"
  foodId: string             // reference only, may be orphaned
  name: string               // snapshot
  servingLabel: string       // snapshot
  caloriesPerServing: number // snapshot
  servings: number           // e.g. 0.5, 1, 2.25
  totalCalories: number      // caloriesPerServing * servings, rounded
  createdAt: timestamp
```

### Queries
- Diary: entries `where date == D`.
- History: entries `where date >= start and date <= end` (7 days).
- Search: foods `where nameLower >= q and nameLower <= q + ''`, ordered by `nameLower`. This matches name **prefixes** only. Substring matching is not supported by Firestore.
- Recents: foods ordered by `lastUsedAt` descending, limit 20.

Single-field indexes are enough for these, so no composite indexes should be needed.

### Design notes
- Dates are stored as local `YYYY-MM-DD` strings, not timestamps. This avoids time zone problems when a user crosses midnight or travels.
- Entries store a snapshot of the food. This is why history stays correct after a food is edited or deleted.
- All data lives under the user's own document, which keeps security rules simple.

## 6. Security rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

Planned tightening before launch: validate field types, `calories >= 0`, `meal` in the allowed set, and `servings > 0`.

## 7. Routing & auth guard
- The auth state is read once on startup (`onAuthStateChanged`) and the app shows a splash screen until it resolves.
- Signed-out users are redirected to `/login` from any other route.
- Signed-in users visiting `/login` are redirected to `/`.
- Signed-in users without a `dailyGoal` are redirected to `/setup`.

## 8. Business rules
- Day total = sum of `totalCalories` for the date.
- Meal subtotal = sum of `totalCalories` for that meal and date.
- Remaining = `dailyGoal − day total`. When negative, show as "over" in a warning color.
- Servings: positive numbers in steps of 0.25 (default 1, minimum 0.25, maximum 99).
- Calories are whole numbers. `totalCalories` is rounded to the nearest integer.
- Food names are trimmed, 1 to 60 characters. A user cannot create two foods with the same name and serving label (checked when saving).
- Logging an entry updates the food's `lastUsedAt`.

## 9. Mobile-first UI notes
- Minimum touch target 44×44 px.
- Primary actions near the bottom of the screen, within thumb reach.
- Use the `inputmode="numeric"` keyboard for calories and servings.
- Add to-the-edge safe-area padding (`env(safe-area-inset-bottom)`) for the tab bar.
- Bottom sheets for the servings picker and entry editor.
- Visible focus states and sufficient color contrast (WCAG AA).
- No dark mode in v1.

## 10. Proposed project structure

```
stockyapp/src/
  main.js
  App.vue
  assets/main.css            // @import "tailwindcss"
  router/index.js
  services/
    firebase.js              // app, auth, db init
    foods.js                 // food CRUD and search
    entries.js               // entry CRUD and range queries
  stores/
    auth.js
    diary.js
    foods.js
  views/
    LoginView.vue
    SetupView.vue
    DiaryView.vue
    AddFoodView.vue
    FoodsView.vue
    HistoryView.vue
    SettingsView.vue
  components/
    BottomTabBar.vue
    DateSwitcher.vue
    CalorieSummary.vue
    MealSection.vue
    EntryRow.vue
    FoodForm.vue
    ServingsSheet.vue
    WeekChart.vue
```

The create-vue demo files (`HelloWorld`, `TheWelcome`, `WelcomeItem`, `icons/`) are removed. The working-tree changes already present in `index.html` and `App.vue` are handled when implementation starts.

## 11. Configuration & secrets
- Firebase web config goes in `stockyapp/.env.local` as `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID` and `VITE_FIREBASE_APP_ID`.
- A committed `.env.example` lists the keys without values.
- Firebase web config values are not secret by themselves. Access is protected by the security rules in section 6 and by the Auth authorized-domains list.
- Setup needed in the Firebase console: create a project, enable Email/Password and Google sign-in, create a Firestore database, publish the rules, add `localhost` and the production domain to the authorized domains.

## 12. Milestones
Each one can be reviewed on its own.

1. **Foundation**: add Tailwind, vue-router and pinia, clear the demo components, set up the app shell and bottom tab bar.
2. **Firebase + auth**: Firebase init, login, sign-up, Google sign-in, reset password, route guard, logout.
3. **Goal setup & settings**.
4. **Foods**: create, list, search, edit, delete.
5. **Diary**: date switcher, meal sections, summary, add entry through the servings sheet.
6. **Entry editing**: change servings, change meal, delete.
7. **History**: 7-day chart.
8. **Polish & rules**: empty and error states, accessibility pass, tightened security rules, production build check.

There is no test runner in the repo today. Adding one (Vitest for the calorie math and the date helpers) is proposed in milestone 5 and needs approval.

## 13. Open questions
1. **Meals**: your first message said breakfast, lunch and snacks. This spec assumes four meals (breakfast, lunch, dinner, snacks). Do you want dinner included?
2. **Firebase project**: does it already exist, or should the setup steps in section 11 be walked through together?
3. **Default goal**: is 2000 kcal a reasonable suggestion, or should the user have to enter a value?
4. **Search**: prefix-only matching ("chi" finds "Chicken", but "ken" does not) is a Firestore limitation. Is that acceptable for v1?
5. **PWA**: should the site be installable on the phone home screen later? It would be a v2 item.
6. **Units**: is "servings × calories per serving" enough, or do you want to log by grams?
7. **New dependencies**: are `vue-router`, `pinia` and `firebase` approved?
