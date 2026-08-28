import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import Shell from "../components/Shell";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";

export default function SignUp() {
  const { lang } = useApp();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate Indian mobile number format (10 digits starting with 6-9)
    const cleaned = phone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      setError(t(lang, "errorInvalidMobileStarts"));
      return;
    }

    navigate(`/verify-otp?phone=${cleaned}&mode=signup`);
  }

  return (
    <Shell hideChrome>
      <div className="flex flex-col gap-6 pt-8 max-w-md mx-auto">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 shadow-card">
            <UserPlus size={32} />
          </div>
          <h1 className="font-display text-3xl font-semibold text-teal-900">
            {t(lang, "signUp")}
          </h1>
          <p className="text-base text-ink/80 leading-relaxed">
            {t(lang, "enterMobileRegister")}
          </p>
        </div>

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

            {error && (
              <p className="text-sm text-brick font-medium" role="alert">
                {error}
              </p>
            )}

            <p className="text-xs text-ink/50 text-center leading-relaxed">
              {t(lang, "verifyStatusDisclaimer")}
            </p>
          </div>

          <Button full type="submit">
            {t(lang, "sendOtp")}
          </Button>
        </form>

        <p className="text-center text-sm text-ink/70">
          {t(lang, "alreadyHaveAccount")}{" "}
          <Link to="/signin" className="text-teal-700 font-bold hover:underline">
            {t(lang, "signIn")}
          </Link>
        </p>
      </div>
    </Shell>
  );
}
