# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

TechTab ("Tech Tab - 새 탭에서 만나는 국내 빅테크 개발 뉴스") is a Chrome extension that overrides the new-tab page with a feed of Korean big-tech/startup engineering blog posts. Three independent parts in one repo:

- `extension/` — the Chrome extension (React + TypeScript + Vite, MV3, `chrome_url_overrides.newtab`)
- `worker/` — Cloudflare Worker + D1 backend that scrapes RSS feeds hourly and serves them as JSON
- `docs/` — static promo landing page + privacy policy, served via GitHub Pages at `junye0l.github.io/techtab`

## Commands

### Extension (`cd extension`)
- `npm run dev` — Vite dev server at `localhost:5173`. Fetches from the **production** worker API (no local backend needed).
- `npm run build` — outputs to `dist/`; load it unpacked via `chrome://extensions` → Developer mode → "Load unpacked" to test as a real extension.
- No test suite and no lint script exist.

### Worker (`cd worker`)
- `npm run dev` — `wrangler dev`, local D1 is empty until you run `npm run db:init` (applies `schema.sql`) and manually trigger the cron once: `curl http://localhost:8787/cdn-cgi/local/scheduled`.
- `npm run deploy` — `wrangler deploy` to production. Also happens automatically via CI (see below).

### Releasing an extension version
1. Bump `version` in both `extension/package.json` and `extension/public/manifest.json`.
2. `git tag vX.Y.Z && git push origin vX.Y.Z` — CI builds, zips `dist/`, and attaches it to an auto-generated GitHub Release.
3. Download that zip and upload it manually in the Chrome Web Store developer dashboard (store submission is not automated — it needs a human in the review flow).

## Architecture

**Data flow:** `worker/src/feeds.ts` lists ~21 hardcoded `{source, url}` RSS/Atom feeds → an hourly cron (`worker/src/index.ts`, `scheduled()`) fetches and upserts them into the D1 `articles` table (`worker/schema.sql`) → `GET /api/articles` returns the latest 10 per source → `extension/src/App.tsx` fetches that on load and renders one column per source.

**CORS is origin-locked, not wildcard.** `worker/src/index.ts`'s `corsHeaders()` only reflects back `chrome-extension://kobpfgadkgconpdpdppekbioiebnoggc` (the published extension's fixed ID) or any `http://localhost:*` origin (so `npm run dev` keeps working); every other origin gets the extension-only header, which the browser then rejects. If you ever republish under a new extension ID, `EXTENSION_ORIGIN` here must be updated.

**Favicons are mostly dynamic, with one bundled exception.** `extension/src/sourceDomains.ts`'s `faviconUrl()` proxies through Google's favicon service (`SOURCE_DOMAINS` maps each 소스 name to the domain Google should look up) — except 우아한형제들, whose blog subdomain has no indexed favicon; that one is a bundled local asset (`extension/public/icons/sources/woowahan.png`, a transparent "우아한형제들" wordmark cropped from the tech blog's own `logo.svg`, colored with the app's `--color-mute`) served via a relative path so it works identically in `npm run dev` and as a packaged extension. Check `LOCAL_ICON_OVERRIDES` before assuming every source resolves through Google.

**Security-relevant detail:** RSS `link` fields come from external, uncontrolled sources — `App.tsx`'s `isSafeUrl()` rejects anything not starting with `http(s)://` before it's used as an href, guarding against a feed injecting a `javascript:` URI.

## CI/CD (`.github/workflows/`)

- `worker-deploy.yml` — pushes to `main` touching `worker/**` auto-deploy via `cloudflare/wrangler-action`. Needs the `CLOUDFLARE_API_TOKEN` repo secret; `wranglerVersion` is pinned to `"4"` to match `worker/package.json` (the action otherwise tries to install its own older wrangler and hits a peer-dep conflict with `@cloudflare/workers-types`).
- `extension-build.yml` — push/PR touching `extension/**` runs `npm run build` as a break-check only; it does not deploy or publish anything.
- `extension-release.yml` — pushing a `v*` tag builds, zips, and attaches the extension to a GitHub Release (see "Releasing" above).

There is no release-branch gate — commits go straight to `main`; the Chrome Web Store review process is itself the gate for the extension, and the worker is low-risk enough to auto-deploy on every push.

## Design system

`DESIGN.md` documents a Vercel-inspired token system (near-white canvas, ink-black primary, a signature multi-stop mesh gradient as the only decorative color, Geist/Geist Mono type — falls back to Inter/JetBrains Mono since Geist isn't self-hostable here) used consistently across the extension UI and the `docs/` landing page. Match it rather than inventing new tokens.
