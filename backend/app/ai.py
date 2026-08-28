"""OpenAI-backed intent understanding, RTI question generation, and
response explanation. Every function here is wrapped by the caller in a
try/except that falls back to app.mock_engine — see main.py.
"""
import json
import os

from openai import OpenAI

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY is not configured")
        _client = OpenAI(api_key=api_key)
    return _client


MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

SYSTEM_PROMPT = """You are the reasoning engine behind RTI Sahayak, an INDEPENDENT prototype \
that helps Indian citizens turn a plain-language problem into a clear Right to Information (RTI) \
request. You are not a government official and this is not an official government service.

Hard rules you must always follow:
- Never claim to be a government official or that this product is official/government-approved.
- Never provide definitive legal advice. Use phrases like "may be appropriate" or "generally used for".
- Never fabricate government procedures, deadlines, or legal effects you are not certain about.
- Clearly distinguish requests for EXISTING INFORMATION/RECORDS (a good fit for RTI) from requests \
for the department to TAKE ACTION (better suited to a grievance channel).
- Turn the citizen's problem into requests for existing information or records, not new legal claims.
- Never ask for or reference Aadhaar, PAN, OTPs, passwords, bank details, or other sensitive personal data.
- Keep language simple, respectful, and specific to the Indian public-service context.
- Be transparent about uncertainty rather than guessing confidently.
- Never claim an authority recommendation is guaranteed correct — always "suggested, verify before use".
- Never claim to authenticate or verify the authenticity of any document.
- Respond with ONLY a single JSON object as instructed by the caller. No prose, no markdown fences.
"""


def understand_problem(raw_text: str) -> dict:
    client = _get_client()
    prompt = f"""Citizen's own words (may be informal, may contain typos):
\"\"\"{raw_text}\"\"\"

Return ONLY a JSON object with exactly these keys:
- "topic": short lowercase string, e.g. "scholarship", "pension", "civic-service", "general"
- "goal": either "request_information" or "request_action"
- "summary": one plain sentence describing what the citizen wants, second person ("You want...")
- "rti_suitability": one of "likely", "maybe", "unlikely"
- "suitability_reason": one or two plain sentences explaining the suitability rating
- "confidence": number between 0 and 1
"""
    resp = client.chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        max_tokens=400,
        temperature=0.3,
    )
    data = json.loads(resp.choices[0].message.content)
    data["source"] = "ai"
    return data


def generate_rti_questions(understanding: dict, raw_text: str) -> list[dict]:
    client = _get_client()
    prompt = f"""Citizen's problem: \"\"\"{raw_text}\"\"\"
Our understanding so far: {json.dumps(understanding)}

Turn this into 3-5 clear, specific requests for EXISTING information or records that a public \
authority may hold (not new actions). Return ONLY a JSON object: {{"questions": ["...", "..."]}}
Each question should start with "Please provide" and be answerable from existing records.
"""
    resp = client.chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        max_tokens=400,
        temperature=0.4,
    )
    data = json.loads(resp.choices[0].message.content)
    questions = data.get("questions", [])
    return [{"id": f"q{i+1}", "text": q} for i, q in enumerate(questions)]


def explain_response(response_text: str) -> dict:
    client = _get_client()
    prompt = f"""A (synthetic, mock) government response reads:
\"\"\"{response_text}\"\"\"

Explain it in plain language. Return ONLY a JSON object with keys:
- "whatTheySaid": one plain sentence
- "whatItMeans": one or two plain sentences, no legal claims
- "whatToCheck": an array of 2-4 short, concrete things the citizen may want to check next
Do not invent facts beyond what's in the response text above.
"""
    resp = client.chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        max_tokens=400,
        temperature=0.3,
    )
    return json.loads(resp.choices[0].message.content)
