import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ShieldCheck, Loader2, Camera, Shield, Check } from "lucide-react";
import Shell from "../components/Shell";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";
import { formatAadhaar, formatPan, maskAadhaar, maskPan } from "../utils/security";

type VerifyStep = "intro" | "choose" | "gov_id" | "camera" | "digilocker" | "processing" | "status";

export default function Verify() {
  const { lang, setVerified, setVerificationMethod, setVerificationDetails, currentUser } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<VerifyStep>("intro");

  // Government ID (Aadhaar / PAN) states
  const [idType, setIdType] = useState<"aadhaar" | "pan">("aadhaar");
  const [idValue, setIdValue] = useState("");
  const [otpVal, setOtpVal] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Camera / Document upload states
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Applicant details for confirmation
  const fullName = currentUser?.name || t(lang, "profileName");
  const citizenship = t(lang, "citizenshipValue");

  function handleSendIdOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (idType === "aadhaar") {
      const digits = idValue.replace(/\D/g, "");
      if (digits.length !== 12) {
        setError(t(lang, "errorAadhaar12"));
        return;
      }
    } else {
      const panFormatted = formatPan(idValue);
      if (panFormatted.length !== 10) {
        setError(t(lang, "errorPan10"));
        return;
      }
    }

    setIsOtpSent(true);
  }

  function handleVerifyIdOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (otpVal !== "123456") {
      setError(t(lang, "incorrectOtp"));
      return;
    }

    setVerificationMethod(idType === "aadhaar" ? "aadhaar_otp" : "pan_otp");
    setVerificationDetails({
      method: idType === "aadhaar" ? "Aadhaar Demo Verification" : "PAN Demo Verification",
      maskedId: idType === "aadhaar" ? maskAadhaar(idValue) : maskPan(idValue),
      citizenName: fullName
    });
    setStep("processing");
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCapturedImage(url);
      setVerificationMethod("camera_doc");
      setVerificationDetails({
        method: "ID Document Camera Verification",
        maskedId: "DOC-VERIFIED",
        citizenName: fullName
      });
    }
  }

  function handleDigiLockerConnect() {
    setVerificationMethod("digilocker");
    setVerificationDetails({
      method: "DigiLocker Demo Verification",
      maskedId: "DL-CITIZEN-9821",
      citizenName: fullName
    });
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
      navigate({ pathname: "/", search: searchParams.toString() });
    } else if (step === "choose") {
      setStep("intro");
    } else if (step === "gov_id" || step === "camera" || step === "digilocker") {
      setStep("choose");
      setError(null);
      setIsOtpSent(false);
    } else if (step === "status") {
      setStep("choose");
    }
  }

  return (
    <Shell onBack={handleBack}>
      <div className="flex flex-col gap-6 pt-4 max-w-md mx-auto">
        {/* Intro */}
        {step === "intro" && (
          <div className="flex flex-col gap-6 text-center items-center">
            <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 shadow-card">
              <ShieldCheck size={36} />
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

        {/* Choose Method */}
        {step === "choose" && (
          <div className="flex flex-col gap-5">
            <div className="text-center">
              <h1 className="font-display text-3xl font-semibold text-teal-900 mb-1">
                {t(lang, "verifyChooseTitle")}
              </h1>
              <p className="text-xs text-ink/60">
                {t(lang, "verifyChooseSub")}
              </p>
            </div>

            <div className="flex flex-col gap-3.5">
              <button
                onClick={() => {
                  setIdType("aadhaar");
                  setStep("gov_id");
                }}
                className="w-full text-left bg-white border-2 border-teal-100 hover:border-teal-500 rounded-card p-4 flex items-center gap-3.5 shadow-card transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 shrink-0">
                  <Shield size={20} />
                </div>
                <div>
                  <span className="font-bold text-base text-ink block">{t(lang, "verifyChooseGovId")}</span>
                  <span className="text-xs text-ink/65">{t(lang, "verifyChooseGovIdSub")}</span>
                </div>
              </button>

              <button
                onClick={() => setStep("camera")}
                className="w-full text-left bg-white border-2 border-teal-100 hover:border-teal-500 rounded-card p-4 flex items-center gap-3.5 shadow-card transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-marigold-100 flex items-center justify-center text-marigold-600 shrink-0">
                  <Camera size={20} />
                </div>
                <div>
                  <span className="font-bold text-base text-ink block">{t(lang, "verifyChooseCamera")}</span>
                  <span className="text-xs text-ink/65">{t(lang, "verifyChooseCameraSub")}</span>
                </div>
              </button>

              <button
                onClick={() => setStep("digilocker")}
                className="w-full text-left bg-white border-2 border-teal-100 hover:border-teal-500 rounded-card p-4 flex items-center gap-3.5 shadow-card transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <span className="font-bold text-base text-ink block">{t(lang, "verifyChooseDigiLocker")}</span>
                  <span className="text-xs text-ink/65">{t(lang, "verifyChooseDigiLockerSub")}</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Aadhaar / PAN OTP Flow */}
        {step === "gov_id" && (
          <div className="flex flex-col gap-5">
            <div className="text-center">
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wide">Demo Verification</span>
              <h2 className="font-display text-2xl font-bold text-teal-900">
                {idType === "aadhaar" ? "Demo Aadhaar Verification" : "Demo PAN Verification"}
              </h2>
            </div>

            <div className="bg-white border-2 border-teal-100 rounded-card p-5 space-y-4 shadow-card">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIdType("aadhaar");
                    setIdValue("");
                    setIsOtpSent(false);
                  }}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs border ${
                    idType === "aadhaar" ? "bg-teal-600 text-white border-teal-600" : "border-teal-200 text-teal-700"
                  }`}
                >
                  Aadhaar (12 Digits)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIdType("pan");
                    setIdValue("");
                    setIsOtpSent(false);
                  }}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs border ${
                    idType === "pan" ? "bg-teal-600 text-white border-teal-600" : "border-teal-200 text-teal-700"
                  }`}
                >
                  PAN Card (10 Chars)
                </button>
              </div>

              {!isOtpSent ? (
                <form onSubmit={handleSendIdOtp} className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-teal-700 uppercase tracking-wide">
                      {idType === "aadhaar" ? t(lang, "aadhaarLabel") : t(lang, "panLabel")}
                    </label>
                    <input
                      type="text"
                      placeholder={idType === "aadhaar" ? t(lang, "aadhaarPlaceholder") : t(lang, "panPlaceholder")}
                      value={idValue}
                      onChange={(e) =>
                        setIdValue(idType === "aadhaar" ? formatAadhaar(e.target.value) : formatPan(e.target.value))
                      }
                      className="w-full rounded-lg border border-teal-150 p-2.5 text-center text-xl font-mono tracking-widest text-ink focus-visible:outline-teal-500 bg-teal-50/20"
                    />
                  </div>

                  {error && <p className="text-sm text-brick text-center">{error}</p>}

                  <Button full type="submit">
                    {t(lang, "sendOtp")}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyIdOtp} className="space-y-4">
                  <div className="flex flex-col gap-1 text-center">
                    <label className="text-xs font-bold text-teal-700 uppercase tracking-wide">
                      {t(lang, "enterOtpSent")}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otpVal}
                      onChange={(e) => setOtpVal(e.target.value.replace(/\D/g, ""))}
                      className="w-full rounded-lg border border-teal-150 p-2.5 text-center text-2xl font-mono font-bold tracking-widest text-ink focus-visible:outline-teal-500 bg-teal-50/20"
                    />
                  </div>

                  {error && <p className="text-sm text-brick text-center">{error}</p>}

                  <div className="bg-marigold-50 text-marigold-800 text-xs font-bold px-3 py-1.5 rounded-lg text-center">
                    {t(lang, "demoOtpLabel")}
                  </div>

                  <Button full type="submit">
                    {t(lang, "verify")}
                  </Button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Camera / Upload Flow */}
        {step === "camera" && (
          <div className="flex flex-col gap-5 text-center">
            <div>
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wide">Document Capture</span>
              <h2 className="font-display text-2xl font-bold text-teal-900">
                {t(lang, "cameraCaptureTitle")}
              </h2>
            </div>

            <div className="bg-white border-2 border-teal-100 rounded-card p-6 shadow-card flex flex-col items-center gap-4">
              {capturedImage ? (
                <div className="flex flex-col items-center gap-3">
                  <img src={capturedImage} alt="Captured ID" className="max-h-48 rounded-lg object-contain border border-teal-100" />
                  <p className="text-xs font-bold text-leaf flex items-center gap-1">
                    <CheckCircle2 size={16} /> Document Ready for Verification
                  </p>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-3 p-6 border-2 border-dashed border-teal-200 rounded-xl w-full hover:bg-teal-50/30">
                  <Camera size={40} className="text-teal-600" />
                  <span className="font-bold text-sm text-teal-900">{t(lang, "takePhoto")}</span>
                  <span className="text-xs text-ink/50">Supports phone camera or file upload</span>
                  <input type="file" accept="image/*,application/pdf" capture="environment" onChange={handleFileUpload} className="hidden" />
                </label>
              )}

              {capturedImage && (
                <Button full onClick={() => setStep("processing")}>
                  {t(lang, "verify")}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* DigiLocker Flow */}
        {step === "digilocker" && (
          <div className="flex flex-col gap-6 text-center items-center">
            <div className="font-display text-3xl font-black text-teal-600">DigiLocker</div>
            <div className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {t(lang, "verifyConnectSub")}
            </div>
            <h2 className="font-display text-2xl font-bold text-teal-900">
              {t(lang, "verifyConnectTitle")}
            </h2>
            <p className="text-sm text-ink/80 leading-relaxed">
              {t(lang, "verifyConnectBody")}
            </p>
            <Button full onClick={handleDigiLockerConnect}>
              {t(lang, "verifyConnectButton")}
            </Button>
          </div>
        )}

        {/* Processing State */}
        {step === "processing" && (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <Loader2 className="animate-spin text-teal-600" size={48} />
            <h2 className="text-xl font-semibold text-teal-900">
              {t(lang, "verifyProcessing")}
            </h2>
          </div>
        )}

        {/* Verification Success Modal */}
        {step === "status" && (
          <div className="flex flex-col gap-6 items-center text-center">
            <div className="w-16 h-16 rounded-full bg-leaf/15 flex items-center justify-center text-leaf shadow-card">
              <Check size={36} />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-teal-900">
                {t(lang, "verifySuccessTitle")}
              </h1>
              <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-leaf/10 text-leaf text-xs font-bold uppercase tracking-wider">
                {t(lang, "verifySuccessBadge")}
              </span>
            </div>

            <div className="bg-white border-2 border-teal-100 rounded-card p-5 w-full text-left space-y-2.5 shadow-card">
              <div className="flex justify-between items-center text-sm border-b border-teal-50 pb-2">
                <span className="text-ink/60">Applicant:</span>
                <span className="font-bold text-ink">{fullName}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-teal-50 pb-2">
                <span className="text-ink/60">Citizenship:</span>
                <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded text-xs">
                  {citizenship}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-ink/60">Verification Status:</span>
                <span className="font-bold text-leaf flex items-center gap-1 text-xs">
                  <CheckCircle2 size={14} /> Completed
                </span>
              </div>
            </div>

            <p className="text-xs text-ink/60 bg-teal-50/60 rounded-lg p-3 text-center">
              {t(lang, "verifyStatusDisclaimer")}
            </p>

            <Button full onClick={() => navigate({ pathname: "/dashboard", search: searchParams.toString() })}>
              {t(lang, "continue")} →
            </Button>
          </div>
        )}
      </div>
    </Shell>
  );
}
