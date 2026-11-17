# BoundaryX --- Complete Product & Technical Development Plan

**Document type:** Product requirements + implementation blueprint\
**Product:** BoundaryX\
**Version:** 1.0\
**Prepared:** 15 November 2026\
**Application model:** Static, client-side web application\
**Primary objective:** A premium, responsive cricket scoring and
match-management application inspired by the familiar scoring workflow
of CricHeroes, with an original BoundaryX visual identity.

------------------------------------------------------------------------

## 1. Executive summary

BoundaryX is a static web application for creating, scoring, reviewing
and managing cricket matches. It is designed for desktop, tablet and
mobile browsers, with a particularly efficient mobile scoring
experience.

The application will not use a backend, server-side database, user
accounts, cloud synchronization or automatic browser persistence. Match
documents will be maintained in application memory as JSON objects.
Users explicitly export match JSON files to preserve their work and
import those files later to restore matches.

The application will support multiple match documents in one browser
session. Importing a match adds it to the current session; it does not
replace other loaded matches. The dashboard aggregates the matches
currently loaded in memory.

The product will include:

-   Match creation and configuration.
-   Custom teams, squads and players.
-   Playing XI selection.
-   Configurable cricket rules profiles for T10, T20, ODI, Test and
    custom formats.
-   Ball-by-ball scoring and validation.
-   Batting and bowling scorecards.
-   Partnerships, fall of wickets, over summaries and match results.
-   Match dashboard, history and statistics for the current session.
-   JSON import, validation, export and versioning.
-   Offline-capable static application shell through PWA technology,
    subject to browser caching.
-   Premium dark and light visual themes.
-   Responsive desktop, tablet and mobile layouts.
-   Automated unit, integration and end-to-end tests.

**Critical product rule:** cricket scoring correctness takes priority
over visual convenience. The scoring UI must never independently
calculate or mutate cricket totals. It submits user actions to the
rules/scoring engine, which validates the action and returns a new match
document.

------------------------------------------------------------------------

## 2. Product goals and non-goals

### 2.1 Goals

1.  Provide fast, accurate, ball-by-ball cricket scoring.
2.  Support all common cricket formats, including multi-innings Test
    matches.
3.  Make the scoring workflow practical on a phone during a live match.
4.  Provide a polished desktop dashboard and detailed scorecard
    experience.
5.  Keep the application deployable as static files.
6.  Make match data portable through a documented JSON format.
7.  Allow multiple imported or newly created matches to coexist in one
    session.
8.  Make scoring state reproducible from recorded delivery and match
    events.
9.  Support configurable official playing conditions rather than
    assuming one universal rule set.
10. Make the application testable without a server.

### 2.2 Non-goals for the initial release

-   User accounts or authentication.
-   Server-side database.
-   Cloud synchronization between devices.
-   Shared live scoring by multiple scorers.
-   Public match pages or social networking.
-   Tournament registration and discovery marketplace.
-   Live public score broadcasting.
-   Automated ball tracking or computer vision.
-   Automatic DLS calculation unless a separately verified
    implementation is commissioned.
-   Payments, subscriptions or advertising.

These may be considered in a future product version, but must not
complicate the initial static architecture.

------------------------------------------------------------------------

## 3. Confirmed product decisions

  Area                    Decision
  ----------------------- ---------------------------------------------------------
  Application             Static web application
  Frontend                React + TypeScript + Vite
  Styling                 Tailwind CSS + shadcn/ui
  Animation               Motion
  State management        Zustand
  Persistence             No database and no automatic browser persistence
  Match source of truth   In-memory JSON match documents
  Import                  User selects and uploads a JSON file
  Export                  User explicitly downloads a JSON file
  Multiple matches        Supported in one browser session
  Automatic recovery      Not required
  Formats                 T10, T20, ODI, Test and custom
  Players                 Custom teams and players
  Rules                   Official laws and applicable playing-condition profiles
  Themes                  Premium dark and light
  Responsive              Desktop, tablet and mobile
  Hosting                 Static hosting
  Backend                 None

### 3.1 Important consequence of the no-persistence decision

The browser's in-memory state is temporary. Refreshing, closing the tab,
navigating away in a way that destroys the application, or losing the
browser process can discard every match that has not been exported.

The application must therefore:

-   Display a persistent unsaved-work indicator.
-   Clearly explain that loaded matches exist only in the current
    session.
-   Provide a prominent Export action.
-   Provide an Export All action for session-level backup.
-   Warn before clearing the session or removing a match that has
    unexported changes.
-   Never claim that a match is saved unless the user has downloaded the
    JSON file.

Do not add localStorage, sessionStorage, IndexedDB, Cache API data
storage for match records, or Zustand persistence middleware. PWA
caching may cache static application assets only; it must not be used to
persist match data.

------------------------------------------------------------------------

## 4. Technology stack

### 4.1 Recommended stack

  -----------------------------------------------------------------------
  Layer                   Technology              Responsibility
  ----------------------- ----------------------- -----------------------
  UI framework            React                   Component-based UI

  Language                TypeScript              Type safety

  Build tool              Vite                    Development server and
                                                  static production build

  Routing                 React Router            Client-side page
                                                  navigation

  Styling                 Tailwind CSS            Responsive styling and
                                                  design tokens

  UI primitives           shadcn/ui + Radix UI    Dialogs, menus, tabs,
                                                  tooltips and accessible
                                                  controls

  Animation               Motion (`motion/react`) Transitions and scoring
                                                  feedback

  State                   Zustand                 In-memory session and
                                                  active-match state

  Validation              Zod                     Runtime validation of
                                                  imported JSON and
                                                  actions

  Charts                  Recharts                Match and player
                                                  statistics

  Icons                   Lucide React            Consistent iconography

  Dates                   date-fns                Date formatting

  Testing                 Vitest                  Unit and engine tests

  Component tests         React Testing Library   UI behaviour

  E2E tests               Playwright              Full workflows and
                                                  responsive checks

  PWA                     vite-plugin-pwa         Static app shell and
                                                  installability

  File handling           Browser File API        JSON import and
                                                  download
  -----------------------------------------------------------------------

### 4.2 Installation baseline

``` bash
npm create vite@latest boundaryx -- --template react-ts
cd boundaryx
npm install

npm install react-router-dom zustand zod motion lucide-react recharts date-fns
npm install -D tailwindcss @tailwindcss/vite
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
npm install -D @playwright/test vite-plugin-pwa
```

