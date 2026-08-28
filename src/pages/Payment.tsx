import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldAlert, AlertCircle, CheckCircle } from "lucide-react";
import Shell from "../components/Shell";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";
import { buildStatusHistory, generateRequestId } from "../mock/engine";
import type { RtiRequest } from "../types";

type Phase = "idle" | "choose_outcome" | "processing" | "delayed" | "failed";

export default function Payment() {
  const { lang, draft, addRequest } = useApp();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("idle");
  const [method, setMethod] = useState<"upi" | "netbanking" | null>(null);

  function initiatePayment(m: "upi" | "netbanking") {
    setMethod(m);
    setPhase("choose_outcome");
  }

  function simulateOutcome(success: boolean) {
    if (!success) {
      setPhase("failed");
      return;
    }

    setPhase("processing");
    const willDelay = method === "upi";
    setTimeout(() => {
      if (willDelay) {
        setPhase("delayed");
        setTimeout(() => finish(), 1800);
      } else {
        finish();
      }
    }, 1400);
  }

  function finish() {
    const id = generateRequestId();
    const request: RtiRequest = {
      id,
      rawProblem: draft.rawProblem,
      understanding: draft.understanding!,
      questions: draft.questions,
      authority: draft.authority!,
      createdAt: new Date().toISOString(),
      statusHistory: buildStatusHistory(),
      currentStatus: "SUBMITTED",
    };
    addRequest(request);
    navigate(`/submitted/${id}`);
  }

  function retry() {
    setPhase("idle");
    setMethod(null);
  }

  return (
    <Shell step="check" onBack={() => {
      if (phase === "choose_outcome") {
        setPhase("idle");
      } else {
        navigate("/review");
      }
    }}>
      <div className="flex flex-col gap-6 pt-4">
        <h1 className="font-display text-3xl font-semibold text-teal-900">{t(lang, "paymentTitle")}</h1>

        <div className="bg-white border-2 border-marigold-200 rounded-card p-6 text-center">
          <p className="text-4xl font-display font-bold text-teal-900">₹10</p>
          <p className="text-xs font-bold text-marigold-600 mt-2 uppercase tracking-wide">
            {t(lang, "demoPaymentNote")}
          </p>
        </div>

        {phase === "idle" && (
          <div className="flex flex-col gap-3">
            <Button full onClick={() => initiatePayment("upi")}>
              {t(lang, "mockUpi")}
            </Button>
            <Button full variant="secondary" onClick={() => initiatePayment("netbanking")}>
              {t(lang, "mockNetBanking")}
            </Button>
          </div>
        )}

        {phase === "choose_outcome" && (
          <div className="flex flex-col gap-4 text-center items-center">
            <h2 className="font-display text-xl font-semibold text-teal-900">Simulate Payment Outcome</h2>
            <p className="text-sm text-ink/65 max-w-xs leading-relaxed">
              Verify how the application responds to a successful transaction or a failed transaction.
            </p>
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={() => simulateOutcome(true)}
                className="w-full min-h-[52px] px-6 rounded-card font-body font-semibold text-[17px] bg-leaf text-white hover:bg-leaf/90 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} /> Simulate Payment Success
              </button>
              <button
                onClick={() => simulateOutcome(false)}
                className="w-full min-h-[52px] px-6 rounded-card font-body font-semibold text-[17px] bg-brick text-white hover:bg-brick/90 transition-colors flex items-center justify-center gap-2"
              >
                <AlertCircle size={18} /> Simulate Payment Failure
              </button>
            </div>
          </div>
        )}

        {phase === "processing" && (
          <div className="flex flex-col items-center gap-3 py-8 text-ink/70">
            <Loader2 className="animate-spin text-teal-600" size={32} />
            <p>{t(lang, "paymentProcessing")} {method === "upi" ? "UPI" : "net banking"}…</p>
          </div>
        )}

        {phase === "delayed" && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <ShieldAlert className="text-marigold-500" size={32} />
            <p className="font-semibold text-ink">{t(lang, "paymentDelayedTitle")}</p>
            <p className="text-sm text-ink/60">{t(lang, "paymentDelayedSub")}</p>
            <Loader2 className="animate-spin text-teal-600 mt-2" size={22} />
          </div>
        )}

        {phase === "failed" && (
          <div className="flex flex-col gap-4 text-center items-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-full bg-brick/10 flex items-center justify-center text-brick shadow-card">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="font-bold text-lg text-ink">{t(lang, "paymentFailedTitle")}</p>
              <p className="text-sm text-ink/60 mt-1">{t(lang, "paymentFailedSub")}</p>
            </div>
            <Button full onClick={retry} className="mt-2">
              {t(lang, "paymentTryAgain")}
            </Button>
          </div>
        )}

        <p className="text-xs text-ink/50 text-center leading-relaxed">
          {t(lang, "paymentSecurityNote")}
        </p>
      </div>
    </Shell>
  );
}
