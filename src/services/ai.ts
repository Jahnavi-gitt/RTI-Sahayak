import type { Authority, MockResponse, RtiQuestion, UnderstandResult } from "../types";
import { mockExplainResponse, mockGenerateQuestions, mockUnderstand, searchAuthorities } from "../mock/engine";

// Base URL of the FastAPI backend. If it's not set (e.g. a frontend-only
// deploy), every call below quietly falls back to the deterministic mock
// engine so the demo journey never breaks.
const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

const TIMEOUT_MS = 6000;

async function callBackend<T>(path: string, body: unknown): Promise<T> {
  if (!API_BASE) throw new Error("no-backend-configured");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`backend-error-${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function understandProblem(rawText: string, lang: string = "en"): Promise<UnderstandResult> {
  try {
    return await callBackend<UnderstandResult>("/api/understand", { text: rawText, lang });
  } catch {
    // Deterministic fallback — see build brief section 14 ("AI ARCHITECTURE"):
    // the app must remain usable in a demo even if the AI call fails.
    return mockUnderstand(rawText, lang);
  }
}

export async function generateRtiQuestions(
  understanding: UnderstandResult,
  rawText: string,
  lang: string = "en"
): Promise<RtiQuestion[]> {
  try {
    return await callBackend<RtiQuestion[]>("/api/generate-rti", { understanding, text: rawText, lang });
  } catch {
    return mockGenerateQuestions(understanding, rawText, lang);
  }
}

export async function findAuthorities(query: string, lang: string = "en"): Promise<Authority[]> {
  try {
    return await callBackend<Authority[]>("/api/authorities", { query, lang });
  } catch {
    return searchAuthorities(query, lang);
  }
}

export async function explainResponse(responseText: string, lang: string = "en"): Promise<MockResponse> {
  try {
    return await callBackend<MockResponse>("/api/explain-response", { responseText, lang });
  } catch {
    return mockExplainResponse(lang);
  }
}
