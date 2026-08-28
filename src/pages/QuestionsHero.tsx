import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Pencil } from "lucide-react";
import Shell from "../components/Shell";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";
import { generateRtiQuestions } from "../services/ai";
import type { RtiQuestion } from "../types";

export default function QuestionsHero() {
  const { lang, draft, updateDraft } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<RtiQuestion[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!draft.understanding) {
      navigate("/describe");
      return;
    }
    setLoading(true);
    generateRtiQuestions(draft.understanding, draft.rawProblem, lang).then((qs) => {
      setQuestions(qs);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateQuestion(id: string, text: string) {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, text } : q)));
  }

  function proceed() {
    updateDraft({ questions });
    navigate("/supporting");
  }

  return (
    <Shell step="write" onBack={() => navigate("/suitability")}>
      <div className="flex flex-col gap-6 pt-2">
        <h1 className="font-display text-3xl font-semibold text-teal-900">{t(lang, "heroTitle")}</h1>

        <div>
          <p className="text-xs font-bold tracking-wide text-ink/50 mb-2">{t(lang, "yourWords")}</p>
          <div className="relative bg-teal-50 border-l-4 border-teal-600 rounded-r-card px-4 py-3">
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
          <p className="text-xs font-bold tracking-wide text-marigold-600 mb-2">{t(lang, "clearRequest")}</p>

          {loading ? (
            <div className="flex items-center gap-2 text-ink/60 py-6 justify-center">
              <Loader2 className="animate-spin" size={22} /> {t(lang, "turningIntoQuestions")}
            </div>
          ) : (
            <ol className="flex flex-col gap-3">
              {questions.map((q, i) => (
                <li
                  key={q.id}
                  className="bg-white border-2 border-marigold-100 rounded-card p-4 flex gap-3 shadow-card"
                >
                  <span className="font-display font-bold text-marigold-600 text-lg shrink-0">
                    {i + 1}
                  </span>
                  {editingId === q.id ? (
                    <textarea
                      autoFocus
                      value={q.text}
                      onChange={(e) => updateQuestion(q.id, e.target.value)}
                      onBlur={() => setEditingId(null)}
                      rows={2}
                      className="flex-1 border border-teal-200 rounded-lg p-2 text-ink resize-none"
                    />
                  ) : (
                    <button
                      onClick={() => setEditingId(q.id)}
                      className="flex-1 text-left text-ink leading-relaxed flex items-start gap-2 group"
                    >
                      <span>{q.text}</span>
                      <Pencil
                        size={14}
                        className="text-teal-400 opacity-0 group-hover:opacity-100 shrink-0 mt-1"
                        aria-hidden="true"
                      />
                    </button>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>

        {!loading && (
          <>
            <div className="bg-teal-50 rounded-card p-4">
              <p className="font-semibold text-teal-800">{t(lang, "whyThisWorks")}</p>
              <p className="text-sm text-ink/70 mt-1 leading-relaxed">{t(lang, "whyThisWorksBody")}</p>
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
