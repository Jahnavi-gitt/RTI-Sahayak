import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Volume2, Edit3, CheckCircle, AlertCircle } from "lucide-react";
import Shell from "../components/Shell";
import Button from "../components/Button";
import ListenButton from "../components/ListenButton";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";
import { generateRtiQuestions } from "../services/ai";
import { speakText } from "../services/tts";
import type { RtiQuestion } from "../types";

export default function QuestionsHero() {
  const { lang, draft, updateDraft } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!draft.questions || draft.questions.length === 0);
  const [questions, setQuestions] = useState<RtiQuestion[]>(draft.questions || []);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!draft.understanding) {
      navigate("/describe");
      return;
    }

    // If questions are already present in the current draft, preserve them so user edits are not overwritten
    if (draft.questions && draft.questions.length > 0) {
      return;
    }

    let isMounted = true;
    generateRtiQuestions(draft.understanding, draft.rawProblem, lang).then((qs) => {
      if (isMounted) {
        setQuestions(qs);
        updateDraft({ questions: qs });
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [draft.understanding, draft.rawProblem, lang, navigate, updateDraft, draft.questions]);

  function updateQuestionText(id: string, text: string) {
    setErrorMessage(null);
    setQuestions((qs) => {
      const updated = qs.map((q) => (q.id === id ? { ...q, text } : q));
      updateDraft({ questions: updated });
      return updated;
    });
  }

  function proceed() {
    // Validation: ensure all questions are non-empty
    const hasEmpty = questions.some((q) => !q.text || q.text.trim().length === 0);
    if (hasEmpty) {
      setErrorMessage(t(lang, "questionEmptyError"));
      return;
    }

    updateDraft({ questions });
    navigate("/supporting");
  }

  return (
    <Shell step="write" onBack={() => navigate("/suitability")}>
      <div className="flex flex-col gap-6 pt-2">
        <div>
          <h1 className="font-display text-3xl font-semibold text-teal-900">{t(lang, "heroTitle")}</h1>
          <p className="text-sm text-ink/70 mt-1">{t(lang, "questionHelpText")}</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold tracking-wide text-ink/50 uppercase">{t(lang, "yourWords")}</p>
            {draft.rawProblem && (
              <ListenButton text={draft.rawProblem} label={t(lang, "listenMyText")} />
            )}
          </div>
          <div className="relative bg-teal-50 border-l-4 border-teal-600 rounded-r-card px-4 py-3 shadow-xs">
            <p className="font-display italic text-lg text-teal-900 leading-snug">
              “{draft.rawProblem}”
            </p>
          </div>
        </div>

        <div className="flex justify-center" aria-hidden="true">
          <svg width="24" height="36" viewBox="0 0 24 36" fill="none">
            <path d="M12 0V30" stroke="#0B5D5D" strokeWidth="2" strokeDasharray="3 4" />
            <path d="M4 24L12 34L20 24" stroke="#0B5D5D" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Edit3 size={18} className="text-marigold-600" />
              <p className="text-sm font-bold tracking-wide text-teal-950 uppercase">{t(lang, "clearRequest")}</p>
            </div>
            {!loading && questions.length > 0 && (
              <ListenButton
                text={questions.map((q, i) => `${i + 1}. ${q.text}`).join(". ")}
                label={t(lang, "listenQuestions")}
              />
            )}
          </div>

          {loading ? (
            <div className="flex items-center gap-3 text-ink/60 py-10 justify-center bg-white rounded-card border border-teal-100 shadow-xs">
              <Loader2 className="animate-spin text-teal-600" size={24} /> 
              <span className="font-medium text-base">{t(lang, "turningIntoQuestions")}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {questions.map((q, i) => (
                <div
                  key={q.id}
                  className="bg-white border-2 border-teal-150 focus-within:border-teal-600 rounded-card p-4 flex flex-col gap-2.5 shadow-card transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-teal-700 text-white font-display font-bold flex items-center justify-center text-sm shadow-xs">
                        {i + 1}
                      </span>
                      <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                        {t(lang, "editQuestionLabel")} {i + 1}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => speakText(q.text, lang)}
                      title={t(lang, "listen")}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-full transition-colors active:scale-95"
                    >
                      <Volume2 size={14} />
                      <span>{t(lang, "listen")}</span>
                    </button>
                  </div>

                  <textarea
                    value={q.text}
                    onChange={(e) => updateQuestionText(q.id, e.target.value)}
                    rows={3}
                    aria-label={`${t(lang, "editQuestionLabel")} ${i + 1}`}
                    className="w-full border border-teal-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 rounded-lg p-3 text-ink text-base leading-relaxed resize-none bg-white"
                  />
                </div>
              ))}
            </div>
          )}

          {errorMessage && (
            <div className="mt-3 p-3 bg-brick/10 border border-brick/30 rounded-lg flex items-center gap-2 text-brick text-sm font-semibold">
              <AlertCircle size={18} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {!loading && (
          <>
            <div className="bg-teal-50/80 border border-teal-200 rounded-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle size={18} className="text-teal-700" />
                <p className="font-semibold text-teal-900">{t(lang, "whyThisWorks")}</p>
              </div>
              <p className="text-sm text-ink/70 leading-relaxed">{t(lang, "whyThisWorksBody")}</p>
            </div>

            <Button full onClick={proceed}>
              {t(lang, "looksGood")}
            </Button>
          </>
        )}
      </div>
    </Shell>
  );
}
