"""Deterministic, offline fallback logic.

Mirrors src/mock/engine.ts on the frontend. Used whenever OPENAI_API_KEY
is not configured, or the OpenAI call fails/times out, so the demo
journey never breaks (see build brief section 14: AI ARCHITECTURE).
"""
import random
from typing import Any

ACTION_WORDS = [
    "clean", "fix", "repair", "send someone", "come and", "remove",
    "install", "build a", "not been cleaned", "please send", "take action",
]

AUTHORITY_DB = [
    {
        "id": "auth-edu",
        "name": "Department of Higher Education",
        "department": "Education",
        "matchedFor": ["scholarship", "education", "college", "university", "fee"],
        "whyMatch": "This appears related to the scholarship service you described.",
    },
    {
        "id": "auth-social",
        "name": "Directorate of Social Welfare",
        "department": "Social Welfare",
        "matchedFor": ["pension", "welfare", "disability", "widow"],
        "whyMatch": "This appears related to a welfare or pension scheme.",
    },
    {
        "id": "auth-municipal",
        "name": "Municipal Corporation — Sanitation Wing",
        "department": "Urban Local Body",
        "matchedFor": ["clean", "garbage", "sanitation", "road", "streetlight"],
        "whyMatch": "This appears related to a civic/sanitation service in your ward.",
    },
    {
        "id": "auth-health",
        "name": "Directorate of Public Health",
        "department": "Health",
        "matchedFor": ["hospital", "health", "medicine", "vaccination"],
        "whyMatch": "This appears related to a public health service.",
    },
    {
        "id": "auth-general",
        "name": "State Public Information Office (General)",
        "department": "General Administration",
        "matchedFor": [],
        "whyMatch": "We couldn't match a specific department, so this general office is suggested as a starting point.",
    },
]


def mock_understand(raw_text: str) -> dict[str, Any]:
    text = raw_text.lower()
    is_action = any(w in text for w in ACTION_WORDS)

    if is_action:
        return {
            "topic": "civic-service",
            "goal": "request_action",
            "summary": "You want the department to take an action (like a repair or cleanup), rather than to share existing information.",
            "rti_suitability": "unlikely",
            "suitability_reason": "RTI is generally used to request information or records the department already holds — not to ask it to act. A grievance or service request may fit better here.",
            "confidence": 0.81,
            "source": "fallback",
        }

    if "scholarship" in text:
        return {
            "topic": "scholarship",
            "goal": "request_information",
            "summary": "You want information about the status of a scholarship application.",
            "rti_suitability": "likely",
            "suitability_reason": "You are asking what the department already knows and recorded about your case — this is the kind of thing RTI can help you request.",
            "confidence": 0.92,
            "source": "fallback",
        }

    if "pension" in text:
        return {
            "topic": "pension",
            "goal": "request_information",
            "summary": "You want information about why a pension payment is delayed.",
            "rti_suitability": "likely",
            "suitability_reason": "You are asking for existing records about processing and delay reasons — RTI may be appropriate here.",
            "confidence": 0.88,
            "source": "fallback",
        }

    snippet = raw_text[:90] + ("…" if len(raw_text) > 90 else "")
    return {
        "topic": "general",
        "goal": "request_information",
        "summary": f'You want to know more about: "{snippet}"',
        "rti_suitability": "maybe",
        "suitability_reason": "This looks like an information request, but we're less certain of the exact department. RTI may still help you.",
        "confidence": 0.6,
        "source": "fallback",
    }


def mock_generate_questions(understanding: dict[str, Any], raw_text: str) -> list[dict[str, str]]:
    topic = understanding.get("topic", "general")
    text = raw_text.lower()

    if topic == "scholarship" or "scholarship" in text:
        return [
            {"id": "q1", "text": "Please provide the current status of my scholarship application."},
            {"id": "q2", "text": "Please provide the dates on which my application was processed at each stage."},
            {"id": "q3", "text": "Please provide the name/designation of the office where the application is currently pending."},
            {"id": "q4", "text": "If the application was rejected or placed on hold, please provide the recorded reason for that decision."},
        ]

    if topic == "pension":
        return [
            {"id": "q1", "text": "Please provide the current status of my pension application/payment."},
            {"id": "q2", "text": "Please provide the dates on which each stage of processing was completed."},
            {"id": "q3", "text": "Please provide the office and designation currently handling this case."},
            {"id": "q4", "text": "If any amount was withheld or delayed, please provide the recorded reason."},
        ]

    return [
        {"id": "q1", "text": "Please provide the current status of the matter described above."},
        {"id": "q2", "text": "Please provide the dates on which it was processed at each stage."},
        {"id": "q3", "text": "Please provide the name/designation of the office currently handling it."},
        {"id": "q4", "text": "Please provide the recorded reason for any delay, rejection, or hold."},
    ]


def search_authorities(query: str) -> list[dict[str, Any]]:
    q = (query or "").strip().lower()
    if not q:
        return AUTHORITY_DB
    matches = [a for a in AUTHORITY_DB if any(k in q or q in k for k in a["matchedFor"])]
    return matches if matches else [AUTHORITY_DB[-1]]


def mock_explain_response(_response_text: str) -> dict[str, Any]:
    return {
        "whatTheySaid": "The application was transferred to the Regional Scholarship Cell on 12 July for verification of bank details, and is currently awaiting confirmation from that office.",
        "whatItMeans": "Your case is still active and hasn't been rejected. It's sitting with a different office than the one you originally contacted, likely because they need to verify a detail before releasing the payment.",
        "whatToCheck": [
            "Whether your bank account details on file are correct and active.",
            "Whether the Regional Scholarship Cell needs any document from you.",
            "The date you may want to follow up if there's no update in a few weeks.",
        ],
    }


def generate_request_id() -> str:
    return f"RTI-DEMO-{random.randint(20000, 29999)}"
