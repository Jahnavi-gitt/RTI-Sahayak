import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Mic,
  Printer,
  Volume2,
  ArrowLeft,
  ShieldCheck,
  CheckCircle,
  FileText,
  AlertCircle,
  Clock,
  Info,
  Shield,
  Loader2,
  Camera,
  Check
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { LANG_LABELS, LOCALE_MAP, t } from "../../i18n/strings";
import type { Lang, RtiQuestion, Authority, UnderstandResult } from "../../types";
import VoiceCapture from "../../components/VoiceCapture";
import { understandProblem, generateRtiQuestions, findAuthorities } from "../../services/ai";
import { generateRequestId, buildStatusHistory } from "../../mock/engine";
import { getLocalizedDepartmentName } from "../../data/departments";
import { downloadReceiptPdf } from "../../utils/pdfGenerator";
import { formatAadhaar, formatPan, maskAadhaar, maskPan } from "../../utils/security";
import { speakText, stopAllSpeech, cancelSpeech } from "../../services/tts";

type KioskStep =
  | "welcome"
  | "language"
  | "verify_intro"
  | "verify_choose"
  | "verify_connect"
  | "verify_input"
  | "verify_camera"
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

// Extended, accessible session timeouts for elderly and first-time users
const TIMEOUT_WARNING_MS = 180_000; // 3 minutes warning
const TIMEOUT_RESET_MS = 240_000;   // 4 minutes total timeout