Use compatible, current package versions and commit the lockfile. Do not
blindly copy version numbers from an old setup guide.

### 4.3 Static deployment

The production build must be a static directory, normally `dist/`,
containing HTML, JavaScript, CSS, icons and manifest assets.

Deployment targets:

-   Vercel static hosting.
-   Netlify static hosting.
-   GitHub Pages, with correct Vite base-path configuration.
-   Any static web host that supports SPA route fallback.

No API endpoint or server runtime is required.

------------------------------------------------------------------------

## 5. High-level architecture

``` text
┌─────────────────────────────────────────────────────────────┐
│                     BoundaryX React UI                      │
│ Dashboard | Matches | Teams | Players | Scoring | Scorecard  │
└──────────────────────────────┬──────────────────────────────┘
                               │ user actions / selectors
┌──────────────────────────────▼──────────────────────────────┐
│                    Application State                        │
│ Zustand: loaded matches, selected match, UI preferences     │
│ In-memory only; no persistence middleware                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ commands
┌──────────────────────────────▼──────────────────────────────┐
│                  Application / Match Services               │
│ create | import | export | select | remove | update         │
└──────────────────────────────┬──────────────────────────────┘
                               │ validated commands
┌──────────────────────────────▼──────────────────────────────┐
│                  Cricket Domain / Rules Engine              │
│ Laws | playing conditions | delivery | innings | results    │
│ calculations | corrections | event replay                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ immutable updated document
┌──────────────────────────────▼──────────────────────────────┐
│                    Match JSON Documents                     │
│ teams | rules | innings | deliveries | events | metadata    │
└──────────────────────────────┬──────────────────────────────┘
                               │ explicit user action
┌──────────────────────────────▼──────────────────────────────┐
│                    Browser File API                         │
│ Import JSON | Export one match | Export all matches         │
└─────────────────────────────────────────────────────────────┘
```

### 5.1 Architectural principles

-   Keep the cricket engine independent of React.
-   Keep the match schema independent of UI layout.
-   Treat match JSON as the portable document format.
-   Treat delivery and match events as authoritative source records.
-   Derive totals, scorecards and dashboard statistics from source
    records.
-   Use immutable state updates.
-   Validate all imported data at runtime.
-   Keep rule profiles versioned and attached to each match.
-   Do not store match records in browser persistence.
-   Keep presentation-only preferences separate from match data.

------------------------------------------------------------------------

## 6. Repository and folder structure

``` text
boundaryx/
├── public/
│   ├── icons/
│   ├── images/
│   ├── favicon.svg
│   └── manifest.webmanifest
│
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   ├── providers.tsx
│   │   └── routeConfig.ts
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── navigation/
│   │   ├── feedback/
│   │   └── common/
│   │
│   ├── features/
│   │   ├── dashboard/
│   │   ├── matches/
│   │   ├── match-setup/
│   │   ├── teams/
│   │   ├── players/
│   │   ├── scoring/
│   │   ├── scorecard/
│   │   ├── statistics/
│   │   ├── import-export/
│   │   └── settings/
│   │
│   ├── domain/
│   │   ├── match/
│   │   ├── team/
│   │   ├── player/
│   │   ├── innings/
│   │   ├── delivery/
│   │   ├── dismissal/
│   │   └── result/
│   │
│   ├── engine/
│   │   ├── commands/
│   │   ├── rules/
│   │   │   ├── laws/
│   │   │   ├── formats/
│   │   │   ├── competitions/
│   │   │   └── resolver/
│   │   ├── scoring/
│   │   ├── calculations/
│   │   ├── innings/
│   │   ├── results/
│   │   ├── corrections/
│   │   └── replay/
│   │
│   ├── schemas/
│   │   ├── match.schema.ts
│   │   ├── delivery.schema.ts
│   │   ├── event.schema.ts
│   │   └── import.schema.ts
│   │
│   ├── services/
│   │   ├── matchService.ts
│   │   ├── importService.ts
│   │   ├── exportService.ts
│   │   └── fileService.ts
│   │
│   ├── store/
│   │   ├── sessionStore.ts
│   │   ├── matchSelectors.ts
│   │   └── uiStore.ts
│   │
│   ├── hooks/
│   ├── types/
│   ├── utils/
│   ├── styles/
│   ├── test/
│   └── main.tsx
│
├── docs/
│   ├── product-specification.md
│   ├── cricket-rules-matrix.md
│   ├── match-json-schema.md
│   └── test-scenarios.md
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

------------------------------------------------------------------------

## 7. Visual identity and design system

### 7.1 Design direction

BoundaryX should feel like a premium sports analytics product:
sophisticated, clean, confident and information-rich.

The product may follow familiar cricket scoring workflows and
information hierarchy, but must use its own brand identity, layouts,
icons and visual assets. Do not copy CricHeroes' proprietary artwork,
branding or exact screens.

### 7.2 Colour palette

#### Dark theme

  Token              Hex         Use
  ------------------ ----------- --------------------------------
  Background         `#101827`   Main application background
  Surface            `#1C2B40`   Cards and panels
  Elevated surface   `#253D57`   Dialogs and overlays
  Accent gold        `#C6A15B`   Primary actions and highlights
  Ivory              `#F3F0E8`   High-emphasis text
  Muted text         `#AAB6C5`   Secondary text
  Teal               `#16A085`   Positive status
  Amber              `#D9A441`   Warnings
  Wicket red         `#C75B62`   Wickets and destructive states

#### Light theme

  Token            Hex         Use
  ---------------- ----------- -----------------
  Background       `#F3F0E8`   Main background
  Surface          `#FFFFFF`   Cards
  Primary text     `#172235`   Main text
  Secondary text   `#667085`   Supporting text
  Accent gold      `#A9823F`   Primary accent
  Border           `#E4E0D7`   Separators
  Teal             `#13866F`   Positive status
  Wicket red       `#B94752`   Wicket status

Check text contrast for accessibility; colour alone must not communicate
a state.

### 7.3 Typography

-   Primary font: Inter.
-   Use tabular numerals for scores, overs and statistics.
-   Use medium/semibold weights for headings.
-   Avoid excessive all-caps labels.
-   Keep score numerals prominent.
-   Maintain readable mobile body text.

### 7.4 Component standards

Create reusable components:

