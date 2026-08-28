import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check } from "lucide-react";
import Shell from "../components/Shell";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";

export default function EndScreen() {
  const { lang, requests, resetDraft } = useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const request = requests.find((r) => r.id === id);
  const [copied, setCopied] = useState(false);

  if (!request) {
    navigate("/");
    return null;
  }

  function handleCopy() {
    navigator.clipboard.writeText(request!.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleStartNew() {
    resetDraft();
    navigate("/");
  }

  return (
    <Shell step="track" hideChrome>
      <div className="flex flex-col gap-6 pt-6 text-center items-center">
        <div className="w-16 h-16 rounded-full bg-leaf/10 flex items-center justify-center text-leaf shadow-card">
          <Check size={32} strokeWidth={3} />
        </div>
        <div>
          <h1 className="font-display text-3xl font-semibold text-teal-900">{t(lang, "allSet")}</h1>
        </div>

        <div className="bg-white border-2 border-teal-100 rounded-card p-5 w-full text-left space-y-3 shadow-card">
          <div className="flex justify-between items-center border-b border-teal-50 pb-2">
            <span className="text-sm text-ink/50">{t(lang, "endStatusLabel")}</span>
            <span className="font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase font-mono">
              {t(lang, "endStatusValue")}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-ink/50">{t(lang, "endNextActionLabel")}</span>
            <span className="font-semibold text-ink">{t(lang, "endNextActionValue")}</span>
          </div>
        </div>

        <div className="w-full bg-white border-2 border-teal-100 rounded-card p-4 flex flex-col items-center gap-2.5 shadow-card">
          <span className="text-xs text-ink/50 font-bold uppercase tracking-wider">{t(lang, "endSaveNote")}</span>
          <span className="font-mono text-xl font-bold tracking-wider text-teal-950">{request.id}</span>
          <button
            onClick={handleCopy}
            className="text-xs font-bold text-teal-600 uppercase tracking-wide px-3 py-1 bg-teal-50 rounded hover:bg-teal-100 transition-colors"
          >
            {copied ? t(lang, "endCopied") : t(lang, "copyId")}
          </button>
        </div>

        <Button full onClick={handleStartNew} className="mt-4">
          {t(lang, "startNew")}
        </Button>
      </div>
    </Shell>
  );
}
