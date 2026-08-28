import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Key } from "lucide-react";
import Shell from "../components/Shell";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";
import { obscurePhoneNumber } from "../utils/security";

export default function VerifyOtp() {
  const { lang, setCurrentUser } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const phone = searchParams.get("phone") || "9876543210";
  const mode = searchParams.get("mode") || "signup";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (otp !== "123456") {
      setError(t(lang, "incorrectOtp"));
      return;
    }

    if (mode === "signup") {
      navigate(`/create-pin?phone=${phone}`);
    } else {
      // Sign in complete
      setCurrentUser({ phone, name: "Demo Citizen" });
      navigate("/dashboard");
    }
  }

  return (
    <Shell hideChrome>
      <div className="flex flex-col gap-6 pt-8 max-w-md mx-auto">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 shadow-card">
            <Key size={32} />
          </div>
          <h1 className="font-display text-3xl font-semibold text-teal-900">
            {t(lang, "verifyOtp")}
          </h1>
          <p className="text-base text-ink/80 leading-relaxed">
            We sent a verification code to {obscurePhoneNumber(phone)}
          </p>
        </div>

        <form onSubmit={handleVerify} className="flex flex-col gap-5">
          <div className="bg-white border-2 border-teal-100 rounded-card p-5 shadow-card space-y-4">
            <div className="flex flex-col gap-1 text-center">
              <label className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-1">
                {t(lang, "enterOtpSent")}
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="0 0 0 0 0 0"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full text-center text-2xl font-mono tracking-widest font-bold border border-teal-150 rounded-lg p-2.5 bg-teal-50/20 text-ink focus-visible:outline-teal-500"
              />
            </div>

            {error && (
              <p className="text-sm text-brick font-medium text-center" role="alert">
                {error}
              </p>
            )}

            <div className="bg-marigold-50 text-marigold-800 text-xs font-bold px-3 py-2 rounded-lg text-center">
              {t(lang, "demoOtpLabel")}
            </div>

            <p className="text-xs text-ink/50 text-center leading-relaxed">
              {t(lang, "verifyStatusDisclaimer")}
            </p>
          </div>

          <Button full type="submit">
            {t(lang, "verify")}
          </Button>

          <Button
            full
            variant="secondary"
            type="button"
            onClick={() => {
              setOtp("");
              setError(null);
              alert("Mock OTP Resent! Use 123456.");
            }}
          >
            {t(lang, "resendOtp")}
          </Button>
        </form>
      </div>
    </Shell>
  );
}