-   `AppShell`
-   `DesktopSidebar`
-   `MobileBottomNavigation`
-   `AppHeader`
-   `PageContainer`
-   `MatchCard`
-   `DashboardStatCard`
-   `ScoreDisplay`
-   `TeamAvatar`
-   `PlayerAvatar`
-   `StatusBadge`
-   `PrimaryButton`
-   `ConfirmationDialog`
-   `BottomSheet`
-   `ImportDropzone`
-   `UnsavedChangesBanner`
-   `EmptyState`
-   `ErrorState`
-   `LoadingState`

### 7.5 Animation principles

Use Motion for purposeful feedback, not decoration that delays scoring.

  Interaction       Behaviour
  ----------------- --------------------------------------
  Route change      Short fade/slide
  Card appearance   Subtle stagger
  Score update      Number transition
  Four              Brief boundary highlight
  Six               More prominent but short celebration
  Wicket            Distinct wicket feedback
  Dialog            Spring entrance and exit
  Bottom sheet      Smooth upward motion
  Theme switch      Short colour transition
  Import success    Confirmation animation

Scoring state updates must complete immediately. Animation must never
block a scoring action. Respect reduced-motion preferences.

------------------------------------------------------------------------

## 8. Responsive experience and navigation

### 8.1 Breakpoints

  Width              Layout
  ------------------ ---------------
  Below 640px        Mobile
  640--767px         Large mobile
  768--1023px        Tablet
  1024--1279px       Small desktop
  1280px and above   Full desktop

### 8.2 Desktop navigation

-   Dashboard
-   Matches
-   New Match
-   Teams & Players
-   Statistics
-   Settings

Use a persistent sidebar with a compact/collapsed state.

### 8.3 Mobile navigation

-   Home
-   Matches
-   Score
-   Teams
-   More

Use a bottom navigation bar. During live scoring, prioritise the scoring
interface and avoid unnecessary navigation.

### 8.4 Responsive rules

-   Do not simply scale down desktop tables; convert them to stacked
    cards or horizontally scrollable tables where appropriate.
-   Keep scoring controls within thumb reach.
-   Use bottom sheets for player selection and detailed scoring options.
-   Keep the live score and over summary visible.
-   Ensure touch targets are comfortably sized.
-   Support portrait and landscape layouts.
-   Avoid horizontal overflow.
-   Test on narrow phones, tablets and large desktop screens.

------------------------------------------------------------------------

## 9. Application modules and requirements

### 9.1 Home dashboard

The dashboard is an overview of all match documents currently loaded in
the session.

Components:

1.  Welcome header.
2.  New Match action.
3.  Import Match action.
4.  Export All action.
5.  Total matches.
6.  Ongoing matches.
7.  Completed matches.
8.  Upcoming matches.
9.  Recent matches.
10. Active match cards.
11. Team and player overview for loaded match documents.
12. Unsaved-work warning.

Dashboard statistics must be calculated from the current in-memory
collection. Do not trust dashboard values copied from imported JSON
without recalculation.

### 9.2 Match management

Required actions:

-   Create match.
-   Open match.
-   Select active match.
-   Switch between loaded matches.
-   Edit permitted match metadata.
-   Export a match.
-   Remove a match from the current session.
-   Export all loaded matches.
-   Filter by status, format, date and team.
-   Search by match or team name.

Removing a match from the session is not the same as deleting a
downloaded file. The application cannot delete files from the user's
device.

### 9.3 Team management

A match JSON must contain a snapshot of the participating teams and
their players. This preserves the match's historical identity if a user
later edits a team elsewhere.

The session may also offer reusable team templates in memory. Because
there is no persistence, reusable templates disappear when the session
ends unless the user exports them.

Recommended future enhancement: separate Team JSON import/export,
without introducing a backend.

Team fields:

-   Team ID.
-   Name.
-   Short name.
-   Optional logo or colour reference.
-   Squad.
-   Captain.
-   Wicketkeeper.
-   Player roles.

### 9.4 Player management

Player fields:

-   Player ID.
-   Display name.
-   Optional jersey number.
-   Role: batter, bowler, all-rounder, wicketkeeper.
-   Batting style, optional.
-   Bowling style, optional.
-   Captain flag.
-   Wicketkeeper flag.

A player can have multiple capabilities; role labels should not prevent
a player from batting or bowling.

### 9.5 Match setup workflow

Recommended steps:

1.  Match name and venue.
2.  Match date and format.
3.  Rules profile and playing conditions.
4.  Overs/innings configuration where applicable.
5.  Team A selection.
6.  Team B selection.
7.  Playing XI selection.
8.  Captain and wicketkeeper confirmation.
9.  Toss winner and decision.
10. Confirm match setup.
11. Start first innings.

Validate all required fields before starting. Do not hardcode a
universal 11-player requirement for every custom or shortened format;
make squad and playing-XI limits configurable where the playing
conditions allow it.

------------------------------------------------------------------------

## 10. Match JSON data architecture

### 10.1 Source of truth

The match document is the portable record of one match.

Authoritative data:

-   Match identity and metadata.
-   Team and player snapshots.
-   Rule profile and exact rule-set version.
-   Toss and match setup.
-   Innings definitions.
-   Delivery records.
-   Non-delivery match events.
-   Corrections and event history.
-   Result declarations and interruptions.

Derived data:

-   Team totals.
-   Batter scorecards.
-   Bowling figures.
-   Overs and run rates.
-   Partnerships.
-   Fall of wickets.
-   Required run rate.
-   Match result summary.
-   Dashboard summaries.

Derived data must be reproducible from authoritative records. It may be
included as a cache for fast rendering, but the application must be able
to recalculate it and detect mismatches.

### 10.2 Suggested top-level JSON

``` json
{
  "app": "BoundaryX",
  "schemaVersion": 1,
  "match": {},
  "rules": {},
  "teams": [],
  "innings": [],
  "matchEvents": [],
  "result": null,
  "derived": {
    "summary": {},
    "scorecards": [],
    "statistics": {}
  },
  "metadata": {
    "createdAt": "ISO-8601",
    "updatedAt": "ISO-8601",
    "engineVersion": "1.0.0",
    "rulesVersion": "identified-rule-set"
  }
}
```

This is a design example, not the final schema. The production schema
must be fully typed and validated with Zod.

### 10.3 Delivery model

Each delivery should preserve enough information to reconstruct the
score and explain the event.

Suggested fields:

