# PWA & Offline-First Plan

## Overview
Convert `/workouts` to a fully offline-capable PWA. Data lives in IndexedDB client-side, syncs to Postgres when online. The app should work identically whether online or offline — no loading spinners waiting on the network during normal use.

---

## Phase A: PWA Shell & Service Worker ✅
- [x] Install `@serwist/next`
- [x] Create service worker (`sw.ts`) with precaching of static assets
- [x] Create `manifest.json` (app name, icons, theme colour, display: standalone)
- [x] Add manifest and meta tags to layout
- [x] Request persistent storage (`navigator.storage.persist()`)
- [x] Add generated SW files to `.gitignore`
- [ ] Add real PWA icons (192x192, 512x512) — placeholder needed
- [ ] Test install-to-home-screen on iOS and Android

## Phase B: IndexedDB Local Data Layer ✅
- [x] Install `dexie`
- [x] Create `local-db.ts` — Dexie schema mirroring Postgres + syncQueue + idMap + syncMeta
- [x] Negative IDs for locally-created records
- [x] Create `local-data.ts` — all read functions querying IndexedDB
- [x] Create `local-actions.ts` — all write functions mutating IndexedDB + enqueuing sync
- [x] Create `hydrate-action.ts` — server action to fetch full dataset for hydration (90 days)

## Phase C: Sync Engine ✅
- [x] Create `sync.ts` — queue processor with dependency-ordered table processing
- [x] ID mapping: local negative IDs → server IDs with cascading reference updates
- [x] Process order: muscle_group → exercise → workout → workout_exercise → exercise_set
- [x] Auto-sync: flush on app load, on `online` event, every 30 seconds
- [x] `hydrateFromServer()` — full re-sync on reconnect (brute force, reliable)
- [x] `flushSyncQueue()` — processes pending items, handles failures gracefully
- [x] Delete handling: locally-only records (never synced) skip server delete

## Phase D: Rewire Components ✅
- [x] `workout-calendar.tsx` → `localGetWorkoutDatesForMonth()`
- [x] `day-exercise-list.tsx` → local reads + local writes
- [x] `movement-screen.tsx` → local reads + local writes
- [x] `workout-sidebar.tsx` → `localGetTodayWorkout()` + local writes
- [x] `exercise-manager.tsx` → local reads + local writes
- [x] `csv-import.tsx` — kept as server-only (one-time operation, requires online)
- [x] `rest-timer.tsx` — already client-only, no changes needed
- [x] Client components no longer import server action files directly
- [x] Server actions only called by sync engine

## Phase E: Offline UX Polish ✅
- [x] `WorkoutOfflineProvider` — context providing hydration state, online status, pending sync count
- [x] `SyncIndicator` — shows "offline" label and pending sync count in navbar
- [x] Workouts layout wraps all `/workouts` pages with the offline provider
- [x] Initial hydration on first visit, background refresh on subsequent visits
- [ ] Error handling UI for permanently failed sync items (deferred)

---

## Remaining TODO
- [ ] Add real PWA icons (replace placeholders)
- [ ] Test full offline flow: load app → go offline → add sets → go online → verify sync
- [ ] Test on iOS Safari (service worker quirks, storage persistence)
- [ ] Test on Android Chrome (install prompt, background sync)
- [ ] Error handling UI for failed sync items
