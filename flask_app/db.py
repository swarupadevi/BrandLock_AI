import sqlite3
from pathlib import Path

from config import DATABASE_DIR, DATABASE_PATH, REPORTS_DIR, SCHEMA_PATH


def get_connection():
    DATABASE_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_database():
    DATABASE_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    schema_sql = Path(SCHEMA_PATH).read_text(encoding="utf-8")

    with get_connection() as connection:
        connection.executescript(schema_sql)


def list_tables():
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT name
            FROM sqlite_master
            WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
            """
        ).fetchall()
    return [row["name"] for row in rows]


def list_columns(table_name):
    with get_connection() as connection:
        rows = connection.execute(f"PRAGMA table_info({table_name})").fetchall()
    return [row["name"] for row in rows]
