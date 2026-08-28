import { Volume2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";

const LOCALE_MAP: Record<string, string> = {
  en: "en-IN",
  ta: "ta-IN",
  hi: "hi-IN",
  te: "te-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  bn: "bn-IN",
  mr: "mr-IN",
};

export default function ListenButton({ text }: { text: string }) {
  const { lang } = useApp();

  function speak() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = LOCALE_MAP[lang] ?? "en-IN";
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  }

  return (
    <button
      type="button"
      onClick={speak}
      aria-label={t(lang, "listen")}
      className="inline-flex items-center gap-1.5 text-teal-700 text-sm font-semibold px-3 py-2 rounded-full border border-teal-200 hover:bg-teal-50 min-h-[44px]"
    >
      <Volume2 size={18} aria-hidden="true" />
      {t(lang, "listen")}
    </button>
  );
}
