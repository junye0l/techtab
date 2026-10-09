import { XMLParser } from "fast-xml-parser";
import { FEEDS, type Lang, type Region } from "./feeds";

// Workers Rate Limiting 바인딩 (wrangler.toml의 [[unstable_rate_limits]])
interface RateLimit {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  DB: D1Database;
  DEEPL_API_KEY: string;
  API_RATE_LIMITER: RateLimit;
}

const EXTENSION_ORIGIN = "chrome-extension://kobpfgadkgconpdpdppekbioiebnoggc";

// IP당 요청 상한. 바인딩이 없거나 에러나면 통과시킴 — rate limiter가 API 자체를 죽이면 안 됨
async function withinRateLimit(env: Env, key: string): Promise<boolean> {
  try {
    const { success } = await env.API_RATE_LIMITER.limit({ key });
    return success;
  } catch {
    return true;
  }
}

// 글 제목 배치 번역 (DeepL Free). 한 요청에 최대 50개, 실패 시 전부 null → 확장에서 원문 폴백
async function translateTitles(
  titles: string[],
  apiKey: string,
  sourceLang: string,
  targetLang: string
): Promise<(string | null)[]> {
  if (titles.length === 0) return [];
  try {
    const res = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: titles, source_lang: sourceLang, target_lang: targetLang }),
    });
    if (!res.ok) {
      console.error(`DeepL request failed: ${res.status}`);
      return titles.map(() => null);
    }
    const data = (await res.json()) as { translations?: { text: string }[] };
    const out = data.translations ?? [];
    return titles.map((_, i) => out[i]?.text ?? null);
  } catch (err) {
    console.error("DeepL request threw", err);
    return titles.map(() => null);
  }
}

// 로컬 dev 서버(npm run dev)에서도 API를 호출할 수 있게 localhost origin도 허용
function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("Origin");
  const allowedOrigin =
    origin && (origin === EXTENSION_ORIGIN || origin.startsWith("http://localhost:"))
      ? origin
      : EXTENSION_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET",
  };
}

// 기본 엔티티 확장 제한(1000)은 본문이 긴 블로그 글(escape된 HTML)에서 쉽게 초과되므로 완화
const parser = new XMLParser({
  ignoreAttributes: false,
  processEntities: { maxTotalExpansions: 100_000, maxEntityCount: 100_000 },
});

// <title type="html">...</title> 처럼 속성이 붙은 태그는 문자열이 아니라 { "#text": ..., "@_type": ... } 객체로 파싱됨
function textOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "#text" in value) {
    return String((value as { "#text": unknown })["#text"] ?? "");
  }
  return value == null ? "" : String(value);
}

// title/link/날짜만 쓰므로 본문 태그(가끔 base64 이미지 포함, 수십MB까지 커짐)는 파싱 전에 제거
function stripHeavyTags(xml: string): string {
  return xml
    .replace(/<content:encoded>[\s\S]*?<\/content:encoded>/g, "")
    .replace(/<description>[\s\S]*?<\/description>/g, "")
    .replace(/<content(\s[^>]*)?>[\s\S]*?<\/content>/g, "");
}

