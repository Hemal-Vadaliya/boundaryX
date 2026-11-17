# BoundaryX

A premium, client-side cricket scoring and match-management web application.
No backend, no database, no automatic browser persistence — match documents
live in memory for the session and are explicitly exported/imported as JSON.

See [BoundaryX_Detailed_Development_Plan.md](../BoundaryX_Detailed_Development_Plan.md)
in the repository root for the full product and technical plan this project
follows.

## Stack

React + TypeScript + Vite, Tailwind CSS v4 + shadcn/ui (Radix primitives),
Motion, Zustand, Zod, Recharts, Vitest + React Testing Library, Playwright,
vite-plugin-pwa.

## Scripts

```bash
npm run dev          # start the dev server
npm run build        # type-check and build the static production bundle
npm run preview      # preview the production build locally
npm run lint         # oxlint
npm run format       # prettier --write
npm run test         # vitest (unit/component tests)
npm run test:watch   # vitest in watch mode
npm run test:e2e     # playwright end-to-end tests
```

## Project status

- **Phase 1 (foundation & design system)** — complete: app shell, responsive
  desktop/mobile navigation, dark/light theming, shared UI components, Zustand
  session store (in-memory only, no persistence middleware), and Vitest +
  Playwright tooling.
- **Phase 2 (dashboard, matches, teams, players)** — complete: dashboard with
  search/filter and unsaved-work handling, match creation wizard (details,
  rules, team selection, playing XI validation, toss), reusable session team
  and player templates, squad management, match switching/removal with
  confirmation.
- **Phase 3 (cricket rules engine)** — complete: rules profile model (MCC
  laws + format defaults + competition overrides + deterministic resolver),
  the `recordDelivery` pipeline (extras/dismissal/bowler-eligibility
  validation, strike rotation, over/free-hit state, derived figures),
  innings lifecycle (completion checks, target, follow-on, declaration),
  match results (limited-overs, Test, Super Over), and a replay-based
  correction/undo foundation. Pure TypeScript, independent of React.
- **Phase 4 (live scoring interface)** — complete: the engine is now wired
  into `MatchDocument` (resolved `rulesProfile` + `innings[]`), with two new
  engine commands (`retireBatterHurt`, `editLastDelivery` with a preserved
  correction audit trail). The scoring screen (`/matches/:matchId/score`)
  covers starting an innings, all run/extras/wicket controls, over
  completion with bowler eligibility, retiring/returning a batter, undo,
  edit-last-ball, declare and end-innings — one responsive layout for
  desktop and mobile, with Motion-driven score/run feedback that respects
  `prefers-reduced-motion`.
- **Phase 5 (scorecards, statistics and results)** — complete: multi-innings
  progression (starting innings 2+, chase targets, Test follow-on prompts)
  and `determineMatchResult` are now wired into the scoring flow, writing
  `MatchDocument.result`/`status` once a match concludes. The scorecard
  screen (`/matches/:matchId/scorecard`) shows batting/bowling figures,
  extras breakdown, fall of wickets, partnerships, powerplays and an
  over-by-over summary per innings. Match statistics
  (`/matches/:matchId/statistics`) add a Recharts run-progression chart plus
  top-scorer/best-bowling/highest-partnership highlights; the cross-match
  Statistics page aggregates every loaded match's player figures strictly
  by stable player ID (never by display name, so same-named players from
  different imports are never merged).
- **Phase 6 (JSON import/export and session management)** — complete: a
  full Zod schema (`src/schemas/`) mirrors the real `MatchDocument`/`Innings`
  shape, versioned via an `{ app, schemaVersion, match, metadata }` envelope
  (and an `{ app, schemaVersion, matches[], metadata }` bundle envelope for
  "Export All"), with a migration framework ready for future schema bumps.
  Import (`/import`) reads files independently so one bad file never blocks
  the rest, recalculates every innings' derived figures against the engine's
  invariant checker before showing a preview, and never resolves a duplicate
  match ID silently — skip / import-as-copy (preserving `sourceMatchId`) /
  cancel are explicit choices. Export writes a pretty-printed, schema-tagged
  file via the browser's File API and only marks a match "saved" once the
  download has actually been triggered.
- **Phase 7 (polish, PWA, accessibility, performance)** — complete:
  `MotionConfig reducedMotion="user"` now wraps the whole app (previously
  scoped to the scoring feature only), a route-change fade and a card-grid
  stagger (`RouteTransition`, `StaggeredCardGrid`) add the motion the plan
  calls for without any extra per-component reduced-motion handling. The
  scoring feature's player-picker sheets (`NewBowlerSheet`,
  `SelectIncomingBatterSheet`) now expose `role="radio"`/`aria-checked`
  instead of a color-only selected state. Every route is now lazy-loaded
  (`src/app/lazyPages.ts` + `Suspense`), splitting the single 1.23 MB bundle
  into per-route chunks — the main chunk is now 486 KB and Recharts/Zod-heavy
  routes only load when visited. The PWA manifest gained real maskable
  icons (`public/icons/`) alongside the existing SVG favicon, replacing the
  unused Vite-scaffold artwork with an on-brand gold-on-navy "B" mark.
- **Phase 8 (QA & deployment)** — complete: component tests now cover the
  shared UI layer (30 React Testing Library tests across `StatusBadge`,
  `ScoreDisplay`, `EmptyState`, `ConfirmationDialog`, `TeamAvatar`,
  `MatchCard`), and a JSON fixture library
  (`src/test/fixtures/`) validates realistic match documents — completed
  T20, in-progress ODI, a retirement, and a corrected delivery — against
  the import schema. Playwright now runs every spec across Chromium,
  Firefox, WebKit and a mobile viewport, not Chromium alone. Static-host
  deployment is covered for Vercel (`vercel.json`), Netlify
  (`netlify.toml`) and GitHub Pages (`VITE_BASE_PATH` + a `postbuild`
  404.html SPA fallback). See [docs/user-guide.md](docs/user-guide.md),
  [docs/deployment.md](docs/deployment.md) and
  [docs/release-checklist.md](docs/release-checklist.md) for the
  end-user guide, deployment instructions, and the full release
  acceptance checklist with verification notes.

All 8 phases of the development plan are now complete.

## Persistence model

There is no localStorage/sessionStorage/IndexedDB usage for match data, and
none should ever be added. The service worker (PWA) caches static app shell
assets only. Match documents are lost on refresh unless exported — the app
surfaces this with a persistent unsaved-work banner.
