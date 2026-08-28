import { useNavigate } from "react-router-dom";
import { Keyboard, Mic } from "lucide-react";
import Shell from "../components/Shell";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";

export default function ChooseStart() {
  const { lang } = useApp();
  const navigate = useNavigate();

  return (
    <Shell step="understand" onBack={() => navigate("/verify")}>
      <div className="flex flex-col gap-6 pt-4">
        <h1 className="font-display text-3xl font-semibold text-teal-900">{t(lang, "screen1Title")}</h1>

        <button
          onClick={() => navigate("/describe?mode=voice")}
          className="w-full text-left bg-white border-2 border-teal-100 hover:border-teal-500 rounded-card p-5 flex items-center gap-4 shadow-card transition-colors min-h-[84px]"
        >
          <span className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 shrink-0">
            <Mic size={22} />
          </span>
          <span className="font-semibold text-lg text-ink">{t(lang, "speak")}</span>
        </button>

        <button
          onClick={() => navigate("/describe?mode=type")}
          className="w-full text-left bg-white border-2 border-marigold-500 rounded-card p-5 flex items-center gap-4 shadow-card transition-colors min-h-[84px]"
        >
          <span className="w-12 h-12 rounded-full bg-marigold-100 flex items-center justify-center text-marigold-600 shrink-0">
            <Keyboard size={22} />
          </span>
          <span className="font-semibold text-lg text-ink">{t(lang, "typeIt")}</span>
        </button>
      </div>
    </Shell>
  );
}
