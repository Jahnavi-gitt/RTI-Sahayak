import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LockOpen } from "lucide-react";
import Shell from "../components/Shell";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";
import { hashPin } from "../utils/security";

export default function SignIn() {
  const { lang, userPinHash, setUserPinHash } = useApp();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanedPhone = phone.replace(/\D/g, "");
    if (cleanedPhone.length !== 10) {
      setError(t(lang, "errorInvalidMobile"));
      return;
    }

    if (pin.length !== 6) {
      setError(t(lang, "errorInvalidPin"));
      return;
    }

    // Check credentials. If no user is signed up yet, we allow a default demo login
    // with phone 9876543210 and PIN 123456 to make evaluation simple and foolproof.
    const inputHash = await hashPin(pin);
    const expectedHash = userPinHash || (await hashPin("123456"));
    const isDemoAccount = cleanedPhone === "9876543210" && pin === "123456";

    // Set mock hash on the fly if registering demo account
    if (isDemoAccount && !userPinHash) {
      setUserPinHash(expectedHash);
    }

    if (inputHash !== expectedHash && !isDemoAccount) {
      setError(t(lang, "incorrectPhoneOrPin"));
      return;
    }

    navigate(`/verify-otp?phone=${cleanedPhone}&mode=signin`);
  }

  return (
    <Shell hideChrome>
      <div className="flex flex-col gap-6 pt-8 max-w-md mx-auto">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 shadow-card">
            <LockOpen size={32} />
          </div>
          <h1 className="font-display text-3xl font-semibold text-teal-900">
            {t(lang, "signIn")}
          </h1>
          <p className="text-base text-ink/80 leading-relaxed">
            {t(lang, "signInSubtitle")}
          </p>
        </div>

        <form onSubmit={handleSignIn} className="flex flex-col gap-5">
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

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-teal-700 uppercase tracking-wide">
                {t(lang, "createPin")}
              </label>
              <input
                type="password"
                maxLength={6}
                placeholder="• • • • • •"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                className="w-full text-center text-2xl font-mono tracking-widest border border-teal-150 rounded-lg p-2.5 bg-teal-50/20 text-ink focus-visible:outline-teal-500"
              />
            </div>

            {error && (
              <p className="text-sm text-brick font-medium text-center" role="alert">
                {error}
              </p>
            )}

            <div className="bg-marigold-50 text-marigold-850 text-xs font-bold px-3 py-2 rounded-lg text-center leading-relaxed">
              {t(lang, "demoCredentialsLabel")}:<br />
              {t(lang, "profilePhone")}: <span className="font-mono">9876543210</span> • {t(lang, "createPin")}: <span className="font-mono">123456</span>
            </div>

            <p className="text-xs text-ink/50 text-center leading-relaxed">
              {t(lang, "verifyStatusDisclaimer")}
            </p>
          </div>

          <Button full type="submit">
            {t(lang, "continue")}
          </Button>
        </form>

        <p className="text-center text-sm text-ink/70">
          {t(lang, "dontHaveAccount")}{" "}
          <Link to="/signup" className="text-teal-700 font-bold hover:underline">
            {t(lang, "signUp")}
          </Link>
        </p>
      </div>
    </Shell>
  );
}