-   Delivery ID.
-   Innings ID.
-   Sequence number.
-   Over sequence.
-   Legal ball number, if applicable.
-   Striker ID before delivery.
-   Non-striker ID before delivery.
-   Bowler ID.
-   Batter runs.
-   Extras by category.
-   Total runs attributed to the delivery.
-   Legal-delivery outcome.
-   Dismissal, if any.
-   Dismissed batter and fielder/assisting fielder where applicable.
-   Running/overthrow/short-run details where required.
-   Free-hit state before and after delivery.
-   Timestamp.
-   Correction linkage, if edited.

Do not rely on a single generic `extras` number. Preserve the category
and attribution of every extra.

### 10.4 Non-delivery events

Some events cannot be accurately represented as a normal delivery. Use
typed events for:

-   Penalty runs.
-   Retired hurt / return.
-   Retired out.
-   Declaration.
-   Forfeiture.
-   Innings start/end.
-   Change of target or overs.
-   Rain interruption and resumption.
-   Concussion or other permitted replacement.
-   Match abandonment.
-   Super Over creation.
-   Official result adjustment.

### 10.5 Schema versioning

-   Every JSON file must include `schemaVersion`.
-   Every match must include an engine version and rules profile
    identifier.
-   Imports with a newer unsupported schema must be rejected with a
    clear message.
-   Older supported schemas should pass through explicit migration
    functions.
-   Never silently reinterpret a historical match using a different
    rules profile.
-   Keep migrations deterministic and test them with fixture files.

------------------------------------------------------------------------

## 11. Import and export workflow

### 11.1 Import

1.  User selects Import Match.
2.  Open a file picker accepting `.json`.
3.  Read the file using the File API.
4.  Parse JSON with safe error handling.
5.  Validate the top-level schema.
6.  Check application identity and schema version.
7.  Validate required match, teams, rules, innings and events.
8.  Recalculate derived score data.
9.  Compare recalculated values with any included cached values.
10. Show an import preview.
11. Check duplicate match IDs and offer a safe resolution.
12. User confirms.
13. Add the match to the in-memory collection.
14. Select it or return to the dashboard according to user choice.

Importing one file must not erase other loaded matches.

For multiple-file import, process each file independently and show
successful and failed imports separately.

### 11.2 Duplicate match IDs

Do not silently overwrite an already loaded match.

Offer choices:

-   Skip duplicate.
-   Import as a copy with a new match document ID, preserving a
    `sourceMatchId`.
-   Cancel import.

If importing as a copy, preserve the match's original event history and
update only the document identity metadata.

### 11.3 Export one match

-   Serialize the full document.
-   Recalculate derived values before export.
-   Include schema and engine version.
-   Pretty-print JSON for readability.
-   Generate a safe filename.
-   Trigger a browser download.
-   Update the session's export/dirty status only after the download
    action is initiated successfully.

Example filename:

`BoundaryX_Team-Alpha-vs-Team-Beta_2026-11-15.json`

### 11.4 Export all

Download a single session bundle JSON containing an array of complete
match documents, or a ZIP containing one JSON per match if ZIP support
is added. The format must be documented and versioned.

Recommended initial implementation: a versioned bundle JSON to avoid
adding another dependency.

### 11.5 Unsaved state

Maintain a session-only dirty flag per match.

-   New match: dirty.
-   Scoring action: dirty.
-   Match metadata edit: dirty.
-   Successful export: mark the exported revision as clean.
-   Subsequent edit: dirty again.
-   Imported match: initially clean because it was loaded from a file;
    subsequent edits make it dirty.

If the browser closes, the application cannot recover unexported work.
State this clearly.

------------------------------------------------------------------------

## 12. Cricket rules engine

This is the highest-risk and most important technical module.

### 12.1 Rules authority and configuration

Use two layers:

1.  **MCC Laws of Cricket** as the foundational law set.
2.  **Applicable competition playing conditions** as overrides or
    additions.

Do not treat "official rules" as one universal configuration.
International men's and women's cricket, domestic competitions,
tournament-specific conditions and local club cricket can differ.

Every match should record:

-   Format.
-   Competition or rules profile.
-   Governing body/jurisdiction.
-   Men's/women's or applicable category where relevant.
-   Effective date or document edition.
-   Exact playing-conditions identifier/version.
-   Configurable local modifications, if the user selects custom
    conditions.

The rules resolver must be deterministic. If a profile cannot be
identified or is unsupported, clearly label it as a custom or incomplete
profile rather than claiming official compliance.

### 12.2 Core engine modules

``` text
engine/
├── commands/
│   ├── recordDelivery.ts
│   ├── recordPenalty.ts
│   ├── recordDismissal.ts
│   ├── completeOver.ts
│   ├── endInnings.ts
│   └── correctEvent.ts
├── rules/
│   ├── laws/
│   ├── formats/
│   ├── competitions/
│   └── resolver/
├── scoring/
│   ├── deliveryProcessor.ts
│   ├── extrasCalculator.ts
│   ├── runAttribution.ts
│   ├── strikeCalculator.ts
│   └── overCalculator.ts
├── calculations/
│   ├── battingFigures.ts
│   ├── bowlingFigures.ts
│   ├── partnerships.ts
│   ├── fallOfWickets.ts
│   ├── runRates.ts
│   └── inningsTotals.ts
├── innings/
│   ├── inningsLifecycle.ts
│   ├── targetCalculator.ts
│   ├── followOn.ts
│   └── declaration.ts
├── results/
│   ├── limitedOversResult.ts
│   ├── testResult.ts
│   └── superOver.ts
├── corrections/
│   ├── undo.ts
│   └── amendDelivery.ts
└── replay/
    └── rebuildMatch.ts
```

### 12.3 Delivery processing sequence

For every delivery:

1.  Confirm that the match and innings are active.
2.  Validate the selected striker, non-striker and bowler.
3.  Validate the delivery action against the rules profile.
4.  Validate extras combinations and run attribution.
5.  Validate dismissal eligibility.
6.  Calculate batter runs, extras and total team runs.
7.  Determine legal-ball status.
8.  Determine wicket count and bowler wicket credit.
9.  Calculate batter-end changes using applicable running and crossing
    rules.
10. Update legal ball count and over state.
11. Update free-hit state where applicable.
12. Determine whether a new batter or bowler selection is required.
13. Determine whether the innings or match has ended.
14. Append the authoritative event.
15. Recalculate affected derived values.
16. Return a new immutable match document.

If any validation fails, return a structured error and leave the
original document unchanged.

### 12.4 Extras

Support:

-   Wide.
-   No-ball penalty.
-   Byes.
-   Leg-byes.
-   Penalty runs.
-   Overthrows.
-   Short runs and disallowed runs where relevant.

The engine must distinguish:

