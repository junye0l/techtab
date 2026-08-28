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

export function sourceLabel(source: string, locale: "ko" | "en"): string {
  if (locale === "ko") return source;
  return SOURCE_LABELS_EN[source] ?? source;
}
