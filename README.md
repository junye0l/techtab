# Tech Tab

**[소개 페이지 →](https://junye0l.github.io/techtab/)** · **[Landing page →](https://junye0l.github.io/techtab/)**

국내 빅테크 기술 블로그를 새 탭에서 모아보는 크롬 확장 프로그램입니다.<br>
A Chrome extension that gathers Korean big-tech engineering blogs onto your new-tab page.

네이버, 카카오, 토스, 쿠팡, 당근마켓 등 21개 기업의 기술 블로그 RSS를 매시간 자동으로 수집해서, 관심 있는 기업만 골라 나만의 피드로 볼 수 있습니다.<br>
It auto-collects the RSS feeds of 21 companies — NAVER, Kakao, Toss, Coupang, Daangn, and more — every hour, so you can pick the ones you care about and build your own feed.

## 주요 기능 · Features

- **21개 국내 기업 기술 블로그** RSS 자동 수집 (매시간 갱신)<br>
  **RSS from 21 Korean companies' engineering blogs**, auto-collected and refreshed hourly
- 원하는 기업만 골라서 보드에 추가/제거, **드래그 앤 드롭**으로 순서 변경<br>
  Add or remove only the companies you want, and reorder columns by **drag and drop**
- **북마크**로 나중에 읽을 글 저장, **읽음 표시**로 이미 본 글 구분<br>
  Save posts to read later with **bookmarks**; already-read posts are marked
- 마지막으로 본 시점 이후 올라온 글에 **NEW 뱃지**<br>
  A **NEW badge** on posts published since your last visit
- 제목 키워드 자동 추출(AI, Kafka, LLM 등) 배지 표시<br>
  Auto-extracted keyword badges from titles (AI, Kafka, LLM, …)
- **영어 / 한국어 지원** — 블로그 글 제목은 DeepL로 번역<br>
  **English and Korean** — post titles are translated with DeepL
- 다크/라이트 모드, Google 검색창 내장<br>
  Dark/light mode, with a built-in Google search box
- 처음 열었을 때 3D로 조립되는 로고 인트로 (three.js)<br>
  A 3D logo intro that assembles itself on first open (three.js)

## 기술 스택 · Tech stack

**프론트엔드 · Frontend** (`extension/`)
- React + TypeScript + Vite
- Chrome Extension Manifest V3 — 새 탭 오버라이드 · new-tab override
- three.js + troika-three-text — 로고 인트로 애니메이션 · logo intro animation
- lucide-react — 아이콘 · icons

**백엔드 · Backend** (`worker/`)
- Cloudflare Workers + D1 (SQLite)
- fast-xml-parser로 RSS/Atom 피드 파싱 · RSS/Atom feed parsing
- Cron Trigger로 매시간 자동 수집 · hourly auto-collection
- DeepL API로 글 제목 한→영 번역 · post-title KO→EN translation

## 프로젝트 구조 · Project structure

```
.
├── DESIGN.md          # 디자인 시스템 레퍼런스 (Vercel 스타일) · design-system reference
├── extension/         # 크롬 확장 프로그램 · the Chrome extension
│   ├── public/        # manifest.json, 아이콘, 폰트, _locales · manifest, icons, fonts, _locales
│   └── src/           # React 앱 · React app
└── worker/            # Cloudflare Workers 백엔드 · backend
    └── src/
        ├── feeds.ts    # RSS 소스 목록 · RSS source list
        └── index.ts    # 수집 로직 + API · collection logic + API
```

## 로컬 개발 · Local development

### 확장 프로그램 · Extension

```bash
cd extension
npm install
npm run dev       # http://localhost:5173 미리보기 · preview
npm run build     # dist/ 생성 → chrome://extensions 에서 압축해제된 확장 프로그램 로드
                  # build dist/, then "Load unpacked" in chrome://extensions
```

### 백엔드 · Backend (Cloudflare Workers)

```bash
cd worker
npm install
npx wrangler login
npx wrangler d1 create hackertab-kr   # wrangler.toml의 database_id 갱신 필요 · update database_id in wrangler.toml
npm run db:init                       # 로컬 D1에 스키마 적용 · apply schema to local D1
npm run dev                           # 로컬 개발 서버 · local dev server
npm run deploy                        # 배포 · deploy
```