-   Runs credited to the batter.
-   Runs charged to the bowler.
-   Runs added to the team total.
-   Runs that count towards the over.
-   Penalty runs awarded independently of a delivery.

Do not assume every extra can be combined with every other extra.
Validate combinations under the applicable laws and playing conditions.

### 12.5 Dismissals

Support all applicable dismissal types, including:

-   Bowled.
-   Caught.
-   Caught and bowled.
-   LBW.
-   Run out.
-   Stumped.
-   Hit wicket.
-   Hit the ball twice.
-   Obstructing the field.
-   Timed out.
-   Retired out.

Also support retired hurt and return as batter-state events, not as
ordinary dismissals.

For every dismissal, distinguish:

-   Whether a wicket is added to the innings.
-   Whether the bowler receives credit.
-   Which batter is dismissed.
-   Fielder and assisting fielder.
-   Whether the batter can be dismissed on the delivery type.
-   Which end the incoming batter occupies.

### 12.6 Strike and batter-end management

Do not implement strike rotation as only `runs % 2`.

The engine must consider:

-   Completed runs.
-   Whether runs were disallowed.
-   Whether the ball reached the boundary.
-   Whether batters crossed at the relevant time.
-   Which batter was dismissed.
-   Whether the innings/over ended.
-   Incoming batter placement.
-   Applicable changes to the crossing law and competition conditions.

