import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import Shell from "../components/Shell";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";

type VerifyStep = "intro" | "choose" | "connect" | "input" | "processing" | "status";

export default function Verify() {
  const { lang, setVerified, setVerificationMethod } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<VerifyStep>("intro");
  const [chosenMethod, setChosenMethod] = useState<"digilocker" | "gov_id" | null>(null);

  // Form input fields (simulation data)
  const [fullName, setFullName] = useState(t(lang, "profileName"));
  const [dob, setDob] = useState("28 / 08 / 1995");
  const [citizenship, setCitizenship] = useState(t(lang, "citizenshipValue"));

  useEffect(() => {
    setFullName(t(lang, "profileName"));
    setCitizenship(t(lang, "citizenshipValue"));
  }, [lang]);

  function handleChooseMethod(method: "digilocker" | "gov_id") {
    setChosenMethod(method);
    setVerificationMethod(method);
    if (method === "digilocker") {
      setStep("connect");
    } else {
      setStep("input");
    }
  }

  function handleVerifyIdentity() {
    setStep("processing");
  }

  useEffect(() => {
    if (step === "processing") {
      const timer = setTimeout(() => {
        setVerified(true);
        setStep("status");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step, setVerified]);

  function handleBack() {
    if (step === "intro") {
      navigate({ pathname: "/language", search: searchParams.toString() });
    } else if (step === "choose") {
      setStep("intro");
    } else if (step === "connect") {
      setStep("choose");
    } else if (step === "input") {
      if (chosenMethod === "digilocker") {
        setStep("connect");
      } else {
        setStep("choose");
      }
    } else if (step === "status") {
      setStep("input");
    }
  }

  return (
    <Shell onBack={handleBack}>
      <div className="flex flex-col gap-6 pt-4 max-w-md mx-auto">
        {step === "intro" && (
          <div className="flex flex-col gap-6 text-center items-center">
            <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 shadow-card">
              <ShieldCheck size={32} />
            </div>
            <h1 className="font-display text-3xl font-semibold text-teal-900">
              {t(lang, "verifyIntroTitle")}
            </h1>
            <p className="text-base text-ink/80 leading-relaxed">
              {t(lang, "verifyIntroBody")}
            </p>
            <Button full onClick={() => setStep("choose")}>
              {t(lang, "verifyIntroButton")}
            </Button>
          </div>
        )}

        {step === "choose" && (
          <div className="flex flex-col gap-6">
            <h1 className="font-display text-3xl font-semibold text-teal-900 text-center">
              {t(lang, "verifyChooseTitle")}
            </h1>
            <p className="text-sm text-ink/60 text-center">
              {t(lang, "verifyChooseSub")}
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => handleChooseMethod("digilocker")}
                className="w-full text-left bg-white border-2 border-teal-100 hover:border-teal-500 rounded-card p-5 flex flex-col gap-1.5 shadow-card transition-colors min-h-[96px]"
              >
                <span className="font-semibold text-lg text-ink flex items-center gap-2">
                  {t(lang, "verifyChooseDigiLocker")}
                </span>
                <span className="text-xs text-ink/65">
                  {t(lang, "verifyChooseDigiLockerSub")}
                </span>
              </button>

              <button
                onClick={() => handleChooseMethod("gov_id")}
                className="w-full text-left bg-white border-2 border-teal-100 hover:border-teal-500 rounded-card p-5 flex flex-col gap-1.5 shadow-card transition-colors min-h-[96px]"
              >
                <span className="font-semibold text-lg text-ink flex items-center gap-2">
                  {t(lang, "verifyChooseGovId")}
                </span>
                <span className="text-xs text-ink/65">
                  {t(lang, "verifyChooseGovIdSub")}
                </span>
              </button>
            </div>
          </div>
        )}

        {step === "connect" && (
          <div className="flex flex-col gap-6 text-center items-center">
            <div className="font-display font-bold text-teal-600 text-3xl">DigiLocker</div>
            <div className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {t(lang, "verifyConnectSub")}
            </div>
            <h2 className="font-display text-2xl font-semibold text-teal-900 mt-2">
              {t(lang, "verifyConnectTitle")}
            </h2>
            <p className="text-base text-ink/80 leading-relaxed">
              {t(lang, "verifyConnectBody")}
            </p>
            <div className="w-full flex flex-col gap-3 mt-4">
              <Button full onClick={() => setStep("input")}>
                {t(lang, "verifyConnectButton")}
              </Button>
              <Button full variant="secondary" onClick={() => setStep("choose")}>
                {t(lang, "cancel")}
              </Button>
            </div>
          </div>
        )}

        {step === "input" && (
          <div className="flex flex-col gap-5">
            <div className="text-center">
              <div className="font-display font-bold text-teal-600 text-2xl mb-1">
                {chosenMethod === "digilocker" ? "DigiLocker Demo" : "Demo Verification"}
              </div>
              <h2 className="font-display text-2xl font-semibold text-teal-900">
                {t(lang, "verifyInputTitle")}
              </h2>
            </div>

            <div className="bg-white border-2 border-teal-100 rounded-card p-5 space-y-4 shadow-card">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-teal-700 uppercase tracking-wide">
                  {t(lang, "verifyInputName")}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-teal-150 p-2 text-ink font-medium focus-visible:outline-marigold-500 bg-teal-50/20"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-teal-700 uppercase tracking-wide">
                  {t(lang, "verifyInputDob")}
                </label>
                <input
                  type="text"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full rounded-lg border border-teal-150 p-2 text-ink font-medium focus-visible:outline-marigold-500 bg-teal-50/20"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-teal-700 uppercase tracking-wide">
                  {t(lang, "verifyInputCitizenship")}
                </label>
                <input
                  type="text"
                  value={citizenship}
                  onChange={(e) => setCitizenship(e.target.value)}
                  className="w-full rounded-lg border border-teal-150 p-2 text-ink font-medium focus-visible:outline-marigold-500 bg-teal-50/20"
                />
              </div>

              <p className="text-xs font-bold text-marigold-600 uppercase text-center pt-2">
                {t(lang, "demoData")}
              </p>
            </div>

            <Button full onClick={handleVerifyIdentity}>
              {t(lang, "verifyInputButton")}
            </Button>
          </div>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <Loader2 className="animate-spin text-teal-600" size={48} />
            <h2 className="text-xl font-semibold text-teal-900">
              {t(lang, "verifyProcessing")}
            </h2>
          </div>
        )}

        {step === "status" && (
          <div className="flex flex-col gap-6 items-center text-center">
            <div className="w-16 h-16 rounded-full bg-leaf/10 flex items-center justify-center text-leaf shadow-card">
              <CheckCircle2 size={32} />
            </div>
            <h1 className="font-display text-3xl font-semibold text-teal-900">
              {t(lang, "verifyStatusTitle")}
            </h1>

            <div className="bg-white border-2 border-teal-100 rounded-card p-5 w-full text-left space-y-3 shadow-card">
              <div className="flex justify-between items-center border-b border-teal-50 pb-2">
                <span className="text-sm text-ink/50">{t(lang, "verifyInputName")}</span>
                <span className="font-semibold text-ink">{fullName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-teal-50 pb-2">
                <span className="text-sm text-ink/50">{t(lang, "verifyInputCitizenship")}</span>
                <span className="font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase font-mono">
                  {citizenship}
                </span>
              </div>
              <div className="space-y-1.5 pt-1">
                <p className="text-sm text-leaf font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} /> {t(lang, "verifyStatusSuccess1")}
                </p>
                <p className="text-sm text-leaf font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} /> {t(lang, "verifyStatusSuccess2")}
                </p>
                <p className="text-sm text-leaf font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} /> {t(lang, "verifyStatusSuccess3")}
                </p>
              </div>
            </div>

            <p className="text-xs text-ink/60 bg-teal-50 rounded-lg px-4 py-3 leading-relaxed">
              {t(lang, "verifyStatusDisclaimer")}
            </p>

            <Button full onClick={() => navigate({ pathname: "/dashboard", search: searchParams.toString() })}>
              {t(lang, "continue")}
            </Button>
          </div>
        )}
      </div>
    </Shell>
  );
}
