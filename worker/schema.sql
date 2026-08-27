CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  link TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  title_en TEXT,
  source TEXT NOT NULL,
  published_at TEXT,
  fetched_at TEXT NOT NULL
);

-- 기존 운영 DB에는 위 CREATE가 IF NOT EXISTS로 건너뛰므로 아래를 한 번 수동 실행:
--   wrangler d1 execute hackertab-kr --remote --command "ALTER TABLE articles ADD COLUMN title_en TEXT"

CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles (published_at DESC);
