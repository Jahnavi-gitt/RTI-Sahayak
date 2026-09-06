import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { KeyRound, CheckCircle2 } from "lucide-react";
import Shell from "../components/Shell";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";
import { hashPin, obscurePhoneNumber } from "../utils/security";

type ForgotStep = "phone" | "otp" | "new_pin" | "success";

export default function ForgotPin() {
  const { lang, setUserPinHash } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState<ForgotStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPinVal, setConfirmPinVal] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length !== 10) {
      setError(t(lang, "errorInvalidMobile"));
      return;
    }
    setStep("otp");
  }

  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (otp !== "123456") {
      setError(t(lang, "incorrectOtp"));
      return;
    }
    setStep("new_pin");
  }

  async function handleResetPin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPin.length !== 6 || confirmPinVal.length !== 6) {
      setError(t(lang, "errorInvalidPin"));
      return;
    }

    if (newPin !== confirmPinVal) {
      setError(t(lang, "pinMismatch"));
      return;
    }

    const hashed = await hashPin(newPin);
    setUserPinHash(hashed);
    setStep("success");
  }

  return (
    <Shell hideChrome>
      <div className="flex flex-col gap-6 pt-6 max-w-md mx-auto">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 shadow-card">
            <KeyRound size={32} />
          </div>
          <h1 className="font-display text-3xl font-semibold text-teal-900">
            {t(lang, "forgotPinTitle")}
          </h1>
          <p className="text-base text-ink/80 leading-relaxed">
            {t(lang, "forgotPinSub")}
          </p>
        </div>

        {/* Step 1: Phone */}
        {step === "phone" && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
            <div className="bg-white border-2 border-teal-100 rounded-card p-5 shadow-card space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-teal-700 uppercase tracking-wide">
                  {t(lang, "mobileNumber")}
                </label>
                <div className="flex items-center border border-teal-150 rounded-lg p-2.5 bg-teal-50/20">
                  <span className="text-ink font-semibold mr-2">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-ink font-medium focus-visible:outline-none bg-transparent"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-brick font-medium">{error}</p>}
            </div>

            <Button full type="submit">
              {t(lang, "sendOtp")}
            </Button>

            <Link to="/signin" className="text-center text-sm text-teal-700 font-bold hover:underline">
              ← {t(lang, "back")} to {t(lang, "signIn")}
            </Link>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
            <div className="bg-white border-2 border-teal-100 rounded-card p-5 shadow-card space-y-4 text-center">
              <p className="text-sm text-ink/70">
                {t(lang, "enterOtpSent")} ({obscurePhoneNumber(phone)})
              </p>
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full text-center text-2xl font-mono tracking-widest font-bold border border-teal-150 rounded-lg p-2.5 bg-teal-50/20 text-ink"
              />
              {error && <p className="text-sm text-brick font-medium">{error}</p>}
              <div className="bg-marigold-50 text-marigold-800 text-xs font-bold px-3 py-2 rounded-lg">
                {t(lang, "demoOtpLabel")}
              </div>
            </div>

            <Button full type="submit">
              {t(lang, "verifyOtp")}
            </Button>
          </form>
        )}

        {/* Step 3: New PIN */}
        {step === "new_pin" && (
          <form onSubmit={handleResetPin} className="flex flex-col gap-5">
            <div className="bg-white border-2 border-teal-100 rounded-card p-5 shadow-card space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-teal-700 uppercase tracking-wide">
                  {t(lang, "enterPin")} (6 Digits)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-center text-2xl font-mono tracking-widest border border-teal-150 rounded-lg p-2.5 bg-teal-50/20 text-ink"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-teal-700 uppercase tracking-wide">
                  {t(lang, "confirmPin")}
                </label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={confirmPinVal}
                  onChange={(e) => setConfirmPinVal(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-center text-2xl font-mono tracking-widest border border-teal-150 rounded-lg p-2.5 bg-teal-50/20 text-ink"
                />
              </div>

              {error && <p className="text-sm text-brick font-medium text-center">{error}</p>}
            </div>

            <Button full type="submit">
              {t(lang, "resetPin")}
            </Button>
          </form>
        )}

        {/* Step 4: Success */}
        {step === "success" && (
          <div className="flex flex-col items-center gap-6 text-center bg-white border-2 border-teal-100 rounded-card p-6 shadow-card">
            <div className="w-16 h-16 rounded-full bg-leaf/10 flex items-center justify-center text-leaf">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-teal-900 mb-2">{t(lang, "pinUpdatedSuccess")}</h2>
              <p className="text-sm text-ink/70">{t(lang, "resetPinSuccess")}</p>
            </div>
            <Button full onClick={() => navigate("/signin")}>
              {t(lang, "signIn")}
            </Button>
          </div>
        )}
      </div>
    </Shell>
  );
}
