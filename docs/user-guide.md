# BoundaryX User Guide

BoundaryX is a cricket scoring app that runs entirely in your browser. There
is no account to create and no server involved — everything you do stays on
your device for the current browser session, and you choose when to save
your work by exporting it as a file.

## The most important thing to know

**BoundaryX does not save anything automatically.** If you close the tab,
refresh the page, or your browser crashes, any match you haven't exported
will be lost. A banner at the top of the screen tells you when you have
unsaved matches. Export early and often, especially before closing your
laptop or putting your phone away mid-match.

## Getting started

1. Open BoundaryX in your browser. You'll land on the **Dashboard**, which
   lists every match currently loaded into this session.
2. If this is your first time, the dashboard will be empty. You have two
   ways to get a match onto the screen:
   - **New Match** — set up a brand new match from scratch.
   - **Import Match** — load a `.json` match file you (or someone else)
     exported earlier.

## Setting up players and teams

Before creating a match, it helps to have your players and teams ready:

1. Go to **Teams & Players** in the navigation.
2. Add players one at a time with their name, jersey number, role, and
   batting/bowling style. A player can bat, bowl, and keep wicket — roles
   are just labels and don't restrict anything during scoring.
3. Create a team, give it a name and a short code (used on scorecards), then
   open it and add players to its squad.

Teams and players you create here are **templates for this session only** —
they make match setup faster, but they are not saved automatically either.
If you want to reuse a squad across sessions, export the match that uses it;
a match always keeps its own frozen copy of the teams and players involved,
independent of what happens to the templates afterward.

## Creating a match

Click **New Match** and work through the setup wizard:

1. **Match details** — name, venue, and date.
2. **Rules** — pick a format (T10, T20, ODI, Test, or Custom) and adjust
   overs, players per side, or balls per over if your match doesn't follow
   the standard rules for that format.
3. **Team A** and **Team B** — pick from your team templates, or create a
   new team on the spot.
4. **Playing XI** for each team — select exactly as many players as the
   format calls for, and mark a captain and wicketkeeper.
5. **Toss** — record who won and what they chose to do, then start the match.

Once the match starts, you'll be asked to pick the opening striker, non-striker,
and bowler, and scoring begins.

## Scoring a match

The live scoring screen shows the current score, the two batters at the
crease, the bowler's figures, and the current over so far.

- Tap a run value (0 through 6) to record a delivery.
- Use the **Wide**, **No ball**, **Bye**, **Leg bye**, or **Penalty**
  buttons for extras — each opens a small picker to confirm how many runs.
- Tap **Wicket** to record a dismissal: choose the type, the fielder if
  relevant, and the incoming batter.
- **Undo** removes the most recent delivery.
- **Edit Last Ball** lets you correct a mistake on the last delivery without
  losing the record of what was originally entered — the correction is kept
  alongside the original for the match's history.
- **Retire Batter** lets a batter leave the field hurt and come back later,
  without counting as a normal dismissal.
- When an over finishes, you'll be prompted to choose the next bowler.
- When an innings reaches its natural end (overs completed, all out, or a
  chased-down target), you'll see a banner — tap **End Innings** to lock in
  the final figures and move on. For formats that allow it, you can
  **Declare** an innings early instead.

For a two-innings match, finishing the first innings takes you to a screen
to pick the next batting team's openers (and, for Test-style matches,
whether to enforce the follow-on). Once the match format's innings are all
complete, BoundaryX works out the result automatically and shows it at the
top of the scoring screen, scorecard, and match overview.

## Scorecards and statistics

From a match's overview page, use the **Scorecard** and **Statistics**
buttons to see:

- Batting and bowling figures for each innings, with a dismissal
  description (e.g. "c Smith b Jones").
- Extras broken down by type, fall of wickets, partnerships, powerplay
  totals, and an over-by-over breakdown.
- A run-progression chart, and highlights like top scorer, best bowling
  figures, and the highest partnership.

The **Statistics** page in the main navigation (not tied to one match)
aggregates player figures across every match currently loaded in the
session — handy for a quick tournament-style leaderboard.

## Saving your work: export and import

Because nothing is saved automatically, exporting is how you keep your
work:

- On a match's overview page, click **Export** to download that match as a
  `.json` file.
- On the Dashboard, click **Export All** to download every loaded match in
  one file.
- To bring a match back later (or share it with someone else), go to
  **Import Match**, drop in the `.json` file, review the preview, and
  confirm.

If you try to import a match that's already loaded in the session,
BoundaryX will ask whether to skip it, import it as a separate copy, or
cancel — it never silently overwrites anything.

## Removing a match from the session

You can remove a match from the dashboard or match list at any time. This
only removes it from the current browser session — it does **not** delete
any file you've already exported to your device. If the match has unsaved
changes, you'll be warned before it's removed.

## Working offline

BoundaryX can be installed as an app (look for an "install" option in your
browser) and will keep working without an internet connection once loaded.
This only applies to the app itself — your match data still only exists in
memory for the current session and must be exported to be kept.

## Light and dark themes

Switch between light and dark appearance from the theme toggle in the
header, or from **Settings**.
