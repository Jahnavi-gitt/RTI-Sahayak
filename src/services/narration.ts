import { t } from "../i18n/strings.ts";
import type { Lang } from "../types";

export interface NarrationContext {
  rawProblem?: string;
  topic?: string;
  authorityName?: string;
  requestId?: string;
  ground?: string;
}

/**
 * Returns rich, contextual, localized voice explanation based on the current route and application state.
 */
export function getPageNarration(
  pathOrRoute: string,
  lang: Lang,
  context?: NarrationContext
): string {
  const path = pathOrRoute.toLowerCase();

  // 1. Landing / Front page introduction
  if (path === "/" || path === "" || path === "/landing" || path.includes("start")) {
    return t(lang, "intro_narration");
  }

  // 2. Authentication flows
  if (path.includes("signin")) {
    return t(lang, "audio_signin");
  }
  if (path.includes("signup")) {
    return t(lang, "audio_signup");
  }
  if (path.includes("verify-otp")) {
    return t(lang, "audio_verify_otp");
  }
  if (path.includes("create-pin")) {
    return t(lang, "audio_create_pin");
  }
  if (path.includes("forgot-pin")) {
    return t(lang, "audio_forgot_pin");
  }
  if (path.includes("verify")) {
    return t(lang, "audio_verify_intro");
  }

  // 3. Citizen Dashboard & Profile
  if (path.includes("dashboard")) {
    return t(lang, "audio_dashboard");
  }
  if (path.includes("profile")) {
    return t(lang, "audio_profile");
  }

  // 4. RTI Creation Flow
  if (path.includes("describe")) {
    return t(lang, "audio_describe");
  }
  if (path.includes("understanding")) {
    return t(lang, "audio_understanding");
  }
  if (path.includes("suitability")) {
    return t(lang, "audio_suitability");
  }
  if (path.includes("questions")) {
    return t(lang, "audio_questions");
  }
  if (path.includes("supporting")) {
    return t(lang, "audio_documents");
  }
  if (path.includes("authority")) {
    if (context?.authorityName) {
      return `${t(lang, "audio_authority")} ${context.authorityName}.`;
    }
    return t(lang, "audio_authority");
  }
  if (path.includes("review")) {
    return t(lang, "audio_review");
  }
  if (path.includes("payment")) {
    return t(lang, "audio_payment");
  }
  if (path.includes("submitted")) {
    if (context?.requestId) {
      return `${t(lang, "audio_submitted")} ${context.requestId}.`;
    }
    return t(lang, "audio_submitted");
  }

  // 5. Tracking, Explanations & Appeals
  if (path.includes("explain")) {
    return t(lang, "audio_explain_status");
  }
  if (path.includes("response")) {
    return t(lang, "audio_under_review");
  }
  if (path.includes("appeal")) {
    return t(lang, "audio_first_appeal");
  }
  if (path.includes("track")) {
    return t(lang, "audio_tracking");
  }

  // 6. Kiosk Mode
  if (path.includes("kiosk")) {
    return t(lang, "audio_kiosk_welcome");
  }

  return t(lang, "intro_narration");
}
