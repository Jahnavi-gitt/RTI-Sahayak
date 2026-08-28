import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from . import ai, mock_engine

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rti_sahayak")
# NOTE: never log raw request bodies — they may contain a citizen's
# free-text problem description. Log only route + status.

AI_RATE_LIMIT = os.environ.get("AI_RATE_LIMIT", "20/minute")
CORS_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="RTI Sahayak API", description="Independent prototype backend. Not a government service.")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Content-Security-Policy"] = "default-src 'none'"
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Never leak stack traces or internal details to the client.
    logger.exception("Unhandled error on %s", request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Something went wrong on our side. Please try again."})


# ---------- In-memory demo store (resets on restart; no real persistence) ----------
REQUESTS_DB: dict[str, dict] = {}
MAX_TEXT_LEN = 800


# ---------- Schemas ----------
class UnderstandIn(BaseModel):
    text: str = Field(..., min_length=1, max_length=MAX_TEXT_LEN)


class GenerateRtiIn(BaseModel):
    understanding: dict
    text: str = Field(..., min_length=1, max_length=MAX_TEXT_LEN)


class AuthorityQueryIn(BaseModel):
    query: str = Field("", max_length=120)


class ExplainIn(BaseModel):
    responseText: str = Field(..., min_length=1, max_length=MAX_TEXT_LEN)


class CreateRequestIn(BaseModel):
    rawProblem: str = Field(..., max_length=MAX_TEXT_LEN)
    understanding: dict
    questions: list[dict]
    authorityId: str


class StatusUpdateIn(BaseModel):
    status: Literal[
        "DRAFT", "READY_FOR_SUBMISSION", "SUBMITTED", "RECEIVED",
        "UNDER_REVIEW", "TRANSFERRED", "RESPONSE_RECEIVED",
    ]


# ---------- Routes ----------
@app.get("/api/health")
def health():
    return {"status": "ok", "ai_configured": bool(os.environ.get("OPENAI_API_KEY"))}


@app.post("/api/understand")
@limiter.limit(AI_RATE_LIMIT)
def understand(request: Request, body: UnderstandIn):
    try:
        return ai.understand_problem(body.text)
    except Exception:
        logger.info("Falling back to mock engine for /api/understand")
        return mock_engine.mock_understand(body.text)


@app.post("/api/generate-rti")
@limiter.limit(AI_RATE_LIMIT)
def generate_rti(request: Request, body: GenerateRtiIn):
    try:
        questions = ai.generate_rti_questions(body.understanding, body.text)
        if not questions:
            raise ValueError("empty questions from model")
        return questions
    except Exception:
        logger.info("Falling back to mock engine for /api/generate-rti")
        return mock_engine.mock_generate_questions(body.understanding, body.text)


@app.post("/api/authorities")
def authorities(body: AuthorityQueryIn):
    # Authority matching is deliberately deterministic (not model-generated)
    # so the backend never invents a plausible-sounding but fictitious
    # public authority. The client must not trust any authority choice
    # made purely on the frontend — this endpoint is the source of truth.
    return mock_engine.search_authorities(body.query)


@app.post("/api/explain-response")
@limiter.limit(AI_RATE_LIMIT)
def explain(request: Request, body: ExplainIn):
    try:
        return ai.explain_response(body.responseText)
    except Exception:
        logger.info("Falling back to mock engine for /api/explain-response")
        return mock_engine.mock_explain_response(body.responseText)


@app.post("/api/requests")
def create_request(body: CreateRequestIn):
    authority_matches = [a for a in mock_engine.AUTHORITY_DB if a["id"] == body.authorityId]
    if not authority_matches:
        raise HTTPException(status_code=400, detail="Unknown authority selected. Please pick one from the list.")

    request_id = mock_engine.generate_request_id()
    record = {
        "id": request_id,
        "rawProblem": body.rawProblem,
        "understanding": body.understanding,
        "questions": body.questions,
        "authority": authority_matches[0],
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "currentStatus": "SUBMITTED",
        "statusHistory": [{"status": "SUBMITTED", "date": datetime.now(timezone.utc).isoformat(), "label": "Submitted"}],
    }
    REQUESTS_DB[request_id] = record
    return record


@app.post("/api/upload-validate")
async def upload_validate(file: UploadFile = File(...)):
    max_size = 5 * 1024 * 1024  # 5 MB
    contents = await file.read()
    file_size = len(contents)
    await file.seek(0)

    if not file.filename.lower().endswith(".pdf") and file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="We couldn't add that file. Please choose a PDF."
        )

    if file_size > max_size:
        size_mb = round(file_size / (1024 * 1024), 1)
        raise HTTPException(
            status_code=400,
            detail=f"This PDF is {size_mb} MB. Please choose a file smaller than 5 MB."
        )

    return {"status": "ok", "filename": file.filename, "size_bytes": file_size}


@app.get("/api/requests/{request_id}")
def get_request(request_id: str):
    record = REQUESTS_DB.get(request_id)
    if not record:
        raise HTTPException(status_code=404, detail="We couldn't find a request with that ID.")
    return record


@app.post("/api/requests/{request_id}/status")
def update_status(request_id: str, body: StatusUpdateIn):
    record = REQUESTS_DB.get(request_id)
    if not record:
        raise HTTPException(status_code=404, detail="We couldn't find a request with that ID.")
    record["currentStatus"] = body.status
    record["statusHistory"].append(
        {"status": body.status, "date": datetime.now(timezone.utc).isoformat(), "label": body.status.replace("_", " ").title()}
    )
    return record
