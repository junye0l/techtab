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
