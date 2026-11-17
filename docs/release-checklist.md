# Release Acceptance Checklist

Tracks the plan's release checklist (section 22). Checked items are verified
against the current code, not just "built at some point" — see the notes
for how each was confirmed.

## Product

- [x] Dashboard — `src/features/dashboard/DashboardPage.tsx`
- [x] Match creation — `src/features/match-setup/MatchSetupPage.tsx` wizard
- [x] Match switching — `useSessionStore`, `MatchCollectionPage`
- [x] Multiple matches in session — `sessionStore.matches` keyed by id
- [x] Teams and players — `TeamsPage`, `PlayersPage`
- [x] Playing XI — `validatePlayingXi.ts`, enforced in the setup wizard
- [x] Match setup and toss — wizard steps in `features/match-setup/steps/`
- [x] Live scoring — `LiveScoringPage` + run/extras/wicket/over controls
- [x] Extras and dismissals — `recordDelivery`, `WicketSheet`
- [x] Scorecards — `ScorecardPage`
- [x] Statistics — `MatchStatisticsPage`, `StatisticsOverviewPage`
- [x] Results — `determineMatchResult`, `MatchResultBanner`
- [x] JSON import — `ImportMatchPage`, `importService.ts`
- [x] JSON export — `ExportMatchButton`, `exportService.ts`
- [x] Export all — `ExportAllButton` (session bundle envelope)
- [x] Duplicate handling — `DuplicateMatchDialog` (skip / copy / cancel)

## Cricket correctness

- [x] Legal-ball calculation — `overCalculator.ts` + tests
- [x] Run attribution — `extrasCalculator.ts`, `runAttribution` tests
- [x] Extras — category-separated (`ExtrasBreakdown`), validated combinations
- [x] Strike rotation — `strikeCalculator.ts` (crossing-aware, not `runs % 2`)
- [x] Dismissal restrictions — `isDismissalValidForOutcome`, free-hit rules
- [x] Bowler figures — `bowlingFigures.ts`
- [x] Over completion — `completeOver.ts`, no-consecutive-overs enforced
- [x] Free hits — `freeHitCalculator.ts`
- [x] Powerplays — `powerplayTotals.ts`
- [x] Innings lifecycle — `inningsLifecycle.ts`, `nextInnings.ts`
- [x] Test follow-on and declaration — `followOn.ts`, `declaration.ts`
- [x] Super Over — `superOver.ts`
- [x] Result calculation — `limitedOversResult.ts`, `testResult.ts`
- [x] Corrections and replay — `editLastDelivery.ts`, `undo.ts`, `rebuildMatch.ts`

## Technical

- [x] No backend — static Vite build, no server code or API routes
- [x] No database
- [x] No localStorage/sessionStorage match persistence — audited, zero usage
      in non-test source
- [x] No IndexedDB match persistence
- [x] JSON schema validation — `src/schemas/` (Zod)
- [x] Schema versioning — `{ app, schemaVersion, ... }` envelope + `migrations.ts`
- [x] Unit tests — 152 engine/service/schema tests
- [x] Component tests — 30 React Testing Library tests across 6 shared components
- [x] Integration tests — fixture-backed schema validation (`src/test/fixtures/`)
- [x] E2E tests — 5 Playwright specs, run across Chromium, Firefox, WebKit,
      and a mobile Chromium viewport
- [x] Static production build — `npm run build`, no SSR
- [x] PWA asset caching only — `workbox.globPatterns` restricted to static
      assets; match data never cached

## UI

- [x] Premium dark theme / light theme — `src/index.css`
- [x] Desktop / tablet / mobile responsive — breakpoint rules throughout
- [x] Accessible controls — icon-only buttons labeled; scoring sheets use
      `role="radio"`/`aria-checked` rather than color-only selection state
- [x] Reduced-motion support — `MotionConfig reducedMotion="user"` (app-wide)
      plus a CSS `prefers-reduced-motion` fallback
- [x] Scoring animations — run-button tap, scoreboard score transition
- [x] Unsaved-work messaging — persistent banner, confirm-before-remove

## Cross-browser / cross-device

Verified by running the full Playwright suite per project, not just
configuring it:

- [x] Chromium (desktop)
- [x] Firefox (desktop)
- [x] WebKit (desktop/Safari engine)
- [x] Mobile viewport (Pixel 7, Chromium engine)

## Known gaps (acceptable, documented)

- Test-format follow-on is covered by unit tests (`followOn.test.ts`) but
  not a dedicated static JSON fixture — scripting a full four-innings,
  time-expired Test fixture was judged lower-value than the existing unit
  coverage. See `src/test/fixtures/README.md`.
- No GitHub Actions CI workflow — this working directory isn't under
  version control yet, so a workflow file would have nothing to run
  against. `docs/deployment.md` documents the manual GitHub Pages build
  steps and notes what a CI workflow should do once a repo exists.
