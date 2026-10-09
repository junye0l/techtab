import { useCallback, useEffect, useState } from "react";

// zh = 번체 중국어. 중국 본토는 크롬 웹스토어 접속이 막혀 있어 간체는 두지 않고 대만·홍콩 기준 번체로 통일
export type Locale = "ko" | "en" | "ja" | "zh";

// 헤더 언어 선택 순서 그대로. short는 버튼 표기, name은 툴팁·aria (그 언어로 쓴 이름)
export const LOCALES: { code: Locale; short: string; name: string }[] = [
  { code: "ko", short: "KO", name: "한국어" },
  { code: "en", short: "EN", name: "English" },
  { code: "ja", short: "JA", name: "日本語" },
  { code: "zh", short: "中文", name: "繁體中文" },
];

// <html lang>·Intl용 BCP 47 태그. zh를 그대로 쓰면 간체로 취급돼 날짜 표기(小时)·한자 글리프가 간체 쪽으로 나옴
export function localeTag(locale: Locale): string {
  return locale === "zh" ? "zh-Hant" : locale;
}

const STORAGE_KEY = "techtab-locale";

// 저장된 선택이 있으면 그걸 쓰고, 없으면 브라우저 언어로 최초 판별 (ko*/ja*/zh* → 그 언어, 그 외 → 영어).
// zh-CN·zh-TW·zh-HK 등 중국어는 지역과 상관없이 전부 번체
export function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (LOCALES.some((l) => l.code === saved)) return saved as Locale;
  } catch {
    // localStorage 접근 불가 시 언어 감지로 폴백
  }
  const lang = navigator.language.toLowerCase();
  return LOCALES.find((l) => lang.startsWith(l.code))?.code ?? "en";
}

const KO = {
  searchPlaceholder: "Google 검색...",
  searchAria: "검색",
  bookmarksAria: "북마크 보기",
  themeAria: "테마 전환",
  switchLanguage: "언어 전환",
  bookmarkAdd: "북마크",
  bookmarkRemove: "북마크 해제",
  showFilters: "필터 보기",
  hideFilters: "필터 숨기기",
  loading: "불러오는 중...",
  heroTitle: "관심있는 기업을 선택해보세요",
  heroSub: "위 칩을 눌러 나만의 피드를 만들 수 있어요",
  bookmarks: "북마크",
  bookmarksEmpty: "저장한 글이 없어요. 카드에 마우스를 올려 북마크 아이콘을 눌러보세요.",
  showMore: "더보기",
  justNow: "방금 전",
  latestFeed: "최신 글 모음",
  latestFeedEmpty: "최근 7일간 올라온 글이 없어요.",
  latestFeedAria: "최신 글 모음 보기",
  globalFeed: "글로벌",
  globalFeedEmpty: "글로벌 글을 불러오는 중이에요.",
  globalFeedAria: "글로벌 기술 블로그 보기",
  shortcuts: "바로가기",
  shortcutAdd: "바로가기 추가",
  shortcutRemove: "바로가기 삭제",
  shortcutName: "이름",
  cancel: "취소",
  add: "추가",
} as const;

export type MessageKey = keyof typeof KO;
export type TFunc = (key: MessageKey) => string;

const MESSAGES: Record<Locale, Record<MessageKey, string>> = {
  ko: KO,
  en: {
    searchPlaceholder: "Search Google...",
    searchAria: "Search",
    bookmarksAria: "Show bookmarks",
    themeAria: "Toggle theme",
    switchLanguage: "Switch language",
    bookmarkAdd: "Bookmark",
    bookmarkRemove: "Remove bookmark",
    showFilters: "Show filters",
    hideFilters: "Hide filters",
    loading: "Loading...",
    heroTitle: "Pick the companies you care about",
    heroSub: "Tap the chips above to build your own feed",
    bookmarks: "Bookmarks",
    bookmarksEmpty: "No saved posts yet. Hover a card and tap the bookmark icon.",
    showMore: "Show more",
    justNow: "just now",
    latestFeed: "Latest",
    latestFeedEmpty: "No posts in the last 7 days.",
    latestFeedAria: "Show latest posts",
    globalFeed: "Global",
    globalFeedEmpty: "Loading global posts…",
    globalFeedAria: "Show global engineering blogs",
    shortcuts: "Shortcuts",
    shortcutAdd: "Add shortcut",
    shortcutRemove: "Remove shortcut",
    shortcutName: "Name",
    cancel: "Cancel",
    add: "Add",
  },
  ja: {
    searchPlaceholder: "Google で検索...",
    searchAria: "検索",
    bookmarksAria: "ブックマークを表示",
    themeAria: "テーマを切り替え",
    switchLanguage: "言語を切り替え",
    bookmarkAdd: "ブックマーク",
    bookmarkRemove: "ブックマークを解除",
    showFilters: "フィルターを表示",
    hideFilters: "フィルターを隠す",
    loading: "読み込み中...",
    heroTitle: "気になる企業を選んでください",
    heroSub: "上のチップを押して、自分だけのフィードを作れます",
    bookmarks: "ブックマーク",
    bookmarksEmpty: "保存した記事はまだありません。カードにカーソルを合わせて、ブックマークアイコンを押してください。",
    showMore: "もっと見る",
    justNow: "たった今",
    latestFeed: "最新記事",
    latestFeedEmpty: "過去7日間に投稿された記事はありません。",
    latestFeedAria: "最新記事を表示",
    globalFeed: "グローバル",
    globalFeedEmpty: "海外の記事を読み込み中です…",
    globalFeedAria: "海外の技術ブログを表示",
    shortcuts: "ショートカット",
    shortcutAdd: "ショートカットを追加",
    shortcutRemove: "ショートカットを削除",
    shortcutName: "名前",
    cancel: "キャンセル",
    add: "追加",
  },
  // 대만식 표기 (軟體·資料·搜尋·書籤·新增)
  zh: {
    searchPlaceholder: "Google 搜尋...",
    searchAria: "搜尋",
    bookmarksAria: "顯示書籤",
    themeAria: "切換主題",
    switchLanguage: "切換語言",
    bookmarkAdd: "加入書籤",
    bookmarkRemove: "移除書籤",
    showFilters: "顯示篩選",
    hideFilters: "隱藏篩選",
    loading: "載入中...",
    heroTitle: "選擇你感興趣的公司",
    heroSub: "點選上方標籤，打造專屬於你的動態",
    bookmarks: "書籤",
    bookmarksEmpty: "還沒有儲存的文章。將滑鼠移到卡片上，點選書籤圖示即可儲存。",
    showMore: "顯示更多",
    justNow: "剛剛",
    latestFeed: "最新文章",
    latestFeedEmpty: "最近 7 天沒有新文章。",
    latestFeedAria: "顯示最新文章",
    globalFeed: "全球",
    globalFeedEmpty: "正在載入海外文章…",
    globalFeedAria: "顯示海外技術部落格",
    shortcuts: "捷徑",
    shortcutAdd: "新增捷徑",
    shortcutRemove: "移除捷徑",
    shortcutName: "名稱",
    cancel: "取消",
    add: "新增",
  },
};

export function useI18n() {
  const [locale, setLocale] = useState<Locale>(detectLocale);

  useEffect(() => {
    document.documentElement.lang = localeTag(locale);
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // 저장 실패는 무시 — 다음 로드에서 다시 감지
    }
  }, [locale]);

  const t = useCallback<TFunc>((key) => MESSAGES[locale][key], [locale]);

  return { locale, setLocale, t };
}
