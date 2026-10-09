import type { Locale } from "./i18n";

// Google 파비콘 서비스가 인식하지 못하는 소스는 번들 로컬 에셋으로 대체
//  - 우아한형제들: techblog.woowahan.com에 등록된 파비콘 없음 (로고 텍스트 크롭)
//  - 요기요: yogiyo.co.kr 파비콘이 Google 인덱스에 없음 (자체 파비콘 그대로 사용)
const LOCAL_ICON_OVERRIDES: Record<string, string> = {
  "우아한형제들": "icons/sources/woowahan.png",
  "요기요": "icons/sources/yogiyo.png",
};

// 컬럼 헤더에 표시할 파비콘용 도메인 (favicon이 인식하기 좋은 실제 브랜드 도메인 기준)
export const SOURCE_DOMAINS: Record<string, string> = {
  "네이버 D2": "naver.com",
  "카카오": "tech.kakao.com",
  "LINE": "line.me",
  "당근마켓": "daangn.com",
  "토스": "toss.im",
  "무신사": "musinsa.com",
  "마켓컬리": "kurly.com",
  "NHN": "nhn.com",
  "하이퍼커넥트": "hyperconnect.com",
  "쏘카": "socar.kr",
  "왓챠": "watcha.com",
  "원티드랩": "wanted.co.kr",
  "에이블리": "a-bly.com",
  "여기어때": "gccompany.co.kr",
  "올리브영": "oliveyoung.co.kr",
  "인프런": "inflearn.com",
  "마이리얼트립": "blog.myrealtrip.com",
  "스캐터랩": "scatterlab.co.kr",
  "버즈빌": "buzzvil.com",
  "데보션": "sk.com",
  "데브시스터즈": "devsisters.com",
  "요기요": "yogiyo.co.kr",
  // 글로벌 (v0.4.0) — 파비콘은 브랜드 대표 도메인 기준
  "Meta": "meta.com",
  "Cloudflare": "cloudflare.com",
  "Stripe": "stripe.com",
  "GitHub": "github.com",
  "Shopify": "shopify.com",
  "Dropbox": "dropbox.com",
  "Spotify": "spotify.com",
  "Canva": "canva.com",
  "Etsy": "etsy.com",
  "Hugging Face": "huggingface.co",
  "Netflix": "netflix.com",
  "Airbnb": "airbnb.com",
};

// 글로벌 뷰에 들어갈 소스 (worker feeds.ts의 region: "global"과 동기화 유지).
// 메인 보드·최신 글 모음·NEW 버튼은 이 셋을 제외한 국내 소스만 다룸.
export const GLOBAL_SOURCES = new Set([
  "Meta",
  "Cloudflare",
  "Stripe",
  "GitHub",
  "Shopify",
  "Dropbox",
  "Spotify",
  "Canva",
  "Etsy",
  "Hugging Face",
  "Netflix",
  "Airbnb",
]);

export function faviconUrl(source: string): string {
  const localIcon = LOCAL_ICON_OVERRIDES[source];
  if (localIcon) return `/${localIcon}`;

  const domain = SOURCE_DOMAINS[source];
  return `https://www.google.com/s2/favicons?sz=32&domain=${domain ?? source}`;
}

// faviconV2가 저해상도(32px)만 주는 사이트 중 바로가기로 흔한 곳은 번들 아이콘으로 대체
// ponytail: 호스트 하드코딩 — 다른 사이트도 흐리다는 제보가 쌓이면 여기에 추가
const SITE_ICON_OVERRIDES: Record<string, string> = {
  "github.com": "icons/sites/github.svg",
};

// 사용자 바로가기용: s2보다 해상도·정확도가 높음 (mail.google.com → Gmail 아이콘, 투명 배경 유지가 더 잘 됨)
// 30px 아이콘을 레티나에서 축소 렌더링해 선명하도록 128px 요청 (사이트에 큰 아이콘이 없으면 있는 만큼만 옴)
export function siteIconUrl(host: string): string {
  const localIcon = SITE_ICON_OVERRIDES[host.replace(/^www\./, "")];
  if (localIcon) return `/${localIcon}`;
  return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=128&url=${encodeURIComponent(`https://${host}`)}`;
}

// source 문자열은 selectedSources/order/localStorage/favicon 키라 그대로 두고, 표시할 때만 영어 브랜드명으로 변환
// (LINE·NHN 등 이미 라틴 문자인 소스는 매핑에 없으면 그대로 통과)
const SOURCE_LABELS_EN: Record<string, string> = {
  "네이버 D2": "NAVER D2",
  "카카오": "Kakao",
  "우아한형제들": "Woowahan",
  "당근마켓": "Daangn",
  "토스": "Toss",
  "무신사": "MUSINSA",
  "마켓컬리": "Kurly",
  "하이퍼커넥트": "Hyperconnect",
  "쏘카": "SOCAR",
  "왓챠": "WATCHA",
  "원티드랩": "Wanted",
  "에이블리": "ABLY",
  "여기어때": "GC Company",
  "올리브영": "Olive Young",
  "인프런": "Inflearn",
  "마이리얼트립": "MyRealTrip",
  "스캐터랩": "ScatterLab",
  "버즈빌": "Buzzvil",
  "데보션": "DEVOCEAN",
  "데브시스터즈": "Devsisters",
  "요기요": "Yogiyo",
};

// 일·중도 영문 브랜드명 사용 (회사들이 해외에서 쓰는 공식 표기)
export function sourceLabel(source: string, locale: Locale): string {
  if (locale === "ko") return source;
  return SOURCE_LABELS_EN[source] ?? source;
}
