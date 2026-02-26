from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Dict
import os
from ask_agent import run_agent

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

# Serve the React app — html=True means unmatched paths fall back to index.html,
# which lets React Router handle client-side navigation.
app.mount("/", StaticFiles(directory=CLIENT_BUILD_DIR, html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
