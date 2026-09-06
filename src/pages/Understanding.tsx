import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Sparkles } from "lucide-react";
import Shell from "../components/Shell";
import Button from "../components/Button";
import ListenButton from "../components/ListenButton";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";
import { understandProblem } from "../services/ai";
import type { UnderstandResult } from "../types";

export default function Understanding() {
  const { lang, draft, updateDraft } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<UnderstandResult | null>(null);

  useEffect(() => {
    if (!draft.rawProblem) {
      navigate("/describe");
      return;
    }
    let active = true;
    understandProblem(draft.rawProblem, lang).then((r) => {
      if (!active) return;
      setResult(r);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [draft.rawProblem, lang, navigate]);

  function confirm() {
    if (!result) return;
    updateDraft({ understanding: result });
    navigate("/suitability");
  }

  return (
    <Shell step="understand" onBack={() => navigate("/describe")}>
      <div className="flex flex-col gap-6 pt-6 items-center text-center">
        {loading || !result ? (
          <>
            <Loader2 className="animate-spin text-teal-600" size={40} aria-hidden="true" />
            <p className="text-ink/70 font-medium" role="status">
              {t(lang, "readingStatus")}
            </p>
          </>
        ) : (
          <>
            <Sparkles className="text-marigold-500" size={30} aria-hidden="true" />
            <h1 className="font-display text-2xl font-semibold text-teal-900">
              {t(lang, "understandingTitle")}
            </h1>
            <div className="bg-teal-50/70 border border-teal-200 rounded-card p-4 w-full text-left shadow-xs space-y-2">
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block">
                {t(lang, "yourComplaint")}
              </span>
              <p className="text-sm font-medium text-teal-950 leading-relaxed italic">
                "{draft.rawProblem}"
              </p>
              <div className="pt-1">
                <ListenButton text={draft.rawProblem} label={t(lang, "listenMyText")} />
              </div>
            </div>

            <div className="bg-white border-2 border-teal-100 rounded-card p-5 w-full text-left shadow-card space-y-3">
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider block">
                {t(lang, "understandingTitle")}
              </span>
              <p className="text-lg text-ink leading-relaxed">{result.summary}</p>
              <div>
                <ListenButton text={result.summary} />
              </div>
            </div>
            <p className="text-sm text-ink/60 leading-relaxed">{t(lang, "understandingHelp")}</p>

            <div className="w-full flex flex-col gap-3">
              <Button full onClick={confirm}>
                {t(lang, "thatsRight")}
              </Button>
              <Button full variant="secondary" onClick={() => navigate("/describe")}>
                {t(lang, "edit")}
              </Button>
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}
