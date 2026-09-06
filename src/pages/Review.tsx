import { useNavigate } from "react-router-dom";
import { AlertTriangle, FileQuestion, Landmark, User, FileText, MessageSquareQuote } from "lucide-react";
import Shell from "../components/Shell";
import Button from "../components/Button";
import ListenButton from "../components/ListenButton";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";
import { getLocalizedDepartmentName } from "../data/departments";

export default function Review() {
  const { lang, draft, attachedDocs } = useApp();
  const navigate = useNavigate();

  if (!draft.authority || draft.questions.length === 0) {
    navigate("/describe");
    return null;
  }

  return (
    <Shell step="check" onBack={() => navigate("/authority")}>
      <div className="flex flex-col gap-5 pt-4">
        <h1 className="font-display text-3xl font-semibold text-teal-900">{t(lang, "reviewTitle")}</h1>

        {draft.rawProblem && (
          <section className="bg-teal-50/70 border border-teal-200 rounded-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="flex items-center gap-2 font-semibold text-teal-800 text-sm">
                <MessageSquareQuote size={18} /> {t(lang, "yourComplaint")}
              </p>
              <ListenButton text={draft.rawProblem} label={t(lang, "listenMyText")} />
            </div>
            <p className="text-ink/80 text-sm italic leading-relaxed">
              "{draft.rawProblem}"
            </p>
          </section>
        )}

        <section className="bg-white border-2 border-teal-100 rounded-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="flex items-center gap-2 font-semibold text-teal-700">
              <FileQuestion size={18} /> {t(lang, "reviewQuestionsLabel")}
            </p>
            <ListenButton
              text={draft.questions.map((q: { id: string; text: string }, i: number) => `${i + 1}. ${q.text}`).join(". ")}
              label={t(lang, "listenQuestions")}
            />
          </div>
          <ol className="list-decimal list-inside text-ink/80 space-y-1 text-sm leading-relaxed">
            {draft.questions.map((q: { id: string; text: string }) => (
              <li key={q.id}>{q.text}</li>
            ))}
          </ol>
        </section>

        <section className="bg-white border-2 border-teal-100 rounded-card p-4">
          <p className="flex items-center gap-2 font-semibold text-teal-700 mb-1">
            <Landmark size={18} /> {t(lang, "reviewAuthorityLabel")}
          </p>
          <p className="text-ink/80 text-sm font-semibold text-teal-900">{getLocalizedDepartmentName(draft.authority, lang)}</p>
          {draft.authority.department && (
            <p className="text-xs text-ink/60 mt-0.5">{draft.authority.department}</p>
          )}
        </section>

        <section className="bg-white border-2 border-teal-100 rounded-card p-4">
          <p className="flex items-center gap-2 font-semibold text-teal-700 mb-1">
            <User size={18} /> {t(lang, "reviewApplicantLabel")}
          </p>
          <p className="text-ink/80 text-sm">{t(lang, "reviewApplicantValue")} • {t(lang, "demoData")}</p>
        </section>

        {attachedDocs.length > 0 && (
          <section className="bg-white border-2 border-teal-100 rounded-card p-4">
            <p className="flex items-center gap-2 font-semibold text-teal-700 mb-1">
              <FileText size={18} /> {t(lang, "reviewDocumentsLabel")}
            </p>
            <ul className="list-disc list-inside text-ink/80 text-sm space-y-1">
              {attachedDocs.map((doc, i) => (
                <li key={i}>{doc}</li>
              ))}
            </ul>
          </section>
        )}

        <div className="bg-brick/10 border-2 border-brick/30 rounded-card p-4 flex gap-3 items-start">
          <AlertTriangle className="text-brick shrink-0 mt-0.5" size={20} aria-hidden="true" />
          <p className="text-sm text-brick font-medium leading-relaxed">{t(lang, "prototypeWarning")}</p>
        </div>

        <Button full onClick={() => navigate("/payment")}>
          {t(lang, "submitDemo")}
        </Button>
      </div>
    </Shell>
  );
}
