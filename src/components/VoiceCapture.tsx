import { useEffect, useRef, useState, useCallback } from "react";
import { Mic, Check } from "lucide-react";
import { useApp } from "../context/AppContext";
import { LOCALE_MAP, t } from "../i18n/strings";

interface Props {
  onResult: (text: string) => void;
  onPartialResult?: (text: string) => void;
  label: string;
  listeningLabel: string;
  isKiosk?: boolean;
  silenceTimeoutMs?: number;
}

export default function VoiceCapture({
  onResult,
  onPartialResult,
  label,
  listeningLabel,
  isKiosk = false,
  silenceTimeoutMs = 7000
}: Props) {
  const { lang } = useApp();
  const [listening, setListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const isSupported = typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const finalTranscriptRef = useRef("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Store callbacks in refs to prevent parent re-renders from recreating recognition instances
  const onResultRef = useRef(onResult);
  const onPartialResultRef = useRef(onPartialResult);
  const langRef = useRef(lang);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    onPartialResultRef.current = onPartialResult;
  }, [onPartialResult]);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const finishListening = useCallback(() => {
    isListeningRef.current = false;
    clearSilenceTimer();
    clearRestartTimer();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors if already stopped
      }
      recognitionRef.current = null;
    }

    setListening(false);
    const finalized = finalTranscriptRef.current.trim();
    if (finalized) {
      onResultRef.current(finalized);
    }
  }, [clearSilenceTimer, clearRestartTimer]);

  const createRecognitionRef = useRef<(() => any) | null>(null);

  const createRecognition = useCallback(() => {
    const SpeechRecognition = typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

    if (!SpeechRecognition) {
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = LOCALE_MAP[langRef.current] ?? "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        const transcript = item[0]?.transcript || "";
        if (item.isFinal) {
          const trimmed = transcript.trim();
          if (trimmed) {
            finalTranscriptRef.current += (finalTranscriptRef.current ? " " : "") + trimmed;
          }
        } else {
          interim += transcript;
        }
      }

      const combined = (finalTranscriptRef.current + " " + interim).trim();
      setLiveTranscript(combined);
      if (onPartialResultRef.current) {
        onPartialResultRef.current(combined);
      }

      // Natural pause grace period: 7 seconds of complete silence before auto-finish
      clearSilenceTimer();
      silenceTimerRef.current = setTimeout(() => {
        if (isListeningRef.current) {
          console.log("[VoiceCapture] Silence timeout reached, completing recognition.");
          finishListening();
        }
      }, silenceTimeoutMs);
    };

    recognition.onerror = (event: any) => {
      console.log("[VoiceCapture] Recognition event notice:", event.error);
      if (event.error === "no-speech") {
        // Natural pause caused no-speech event; keep session active
        return;
      }
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        isListeningRef.current = false;
        setListening(false);
        clearSilenceTimer();
      }
    };

    recognition.onend = () => {
      // If user is still actively recording, restart safely to handle browser auto-disconnects
      if (isListeningRef.current) {
        clearRestartTimer();
        restartTimerRef.current = setTimeout(() => {
          if (isListeningRef.current && createRecognitionRef.current) {
            try {
              const nextRec = createRecognitionRef.current();
              recognitionRef.current = nextRec;
              nextRec?.start();
            } catch (err) {
              console.warn("[VoiceCapture] Session restart notice:", err);
            }
          }
        }, 50);
      } else {
        setListening(false);
      }
    };

    return recognition;
  }, [silenceTimeoutMs, clearSilenceTimer, clearRestartTimer, finishListening]);

  useEffect(() => {
    createRecognitionRef.current = createRecognition;
  }, [createRecognition]);

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      clearSilenceTimer();
      clearRestartTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, [clearSilenceTimer, clearRestartTimer]);

  if (!isSupported) return null;

  function startListening() {
    clearSilenceTimer();
    clearRestartTimer();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    finalTranscriptRef.current = "";
    setLiveTranscript("");
    isListeningRef.current = true;
    setListening(true);

    try {
      const recognition = createRecognition();
      recognitionRef.current = recognition;
      recognition?.start();

      // Initial silence timer (7 seconds to start speaking)
      silenceTimerRef.current = setTimeout(() => {
        if (isListeningRef.current && !finalTranscriptRef.current.trim()) {
          console.log("[VoiceCapture] Initial silence timeout, ending listening.");
          finishListening();
        }
      }, silenceTimeoutMs);
    } catch (err) {
      console.error("[VoiceCapture] Recognition start failed:", err);
      setListening(false);
      isListeningRef.current = false;
    }
  }

  function handleDone() {
    finishListening();
  }

  if (listening) {
    return (
      <div
        className={`w-full flex flex-col gap-3 p-4 rounded-2xl border-2 transition-all ${
          isKiosk
            ? "bg-white/15 border-marigold-400 text-white shadow-xl"
            : "bg-marigold-50/80 border-marigold-400 shadow-md"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-marigold-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-marigold-500"></span>
            </span>
            <span className={`font-bold text-base sm:text-lg ${isKiosk ? "text-marigold-300" : "text-marigold-900"}`}>
              {listeningLabel || t(lang, "kioskRecordingLive")}
            </span>
          </div>

          <button
            type="button"
            onClick={handleDone}
            className={`min-h-[48px] px-5 py-2 rounded-xl font-bold text-sm sm:text-base flex items-center gap-2 shadow-md transition-transform active:scale-95 ${
              isKiosk
                ? "bg-marigold-500 hover:bg-marigold-400 text-teal-950 font-black"
                : "bg-teal-700 hover:bg-teal-800 text-white"
            }`}
          >
            <Check size={18} />
            <span>{t(lang, "kioskDoneSpeaking")}</span>
          </button>
        </div>

        {liveTranscript ? (
          <div
            className={`p-3 rounded-xl text-base sm:text-lg font-medium leading-relaxed italic max-h-32 overflow-y-auto ${
              isKiosk ? "bg-black/20 text-white border border-white/20" : "bg-white text-ink border border-marigold-200"
            }`}
          >
            “{liveTranscript}”
          </div>
        ) : (
          <p className={`text-xs sm:text-sm font-medium ${isKiosk ? "text-teal-200" : "text-ink/60"}`}>
            {t(lang, "voiceListeningHint")}
          </p>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startListening}
      className={`min-h-[64px] w-full rounded-card border-2 flex items-center justify-center gap-3 text-lg font-semibold transition-all shadow-xs ${
        isKiosk
          ? "bg-marigold-500 hover:bg-marigold-400 border-marigold-400 text-teal-950 font-bold min-h-[72px] text-xl active:scale-95"
          : "bg-white border-teal-600 text-teal-700 hover:bg-teal-50 active:scale-98"
      }`}
    >
      <Mic size={24} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

