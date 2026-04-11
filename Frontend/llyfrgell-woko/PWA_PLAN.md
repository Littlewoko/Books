# PWA & Offline-First Plan

## Overview
Convert `/workouts` to a fully offline-capable PWA. Data lives in IndexedDB client-side, syncs to Postgres when online. The app should work identically whether online or offline — no loading spinners waiting on the network during normal use.

---

## Phase A: PWA Shell & Service Worker

### A1: Install PWA tooling
- [ ] Install `@serwist/next` (or `next-pwa`)
- [ ] Create service worker (`sw.ts`) with precaching of static assets
- [ ] Create `manifest.json` (app name, icons, theme colour, display: standalone)
- [ ] Register service worker in the app
- [ ] Add `<link rel="manifest">` and meta tags to layout

### A2: Cache static assets
- [ ] Precache all JS/CSS/font bundles
- [ ] Cache workout page routes with a network-first strategy (serve cached if offline)
- [ ] Cache API responses with a stale-while-revalidate strategy where appropriate

### A3: Install experience
- [ ] Add appropriate icons (192x192, 512x512)
- [ ] Test install-to-home-screen on iOS and Android
- [ ] Verify app loads offline after first visit

---

## Phase B: IndexedDB Local Data Layer

### B1: Set up IndexedDB schema (Dexie.js)
- [ ] Install `dexie` 
- [ ] Create `src/app/lib/workouts/local-db.ts`
- [ ] Define tables mirroring Postgres:
  - `muscleGroups` (id, name)
  - `exercises` (id, name, muscleGroupId, muscleGroupName)
  - `workouts` (id, date, notes)
  - `workoutExercises` (id, workoutId, exerciseId, sortOrder, exerciseName, muscleGroupName, setCount)
  - `exerciseSets` (id, workoutExerciseId, weight, weightUnit, reps, distance, distanceUnit, duration, tempo, notes, sortOrder)
  - `personalBests` (exerciseId, reps, weight, weightUnit) — derived/cached
  - `syncQueue` (localId, action, table, payload, createdAt, status)
- [ ] Use negative IDs for locally-created records (not yet synced) to avoid collisions with server IDs

### B2: Initial hydration
- [ ] On first load (or after login), fetch full dataset from server:
  - All muscle groups
  - All exercises
  - All workouts (last 90 days — configurable)
  - All workout_exercises and exercise_sets for those workouts
  - All personal bests per exercise
- [ ] Store in IndexedDB
- [ ] Track last sync timestamp in IndexedDB
- [ ] Show a one-time "Syncing data..." indicator during initial hydration

### B3: Client data service
- [ ] Create `src/app/lib/workouts/local-data.ts` — read functions that query IndexedDB
  - `getWorkoutDatesForMonth(year, month)` — query local workouts table
  - `getWorkoutForDate(date)` — query local workouts + workoutExercises
  - `getSetsForWorkoutExercise(workoutExerciseId)` — query local exerciseSets
  - `getExerciseHistory(exerciseId, limit)` — query local data, group by date
  - `getPersonalBests(exerciseId)` — query local personalBests cache
  - `getMuscleGroups()` / `getExercisesByMuscleGroup(mgId)` — query local
  - `getRecentExercises()` — query local workoutExercises sorted by date
  - `getTodayWorkout()` — query local
- [ ] These should be synchronous-feeling (IndexedDB is fast, <1ms for these queries)

### B4: Client mutation service
- [ ] Create `src/app/lib/workouts/local-actions.ts` — write functions that mutate IndexedDB AND queue sync
  - `addSet(...)` → write to local exerciseSets, enqueue sync action
  - `updateSet(...)` → update local, enqueue sync
  - `deleteSet(...)` → delete local, enqueue sync
  - `addExerciseToWorkout(...)` → write local, enqueue sync
  - `removeExerciseFromWorkout(...)` → delete local (cascade sets), enqueue sync
  - `createWorkout(...)` → write local with negative ID, enqueue sync
  - `createExercise(...)` → write local with negative ID, enqueue sync
  - `createMuscleGroup(...)` → write local with negative ID, enqueue sync
  - `reorderWorkoutExercises(...)` → update local, enqueue sync
  - `copyMovementsToToday(...)` → write local, enqueue sync per exercise
- [ ] Each mutation also updates derived data (e.g., recalculate PBs, update setCount on workoutExercise)
- [ ] Each enqueued sync action stores: `{ action: 'INSERT'|'UPDATE'|'DELETE', table, localId, payload }`

---

## Phase C: Sync Engine

### C1: Sync queue processor
- [ ] Create `src/app/lib/workouts/sync.ts`
- [ ] Process queue in FIFO order
- [ ] For each queued action:
  - Call the corresponding server action
  - On success: remove from queue, update local record with server-assigned ID if applicable
  - On failure (network): leave in queue, retry later
  - On failure (conflict/error): flag for manual resolution (unlikely in single-user)
