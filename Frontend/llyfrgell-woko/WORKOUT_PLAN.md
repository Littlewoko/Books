# Workout Logger — High Level Plan

## Overview
A workout logging module integrated into the existing llyfrgell-woko app. Shares auth, nav, theming, and Postgres database. Workout code lives in its own directories (`/workouts`, `/lib/workouts`, `/ui/workouts`) for clean separation and future portability.

---

## Phase 1: Schema & Data Layer ✅
- [x] Design and create database tables (exercise_set instead of set for portability):
  - `muscle_group` (id, name, user_id)
  - `exercise` (id, name, muscle_group_id, user_id)
  - `workout` (id, date, user_id, notes)
  - `workout_exercise` (id, workout_id, exercise_id, sort_order)
  - `exercise_set` (id, workout_exercise_id, weight, weight_unit, reps, distance, distance_unit, duration, tempo, notes, sort_order)
- [x] Add `user_id` to all tables from the start for future multi-user support
- [x] Create TypeScript types in `/lib/workouts/types.ts`
- [x] Create data access functions in `/lib/workouts/data.ts`
- [x] Create server actions in `/lib/workouts/actions.ts`
- [x] Create session user helper in `/utils/getSessionUser.ts`

## Phase 2: CSV Import (Admin) ✅
- [x] Build admin page at `/workouts/admin`
- [x] CSV upload and parse (PapaParse)
- [x] Extract distinct exercises and categories from CSV
- [x] Exercise → muscle group mapping UI (review & override CSV categories)
- [x] Group rows by date → create workout records
- [x] Assign set order based on row position within date + exercise groups
- [x] Bulk insert into database
- [x] Preserve comments as set notes

## Phase 3: Navigation & Layout ✅
- [x] Add "Ymarfer" (Workouts) to persistent app nav (desktop + mobile)
- [x] Calendar as workout home (`/workouts`)
- [x] Global rest timer in header — persists across navigation
- [x] Breadcrumb labels for workout routes

## Phase 4: Calendar View ✅
- [x] Monthly calendar grid with Monday start
- [x] Colour-coded dot indicators per day showing muscle groups hit
- [x] Tap day → navigate to day view
- [x] Month navigation with prev/next and click-to-return-to-today
- [x] Legend showing active muscle group colours

## Phase 5: Day View
- [ ] Route: `/workouts/[date]`
- [ ] Movement cards showing exercise name + set summaries
- [ ] Tap card → navigate to movement screen

## Phase 6: Movement Screen
- [ ] Route: `/workouts/[date]/[exerciseId]`
- [ ] **Track tab** — add, edit, delete sets (weight, reps, notes)
- [ ] **History tab** — past sessions for this exercise, PB trophy indicators
- [ ] **PBs section** — all-time rep maxes for this exercise
- [ ] **1RM calculator** — input weight × reps, output estimated maxes across rep ranges (Epley formula)

## Phase 7: Slide-in Sidebar
- [ ] Accessible from movement screen (swipe or button)
- [ ] Shows day overview: exercise count header, movement tiles (name + set count)
- [ ] Tap tile → switch to that movement (no back navigation needed)
- [ ] Hold + drag to reorder movements (dnd-kit or similar)
- [ ] "Add movement" button → modal:
  - Recents section at top
  - Select muscle group → select exercise
- [ ] "Add new exercise" link → separate page for creating new exercises/categories

## Phase 8: Exercise Management
- [ ] Browse/manage exercise library (`/workouts/exercises`)
- [ ] Add new exercise (name, muscle group)
- [ ] Add new muscle group
- [ ] Accessible from top-level nav

---

## Future Considerations (Post-v1)
- Multi-muscle group mapping per exercise (many-to-many with primary/secondary)
- Weekly volume tracking per muscle group (sets per body part per week)
- Progression graphs per exercise over time
- Multi-user support (update signIn callback to auto-create users, add user_id filtering to all book queries)
- Potential extraction to standalone app
