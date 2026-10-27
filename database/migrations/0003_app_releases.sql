-- 0003_app_releases.sql: OTA App Releases for iOS / Android / Desktop
CREATE TABLE IF NOT EXISTS app_releases (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  build_number INTEGER NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'macos', 'windows')),
  download_url TEXT NOT NULL,
  manifest_url TEXT,
  release_notes TEXT,
  is_mandatory INTEGER DEFAULT 0,
  min_supported_version TEXT,
  file_size_bytes INTEGER DEFAULT 0,
  sha256_checksum TEXT,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'deprecated')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_releases_platform ON app_releases(platform, status);
