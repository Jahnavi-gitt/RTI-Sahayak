import { useNavigate } from "react-router-dom";
import { Landmark, ArrowRight, Scale } from "lucide-react";
import Shell from "../components/Shell";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";
import { formatPhoneNumber } from "../utils/security";
import { getLocalizedDepartmentName } from "../data/departments";

export default function Dashboard() {
  const { lang, requests, currentUser, isEligibleForAppeal } = useApp();
  const navigate = useNavigate();

  if (!currentUser) {
    navigate("/");
    return null;
  }

  // Calculate statistics
  const activeCount = requests.filter((r) => r.currentStatus !== "RESPONSE_RECEIVED" && r.currentStatus !== "APPEAL_DISPOSED").length;
  const responseCount = requests.filter((r) => r.currentStatus === "RESPONSE_RECEIVED").length;
  const appealCount = requests.filter((r) => r.currentStatus === "APPEAL_FILED" || r.currentStatus === "APPEAL_UNDER_REVIEW").length;

  return (
    <Shell step={undefined} hideChrome={false}>
      <div className="flex flex-col gap-6 pt-2">
        {/* Welcome Section */}
        <div className="bg-teal-50 border-2 border-teal-100 rounded-card p-5 shadow-sm">
          <h1 className="font-display text-2xl font-bold text-teal-900">
            {t(lang, "dashboardWelcome")}, {currentUser.name || t(lang, "profileName")}
          </h1>
          <p className="text-sm text-ink/70 mt-1">
            {formatPhoneNumber(currentUser.phone)} • {t(lang, "dashboardSubtitle")}
          </p>
        </div>

        {/* Primary CTA */}
        <Button full onClick={() => navigate("/describe")}>
          <span className="flex items-center justify-center gap-2 text-lg">
            {t(lang, "startNewRti")} <ArrowRight size={18} />
          </span>
        </Button>

        {/* Summary Counter Cards */}
        <div className="grid grid-cols-3 gap-3">
          <CounterCard
            title={t(lang, "activeRequests")}
            value={activeCount}
            color="text-teal-700"
            bg="bg-teal-50"
          />
          <CounterCard
            title={t(lang, "responsesReceived")}
            value={responseCount}
            color="text-leaf"
            bg="bg-leaf/10"
          />
          <CounterCard
            title={t(lang, "actionRequired")}
            value={appealCount}
            color="text-marigold-700"
            bg="bg-marigold-50"
          />
        </div>

        {/* Request History Section */}
        <div className="space-y-3.5">
          <h2 className="text-lg font-bold text-teal-900 uppercase tracking-wider">
            {t(lang, "myRequests")}
          </h2>

          {requests.length === 0 ? (
            <p className="text-sm text-ink/50 text-center py-6">
              {t(lang, "noRequests")}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {requests.map((req) => {
                const isResponse = req.currentStatus === "RESPONSE_RECEIVED";
                const isAppeal = req.currentStatus === "APPEAL_FILED" || req.currentStatus === "APPEAL_UNDER_REVIEW";
                const appealEligible = isEligibleForAppeal(req);

                return (
                  <div
                    key={req.id}
                    className="w-full bg-white border border-teal-100 hover:border-teal-400 rounded-card p-4 flex flex-col gap-2.5 shadow-card transition-colors"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-mono text-xs font-bold text-ink/50">{req.id}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                          isAppeal
                            ? "bg-purple-100 text-purple-800"
                            : isResponse
                            ? "bg-leaf/15 text-leaf"
                            : "bg-marigold-100 text-marigold-800"
                        }`}
                      >
                        {t(lang, `status_${req.currentStatus}`)}
                      </span>
                    </div>

                    <button
                      onClick={() => navigate(`/track/${req.id}`)}
                      className="text-left group"
                    >
                      <p className="font-bold text-teal-950 text-base line-clamp-1 group-hover:text-teal-700">
                        {req.rawProblem}
                      </p>
                      <p className="text-xs text-ink/60 flex items-center gap-1 mt-1">
                        <Landmark size={12} /> {getLocalizedDepartmentName(req.authority, lang)}
                      </p>
                    </button>

                    <div className="flex justify-between items-center text-xs text-ink/50 border-t border-teal-50 pt-2 mt-0.5">
                      <span>
                        {new Date(req.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric"
                        })}
                      </span>

                      <div className="flex items-center gap-3">
                        {appealEligible && (
                          <button
                            onClick={() => navigate(`/track/${req.id}/appeal`)}
                            className="text-marigold-700 font-bold hover:underline flex items-center gap-1"
                          >
                            <Scale size={12} /> {t(lang, "fileFirstAppeal")}
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/track/${req.id}`)}
                          className="text-teal-700 font-bold hover:underline"
                        >
                          {t(lang, "viewDetails")} →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

function CounterCard({
  title,
  value,
  color,
  bg,
}: {
  title: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className={`rounded-card p-4 flex flex-col items-center justify-center text-center shadow-card ${bg}`}>
      <span className="text-xs font-bold text-ink/60 line-clamp-1 leading-tight mb-1">{title}</span>
      <span className={`text-3xl font-display font-black ${color}`}>{value}</span>
    </div>
  );
}
