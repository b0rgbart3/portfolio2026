import sqlite3
import json
import os
import asyncio
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(__file__).parent / "analytics.db"
MY_IPS = set(filter(None, os.getenv("MY_IP_ADDRESSES", "").split(",")))
NTFY_TOPIC = os.getenv("NTFY_TOPIC", "")


def _init_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            event_type TEXT NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            data TEXT,
            is_self INTEGER DEFAULT 0
        )
    """)
    conn.commit()
    conn.close()


_init_db()


def _is_self(ip: str) -> bool:
    if not MY_IPS:
        return False
    # Strip port if present (IPv4:port format)
    bare_ip = ip.split(":")[0] if ":" in ip and not ip.startswith("[") else ip
    return bare_ip in MY_IPS or ip in MY_IPS


def log_event(event_type: str, ip: str, user_agent: str, data: dict):
    self_flag = _is_self(ip)
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute(
        "INSERT INTO events (timestamp, event_type, ip_address, user_agent, data, is_self) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (
            datetime.now(timezone.utc).isoformat(),
            event_type,
            ip,
            user_agent,
            json.dumps(data),
            1 if self_flag else 0,
        ),
    )
    conn.commit()
    conn.close()

    if not self_flag and NTFY_TOPIC:
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(_send_notification(event_type, ip, data))
        except RuntimeError:
            pass


async def _send_notification(event_type: str, ip: str, data: dict):
    try:
        import httpx

        snippet = ""
        if "message" in data:
            snippet = str(data["message"])[:100]
        elif "jd_snippet" in data:
            snippet = str(data["jd_snippet"])[:100]

        body = f"From: {ip}\n{snippet}" if snippet else f"From: {ip}"
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(
                f"https://ntfy.sh/{NTFY_TOPIC}",
                content=body.encode(),
                headers={"Title": f"Portfolio: {event_type}"},
            )
    except Exception:
        pass


def get_recent_events(limit: int = 200) -> list:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT * FROM events ORDER BY id DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_summary() -> dict:
    conn = sqlite3.connect(str(DB_PATH))
    today = datetime.now(timezone.utc).date().isoformat()
    total = conn.execute("SELECT COUNT(*) FROM events").fetchone()[0]
    today_total = conn.execute(
        "SELECT COUNT(*) FROM events WHERE timestamp LIKE ?", (f"{today}%",)
    ).fetchone()[0]
    today_visitors = conn.execute(
        "SELECT COUNT(DISTINCT ip_address) FROM events WHERE timestamp LIKE ? AND is_self = 0",
        (f"{today}%",),
    ).fetchone()[0]
    unique_visitor_ips = conn.execute(
        "SELECT COUNT(DISTINCT ip_address) FROM events WHERE is_self = 0"
    ).fetchone()[0]
    page_views = conn.execute(
        "SELECT COUNT(*) FROM events WHERE event_type = 'page_view' AND is_self = 0"
    ).fetchone()[0]
    conn.close()
    return {
        "total": total,
        "today_total": today_total,
        "today_visitors": today_visitors,
        "unique_visitor_ips": unique_visitor_ips,
        "page_views": page_views,
    }
