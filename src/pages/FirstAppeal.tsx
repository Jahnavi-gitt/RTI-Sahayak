import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Shell from "../components/Shell";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";

type Reason = "no_response" | "incomplete" | "rejected";

export default function FirstAppeal() {
  const { lang, requests } = useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const request = requests.find((r) => r.id === id);
  const [reason, setReason] = useState<Reason | null>(null);

  if (!request) {
    navigate("/");
    return null;
  }

  return (
    <Shell step="track" onBack={() => navigate(`/track/${request.id}`)}>
      <div className="flex flex-col gap-5 pt-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-teal-900">{t(lang, "appealTitle")}</h1>
          <p className="text-xs text-ink/50 mt-1 italic leading-relaxed">
            {t(lang, "appealDemoNote")}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <ReasonButton
            selected={reason === "no_response"}
            onClick={() => setReason("no_response")}
            label={t(lang, "appealReasonNoResponse")}
          />
          <ReasonButton
            selected={reason === "incomplete"}
            onClick={() => setReason("incomplete")}
            label={t(lang, "appealReasonIncomplete")}
          />
          <ReasonButton
            selected={reason === "rejected"}
            onClick={() => setReason("rejected")}
            label={t(lang, "appealReasonRejected")}
          />
        </div>

        {reason === "no_response" && (
          <div className="bg-white border-2 border-teal-100 rounded-card p-4 text-ink leading-relaxed">
            {t(lang, "appealGuidanceNoResponse")}
          </div>
        )}

        {reason === "incomplete" && (
          <div className="bg-white border-2 border-teal-100 rounded-card p-4 text-ink leading-relaxed">
            {t(lang, "appealGuidanceIncomplete")}
          </div>
        )}

        {reason === "rejected" && (
          <div className="bg-white border-2 border-teal-100 rounded-card p-4 text-ink leading-relaxed">
            {t(lang, "appealGuidanceRejected")}
          </div>
        )}

        <Button full onClick={() => navigate(`/track/${request.id}`)}>
          {t(lang, "gotIt")}
        </Button>
      </div>
    </Shell>
  );
}

function ReasonButton({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[52px] rounded-card border-2 font-body font-semibold text-[17px] transition-colors text-left px-4 ${
        selected
          ? "border-teal-600 bg-teal-50 text-teal-700"
          : "border-teal-100 bg-white text-ink hover:border-teal-300"
      }`}
    >
      {label}
    </button>
  );
}
