import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Keyboard,
  Mic,
  Printer,
  Volume2,
  ArrowLeft,
  ShieldCheck,
  CheckCircle,
  FileText,
  Search,
  Upload,
  AlertCircle,
  Clock,
  Info,
  Shield,
  Loader2
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { LANG_LABELS, t } from "../../i18n/strings";
import type { Lang, RtiQuestion, Authority, UnderstandResult } from "../../types";
import VoiceCapture from "../../components/VoiceCapture";
import { understandProblem, generateRtiQuestions, findAuthorities } from "../../services/ai";
import { generateRequestId, buildStatusHistory } from "../../mock/engine";

type KioskStep =
  | "welcome"
  | "language"
  | "verify_intro"
  | "verify_choose"
  | "verify_connect"
  | "verify_input"
  | "verify_processing"
  | "verify_status"
  | "input_method"
  | "capture"
  | "confirm_heard"
  | "understanding"
  | "suitability"
  | "questions"
  | "documents_choice"
  | "digilocker_connect"
  | "digilocker_auth"
  | "digilocker_docs"
  | "upload_pdf"
  | "documents_attached"
  | "authority"
  | "review"
  | "payment_choose"
  | "payment_processing"
  | "payment_delayed"
  | "payment_failed"
  | "submitted"
  | "tracking"
  | "explain_status";

const TIMEOUT_WARNING_MS = 75_000; // 75 seconds warning
const TIMEOUT_RESET_MS = 90_000;    // 90 seconds total timeout
const LOCALE_MAP: Record<string, string> = {
  en: "en-IN",
  ta: "ta-IN",
  hi: "hi-IN",
  te: "te-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  bn: "bn-IN",
  mr: "mr-IN"
};

