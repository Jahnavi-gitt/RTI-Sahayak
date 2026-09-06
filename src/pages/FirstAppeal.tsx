import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Scale, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Download } from "lucide-react";
import Shell from "../components/Shell";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";
import type { AppealGround, FirstAppealData } from "../types";
import { generateAppealId, getAppealGrounds, type GroundOption } from "../mock/engine";
import { downloadReceiptPdf } from "../utils/pdfGenerator";
import { getLocalizedDepartmentName } from "../data/departments";

type AppealStep = "eligibility" | "grounds" | "statement" | "review" | "submitted";

export default function FirstAppeal() {
  const { lang, requests, addFirstAppeal, isEligibleForAppeal, currentUser } = useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const request = requests.find((r) => r.id === id);

  const [step, setStep] = useState<AppealStep>("eligibility");
  const [ground, setGround] = useState<AppealGround>("no_response");
  const [facts, setFacts] = useState("");
  const [prayer, setPrayer] = useState("");
  const [submittedAppeal, setSubmittedAppeal] = useState<FirstAppealData | null>(null);

  if (!request) {
    navigate("/dashboard");
    return null;
  }

  const eligible = isEligibleForAppeal(request);

  // FAA details derived from public authority
  const faaName = `First Appellate Authority (${request.authority.name})`;
  const faaDesignation = `Appellate Officer & Joint Secretary, ${request.authority.department}`;

  function handleGroundSelect(selectedGround: AppealGround) {
    setGround(selectedGround);
    if (selectedGround === "no_response" && !facts) {
      setFacts(`My RTI request (${request!.id}) was filed on ${new Date(request!.createdAt).toLocaleDateString("en-IN")}. Over 30 days have elapsed without any reply or information from the PIO.`);
      setPrayer("Direct the Public Information Officer to provide all requested documents and records immediately without delay or additional fee.");
    } else if (selectedGround === "incomplete" && !facts) {
      setFacts(`The PIO provided an incomplete response on ${request!.id}. Key information regarding processing dates and sanction orders was omitted.`);
      setPrayer("Direct the PIO to supply complete and verified records on all requested query points.");
    }
    setStep("statement");
  }

  function handleSubmitAppeal(e: React.FormEvent) {
    e.preventDefault();
    const appealId = generateAppealId();
    const appealRecord: FirstAppealData = {
      appealId,
      originalRequestId: request!.id,
      ground,
      groundLabel: t(lang, `appealGround${ground === "no_response" ? "NoResponse" : ground === "incomplete" ? "Incomplete" : ground === "rejected" ? "Rejected" : "Fee"}`),
      facts: facts.trim() || "No response received within statutory 30-day period.",
      prayer: prayer.trim() || "Direct PIO to provide complete records immediately.",
      filedDate: new Date().toISOString(),
      faaName,
      faaDesignation,
      feePaid: 0,
      status: "APPEAL_FILED"
    };

    addFirstAppeal(appealRecord);
    setSubmittedAppeal(appealRecord);
    setStep("submitted");
  }

  return (
    <Shell step="track" onBack={() => {
      if (step === "eligibility") navigate(`/track/${request.id}`);
      else if (step === "grounds") setStep("eligibility");
      else if (step === "statement") setStep("grounds");
      else if (step === "review") setStep("statement");
      else navigate(`/track/${request.id}`);
    }}>
      <div className="flex flex-col gap-6 pt-2 max-w-lg mx-auto">
        {/* Step 1: Eligibility & Information */}
        {step === "eligibility" && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 shadow-card shrink-0">
                <Scale size={24} />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-teal-900">{t(lang, "appealTitle")}</h1>
                <p className="text-xs text-ink/60">{t(lang, "appealSubtitle")}</p>
              </div>
            </div>

            {/* Eligibility Banner */}
            <div className={`p-4 rounded-card border-2 flex items-start gap-3 ${
              eligible ? "bg-leaf/10 border-leaf/30 text-teal-950" : "bg-marigold-50 border-marigold-200 text-teal-950"
            }`}>
              {eligible ? <CheckCircle2 className="text-leaf shrink-0 mt-0.5" size={20} /> : <AlertCircle className="text-marigold-600 shrink-0 mt-0.5" size={20} />}
              <div>
                <p className="font-bold text-sm">
                  {eligible ? t(lang, "appealEligibleNotice") : t(lang, "appealIneligibleNotice")}
                </p>
                <p className="text-xs text-ink/70 mt-1 leading-relaxed">
                  Application ID: <span className="font-mono font-bold">{request.id}</span> • Public Authority: <span className="font-bold">{request.authority.name}</span>
                </p>
              </div>
            </div>

            {/* Legal Guidance Card */}
            <div className="bg-white border-2 border-teal-100 rounded-card p-4 space-y-2.5 text-xs text-ink/80 shadow-card leading-relaxed">
              <p className="font-bold text-teal-900 text-sm flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-teal-600" /> {t(lang, "appealFrameworkTitle")}
              </p>
              <ul className="list-disc list-inside space-y-1 text-ink/70">
                <li>{t(lang, "appealFrameworkTimeline")}</li>
                <li>{t(lang, "appealFrameworkAuthority")}</li>
                <li>{t(lang, "appealFrameworkFee")}</li>
                <li>{t(lang, "appealFrameworkDisposal")}</li>
              </ul>
            </div>

            <Button full onClick={() => setStep("grounds")}>
              {t(lang, "continue")} →
            </Button>
          </div>
        )}

        {/* Step 2: Grounds Selection */}
        {step === "grounds" && (
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="font-display text-2xl font-bold text-teal-900">{t(lang, "appealGroundSelect")}</h1>
              <p className="text-xs text-ink/60 mt-1">{t(lang, "appealSubtitle")}</p>
            </div>

            <div className="flex flex-col gap-3">
              {getAppealGrounds(lang).map((g: GroundOption) => (
                <GroundButton
                  key={g.id}
                  selected={ground === g.id}
                  onClick={() => handleGroundSelect(g.id as AppealGround)}
                  label={g.label}
                  desc={g.description}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Statement & Relief */}
        {step === "statement" && (
          <form onSubmit={() => setStep("review")} className="flex flex-col gap-5">
            <div>
              <h1 className="font-display text-2xl font-bold text-teal-900">{t(lang, "appealTitle")}</h1>
              <p className="text-xs text-ink/60 mt-1">{t(lang, "appealSubtitle")}</p>
            </div>

            <div className="bg-white border-2 border-teal-100 rounded-card p-5 space-y-4 shadow-card">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-teal-700 uppercase tracking-wide">
                  {t(lang, "appealFactsLabel")}
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={t(lang, "appealFactsPlaceholder")}
                  value={facts}
                  onChange={(e) => setFacts(e.target.value)}
                  className="w-full rounded-lg border border-teal-150 p-2.5 text-sm text-ink focus-visible:outline-teal-500 bg-teal-50/20"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-teal-700 uppercase tracking-wide">
                  {t(lang, "appealPrayerLabel")}
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={t(lang, "appealPrayerPlaceholder")}
                  value={prayer}
                  onChange={(e) => setPrayer(e.target.value)}
                  className="w-full rounded-lg border border-teal-150 p-2.5 text-sm text-ink focus-visible:outline-teal-500 bg-teal-50/20"
                />
              </div>

              <div className="bg-teal-50 p-3 rounded-lg text-xs text-teal-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <ShieldCheck size={14} className="text-teal-700" /> {t(lang, "reviewAuthorityLabel")}
                </p>
                <p className="text-ink/80">{faaName}</p>
                <p className="text-ink/60">{faaDesignation}</p>
              </div>
            </div>

            <Button full type="submit">
              {t(lang, "continue")} →
            </Button>
          </form>
        )}

        {/* Step 4: Review Appeal */}
        {step === "review" && (
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="font-display text-2xl font-bold text-teal-900">{t(lang, "reviewTitle")}</h1>
              <p className="text-xs text-ink/60 mt-1">{t(lang, "appealSubtitle")}</p>
            </div>

            <div className="bg-white border-2 border-teal-100 rounded-card p-5 space-y-3.5 shadow-card text-sm">
              <div className="flex justify-between border-b border-teal-50 pb-2">
                <span className="text-ink/60">{t(lang, "requestId")}:</span>
                <span className="font-mono font-bold text-ink">{request.id}</span>
              </div>
              <div className="flex justify-between border-b border-teal-50 pb-2">
                <span className="text-ink/60">{t(lang, "reviewApplicantLabel")}:</span>
                <span className="font-bold text-ink">{currentUser?.name || t(lang, "profileName")}</span>
              </div>
              <div className="flex justify-between border-b border-teal-50 pb-2">
                <span className="text-ink/60">{t(lang, "reviewAuthorityLabel")}:</span>
                <span className="font-bold text-teal-800 text-right">{getLocalizedDepartmentName(request.authority, lang)}</span>
              </div>
              <div className="flex justify-between border-b border-teal-50 pb-2">
                <span className="text-ink/60">{t(lang, "appealGroundSelect")}:</span>
                <span className="font-bold text-teal-800 text-right">
                  {t(lang, `appealGround${ground === "no_response" ? "NoResponse" : ground === "incomplete" ? "Incomplete" : ground === "rejected" ? "Rejected" : "Fee"}`)}
                </span>
              </div>

              <div className="pt-1">
                <span className="text-xs font-bold uppercase text-teal-700 block mb-1">{t(lang, "appealPrayerLabel")}:</span>
                <p className="text-xs text-ink/80 bg-teal-50/50 p-2.5 rounded border border-teal-100 italic">
                  "{prayer}"
                </p>
              </div>
            </div>

            <Button full onClick={handleSubmitAppeal}>
              {t(lang, "appealSubmitBtn")}
            </Button>
          </div>
        )}

        {/* Step 5: Submitted Confirmation */}
        {step === "submitted" && submittedAppeal && (
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="w-16 h-16 rounded-full bg-leaf/15 flex items-center justify-center text-leaf shadow-card">
              <CheckCircle2 size={40} />
            </div>

            <div>
              <h1 className="font-display text-2xl font-bold text-teal-900">{t(lang, "appealSubmittedTitle")}</h1>
              <p className="text-xs text-ink/70 mt-1 leading-relaxed">{t(lang, "appealSubmittedBody")}</p>
            </div>

            <div className="bg-white border-2 border-teal-100 rounded-card p-5 w-full text-left space-y-2.5 shadow-card text-sm">
              <div className="flex justify-between items-center border-b border-teal-50 pb-2">
                <span className="text-ink/60">{t(lang, "requestId")}:</span>
                <span className="font-mono font-bold text-teal-700 text-base">{submittedAppeal.appealId}</span>
              </div>
              <div className="flex justify-between items-center border-b border-teal-50 pb-2">
                <span className="text-ink/60">{t(lang, "reviewAuthorityLabel")}:</span>
                <span className="font-bold text-ink text-right">{getLocalizedDepartmentName(request.authority, lang)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <Button full onClick={() => navigate(`/track/${request.id}`)}>
                {t(lang, "appealTrackBtn")}
              </Button>
              <Button full variant="secondary" onClick={() => downloadReceiptPdf(request, lang, currentUser?.name)}>
                <span className="inline-flex items-center gap-2">
                  <Download size={16} /> {t(lang, "downloadPdf")}
                </span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}

function GroundButton({
  selected,
  onClick,
  label,
  desc
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[64px] rounded-card border-2 transition-all text-left p-4 flex flex-col gap-1 shadow-sm ${
        selected
          ? "border-teal-600 bg-teal-50/80 text-teal-900 shadow-md"
          : "border-teal-100 bg-white text-ink hover:border-teal-400"
      }`}
    >
      <span className="font-bold text-base flex items-center justify-between">
        {label}
        <ArrowRight size={16} className={selected ? "text-teal-700" : "text-ink/40"} />
      </span>
      <span className="text-xs text-ink/60 leading-relaxed">{desc}</span>
    </button>
  );
}
