import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import Shell from "../components/Shell";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";

const STYLE = {
  likely: { icon: CheckCircle2, color: "text-leaf", bg: "bg-leaf/10", label: "RTI may help here." },
  maybe: {
    icon: HelpCircle,
    color: "text-marigold-600",
    bg: "bg-marigold-100",
    label: "RTI might help, but we're not fully sure.",
  },
  unlikely: {
    icon: XCircle,
    color: "text-brick",
    bg: "bg-brick/10",
    label: "RTI may not be the best first step.",
  },
};

export default function Suitability() {
  const { lang, draft } = useApp();
  const navigate = useNavigate();
  const understanding = draft.understanding;

  useEffect(() => {
    if (!understanding) navigate("/describe");
  }, [understanding, navigate]);

  if (!understanding) return null;
  const suitabilityKey = (understanding.rti_suitability || "likely") as keyof typeof STYLE;
  const style = STYLE[suitabilityKey] || STYLE.likely;
  const Icon = style.icon;
  const isAction = understanding.goal === "request_action";

  return (
    <Shell step="understand" onBack={() => navigate("/understanding")}>
      <div className="flex flex-col gap-6 pt-4">
        <h1 className="font-display text-3xl font-semibold text-teal-900">{t(lang, "suitabilityTitle")}</h1>

        <div className={`rounded-card p-5 flex gap-4 items-start ${style.bg}`}>
          <Icon className={style.color} size={28} aria-hidden="true" />
          <div>
            <p className={`font-semibold text-lg ${style.color}`}>
              {understanding.rti_suitability === "likely"
                ? t(lang, "suitabilityLikelyLabel")
                : understanding.rti_suitability === "maybe"
                ? t(lang, "suitabilityMaybeLabel")
                : t(lang, "suitabilityUnlikelyLabel")}
            </p>
            <p className="text-ink/80 mt-1 leading-relaxed">{understanding.suitability_reason}</p>
          </div>
        </div>

        {!isAction ? (
          <p className="text-ink/70 leading-relaxed">
            {t(lang, "suitabilityHelpText")}
          </p>
        ) : (
          <div className="bg-white border-2 border-teal-100 rounded-card p-4">
            <p className="text-ink/80 leading-relaxed">
              {t(lang, "suitabilityActionWarning")}
            </p>
          </div>
        )}

        <p className="text-xs text-ink/50 italic">{t(lang, "generalGuidance")}</p>

        <Button full onClick={() => navigate("/questions")}>
          {t(lang, "continue")}
        </Button>
      </div>
    </Shell>
  );
}
