# Deployment Guide

BoundaryX is a static, client-side application — the production build
(`dist/`) is plain HTML/JS/CSS with no server-side runtime. Any static host
works; the sections below cover the three documented in the project plan.

## Build

```bash
npm run build
```

Output goes to `dist/`. This also runs a `postbuild` step that copies
`dist/index.html` to `dist/404.html` for GitHub Pages' SPA fallback (see
below) — it's a no-op for hosts that use their own rewrite rules.

Since the app uses `react-router-dom`'s `createBrowserRouter`, **every
static host must be configured to serve `index.html` for unknown paths**
(e.g. `/matches/abc123`) rather than returning a 404. Each option below
already has this handled.

## Vercel

`vercel.json` at the repo root rewrites every path to `/index.html`. Deploy
with the Vercel CLI or by connecting the repo in the Vercel dashboard —
no further configuration needed. Build command: `npm run build`. Output
directory: `dist`.

## Netlify

`netlify.toml` at the repo root sets the build command, publish directory,
and a catch-all redirect to `index.html`. Deploy by connecting the repo in
the Netlify dashboard, or with the Netlify CLI (`netlify deploy --prod`)
after running `npm run build`.

## GitHub Pages

GitHub Pages serves a repo under a subpath (`https://<user>.github.io/<repo>/`),
so the build needs to know that base path:

```bash
VITE_BASE_PATH=/<repo-name>/ npm run build
```

Then push the contents of `dist/` to the `gh-pages` branch (or configure
Pages to serve from a `docs/` folder or GitHub Actions artifact — any of
the standard GitHub Pages publishing methods work). The `postbuild` step's
`404.html` copy handles client-side routes that GitHub Pages would
otherwise 404 on.

If you set up a repository later, a GitHub Actions workflow that runs
`npm run build` with `VITE_BASE_PATH` set to the repo name and publishes
`dist/` via `actions/deploy-pages` is the standard approach — this project
doesn't ship one yet since it isn't under version control.

## Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `VITE_BASE_PATH` | Base path for all asset URLs. Only needed when serving from a subpath (GitHub Pages). | `/` |

No other environment variables are required — the app has no backend, no
API keys, and no server-side configuration.

## Verifying a deployment

After deploying, confirm:

1. The dashboard loads with no console errors.
2. Navigating directly to a deep link (e.g. pasting `/matches/new` into the
   address bar) loads the app instead of a 404 — this is the SPA-fallback
   check.
3. The app is installable (an "install" prompt or icon appears) and still
   loads the shell when offline after the first visit.
