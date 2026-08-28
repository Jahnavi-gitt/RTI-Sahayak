import { useNavigate, useParams } from "react-router-dom";
import { Circle, CircleCheck, CircleDot } from "lucide-react";
import Shell from "../components/Shell";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";

export default function Tracking() {
  const { lang, requests } = useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const request = requests.find((r) => r.id === id);

  if (!request) {
    navigate("/");
    return null;
  }

  return (
    <Shell step="track" onBack={() => navigate(`/submitted/${request.id}`)}>
      <div className="flex flex-col gap-6 pt-4">
        <h1 className="font-display text-3xl font-semibold text-teal-900">{t(lang, "trackingTitle")}</h1>
        <p className="text-sm text-ink/50 font-mono">{request.id}</p>

        <ol className="flex flex-col gap-1">
          {request.statusHistory.map((s, i) => {
            const done = i < 2;
            const current = i === 2;
            // Translate the status labels dynamically
            const labelKey = `status_${s.status}`;
            const translatedLabel = t(lang, labelKey);

            return (
              <li key={s.status} className="flex gap-3 items-start relative pb-6 last:pb-0">
                {i < request.statusHistory.length - 1 && (
                  <span className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-teal-100" aria-hidden="true" />
                )}
                {done ? (
                  <CircleCheck className="text-leaf shrink-0 relative z-10 bg-paper" size={24} />
                ) : current ? (
                  <CircleDot className="text-marigold-500 shrink-0 relative z-10 bg-paper" size={24} />
                ) : (
                  <Circle className="text-teal-200 shrink-0 relative z-10 bg-paper" size={24} />
                )}
                <div>
                  <p className={`font-semibold ${done || current ? "text-ink" : "text-ink/40"}`}>
                    {translatedLabel}
                  </p>
                  {s.date && <p className="text-xs text-ink/50">{s.date}</p>}
                </div>
              </li>
            );
          })}
        </ol>

        <div className="bg-leaf/10 border-2 border-leaf/30 rounded-card p-4 text-center">
          <p className="text-sm text-ink/70 mb-1">{t(lang, "doINeedToDo")}</p>
          <p className="font-bold text-leaf text-lg">🟢 {t(lang, "noActionNeeded")}</p>
        </div>

        <div className="flex flex-col gap-3">
          <Button full variant="secondary" onClick={() => navigate(`/track/${request.id}/explain`)}>
            {t(lang, "explainUnderReview")}
          </Button>
          <Button full variant="secondary" onClick={() => navigate(`/track/${request.id}/response`)}>
            {t(lang, "viewSampleResponse")}
          </Button>
          <Button full variant="ghost" onClick={() => navigate(`/track/${request.id}/appeal`)}>
            {t(lang, "noResponseYet")}
          </Button>
        </div>
      </div>
    </Shell>
  );
}
