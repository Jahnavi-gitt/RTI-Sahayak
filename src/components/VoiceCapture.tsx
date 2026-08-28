import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { useApp } from "../context/AppContext";

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

interface Props {
  onResult: (text: string) => void;
  label: string;
  listeningLabel: string;
}

// Uses the Web Speech API where the browser supports it (most Chromium
// browsers). If unsupported, the button is hidden and the caller should
// fall back to typing — this matches the brief's requirement that typing
// always remains available.
export default function VoiceCapture({ onResult, label, listeningLabel }: Props) {
  const { lang } = useApp();
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = LOCALE_MAP[lang] ?? "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      onResult(text);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    return () => recognition.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  if (!supported) return null;

  function toggle() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setListening(true);
      } catch {
        setListening(false);
      }
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={listening}
      className={`min-h-[64px] w-full rounded-card border-2 flex items-center justify-center gap-3 text-lg font-semibold transition-colors ${
        listening
          ? "bg-marigold-100 border-marigold-500 text-marigold-600 animate-pulse"
          : "bg-white border-teal-600 text-teal-700 hover:bg-teal-50"
      }`}
    >
      {listening ? <MicOff size={22} aria-hidden="true" /> : <Mic size={22} aria-hidden="true" />}
      {listening ? listeningLabel : label}
    </button>
  );
}
