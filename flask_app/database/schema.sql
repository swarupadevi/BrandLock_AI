-- BrandLockAI SQLite schema (Stage 1)
-- Keep these column names and types stable across later stages.

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT DEFAULT '',
    email TEXT,
    organization_name TEXT DEFAULT ''
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_name TEXT NOT NULL,
    website TEXT,
    social_url TEXT,
    app_url TEXT,
    logo_url TEXT
);

CREATE TABLE IF NOT EXISTS scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    brand_id INTEGER,
    scan_type TEXT NOT NULL,
    target TEXT NOT NULL,
    risk_score INTEGER NOT NULL,
    risk_category TEXT NOT NULL,
    summary TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (brand_id) REFERENCES brands(id)
);

CREATE TABLE IF NOT EXISTS scan_evidence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scan_id INTEGER NOT NULL,
    label TEXT NOT NULL,
    detail TEXT NOT NULL,
    FOREIGN KEY (scan_id) REFERENCES scans(id)
);

CREATE TABLE IF NOT EXISTS scan_recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scan_id INTEGER NOT NULL,
    recommendation TEXT NOT NULL,
    FOREIGN KEY (scan_id) REFERENCES scans(id)
);

CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scan_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (scan_id) REFERENCES scans(id)
);
