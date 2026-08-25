# Tech Tab

국내 빅테크 기술 블로그를 새 탭에서 모아보는 크롬 확장 프로그램입니다.

네이버, 카카오, 토스, 쿠팡, 당근마켓 등 21개 기업의 기술 블로그 RSS를 매시간 자동으로 수집해서, 관심 있는 기업만 골라 나만의 피드로 볼 수 있습니다.

## 주요 기능

- **21개 국내 기업 기술 블로그** RSS 자동 수집 (매시간 갱신)
- 원하는 기업만 골라서 보드에 추가/제거, **드래그 앤 드롭**으로 순서 변경
- **북마크**로 나중에 읽을 글 저장, **읽음 표시**로 이미 본 글 구분
- 마지막으로 본 시점 이후 올라온 글에 **NEW 뱃지**
- 제목 키워드 자동 추출(AI, Kafka, LLM 등) 배지 표시
- 다크/라이트 모드, Google 검색창 내장
- 처음 열었을 때 3D로 조립되는 로고 인트로 (three.js)

## 기술 스택

**프론트엔드** (`extension/`)
- React + TypeScript + Vite
- Chrome Extension Manifest V3 (새 탭 오버라이드)
- three.js + troika-three-text (로고 인트로 애니메이션)
- lucide-react (아이콘)

**백엔드** (`worker/`)
- Cloudflare Workers + D1 (SQLite)
- fast-xml-parser로 RSS/Atom 피드 파싱
- Cron Trigger로 매시간 자동 수집

## 프로젝트 구조

```
.
├── DESIGN.md          # 디자인 시스템 레퍼런스 (Vercel 스타일)
├── extension/         # 크롬 확장 프로그램
│   ├── public/        # manifest.json, 아이콘, 폰트
│   └── src/           # React 앱
└── worker/            # Cloudflare Workers 백엔드
    └── src/
        ├── feeds.ts    # RSS 소스 목록
        └── index.ts    # 수집 로직 + API
```

## 로컬 개발

### 확장 프로그램

```bash
cd extension
npm install
npm run dev       # http://localhost:5173 에서 미리보기
npm run build     # dist/ 폴더 생성 → chrome://extensions 에서 "압축해제된 확장 프로그램 로드"
```

### 백엔드 (Cloudflare Workers)

```bash
cd worker
npm install
npx wrangler login
npx wrangler d1 create hackertab-kr   # wrangler.toml의 database_id 갱신 필요
npm run db:init                       # 로컬 D1에 스키마 적용
npm run dev                           # 로컬 개발 서버
npm run deploy                        # 배포
```
