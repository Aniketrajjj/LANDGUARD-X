"""
LANDGUARD-X Database Layer
---------------------------
SQLite for zero-configuration local execution. If SQLite for any reason
cannot be opened (e.g. read-only filesystem), the app transparently falls
back to an in-memory Python store so the demo never breaks.
"""

import sqlite3
import os
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(__file__), "landguard.db")

_sqlite_available = True

# In-memory fallback store
MEMORY_STORE = {
    "incidents": [],
    "reports": [],
}


def _init_sqlite():
    global _sqlite_available
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS incidents (
                id TEXT PRIMARY KEY,
                location_id TEXT,
                location_name TEXT,
                type TEXT,
                description TEXT,
                severity TEXT,
                status TEXT,
                people_affected INTEGER,
                reported_minutes_ago INTEGER,
                source TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS reports (
                id TEXT PRIMARY KEY,
                location_id TEXT,
                location_name TEXT,
                hazard_type TEXT,
                description TEXT,
                severity TEXT,
                contact TEXT,
                photo_provided INTEGER,
                status TEXT DEFAULT 'RECEIVED',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()
        conn.close()
    except Exception:
        _sqlite_available = False


_init_sqlite()


@contextmanager
def get_conn():
    if not _sqlite_available:
        yield None
        return
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def insert_incident(incident: dict):
    with get_conn() as conn:
        if conn is None:
            MEMORY_STORE["incidents"].append(incident)
            return
        conn.execute(
            """INSERT OR REPLACE INTO incidents
               (id, location_id, location_name, type, description, severity,
                status, people_affected, reported_minutes_ago, source)
               VALUES (?,?,?,?,?,?,?,?,?,?)""",
            (
                incident["id"], incident["location_id"], incident["location_name"],
                incident["type"], incident["description"], incident["severity"],
                incident["status"], incident["people_affected"],
                incident["reported_minutes_ago"], incident["source"],
            ),
        )


def update_incident_status(incident_id: str, status: str) -> bool:
    with get_conn() as conn:
        if conn is None:
            for inc in MEMORY_STORE["incidents"]:
                if inc["id"] == incident_id:
                    inc["status"] = status
                    return True
            return False
        cur = conn.execute("UPDATE incidents SET status=? WHERE id=?", (status, incident_id))
        return cur.rowcount > 0


def list_incidents():
    with get_conn() as conn:
        if conn is None:
            return list(MEMORY_STORE["incidents"])
        rows = conn.execute("SELECT * FROM incidents ORDER BY created_at DESC").fetchall()
        return [dict(r) for r in rows]


def insert_report(report: dict):
    with get_conn() as conn:
        if conn is None:
            MEMORY_STORE["reports"].append(report)
            return
        conn.execute(
            """INSERT INTO reports
               (id, location_id, location_name, hazard_type, description,
                severity, contact, photo_provided, status)
               VALUES (?,?,?,?,?,?,?,?,?)""",
            (
                report["id"], report["location_id"], report["location_name"],
                report["hazard_type"], report["description"], report["severity"],
                report.get("contact", ""), int(report.get("photo_provided", False)),
                report.get("status", "RECEIVED"),
            ),
        )


def list_reports():
    with get_conn() as conn:
        if conn is None:
            return list(MEMORY_STORE["reports"])
        rows = conn.execute("SELECT * FROM reports ORDER BY created_at DESC").fetchall()
        return [dict(r) for r in rows]
