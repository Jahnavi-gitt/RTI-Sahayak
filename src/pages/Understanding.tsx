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
    setLoading(true);
    understandProblem(draft.rawProblem, lang).then((r) => {
      if (!active) return;
      setResult(r);
      setLoading(false);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.rawProblem]);

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
            {result.source === "fallback" && (
              <p className="text-xs bg-marigold-100 text-marigold-600 rounded-full px-3 py-1.5 font-semibold">
                {t(lang, "aiUnavailable")}
              </p>
            )}
            <Sparkles className="text-marigold-500" size={30} aria-hidden="true" />
            <h1 className="font-display text-2xl font-semibold text-teal-900">
              {t(lang, "understandingTitle")}
            </h1>
            <div className="bg-white border-2 border-teal-100 rounded-card p-5 w-full text-left shadow-card">
              <p className="text-lg text-ink leading-relaxed">{result.summary}</p>
              <div className="mt-3">
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
