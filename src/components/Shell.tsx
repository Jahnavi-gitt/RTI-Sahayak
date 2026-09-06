import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, LayoutGrid, ShieldCheck, Home, User, Volume2, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import { LANG_LABELS, t } from "../i18n/strings";
import type { Lang } from "../types";
import { getPageNarration } from "../services/narration";
import { speakText } from "../services/tts";

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
  const { lang, setLang, textScale, setTextScale, currentUser } = useApp();
  const [showTextMenu, setShowTextMenu] = useState(false);
  const location = useLocation();
  const stepIndex = step ? STEPS.indexOf(step) : -1;

  // Spoken contextual voice explanation based on active page route
  function speakPageGuidance() {
    const path = window.location.hash ? window.location.hash.replace("#", "") : location.pathname;
    const text = getPageNarration(path, lang);
    speakText(text, lang);
  }

  const TEXT_SCALE_OPTIONS = [100, 110, 120, 130, 140];

  return (
    <div className={`min-h-screen flex flex-col bg-paper lang-${lang} transition-all duration-150`}>
      {!hideChrome && (
        <header className="border-b border-teal-100 bg-white/90 backdrop-blur sticky top-0 z-30 shadow-xs">
          <div className="max-w-xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {onBack ? (
                <button
                  onClick={onBack}
                  aria-label={t(lang, "back")}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-teal-50 text-teal-700 active:scale-95"
                >
                  <ArrowLeft size={20} />
                </button>
              ) : (
                <Link to={currentUser ? "/dashboard" : "/"} className="flex items-center gap-2 min-h-[44px]">
                  <span className="w-8 h-8 rounded-lg bg-teal-600 text-marigold-400 font-display font-bold flex items-center justify-center text-lg shadow-xs">
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
              <div className="hidden sm:flex items-center gap-5 mr-2 text-sm font-bold">
                <Link to="/dashboard" className="text-teal-700 hover:text-teal-900">{t(lang, "home")}</Link>
                <Link to="/profile" className="text-teal-700 hover:text-teal-900">{t(lang, "profile")}</Link>
              </div>
            )}

            <div className="flex items-center gap-1 relative">
              {/* Contextual Spoken Audio Guidance */}
              <button
                onClick={speakPageGuidance}
                aria-label={t(lang, "listen")}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-teal-50 text-teal-700 active:scale-95"
                title={t(lang, "listen")}
              >
                <Volume2 size={19} />
              </button>

              {/* Text Size Scale Toggle */}
              <button
                onClick={() => setShowTextMenu(!showTextMenu)}
                aria-label={t(lang, "shellTextSize")}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-teal-50 text-teal-700 ${
                  textScale > 100 ? "bg-teal-50 text-teal-900 font-bold" : ""
                }`}
                title={t(lang, "shellTextSize")}
              >
                <span className="text-xs font-bold font-mono">{textScale}%</span>
              </button>

              {/* Text Scale Popup Menu */}
              {showTextMenu && (
                <div className="absolute right-12 top-12 bg-white border-2 border-teal-200 rounded-card p-3 shadow-xl z-50 flex flex-col gap-2 min-w-[150px]">
                  <div className="flex justify-between items-center border-b border-teal-100 pb-1.5">
                    <span className="text-xs font-bold text-teal-900 uppercase">{t(lang, "shellTextSize")}</span>
                    <button onClick={() => setShowTextMenu(false)} className="text-ink/50 hover:text-ink">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    {TEXT_SCALE_OPTIONS.map((scale) => (
                      <button
                        key={scale}
                        onClick={() => {
                          setTextScale(scale);
                          setShowTextMenu(false);
                        }}
                        className={`text-left px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                          textScale === scale ? "bg-teal-600 text-white" : "hover:bg-teal-50 text-ink"
                        }`}
                      >
                        {scale}%
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Kiosk Mode Launcher */}
              <Link
                to="/kiosk"
                aria-label={t(lang, "kioskEnter")}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-teal-50 text-teal-700"
                title={t(lang, "kioskEnter")}
              >
                <LayoutGrid size={18} />
              </Link>

              {/* Language Selector Dropdown */}
              <div className="relative">
                <label htmlFor="lang-select" className="sr-only">
                  {t(lang, "shellSelectLanguage")}
                </label>
                <select
                  id="lang-select"
                  value={lang}
                  onChange={(e) => setLang(e.target.value as Lang)}
                  className="min-h-[44px] text-xs font-bold font-mono bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-full px-3 py-1.5 border border-teal-200 focus-visible:outline-teal-500 cursor-pointer"
                >
                  {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
                    <option key={l} value={l}>
                      {LANG_LABELS[l]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          {stepIndex >= 0 && (
            <div className="max-w-xl mx-auto px-4 pb-2" aria-label="Progress">
              <div className="flex items-center gap-1">
                {STEPS.map((s, i) => {
                  const done = i < stepIndex;
                  const current = i === stepIndex;
                  return (
                    <div
                      key={s}
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        done ? "bg-teal-600" : current ? "bg-marigold-500" : "bg-teal-100"
                      }`}
                      aria-current={current ? "step" : undefined}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </header>
      )}

      {/* Main Page Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-4 sm:py-6">{children}</main>

      {/* Bottom Sticky Mobile Navigation for Authenticated Citizen */}
      {!hideChrome && currentUser && (
        <nav className="sm:hidden border-t border-teal-100 bg-white/95 backdrop-blur sticky bottom-0 z-20 py-2 px-8 flex justify-between items-center shadow-lg max-w-xl mx-auto w-full">
          <Link
            to="/dashboard"
            className="flex flex-col items-center gap-0.5 text-teal-700 hover:text-teal-900 text-xs font-semibold py-1"
          >
            <Home size={20} />
            <span>{t(lang, "home")}</span>
          </Link>
          <Link
            to="/profile"
            className="flex flex-col items-center gap-0.5 text-teal-700 hover:text-teal-900 text-xs font-semibold py-1"
          >
            <User size={20} />
            <span>{t(lang, "profile")}</span>
          </Link>
        </nav>
      )}

      {/* Footer */}
      {!hideChrome && (
        <footer className="border-t border-teal-100 py-4 text-center text-xs text-ink/50 bg-white/50">
          <p className="flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} className="text-teal-600" />
            <span>{t(lang, "independentNotice")}</span>
          </p>
        </footer>
      )}
    </div>
  );
}
