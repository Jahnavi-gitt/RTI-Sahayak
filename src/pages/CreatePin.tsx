import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock } from "lucide-react";
import Shell from "../components/Shell";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";
import { hashPin } from "../utils/security";

export default function CreatePin() {
  const { lang, setCurrentUser, setUserPinHash } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const phone = searchParams.get("phone") || "9876543210";

  const [pin, setPin] = useState("");
  const [confirmPinVal, setConfirmPinVal] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (pin.length !== 6 || confirmPinVal.length !== 6) {
      setError(t(lang, "errorInvalidPin"));
      return;
    }

    if (pin !== confirmPinVal) {
      setError(t(lang, "pinMismatch"));
      return;
    }

    // SHA-256 secure hash calculation (does not print pin values to console)
    const pinHash = await hashPin(pin);
    setUserPinHash(pinHash);
    setCurrentUser({ phone, name: "Demo Citizen" });

    navigate("/verify");
  }

  return (
    <Shell hideChrome>
      <div className="flex flex-col gap-6 pt-8 max-w-md mx-auto">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 shadow-card">
            <Lock size={32} />
          </div>
          <h1 className="font-display text-3xl font-semibold text-teal-900">
            {t(lang, "createPin")}
          </h1>
          <p className="text-base text-ink/80 leading-relaxed">
            {t(lang, "enterPinSub")}
          </p>
        </div>

        <form onSubmit={handleCreateAccount} className="flex flex-col gap-5">
          <div className="bg-white border-2 border-teal-100 rounded-card p-5 shadow-card space-y-4">
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
                className="w-full text-center text-2xl font-mono tracking-widest border border-teal-150 rounded-lg p-2.5 bg-teal-50/20 text-ink focus-visible:outline-teal-500"
              />
            </div>

            {error && (
              <p className="text-sm text-brick font-medium text-center" role="alert">
                {error}
              </p>
            )}

            <p className="text-xs text-ink/50 text-center leading-relaxed">
              {t(lang, "verifyStatusDisclaimer")}
            </p>
          </div>

          <Button full type="submit">
            {t(lang, "createAccount")}
          </Button>
        </form>
      </div>
    </Shell>
  );
}
