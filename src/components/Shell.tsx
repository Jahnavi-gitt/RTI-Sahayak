import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LayoutGrid, ShieldCheck, Type, Home, User, Volume2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { LANG_LABELS, t } from "../i18n/strings";
import type { Lang } from "../types";

const STEPS = ["understand", "write", "check", "submit", "track"] as const;

export default function Shell({
  children,
  step,
  onBack,
  hideChrome,
}: {
  children: ReactNode;
  step?: (typeof STEPS)[number];
  onBack?: () => void;
  hideChrome?: boolean;
}) {
  const { lang, setLang, largeText, setLargeText, currentUser } = useApp();
  const stepIndex = step ? STEPS.indexOf(step) : -1;

  // TTS helper for browser audio guidance explain
  function speakPageGuidance() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    
    // Choose voice text based on current route/step
    let audioKey = "audio_welcome";
    const path = window.location.hash;
    
    if (path.includes("/verify")) {
      audioKey = "audio_verify";
    } else if (path.includes("/describe")) {
      audioKey = "audio_problem";
    } else if (path.includes("/understanding")) {
      audioKey = "audio_understanding";
    } else if (path.includes("/suitability")) {
      audioKey = "audio_suitability";
    } else if (path.includes("/questions")) {
      audioKey = "audio_questions";
    } else if (path.includes("/supporting")) {
      audioKey = "audio_documents";
    } else if (path.includes("/authority")) {
      audioKey = "audio_authority";
    } else if (path.includes("/review")) {
      audioKey = "audio_review";
    } else if (path.includes("/payment")) {
      audioKey = "audio_payment";
    } else if (path.includes("/submitted")) {
      audioKey = "audio_submission";
    } else if (path.includes("/track") && path.includes("/explain")) {
      audioKey = "audio_explain_status";
    } else if (path.includes("/track")) {
      audioKey = "audio_tracking";
    }

    const text = t(lang, audioKey);
    const u = new SpeechSynthesisUtterance(text);
    const localeMap: Record<string, string> = {
      en: "en-IN",
      hi: "hi-IN",
      ta: "ta-IN",
      te: "te-IN",
      kn: "kn-IN",
      ml: "ml-IN",
      bn: "bn-IN",
      mr: "mr-IN",
    };
    const targetLang = localeMap[lang] || "en-IN";
    u.lang = targetLang;
    u.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find((v) => {
      const vLang = v.lang.toLowerCase().replace("_", "-");
      const tLang = targetLang.toLowerCase();
      return vLang === tLang || vLang.startsWith(tLang.split("-")[0]);
    });
    if (matchedVoice) {
      u.voice = matchedVoice;
    }

    window.speechSynthesis.speak(u);
  }

  return (
    <div className={`min-h-screen flex flex-col bg-paper ${largeText ? "text-[110%]" : ""} lang-${lang}`}>
      {!hideChrome && (
        <header className="border-b border-teal-100 bg-white/80 backdrop-blur sticky top-0 z-20">
          <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {onBack ? (
                <button
                  onClick={onBack}
                  aria-label={t(lang, "back")}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-teal-50 text-teal-700"
                >
                  <ArrowLeft size={20} />
                </button>
              ) : (
                <Link to={currentUser ? "/dashboard" : "/"} className="flex items-center gap-2 min-h-[44px]">
                  <span className="w-8 h-8 rounded-lg bg-teal-600 text-marigold-400 font-display font-bold flex items-center justify-center text-lg">
                    ?
                  </span>
                </Link>
              )}
              <Link to={currentUser ? "/dashboard" : "/"} className="font-display font-semibold text-teal-700 text-lg hidden sm:block">
                {t(lang, "appName")}
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            {currentUser && (
              <div className="hidden sm:flex items-center gap-5 mr-2 text-[15px] font-bold">
                <Link to="/dashboard" className="text-teal-700 hover:text-teal-900">{t(lang, "navHome")}</Link>
                <Link to="/describe" className="text-teal-700 hover:text-teal-900">{t(lang, "navNewRti")}</Link>
                <Link to="/profile" className="text-teal-700 hover:text-teal-900">{t(lang, "navProfile")}</Link>
              </div>
            )}

            <div className="flex items-center gap-1">
              {/* Explain Audio Assistance */}
              <button
                onClick={speakPageGuidance}
                aria-label="Explain page using audio"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-teal-50 text-teal-700"
                title={t(lang, "listen")}
              >
                <Volume2 size={19} />
              </button>

              <button
                onClick={() => setLargeText(!largeText)}
                aria-pressed={largeText}
                aria-label={t(lang, "shellToggleText")}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-teal-50 text-teal-700"
                title={t(lang, "shellLargerTextTitle")}
              >
                <Type size={19} />
              </button>
              
              <Link
                to="/kiosk"
                aria-label={t(lang, "kioskEnter")}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-teal-50 text-teal-700"
                title={t(lang, "kioskEnter")}
              >
                <LayoutGrid size={19} />
              </Link>

              <select
                aria-label={t(lang, "shellSelectLanguage")}
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
                className="min-h-[44px] rounded-full border border-teal-200 bg-white px-2 text-sm font-semibold text-teal-700 focus-visible:outline-marigold-500"
              >
                {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
                  <option key={l} value={l}>
                    {l.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {stepIndex >= 0 && (
            <div className="max-w-xl mx-auto px-4 pb-3" aria-hidden="true">
              <div className="flex gap-1.5">
                {STEPS.map((s, i) => (
                  <div
                    key={s}
                    className={`h-1.5 flex-1 rounded-full ${
                      i <= stepIndex ? "bg-marigold-500" : "bg-teal-100"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </header>
      )}

      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-6 sm:py-10">{children}</main>

      {/* Pinned Bottom Navigation for Mobile Viewports */}
      {currentUser && !hideChrome && (
        <nav className="sm:hidden border-t border-teal-100 bg-white/95 sticky bottom-0 z-20 flex justify-around py-2.5">
          <Link to="/dashboard" className="flex flex-col items-center text-teal-700 hover:text-teal-900">
            <Home size={18} />
            <span className="text-[10px] font-bold mt-1">{t(lang, "navHome")}</span>
          </Link>
          <Link to="/describe" className="flex flex-col items-center text-teal-700 hover:text-teal-900">
            <LayoutGrid size={18} />
            <span className="text-[10px] font-bold mt-1">{t(lang, "navNewRti")}</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center text-teal-700 hover:text-teal-900">
            <User size={18} />
            <span className="text-[10px] font-bold mt-1">{t(lang, "navProfile")}</span>
          </Link>
        </nav>
      )}

      {!hideChrome && (
        <footer className="border-t border-teal-100 bg-white/60 py-3 mb-12 sm:mb-0">
          <p className="max-w-xl mx-auto px-4 text-xs text-ink/60 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-teal-600 shrink-0" aria-hidden="true" />
            {t(lang, "independentNotice")}
          </p>
        </footer>
      )}
    </div>
  );
}
