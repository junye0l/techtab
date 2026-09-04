import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, ChevronDown, Globe, GripVertical, Languages, Moon, Search, Sun } from "lucide-react";
import "./index.css";
import { faviconUrl, GLOBAL_SOURCES, sourceLabel } from "./sourceDomains";
import { extractKeyword, keywordLabel } from "./keywords";
import { useI18n, type Locale, type TFunc } from "./i18n";
import GoogleIcon from "./GoogleIcon";
import { useFlip } from "./useFlip";

const LogoIntroCanvas = lazy(() => import("./LogoIntroCanvas"));

// 로컬에서 로컬 worker로 붙여보려면 VITE_API_URL 지정 (예: http://localhost:8787/api/articles)
// worker는 파라미터 없으면 국내만 줌(구버전 익스텐션 하위호환) — 글로벌 포함은 명시적으로 요청
const API_URL =
  (import.meta.env.VITE_API_URL || "https://techtab-worker.junyeolkim00.workers.dev/api/articles") +
  "?region=all";
const ARTICLES_PER_COLUMN = 8;
const RECENT_FEED_DAYS = 7;
const RECENT_FEED_LIMIT = 40;
const GLOBAL_FEED_LIMIT = 40;
const REFETCH_MIN_INTERVAL_MS = 5 * 60 * 1000;
const RECENT_FEED_SEEN_KEY = "techtab-recent-feed-seen";

interface Article {
  title: string;
  title_en: string | null;
  title_ko: string | null;
  link: string;
  source: string;
  published_at: string | null;
}

// 읽는 사람 언어의 번역본이 있으면 그걸, 없으면(번역 실패/백필 전, 또는 원문이 이미 그 언어) 원문으로 폴백
function displayTitle(article: Article, locale: Locale): string {
  const translated = locale === "en" ? article.title_en : article.title_ko;
  return translated ?? article.title;
}

// "지금까지 존재하는 글 중 가장 최신"까지 봤다고 기록 — 미래 날짜(발행사 예약분·기기 시계 오차)인 글이
// 섞여 있어도 seen 이 그걸 넘어서므로 NEW 표시가 계속 켜져 있지 않음
function newestSeen(list: Article[]): string {
  let max = new Date().toISOString();
  for (const a of list) {
    if (a.published_at != null && a.published_at > max) max = a.published_at;
  }
  return max;
}

function timeAgo(iso: string | null, locale: Locale, justNow: string): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3600_000);
  if (hours < 1) return justNow;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "always", style: "narrow" });
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-Math.floor(hours / 24), "day");
}

