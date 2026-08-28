import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Shell from "../components/Shell";
import Button from "../components/Button";
import VoiceCapture from "../components/VoiceCapture";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";
import type { RtiRequest } from "../types";

const MAX_LEN = 600;
const DEMO_TEXT = "My scholarship hasn't come for 4 months and nobody is telling me what's happening.";

export default function DescribeProblem() {
  const { lang, updateDraft, requests } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isDemo = params.get("demo") === "1";
  const [text, setText] = useState(isDemo ? DEMO_TEXT : "");
  const [touched, setTouched] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<RtiRequest | null>(null);

  const tooShort = text.trim().length > 0 && text.trim().length < 8;
  const empty = text.trim().length === 0;

  function handleContinue() {
    setTouched(true);
    if (empty || tooShort) return;

    // Check for duplicate request matching keywords
    const lowercaseInput = text.toLowerCase();
    const keywords = ["scholarship", "pension", "road", "pothole", "water", "electricity"];
    const matchedKeyword = keywords.find((k) => lowercaseInput.includes(k));

    if (matchedKeyword && !duplicateWarning) {
      const existing = requests.find(
        (r) =>
          r.rawProblem.toLowerCase().includes(matchedKeyword) ||
          r.understanding?.topic.toLowerCase().includes(matchedKeyword)
      );

      if (existing) {
        setDuplicateWarning(existing);
        return;
      }
    }

    proceedToUnderstanding();
  }

  function proceedToUnderstanding() {
    updateDraft({ rawProblem: text.trim() });
    navigate("/understanding");
  }

  return (
    <Shell step="understand" onBack={() => navigate("/dashboard")}>
      <div className="flex flex-col gap-5 pt-2">
        {duplicateWarning ? (
          /* Duplicate Warning Screen */
          <div className="bg-white border-2 border-marigold-200 rounded-card p-5 shadow-card space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h2 className="font-display text-xl font-bold text-teal-900">
                  {t(lang, "duplicateWarning")}
                </h2>
                <p className="text-sm text-ink/70 mt-1">
                  {t(lang, "duplicateText")}
                </p>
              </div>
            </div>

            <div className="bg-teal-50 border border-teal-100 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono text-ink/60">
                <span>{duplicateWarning.id}</span>
                <span className="font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full uppercase">
                  {t(lang, `status_${duplicateWarning.currentStatus}`)}
                </span>
              </div>
              <p className="font-bold text-teal-950 text-sm">{duplicateWarning.rawProblem}</p>
              <p className="text-xs text-ink/50">
                Submitted: {new Date(duplicateWarning.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <Button full onClick={() => navigate(`/track/${duplicateWarning.id}`)}>
                {t(lang, "viewExisting")}
              </Button>
              <Button full variant="secondary" onClick={proceedToUnderstanding}>
                {t(lang, "startNewAnyway")}
              </Button>
              <Button
                full
                variant="ghost"
                onClick={() => {
                  setDuplicateWarning(null);
                  setText("");
                }}
              >
                {t(lang, "cancel")}
              </Button>
            </div>
          </div>
        ) : (
          /* Main Input Screen */
          <>
            <h1 className="font-display text-3xl font-semibold text-teal-900">{t(lang, "screen2Title")}</h1>

            <VoiceCapture
              label={`🎤 ${t(lang, "speak")}`}
              listeningLabel="I'm listening…"
              onResult={(spoken) => setText((prev) => (prev ? `${prev} ${spoken}` : spoken))}
            />

            <div>
              <label htmlFor="problem" className="sr-only">
                {t(lang, "screen2Title")}
              </label>
              <textarea
                id="problem"
                value={text}
                maxLength={MAX_LEN}
                onChange={(e) => setText(e.target.value)}
                placeholder={t(lang, "screen2Placeholder")}
                rows={6}
                aria-describedby="charcount privacynote"
                className="w-full rounded-card border-2 border-teal-100 focus-visible:border-teal-500 p-4 text-lg leading-relaxed resize-none bg-white"
              />
              <div id="charcount" className="text-right text-xs text-ink/50 mt-1">
                {text.length} / {MAX_LEN}
              </div>
            </div>

            {touched && (empty || tooShort) && (
              <p role="alert" className="text-brick text-sm font-medium -mt-3">
                {empty ? t(lang, "validationEmpty") : t(lang, "validationTooShort")}
              </p>
            )}

            <p id="privacynote" className="text-xs text-ink/60 bg-teal-50 rounded-lg px-3 py-2.5">
              {t(lang, "privacyNote")}
            </p>

            <Button onClick={handleContinue} full>
              {t(lang, "continue")}
            </Button>
          </>
        )}
      </div>
    </Shell>
  );
}
