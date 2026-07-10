from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse, HTMLResponse
from pydantic import BaseModel
from typing import List, Dict
import os
import secrets
from ask_agent import run_agent, stream_agent_response, _generate_followup_hint
from assess_agent import stream_assess_response
from analytics import log_event, get_recent_events, get_summary

app = FastAPI()
security = HTTPBasic()

CLIENT_BUILD_DIR = os.path.join(os.path.dirname(__file__), "..", "client", "dist")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "changeme")


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _require_admin(credentials: HTTPBasicCredentials = Depends(security)):
    ok = secrets.compare_digest(credentials.password.encode(), ADMIN_PASSWORD.encode())
    if not ok:
        raise HTTPException(status_code=401, headers={"WWW-Authenticate": "Basic"})


class AskRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []


@app.get("/.well-known/appspecific/com.chrome.devtools.json")
async def chrome_devtools():
    return JSONResponse({})


@app.post("/api/ask")
async def ask(request: AskRequest, req: Request):
    ip = _get_client_ip(req)
    ua = req.headers.get("User-Agent", "")
    log_event("ai_chat", ip, ua, {"message": request.message})
    answer = run_agent(request.message, request.history)
    print('ANSWER: ', answer)
    return {"response": answer}


class FollowupRequest(BaseModel):
    question: str


@app.post("/api/followup")
async def followup(request: FollowupRequest):
    text = await _generate_followup_hint(request.question)
    return {"followup": text}


class AssessRequest(BaseModel):
    job_description: str


@app.post("/api/assess")
async def assess(request: AssessRequest, req: Request):
    ip = _get_client_ip(req)
    ua = req.headers.get("User-Agent", "")
    log_event("fitcheck", ip, ua, {"jd_snippet": request.job_description[:200]})

    async def event_gen():
        async for chunk in stream_assess_response(request.job_description):
            yield chunk

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@app.post("/api/ask/stream")
async def ask_stream(request: AskRequest, req: Request):
    ip = _get_client_ip(req)
    ua = req.headers.get("User-Agent", "")
    log_event("ai_chat", ip, ua, {"message": request.message})

    async def event_gen():
        async for chunk in stream_agent_response(request.message, request.history):
            yield chunk

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@app.get("/admin/events", dependencies=[Depends(_require_admin)])
async def admin_events():
    summary = get_summary()
    events = get_recent_events(200)

    rows_html = ""
    for e in events:
        is_self = e["is_self"]
        badge = (
            '<span style="background:#334155;color:#94a3b8;padding:2px 8px;border-radius:9px;font-size:11px">You</span>'
            if is_self
            else '<span style="background:#14532d;color:#86efac;padding:2px 8px;border-radius:9px;font-size:11px">Visitor</span>'
        )
        row_style = "opacity:0.45;" if is_self else ""
        ts = e["timestamp"][:19].replace("T", " ")
        event_type = e["event_type"]
        ip = e["ip_address"] or ""
        ua = (e["user_agent"] or "")[:60]
        try:
            import json
            data = json.loads(e["data"] or "{}")
            snippet = data.get("message") or data.get("jd_snippet") or ""
            snippet = str(snippet)[:80]
        except Exception:
            snippet = ""

        rows_html += f"""
        <tr style="{row_style}">
          <td>{ts}</td>
          <td><code style="background:#1e293b;padding:2px 6px;border-radius:4px">{event_type}</code></td>
          <td>{ip}</td>
          <td style="font-size:11px;color:#64748b">{ua}</td>
          <td style="font-size:12px;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{snippet}</td>
          <td>{badge}</td>
        </tr>"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Portfolio Analytics</title>
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ background: #0f172a; color: #e2e8f0; font-family: system-ui, sans-serif; padding: 32px; }}
  h1 {{ font-size: 22px; font-weight: 600; margin-bottom: 24px; color: #f8fafc; }}
  .summary {{ display: flex; gap: 16px; margin-bottom: 32px; flex-wrap: wrap; }}
  .stat {{ background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 16px 24px; min-width: 140px; }}
  .stat-label {{ font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 6px; }}
  .stat-value {{ font-size: 28px; font-weight: 700; color: #38bdf8; }}
  table {{ width: 100%; border-collapse: collapse; font-size: 13px; }}
  th {{ text-align: left; padding: 10px 12px; background: #1e293b; color: #64748b; font-weight: 500;
        font-size: 11px; text-transform: uppercase; letter-spacing: .05em; border-bottom: 1px solid #334155; }}
  td {{ padding: 10px 12px; border-bottom: 1px solid #1e293b; vertical-align: middle; }}
  tr:hover td {{ background: #1e293b44; }}
  code {{ font-family: monospace; font-size: 12px; }}
</style>
</head>
<body>
<h1>Portfolio Analytics</h1>
<div class="summary">
  <div class="stat"><div class="stat-label">Total events</div><div class="stat-value">{summary['total']}</div></div>
  <div class="stat"><div class="stat-label">Events today</div><div class="stat-value">{summary['today_total']}</div></div>
  <div class="stat"><div class="stat-label">Visitor IPs today</div><div class="stat-value">{summary['today_visitors']}</div></div>
</div>
<table>
<thead><tr>
  <th>Time (UTC)</th><th>Event</th><th>IP</th><th>User Agent</th><th>Snippet</th><th>Who</th>
</tr></thead>
<tbody>{rows_html}</tbody>
</table>
</body>
</html>"""
    return HTMLResponse(html)


# Serve the React app — html=True means unmatched paths fall back to index.html,
# which lets React Router handle client-side navigation.
app.mount("/", StaticFiles(directory=CLIENT_BUILD_DIR, html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
