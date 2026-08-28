import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import Shell from "../components/Shell";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";

export default function Landing() {
  const { lang } = useApp();

  return (
    <Shell hideChrome>
      <div className="flex flex-col items-center text-center gap-7 pt-4 sm:pt-10">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-marigold-600 bg-marigold-100 px-3 py-1.5 rounded-full">
          <ShieldCheck size={14} /> {t(lang, "independentNotice")}
        </span>

        <div className="w-16 h-16 rounded-2xl bg-teal-600 flex items-center justify-center font-display text-marigold-400 text-4xl font-bold shadow-card">
          ?
        </div>

        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-teal-900 leading-tight">
          {t(lang, "appName")}
        </h1>

        <p className="text-lg text-ink/80 max-w-sm leading-relaxed">{t(lang, "tagline")}</p>

        <div className="w-full flex flex-col gap-3 max-w-xs">
          <Link to="/language?dest=signup" className="w-full">
            <Button full>{t(lang, "signUp")}</Button>
          </Link>
          <Link to="/language?dest=signin" className="w-full">
            <Button full variant="secondary">
              {t(lang, "signIn")}
            </Button>
          </Link>
        </div>

        <Link
          to="/kiosk"
          className="text-sm font-semibold text-teal-700 underline underline-offset-4 min-h-[44px] flex items-center"
        >
          {t(lang, "kioskEnter")}
        </Link>

        <div className="mt-6 grid grid-cols-3 gap-3 w-full text-xs text-ink/60 border-t border-teal-100 pt-5">
          <div className="flex flex-col items-center gap-1">
            <span className="font-semibold text-teal-700">1</span>
            {t(lang, "landingStep1")}
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-semibold text-teal-700">2</span>
            {t(lang, "landingStep2")}
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-semibold text-teal-700">3</span>
            {t(lang, "landingStep3")}
          </div>
        </div>
      </div>
    </Shell>
  );
}
