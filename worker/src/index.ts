import { XMLParser } from "fast-xml-parser";
import { FEEDS } from "./feeds";

export interface Env {
  DB: D1Database;
  DEEPL_API_KEY: string;
}

const EXTENSION_ORIGIN = "chrome-extension://kobpfgadkgconpdpdppekbioiebnoggc";

// 새로 저장된 글 제목만 영어로 번역 (DeepL Free). 한 요청에 최대 50개, 실패 시 전부 null → 확장에서 원문 폴백
async function translateToEnglish(titles: string[], apiKey: string): Promise<(string | null)[]> {
  if (titles.length === 0) return [];
  try {
    const res = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: titles, source_lang: "KO", target_lang: "EN-US" }),
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

async function collectFeeds(env: Env) {
  const now = new Date().toISOString();

  for (const feed of FEEDS) {
    try {
      const res = await fetch(feed.url, { headers: { "User-Agent": "techtab-bot" } });
      if (!res.ok) continue;

      const xml = stripHeavyTags(await res.text());
      if (xml.length > MAX_STRIPPED_FEED_BYTES) {
        console.error(`skipping ${feed.source}: response too large after stripping (${xml.length} bytes)`);
        continue;
      }

      const items = extractItems(xml);

      const newItems: { link: string; title: string }[] = [];
      for (const item of items) {
        const parsedDate = item.pubDate ? new Date(item.pubDate) : null;
        const publishedAt = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : now;

        const result = await env.DB.prepare(
          "INSERT OR IGNORE INTO articles (link, title, source, published_at, fetched_at) VALUES (?, ?, ?, ?, ?)"
        )
          .bind(item.link, item.title, feed.source, publishedAt, now)
          .run();

        if (result.meta.changes > 0) newItems.push({ link: item.link, title: item.title });
      }

      // 이번에 새로 저장된 글만 제목 번역 (피드당 DeepL 요청 1번)
      if (newItems.length > 0) {
        const translated = await translateToEnglish(
          newItems.map((i) => i.title),
          env.DEEPL_API_KEY
        );
        for (let i = 0; i < newItems.length; i++) {
          if (!translated[i]) continue;
          await env.DB.prepare("UPDATE articles SET title_en = ? WHERE link = ?")
            .bind(translated[i], newItems[i].link)
            .run();
        }
      }
    } catch (err) {
      console.error(`failed to collect ${feed.source}`, err);
    }
  }
}

// /api/articles 응답을 아이솔레이트 메모리에 짧게 캐시 — 반복/폭주 요청이 매번 D1까지 내려가지 않도록.
// 데이터는 매시간 cron으로만 바뀌므로 60초 stale은 무해하고, CORS 헤더는 요청마다 새로 붙임(dev/prod origin 구분 유지).
let articlesCache: { at: number; body: string } | null = null;
const ARTICLES_TTL_MS = 60_000;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/articles") {
      if (!articlesCache || Date.now() - articlesCache.at > ARTICLES_TTL_MS) {
        const { results } = await env.DB.prepare(
          `SELECT title, title_en, link, source, published_at FROM (
             SELECT *, ROW_NUMBER() OVER (PARTITION BY source ORDER BY published_at DESC) AS rn
             FROM articles
           ) WHERE rn <= 10
           ORDER BY published_at DESC`
        ).all();
        articlesCache = { at: Date.now(), body: JSON.stringify(results) };
      }
      return new Response(articlesCache.body, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60",
          ...corsHeaders(request),
        },
      });
    }

    return new Response("not found", { status: 404 });
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    await collectFeeds(env);
  },
};
