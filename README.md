# Tech Tab

**[소개 페이지 →](https://junye0l.github.io/techtab/)** · **[Landing page →](https://junye0l.github.io/techtab/)**

국내 기술 블로그를 중심으로, 글로벌 빅테크 기술 블로그까지 새 탭에서 모아보는 크롬 확장 프로그램입니다.

*A Chrome extension that gathers Korean engineering blogs — plus the big global ones — onto your new-tab page.*

네이버, 카카오, 토스, 우아한형제들, 당근마켓 등 국내 23개 기업의 기술 블로그 RSS를 매시간 자동으로 수집해서, 관심 있는 기업만 골라 나만의 피드로 볼 수 있습니다. 상단의 지구본 버튼을 누르면 글로벌 12개 기업의 블로그도 최신순으로 모아 볼 수 있습니다.

*It auto-collects the RSS feeds of 23 Korean companies — NAVER, Kakao, Toss, Woowahan, Daangn, and more — every hour, so you can pick the ones you care about and build your own feed. The globe button at the top gathers 12 global companies' blogs too, newest first.*

## 주요 기능 · Features

- **국내 23개 + 글로벌 12개 기업 기술 블로그** RSS 자동 수집 (매시간 갱신)<br>
  *RSS from 23 Korean + 12 global companies' engineering blogs, auto-collected and refreshed hourly*

- 원하는 기업만 골라서 보드에 추가/제거, **드래그 앤 드롭**으로 순서 변경<br>
  *Add or remove only the companies you want, and reorder columns by drag and drop*

- **북마크**로 나중에 읽을 글 저장, **읽음 표시**로 이미 본 글 구분<br>
  *Bookmark posts to read later; already-read posts are marked*

- 마지막으로 본 시점 이후 올라온 글에 **NEW 뱃지**<br>
  *A NEW badge on posts published since your last visit*

- **`NEW` 버튼**으로 최근 7일간 국내 블로그의 새 글을 소스 구분 없이 한 화면에 모아보기<br>
  *A `NEW` button gathers every post from the last 7 days across the Korean blogs into one view*

- 상단의 **지구본 버튼**으로 글로벌 기업 블로그를 최신순으로 모아보기<br>
  *A globe button gathers the global companies' blogs, newest first*

- 제목 키워드 자동 추출(AI, Kafka, LLM 등) 배지 표시<br>
  *Auto-extracted keyword badges from titles (AI, Kafka, LLM, …)*

- **영어 / 한국어 지원** — 국내 글은 영어로, 글로벌 글은 한국어로 제목 자동 번역<br>
  *English and Korean — post titles are auto-translated (Korean posts into English, global posts into Korean)*

- 다크/라이트 모드, Google 검색창 내장<br>
  *Dark/light mode, with a built-in Google search box*

- 처음 열었을 때 3D로 조립되는 로고 인트로 (three.js)<br>
  *A 3D logo intro that assembles itself on first open (three.js)*

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
- DeepL API로 글 제목 자동 번역 (국내→영어, 글로벌→한국어) · post-title auto-translation (KO→EN, global→KO)

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
