// techblog.woowahan.com에는 등록된 파비콘이 없어 로컬 에셋(우아한형제들 로고 텍스트 크롭)을 대신 사용
const LOCAL_ICON_OVERRIDES: Record<string, string> = {
  "우아한형제들": "icons/sources/woowahan.png",
};

// 컬럼 헤더에 표시할 파비콘용 도메인 (favicon이 인식하기 좋은 실제 브랜드 도메인 기준)
export const SOURCE_DOMAINS: Record<string, string> = {
  "네이버 D2": "naver.com",
  "카카오": "tech.kakao.com",
  "카카오페이": "tech.kakaopay.com",
  "LINE": "line.me",
  "쿠팡": "coupang.com",
  "당근마켓": "daangn.com",
  "토스": "toss.im",
  "무신사": "musinsa.com",
  "야놀자": "yanolja.com",
  "마켓컬리": "kurly.com",
  "직방": "zigbang.com",
  "NHN": "nhn.com",
  "하이퍼커넥트": "hyperconnect.com",
  "뱅크샐러드": "banksalad.com",
  "쏘카": "socar.kr",
  "왓챠": "watcha.com",
  "원티드랩": "wanted.co.kr",
  "에이블리": "a-bly.com",
  "여기어때": "gccompany.co.kr",
  "올리브영": "oliveyoung.co.kr",
};

export function faviconUrl(source: string): string {
  const localIcon = LOCAL_ICON_OVERRIDES[source];
  if (localIcon) return `/${localIcon}`;

  const domain = SOURCE_DOMAINS[source];
  return `https://www.google.com/s2/favicons?sz=32&domain=${domain ?? source}`;
}

// source 문자열은 selectedSources/order/localStorage/favicon 키라 그대로 두고, 표시할 때만 영어 브랜드명으로 변환
// (LINE·NHN 등 이미 라틴 문자인 소스는 매핑에 없으면 그대로 통과)
const SOURCE_LABELS_EN: Record<string, string> = {
  "네이버 D2": "NAVER D2",
  "카카오": "Kakao",
  "카카오페이": "KakaoPay",
  "쿠팡": "Coupang",
  "우아한형제들": "Woowahan",
  "당근마켓": "Daangn",
  "토스": "Toss",
  "무신사": "MUSINSA",
  "야놀자": "Yanolja",
  "마켓컬리": "Kurly",
  "직방": "Zigbang",
  "하이퍼커넥트": "Hyperconnect",
  "뱅크샐러드": "Banksalad",
  "쏘카": "SOCAR",
  "왓챠": "WATCHA",
  "원티드랩": "Wanted",
  "에이블리": "ABLY",
  "여기어때": "GC Company",
  "올리브영": "Olive Young",
};

export function sourceLabel(source: string, locale: "ko" | "en"): string {
  if (locale === "ko") return source;
  return SOURCE_LABELS_EN[source] ?? source;
}
