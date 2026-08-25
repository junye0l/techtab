import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Bookmark, ChevronDown, GripVertical, Moon, Search, Sun } from "lucide-react";
import "./index.css";
import { faviconUrl } from "./sourceDomains";
import { extractKeyword } from "./keywords";
import GoogleIcon from "./GoogleIcon";
import { useFlip } from "./useFlip";

const LogoIntroCanvas = lazy(() => import("./LogoIntroCanvas"));

const API_URL = "https://techtab-worker.junyeolkim00.workers.dev/api/articles";
const ARTICLES_PER_COLUMN = 8;

interface Article {
  title: string;
  link: string;
  source: string;
  published_at: string | null;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3600_000);
  if (hours < 1) return "방금 전";
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
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
  onRead,
  onToggleBookmark,
}: {
  article: Article;
  index: number;
  showSourceBadge: boolean;
  isRead: boolean;
  isBookmarked: boolean;
  isNew: boolean;
  onRead: () => void;
  onToggleBookmark: () => void;
}) {
  const keyword = extractKeyword(article.title);
  return (
    <li className="article-card" style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}>
      <button
        className="bookmark-toggle"
        onClick={onToggleBookmark}
        aria-label={isBookmarked ? "북마크 해제" : "북마크"}
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
        {article.title}
      </a>
      <div className="article-meta">
        {isNew && <span className="new-badge">NEW</span>}
        {showSourceBadge ? (
          <img src={faviconUrl(article.source)} alt={article.source} className="source-badge-icon" />
        ) : (
          keyword && <span className="keyword-badge">{keyword}</span>
        )}
        <span className="article-time">{timeAgo(article.published_at)}</span>
      </div>
    </li>
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
          updatedLastSeen[source] = new Date().toISOString();
        }
        setNewArticleLinks(newLinks);
        setLastSeenBySource(updatedLastSeen);
        localStorage.setItem("techtab-last-seen", JSON.stringify(updatedLastSeen));
      })
      .catch((err) => console.error("failed to load articles", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = useMemo(() => {
    const bySource = new Map<string, Article[]>();
    for (const a of articles) {
      if (!bySource.has(a.source)) bySource.set(a.source, []);
      bySource.get(a.source)!.push(a);
    }
    return [...bySource.entries()];
  }, [articles]);

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
    .map((source): [string, Article[]] => [source, columnsBySource.get(source) ?? []]);
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
            placeholder="Google 검색..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch(query)}
          />
          <button className="search-submit" onClick={() => runSearch(query)} aria-label="검색">
            <Search size={18} />
          </button>
        </div>
        <button
          className={`theme-toggle ${showBookmarksOnly ? "theme-toggle-active" : ""}`}
          onClick={() => setShowBookmarksOnly((v) => !v)}
          aria-label="북마크 보기"
        >
          <Bookmark size={16} fill={showBookmarksOnly ? "currentColor" : "none"} />
        </button>
        <button
          className="theme-toggle"
          onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
          aria-label="테마 전환"
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </header>

      {!showBookmarksOnly && columns.length > 0 && (
        <div className="chips-wrap">
          <div className={`chips-collapse ${filtersCollapsed ? "" : "chips-collapse-expanded"}`}>
            <div className="chips">
              {columns.map(([source]) => (
                <button
                  key={source}
                  className={`chip ${selectedSources.has(source) ? "chip-active" : ""}`}
                  onClick={() => toggleSource(source)}
                >
                  <img src={faviconUrl(source)} alt="" className="chip-icon" />
                  {source}
                </button>
              ))}
            </div>
          </div>
          <button
            className="chips-toggle"
            onClick={() => setFiltersCollapsed((v) => !v)}
            aria-label={filtersCollapsed ? "필터 보기" : "필터 숨기기"}
          >
            <ChevronDown className={`chips-toggle-icon ${filtersCollapsed ? "" : "chips-toggle-icon-up"}`} size={16} />
          </button>
        </div>
      )}

      {articles.length === 0 && <p className="empty-state">불러오는 중...</p>}

      {!showBookmarksOnly && showEmptyHero && (
        <div className="empty-hero">
          <Suspense fallback={null}>
            <LogoIntroCanvas color={theme === "dark" ? "#ededed" : "#171717"} />
          </Suspense>
          <div className="empty-hero-content">
            <p className="empty-hero-title">관심있는 기업을 선택해보세요</p>
            <p className="empty-hero-sub">위 칩을 눌러 나만의 피드를 만들 수 있어요</p>
          </div>
        </div>
      )}

      {showBookmarksOnly ? (
        <div className="board">
          <section className="column column--bookmarks">
            <div className="column-header">
              <Bookmark size={20} />
              북마크 ({bookmarkList.length})
            </div>
            {bookmarkList.length === 0 ? (
              <p className="empty-state">저장한 글이 없어요. 카드에 마우스를 올려 북마크 아이콘을 눌러보세요.</p>
            ) : (
              <ul className="column-list">
                {bookmarkList.map((a, i) => (
                  <ArticleCard
                    key={a.link}
                    article={a}
                    index={i}
                    showSourceBadge
                    isRead={readLinks.has(a.link)}
                    isBookmarked
                    isNew={false}
                    onRead={() => markRead(a.link)}
                    onToggleBookmark={() => toggleBookmark(a)}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
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
                  {source}
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
                    더보기 <ChevronDown size={14} />
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
