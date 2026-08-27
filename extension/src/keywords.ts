// 글 제목에서 주제 키워드를 찾아 카드에 배지로 보여주기 위한 목록
// ponytail: 단순 부분 문자열 매칭이라 오탐 가능성 있음, 필요해지면 RSS category 태그 기반으로 교체
const KEYWORDS = [
  "LLM",
  "GPT",
  "AI 에이전트",
  "머신러닝",
  "AI",
  "쿠버네티스",
  "Kubernetes",
  "Kafka",
  "Redis",
  "GraphQL",
  "React",
  "TypeScript",
  "iOS",
  "Android",
  "안드로이드",
  "프론트엔드",
  "백엔드",
  "인프라",
  "아키텍처",
  "마이그레이션",
  "데이터베이스",
  "MySQL",
  "ClickHouse",
  "Elasticsearch",
  "성능",
  "최적화",
  "보안",
  "테스트",
  "모니터링",
  "CI/CD",
  "온보딩",
  "채용",
];

export function extractKeyword(title: string): string | null {
  const lower = title.toLowerCase();
  return KEYWORDS.find((k) => lower.includes(k.toLowerCase())) ?? null;
}

// 키워드 목록은 한국어 제목 기준으로 매칭하므로, 배지 표시만 영어로 바꿔줌 (이미 영어인 항목은 그대로 통과)
const KEYWORD_LABELS_EN: Record<string, string> = {
  "AI 에이전트": "AI agent",
  "머신러닝": "ML",
  "쿠버네티스": "Kubernetes",
  "안드로이드": "Android",
  "프론트엔드": "Frontend",
  "백엔드": "Backend",
  "인프라": "Infra",
  "아키텍처": "Architecture",
  "마이그레이션": "Migration",
  "데이터베이스": "Database",
  "성능": "Performance",
  "최적화": "Optimization",
  "보안": "Security",
  "테스트": "Testing",
  "모니터링": "Monitoring",
  "온보딩": "Onboarding",
  "채용": "Hiring",
};

export function keywordLabel(keyword: string, locale: "ko" | "en"): string {
  if (locale === "ko") return keyword;
  return KEYWORD_LABELS_EN[keyword] ?? keyword;
}
