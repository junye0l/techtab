// 기술 블로그 RSS 목록 (URL 실동작 검증됨)
// region: "kr" 국내 · "global" 해외 — 확장에서 뷰를 가르는 기준 (extension/src/sourceDomains.ts의 GLOBAL_SOURCES와 동기화)
// lang:   피드 제목의 원문 언어. cron이 번역 방향을 정함 (ko → title_en, en → title_ko)
//
// 국내에서 제외한 블로그 (2026-08-28 기준):
//   - 리디, 오늘의집: 자체 도메인 이전 후 RSS 없음(404)/차단(403) — 열리면 재추가
//   - 쿠팡, 직방, 야놀자: Medium 피드가 1년 이상 방치 (마지막 글 각 22 / 32 / 44개월 전)
//   - 뱅크샐러드: 마지막 글 7개월 전 — 게시 재개되면 재추가
//   - 카카오페이: tech.kakaopay.com/rss.xml 이 빈 채널만 반환 (item 0개) — 정상화되면 재추가
// 글로벌에서 제외 (2026-09-04 프로빙):
//   - Uber(406 봇차단), LinkedIn(RSS 폐지 404), DoorDash(403 Cloudflare), Notion(eng 블로그 없음),
//     Wise(마지막 글 19개월 전), Figma(피드 742개·디자인/제품 섞여 eng 희석)
//   - OpenAI/DeepMind/Google AI: 발표·리서치 피드라 성격이 달라 "AI 섹션" 별도 검토
//   - Anthropic/Kimi: RSS 자체가 없음
export type Region = "kr" | "global";
export type Lang = "ko" | "en";
export const FEEDS: { source: string; url: string; region: Region; lang: Lang }[] = [
  // ── 국내 ──────────────────────────────────────────────
  { source: "네이버 D2", url: "https://d2.naver.com/d2.atom", region: "kr", lang: "ko" },
  { source: "카카오", url: "https://tech.kakao.com/feed", region: "kr", lang: "ko" },
  { source: "LINE", url: "https://techblog.lycorp.co.jp/ko/feed/index.xml", region: "kr", lang: "ko" },
  { source: "우아한형제들", url: "https://techblog.woowahan.com/feed/", region: "kr", lang: "ko" },
  { source: "당근마켓", url: "https://medium.com/feed/daangn", region: "kr", lang: "ko" },
  { source: "토스", url: "https://toss.tech/rss.xml", region: "kr", lang: "ko" },
  { source: "무신사", url: "https://medium.com/feed/musinsa-tech", region: "kr", lang: "ko" },
  { source: "마켓컬리", url: "https://helloworld.kurly.com/rss.xml", region: "kr", lang: "ko" },
  { source: "NHN", url: "https://meetup.nhncloud.com/rss", region: "kr", lang: "ko" },
  { source: "하이퍼커넥트", url: "https://hyperconnect.github.io/feed.xml", region: "kr", lang: "ko" },
  { source: "쏘카", url: "https://tech.socar.kr/rss.xml", region: "kr", lang: "ko" },
  { source: "왓챠", url: "https://medium.com/feed/watcha", region: "kr", lang: "ko" },
  { source: "원티드랩", url: "https://medium.com/feed/wantedjobs", region: "kr", lang: "ko" },
  { source: "에이블리", url: "https://ably-team.medium.com/feed", region: "kr", lang: "ko" },
  { source: "여기어때", url: "https://techblog.gccompany.co.kr/feed", region: "kr", lang: "ko" },
  { source: "올리브영", url: "https://oliveyoung.tech/rss.xml", region: "kr", lang: "ko" },
  { source: "인프런", url: "https://tech.inflab.com/rss.xml", region: "kr", lang: "ko" },
  { source: "마이리얼트립", url: "https://blog.myrealtrip.com/rss/", region: "kr", lang: "ko" }, // 2026-06 Medium → 자체 도메인 이전
  { source: "스캐터랩", url: "https://tech.scatterlab.co.kr/rss", region: "kr", lang: "ko" },
  { source: "버즈빌", url: "https://tech.buzzvil.com/index.xml", region: "kr", lang: "ko" },
  { source: "데보션", url: "https://devocean.sk.com/blog/rss.do", region: "kr", lang: "ko" },
  { source: "데브시스터즈", url: "https://tech.devsisters.com/rss.xml", region: "kr", lang: "ko" },
  { source: "요기요", url: "https://techblog.yogiyo.co.kr/feed", region: "kr", lang: "ko" },
  // ── 글로벌 (v0.4.0, 2026-09-04 프로빙) ────────────────
  { source: "Meta", url: "https://engineering.fb.com/feed/", region: "global", lang: "en" },
  { source: "Cloudflare", url: "https://blog.cloudflare.com/rss/", region: "global", lang: "en" },
  { source: "Stripe", url: "https://stripe.com/blog/feed.rss", region: "global", lang: "en" },
  { source: "GitHub", url: "https://github.blog/engineering/feed/", region: "global", lang: "en" },
  { source: "Shopify", url: "https://shopify.engineering/blog.atom", region: "global", lang: "en" },
  { source: "Dropbox", url: "https://dropbox.tech/feed", region: "global", lang: "en" },
  { source: "Spotify", url: "https://engineering.atspotify.com/feed/", region: "global", lang: "en" },
  { source: "Canva", url: "https://www.canva.dev/blog/engineering/feed.xml", region: "global", lang: "en" },
  { source: "Etsy", url: "https://www.etsy.com/codeascraft/rss", region: "global", lang: "en" },
  { source: "Hugging Face", url: "https://huggingface.co/blog/feed.xml", region: "global", lang: "en" },
  { source: "Netflix", url: "https://netflixtechblog.com/feed", region: "global", lang: "en" },
  { source: "Airbnb", url: "https://medium.com/feed/airbnb-engineering", region: "global", lang: "en" },
];
