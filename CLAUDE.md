# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bali Spirit Festival Scheduler — a React + TypeScript SPA for managing and displaying festival schedules. Features include an admin panel, user authentication, favorites system, and AI-powered event summaries/recommendations via Google Gemini.

## Commands

```bash
npm run dev      # Start dev server on localhost:3000
npm run build    # Production build (vite build)
npm run preview  # Preview production build
```

No test runner or linter is configured.

## Architecture

### Tech Stack

- **React 19** with TypeScript, built with **Vite**
- **Supabase** for PostgreSQL database, auth (Google OAuth + email/password), and RLS policies
- **Google Gemini** (`@google/genai`) for AI event summaries and recommendations
- **Tailwind CSS** loaded via CDN (not installed locally), **Lucide React** for icons
- **date-fns** for date formatting

### Project Layout

```
App.tsx              # Root component — all top-level state, ErrorBoundary, tab routing
types.ts             # Domain model interfaces (FestivalEvent, User, Category, Venue, Presenter, ViewMode)
constants.tsx        # Fallback seed data (categories, venues, presenters, events)
index.html           # HTML shell with Tailwind CDN, Google Fonts, process.env polyfill
components/          # ~21 React components (all UI lives here)
services/
  supabase.ts        # Supabase client init, all DB queries and auth helpers
  gemini.ts          # Gemini AI integration (getEventSummary, getSmartRecommendations)
hooks/
  useFestivalData.ts # Central data-fetching hook — loads from Supabase, manages sync state
schema.sql           # Full Supabase schema with RLS policies
seed_data.sql        # Sample data for seeding the database
```

### Key Patterns

- **No router** — navigation is tab-based state (`schedule`, `presenters`, `venues`) managed in App.tsx. Modals handle detail views (EventModal, PresenterModal, AuthModal, SettingsModal).
- **State management** — useState in App.tsx with prop drilling. No Redux/Context. The `useFestivalData` hook owns all data-fetching logic and returns events/categories/venues/presenters.
- **Data flow** — Supabase → `useFestivalData` hook → App.tsx state → component props. Falls back to hardcoded constants in `constants.tsx` if Supabase is unavailable.
- **Auth** — Supabase Auth with session persistence via localStorage. Admin access checked via `user.role === 'admin'` plus a local password gate (`AdminAuth` component).
- **Import alias** — `@/*` maps to the project root (configured in both tsconfig.json and vite.config.ts).
- **Gemini API key** — exposed to client via Vite's `define` as `process.env.GEMINI_API_KEY`. Set in `.env` or `.env.local` as `GEMINI_API_KEY`.

### Database Tables (Supabase)

`categories`, `venues`, `presenters`, `events`, `event_presenters` (join table), `profiles` (user data + role), `user_favorites`. Public read access; admin-only writes enforced via RLS.

### Component Conventions

- All styling uses Tailwind utility classes — no CSS files
- Categories are color-coded via hex values on the Category type
- Responsive: mobile-first with `md:` breakpoints; `MobileNav` for bottom nav on small screens
- Print support via `no-print` CSS class and `PrintSchedule` component
- `ViewMode` type: `'grid' | 'list' | 'venue'`
