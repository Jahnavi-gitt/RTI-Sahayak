import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Check } from "lucide-react";
import Shell from "../components/Shell";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";
import { LANG_LABELS, t } from "../i18n/strings";
import type { Lang } from "../types";
import { obscurePhoneNumber, hashPin } from "../utils/security";

export default function Profile() {
  const { lang, setLang, currentUser, resetAuth, setUserPinHash } = useApp();
  const navigate = useNavigate();

  const [pinMode, setPinMode] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPinVal, setConfirmPinVal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!currentUser) {
    navigate("/");
    return null;
  }

  async function handlePinChange(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

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
    setSuccess(t(lang, "pinUpdatedSuccess"));
    setPinMode(false);
    setNewPin("");
    setConfirmPinVal("");
  }

  function handleLogout() {
    resetAuth();
    navigate("/");
  }

  return (
    <Shell step={undefined} hideChrome={false}>
      <div className="flex flex-col gap-6 pt-2 max-w-md mx-auto">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 shadow-card">
            <User size={32} />
          </div>
          <h1 className="font-display text-3xl font-semibold text-teal-900">
            {t(lang, "profileTitle")}
          </h1>
          <p className="text-base text-ink/80 leading-relaxed">
            {t(lang, "profileName")}
          </p>
        </div>

        <div className="bg-white border-2 border-teal-100 rounded-card p-5 shadow-card space-y-4">
          {/* Details */}
          <div className="flex justify-between items-center border-b border-teal-50 pb-3">
            <span className="text-sm text-ink/50">{t(lang, "profilePhone")}</span>
            <span className="font-semibold text-ink">{obscurePhoneNumber(currentUser.phone)}</span>
          </div>

          {/* Language selector */}
          <div className="flex flex-col gap-1.5 border-b border-teal-50 pb-3">
            <span className="text-sm text-ink/50">{t(lang, "profileLanguage")}</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className="w-full min-h-[48px] rounded-lg border border-teal-200 bg-white px-3 text-sm font-semibold text-teal-700 focus-visible:outline-teal-500 mt-1"
            >
              {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
                <option key={l} value={l}>
                  {LANG_LABELS[l]}
                </option>
              ))}
            </select>
          </div>

          {/* Security PIN edit */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-sm text-ink/50 font-bold uppercase tracking-wide">
              {t(lang, "profileSecurity")}
            </span>

            {success && (
              <div className="bg-leaf/10 border border-leaf/30 p-3 rounded-lg text-leaf text-sm flex items-center gap-2 font-medium">
                <Check size={16} /> {success}
              </div>
            )}

            {!pinMode ? (
              <button
                onClick={() => setPinMode(true)}
                className="text-left font-bold text-teal-700 hover:underline py-1.5 text-sm"
              >
                {t(lang, "profileChangePin")}
              </button>
            ) : (
              <form onSubmit={handlePinChange} className="space-y-3.5 mt-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-teal-600 uppercase tracking-wide">
                    {t(lang, "createPin")}
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-center text-xl font-mono tracking-widest border border-teal-150 rounded-lg p-2 bg-teal-50/20 text-ink focus-visible:outline-teal-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-teal-600 uppercase tracking-wide">
                    {t(lang, "confirmPin")}
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={confirmPinVal}
                    onChange={(e) => setConfirmPinVal(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-center text-xl font-mono tracking-widest border border-teal-150 rounded-lg p-2 bg-teal-50/20 text-ink focus-visible:outline-teal-500"
                  />
                </div>

                {error && (
                  <p className="text-sm text-brick font-medium text-center" role="alert">
                    {error}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 min-h-[44px] rounded-lg bg-teal-600 text-white font-bold text-sm hover:bg-teal-700"
                  >
                    {t(lang, "savePin")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPinMode(false);
                      setError(null);
                    }}
                    className="flex-1 min-h-[44px] rounded-lg border border-teal-200 text-ink/75 font-semibold text-sm hover:bg-teal-50"
                  >
                    {t(lang, "cancel")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <Button full variant="secondary" onClick={handleLogout}>
          <span className="flex items-center justify-center gap-2">
            <LogOut size={16} /> {t(lang, "logout")}
          </span>
        </Button>
      </div>
    </Shell>
  );
}
