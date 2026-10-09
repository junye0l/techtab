import type { Locale } from "./i18n";

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
  // 글로벌 영문 제목용 (v0.4.0). 부분 문자열 오탐이 적은 term만 골라 추가
  "gRPC",
  "PostgreSQL",
  "Postgres",
  "WebAssembly",
  "WASM",
  "Terraform",
  "Observability",
  "Microservices",
  "Latency",
  "Inference",
  "Embeddings",
  "Fine-tuning",
  "Postmortem",
  "Incident",
  "Rate limiting",
  "Feature flag",
];

export function extractKeyword(title: string): string | null {
  const lower = title.toLowerCase();
  return KEYWORDS.find((k) => lower.includes(k.toLowerCase())) ?? null;
}

// 키워드 목록은 한국어 제목 기준으로 매칭하므로, 배지 표시만 각 언어로 바꿔줌 (표에 없는 영어 항목은 그대로 통과)
// zh는 번체·대만식 표기
const KEYWORD_LABELS: Record<string, Record<Exclude<Locale, "ko">, string>> = {
  "AI 에이전트": { en: "AI agent", ja: "AIエージェント", zh: "AI 代理" },
  "머신러닝": { en: "ML", ja: "機械学習", zh: "機器學習" },
  "쿠버네티스": { en: "Kubernetes", ja: "Kubernetes", zh: "Kubernetes" },
  "안드로이드": { en: "Android", ja: "Android", zh: "Android" },
  "프론트엔드": { en: "Frontend", ja: "フロントエンド", zh: "前端" },
  "백엔드": { en: "Backend", ja: "バックエンド", zh: "後端" },
  "인프라": { en: "Infra", ja: "インフラ", zh: "基礎架構" },
  "아키텍처": { en: "Architecture", ja: "アーキテクチャ", zh: "架構" },
  "마이그레이션": { en: "Migration", ja: "移行", zh: "遷移" },
  "데이터베이스": { en: "Database", ja: "データベース", zh: "資料庫" },
  "성능": { en: "Performance", ja: "パフォーマンス", zh: "效能" },
  "최적화": { en: "Optimization", ja: "最適化", zh: "最佳化" },
  "보안": { en: "Security", ja: "セキュリティ", zh: "資安" },
  "테스트": { en: "Testing", ja: "テスト", zh: "測試" },
  "모니터링": { en: "Monitoring", ja: "モニタリング", zh: "監控" },
  "온보딩": { en: "Onboarding", ja: "オンボーディング", zh: "到職引導" },
  "채용": { en: "Hiring", ja: "採用", zh: "徵才" },
};

export function keywordLabel(keyword: string, locale: Locale): string {
  if (locale === "ko") return keyword;
  return KEYWORD_LABELS[keyword]?.[locale] ?? keyword;
}
