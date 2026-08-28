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
3. The user downloads that zip from the GitHub Release page themselves and uploads it manually in the Chrome Web Store developer dashboard (store submission is not automated — it needs a human in the review flow).

**Don't build or hand off a local `.zip` for store upload — the GitHub Release is the only distributable package.** Building one locally (even just to preview it) risks drifting from what's actually tagged, which happened once already. If a tag needs to point at newer code before it's been submitted anywhere, force-move it (`git tag -f vX.Y.Z <commit> && git push origin vX.Y.Z --force`) and let CI regenerate the Release rather than second-guessing it with a local build.

## Architecture

**Data flow:** `worker/src/feeds.ts` lists ~23 hardcoded `{source, url}` RSS/Atom feeds → an hourly cron (`worker/src/index.ts`, `scheduled()`) fetches and upserts them into the D1 `articles` table (`worker/schema.sql`) → `GET /api/articles` returns the latest 10 per source → `extension/src/App.tsx` fetches that on load and renders one column per source.

`App.tsx` has three mutually-exclusive views toggled from the header: the per-source board (default), the bookmarks grid (`showBookmarksOnly`), and a "latest posts" grid (`showRecentFeed`, opened by the `NEW` button — which pulses via `.new-toggle-bounce` when there's an article newer than `localStorage["techtab-recent-feed-seen"]`, showing the last 7 days across all sources, newest first, capped at 40). Both grids reuse the `.board` 5-col grid via the `FlatFeed` component, rendering `ArticleCard`s directly instead of `.column`s.

**CORS is origin-locked, not wildcard.** `worker/src/index.ts`'s `corsHeaders()` only reflects back `chrome-extension://kobpfgadkgconpdpdppekbioiebnoggc` (the published extension's fixed ID) or any `http://localhost:*` origin (so `npm run dev` keeps working); every other origin gets the extension-only header, which the browser then rejects. If you ever republish under a new extension ID, `EXTENSION_ORIGIN` here must be updated.

**Favicons are mostly dynamic, with one bundled exception.** `extension/src/sourceDomains.ts`'s `faviconUrl()` proxies through Google's favicon service (`SOURCE_DOMAINS` maps each 소스 name to the domain Google should look up) — except 우아한형제들, whose blog subdomain has no indexed favicon; that one is a bundled local asset (`extension/public/icons/sources/woowahan.png`, a transparent "우아한형제들" wordmark cropped from the tech blog's own `logo.svg`, colored with the app's `--color-mute`) served via a relative path so it works identically in `npm run dev` and as a packaged extension. Check `LOCAL_ICON_OVERRIDES` before assuming every source resolves through Google.

**Security-relevant detail:** RSS `link` fields come from external, uncontrolled sources — `App.tsx`'s `isSafeUrl()` rejects anything not starting with `http(s)://` before it's used as an href, guarding against a feed injecting a `javascript:` URI.

**i18n is ko/en, split by where the string lives.** UI strings go through `extension/src/i18n.ts` (`useI18n()` + `t()`, a plain dict — no library); locale is `localStorage["techtab-locale"]` or a `navigator.language` ko-prefix check, toggled by the button right of the theme toggle. Brand names and keyword badges translate for **display only** via `sourceLabel()` / `keywordLabel()` — the raw `source` string is never rewritten (it keys localStorage, favicons, and `SOURCE_DOMAINS`). Dates use `Intl.RelativeTimeFormat`. Article titles are translated **server-side**: `worker/src/index.ts` calls the DeepL Free API (`api-free.deepl.com`, `DEEPL_API_KEY` secret) for newly-inserted rows only during the hourly cron, one batched request per feed, storing `title_en`; `/api/articles` returns it and the extension falls back to `title` when it's null. The `docs/` landing page has its own tiny inline-script i18n (`data-i18n` attributes) keyed off the same `techtab-locale`. Store-listing name/description come from `extension/public/_locales/{ko,en}/messages.json` via `__MSG_*__` in the manifest (`default_locale` is `ko`); the CWS dashboard listing copy and per-locale screenshots are separate and managed there.

## CI/CD (`.github/workflows/`)

- `worker-deploy.yml` — pushes to `main` touching `worker/**` auto-deploy (also `workflow_dispatch` for a manual re-run). Runs `npm ci && npm run deploy` in `worker/` with `CLOUDFLARE_API_TOKEN` from repo secrets — i.e. the repo-pinned `wrangler` (`worker/package.json`, `^4`), not `cloudflare/wrangler-action`. The wrapper action was dropped because the repo's Actions allowlist only permits github-owned actions, which made it `startup_failure` at 0s.
- `extension-build.yml` — push/PR touching `extension/**` runs `npm run build` as a break-check only; it does not deploy or publish anything.
- `extension-release.yml` — pushing a `v*` tag (or `workflow_dispatch`) builds, zips, and attaches the extension to a GitHub Release via the preinstalled `gh` CLI (`gh release create --generate-notes`), not `softprops/action-gh-release` — same Actions-allowlist reason as `worker-deploy.yml`. Needs `permissions: contents: write` (set on the job).