export default function Kiosk() {
  const {
    lang,
    setLang,
    draft,
    updateDraft,
    resetDraft,
    attachedDocs,
    setAttachedDocs,
    verified,
    setVerified,
    setVerificationMethod,
    addRequest
  } = useApp();
  
  const navigate = useNavigate();
  const [step, setStep] = useState<KioskStep>("welcome");
  const [history, setHistory] = useState<KioskStep[]>([]);
  const [heard, setHeard] = useState("");
  const [understanding, setUnderstanding] = useState<UnderstandResult | null>(null);
  const [questions, setQuestions] = useState<RtiQuestion[]>([]);
  const [authoritiesList, setAuthoritiesList] = useState<Authority[]>([]);
  const [selectedAuthority, setSelectedAuthority] = useState<Authority | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Verification Simulation details
  const [fullName, setFullName] = useState(t(lang, "profileName"));
  const [dob, setDob] = useState("28 / 08 / 1995");
  const [citizenship, setCitizenship] = useState(t(lang, "citizenshipValue"));

  useEffect(() => {
    setFullName(t(lang, "profileName"));
    setCitizenship(t(lang, "citizenshipValue"));
  }, [lang]);

  // Payment states
  const [payMethod, setPayMethod] = useState<"upi" | "netbanking" | null>(null);
  const [requestId, setRequestId] = useState("");
  const [isReceiptPrinting, setIsReceiptPrinting] = useState(false);
  const [receiptPrinted, setReceiptPrinted] = useState(false);

  // Inactivity timeout states
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const timerWarningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Document states
  const [selectedDigiDocs, setSelectedDigiDocs] = useState<string[]>([]);
  const [uploadedPDFName, setUploadedPDFName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const speakText = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const targetLang = LOCALE_MAP[lang] ?? "en-IN";
    u.lang = targetLang;
    u.rate = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find((v) => {
      const vLang = v.lang.toLowerCase().replace("_", "-");
      const tLang = targetLang.toLowerCase();
      return vLang === tLang || vLang.startsWith(tLang.split("-")[0]);
    });
    if (matchedVoice) {
      u.voice = matchedVoice;
    }

    window.speechSynthesis.speak(u);
  }, [lang]);

  const resetSession = useCallback(() => {
    resetDraft();
    setStep("welcome");
    setHistory([]);
    setHeard("");
    setUnderstanding(null);
    setQuestions([]);
    setAuthoritiesList([]);
    setSelectedAuthority(null);
    setSearchQuery("");
    setPayMethod(null);
    setRequestId("");
    setIsReceiptPrinting(false);
    setReceiptPrinted(false);
    setSelectedDigiDocs([]);
    setUploadedPDFName(null);
    setUploadError(null);
    setShowTimeoutWarning(false);
    window.speechSynthesis.cancel();
  }, [resetDraft]);

  const startInactivityTimers = useCallback(() => {
    if (timerWarningRef.current) clearTimeout(timerWarningRef.current);
    if (timerResetRef.current) clearTimeout(timerResetRef.current);

    if (step === "welcome") return;

    timerWarningRef.current = setTimeout(() => {
      setShowTimeoutWarning(true);
      speakText("Your session will end soon. Do you need more time?");
    }, TIMEOUT_WARNING_MS);

    timerResetRef.current = setTimeout(() => {
      resetSession();
    }, TIMEOUT_RESET_MS);
  }, [step, resetSession, speakText]);

  useEffect(() => {
    startInactivityTimers();
    const handleActivity = () => {
      if (!showTimeoutWarning) {
        startInactivityTimers();
      }
    };

    window.addEventListener("click", handleActivity);
    window.addEventListener("keydown", handleActivity);
    return () => {
      if (timerWarningRef.current) clearTimeout(timerWarningRef.current);
      if (timerResetRef.current) clearTimeout(timerResetRef.current);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, [startInactivityTimers, showTimeoutWarning]);

  const handleContinueSession = () => {
    setShowTimeoutWarning(false);
    startInactivityTimers();
  };

  const transitionTo = (nextStep: KioskStep) => {
    setHistory((prev) => [...prev, step]);
    setStep(nextStep);
  };

  const handleBack = () => {
    if (history.length > 0) {
      const prevStep = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      setStep(prevStep);
    } else {
      resetSession();
    }
  };

  const toggleDigiDoc = (doc: string) => {
    setSelectedDigiDocs((prev) =>
      prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]
    );
  };

  async function processInputText(textVal: string) {
    if (!textVal.trim()) return;
    transitionTo("understanding");
    const u = await understandProblem(textVal.trim());
    setUnderstanding(u);
    updateDraft({ rawProblem: textVal.trim(), understanding: u });
    transitionTo("suitability");
  }

  async function generateQuestionsForKiosk() {
    if (!understanding) return;
    transitionTo("understanding");
    const qs = await generateRtiQuestions(understanding, draft.rawProblem);
    setQuestions(qs);
    updateDraft({ questions: qs });
    transitionTo("questions");
  }

  async function searchKioskAuthorities(q: string) {
    const list = await findAuthorities(q);
    setAuthoritiesList(list);
  }

  function handleVerifyChoose(method: "digilocker" | "gov_id") {
    setVerificationMethod(method);
    if (method === "digilocker") {
      transitionTo("verify_connect");
    } else {
      transitionTo("verify_input");
    }
  }

  function handleVerifyIdentity() {
    transitionTo("verify_processing");
  }

  useEffect(() => {
    if (step === "verify_processing") {
      const timer = setTimeout(() => {
        setVerified(true);
        transitionTo("verify_status");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  function handleDigiDocsSubmit() {
    if (selectedDigiDocs.length === 0) return;
    setAttachedDocs(selectedDigiDocs);
    transitionTo("documents_attached");
  }

  function handlePDFUploadSimulation(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploadedPDFName(null);

    if (file.type !== "application/pdf") {
      setUploadError("We couldn't add that file. Please choose a PDF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      const sizeMb = file.size / (1024 * 1024);
      setUploadError(`This PDF is ${sizeMb.toFixed(1)} MB. Please choose a file smaller than 5 MB.`);
      return;
    }

    setUploadedPDFName(file.name);
    setAttachedDocs([file.name]);
  }

  function handleKioskConfirmAuthority(auth: Authority) {
    setSelectedAuthority(auth);
    updateDraft({ authority: auth });
    transitionTo("review");
  }

  function handlePaymentInit(methodVal: "upi" | "netbanking") {
    setPayMethod(methodVal);
  }

  function handleKioskPaymentOutcome(success: boolean) {
    if (!success) {
      setPayMethod(null);
      transitionTo("payment_failed");
      return;
    }

    transitionTo("payment_processing");
    const willDelay = payMethod === "upi";
    setTimeout(() => {
      if (willDelay) {
        transitionTo("payment_delayed");
        setTimeout(() => finishKioskSubmission(), 1800);
      } else {
        finishKioskSubmission();
      }
    }, 1400);
  }

  function finishKioskSubmission() {
    const id = generateRequestId();
    setRequestId(id);
    setPayMethod(null);
    
    // Add dummy request to state
    const request = {
      id,
      rawProblem: draft.rawProblem,
      understanding: draft.understanding!,
      questions: draft.questions,
      authority: draft.authority!,
      createdAt: new Date().toISOString(),
      statusHistory: buildStatusHistory(),
      currentStatus: "SUBMITTED" as const
    };
    addRequest(request);
    transitionTo("submitted");
  }

  function printReceipt() {
    setIsReceiptPrinting(true);
    setTimeout(() => {
      setIsReceiptPrinting(false);
      setReceiptPrinted(true);
    }, 1500);
  }

  // Generate page text readout for TTS
  function getSpeakableText() {
    switch (step) {
      case "welcome":
        return `${t(lang, "appName")}. ${t(lang, "tagline")}`;
      case "verify_intro":
        return `${t(lang, "verifyIntroTitle")}. ${t(lang, "verifyIntroBody")}`;
      case "verify_status":
        return `${t(lang, "verifyStatusTitle")}. ${fullName}, ${citizenship}. ${t(lang, "verifyStatusSuccess3")}`;
      case "input_method":
        return `${t(lang, "kioskInputMethodTitle")}. ${t(lang, "kioskInputMethodSub")}`;
      case "suitability":
        return `${t(lang, "suitabilityTitle")}. ${understanding?.suitability_reason || ""}`;
      case "questions":
        return `${t(lang, "clearRequest")}. Here are the questions we will ask. ${questions.map((q) => q.text).join(". ")}`;
      case "review":
        return `${t(lang, "reviewTitle")}. Public Authority is ${selectedAuthority?.name || ""}. Fee is 10 Rupees.`;
      case "explain_status":
        return `Official status: Transferred under Section 6 3. What happened? Your request was transferred. What does it mean? Another authority may hold the information you requested.`;
      default:
        return "Please look at the screen to choose your next step.";
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-teal-950 text-white font-body select-none">
      {/* Permanent Header for Touch Assist Kiosk Navigation */}
      {step !== "welcome" && (
        <header className="border-b border-white/10 bg-teal-950/80 backdrop-blur sticky top-0 z-20">
          <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleBack}
                aria-label={t(lang, "back")}
                className="min-h-[52px] sm:min-h-[56px] min-w-[52px] sm:min-w-[56px] bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 active:scale-95"
              >
                <ArrowLeft size={22} />
              </button>
              <button
                onClick={resetSession}
                className="min-h-[52px] sm:min-h-[56px] px-3 sm:px-5 bg-white/10 rounded-full flex items-center gap-2 hover:bg-white/20 active:scale-95"
              >
                <Home size={18} />
                <span className="font-semibold hidden sm:inline">{t(lang, "home")}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => speakText(getSpeakableText())}
                className="min-h-[52px] sm:min-h-[56px] px-3 sm:px-5 bg-white/10 rounded-full flex items-center gap-2 hover:bg-white/20 text-marigold-400 font-bold active:scale-95"
              >
                <Volume2 size={20} />
                <span className="hidden sm:inline">{t(lang, "listen")}</span>
              </button>

              <button
                onClick={() => transitionTo("language")}
                className="min-h-[52px] sm:min-h-[56px] px-3 sm:px-5 bg-white/10 rounded-full flex items-center gap-2 hover:bg-white/20 font-bold active:scale-95"
              >
                <span>{LANG_LABELS[lang].split(" — ")[0]}</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Touch Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-10 flex flex-col items-center justify-center">
        {step === "welcome" && (
          <div className="flex flex-col items-center text-center gap-8 max-w-xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-marigold-500 text-teal-900 px-4 py-1.5 rounded-full">
              {t(lang, "independentNotice")}
            </span>

            <div className="w-20 h-20 rounded-2xl bg-white text-teal-900 flex items-center justify-center font-display text-5xl font-black shadow-lg">
              ?
            </div>

            <h1 className="font-display text-5xl sm:text-6xl font-bold leading-tight">
              {t(lang, "appName")}
            </h1>

            <p className="text-xl sm:text-2xl text-teal-100 max-w-md">
              “{t(lang, "tagline")}”
            </p>

            <div className="w-full flex flex-col gap-4 mt-4">
              <button
                onClick={() => transitionTo("verify_intro")}
                className="min-h-[84px] w-full rounded-2xl bg-marigold-500 hover:bg-marigold-400 text-teal-950 text-2xl font-bold flex items-center justify-center gap-3 shadow-md active:scale-95"
              >
                {t(lang, "kioskStartJourney")}
              </button>

              <button
                onClick={() => transitionTo("language")}
                className="min-h-[72px] w-full rounded-2xl border-3 border-white/30 hover:border-white/50 text-white text-xl font-bold transition-all active:scale-95"
              >
                {t(lang, "kioskChooseLang")}
              </button>

              <button
                onClick={() => navigate("/")}
                className="text-teal-300 underline font-semibold text-lg py-2"
              >
                {t(lang, "kioskExit")}
              </button>
            </div>
          </div>
        )}

        {step === "language" && (
          <div className="w-full max-w-2xl flex flex-col gap-6 text-center">
            <h1 className="font-display text-4xl font-bold">{t(lang, "shellSelectLanguage")}</h1>
            <p className="text-teal-100 text-lg">{t(lang, "kioskSelectLangSub")}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setLang(l);
                    if (history[history.length - 1] === "welcome" || history.length === 0) {
                      transitionTo("verify_intro");
                    } else {
                      handleBack();
                    }
                  }}
                  className={`min-h-[72px] rounded-2xl border-2 p-4 text-center font-semibold text-xl transition-all ${
                    lang === l
                      ? "bg-marigold-500 border-marigold-500 text-teal-900 shadow-md font-bold"
                      : "bg-white/5 border-white/10 hover:bg-white/10 text-white"
                  }`}
                >
                  {LANG_LABELS[l]}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "verify_intro" && (
          <div className="flex flex-col gap-6 text-center items-center max-w-lg">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-marigold-400 shadow-md">
              <ShieldCheck size={36} />
            </div>
            <h1 className="font-display text-4xl font-bold">{t(lang, "verifyIntroTitle")}</h1>
            <p className="text-xl text-teal-100 leading-relaxed font-medium">
              {t(lang, "verifyIntroBody")}
            </p>
            <button
              onClick={() => transitionTo("verify_choose")}
              className="w-full min-h-[76px] rounded-2xl bg-marigold-500 hover:bg-marigold-400 text-teal-950 text-2xl font-bold mt-4 shadow-md active:scale-95"
            >
              {t(lang, "verifyIntroButton")}
            </button>
          </div>
        )}

        {step === "verify_choose" && (
          <div className="flex flex-col gap-6 w-full max-w-xl">
            <h1 className="font-display text-4xl font-bold text-center">{t(lang, "verifyChooseTitle")}</h1>
            <p className="text-teal-100 text-lg text-center font-medium">
              {t(lang, "verifyChooseSub")}
            </p>
            <div className="flex flex-col gap-4 mt-2">
              <button
                onClick={() => handleVerifyChoose("digilocker")}
                className="w-full text-left bg-white/5 border-2 border-white/10 hover:border-white/30 rounded-2xl p-5 flex flex-col gap-2 transition-all min-h-[108px] active:scale-95"
              >
                <span className="font-bold text-xl text-marigold-400">{t(lang, "verifyChooseDigiLocker")}</span>
                <span className="text-sm text-teal-100/80">{t(lang, "verifyChooseDigiLockerSub")}</span>
              </button>

              <button
                onClick={() => handleVerifyChoose("gov_id")}
                className="w-full text-left bg-white/5 border-2 border-white/10 hover:border-white/30 rounded-2xl p-5 flex flex-col gap-2 transition-all min-h-[108px] active:scale-95"
              >
                <span className="font-bold text-xl text-marigold-400">{t(lang, "verifyChooseGovId")}</span>
                <span className="text-sm text-teal-100/80">{t(lang, "verifyChooseGovIdSub")}</span>
              </button>
            </div>
          </div>
        )}

        {step === "verify_connect" && (
          <div className="flex flex-col gap-6 max-w-md mx-auto text-center items-center">
            <div className="font-display font-bold text-marigold-400 text-3xl">DigiLocker</div>
            <div className="bg-white/10 text-white px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {t(lang, "verifyConnectSub")}
            </div>
            <h2 className="font-display text-2xl font-bold text-white mt-2">
              {t(lang, "verifyConnectTitle")}
            </h2>
            <p className="text-base text-teal-100 leading-relaxed">
              {t(lang, "verifyConnectBody")}
            </p>
            <div className="w-full flex flex-col gap-3 mt-4">
              <button
                onClick={() => transitionTo("verify_input")}
                className="w-full min-h-[72px] rounded-2xl bg-marigold-500 hover:bg-marigold-400 text-teal-955 text-xl font-bold active:scale-95"
              >
                {t(lang, "verifyConnectButton")}
              </button>
              <button
                onClick={() => transitionTo("verify_choose")}
                className="w-full min-h-[72px] rounded-2xl border-2 border-white/20 hover:bg-white/10 text-white text-lg font-bold"
              >
                {t(lang, "cancel")}
              </button>
            </div>
          </div>
        )}

        {step === "verify_input" && (
          <div className="flex flex-col gap-5 w-full max-w-md">
            <div className="text-center">
              <div className="font-display font-bold text-marigold-400 text-2xl mb-1">
                {t(lang, "verifyInputTitle")}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-marigold-400 uppercase tracking-wide">
                  {t(lang, "verifyInputName")}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl p-3 text-lg text-teal-950 font-bold bg-white focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-marigold-400 uppercase tracking-wide">
                  {t(lang, "verifyInputDob")}
                </label>
                <input
                  type="text"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full rounded-xl p-3 text-lg text-teal-950 font-bold bg-white focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-marigold-400 uppercase tracking-wide">
                  {t(lang, "verifyInputCitizenship")}
                </label>
                <input
                  type="text"
                  value={citizenship}
                  onChange={(e) => setCitizenship(e.target.value)}
                  className="w-full rounded-xl p-3 text-lg text-teal-950 font-bold bg-white focus:outline-none"
                />
              </div>

              <p className="text-xs font-bold text-marigold-400 uppercase text-center pt-2">
                {t(lang, "demoData")}
              </p>
            </div>

            <button
              onClick={handleVerifyIdentity}
              className="w-full min-h-[76px] rounded-2xl bg-marigold-500 hover:bg-marigold-400 text-teal-950 text-2xl font-bold shadow-md active:scale-95"
            >
              {t(lang, "verifyInputButton")}
            </button>
          </div>
        )}

        {step === "verify_processing" && (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <Loader2 className="animate-spin text-marigold-400" size={48} />
            <h2 className="text-2xl font-semibold text-white">
              {t(lang, "verifyProcessing")}
            </h2>
          </div>
        )}

        {step === "verify_status" && (
          <div className="flex flex-col gap-6 items-center text-center w-full max-w-md">
            <div className="w-16 h-16 rounded-full bg-leaf/20 flex items-center justify-center text-leaf border border-leaf/30 shadow-md">
              <CheckCircle size={36} />
            </div>
            <h1 className="font-display text-4xl font-bold text-white">{t(lang, "verifyStatusTitle")}</h1>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full text-left space-y-4 shadow-md">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-teal-100/70 text-base">{t(lang, "verifyInputName")}</span>
                <span className="font-bold text-lg text-white">{fullName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-teal-100/70 text-base">{t(lang, "verifyInputCitizenship")}</span>
                <span className="font-bold text-teal-900 bg-marigold-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider font-mono">
                  {citizenship}
                </span>
              </div>
              <div className="space-y-2.5 pt-2">
                <p className="text-base text-leaf font-semibold flex items-center gap-2">
                  ✓ {t(lang, "verifyStatusSuccess1")}
                </p>
                <p className="text-base text-leaf font-semibold flex items-center gap-2">
                  ✓ {t(lang, "verifyStatusSuccess2")}
                </p>
                <p className="text-base text-leaf font-semibold flex items-center gap-2">
                  ✓ {t(lang, "verifyStatusSuccess3")}
                </p>
              </div>
            </div>

            <p className="text-sm text-teal-100/75 bg-teal-950/40 rounded-xl px-4 py-3 leading-relaxed border border-teal-800/30">
              {t(lang, "verifyStatusDisclaimer")}
            </p>

            <button
              onClick={() => transitionTo("input_method")}
              className="w-full min-h-[76px] rounded-2xl bg-marigold-500 hover:bg-marigold-400 text-teal-955 text-2xl font-bold mt-2 shadow-md"
            >
              {t(lang, "continue")}
            </button>
          </div>
        )}

        {step === "input_method" && (
          <div className="flex flex-col gap-6 w-full max-w-xl text-center">
            <h1 className="font-display text-4xl font-bold">{t(lang, "kioskInputMethodTitle")}</h1>
            <p className="text-teal-100 text-lg">{t(lang, "kioskInputMethodSub")}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <button
                onClick={() => transitionTo("capture")}
                className="min-h-[140px] rounded-2xl bg-white/5 border-2 border-white/10 hover:border-white/30 flex flex-col items-center justify-center gap-3 active:scale-95"
              >
                <Mic size={36} className="text-marigold-400" />
                <span className="text-xl font-bold">{t(lang, "kioskWelcomeSpeak")}</span>
              </button>

              <button
                onClick={() => transitionTo("capture")}
                className="min-h-[140px] rounded-2xl bg-white/5 border-2 border-white/10 hover:border-white/30 flex flex-col items-center justify-center gap-3 active:scale-95"
              >
                <Keyboard size={36} className="text-marigold-400" />
                <span className="text-xl font-bold">{t(lang, "kioskWelcomeType")}</span>
              </button>
            </div>
          </div>
        )}

        {step === "capture" && (
          <div className="w-full max-w-xl flex flex-col gap-6">
            <h1 className="font-display text-3xl font-bold text-center">{t(lang, "screen2Title")}</h1>
            
            <VoiceCapture
              label={t(lang, "kioskSpeakStart")}
              listeningLabel={t(lang, "kioskSpeakListening")}
              onResult={(spoken) => {
                setHeard(spoken);
                transitionTo("confirm_heard");
              }}
            />

            <div className="flex flex-col gap-2">
              <label htmlFor="kiosk-text" className="text-teal-100 font-semibold">{t(lang, "speak")}:</label>
              <textarea
                id="kiosk-text"
                value={heard}
                onChange={(e) => setHeard(e.target.value)}
                placeholder={t(lang, "kioskTypePlaceholder")}
                rows={4}
                className="w-full rounded-2xl p-4 text-xl text-teal-950 font-medium focus-visible:outline-marigold-400 bg-white"
              />
            </div>

            <p className="text-xs text-teal-100/60 bg-teal-950/45 rounded-xl px-4 py-3 leading-relaxed border border-teal-800/30">
              {t(lang, "sensitiveWarning")}
            </p>

            {heard.trim().length >= 5 && (
              <button
                onClick={() => processInputText(heard)}
                className="min-h-[76px] rounded-2xl bg-marigold-500 hover:bg-marigold-400 text-teal-955 text-2xl font-bold shadow-md active:scale-95"
              >
                {t(lang, "continue")}
              </button>
            )}
          </div>
        )}

        {step === "confirm_heard" && (
          <div className="w-full max-w-lg flex flex-col gap-6 text-center">
            <p className="text-2xl text-teal-100">{t(lang, "kioskWeHeard")}</p>
            <p className="font-display text-3xl font-bold italic text-marigold-400 bg-teal-950/50 p-6 rounded-2xl border border-teal-800">
              “{heard}”
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <button
                onClick={() => processInputText(heard)}
                className="flex-1 min-h-[76px] rounded-2xl bg-marigold-500 hover:bg-marigold-400 text-teal-955 text-2xl font-bold shadow-md active:scale-95"
              >
                {t(lang, "kioskYesContinue")}
              </button>
              <button
                onClick={() => {
                  setHeard("");
                  transitionTo("capture");
                }}
                className="flex-1 min-h-[76px] rounded-2xl border-3 border-white/30 hover:border-white/50 text-white text-xl font-bold active:scale-95"
              >
                {t(lang, "kioskTryAgain")}
              </button>
            </div>
          </div>
        )}

        {step === "understanding" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="animate-spin text-marigold-400"><Clock size={48} /></span>
            <h1 className="text-3xl font-semibold">{t(lang, "turningIntoQuestions")}</h1>
            <p className="text-teal-100 text-lg">{t(lang, "readingStatus")}</p>
          </div>
        )}

        {step === "suitability" && understanding && (
          <div className="w-full max-w-xl flex flex-col gap-6">
            <h1 className="font-display text-3xl font-bold text-center">{t(lang, "suitabilityTitle")}</h1>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex gap-4 items-start shadow-md">
              <Info className="text-marigold-400 shrink-0 mt-0.5" size={28} />
              <div>
                <p className="font-bold text-xl text-marigold-400 uppercase tracking-wide">
                  {understanding.rti_suitability === "likely" ? t(lang, "suitabilityLikelyLabel") : t(lang, "suitabilityUnlikelyLabel")}
                </p>
                <p className="text-white text-lg mt-2 leading-relaxed">{understanding.suitability_reason}</p>
              </div>
            </div>

            <p className="text-xs text-teal-100/60 italic text-center">{t(lang, "generalGuidance")}</p>

            <button
              onClick={generateQuestionsForKiosk}
              className="w-full min-h-[76px] rounded-2xl bg-marigold-500 hover:bg-marigold-400 text-teal-955 text-2xl font-bold shadow-md mt-2 active:scale-95"
            >
              {t(lang, "continue")}
            </button>
          </div>
        )}

        {step === "questions" && (
          <div className="w-full max-w-2xl flex flex-col gap-6">
            <h1 className="font-display text-3xl font-bold text-center">{t(lang, "clearRequest")}</h1>
            
            <div className="bg-teal-950/40 border border-teal-800/40 p-4 rounded-2xl">
              <span className="text-xs font-bold text-teal-300 block uppercase tracking-wider mb-1">{t(lang, "yourWords")}</span>
              <p className="italic text-teal-100">“{draft.rawProblem}”</p>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-marigold-400 block uppercase tracking-wider">{t(lang, "heroTitle")}</span>
              <ol className="flex flex-col gap-3">
                {questions.map((q, idx) => (
                  <li
                    key={q.id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-5 flex gap-4 items-start shadow-md text-lg leading-relaxed"
                  >
                    <span className="font-display font-black text-marigold-400 text-xl">{idx + 1}</span>
                    <span>{q.text}</span>
                  </li>
                ))}
              </ol>
            </div>

            <button
              onClick={() => transitionTo("documents_choice")}
              className="w-full min-h-[76px] rounded-2xl bg-marigold-500 hover:bg-marigold-400 text-teal-955 text-2xl font-bold shadow-md mt-3 active:scale-95"
            >
              {t(lang, "confirm")}
            </button>
          </div>
        )}

        {step === "documents_choice" && (
          <div className="w-full max-w-xl flex flex-col gap-6 text-center">
            <h1 className="font-display text-3xl font-bold">{t(lang, "docsChoiceTitle")}</h1>
            <p className="text-teal-100 text-lg font-medium">{t(lang, "docsChoiceSub")}</p>

            <div className="grid grid-cols-1 gap-4 mt-2">
              <button
                onClick={() => {
                  if (verified) {
                    transitionTo("digilocker_docs");
                  } else {
                    transitionTo("digilocker_connect");
                  }
                }}
                className="w-full text-left bg-white/5 border-2 border-white/10 hover:border-white/30 rounded-2xl p-5 flex items-start gap-4 active:scale-95"
              >
                <Shield size={28} className="text-marigold-400 mt-1 shrink-0" />
                <div>
                  <span className="font-bold text-xl block">{t(lang, "docsChoiceDigiLocker")}</span>
                  <span className="text-sm text-teal-100/80">{t(lang, "docsChoiceDigiLockerSub")}</span>
                </div>
              </button>

              <button
                onClick={() => transitionTo("upload_pdf")}
                className="w-full text-left bg-white/5 border-2 border-white/10 hover:border-white/30 rounded-2xl p-5 flex items-start gap-4 active:scale-95"
              >
                <Upload size={28} className="text-marigold-400 mt-1 shrink-0" />
                <div>
                  <span className="font-bold text-xl block">{t(lang, "docsChoiceUpload")}</span>
                  <span className="text-sm text-teal-100/80">{t(lang, "docsChoiceUploadSub")}</span>
                </div>
              </button>
            </div>

            <button
              onClick={() => transitionTo("authority")}
              className="w-full min-h-[72px] rounded-2xl border-3 border-white/20 hover:border-white/40 text-white text-lg font-bold mt-2"
            >
              {t(lang, "skip")}
            </button>
          </div>
        )}

        {step === "digilocker_connect" && (
          <div className="flex flex-col gap-6 text-center items-center max-w-md">
            <span className="font-display font-black text-white text-3xl">DigiLocker</span>
            <span className="bg-marigold-500 text-teal-900 text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full">
              {t(lang, "verifyConnectSub")}
            </span>
            <h2 className="font-display text-2xl font-bold text-white mt-2">{t(lang, "verifyConnectTitle")}</h2>
            <p className="text-lg text-teal-100 leading-relaxed font-medium">
              {t(lang, "verifyConnectBody")}
            </p>
            <div className="w-full flex flex-col gap-3 mt-4">
              <button
                onClick={() => transitionTo("digilocker_auth")}
                className="w-full min-h-[72px] rounded-2xl bg-marigold-500 hover:bg-marigold-400 text-teal-955 text-xl font-bold active:scale-95"
              >
                {t(lang, "verifyConnectButton")}
              </button>
              <button
                onClick={() => setStep("documents_choice")}
                className="w-full min-h-[72px] rounded-2xl border-2 border-white/25 text-white text-lg font-bold"
              >
                {t(lang, "cancel")}
              </button>
            </div>
          </div>
        )}

        {step === "digilocker_auth" && (
          <div className="flex flex-col gap-6 w-full max-w-md">
            <h2 className="font-display text-3xl font-bold text-center">{t(lang, "verifyChooseTitle")}</h2>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <p className="font-semibold text-lg text-marigold-400">{t(lang, "verifyChooseSub")}</p>
              <ul className="space-y-2.5 text-base">
                <li className="flex items-center gap-2">✓ Identity document</li>
                <li className="flex items-center gap-2">✓ Address document</li>
                <li className="flex items-center gap-2">✓ Supporting certificate</li>
              </ul>
              <p className="text-sm text-teal-100/70 border-t border-white/10 pt-3 italic">
                {t(lang, "verifyStatusDisclaimer")}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => transitionTo("digilocker_docs")}
                className="w-full min-h-[72px] rounded-2xl bg-marigold-500 hover:bg-marigold-400 text-teal-955 text-xl font-bold active:scale-95"
              >
                {t(lang, "verifyConnectButton")}
              </button>
              <button
                onClick={() => setStep("documents_choice")}
                className="w-full min-h-[72px] rounded-2xl border-2 border-white/25 text-white text-lg font-bold"
              >
                {t(lang, "cancel")}
              </button>
            </div>
          </div>
        )}

        {step === "digilocker_docs" && (
          <div className="w-full max-w-lg flex flex-col gap-6">
            <h2 className="font-display text-3xl font-bold text-center">{t(lang, "digiDocsTitle")}</h2>
            <p className="text-teal-100 text-lg text-center font-semibold">{t(lang, "digiDocsSub")}</p>

            <div className="flex flex-col gap-3">
              {["Address Proof", "Identity Proof", "Scholarship Certificate", "Income Certificate"].map((doc) => {
                const selected = selectedDigiDocs.includes(doc);
                return (
                  <button
                    key={doc}
                    onClick={() => toggleDigiDoc(doc)}
                    className={`w-full text-left rounded-2xl p-5 border-2 flex items-center justify-between font-bold text-xl transition-all ${
                      selected ? "border-leaf bg-leaf/10 text-leaf" : "border-white/10 bg-white/5 text-white"
                    }`}
                  >
                    <span>{doc}</span>
                    {selected && <span>✓ Selected</span>}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleDigiDocsSubmit}
              disabled={selectedDigiDocs.length === 0}
              className="w-full min-h-[76px] rounded-2xl bg-marigold-500 hover:bg-marigold-400 text-teal-955 text-2xl font-bold shadow-md disabled:opacity-50 mt-3 active:scale-95"
            >
              {t(lang, "digiDocsButton")}
            </button>
          </div>
        )}

        {step === "upload_pdf" && (
          <div className="w-full max-w-lg flex flex-col gap-6 text-center">
            <h2 className="font-display text-3xl font-bold">{t(lang, "uploadTitle")}</h2>
            <p className="text-teal-100 text-lg font-medium">{t(lang, "uploadSub")}</p>

            {!uploadedPDFName ? (
              <label className="border-3 border-dashed border-white/20 hover:border-white/40 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer min-h-[200px]">
                <Upload size={40} className="text-marigold-400" />
                <span className="text-xl font-bold">{t(lang, "uploadButton")}</span>
                <span className="text-sm text-teal-100/70">{t(lang, "docsChoiceUploadSub")}</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePDFUploadSimulation}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 text-left">
                <div className="flex items-center gap-3">
                  <FileText className="text-marigold-400" size={32} />
                  <div className="flex-1 truncate">
                    <p className="font-bold text-lg text-white truncate">{uploadedPDFName}</p>
                    <p className="text-sm text-leaf">✓ Ready</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => transitionTo("documents_attached")}
                    className="flex-1 min-h-[64px] rounded-xl bg-marigold-500 hover:bg-marigold-400 text-teal-955 text-xl font-bold shadow-md active:scale-95"
                  >
                    {t(lang, "continue")}
                  </button>
                  <button
                    onClick={() => setUploadedPDFName(null)}
                    className="flex-1 min-h-[64px] rounded-xl border border-white/25 text-white text-lg font-bold"
                  >
                    {t(lang, "uploadChooseAnother")}
                  </button>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="bg-brick/20 border border-brick/40 p-4 rounded-2xl text-left flex gap-3">
                <AlertCircle className="text-brick shrink-0" size={24} />
                <div>
                  <p className="font-bold text-brick">{t(lang, "uploadErrorTitle")}</p>
                  <p className="text-sm text-white/90 mt-1">{uploadError}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {step === "documents_attached" && (
          <div className="w-full max-w-lg flex flex-col gap-6 text-center">
            <h2 className="font-display text-3xl font-bold">{t(lang, "attachedTitle")}</h2>
            <p className="text-teal-100 text-lg font-medium">{t(lang, "attachedSub")}</p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3 text-left">
              <p className="text-xs font-bold text-marigold-400 tracking-wider uppercase">{t(lang, "reviewDocumentsLabel")}</p>
              <ul className="space-y-2">
                {attachedDocs.map((doc, i) => (
                  <li key={i} className="flex items-center gap-2 font-bold text-lg text-white">
                    <span className="text-leaf">✓</span> {doc}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              <button
                onClick={() => transitionTo("authority")}
                className="w-full min-h-[76px] rounded-2xl bg-marigold-500 hover:bg-marigold-400 text-teal-955 text-2xl font-bold shadow-md active:scale-95"
              >
                {t(lang, "continue")}
              </button>
              <button
                onClick={() => {
                  setAttachedDocs([]);
                  setSelectedDigiDocs([]);
                  setUploadedPDFName(null);
                  transitionTo("documents_choice");
                }}
                className="w-full min-h-[72px] rounded-2xl border-2 border-white/25 text-white text-lg font-bold"
              >
                {t(lang, "attachedButtonChange")}
              </button>
            </div>
          </div>
        )}

        {step === "authority" && (
          <div className="w-full max-w-xl flex flex-col gap-6">
            <h1 className="font-display text-3xl font-bold text-center">{t(lang, "authorityTitle")}</h1>
            
            <div className="relative">
              <Search className="absolute left-4 top-4 text-teal-900" size={24} />
              <input
                type="text"
                placeholder={t(lang, "authoritySearch")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchKioskAuthorities(e.target.value);
                }}
                className="w-full min-h-[56px] rounded-xl pl-12 pr-4 text-xl text-teal-955 font-medium bg-white focus-visible:outline-marigold-400"
              />
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-marigold-400 block uppercase tracking-wider">{t(lang, "reviewAuthorityLabel")}</span>
              {authoritiesList.length === 0 ? (
                <button
                  onClick={() => searchKioskAuthorities("")}
                  className="w-full text-center p-8 bg-white/5 rounded-2xl text-teal-100 font-bold"
                >
                  {t(lang, "authorityNotFound")}
                </button>
              ) : (
                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {authoritiesList.map((auth) => (
                    <button
                      key={auth.id}
                      onClick={() => handleKioskConfirmAuthority(auth)}
                      className="w-full text-left bg-white/5 border border-white/10 hover:border-white/30 rounded-2xl p-5 flex flex-col gap-1 transition-all active:scale-95"
                    >
                      <span className="font-bold text-xl text-white">{auth.name}</span>
                      <span className="text-sm text-teal-100/80 italic">{auth.whyMatch}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === "review" && selectedAuthority && (
          <div className="w-full max-w-2xl flex flex-col gap-6">
            <h1 className="font-display text-3xl font-bold text-center">{t(lang, "reviewTitle")}</h1>

            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <span className="text-xs font-bold text-marigold-400 block uppercase tracking-wider mb-2">{t(lang, "reviewQuestionsLabel")}</span>
                <ol className="list-decimal list-inside space-y-1.5 text-base text-teal-100">
                  {questions.map((q) => (
                    <li key={q.id}>{q.text}</li>
                  ))}
                </ol>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-marigold-400 block uppercase tracking-wider">{t(lang, "reviewAuthorityLabel")}</span>
                  <span className="text-lg font-bold text-white block mt-0.5">{selectedAuthority.name}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <span className="text-xs font-bold text-marigold-400 block uppercase tracking-wider">{t(lang, "reviewApplicantLabel")}</span>
                  <span className="text-lg font-bold text-white block mt-0.5">{t(lang, "reviewApplicantValue")}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <span className="text-xs font-bold text-marigold-400 block uppercase tracking-wider">{t(lang, "paymentTitle")}</span>
                  <span className="text-lg font-bold text-white block mt-0.5">₹10</span>
                </div>
              </div>
            </div>

            <div className="bg-brick/20 border border-brick/30 rounded-2xl p-5 flex gap-3">
              <AlertCircle className="text-brick shrink-0 mt-0.5" size={24} />
              <p className="text-base text-white/90">
                {t(lang, "prototypeWarning")}
              </p>
            </div>

            <button
              onClick={() => transitionTo("payment_choose")}
              className="w-full min-h-[80px] rounded-2xl bg-marigold-500 hover:bg-marigold-400 text-teal-955 text-2xl font-bold shadow-md active:scale-95"
            >
              {t(lang, "submitDemo")}
            </button>
          </div>
        )}

        {step === "payment_choose" && (
          <div className="w-full max-w-md flex flex-col gap-6 text-center">
            <h1 className="font-display text-3xl font-bold">{t(lang, "paymentTitle")}</h1>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-5xl font-bold text-marigold-400 font-display">₹10</p>
              <p className="text-xs font-bold uppercase tracking-wider text-teal-100 mt-2">
                {t(lang, "demoPaymentNote")}
              </p>
            </div>
            
            <div className="flex flex-col gap-3.5 mt-2">
              <button
                onClick={() => handlePaymentInit("upi")}
                className="w-full min-h-[72px] rounded-2xl bg-marigold-500 hover:bg-marigold-400 text-teal-955 text-xl font-bold active:scale-95"
              >
                {t(lang, "mockUpi")}
              </button>
              <button
                onClick={() => handlePaymentInit("netbanking")}
                className="w-full min-h-[72px] rounded-2xl border-2 border-white/20 hover:bg-white/10 text-white text-xl font-bold active:scale-95"
              >
                {t(lang, "mockNetBanking")}
              </button>
            </div>
            <p className="text-sm text-teal-100/60 mt-1">{t(lang, "paymentSecurityNote")}</p>
          </div>
        )}

        {step === "payment_choose" && payMethod && (
          <div className="fixed inset-0 bg-teal-950/95 flex items-center justify-center p-6 z-30">
            <div className="bg-teal-900 border border-teal-800 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
              <h2 className="font-display text-2xl font-bold">Simulate Payment Outcome</h2>
              <p className="text-teal-100 text-sm">Select the outcome of your ₹10 mock payment transaction.</p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleKioskPaymentOutcome(true)}
                  className="min-h-[64px] rounded-2xl bg-leaf text-white font-bold text-xl hover:bg-leaf/90 flex items-center justify-center gap-2"
                >
                  Simulate Payment Success
                </button>
                <button
                  onClick={() => handleKioskPaymentOutcome(false)}
                  className="min-h-[64px] rounded-2xl bg-brick text-white font-bold text-xl hover:bg-brick/90 flex items-center justify-center gap-2"
                >
                  Simulate Payment Failure
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "payment_processing" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="animate-spin text-marigold-400"><Clock size={40} /></span>
            <h1 className="text-2xl font-bold">{t(lang, "paymentProcessing")}</h1>
            <p className="text-teal-100">Contacting synthetic mock payment provider.</p>
          </div>
        )}

        {step === "payment_delayed" && (
          <div className="flex flex-col items-center gap-4 text-center max-w-xs">
            <AlertCircle className="text-marigold-400" size={40} />
            <h1 className="text-2xl font-bold">{t(lang, "paymentDelayedTitle")}</h1>
            <p className="text-teal-100 text-sm">{t(lang, "paymentDelayedSub")}</p>
            <span className="animate-spin text-marigold-400 mt-2"><Clock size={20} /></span>
          </div>
        )}

        {step === "payment_failed" && (
          <div className="flex flex-col gap-4 text-center items-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-brick/20 flex items-center justify-center text-brick shadow-md">
              <AlertCircle size={32} />
            </div>
            <h1 className="text-2xl font-bold">{t(lang, "paymentFailedTitle")}</h1>
            <p className="text-teal-100">{t(lang, "paymentFailedSub")}</p>
            <button
              onClick={() => {
                setPayMethod(null);
                transitionTo("payment_choose");
              }}
              className="w-full min-h-[72px] rounded-2xl bg-marigold-500 text-teal-950 text-xl font-bold mt-4"
            >
              {t(lang, "paymentTryAgain")}
            </button>
          </div>
        )}

        {step === "submitted" && (
          <div className="w-full max-w-md flex flex-col gap-6 text-center items-center">
            <div className="w-16 h-16 rounded-full bg-leaf/20 flex items-center justify-center text-leaf border border-leaf/30 shadow-md">
              <CheckCircle size={36} />
            </div>
            <h1 className="font-display text-4xl font-bold">{t(lang, "submittedTitle")}</h1>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 w-full text-left space-y-3">
              <div className="flex justify-between items-center border-b border-white/10 pb-2.5">
                <span className="text-teal-100/70 text-sm">{t(lang, "requestId")}</span>
                <span className="font-mono font-bold text-lg text-white">{requestId}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-2.5">
                <span className="text-teal-100/70 text-sm">{t(lang, "authority")}</span>
                <span className="font-bold text-white">{selectedAuthority?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-teal-100/70 text-sm">{t(lang, "endStatusLabel")}</span>
                <span className="font-bold text-marigold-400">{t(lang, "status_SUBMITTED")}</span>
              </div>
            </div>

            <p className="text-xs text-teal-100/60 italic leading-relaxed">
              {t(lang, "simulatedNote")}
            </p>

            <div className="w-full flex flex-col gap-3 mt-4">
              <button
                onClick={() => transitionTo("tracking")}
                className="w-full min-h-[76px] rounded-2xl bg-marigold-500 hover:bg-marigold-400 text-teal-955 text-2xl font-bold shadow-md active:scale-95"
              >
                {t(lang, "trackRequest")}
              </button>
              
              <button
                onClick={printReceipt}
                disabled={isReceiptPrinting}
                className="w-full min-h-[72px] rounded-2xl border-2 border-white/20 text-white hover:bg-white/10 text-lg font-bold flex items-center justify-center gap-2"
              >
                {isReceiptPrinting ? (
                  t(lang, "kioskReceiptPrinting")
                ) : receiptPrinted ? (
                  t(lang, "kioskReceiptPrinted")
                ) : (
                  <>
                    <Printer size={20} /> {t(lang, "kioskPrintReceipt")}
                  </>
                )}
              </button>

              <button
                onClick={resetSession}
                className="w-full min-h-[72px] rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-lg mt-2 active:scale-95"
              >
                {t(lang, "kioskFinish")}
              </button>
            </div>
          </div>
        )}

        {step === "tracking" && (
          <div className="w-full max-w-xl flex flex-col gap-6">
            <h1 className="font-display text-3xl font-bold text-center">{t(lang, "trackingTitle")}</h1>
            <p className="text-center font-mono text-lg text-marigold-400">{requestId}</p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-leaf text-white flex items-center justify-center text-xs font-bold font-mono">✓</span>
                <span className="font-semibold text-lg">{t(lang, "status_SUBMITTED")}</span>
              </div>
              <div className="flex items-center gap-3 border-l-2 border-teal-800 ml-3 pl-3">
                <span className="w-6 h-6 rounded-full bg-leaf text-white flex items-center justify-center text-xs font-bold font-mono">✓</span>
                <span className="font-semibold text-lg">{t(lang, "status_RECEIVED")}</span>
              </div>
              <div className="flex items-center gap-3 border-l-2 border-teal-800 ml-3 pl-3">
                <span className="w-6 h-6 rounded-full bg-marigold-500 text-teal-950 flex items-center justify-center text-xs font-bold font-mono">•</span>
                <span className="font-bold text-marigold-400 text-lg">{t(lang, "status_UNDER_REVIEW")}</span>
              </div>
            </div>

            <div className="bg-leaf/25 border-2 border-leaf/40 rounded-2xl p-5 text-center">
              <p className="text-sm text-teal-100">{t(lang, "doINeedToDo")}</p>
              <p className="font-black text-leaf text-2xl mt-1 uppercase tracking-wide">🟢 {t(lang, "noActionNeeded")}</p>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <button
                onClick={() => transitionTo("explain_status")}
                className="w-full min-h-[72px] rounded-2xl bg-marigold-500 hover:bg-marigold-400 text-teal-955 text-xl font-bold shadow-md active:scale-95"
              >
                {t(lang, "explainUnderReview")}
              </button>
              <button
                onClick={resetSession}
                className="w-full min-h-[72px] rounded-2xl border-2 border-white/20 text-white text-lg font-bold active:scale-95"
              >
                {t(lang, "home")}
              </button>
            </div>
          </div>
        )}

        {step === "explain_status" && (
          <div className="w-full max-w-xl flex flex-col gap-5">
            <div className="text-center">
              <span className="bg-teal-950 text-teal-300 font-mono text-sm px-3.5 py-1 rounded-full border border-teal-800">
                {t(lang, "statusOfficialLabel")}
              </span>
              <h1 className="font-display text-3xl font-bold mt-3">{t(lang, "whatItMeans")}</h1>
            </div>

            <div className="space-y-4 mt-2">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <p className="text-xs font-bold text-marigold-400 tracking-wider uppercase mb-1">{t(lang, "whatHappened")}</p>
                <p className="text-lg text-white font-medium">{t(lang, "statusWhatHappenedBody")}</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <p className="text-xs font-bold text-marigold-400 tracking-wider uppercase mb-1">{t(lang, "whatItMeans")}</p>
                <p className="text-lg text-white leading-relaxed font-medium">
                  {t(lang, "statusWhatItMeansBody")}
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <p className="text-xs font-bold text-marigold-400 tracking-wider uppercase mb-1">{t(lang, "whatShouldYouDo")}</p>
                <p className="text-lg text-white font-medium">{t(lang, "statusWhatShouldYouDoBody")}</p>
              </div>
            </div>

            <button
              onClick={() => transitionTo("tracking")}
              className="w-full min-h-[76px] rounded-2xl bg-marigold-500 hover:bg-marigold-400 text-teal-955 text-2xl font-bold shadow-md mt-4 active:scale-95"
            >
              {t(lang, "gotIt")}
            </button>
          </div>
        )}
      </main>

      {/* Timeout Warning Overlay Modal */}
      {showTimeoutWarning && (
        <div className="fixed inset-0 bg-teal-950/95 flex items-center justify-center p-6 z-50">
          <div className="bg-teal-900 border border-teal-850 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-marigold-500/10 text-marigold-400 flex items-center justify-center mx-auto shadow-md">
              <Clock size={36} />
            </div>
            
            <h2 className="font-display text-3xl font-bold">{t(lang, "kioskTimeoutTitle")}</h2>
            
            <p className="text-teal-100 text-lg leading-relaxed">
              {t(lang, "kioskTimeoutSub")}
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleContinueSession}
                className="w-full min-h-[76px] rounded-2xl bg-marigold-500 hover:bg-marigold-400 text-teal-955 text-2xl font-bold shadow-md active:scale-95"
              >
                {t(lang, "kioskTimeoutContinue")}
              </button>
              <button
                onClick={resetSession}
                className="w-full min-h-[64px] rounded-2xl border-2 border-white/25 text-white font-bold text-lg active:scale-95"
              >
                {t(lang, "kioskTimeoutStartOver")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