function runSearch(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;
  window.location.href = `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

// RSS 링크는 외부 소스에서 오므로, javascript: 등 위험한 스킴이 섞여 들어와도 클릭 시 실행되지 않도록 재검증
function isSafeUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function ArticleCard({
  article,
  index,
  showSourceBadge,
  isRead,
  isBookmarked,
  isNew,
  locale,
  t,
  onRead,
  onToggleBookmark,
}: {
  article: Article;
  index: number;
  showSourceBadge: boolean;
  isRead: boolean;
  isBookmarked: boolean;
  isNew: boolean;
  locale: Locale;
  t: TFunc;
  onRead: () => void;
  onToggleBookmark: () => void;
}) {
  const keyword = extractKeyword(article.title);
  return (
    <li className="article-card" style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}>
      <button
        className="bookmark-toggle"
        onClick={onToggleBookmark}
        aria-label={isBookmarked ? t("bookmarkRemove") : t("bookmarkAdd")}
      >
        <Bookmark size={16} fill={isBookmarked ? "currentColor" : "none"} />
      </button>
      <a
        href={isSafeUrl(article.link) ? article.link : undefined}
        target="_blank"
        rel="noreferrer"
        onClick={onRead}
        className={isRead ? "article-link-read" : ""}
      >
        {displayTitle(article, locale)}
      </a>
      <div className="article-meta">
        {isNew && <span className="new-badge">NEW</span>}
        {showSourceBadge ? (
          <img
            src={faviconUrl(article.source)}
            alt={sourceLabel(article.source, locale)}
            className="source-badge-icon"
          />
        ) : (
          keyword && <span className="keyword-badge">{keywordLabel(keyword, locale)}</span>
        )}
        <span className="article-time">{timeAgo(article.published_at, locale, t("justNow"))}</span>
      </div>
    </li>
  );
}

// 최신 글 모음 / 북마크: .board 5열 그리드에 ArticleCard를 직접 깔아 렌더 (컬럼 없음)
function FlatFeed({
  title,
  emptyText,
  items,
  readLinks,
  bookmarks,
  locale,
  t,
  onRead,
  onToggleBookmark,
}: {
  title: string;
  emptyText: string;
  items: Article[];
  readLinks: Set<string>;
  bookmarks: Record<string, Article>;
  locale: Locale;
  t: TFunc;
  onRead: (link: string) => void;
  onToggleBookmark: (article: Article) => void;
}) {
  return (
    <section className="flat-feed">
      <div className="flat-feed-header">{title}</div>
      {items.length === 0 ? (
        <p className="empty-state">{emptyText}</p>
      ) : (
        <ul className="board board--flat">
          {items.map((a, i) => (
            <ArticleCard
              key={a.link}
              article={a}
              index={i}
              showSourceBadge
              isRead={readLinks.has(a.link)}
              isBookmarked={!!bookmarks[a.link]}
              isNew={false}
              locale={locale}
              t={t}
              onRead={() => onRead(a.link)}
              onToggleBookmark={() => onToggleBookmark(a)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  return localStorage.getItem("techtab-theme") === "dark" ? "dark" : "light";
}

function getInitialFiltersCollapsed(): boolean {
  return localStorage.getItem("techtab-filters-collapsed") === "true";
}

function getInitialSelectedSources(): Set<string> {
  try {
    const raw = localStorage.getItem("techtab-selected-sources");
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function getInitialOrder(): string[] {
  try {
    const raw = localStorage.getItem("techtab-column-order");
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through to selectedSources order
  }
  return [...getInitialSelectedSources()];
}

function getInitialReadLinks(): Set<string> {
  try {
    const raw = localStorage.getItem("techtab-read-links");
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function getInitialBookmarks(): Record<string, Article> {
  try {
    const raw = localStorage.getItem("techtab-bookmarks");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getInitialLastSeen(): Record<string, string> {
  try {
    const raw = localStorage.getItem("techtab-last-seen");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export default function App() {
  const { locale, setLocale, t } = useI18n();
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedSources, setSelectedSources] = useState<Set<string>>(getInitialSelectedSources);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [query, setQuery] = useState("");
  const [expandedColumns, setExpandedColumns] = useState<Set<string>>(new Set());
  const [exitingSources, setExitingSources] = useState<Set<string>>(new Set());
  // 사용자가 추가하거나 드래그로 정렬한 순서 (기사 최신순인 columns와는 별개)
  const [order, setOrder] = useState<string[]>(getInitialOrder);
  const [draggedSource, setDraggedSource] = useState<string | null>(null);
  const [filtersCollapsed, setFiltersCollapsed] = useState<boolean>(getInitialFiltersCollapsed);
  const [readLinks, setReadLinks] = useState<Set<string>>(getInitialReadLinks);
  const [bookmarks, setBookmarks] = useState<Record<string, Article>>(getInitialBookmarks);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [dropTarget, setDropTarget] = useState<{ source: string; side: "before" | "after" } | null>(
    null
  );
  const [lastSeenBySource, setLastSeenBySource] = useState<Record<string, string>>(getInitialLastSeen);
  const [newArticleLinks, setNewArticleLinks] = useState<Set<string>>(new Set());
  const [showRecentFeed, setShowRecentFeed] = useState(false);
  const [showGlobalFeed, setShowGlobalFeed] = useState(false);
  const [recentFeedSeen, setRecentFeedSeen] = useState<string | null>(() => {
    try {
      return localStorage.getItem(RECENT_FEED_SEEN_KEY);
    } catch {
      return null;
    }
  });
  const lastFetchRef = useRef(0);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("techtab-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("techtab-column-order", JSON.stringify(order));
  }, [order]);

  useEffect(() => {
    localStorage.setItem("techtab-filters-collapsed", String(filtersCollapsed));
  }, [filtersCollapsed]);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data: Article[]) => {
        setArticles(data);
        lastFetchRef.current = Date.now();

        const krData = data.filter((a) => !GLOBAL_SOURCES.has(a.source));

        // 최초 방문(seen 키 없음): 지금까지 올라온 글 기준으로 초기화 → NEW 버튼이 안 튐
        if (localStorage.getItem(RECENT_FEED_SEEN_KEY) == null) {
          const seen = newestSeen(krData);
          localStorage.setItem(RECENT_FEED_SEEN_KEY, seen);
          setRecentFeedSeen(seen);
        }

        // 세션 시작 시 한 번만: 이미 추가해둔 컬럼에서 마지막으로 본 시각 이후 올라온 글을 NEW로 표시
        const newLinks = new Set<string>();
        const updatedLastSeen = { ...lastSeenBySource };
        for (const source of selectedSources) {
          const lastSeen = lastSeenBySource[source];
          if (lastSeen) {
            for (const a of data) {
              if (a.source === source && a.published_at && a.published_at > lastSeen) {
                newLinks.add(a.link);
              }
            }
          }
          // 벽시계 now 가 아니라 그 소스의 최신 글 시각으로 — 미래 날짜 글이 계속 NEW로 남지 않도록
          updatedLastSeen[source] = newestSeen(data.filter((a) => a.source === source));
        }
        setNewArticleLinks(newLinks);
        setLastSeenBySource(updatedLastSeen);
        localStorage.setItem("techtab-last-seen", JSON.stringify(updatedLastSeen));
      })
      .catch((err) => console.error("failed to load articles", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 오래 열어둔 탭이 stale 해지지 않도록: 탭이 다시 보이거나 포커스될 때 5분 넘었으면 재요청 (기사 목록만 갱신)
  useEffect(() => {
    function refetch() {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastFetchRef.current < REFETCH_MIN_INTERVAL_MS) return;
      lastFetchRef.current = Date.now();
      fetch(API_URL)
        .then((res) => res.json())
        .then((data: Article[]) => setArticles(data))
        .catch((err) => console.error("failed to refresh articles", err));
    }
    document.addEventListener("visibilitychange", refetch);
    window.addEventListener("focus", refetch);
    return () => {
      document.removeEventListener("visibilitychange", refetch);
      window.removeEventListener("focus", refetch);
    };
  }, []);

  // 메인 보드 / 최신 글 모음 / NEW 버튼은 국내 소스만 다룸. 글로벌은 Global 뷰 전용.
  const krArticles = useMemo(
    () => articles.filter((a) => !GLOBAL_SOURCES.has(a.source)),
    [articles]
  );

  const columns = useMemo(() => {
    const bySource = new Map<string, Article[]>();
    for (const a of krArticles) {
      if (!bySource.has(a.source)) bySource.set(a.source, []);
      bySource.get(a.source)!.push(a);
    }
    return [...bySource.entries()];
  }, [krArticles]);

  const toggleSource = (source: string) => {
    const wasSelected = selectedSources.has(source);

    setSelectedSources((prev) => {
      const next = new Set(prev);
      wasSelected ? next.delete(source) : next.add(source);
      localStorage.setItem("techtab-selected-sources", JSON.stringify([...next]));
      return next;
    });

    if (wasSelected) {
      // 카드가 사라지는 애니메이션이 끝날 때까지 잠깐 더 렌더링해둠 (order에서도 그때 같이 뺌)
      setExitingSources((prev) => new Set(prev).add(source));
      setTimeout(() => {
        setExitingSources((prev) => {
          const next = new Set(prev);
          next.delete(source);
          return next;
        });
        setOrder((prev) => prev.filter((s) => s !== source));
      }, 300);
    } else {
      // 애니메이션 도중 다시 추가되면 즉시 정상 상태로 되돌림 (order 속 자리 유지)
      setExitingSources((prev) => {
        if (!prev.has(source)) return prev;
        const next = new Set(prev);
        next.delete(source);
        return next;
      });
      setOrder((prev) => (prev.includes(source) ? prev : [...prev, source]));
      setLastSeenBySource((prev) => {
        const next = { ...prev, [source]: new Date().toISOString() };
        localStorage.setItem("techtab-last-seen", JSON.stringify(next));
        return next;
      });
    }
  };

  const columnsBySource = useMemo(() => new Map(columns), [columns]);
  const visibleColumns = order
    .filter((source) => selectedSources.has(source) || exitingSources.has(source))
    .map((source): [string, Article[]] => [source, columnsBySource.get(source) ?? []])
    // 피드 목록에서 빠졌거나 아직 크롤 전인 소스는 빈 컬럼으로 남지 않도록 제외 (제거 애니메이션 중인 건 유지)
    .filter(([source, items]) => items.length > 0 || exitingSources.has(source));
  const showEmptyHero = articles.length > 0 && visibleColumns.length === 0;
  const setColumnRef = useFlip(visibleColumns.map(([source]) => source));

  function handleDragOverColumn(e: React.DragEvent<HTMLElement>, source: string) {
    e.preventDefault();
    if (!draggedSource || draggedSource === source) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const side = e.clientX - rect.left < rect.width / 2 ? "before" : "after";
    setDropTarget((prev) => (prev?.source === source && prev.side === side ? prev : { source, side }));
  }

  function handleDrop(targetSource: string) {
    if (!draggedSource || draggedSource === targetSource || !dropTarget) return;
    const side = dropTarget.side;
    setOrder((prev) => {
      const next = prev.filter((s) => s !== draggedSource);
      const targetIndex = next.indexOf(targetSource);
      next.splice(side === "before" ? targetIndex : targetIndex + 1, 0, draggedSource);
      return next;
    });
  }

  function markRead(link: string) {
    setReadLinks((prev) => {
      if (prev.has(link)) return prev;
      const next = new Set(prev).add(link);
      localStorage.setItem("techtab-read-links", JSON.stringify([...next]));
      return next;
    });
  }

  function toggleBookmark(article: Article) {
    setBookmarks((prev) => {
      const next = { ...prev };
      if (next[article.link]) delete next[article.link];
      else next[article.link] = article;
      localStorage.setItem("techtab-bookmarks", JSON.stringify(next));
      return next;
    });
  }

  const bookmarkList = Object.values(bookmarks).sort(
    (a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime()
  );

  // 최근 7일 안에 올라온 국내 글을 소스 상관없이 최신순으로 모아 상위 40개
  const recentList = useMemo(() => {
    const cutoff = Date.now() - RECENT_FEED_DAYS * 24 * 60 * 60 * 1000;
    return krArticles
      .filter((a) => a.published_at != null && new Date(a.published_at).getTime() >= cutoff)
      .sort((a, b) => new Date(b.published_at!).getTime() - new Date(a.published_at!).getTime())
      // ponytail: /api/articles가 소스당 최신 10개만 줌 — 한 소스가 7일 내 11편+ 올리면 잘림. 그때 worker LIMIT 상향.
      .slice(0, RECENT_FEED_LIMIT);
  }, [krArticles]);

  // 글로벌 소스 글을 최신순으로 상위 40개 (시간 창 없이 — 뷰가 항상 채워지도록)
  // ponytail: /api/articles가 소스당 최신 10개만 줌 → 12개 소스면 최대 120개 중 40개. 발행량 많으면 사실상 최근 1~2주.
  const globalList = useMemo(() => {
    return articles
      .filter((a) => GLOBAL_SOURCES.has(a.source) && a.published_at != null)
      .sort((a, b) => new Date(b.published_at!).getTime() - new Date(a.published_at!).getTime())
      .slice(0, GLOBAL_FEED_LIMIT);
  }, [articles]);

  // 마지막으로 최신 글 모음을 연 시각 이후에 올라온 국내 글이 있으면 NEW 버튼이 튐
  const hasUnseenRecent = useMemo(() => {
    if (recentFeedSeen == null) return false;
    return krArticles.some((a) => a.published_at != null && a.published_at > recentFeedSeen);
  }, [krArticles, recentFeedSeen]);

  function toggleBookmarksOnly() {
    setShowBookmarksOnly((v) => {
      if (!v) {
        setShowRecentFeed(false);
        setShowGlobalFeed(false);
      }
      return !v;
    });
  }

  function toggleRecentFeed() {
    setShowRecentFeed((v) => {
      const next = !v;
      if (next) {
        setShowBookmarksOnly(false);
        setShowGlobalFeed(false);
        // 벽시계 now 가 아니라 지금까지 올라온 국내 글 중 최신 시각으로 — 미래 날짜 글이 있어도 bounce가 꺼짐
        const seen = newestSeen(krArticles);
        setRecentFeedSeen(seen);
        try {
          localStorage.setItem(RECENT_FEED_SEEN_KEY, seen);
        } catch {
          // 저장 실패는 무시 — 다음 로드에서 다시 판별
        }
      }
      return next;
    });
  }

  function toggleGlobalFeed() {
    setShowGlobalFeed((v) => {
      if (!v) {
        setShowBookmarksOnly(false);
        setShowRecentFeed(false);
      }
      return !v;
    });
  }

  return (
    <main className={`page ${showEmptyHero ? "page--hero" : ""}`}>
      <header className="header">
        <h1>TechTab</h1>
        <div className="search-wrap">
          <div className="google-icon-circle">
            <GoogleIcon size={26} />
          </div>
          <input
            className="search-input"
            type="text"
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch(query)}
          />
          <button
            className="search-submit"
            onClick={() => runSearch(query)}
            aria-label={t("searchAria")}
          >
            <Search size={18} />
          </button>
        </div>
        <button
          className={`theme-toggle ${showBookmarksOnly ? "theme-toggle-active" : ""}`}
          onClick={toggleBookmarksOnly}
          aria-label={t("bookmarksAria")}
        >
          <Bookmark size={16} fill={showBookmarksOnly ? "currentColor" : "none"} />
        </button>
        <button
          className="theme-toggle"
          onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
          aria-label={t("themeAria")}
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <button
          className="theme-toggle lang-toggle"
          onClick={() => setLocale(locale === "ko" ? "en" : "ko")}
          aria-label={t("switchLanguage")}
        >
          <Languages size={16} />
          <span className="lang-toggle-label">{locale === "ko" ? "KO" : "EN"}</span>
        </button>
        <button
          className={`theme-toggle new-toggle ${showRecentFeed ? "theme-toggle-active" : ""} ${
            hasUnseenRecent && !showRecentFeed ? "new-toggle-bounce" : ""
          }`}
          onClick={toggleRecentFeed}
          aria-label={t("latestFeedAria")}
        >
          NEW
        </button>
        <button
          className={`theme-toggle ${showGlobalFeed ? "theme-toggle-active" : ""}`}
          onClick={toggleGlobalFeed}
          aria-label={t("globalFeedAria")}
        >
          <Globe size={16} />
        </button>
      </header>

      {!showBookmarksOnly && !showRecentFeed && !showGlobalFeed && columns.length > 0 && (
        <div className="chips-wrap">
          <div className={`chips-collapse ${filtersCollapsed ? "" : "chips-collapse-expanded"}`}>
            <div className="chips" aria-hidden={filtersCollapsed || undefined}>
              {columns.map(([source]) => (
                <button
                  key={source}
                  className={`chip ${selectedSources.has(source) ? "chip-active" : ""}`}
                  onClick={() => toggleSource(source)}
                  tabIndex={filtersCollapsed ? -1 : undefined}
                >
                  <img src={faviconUrl(source)} alt="" className="chip-icon" />
                  {sourceLabel(source, locale)}
                </button>
              ))}
            </div>
          </div>
          <button
            className="chips-toggle"
            onClick={() => setFiltersCollapsed((v) => !v)}
            aria-label={filtersCollapsed ? t("showFilters") : t("hideFilters")}
          >
            <ChevronDown className={`chips-toggle-icon ${filtersCollapsed ? "" : "chips-toggle-icon-up"}`} size={16} />
          </button>
        </div>
      )}

      {articles.length === 0 && <p className="empty-state">{t("loading")}</p>}

      {!showBookmarksOnly && !showRecentFeed && !showGlobalFeed && showEmptyHero && (
        <div className="empty-hero">
          <Suspense fallback={<div className="logo-intro-canvas" />}>
            <LogoIntroCanvas color={theme === "dark" ? "#ededed" : "#171717"} />
          </Suspense>
          <div className="empty-hero-content">
            <p className="empty-hero-title">{t("heroTitle")}</p>
            <p className="empty-hero-sub">{t("heroSub")}</p>
          </div>
        </div>
      )}

      {showGlobalFeed ? (
        <FlatFeed
          title={t("globalFeed")}
          emptyText={t("globalFeedEmpty")}
          items={globalList}
          readLinks={readLinks}
          bookmarks={bookmarks}
          locale={locale}
          t={t}
          onRead={markRead}
          onToggleBookmark={toggleBookmark}
        />
      ) : showRecentFeed ? (
        <FlatFeed
          title={t("latestFeed")}
          emptyText={t("latestFeedEmpty")}
          items={recentList}
          readLinks={readLinks}
          bookmarks={bookmarks}
          locale={locale}
          t={t}
          onRead={markRead}
          onToggleBookmark={toggleBookmark}
        />
      ) : showBookmarksOnly ? (
        <FlatFeed
          title={`${t("bookmarks")} (${bookmarkList.length})`}
          emptyText={t("bookmarksEmpty")}
          items={bookmarkList}
          readLinks={readLinks}
          bookmarks={bookmarks}
          locale={locale}
          t={t}
          onRead={markRead}
          onToggleBookmark={toggleBookmark}
        />
      ) : (
        <div className={`board ${visibleColumns.length > 0 && visibleColumns.length <= 3 ? "board--center" : ""}`}>
          {visibleColumns.map(([source, items]) => {
            const isExpanded = expandedColumns.has(source);
            const visibleItems = isExpanded ? items : items.slice(0, ARTICLES_PER_COLUMN);
            const hasMore = items.length > ARTICLES_PER_COLUMN;

            return (
              <section
                key={source}
                ref={setColumnRef(source)}
                className={`column ${exitingSources.has(source) ? "column-exiting" : ""} ${
                  draggedSource === source ? "column-dragging" : ""
                } ${dropTarget?.source === source ? `column-drop-${dropTarget.side}` : ""}`}
                onDragOver={(e) => handleDragOverColumn(e, source)}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(source);
                  setDraggedSource(null);
                  setDropTarget(null);
                }}
              >
                <div
                  className="column-header"
                  draggable
                  onDragStart={() => setDraggedSource(source)}
                  onDragEnd={() => {
                    setDraggedSource(null);
                    setDropTarget(null);
                  }}
                >
                  <GripVertical className="drag-handle" size={16} />
                  <img src={faviconUrl(source)} alt="" className="column-icon" />
                  {sourceLabel(source, locale)}
                </div>
                <ul className="column-list">
                  {visibleItems.map((a, i) => (
                    <ArticleCard
                      key={a.link}
                      article={a}
                      index={i}
                      showSourceBadge={false}
                      isRead={readLinks.has(a.link)}
                      isBookmarked={!!bookmarks[a.link]}
                      isNew={newArticleLinks.has(a.link)}
                      locale={locale}
                      t={t}
                      onRead={() => markRead(a.link)}
                      onToggleBookmark={() => toggleBookmark(a)}
                    />
                  ))}
                </ul>
                {hasMore && !isExpanded && (
                  <button
                    className="show-more"
                    onClick={() => setExpandedColumns((prev) => new Set(prev).add(source))}
                  >
                    {t("showMore")} <ChevronDown size={14} />
                  </button>
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