There is no release-branch gate — commits go straight to `main`; the Chrome Web Store review process is itself the gate for the extension, and the worker is low-risk enough to auto-deploy on every push.

## Design system

`DESIGN.md` documents a Vercel-inspired token system (near-white canvas, ink-black primary, a signature multi-stop mesh gradient as the only decorative color, Geist/Geist Mono type — falls back to Inter/JetBrains Mono since Geist isn't self-hostable here) used consistently across the extension UI and the `docs/` landing page. Match it rather than inventing new tokens.

## Before finishing any change

**Security** (RSS content is external, uncontrolled input — treat it as hostile):
- Never render feed-derived fields (`title`, `source`, `link`) with `dangerouslySetInnerHTML`; new link usages must go through `isSafeUrl()` the same way `App.tsx` already does.
- D1 queries stay parameterized (`.bind()`); never string-concatenate feed data into SQL.
- `EXTENSION_ORIGIN` in `worker/src/index.ts` must stay an exact string match — never widen the CORS check to a wildcard or a broad prefix match.
- `CLOUDFLARE_API_TOKEN` only ever lives in the GitHub Actions repo secret — never in `wrangler.toml`, a commit, or a log.
- `DEEPL_API_KEY` only ever lives in the prod Wrangler secret (`wrangler secret put`) and the gitignored `worker/.dev.vars` — never in `wrangler.toml`, a commit, or a log.
- After adding/bumping any dependency, run `npm audit` in that package and note whether the finding is dev-only tooling (esbuild/vite/wrangler's bundled deps — low urgency) or a runtime dependency actually shipped (e.g. `fast-xml-parser` — fix promptly).

**Stability** — code that type-checks or builds isn't proof it works; this repo has shipped a layout-shift bug, a hit-area regression, and a dark-mode FOUC fix that looked fine on read-through and even in `npm run dev`, but was silently dead in the real extension:
- After a dependency bump touching the worker, run `wrangler dev`, init the local D1 (`npm run db:init`), manually trigger the cron (`curl http://localhost:8787/cdn-cgi/local/scheduled`), and confirm `/api/articles` still returns real parsed data — don't trust `npm install` succeeding alone.
- After any UI/CSS change, actually load `npm run dev` and screenshot both light and dark theme before calling it done.
- **`npm run dev` does not enforce Manifest V3's CSP** (it's a plain page at `localhost:5173`, no `script-src 'self'`). Any change involving inline `<script>`/`<style>`, `eval`, or anything else CSP-sensitive *looks* like it works there and then silently no-ops in the real extension. Ship it as `npm run build`, load the `dist/` folder unpacked in `chrome://extensions`, and check the console for CSP violation errors before calling a fix like that done — this is exactly how the FOUC fix's first attempt (an inline script) turned out to be doing nothing in production.
- A hit-area fix must preserve the element's visible size — expand the clickable range via an absolutely-positioned `::after { position: absolute; inset: -Npx }`, not by resizing the element itself (this was gotten wrong once already).

## User preferences

- Never bump `extension/package.json` / `extension/public/manifest.json` version on your own — even when landing a real fix worth shipping. Only bump when the user explicitly asks for it.
- Never `git commit` (or `git push`) on your own — always show the diff and ask first, even for small or obviously-correct changes. The user decides when something gets committed.

## Version planning workflow

Non-trivial version work (new features, source-list changes, multi-part refactors) is planned before any code is written:

- The plan lives in `NEXT_VERSION.md` at the repo root, kept out of git via `.git/info/exclude` (not `.gitignore` — the ignore rule itself must not be committed either). Edits to it never show in `git status`.
- Build the plan **collaboratively, through discussion** — propose, the user reacts, iterate. Record decisions with their rationale, keep an explicit list of open discussion points, and do the legwork the plan needs (e.g. probing feed URLs, measuring existing CSS) rather than guessing.
- **Do not start implementing until the user says the plan is verified and settled.** "Let's discuss the next version" is a request to edit `NEXT_VERSION.md`, not to touch `extension/` or `worker/`.
- Once the plan's contents have shipped, delete or clear `NEXT_VERSION.md`.
