// 기술 블로그 RSS 목록 (URL 실동작 검증됨)
// region: "kr" 국내 · "global" 영어권 해외 · "jp" 일본 — /api/articles?v=2 응답에 실려 확장의 뷰를 가름
//         (탭 = 원문 언어. 비미국이라도 블로그가 영어면 global — 한 언어에 활발한 피드가 8개 이상이면 탭 추가)
// lang:   피드 제목의 원문 언어. cron이 번역 방향을 정함 (index.ts의 TRANSLATIONS)
// minApi: 2면 /api/articles?v=2 요청에만 포함. v0.6.0 이하 확장은 GLOBAL_SOURCES에 없는 소스를 전부 국내로
//         취급하므로, v0.7.0에 추가된 소스를 구버전 응답에 넣으면 그 사용자들의 국내 보드에 섞임.
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
// 일본 후보 중 제외 (2026-11-16 프로빙): Cookpad(마지막 글 76일 전·90일 2건), mixi·SmartNews(정지), Recruit·Rakuten(404)
// 유럽·아시아 영어권 중 제외: Klarna·Skyscanner·BlaBlaCar·Traveloka·Tokopedia·Flipkart(정지), Delivery Hero(403),
//   Monzo·PhonePe(404), Swiggy(타임아웃), Zomato(빈 피드). 중국·대만은 활발한 피드가 거의 없어 탭 보류.
export type Region = "kr" | "global" | "jp";
export type Lang = "ko" | "en" | "ja";
export const FEEDS: { source: string; url: string; region: Region; lang: Lang; minApi?: 2 }[] = [
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
  // ── 글로벌 영어권 비미국 (v0.7.0, 2026-11-16 프로빙) ──
  { source: "Zalando", url: "https://engineering.zalando.com/atom.xml", region: "global", lang: "en", minApi: 2 },
  { source: "Doctolib", url: "https://medium.com/feed/doctolib", region: "global", lang: "en", minApi: 2 },
  { source: "Grab", url: "https://engineering.grab.com/feed.xml", region: "global", lang: "en", minApi: 2 },
  { source: "Agoda", url: "https://medium.com/feed/agoda-engineering", region: "global", lang: "en", minApi: 2 },
  { source: "Razorpay", url: "https://engineering.razorpay.com/feed", region: "global", lang: "en", minApi: 2 },
  // ── 일본 (v0.7.0, 2026-11-16 프로빙) — 표기는 모든 로케일 영문 브랜드명. 국내 "LINE"과 구분해 LY Corporation ──
  { source: "LY Corporation", url: "https://techblog.lycorp.co.jp/ja/feed/index.xml", region: "jp", lang: "ja", minApi: 2 },
  { source: "Mercari", url: "https://engineering.mercari.com/blog/feed.xml", region: "jp", lang: "ja", minApi: 2 },
  { source: "CyberAgent", url: "https://developers.cyberagent.co.jp/blog/feed/", region: "jp", lang: "ja", minApi: 2 },
  { source: "DeNA", url: "https://engineering.dena.com/index.xml", region: "jp", lang: "ja", minApi: 2 },
  { source: "freee", url: "https://developers.freee.co.jp/feed", region: "jp", lang: "ja", minApi: 2 },
  { source: "Money Forward", url: "https://moneyforward-dev.jp/feed", region: "jp", lang: "ja", minApi: 2 },
  { source: "ZOZO", url: "https://techblog.zozo.com/feed", region: "jp", lang: "ja", minApi: 2 },
  { source: "Sansan", url: "https://buildersbox.corp-sansan.com/feed", region: "jp", lang: "ja", minApi: 2 },
  { source: "pixiv", url: "https://inside.pixiv.blog/feed", region: "jp", lang: "ja", minApi: 2 },
  { source: "Cybozu", url: "https://blog.cybozu.io/feed", region: "jp", lang: "ja", minApi: 2 },
  { source: "GMO Pepabo", url: "https://tech.pepabo.com/feed.xml", region: "jp", lang: "ja", minApi: 2 },
];
