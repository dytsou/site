CREATE TABLE IF NOT EXISTS github_activity_snapshots (
  snapshot_key TEXT PRIMARY KEY,
  repos_json TEXT NOT NULL CHECK (json_valid(repos_json)),
  updated_at TEXT NOT NULL
);
