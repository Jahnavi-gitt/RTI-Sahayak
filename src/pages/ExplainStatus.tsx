import { useNavigate, useParams } from "react-router-dom";
import { Info, ShieldCheck, Clock } from "lucide-react";
import Shell from "../components/Shell";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";

export default function ExplainStatus() {
  const { lang, requests } = useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const request = requests.find((r) => r.id === id);

  if (!request) {
    navigate("/");
    return null;
  }

  return (
    <Shell step="track" onBack={() => navigate(`/track/${request.id}`)}>
      <div className="flex flex-col gap-5 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 shadow-card shrink-0">
            <Info size={24} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-teal-900">{t(lang, "explainUnderReviewTitle")}</h1>
            <p className="text-xs text-ink/60 font-mono">Application ID: {request.id}</p>
          </div>
        </div>

        {/* Clear Plain Language Elderly Explanation Box */}
        <div className="bg-white border-2 border-teal-100 rounded-card p-5 space-y-3 shadow-card">
          <p className="text-xs font-bold uppercase text-teal-700 tracking-wider">
            {t(lang, "explainUnderReviewWhatItMeans")}
          </p>
          <p className="text-base text-ink/90 leading-relaxed font-medium">
            {t(lang, "explainUnderReviewElderlyText")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-teal-50 border border-teal-100 rounded-card p-3.5 flex items-start gap-2.5">
            <Clock size={18} className="text-teal-700 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-teal-950 block">{t(lang, "statutoryResponsePeriod")}</span>
              <span className="text-ink/70">{t(lang, "statutoryResponsePeriodDesc")}</span>
            </div>
          </div>
          <div className="bg-leaf/10 border border-leaf/30 rounded-card p-3.5 flex items-start gap-2.5">
            <ShieldCheck size={18} className="text-leaf shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-teal-950 block">{t(lang, "noDuplicateRequired")}</span>
              <span className="text-ink/70">{t(lang, "noDuplicateRequiredDesc")}</span>
            </div>
          </div>
        </div>

        <Button full onClick={() => navigate(`/track/${request.id}`)}>
          {t(lang, "gotIt")}
        </Button>
      </div>
    </Shell>
  );
}
