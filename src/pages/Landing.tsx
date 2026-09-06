import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, LayoutGrid, Globe } from "lucide-react";
import Shell from "../components/Shell";
import Button from "../components/Button";
import ListenButton from "../components/ListenButton";
import { useApp } from "../context/AppContext";
import { LANG_LABELS, t } from "../i18n/strings";
import { speakText, stopAllSpeech } from "../services/tts";
import type { Lang } from "../types";

export default function Landing() {
  const { lang, setLang } = useApp();

  // Spoken introduction in the currently selected language
  useEffect(() => {
    const introText = t(lang, "main_intro_voice");
    speakText(introText, lang);
    return () => {
      stopAllSpeech();
    };
  }, [lang]);

  return (
    <Shell hideChrome={false}>
      <div className="flex flex-col items-center text-center gap-6 pt-2 sm:pt-6">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-marigold-800 bg-marigold-100 px-3 py-1.5 rounded-full">
          <ShieldCheck size={14} className="text-marigold-700" /> {t(lang, "independentNotice")}
        </span>

        <div className="w-16 h-16 rounded-2xl bg-teal-600 flex items-center justify-center font-display text-marigold-400 text-4xl font-bold shadow-card">
          ?
        </div>

        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-teal-900 leading-tight">
          {t(lang, "appName")}
        </h1>

        <p className="text-base sm:text-lg text-ink/80 max-w-sm leading-relaxed">
          {t(lang, "tagline")}
        </p>

        {/* Audio introduction button */}
        <div className="flex justify-center -mt-2">
          <ListenButton text={t(lang, "main_intro_voice")} label={t(lang, "listen")} />
        </div>

        {/* Quick Language Selector directly on Front Page */}
        <div className="flex items-center gap-2 bg-white border border-teal-150 rounded-full px-3 py-1 shadow-xs">
          <Globe size={16} className="text-teal-600" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="text-xs font-bold text-teal-800 bg-transparent focus:outline-none cursor-pointer"
          >
            {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
              <option key={l} value={l}>
                {LANG_LABELS[l]}
              </option>
            ))}
          </select>
        </div>

        {/* Primary Action Buttons */}
        <div className="w-full flex flex-col gap-3 max-w-xs mt-1">
          <Link to="/signup" className="w-full">
            <Button full>{t(lang, "signUp")}</Button>
          </Link>
          <Link to="/signin" className="w-full">
            <Button full variant="secondary">
              {t(lang, "signIn")}
            </Button>
          </Link>
        </div>

        {/* Kiosk Mode Banner Link */}
        <Link
          to="/kiosk"
          className="inline-flex items-center gap-2 text-sm font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-5 py-2.5 rounded-full min-h-[44px] shadow-xs active:scale-95"
        >
          <LayoutGrid size={16} />
          {t(lang, "kioskEnter")}
        </Link>

        {/* 3 Step Interactive Workflow Overview */}
        <div className="mt-4 grid grid-cols-3 gap-3 w-full text-xs text-ink/70 border-t border-teal-100 pt-5">
          <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-teal-50/40">
            <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-xs">1</span>
            <span className="font-semibold text-teal-900">{t(lang, "landingStep1")}</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-teal-50/40">
            <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-xs">2</span>
            <span className="font-semibold text-teal-900">{t(lang, "landingStep2")}</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-teal-50/40">
            <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-xs">3</span>
            <span className="font-semibold text-teal-900">{t(lang, "landingStep3")}</span>
          </div>
        </div>
      </div>
    </Shell>
  );
}
