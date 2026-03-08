from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import List, Dict
import os
from ask_agent import run_agent, stream_agent_response
from assess_agent import stream_assess_response

app = FastAPI()

CLIENT_BUILD_DIR = os.path.join(os.path.dirname(__file__), "..", "client", "dist")


class AskRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []


@app.get("/.well-known/appspecific/com.chrome.devtools.json")
async def chrome_devtools():
    return JSONResponse({})


@app.post("/api/ask")
async def ask(request: AskRequest):

    answer = run_agent(request.message, request.history)
    print('ANSWER: ', answer)
    # return {"response": "This is a placeholder response."}
    return {"response": answer}

class AssessRequest(BaseModel):
    job_description: str


@app.post("/api/assess")
async def assess(request: AssessRequest):
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
async def ask_stream(request: AskRequest):
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


# Serve the React app — html=True means unmatched paths fall back to index.html,
# which lets React Router handle client-side navigation.
app.mount("/", StaticFiles(directory=CLIENT_BUILD_DIR, html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