function extractItems(strippedXml: string): { title: string; link: string; pubDate: string | null }[] {
  const parsed = parser.parse(strippedXml);
  // RSS 2.0: rss.channel.item, Atom: feed.entry
  const rssItems = parsed?.rss?.channel?.item;
  const atomEntries = parsed?.feed?.entry;
  const raw = rssItems ?? atomEntries ?? [];
  const items = Array.isArray(raw) ? raw : [raw];

  return items
    .filter(Boolean)
    .map((item) => {
      const link =
        typeof item.link === "string" ? item.link : item.link?.["@_href"] ?? item.link?.[0]?.["@_href"];
      return {
        title: textOf(item.title).trim(),
        link: String(link ?? "").trim(),
        pubDate: textOf(item.pubDate ?? item.published ?? item.updated) || null,
      };
    })
    .filter((item) => item.title && /^https?:\/\//i.test(item.link));
}

// title/link/날짜만 남긴 후 기준 크기. 무거운 태그(본문 이미지 등) 제거 전 원본 크기로 판단하면
// 정상 피드(예: 본문에 base64 이미지가 박힌 글)까지 오탐으로 걸러내므로, 반드시 stripHeavyTags 이후에 검사
const MAX_STRIPPED_FEED_BYTES = 5 * 1024 * 1024;

// 대부분 피드는 최근 10~20개만 주지만, 일부(예: shopify.engineering — 428개, huggingface.co/blog — 859개)는
// 전체 아카이브를 통째로 내려줌. 한도 없이 다 INSERT하면 그 피드 하나가 크론의 시간/subrequest 예산을 다 써서
// 뒤 순서 피드가 아예 처리되지 못함. /api/articles는 어차피 소스당 최신 10개만 쓰므로 넉넉히 30개면 충분.
const MAX_ITEMS_PER_FEED = 30;

// /api/articles가 소스당 내려주는 글 수. 번역도 이 범위(실제로 보이는 글)만 함
const ARTICLES_PER_SOURCE = 10;

// 피드 원문 언어별 번역 대상. 일·중은 영어를 거치지 않고 원문에서 바로 번역 (중역하면 오역이 쌓임).
// 중국어는 번체(ZH-HANT)만 — 중국 본토는 크롬 웹스토어 접속이 막혀 있어 대만·홍콩 기준으로 통일.
// col은 이 표의 고정 리터럴이라 외부 입력이 아님 (SQL에 끼워 넣어도 인젝션 무관) — 외부 값으로 바꾸지 말 것.
const TRANSLATIONS: Record<Lang, { source: string; targets: { lang: string; col: string }[] }> = {
  ko: {
    source: "KO",
    targets: [
      { lang: "EN-US", col: "title_en" },
      { lang: "JA", col: "title_ja" },
      { lang: "ZH-HANT", col: "title_zh" },
    ],
  },
  en: {
    source: "EN",
    targets: [
      { lang: "KO", col: "title_ko" },
      { lang: "JA", col: "title_ja" },
      { lang: "ZH-HANT", col: "title_zh" },
    ],
  },
};

// 번역은 피드마다가 아니라 "원문 언어 × 대상 언어"마다 DeepL 1번 (한 요청 최대 50개).
// 피드마다 대상 3개씩 부르면 국내 패스가 23 fetch + 69 DeepL로 무료 플랜 subrequest 상한(50)을 넘음 → 23 + 3.
// 대상 컬럼이 비어 있는 행을 최신순 50개: 새 글 + 지난 실패분 재시도 + 백필을 한 쿼리로 겸함.
// 실제로 보이는 소스당 최신 ARTICLES_PER_SOURCE개 안에서만 골라서, 화면에 안 나오는 옛 글엔 쿼터를 안 씀.
// ponytail: 특정 제목이 계속 실패하면 매시간 재시도됨 — 상한 50이라 폭주는 아니고 확장에 폴백이 있어 무해.
async function translatePending(env: Env, feeds: typeof FEEDS) {
  for (const lang of ["ko", "en"] as const) {
    const sources = feeds.filter((f) => f.lang === lang).map((f) => f.source);
    if (sources.length === 0) continue;
    const placeholders = sources.map(() => "?").join(", ");
    const { source, targets } = TRANSLATIONS[lang];

    for (const { lang: target, col } of targets) {
      try {
        const { results: pending } = await env.DB.prepare(
          `SELECT link, title FROM (
             SELECT link, title, published_at, ${col} AS translated,
                    ROW_NUMBER() OVER (PARTITION BY source ORDER BY published_at DESC) AS rn
             FROM articles WHERE source IN (${placeholders})
           ) WHERE rn <= ${ARTICLES_PER_SOURCE} AND translated IS NULL
           ORDER BY published_at DESC LIMIT 50`
        )
          .bind(...sources)
          .all<{ link: string; title: string }>();
        if (pending.length === 0) continue;

        const translated = await translateTitles(
          pending.map((r) => r.title),
          env.DEEPL_API_KEY,
          source,
          target
        );
        const updates = pending.flatMap((r, i) =>
          translated[i]
            ? [env.DB.prepare(`UPDATE articles SET ${col} = ? WHERE link = ?`).bind(translated[i], r.link)]
            : []
        );
        if (updates.length > 0) await env.DB.batch(updates);
      } catch (err) {
        console.error(`failed to translate ${source}→${target}`, err);
      }
    }
  }
}

async function collectFeeds(env: Env, region: Region | null) {
  const now = new Date().toISOString();
  const feeds = region ? FEEDS.filter((f) => f.region === region) : FEEDS;

  for (const feed of feeds) {
    try {
      const res = await fetch(feed.url, { headers: { "User-Agent": "techtab-bot" } });
      if (!res.ok) continue;

      const xml = stripHeavyTags(await res.text());
      if (xml.length > MAX_STRIPPED_FEED_BYTES) {
        console.error(`skipping ${feed.source}: response too large after stripping (${xml.length} bytes)`);
        continue;
      }

      // 피드는 관례상 최신순이라 앞에서부터 자르면 최신 글이 남음
      const items = extractItems(xml).slice(0, MAX_ITEMS_PER_FEED);

      for (const item of items) {
        const parsedDate = item.pubDate ? new Date(item.pubDate) : null;
        const publishedAt = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : now;

        await env.DB.prepare(
          "INSERT OR IGNORE INTO articles (link, title, source, published_at, fetched_at) VALUES (?, ?, ?, ?, ?)"
        )
          .bind(item.link, item.title, feed.source, publishedAt, now)
          .run();
      }
    } catch (err) {
      console.error(`failed to collect ${feed.source}`, err);
    }
  }

  await translatePending(env, feeds);
}

// /api/articles 응답을 아이솔레이트 메모리에 짧게 캐시 — 반복/폭주 요청이 매번 D1까지 내려가지 않도록.
// region별로 다른 소스 집합을 리턴하므로 캐시도 region별로 분리.
// 데이터는 매시간 cron으로만 바뀌므로 60초 stale은 무해하고, CORS 헤더는 요청마다 새로 붙임(dev/prod origin 구분 유지).
const articlesCache = new Map<string, { at: number; body: string }>();
const ARTICLES_TTL_MS = 60_000;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/articles") {
      const clientIp = request.headers.get("CF-Connecting-IP") ?? "unknown";
      if (!(await withinRateLimit(env, clientIp))) {
        return new Response("rate limited", { status: 429, headers: corsHeaders(request) });
      }

      // 기본값은 국내만 — v0.4.0 이전(글로벌 개념이 없는) 익스텐션이 파라미터 없이 호출해도
      // 새로 생긴 글로벌 소스가 필터 없이 그대로 노출되지 않도록. 글로벌 포함은 명시적 옵트인.
      const region = url.searchParams.get("region") === "all" ? "all" : "kr";
      const cached = articlesCache.get(region);

      if (!cached || Date.now() - cached.at > ARTICLES_TTL_MS) {
        // FEEDS에서 빠진 소스의 기존 행은 D1에 남아있으므로 현재 목록으로 필터 (소스명은 .bind로 파라미터화)
        const sources = (region === "all" ? FEEDS : FEEDS.filter((f) => f.region === "kr")).map(
          (f) => f.source
        );
        const placeholders = sources.map(() => "?").join(", ");
        const { results } = await env.DB.prepare(
          `SELECT title, title_en, title_ko, title_ja, title_zh, link, source, published_at FROM (
             SELECT *, ROW_NUMBER() OVER (PARTITION BY source ORDER BY published_at DESC) AS rn
             FROM articles
             WHERE source IN (${placeholders})
           ) WHERE rn <= ${ARTICLES_PER_SOURCE}
           ORDER BY published_at DESC`
        )
          .bind(...sources)
          .all();
        articlesCache.set(region, { at: Date.now(), body: JSON.stringify(results) });
      }
      return new Response(articlesCache.get(region)!.body, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60",
          ...corsHeaders(request),
        },
      });
    }

    return new Response("not found", { status: 404 });
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    // wrangler.toml crons: "0 * * * *" → 국내, "30 * * * *" → 글로벌.
    // 로컬 수동 트리거(cron 문자열 없음)는 둘 다 수집.
    const region: Region | null =
      event.cron === "30 * * * *" ? "global" : event.cron === "0 * * * *" ? "kr" : null;
    await collectFeeds(env, region);
  },
};