export default function Kiosk() {
  const {
    lang,
    setLang,
    draft,
    updateDraft,
    resetDraft,
    attachedDocs,
    setVerified,
    setVerificationMethod,
    setVerificationDetails,
    addRequest,
    currentUser
  } = useApp();
  
  const navigate = useNavigate();
  const [step, setStep] = useState<KioskStep>("welcome");
  const [history, setHistory] = useState<KioskStep[]>([]);
  const [inputMode, setInputMode] = useState<"voice" | "type">("voice");
  const [typeText, setTypeText] = useState("");
  const [heard, setHeard] = useState("");
  const [understanding, setUnderstanding] = useState<UnderstandResult | null>(null);
  const [questions, setQuestions] = useState<RtiQuestion[]>([]);
  const [authoritiesList, setAuthoritiesList] = useState<Authority[]>([]);
  const [selectedAuthority, setSelectedAuthority] = useState<Authority | null>(null);
  
  // Verification states
  const [verifyType, setVerifyType] = useState<"aadhaar" | "pan">("aadhaar");
  const [idNumber, setIdNumber] = useState("");
  const [verifyOtpVal, setVerifyOtpVal] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const fullName = currentUser?.name || t(lang, "profileName");
  const citizenship = t(lang, "citizenshipValue");

  // Payment states
  const [payMethod, setPayMethod] = useState<"upi" | "netbanking" | null>(null);
  const [requestId, setRequestId] = useState("");
  const [isReceiptPrinting, setIsReceiptPrinting] = useState(false);
  const [receiptPrinted, setReceiptPrinted] = useState(false);

  // Inactivity timeout states
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const timerWarningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetSession = useCallback(() => {
    resetDraft();
    setStep("welcome");
    setHistory([]);
    setInputMode("voice");
    setTypeText("");
    setHeard("");
    setUnderstanding(null);
    setQuestions([]);
    setAuthoritiesList([]);
    setSelectedAuthority(null);
    setPayMethod(null);
    setRequestId("");
    setIsReceiptPrinting(false);
    setReceiptPrinted(false);
    setShowTimeoutWarning(false);
    cancelSpeech();
  }, [resetDraft]);

  const startInactivityTimers = useCallback(() => {
    if (timerWarningRef.current) clearTimeout(timerWarningRef.current);
    if (timerResetRef.current) clearTimeout(timerResetRef.current);

    if (step === "welcome") return;

    timerWarningRef.current = setTimeout(() => {
      setShowTimeoutWarning(true);
      speakText(t(lang, "kioskTimeoutTitle"), lang);
    }, TIMEOUT_WARNING_MS);

    timerResetRef.current = setTimeout(() => {
      resetSession();
    }, TIMEOUT_RESET_MS);
  }, [step, resetSession, lang]);

  useEffect(() => {
    startInactivityTimers();
    const handleActivity = () => {
      if (!showTimeoutWarning) {
        startInactivityTimers();
      }
    };

    window.addEventListener("click", handleActivity);
    window.addEventListener("touchstart", handleActivity);
    window.addEventListener("keydown", handleActivity);
    return () => {
      if (timerWarningRef.current) clearTimeout(timerWarningRef.current);
      if (timerResetRef.current) clearTimeout(timerResetRef.current);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, [startInactivityTimers, showTimeoutWarning]);

  const handleContinueSession = () => {
    setShowTimeoutWarning(false);
    startInactivityTimers();
  };

  const transitionTo = useCallback((nextStep: KioskStep) => {
    setHistory((prev) => [...prev, step]);
    setStep(nextStep);
  }, [step]);

  const handleBack = () => {
    if (history.length > 0) {
      const prevStep = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      setStep(prevStep);
    } else {
      resetSession();
    }
  };

  const handleExitKiosk = () => {
    if (currentUser) {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  };

  // Get contextual, step-specific voice script
  const getSpeakableText = useCallback((): string => {
    switch (step) {
      case "welcome":
        return t(lang, "audio_welcome");
      case "language":
        return t(lang, "audio_language");
      case "verify_intro":
        return t(lang, "audio_verify_intro");
      case "verify_choose":
        return t(lang, "audio_verify_choose");
      case "verify_connect":
      case "digilocker_connect":
        return t(lang, "audio_digilocker_selected");
      case "verify_input":
        return t(lang, "audio_verify_aadhaar_pan");
      case "verify_camera":
        return t(lang, "audio_verify_camera");
      case "verify_status":
        return t(lang, "audio_verify_status");
      case "input_method":
        return t(lang, "audio_input_method");
      case "capture":
        return t(lang, "audio_problem");
      case "confirm_heard":
        return `${t(lang, "audio_we_heard")} ${heard}`;
      case "understanding":
        return t(lang, "audio_understanding");
      case "suitability":
        return `${t(lang, "audio_suitability")} ${understanding?.suitability_reason || ""}`;
      case "questions":
        return `${t(lang, "audio_questions_editable")} ${questions.map((q, i) => `${i + 1}: ${q.text}`).join(". ")}`;
      case "documents_choice":
      case "digilocker_docs":
      case "upload_pdf":
        return t(lang, "audio_documents");
      case "documents_attached":
        return `${t(lang, "kioskAttachedDocsText")} ${attachedDocs.join(", ")}.`;
      case "authority": {
        const authName = selectedAuthority ? getLocalizedDepartmentName(selectedAuthority, lang) : "";
        return `${t(lang, "audio_authority")} ${authName}`;
      }
      case "review": {
        const authName = selectedAuthority ? getLocalizedDepartmentName(selectedAuthority, lang) : "";
        return `${t(lang, "audio_review")} ${t(lang, "kioskReviewPublicAuth")} ${authName}. ${t(lang, "kioskReviewFee")}`;
      }
      case "payment_choose":
        return t(lang, "audio_payment");
      case "payment_delayed":
        return t(lang, "audio_payment_success");
      case "payment_failed":
        return t(lang, "audio_payment_failure");
      case "submitted":
        return `${t(lang, "audio_submitted")} ${t(lang, "requestId")}: ${requestId}.`;
      case "tracking":
        return t(lang, "audio_tracking");
      case "explain_status":
        return t(lang, "audio_under_review");
      default:
        return t(lang, "audio_welcome");
    }
  }, [step, lang, heard, understanding, questions, attachedDocs, selectedAuthority, requestId]);

  // Automatically speak guidance when entering new important kiosk stages
  useEffect(() => {
    const text = getSpeakableText();
    if (text) {
      speakText(text, lang);
    }
    return () => {
      stopAllSpeech();
    };
  }, [getSpeakableText, lang]);

  async function processInputText(textVal: string) {
    if (!textVal.trim()) return;
    setHeard(textVal.trim());
    transitionTo("understanding");
    const u = await understandProblem(textVal.trim(), lang);
    setUnderstanding(u);
    updateDraft({ rawProblem: textVal.trim(), understanding: u });
    transitionTo("suitability");
  }

  async function generateQuestionsForKiosk() {
    if (!understanding) return;
    transitionTo("understanding");
    const qs = await generateRtiQuestions(understanding, draft.rawProblem, lang);
    setQuestions(qs);
    updateDraft({ questions: qs });
    transitionTo("questions");
  }

  async function searchKioskAuthorities(q: string) {
    const list = await findAuthorities(q, lang);
    setAuthoritiesList(list);
  }

  function handleVerifyIdentity() {
    if (!isOtpSent) {
      setIsOtpSent(true);
      return;
    }
    transitionTo("verify_processing");
  }

  useEffect(() => {
    if (step === "verify_processing") {
      const timer = setTimeout(() => {
        setVerified(true);
        const masked = verifyType === "aadhaar" ? maskAadhaar(idNumber || "987654321012") : maskPan(idNumber || "ABCDE1234F");
        setVerificationDetails({
          method: verifyType === "aadhaar" ? "Aadhaar Demo" : "PAN Demo",
          maskedId: masked,
          citizenName: fullName
        });
        transitionTo("verify_status");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step, idNumber, verifyType, fullName, setVerified, setVerificationDetails, transitionTo]);

  function handleCameraFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCapturedImage(url);
      setVerificationMethod("camera_doc");
    }
  }

  function handleKioskConfirmAuthority(auth: Authority) {
    setSelectedAuthority(auth);
    updateDraft({ authority: auth });
    transitionTo("review");
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
    
    const request = {
      id,
      rawProblem: draft.rawProblem || heard || "RTI Application",
      understanding: draft.understanding || {
        topic: "general",
        goal: "request_information" as const,
        summary: "Official records request.",
        rti_suitability: "likely" as const,
        suitability_reason: "RTI is suitable for official government records.",
        confidence: 0.95,
        source: "fallback" as const
      },
      questions: draft.questions.length > 0 ? draft.questions : questions,
      authority: selectedAuthority || draft.authority || authoritiesList[0],
      createdAt: new Date().toISOString(),
      statusHistory: buildStatusHistory(),
      currentStatus: "SUBMITTED" as const
    };
    addRequest(request as any);
    transitionTo("submitted");
  }

  function printReceipt() {
    setIsReceiptPrinting(true);
    const mockRequest: any = {
      id: requestId || "RTI-2026-DEMO-001",
      rawProblem: draft.rawProblem || heard || "Kiosk RTI application",
      understanding: draft.understanding,
      questions: draft.questions.length > 0 ? draft.questions : questions,
      authority: selectedAuthority || draft.authority || authoritiesList[0],
      createdAt: new Date().toISOString(),
      statusHistory: buildStatusHistory(),
      currentStatus: "SUBMITTED" as const
    };
    try {
      downloadReceiptPdf(mockRequest, lang, fullName);
    } catch {
      // ignore download error if running in restricted test env
    }
    setTimeout(() => {
      setIsReceiptPrinting(false);
      setReceiptPrinted(true);
    }, 1200);
  }

  return (
    <div className={`min-h-screen flex flex-col bg-teal-950 text-white font-body select-none lang-${lang}`}>
      {/* Touch Assist Permanent Kiosk Header */}
      {step !== "welcome" && (
        <header className="border-b border-white/10 bg-teal-950/90 backdrop-blur sticky top-0 z-20">
          <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                aria-label={t(lang, "back")}
                className="min-h-[52px] min-w-[52px] bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 active:scale-95"
              >
                <ArrowLeft size={22} />
              </button>
              <button
                onClick={resetSession}
                className="min-h-[52px] px-4 bg-white/10 rounded-full flex items-center gap-2 hover:bg-white/20 active:scale-95"
              >
                <Home size={18} />
                <span className="font-bold text-sm hidden sm:inline">{t(lang, "home")}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => speakText(getSpeakableText(), lang)}
                className="min-h-[52px] px-4 bg-marigold-500 text-teal-950 rounded-full flex items-center gap-2 font-bold hover:bg-marigold-400 active:scale-95 shadow-md"
              >
                <Volume2 size={20} />
                <span className="text-sm font-black">{t(lang, "listen")}</span>
              </button>

              <button
                onClick={() => transitionTo("language")}
                className="min-h-[52px] px-4 bg-white/10 rounded-full flex items-center gap-2 hover:bg-white/20 font-bold active:scale-95 border border-white/20"
              >
                <span className="text-sm">{LANG_LABELS[lang].split(" — ")[0]}</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Touch Kiosk Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-8 py-8 flex flex-col items-center justify-center">
        {/* Step: Welcome */}
        {step === "welcome" && (
          <div className="flex flex-col items-center text-center gap-7 max-w-xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-marigold-500 text-teal-950 px-4 py-1.5 rounded-full">
              {t(lang, "independentNotice")}
            </span>

            <div className="w-20 h-20 rounded-2xl bg-white text-teal-900 flex items-center justify-center font-display text-5xl font-black shadow-lg">
              ?
            </div>

            <h1 className="font-display text-4xl sm:text-6xl font-bold leading-tight">
              {t(lang, "appName")}
            </h1>

            <p className="text-xl sm:text-2xl text-teal-100 max-w-md leading-relaxed">
              “{t(lang, "tagline")}”
            </p>

            <div className="w-full flex flex-col gap-3.5 mt-2">
              <button
                onClick={() => transitionTo("verify_intro")}
                className="min-h-[84px] w-full rounded-2xl bg-marigold-500 hover:bg-marigold-400 text-teal-950 text-2xl font-black flex items-center justify-center gap-3 shadow-md active:scale-95"
              >
                {t(lang, "kioskStartJourney")}
              </button>

              <button
                onClick={() => transitionTo("language")}
                className="min-h-[68px] w-full rounded-2xl border-2 border-white/30 hover:border-white/60 text-white text-xl font-bold active:scale-95"
              >
                {t(lang, "kioskChooseLang")}
              </button>

              <button
                onClick={handleExitKiosk}
                className="text-teal-300 underline font-semibold text-lg py-2 hover:text-white"
              >
                {t(lang, "kioskExit")}
              </button>
            </div>
          </div>
        )}

        {/* Step: Language Select */}
        {step === "language" && (
          <div className="w-full max-w-2xl flex flex-col gap-6 text-center">
            <h1 className="font-display text-4xl font-bold">{t(lang, "shellSelectLanguage")}</h1>
            <p className="text-teal-100 text-lg">{t(lang, "kioskSelectLangSub")}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
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
                  className={`min-h-[72px] rounded-2xl border-2 p-4 text-center font-bold text-xl transition-all ${
                    lang === l
                      ? "bg-marigold-500 border-marigold-500 text-teal-950 shadow-md scale-102"
                      : "bg-white/5 border-white/15 hover:bg-white/15 text-white"
                  }`}
                >
                  {LANG_LABELS[l]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Verify Intro */}
        {step === "verify_intro" && (
          <div className="flex flex-col gap-6 text-center items-center max-w-lg">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-marigold-400 shadow-md">
              <ShieldCheck size={44} />
            </div>
            <h1 className="font-display text-4xl font-bold">{t(lang, "verifyIntroTitle")}</h1>
            <p className="text-lg text-teal-100 leading-relaxed">{t(lang, "verifyIntroBody")}</p>
            <button
              onClick={() => transitionTo("verify_choose")}
              className="min-h-[72px] w-full rounded-2xl bg-marigold-500 text-teal-950 text-2xl font-bold shadow-md hover:bg-marigold-400 active:scale-95 mt-4"
            >
              {t(lang, "verifyIntroButton")}
            </button>
          </div>
        )}

        {/* Step: Verify Choose Method */}
        {step === "verify_choose" && (
          <div className="flex flex-col gap-6 w-full max-w-xl text-center">
            <h1 className="font-display text-3xl sm:text-4xl font-bold">{t(lang, "verifyChooseTitle")}</h1>
            <p className="text-teal-100">{t(lang, "verifyChooseSub")}</p>
            <div className="flex flex-col gap-4 mt-2">
              <button
                onClick={() => {
                  setVerificationMethod("aadhaar_otp");
                  setVerifyType("aadhaar");
                  transitionTo("verify_input");
                }}
                className="w-full text-left bg-white/10 border-2 border-white/20 hover:border-marigold-400 rounded-2xl p-5 flex items-center gap-4 transition-all"
              >
                <Shield className="text-marigold-400 shrink-0" size={32} />
                <div>
                  <span className="font-bold text-xl block">{t(lang, "verifyChooseGovId")}</span>
                  <span className="text-sm text-teal-200">{t(lang, "verifyChooseGovIdSub")}</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setVerificationMethod("camera_doc");
                  transitionTo("verify_camera");
                }}
                className="w-full text-left bg-white/10 border-2 border-white/20 hover:border-marigold-400 rounded-2xl p-5 flex items-center gap-4 transition-all"
              >
                <Camera className="text-marigold-400 shrink-0" size={32} />
                <div>
                  <span className="font-bold text-xl block">{t(lang, "verifyChooseCamera")}</span>
                  <span className="text-sm text-teal-200">{t(lang, "verifyChooseCameraSub")}</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setVerificationMethod("digilocker");
                  transitionTo("verify_connect");
                }}
                className="w-full text-left bg-white/10 border-2 border-white/20 hover:border-marigold-400 rounded-2xl p-5 flex items-center gap-4 transition-all"
              >
                <ShieldCheck className="text-marigold-400 shrink-0" size={32} />
                <div>
                  <span className="font-bold text-xl block">{t(lang, "verifyChooseDigiLocker")}</span>
                  <span className="text-sm text-teal-200">{t(lang, "audio_digilocker_option")}</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step: Verify Aadhaar / PAN Input */}
        {step === "verify_input" && (
          <div className="flex flex-col gap-6 w-full max-w-lg text-center">
            <h1 className="font-display text-3xl font-bold">{t(lang, "verifyChooseGovId")}</h1>
            <div className="bg-white/10 border-2 border-white/20 rounded-2xl p-6 text-left space-y-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setVerifyType("aadhaar")}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 ${
                    verifyType === "aadhaar" ? "bg-marigold-500 text-teal-950 border-marigold-500" : "border-white/20 text-white"
                  }`}
                >
                  {t(lang, "aadhaarTab")}
                </button>
                <button
                  type="button"
                  onClick={() => setVerifyType("pan")}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 ${
                    verifyType === "pan" ? "bg-marigold-500 text-teal-950 border-marigold-500" : "border-white/20 text-white"
                  }`}
                >
                  {t(lang, "panTab")}
                </button>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-teal-200 block mb-1">
                  {verifyType === "aadhaar" ? t(lang, "aadhaarLabel") : t(lang, "panLabel")}
                </label>
                <input
                  type="text"
                  placeholder={verifyType === "aadhaar" ? "9876 5432 1012" : "ABCDE1234F"}
                  value={idNumber}
                  onChange={(e) => setIdNumber(verifyType === "aadhaar" ? formatAadhaar(e.target.value) : formatPan(e.target.value))}
                  className="w-full bg-white/10 border-2 border-white/20 rounded-xl p-3.5 text-2xl font-mono tracking-widest text-center text-white focus:outline-none focus:border-marigold-400"
                />
              </div>

              {isOtpSent && (
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-teal-200 block">
                    {t(lang, "enterOtpSent")}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={verifyOtpVal}
                    onChange={(e) => setVerifyOtpVal(e.target.value)}
                    className="w-full bg-white/10 border-2 border-white/20 rounded-xl p-3 text-2xl font-mono tracking-widest text-center text-white"
                  />
                  <p className="text-xs text-marigold-400 text-center font-bold">{t(lang, "demoOtpLabel")}: 123456</p>
                </div>
              )}
            </div>

            <button
              onClick={handleVerifyIdentity}
              className="min-h-[68px] w-full rounded-2xl bg-marigold-500 text-teal-950 text-xl font-bold shadow-md hover:bg-marigold-400"
            >
              {isOtpSent ? t(lang, "verify") : t(lang, "verifyIdButton")}
            </button>
          </div>
        )}

        {/* Step: Verify Camera Capture */}
        {step === "verify_camera" && (
          <div className="flex flex-col gap-6 w-full max-w-lg text-center items-center">
            <h1 className="font-display text-3xl font-bold">{t(lang, "cameraCaptureTitle")}</h1>
            <p className="text-teal-100">{t(lang, "cameraCaptureSub")}</p>

            <div className="w-full bg-white/10 border-2 border-dashed border-white/30 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[220px]">
              {capturedImage ? (
                <div className="flex flex-col items-center gap-3">
                  <img src={capturedImage} alt="Captured ID" className="max-h-48 rounded-xl object-contain border border-white/30" />
                  <span className="text-sm font-bold text-leaf flex items-center gap-1">
                    <CheckCircle size={16} /> {t(lang, "kioskDocCaptured")}
                  </span>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-3 w-full py-6">
                  <Camera size={48} className="text-marigold-400" />
                  <span className="font-bold text-lg">{t(lang, "takePhoto")}</span>
                  <input type="file" accept="image/*" capture="environment" onChange={handleCameraFile} className="hidden" />
                </label>
              )}
            </div>

            {capturedImage && (
              <button
                onClick={() => transitionTo("verify_processing")}
                className="min-h-[68px] w-full rounded-2xl bg-marigold-500 text-teal-950 text-xl font-bold shadow-md"
              >
                {t(lang, "continue")}
              </button>
            )}
          </div>
        )}

        {/* Step: DigiLocker Connect Simulation */}
        {step === "verify_connect" && (
          <div className="flex flex-col gap-6 text-center items-center max-w-md">
            <div className="font-display text-4xl font-black text-teal-300">DigiLocker</div>
            <h2 className="font-display text-3xl font-bold">{t(lang, "verifyChooseDigiLocker")}</h2>
            <p className="text-teal-100">{t(lang, "audio_digilocker_selected")}</p>
            <button
              onClick={() => transitionTo("verify_processing")}
              className="min-h-[68px] w-full rounded-2xl bg-marigold-500 text-teal-950 text-xl font-bold shadow-md mt-4"
            >
              {t(lang, "continue")}
            </button>
          </div>
        )}

        {/* Step: Processing Verification */}
        {step === "verify_processing" && (
          <div className="flex flex-col items-center gap-6 py-12 text-center">
            <Loader2 className="animate-spin text-marigold-400" size={64} />
            <h2 className="text-2xl font-bold">{t(lang, "verifyProcessing")}</h2>
          </div>
        )}

        {/* Step: Verification Success Popup */}
        {step === "verify_status" && (
          <div className="flex flex-col gap-6 items-center text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-leaf flex items-center justify-center text-white shadow-lg">
              <Check size={44} />
            </div>
            <h1 className="font-display text-4xl font-bold text-white">{t(lang, "verifySuccessTitle")}</h1>
            <div className="bg-white/10 border-2 border-white/20 rounded-2xl p-5 w-full text-left space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-teal-200">{t(lang, "applicantNameLabel")}:</span>
                <span className="font-bold">{fullName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-teal-200">{t(lang, "citizenship")}:</span>
                <span className="font-bold text-marigold-400">{citizenship}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-teal-200">{t(lang, "statusLabel")}:</span>
                <span className="font-bold text-leaf">{t(lang, "verifiedStatus")}</span>
              </div>
            </div>
            <p className="text-xs text-teal-200">{t(lang, "verifyStatusDisclaimer")}</p>
            <button
              onClick={() => transitionTo("input_method")}
              className="min-h-[72px] w-full rounded-2xl bg-marigold-500 text-teal-950 text-2xl font-bold shadow-md hover:bg-marigold-400 mt-2"
            >
              {t(lang, "continue")} →
            </button>
          </div>
        )}

        {/* Step: Input Method Choice */}
        {step === "input_method" && (
          <div className="flex flex-col gap-6 w-full max-w-xl text-center">
            <h1 className="font-display text-4xl font-bold">{t(lang, "kioskInputMethodTitle")}</h1>
            <p className="text-teal-100 text-lg">{t(lang, "kioskInputMethodSub")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <button
                onClick={() => {
                  setInputMode("voice");
                  transitionTo("capture");
                }}
                className="min-h-[140px] rounded-2xl bg-marigold-500 hover:bg-marigold-400 text-teal-950 p-6 flex flex-col items-center justify-center gap-3 font-bold text-2xl shadow-lg active:scale-95"
              >
                <Mic size={40} />
                <span>{t(lang, "speak")}</span>
              </button>

              <button
                onClick={() => {
                  setInputMode("type");
                  transitionTo("capture");
                }}
                className="min-h-[140px] rounded-2xl bg-white/10 hover:bg-white/20 border-2 border-white/20 p-6 flex flex-col items-center justify-center gap-3 font-bold text-2xl shadow-lg active:scale-95"
              >
                <FileText size={40} />
                <span>{t(lang, "typeIt")}</span>
              </button>
            </div>
          </div>
        )}

        {/* Step: Voice / Type Capture */}
        {step === "capture" && (
          <div className="flex flex-col gap-6 w-full max-w-xl text-center items-center">
            <h1 className="font-display text-3xl sm:text-4xl font-bold">{t(lang, "screen2Title")}</h1>
            <p className="text-teal-100">{t(lang, "screen2Placeholder")}</p>
            
            {inputMode === "voice" ? (
              <div className="w-full flex flex-col items-center gap-4">
                <VoiceCapture
                  isKiosk={true}
                  onResult={(text: string) => {
                    setHeard(text);
                    transitionTo("confirm_heard");
                  }}
                  label={t(lang, "kioskSpeakStart")}
                  listeningLabel={t(lang, "kioskSpeakListening")}
                />
                <button
                  onClick={() => setInputMode("type")}
                  className="text-sm text-teal-300 underline font-semibold mt-2"
                >
                  {t(lang, "typeIt")} →
                </button>
              </div>
            ) : (
              <div className="w-full flex flex-col gap-4">
                <textarea
                  rows={5}
                  value={typeText}
                  onChange={(e) => setTypeText(e.target.value)}
                  placeholder={t(lang, "screen2Placeholder")}
                  className="w-full bg-white/10 border-2 border-white/20 rounded-2xl p-4 text-xl text-white focus:outline-none focus:border-marigold-400 resize-none leading-relaxed"
                />
                <div className="flex flex-col sm:flex-row gap-3">
                  {typeText.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => speakText(typeText.trim(), lang)}
                      className="min-h-[56px] flex-1 rounded-xl bg-white/10 border border-white/20 text-marigold-300 font-bold flex items-center justify-center gap-2 hover:bg-white/20"
                    >
                      <Volume2 size={20} />
                      <span>{t(lang, "hearWhatITyped")}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={!typeText.trim()}
                    onClick={() => {
                      setHeard(typeText.trim());
                      transitionTo("confirm_heard");
                    }}
                    className="min-h-[56px] flex-1 rounded-xl bg-marigold-500 text-teal-950 font-bold text-lg shadow-md disabled:opacity-50"
                  >
                    {t(lang, "continue")} →
                  </button>
                </div>
                <button
                  onClick={() => setInputMode("voice")}
                  className="text-sm text-teal-300 underline font-semibold mt-1"
                >
                  ← {t(lang, "speak")}
                </button>
              </div>
            )}

            <p className="text-xs text-teal-200/80">{t(lang, "privacyNote")}</p>
          </div>
        )}

        {/* Step: Confirm Heard */}
        {step === "confirm_heard" && (
          <div className="flex flex-col gap-6 w-full max-w-xl text-center">
            <h1 className="font-display text-3xl font-bold">{t(lang, "kioskWeHeard")}</h1>
            <div className="bg-white/10 border-2 border-white/20 rounded-2xl p-6 text-xl text-left leading-relaxed text-marigold-200">
              “{heard}”
            </div>
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => speakText(heard, lang)}
                className="px-5 py-2.5 rounded-full bg-white/10 border border-white/30 text-marigold-300 font-bold text-sm flex items-center gap-2 hover:bg-white/20"
              >
                <Volume2 size={18} />
                <span>{t(lang, "listenMyText")}</span>
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <button
                onClick={() => processInputText(heard)}
                className="min-h-[68px] flex-1 rounded-2xl bg-marigold-500 text-teal-950 text-xl font-bold shadow-md"
              >
                {t(lang, "kioskYesContinue")}
              </button>
              <button
                onClick={() => transitionTo("capture")}
                className="min-h-[68px] flex-1 rounded-2xl border-2 border-white/30 text-white text-lg font-bold"
              >
                {t(lang, "kioskTryAgain")}
              </button>
            </div>
          </div>
        )}

        {/* Step: Suitability Check */}
        {step === "suitability" && (
          <div className="flex flex-col gap-6 w-full max-w-xl text-center">
            <h1 className="font-display text-3xl sm:text-4xl font-bold">{t(lang, "suitabilityTitle")}</h1>
            <div className="bg-white/10 border-2 border-white/20 rounded-2xl p-6 text-left space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-leaf text-white font-bold text-sm">
                <CheckCircle size={16} /> {t(lang, "suitabilityLikelyLabel")}
              </div>
              <p className="text-lg text-teal-100 leading-relaxed">
                {understanding?.suitability_reason || t(lang, "suitabilityHelpText")}
              </p>
            </div>
            <button
              onClick={generateQuestionsForKiosk}
              className="min-h-[72px] w-full rounded-2xl bg-marigold-500 text-teal-950 text-2xl font-bold shadow-md hover:bg-marigold-400 mt-2"
            >
              {t(lang, "continue")} →
            </button>
          </div>
        )}

        {/* Step: Formulated Questions */}
        {step === "questions" && (
          <div className="flex flex-col gap-6 w-full max-w-xl">
            <div className="text-center">
              <h1 className="font-display text-3xl font-bold">{t(lang, "clearRequest")}</h1>
              <p className="text-sm text-teal-200 mt-1">{t(lang, "questionHelpText")}</p>
            </div>
            
            <div className="space-y-4">
              {questions.map((q, i) => (
                <div key={q.id} className="bg-white/10 border-2 border-white/20 focus-within:border-marigold-400 rounded-2xl p-4 flex flex-col gap-2.5 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-marigold-500 text-teal-950 font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-xs font-bold text-marigold-300 uppercase tracking-wider">
                        {t(lang, "editQuestionLabel")} {i + 1}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => speakText(q.text, lang)}
                      className="text-marigold-300 hover:text-white flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-white/10 rounded-full active:scale-95 transition-all"
                    >
                      <Volume2 size={15} />
                      <span>{t(lang, "listen")}</span>
                    </button>
                  </div>

                  <textarea
                    value={q.text}
                    onChange={(e) => {
                      const newText = e.target.value;
                      setQuestions((prev) => {
                        const updated = prev.map((item) => (item.id === q.id ? { ...item, text: newText } : item));
                        updateDraft({ questions: updated });
                        return updated;
                      });
                    }}
                    rows={3}
                    aria-label={`${t(lang, "editQuestionLabel")} ${i + 1}`}
                    className="w-full bg-black/20 border border-white/20 focus:border-marigold-400 focus:outline-none rounded-xl p-3 text-lg text-white font-medium resize-none leading-relaxed"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                const hasEmpty = questions.some((q) => !q.text || q.text.trim().length === 0);
                if (hasEmpty) {
                  speakText(t(lang, "questionEmptyError"), lang);
                  return;
                }
                updateDraft({ questions });
                searchKioskAuthorities(understanding?.topic || "general");
                transitionTo("authority");
              }}
              className="min-h-[72px] w-full rounded-2xl bg-marigold-500 text-teal-950 text-2xl font-bold shadow-md hover:bg-marigold-400 mt-2 active:scale-98"
            >
              {t(lang, "looksGood")}
            </button>
          </div>
        )}

        {/* Step: Authority Match */}
        {step === "authority" && (
          <div className="flex flex-col gap-6 w-full max-w-xl">
            <h1 className="font-display text-3xl font-bold text-center">{t(lang, "authorityTitle")}</h1>
            <div className="space-y-3">
              {authoritiesList.slice(0, 3).map((auth) => (
                <button
                  key={auth.id}
                  onClick={() => handleKioskConfirmAuthority(auth)}
                  className="w-full text-left bg-white/10 hover:bg-white/20 border-2 border-white/20 hover:border-marigold-400 rounded-2xl p-5 transition-all flex flex-col gap-1"
                >
                  <span className="font-bold text-xl text-marigold-300">{getLocalizedDepartmentName(auth, lang)}</span>
                  <span className="text-sm text-teal-100">{auth.department}</span>
                  <span className="text-xs text-teal-200/80 mt-1">{auth.whyMatch}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Review */}
        {step === "review" && (
          <div className="flex flex-col gap-6 w-full max-w-xl">
            <h1 className="font-display text-3xl font-bold text-center">{t(lang, "reviewTitle")}</h1>
            <div className="bg-white/10 border-2 border-white/20 rounded-2xl p-6 space-y-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-teal-200 block font-bold">{t(lang, "reviewAuthorityLabel")}</span>
                <span className="text-xl font-bold text-marigold-300">
                  {getLocalizedDepartmentName(selectedAuthority || draft.authority, lang)}
                </span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-teal-200 block font-bold">{t(lang, "reviewQuestionsLabel")}</span>
                <ul className="list-disc list-inside text-sm text-teal-100 space-y-1 mt-1">
                  {questions.map((q) => (
                    <li key={q.id}>{q.text}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-teal-200 block font-bold">{t(lang, "paymentTitle")}</span>
                <span className="text-lg font-bold text-white">₹10 ({t(lang, "standardRtiFee")})</span>
              </div>
            </div>
            <button
              onClick={() => transitionTo("payment_choose")}
              className="min-h-[72px] w-full rounded-2xl bg-marigold-500 text-teal-950 text-2xl font-bold shadow-md hover:bg-marigold-400"
            >
              {t(lang, "submitDemo")}
            </button>
          </div>
        )}

        {/* Step: Payment Simulation */}
        {step === "payment_choose" && (
          <div className="flex flex-col gap-6 w-full max-w-xl text-center">
            <h1 className="font-display text-3xl font-bold">{t(lang, "paymentTitle")}</h1>
            <div className="bg-white/10 border-2 border-marigold-400 rounded-2xl p-6">
              <span className="font-display text-5xl font-black text-marigold-400">₹10</span>
              <p className="text-xs font-bold uppercase text-teal-200 mt-2">{t(lang, "demoPaymentNote")}</p>
            </div>
            <div className="flex flex-col gap-3.5 mt-2">
              <button
                onClick={() => {
                  setPayMethod("upi");
                  handleKioskPaymentOutcome(true);
                }}
                className="min-h-[72px] w-full rounded-2xl bg-leaf text-white text-2xl font-bold shadow-md flex items-center justify-center gap-2 hover:bg-leaf/90"
              >
                <CheckCircle size={24} /> {t(lang, "simulateSuccess")}
              </button>

              <button
                onClick={() => {
                  setPayMethod("upi");
                  handleKioskPaymentOutcome(false);
                }}
                className="min-h-[64px] w-full rounded-2xl bg-brick text-white text-xl font-bold shadow-md flex items-center justify-center gap-2 hover:bg-brick/90"
              >
                <AlertCircle size={22} /> {t(lang, "simulateFailure")}
              </button>
            </div>
          </div>
        )}

        {/* Step: Payment Processing / Delayed */}
        {(step === "payment_processing" || step === "payment_delayed") && (
          <div className="flex flex-col items-center gap-6 py-12 text-center">
            <Loader2 className="animate-spin text-marigold-400" size={64} />
            <h2 className="text-2xl font-bold">{t(lang, "paymentProcessing")}</h2>
          </div>
        )}

        {/* Step: Payment Failed */}
        {step === "payment_failed" && (
          <div className="flex flex-col items-center gap-6 text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-brick flex items-center justify-center text-white">
              <AlertCircle size={44} />
            </div>
            <h2 className="text-3xl font-bold">{t(lang, "paymentFailedTitle")}</h2>
            <p className="text-teal-100">{t(lang, "paymentFailedSub")}</p>
            <button
              onClick={() => transitionTo("payment_choose")}
              className="min-h-[68px] w-full rounded-2xl bg-marigold-500 text-teal-950 text-xl font-bold shadow-md mt-4"
            >
              {t(lang, "paymentTryAgain")}
            </button>
          </div>
        )}

        {/* Step: Submitted Confirmation */}
        {step === "submitted" && (
          <div className="flex flex-col items-center gap-6 text-center max-w-xl">
            <div className="w-20 h-20 rounded-full bg-leaf flex items-center justify-center text-white shadow-lg">
              <Check size={48} />
            </div>
            <h1 className="font-display text-4xl font-bold">{t(lang, "submittedTitle")}</h1>
            <div className="bg-white/10 border-2 border-white/20 rounded-2xl p-6 w-full text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-teal-200">{t(lang, "requestId")}:</span>
                <span className="font-mono font-bold text-marigold-300 text-lg">{requestId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-teal-200">{t(lang, "authority")}:</span>
                <span className="font-bold">{getLocalizedDepartmentName(selectedAuthority || draft.authority, lang)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-teal-200">{t(lang, "date")}:</span>
                <span className="font-bold">{new Date().toLocaleDateString(LOCALE_MAP[lang] ?? "en-IN")}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3.5 w-full mt-2">
              <button
                onClick={printReceipt}
                className="min-h-[72px] w-full rounded-2xl bg-marigold-500 text-teal-950 text-xl font-bold flex items-center justify-center gap-3 shadow-md"
              >
                <Printer size={24} />
                <span>{receiptPrinted ? t(lang, "kioskReceiptPrinted") : isReceiptPrinting ? t(lang, "kioskReceiptPrinting") : t(lang, "kioskPrintReceipt")}</span>
              </button>

              <button
                onClick={() => transitionTo("tracking")}
                className="min-h-[64px] w-full rounded-2xl border-2 border-white/30 text-white text-lg font-bold"
              >
                {t(lang, "trackRequest")} →
              </button>
            </div>
          </div>
        )}

        {/* Step: Tracking */}
        {step === "tracking" && (
          <div className="flex flex-col gap-6 w-full max-w-xl">
            <h1 className="font-display text-3xl font-bold text-center">{t(lang, "trackingTitle")}</h1>
            <div className="bg-white/10 border-2 border-white/20 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 text-leaf font-bold">
                <CheckCircle size={24} />
                <span>{t(lang, "status_SUBMITTED")} — {t(lang, "status_registered_desc")}</span>
              </div>
              <div className="flex items-center gap-3 text-leaf font-bold">
                <CheckCircle size={24} />
                <span>{t(lang, "status_RECEIVED")} — {t(lang, "status_received_desc")}</span>
              </div>
              <div className="flex items-center gap-3 text-marigold-400 font-bold">
                <Clock size={24} />
                <span>{t(lang, "status_UNDER_REVIEW")} — {t(lang, "status_review_desc")}</span>
              </div>
            </div>

            <div className="bg-leaf/20 border border-leaf/40 rounded-2xl p-4 text-center">
              <p className="font-bold text-leaf text-lg">🟢 {t(lang, "noActionNeeded")}</p>
            </div>

            <button
              onClick={() => transitionTo("explain_status")}
              className="min-h-[64px] w-full rounded-2xl bg-white/10 border-2 border-white/30 text-white text-lg font-bold flex items-center justify-center gap-2"
            >
              <Info size={20} /> {t(lang, "explainUnderReview")}
            </button>
          </div>
        )}

        {/* Step: Under Review Explanation */}
        {step === "explain_status" && (
          <div className="flex flex-col gap-6 w-full max-w-xl text-center">
            <h1 className="font-display text-3xl font-bold">{t(lang, "explainUnderReviewTitle")}</h1>
            <div className="bg-white/10 border-2 border-white/20 rounded-2xl p-6 text-left space-y-4">
              <p className="text-xl text-teal-100 leading-relaxed font-medium">
                {t(lang, "explainUnderReviewElderlyText")}
              </p>
              <div className="pt-3 border-t border-white/10 text-sm text-marigold-300 font-bold">
                ✓ {t(lang, "appealDisposalTimeline")}
              </div>
            </div>
            <button
              onClick={resetSession}
              className="min-h-[68px] w-full rounded-2xl bg-marigold-500 text-teal-950 text-xl font-bold shadow-md"
            >
              {t(lang, "kioskFinish")}
            </button>
          </div>
        )}
      </main>

      {/* Accessible Timeout Modal */}
      {showTimeoutWarning && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-teal-900 border-3 border-marigold-400 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
            <Clock size={56} className="text-marigold-400 mx-auto animate-pulse" />
            <h2 className="font-display text-3xl font-bold text-white">{t(lang, "kioskTimeoutTitle")}</h2>
            <p className="text-teal-100 text-lg leading-relaxed">{t(lang, "kioskTimeoutSub")}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleContinueSession}
                className="min-h-[68px] w-full rounded-2xl bg-marigold-500 text-teal-950 text-2xl font-black shadow-lg"
              >
                {t(lang, "kioskTimeoutContinue")}
              </button>
              <button
                onClick={resetSession}
                className="min-h-[56px] w-full rounded-2xl border-2 border-white/30 text-white font-bold"
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
