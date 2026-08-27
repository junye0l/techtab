import { useCallback, useEffect, useState } from "react";

export type Locale = "ko" | "en";

const STORAGE_KEY = "techtab-locale";

// 저장된 선택이 있으면 그걸 쓰고, 없으면 브라우저 언어로 최초 판별 (ko* → 한국어, 그 외 → 영어)
export function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "ko" || saved === "en") return saved;
  } catch {
    // localStorage 접근 불가 시 언어 감지로 폴백
  }
  return navigator.language.toLowerCase().startsWith("ko") ? "ko" : "en";
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
  },
};

export function useI18n() {
  const [locale, setLocale] = useState<Locale>(detectLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // 저장 실패는 무시 — 다음 로드에서 다시 감지
    }
  }, [locale]);

  const t = useCallback<TFunc>((key) => MESSAGES[locale][key], [locale]);

  return { locale, setLocale, t };
}
