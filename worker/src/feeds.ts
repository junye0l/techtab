// 국내 빅테크/스타트업 기술 블로그 RSS 목록 (URL 실동작 검증됨, 2026-08-28 기준)
// 제외한 블로그:
//   - 리디, 오늘의집: 자체 도메인 이전 후 RSS 없음(404)/차단(403) — 열리면 재추가
//   - 쿠팡, 직방, 야놀자: Medium 피드가 1년 이상 방치 (마지막 글 각 22 / 32 / 44개월 전)
//   - 뱅크샐러드: 마지막 글 7개월 전 — 게시 재개되면 재추가
//   - 카카오페이: tech.kakaopay.com/rss.xml 이 빈 채널만 반환 (item 0개) — 정상화되면 재추가
export const FEEDS: { source: string; url: string }[] = [
  { source: "네이버 D2", url: "https://d2.naver.com/d2.atom" },
  { source: "카카오", url: "https://tech.kakao.com/feed" },
  { source: "LINE", url: "https://techblog.lycorp.co.jp/ko/feed/index.xml" },
  { source: "우아한형제들", url: "https://techblog.woowahan.com/feed/" },
  { source: "당근마켓", url: "https://medium.com/feed/daangn" },
  { source: "토스", url: "https://toss.tech/rss.xml" },
  { source: "무신사", url: "https://medium.com/feed/musinsa-tech" },
  { source: "마켓컬리", url: "https://helloworld.kurly.com/rss.xml" },
  { source: "NHN", url: "https://meetup.nhncloud.com/rss" },
  { source: "하이퍼커넥트", url: "https://hyperconnect.github.io/feed.xml" },
  { source: "쏘카", url: "https://tech.socar.kr/rss.xml" },
  { source: "왓챠", url: "https://medium.com/feed/watcha" },
  { source: "원티드랩", url: "https://medium.com/feed/wantedjobs" },
  { source: "에이블리", url: "https://ably-team.medium.com/feed" },
  { source: "여기어때", url: "https://techblog.gccompany.co.kr/feed" },
  { source: "올리브영", url: "https://oliveyoung.tech/rss.xml" },
  // v0.3.0에서 추가 (2026-08-28, 최근 6개월 내 게시 확인)
  { source: "인프런", url: "https://tech.inflab.com/rss.xml" },
  { source: "마이리얼트립", url: "https://medium.com/feed/myrealtrip-product" },
  { source: "스캐터랩", url: "https://tech.scatterlab.co.kr/rss" },
  { source: "버즈빌", url: "https://tech.buzzvil.com/index.xml" },
  { source: "데보션", url: "https://devocean.sk.com/blog/rss.do" },
  { source: "데브시스터즈", url: "https://tech.devsisters.com/rss.xml" },
  { source: "요기요", url: "https://techblog.yogiyo.co.kr/feed" },
];
