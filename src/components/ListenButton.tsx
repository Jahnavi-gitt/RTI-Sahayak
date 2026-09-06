import { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";
import { speakText, stopSpeaking } from "../services/tts";

export default function ListenButton({ text, label, className }: { text: string; label?: string; className?: string }) {
  const { lang } = useApp();
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      setSpeaking(false);
    };
  }, []);

  function toggleSpeak() {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }

    setSpeaking(true);
    speakText(text, lang, {
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }

  const displayLabel = label || t(lang, "listen");

  return (
    <button
      type="button"
      onClick={toggleSpeak}
      aria-label={displayLabel}
      className={className || `inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-full border min-h-[44px] active:scale-95 transition-all ${
        speaking 
          ? "bg-teal-600 text-white border-teal-600 shadow-xs" 
          : "text-teal-700 border-teal-200 hover:bg-teal-50"
      }`}
    >
      {speaking ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
      {displayLabel}
    </button>
  );
}