Represent batter positions as ends (for example, striker's end and
non-striker's end) and resolve the final occupants after the delivery.

### 12.7 Overs and bowler rules

-   Count valid deliveries, not delivery records.
-   Support configurable balls per over where required by local
    conditions.
-   Wides and no-balls do not count as valid balls under standard
    cricket rules.
-   Byes and leg-byes generally count as valid deliveries.
-   Handle interrupted or incomplete overs.
-   Prevent a bowler from bowling consecutive overs where the applicable
    rules prohibit it.
-   Apply format-specific maximum overs per bowler.
-   Support bowler changes after injury, suspension or other permitted
    events.
-   Calculate maiden overs according to the applicable conditions and
    correct run attribution.

### 12.8 Free hits

Free-hit rules must be enabled only by the relevant playing conditions.

Where enabled, implement:

-   Triggering no-ball.
-   Next delivery state.
-   Continuation after an invalid free-hit delivery where the conditions
    require it.
-   Permitted dismissal restrictions.
-   Applicable field-change restrictions.
-   State persistence in the event history.

Do not assume free hits apply to every cricket format.

### 12.9 Powerplays and field restrictions

Powerplay phases must be data-driven. Store phase start/end overs,
fielding restrictions and effective changes caused by interruptions or
revised innings length.

Do not hardcode a single universal T20 or ODI powerplay table.

### 12.10 Format support

#### T10

-   Configurable innings overs.
-   Competition-specific bowling limits.
-   Competition-specific powerplay/free-hit rules.
-   Target and chase logic.
-   Optional Super Over according to the competition.

#### T20

-   Standard 20-over profile.
-   Competition-specific field restrictions.
-   Bowler maximum.
-   Free-hit rules where applicable.
-   Target/chase.
-   Super Over where applicable.

#### ODI

-   Standard 50-over profile or reduced overs.
-   Applicable powerplay phases.
-   Bowler maximum.
-   Interruption and revised-over handling.
-   Competition-specific tie-break rules.
-   Super Over where applicable.

#### Test

-   Two innings per team in the standard match structure.
-   Follow-on eligibility and enforcement.
-   Declaration and forfeiture.
-   Unlimited overs subject to match conditions.
-   Day/session progression where tracked.
-   Draw, tie and win-by-innings/run results.
-   Multi-day interruptions and match completion.

#### Custom

Allow configurable:

-   Overs per innings.
-   Balls per over if applicable.
-   Players per side.
-   Innings per team.
-   Bowler limits.
-   Extras and dismissal profile.
-   Free-hit and powerplay rules.
-   Tie-break procedure.
-   Local rule notes.

Custom profiles must be clearly identified as custom and not represented
as official ICC profiles.

### 12.11 Rain and revised targets

Initial version:

-   Record interruptions.
-   Record revised overs.
-   Record revised target and method.
-   Record the authority/source of the revised target.
-   Preserve the original target and revised target history.
-   Permit manual entry of an officially supplied DLS target.

Full DLS calculation is a separate scope item. Do not approximate or
invent DLS resource tables.

### 12.12 Super Over

-   Separate innings records.
-   Separate Super Over sequence.
-   Competition-specific team and player eligibility.
-   Wicket and overs limits.
-   Tie continuation.
-   Main-match statistics remain distinguishable from Super Over
    statistics.

------------------------------------------------------------------------

## 13. Scoring screen -- Phase 4 design

### 13.1 Desktop layout

``` text
┌──────────────────────────────────────────────────────────────┐
│ BoundaryX     Match: Team A vs Team B       Export   Menu    │
├──────────────────────────────────────────────────────────────┤
│ TEAM A                 124/3             14.2 / 20 overs      │
│ CRR 8.65               Target 181        RRR 8.40             │
├──────────────────────────────────────────────────────────────┤
│ BATTERS                         BOWLER                       │
│ Striker A      54 (32)           Bowler X   2.2 - 18 - 1      │
│ Non-striker B  21 (17)           Economy  7.71               │
├──────────────────────────────────────────────────────────────┤
│ THIS OVER: 1  0  4  W  2  1                                  │
├──────────────────────────────────────────────────────────────┤
│  0     1     2     3     4     6                              │
│  W     WD    NB    BYE   LB    MORE                           │
├──────────────────────────────────────────────────────────────┤
│ Undo       Edit Last Ball       Change Batter       End Over  │
└──────────────────────────────────────────────────────────────┘
```

This is a structural wireframe, not a final visual design.

### 13.2 Mobile layout

Prioritise:

1.  Team score and overs.
2.  Current run rate / required run rate.
3.  Current batters.
4.  Current bowler.
5.  Current over timeline.
6.  Large scoring controls.
7.  Extras and dismissal controls.
8.  Undo and correction actions.

Use bottom sheets for detailed choices. Keep the most common scoring
actions accessible with minimal taps.

### 13.3 Scoring workflow

-   Select batter runs.
-   Select extras where needed.
-   Select wicket and dismissal details where needed.
-   Confirm the delivery if the action is ambiguous.
-   Engine validates and records it.
-   UI updates score, over, batters and bowler.
-   Prompt for next batter/bowler only when required.
-   Provide immediate undo.

A simple run button may record a delivery directly only when all
required information is already known and the action is unambiguous.

### 13.4 Scoring controls

-   0, 1, 2, 3, 4, 5, 6.
-   Wide.
-   No-ball.
-   Bye.
-   Leg-bye.
-   Penalty.
-   Wicket.
-   More actions.
-   Undo.
-   Edit delivery.
-   Retire batter.
-   Change bowler.
-   End innings where permitted.

### 13.5 Over timeline

Show each delivery in sequence, including illegal deliveries. Use clear
labels for:

-   Runs.
-   Wicket.
-   Wide.
-   No-ball.
-   Bye.
-   Leg-bye.
-   Penalty or unusual event.

The timeline must distinguish legal ball count from event sequence.

------------------------------------------------------------------------

## 14. Scorecards and statistics -- Phase 5

### 14.1 Batting scorecard

Columns:

-   Batter.
-   Dismissal description.
-   Runs.
-   Balls.
-   Fours.
-   Sixes.
-   Strike rate.

Support not-out, retired hurt, retired out and did-not-bat states
distinctly.

### 14.2 Bowling scorecard

Columns:

-   Bowler.
-   Overs.
-   Maidens.
-   Runs conceded.
-   Wickets.
-   Economy.
-   Wides.
-   No-balls.

Use the correct rules for bowler-conceded runs and wicket credit.

### 14.3 Additional scorecard sections

-   Total.
-   Extras breakdown.
-   Fall of wickets.
-   Partnerships.
-   Over-by-over summary.
-   Powerplay totals.
-   Innings target and chase status.
-   Match result.
-   Super Over scorecard where applicable.

### 14.4 Statistics

Match statistics:

-   Total runs.
-   Wickets.
-   Overs.
-   Run rate.
-   Boundaries.
-   Extras.
-   Highest partnership.
-   Top scorer.
-   Best bowling.
-   Fall-of-wicket progression.
-   Over-by-over scoring.

Player statistics within loaded matches:

-   Runs.
-   Balls faced.
-   Fours and sixes.
-   Strike rate.
-   Wickets.
-   Overs.
-   Runs conceded.
-   Economy.
-   Catches and run-outs where recorded.

Player aggregation must use stable player identity and must not merge
unrelated players merely because their display names match. If imported
matches use different player IDs, offer an explicit merge/linking
mechanism in a future enhancement.

------------------------------------------------------------------------

## 15. Undo, correction and event replay

### 15.1 Requirements

-   Undo the last scoring action.
-   Correct a prior delivery.
-   Correct batter, bowler or dismissal attribution.
-   Recalculate affected scorecards.
-   Recalculate innings totals and result.
-   Preserve a correction audit trail.
-   Avoid silently deleting historical information.

### 15.2 Recommended approach

Use an append-oriented event history with explicit correction/reversal
records. A correction should identify the original event and the
replacement/correction reason.

For a corrected delivery:

1.  Validate the correction.
2.  Build a corrected authoritative event sequence.
3.  Replay the innings or match from a known initial state.
4.  Recompute derived scorecards and statistics.
5.  Validate invariants.
6.  Commit the new match document only if replay succeeds.

For a simple immediate undo, a previous immutable state snapshot may be
used in memory, but the exported match must preserve enough correction
history to explain the final authoritative record.

------------------------------------------------------------------------

## 16. Phase-by-phase development roadmap

### Phase 1 --- Foundation and design system

**Deliverables**

-   Vite React TypeScript project.
-   Tailwind and shadcn/ui configuration.
-   Router and application shell.
-   Theme tokens.
-   Dark and light themes.
-   Responsive navigation.
-   Shared UI components.
-   Motion foundation.
-   Zustand session store.
-   Vitest and Playwright setup.
-   Linting and formatting.

**Acceptance criteria**

-   App runs locally.
-   Desktop and mobile shell work.
-   Theme switching works.
-   Routes render.
-   No match persistence is configured.
-   Basic tests pass.

### Phase 2 --- Dashboard, matches, teams and players

**Deliverables**

-   Dashboard.
-   Match cards and filters.
-   Match creation wizard.
-   Match metadata.
-   Team and player management.
-   Squad and Playing XI selection.
-   Match switcher.
-   In-memory multiple-match collection.
-   Import/export UI scaffolding.

**Acceptance criteria**

-   Create multiple match documents.
-   Switch between matches.
-   Add and edit teams/players.
-   Validate playing XI.
-   Remove a match with confirmation.
-   Dashboard statistics derive from loaded matches.

### Phase 3 --- Cricket rules engine

**Deliverables**

-   Domain types and schemas.
-   Rules profile resolver.
-   Delivery processor.
-   Extras and run attribution.
-   Dismissal validation.
-   Strike/end calculation.
-   Over calculation.
-   Bowling limits.
-   Free-hit state.
-   Powerplay state.
-   Innings lifecycle.
-   Test-match logic.
-   Match result engine.
-   Super Over model.
-   Correction/replay foundation.
-   Comprehensive unit tests.

**Acceptance criteria**

-   Engine processes valid deliveries.
-   Invalid deliveries do not mutate match state.
-   Score and legal-ball calculations are correct.
-   Dismissal restrictions are enforced.
-   Strike and over state are reproducible.
-   Test and limited-overs innings can be completed.
-   All critical rule tests pass.

### Phase 4 --- Live scoring interface

**Deliverables**

-   Desktop scoring layout.
-   Mobile scoring layout.
-   Scoreboard.
-   Batter and bowler panels.
-   Run controls.
-   Extras controls.
-   Dismissal dialogs.
-   Batter/bowler selection.
-   Over timeline.
-   Free-hit and powerplay indicators.
-   Undo and edit-last-delivery.
-   Unsaved-work indicator.
-   Immediate export action.

**Acceptance criteria**

-   A scorer can complete a sample innings from the UI.
-   UI values match engine calculations.
-   Mobile controls are practical and responsive.
-   No scoring action is lost due to an animation.
-   Invalid actions produce clear explanations.

### Phase 5 --- Scorecards, statistics and results

**Deliverables**

-   Batting scorecard.
-   Bowling scorecard.
-   Extras.
-   Fall of wickets.
-   Partnerships.
-   Over-by-over analysis.
-   Run rates.
-   Target/chase display.
-   Match result.
-   Test-match result.
-   Player and match statistics.

**Acceptance criteria**

-   All values reconcile with delivery/event history.
-   Imported matches render the same scorecards.
-   Results are correct for supported scenarios.
-   Charts work on mobile and desktop.

### Phase 6 --- JSON import/export and session management

**Deliverables**

-   Zod match schema.
-   Import file picker and drag/drop.
-   Schema validation.
-   Preview and confirmation.
-   Duplicate detection.
-   Import multiple files.
-   Export individual match.
-   Export all session matches.
-   Filename generation.
-   Schema migrations.
-   Dirty/clean session indicators.
-   Error handling and recovery messaging.

**Acceptance criteria**

-   Exported match can be imported into a fresh session.
-   All teams, players, innings, deliveries, events and results are
    restored.
-   Importing one match does not replace another.
-   Duplicate imports are handled explicitly.
-   Invalid files never corrupt loaded matches.
-   No browser persistence is introduced.

### Phase 7 --- Polish, PWA, accessibility and performance

**Deliverables**

-   Final animation system.
-   Dark/light theme polish.
-   Installable PWA.
-   Static asset caching.
-   Offline application shell.
-   Loading, empty and error states.
-   Keyboard accessibility.
-   Reduced-motion support.
-   Responsive refinements.
-   Bundle analysis and performance improvements.

**Acceptance criteria**

-   App shell opens offline after assets have been cached.
-   Match records are not automatically persisted.
-   Core controls are keyboard accessible.
-   Reduced-motion preference is respected.
-   No major layout overflow at target breakpoints.

### Phase 8 --- Quality assurance and deployment

**Deliverables**

-   Unit test suite.
-   Engine scenario tests.
-   Component tests.
-   Playwright end-to-end tests.
-   Cross-browser checks.
-   Mobile viewport tests.
-   JSON fixture library.
-   Production build.
-   Static deployment.
-   User documentation.
-   Release checklist.

**Acceptance criteria**

-   Production build succeeds.
-   Critical engine tests pass.
-   Import/export round-trip tests pass.
-   Match scoring workflows pass on mobile and desktop.
-   No critical console errors.
-   Deployment works without backend services.

------------------------------------------------------------------------

## 17. Testing strategy

### 17.1 Unit tests

Test individual calculations:

-   Legal delivery.
-   Extras.
-   Run attribution.
-   Overs.
-   Run rate.
-   Batter figures.
-   Bowler figures.
-   Dismissal eligibility.
-   Wicket credit.
-   Strike rotation.
-   Free-hit state.
-   Innings completion.
-   Target calculation.
-   Match result.

### 17.2 Scenario tests

Create full innings and match fixtures for:

1.  Normal T20 innings.
2.  Innings with wides and no-balls.
3.  Byes and leg-byes.
4.  Run out after completed runs.
5.  Caught dismissal.
6.  Stumping.
7.  Free-hit sequence.
8.  Bowler maximum reached.
9.  All-out innings.
10. Successful chase.
11. Defended target.
12. Tied limited-overs match.
13. Super Over.
14. Test follow-on.
15. Test declaration.
16. Test draw.
17. Rain-reduced match with manually supplied revised target.
18. Corrected earlier delivery.
19. Imported match replay.
20. Multi-match session.

### 17.3 Invariants

After every accepted scoring transaction, verify:

-   Team total reconciles with authoritative run events.
-   Legal-ball count equals the count of legal deliveries.
-   Wickets reconcile with dismissal events and applicable wicket
    adjustments.
-   Batter runs reconcile with batter-attributed delivery runs.
-   Extras reconcile by category.
-   Bowler conceded runs follow the correct attribution rules.
-   A player is not simultaneously occupying both batting ends.
-   A dismissed batter is not still active unless the rules permit a
    return.
-   Over and innings states are internally consistent.
-   Match result is consistent with the innings state.

### 17.4 End-to-end tests

Test these workflows:

-   Create match → configure teams → toss → score → export.
-   Import JSON → inspect match → switch match → export.
-   Import two files → dashboard shows both.
-   Import duplicate → user chooses resolution.
-   Invalid file → readable validation error.
-   Complete a match → scorecard and result.
-   Refresh browser → demonstrate that unexported state is not restored.
-   Export all → import bundle into a fresh session.

------------------------------------------------------------------------

## 18. Performance and reliability

-   Use immutable updates and selectors to avoid unnecessary React
    renders.
-   Memoize expensive scorecard and statistics calculations.
-   Recalculate only affected innings where safe, but retain full replay
    as the correctness reference.
-   Avoid storing duplicate large derived structures unless required for
    performance.
-   Use stable IDs for matches, teams, players, innings and deliveries.
-   Use Web Workers only if later profiling demonstrates a need.
-   Keep import file-size limits configurable and explain them to users.
-   Handle malformed or unusually large files safely.
-   Do not use `eval` or execute imported content.
-   Treat all imported JSON as untrusted data.
-   Render user-provided names as text, never as raw HTML.

------------------------------------------------------------------------

## 19. Accessibility and usability

-   Use semantic HTML.
-   Ensure keyboard navigation.
-   Provide visible focus states.
-   Label icon-only buttons.
-   Provide accessible dialog titles and descriptions.
-   Do not rely on colour alone.
-   Support screen readers for score changes without announcing every
    irrelevant render.
-   Respect reduced-motion settings.
-   Maintain adequate touch targets.
-   Confirm destructive actions.
-   Provide undo for scoring mistakes.
-   Make error messages actionable.

------------------------------------------------------------------------

## 20. Security and privacy

Although the application has no backend, imported files must be treated
as untrusted input.

-   Validate every imported document.
-   Enforce supported schema versions.
-   Limit file sizes.
-   Avoid rendering raw HTML from imported data.
-   Never execute imported scripts or expressions.
-   Do not include secrets or credentials.
-   Do not send match data to analytics or third-party services.
-   Avoid external network requests in normal scoring.
-   Keep all scoring calculations local to the browser.
-   Document that exported JSON files may contain player names and match
    information and should be shared carefully.

------------------------------------------------------------------------

## 21. Risks and mitigations

  -----------------------------------------------------------------------
  Risk                                Mitigation
  ----------------------------------- -----------------------------------
  Browser closes before export        Persistent visible unsaved warning
                                      and easy export

  Incorrect cricket rules             Independent engine, official rule
                                      references and scenario tests

  Rules change over time              Versioned profiles and explicit
                                      rule-set identifiers

  Imported JSON is corrupted          Runtime validation and safe import
                                      preview

  Duplicate match IDs                 Explicit skip/copy/cancel handling

  Large match documents               Efficient calculations and
                                      configurable import limits

  Scorecard mismatch                  Rebuild derived values from
                                      authoritative events

  Mobile scoring is cumbersome        Dedicated mobile-first scoring
                                      layout and usability tests

  PWA confusion                       Cache app assets only; never imply
                                      match data is saved

  Custom rules are mistaken for       Label custom profiles clearly
  official                            

  DLS calculation errors              Manual official target entry
                                      initially; separate verified
                                      implementation later
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 22. Release acceptance checklist

### Product

-   [ ] Dashboard.
-   [ ] Match creation.
-   [ ] Match switching.
-   [ ] Multiple matches in session.
-   [ ] Teams and players.
-   [ ] Playing XI.
-   [ ] Match setup and toss.
-   [ ] Live scoring.
-   [ ] Extras and dismissals.
-   [ ] Scorecards.
-   [ ] Statistics.
-   [ ] Results.
-   [ ] JSON import.
-   [ ] JSON export.
-   [ ] Export all.
-   [ ] Duplicate handling.

### Cricket correctness

-   [ ] Legal-ball calculation.
-   [ ] Run attribution.
-   [ ] Extras.
-   [ ] Strike rotation.
-   [ ] Dismissal restrictions.
-   [ ] Bowler figures.
-   [ ] Over completion.
-   [ ] Free hits where applicable.
-   [ ] Powerplays where applicable.
-   [ ] Innings lifecycle.
-   [ ] Test follow-on and declaration.
-   [ ] Super Over where applicable.
-   [ ] Result calculation.
-   [ ] Corrections and replay.

### Technical

-   [ ] No backend.
-   [ ] No database.
-   [ ] No localStorage/sessionStorage match persistence.
-   [ ] No IndexedDB match persistence.
-   [ ] JSON schema validation.
-   [ ] Schema versioning.
-   [ ] Unit tests.
-   [ ] Integration tests.
-   [ ] E2E tests.
-   [ ] Static production build.
-   [ ] PWA asset caching only.

### UI

-   [ ] Premium dark theme.
-   [ ] Premium light theme.
-   [ ] Desktop responsive.
-   [ ] Tablet responsive.
-   [ ] Mobile responsive.
-   [ ] Accessible controls.
-   [ ] Reduced-motion support.
-   [ ] Scoring animations.
-   [ ] Unsaved-work messaging.

------------------------------------------------------------------------

## 23. Suggested implementation order

The development phases above are product milestones. For practical
coding, use this order:

1.  Initialize the repository and design system.
2.  Build the app shell and responsive navigation.
3.  Define domain types and Zod schemas.
4.  Build in-memory multi-match state.
5.  Build dashboard and match setup.
6.  Build teams, players and Playing XI.
7.  Implement the rules profile model.
8.  Implement the scoring engine with tests.
9.  Implement innings and match result logic.
10. Build the live scoring interface.
11. Build scorecards and statistics.
12. Implement import/export and migrations.
13. Add corrections and event replay.
14. Complete PWA, accessibility and performance work.
15. Run full regression tests and deploy.

Do not begin the final live-scoring UI until the core scoring commands
and their tests are stable.

------------------------------------------------------------------------

## 24. Official cricket references and rules governance

Cricket rules must be verified against the exact edition and playing
conditions selected for a match. The following are authoritative
starting points:

1.  **MCC --- Laws of Cricket:**\
    https://www.lords.org/mcc/about-the-laws-of-cricket

2.  **ICC --- Playing Conditions:**\
    https://www.icc-cricket.com/about/cricket/rules-and-regulations/playing-conditions

3.  **ICC --- Key changes across formats, October 2026:**\
    https://www.icc-cricket.com/news/key-changes-across-formats-with-new-icc-playing-conditions

4.  **ICC --- Playing conditions and regulations:**\
    https://www.icc-cricket.com/about/cricket/rules-and-regulations

The ICC updated playing conditions in October 2026, and changes apply
according to the start date of the relevant international series.
Therefore, the engine must not assume that one current rules profile
applies retrospectively to every match.

Before declaring a profile officially compliant, map each implemented
rule to the relevant law or playing-condition clause and test it.

------------------------------------------------------------------------

## 25. Final product definition

BoundaryX is a static, offline-capable cricket scoring and
match-management web application.

It has no backend and no database. The user owns match documents as JSON
files. The app manages multiple documents in memory during a session and
provides explicit import/export controls for continuity.

The product combines:

-   A premium sports-tech interface.
-   A responsive dashboard.
-   Custom team and player management.
-   A versioned cricket rules engine.
-   Accurate ball-by-ball scoring.
-   Complete scorecards and match statistics.
-   Portable JSON match documents.
-   Automated correctness tests.
-   Static deployment.

**The defining principle of BoundaryX is simple: a premium scoring
experience backed by a rules engine that can explain and reproduce every
score.**

------------------------------------------------------------------------

## Appendix A --- Suggested initial routes

  Route                            Screen
  -------------------------------- --------------------------------
  `/`                              Dashboard
  `/matches`                       Match collection
  `/matches/new`                   Create match
  `/matches/:matchId`              Match overview
  `/matches/:matchId/score`        Live scoring
  `/matches/:matchId/scorecard`    Scorecard
  `/matches/:matchId/statistics`   Match statistics
  `/teams`                         Session team templates
  `/players`                       Session player management
  `/import`                        Import match
  `/settings`                      Theme and application settings

Use route guards or clear empty states when a requested match ID is not
loaded in the current session.

## Appendix B --- Definition of done for a scoring action

A scoring action is complete only when:

1.  The action is valid under the selected rules profile.
2.  All required player and innings references are valid.
3.  The delivery/event is recorded.
4.  Team totals and legal balls are correct.
5.  Batter and bowler figures reconcile.
6.  Strike and over state are correct.
7.  Any wicket or innings transition is correct.
8.  The updated match document passes schema validation.
9.  The UI reflects the returned state.
10. Undo/correction can recover from an accidental action.

## Appendix C --- Important scope boundary

"Supports all formats" means the architecture supports the relevant
match structures and configurable playing conditions. It does not mean
every domestic league, local tournament, historical rule edition or
competition-specific exception is automatically implemented at launch.

A rules profile should only be labelled official after its source
document, effective date, clauses, implementation and tests have been
reviewed. Custom profiles should remain available for local cricket.

------------------------------------------------------------------------

**End of BoundaryX Product & Technical Development Plan**