- [ ] Handle ID mapping: when a locally-created workout (negative ID) gets a server ID, update all local references (workoutExercises pointing to that workout, etc.)

### C2: ID mapping strategy
- [ ] Maintain an `idMap` table in IndexedDB: `{ table, localId, serverId }`
- [ ] When syncing a create action, store the mapping
- [ ] When syncing child records, resolve parent IDs from the map before sending to server
- [ ] Process queue in dependency order: muscle_group → exercise → workout → workout_exercise → exercise_set

### C3: Sync triggers
- [ ] On app load: attempt to flush sync queue
- [ ] On network reconnect: `window.addEventListener('online', ...)` → flush queue
- [ ] Periodic retry: every 30 seconds if queue is non-empty and online
- [ ] After each successful server action in normal online flow: no queue needed, just confirm

### C4: Incremental sync (server → local)
- [ ] On reconnect / app load, fetch changes since last sync timestamp
- [ ] This requires a new server endpoint: `getChangesSince(timestamp)` returning modified/created records
- [ ] Merge server changes into local DB (server wins for any conflicts)
- [ ] Update last sync timestamp
- [ ] Alternative (simpler): just re-fetch the last 90 days of data on reconnect and replace local. Brute force but reliable for a single-user app.

---

## Phase D: Rewire Components

### D1: Replace server action calls with local service calls
- [ ] `workout-calendar.tsx` → use `local-data.getWorkoutDatesForMonth()`
- [ ] `day-exercise-list.tsx` → use `local-data` for reads, `local-actions` for writes
- [ ] `movement-screen.tsx` → use `local-data` for reads, `local-actions` for writes
- [ ] `workout-sidebar.tsx` → use `local-data.getTodayWorkout()`
- [ ] `exercise-manager.tsx` → use `local-data` and `local-actions`
- [ ] `csv-import.tsx` → keep as server-only (requires online, one-time operation)
- [ ] `rest-timer.tsx` → already client-only, no changes needed

### D2: Remove server action dependencies from client components
- [ ] Client components should NEVER import from server action files directly
- [ ] All data flows through the local service layer
- [ ] Server actions are only called by the sync engine

### D3: Optimistic UI
- [ ] Writes update local state immediately (already the case with IndexedDB)
- [ ] No loading spinners for mutations — they're instant locally
- [ ] Optional: show a small sync indicator (e.g., dot in navbar) when queue is non-empty
- [ ] Optional: show "offline" indicator when `navigator.onLine` is false

---

## Phase E: Offline UX Polish

### E1: Connectivity indicator
- [ ] Small indicator in navbar showing online/offline status
- [ ] Show pending sync count if queue is non-empty (e.g., "3 pending")
- [ ] Subtle — not alarming. The app works fine offline.

### E2: Sync status per record (optional)
- [ ] Locally-created records could show a subtle "not yet synced" indicator
- [ ] Probably overkill for single-user — skip unless needed

### E3: Error handling
- [ ] If sync fails permanently (e.g., server rejects a mutation), surface it clearly
- [ ] Allow retry or discard of failed sync items
- [ ] Log sync errors for debugging

---

## Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| IndexedDB library | Dexie.js | Best DX, lightweight, great TypeScript support |
| Negative IDs for local records | Yes | Avoids collision with server SERIAL IDs, easy to detect unsynced records |
| Sync order | Parent → child | Ensures FK references resolve correctly |
| Conflict strategy | Server wins on pull, client wins on push | Single user — conflicts are near-impossible |
| History cache depth | 90 days | Covers typical training cycles, keeps local DB small |
| Full re-sync on reconnect | Yes (initially) | Simpler than incremental. Optimise later if needed. |
| PWA framework | @serwist/next | Active maintenance, good Next.js App Router support |

---

## File Structure (New Files)

```
src/app/lib/workouts/
  local-db.ts          — Dexie schema and DB instance
  local-data.ts        — Read functions (IndexedDB queries)
  local-actions.ts     — Write functions (IndexedDB mutations + sync queue)
  sync.ts              — Sync engine (queue processor, ID mapping, retry logic)

public/
  manifest.json        — PWA manifest
  sw.ts                — Service worker (via @serwist/next)
  icons/               — PWA icons (192, 512)
```

---

## Migration Strategy

1. Build Phases A + B + C without changing any components
2. Test the local DB and sync engine in isolation
3. Rewire components one at a time (Phase D), testing each
4. The server actions remain intact — they become the sync target instead of being called directly
5. CSV import stays server-only
6. Existing data is hydrated on first load after the migration

---

## Estimated Effort

| Phase | Effort |
|---|---|
| A: PWA Shell | ~1 hour |
| B: IndexedDB Layer | ~3-4 hours |
| C: Sync Engine | ~3-4 hours |
| D: Rewire Components | ~2-3 hours |
| E: Polish | ~1 hour |
| **Total** | **~10-12 hours** |
