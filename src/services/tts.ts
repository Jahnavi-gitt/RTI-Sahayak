import { LOCALE_MAP } from "../i18n/strings.ts";
import type { Lang } from "../types";

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err?: any) => void;
}

// Global active utterance set to defeat Chrome garbage-collection bug
declare global {
  interface Window {
    __activeUtterances?: Set<SpeechSynthesisUtterance>;
    __ttsVoicesPreloaded?: boolean;
    __ttsKeepAliveInterval?: ReturnType<typeof setInterval> | null;
  }
}

let cachedVoices: SpeechSynthesisVoice[] = [];
let voiceLoadingPromise: Promise<SpeechSynthesisVoice[]> | null = null;

// Global speech generation token. Every stop/start increments this.
// Any async operations matching an older generation are immediately aborted.
let speechGeneration = 0;

// Track active fallback HTMLAudioElement and active timers
let activeFallbackAudio: HTMLAudioElement | null = null;
let activePendingTimeout: ReturnType<typeof setTimeout> | null = null;
let activeSafetyTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Initialize and update cached voices from the browser speechSynthesis API.
 */
function updateVoicesList(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return [];
  }
  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    cachedVoices = voices;
  }
  return cachedVoices;
}

/**
 * Setup persistent voice listeners so whenever the browser finishes loading voices,
 * cachedVoices is updated immediately.
 */
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  updateVoicesList();
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    updateVoicesList();
  });
  if ("onvoiceschanged" in window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
      updateVoicesList();
    };
  }
}

/**
 * Load system/browser voices reliably with fallback timeout and voiceschanged listener.
 */
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return Promise.resolve([]);
  }

  const current = updateVoicesList();
  if (current.length > 0) {
    return Promise.resolve(current);
  }

  if (voiceLoadingPromise) {
    return voiceLoadingPromise;
  }

  voiceLoadingPromise = new Promise((resolve) => {
    const onVoices = () => {
      const v = updateVoicesList();
      if (v.length > 0) {
        window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
        voiceLoadingPromise = null;
        resolve(v);
      }
    };

    window.speechSynthesis.addEventListener("voiceschanged", onVoices);

    // 250ms fallback timeout if browser does not fire voiceschanged
    setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
      const v = updateVoicesList();
      voiceLoadingPromise = null;
      resolve(v);
    }, 250);
  });

  return voiceLoadingPromise;
}

/**
 * Find the most suitable voice for the requested language.
 */
export function findBestVoice(lang: Lang, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  // MALAYALAM SPECIFIC VOICE RESOLUTION
  if (lang === "ml") {
    // 1. Exact locale match: ml-IN
    const mlInVoice = voices.find((v) => v.lang.toLowerCase().replace("_", "-") === "ml-in");
    if (mlInVoice) return mlInVoice;

    // 2. Language code: ml
    const mlVoice = voices.find((v) => v.lang.toLowerCase() === "ml");
    if (mlVoice) return mlVoice;

    // 3. Language starts with "ml"
    const mlPrefixVoice = voices.find((v) => v.lang.toLowerCase().startsWith("ml"));
    if (mlPrefixVoice) return mlPrefixVoice;

    // 4. Name contains "malayalam"
    const mlNameVoice = voices.find(
      (v) => v.name.toLowerCase().includes("malayalam") || v.name.toLowerCase().includes("ml-in")
    );
    if (mlNameVoice) return mlNameVoice;

    return null;
  }

  // MARATHI SPECIFIC VOICE RESOLUTION
  if (lang === "mr") {
    const mrExact = voices.find((v) => v.lang.toLowerCase().replace("_", "-") === "mr-in");
    if (mrExact) return mrExact;

    const mrPrefix = voices.find((v) => v.lang.toLowerCase().startsWith("mr"));
    if (mrPrefix) return mrPrefix;

    const mrName = voices.find((v) => v.name.toLowerCase().includes("marathi") || v.name.toLowerCase().includes("mr-in"));
    if (mrName) return mrName;

    // Devanagari compatibility for Marathi
    const devanagariVoice = voices.find((v) => {
      const vl = v.lang.toLowerCase();
      const vn = v.name.toLowerCase();
      return vl.startsWith("hi") || vl.includes("hi-in") || vn.includes("hindi") || vn.includes("lekha") || vn.includes("kalpana");
    });
    if (devanagariVoice) return devanagariVoice;

    const indianVoice = voices.find((v) => v.lang.toLowerCase().includes("-in") || v.name.toLowerCase().includes("india"));
    if (indianVoice) return indianVoice;

    return voices.find((v) => v.default) || voices[0] || null;
  }

  // OTHER LANGUAGES (hi, te, ta, kn, bn, en)
  const targetLocale = (LOCALE_MAP[lang] ?? "en-IN").toLowerCase().replace("_", "-");
  const targetPrefix = targetLocale.split("-")[0];

  const exact = voices.find((v) => v.lang.toLowerCase().replace("_", "-") === targetLocale);
  if (exact) return exact;

  const prefixMatch = voices.find((v) => {
    const vLang = v.lang.toLowerCase().replace("_", "-");
    return vLang === targetPrefix || vLang.startsWith(targetPrefix + "-") || vLang.startsWith(targetPrefix + "_");
  });
  if (prefixMatch) return prefixMatch;

  const langNameMap: Record<Lang, string[]> = {
    hi: ["hindi", "hi-in", "hi_in", "swara", "madhur", "kalpana", "hemant", "lekha", "kavya"],
    te: ["telugu", "te-in", "te_in", "mohan", "shruti", "geetha", "chitra"],
    ta: ["tamil", "ta-in", "ta_in", "valluvar", "iniya", "saranya"],
    kn: ["kannada", "kn-in", "kn_in", "gagan", "sapna", "shruthi"],
    bn: ["bengali", "bangla", "bn-in", "bn_in", "bashkar", "tanishaa", "deepa"],
    en: ["india", "indian", "en-in", "en_in", "rishi", "neerja", "veena", "prabhat", "anjali"],
    ml: ["malayalam"],
    mr: ["marathi"]
  };

  const keywords = langNameMap[lang] || [];
  const nameMatch = voices.find((v) => {
    const vName = v.name.toLowerCase();
    const vLang = v.lang.toLowerCase();
    return keywords.some((kw) => vName.includes(kw) || vLang.includes(kw));
  });
  if (nameMatch) return nameMatch;

  const indianVoice = voices.find((v) => v.lang.toLowerCase().includes("-in") || v.name.toLowerCase().includes("india"));
  if (indianVoice) return indianVoice;

  return voices.find((v) => v.default) || voices[0] || null;
}

/**
 * Split long text into natural sentence chunks (<= 180 characters).
 */
export function chunkText(text: string, maxLen = 180): string[] {
  const clean = text.trim();
  if (clean.length <= maxLen) return [clean];

  const sentences = clean.match(/[^.!?\n।॥]+[.!?\n।॥]*/g) || [clean];
  const chunks: string[] = [];
  let cur = "";

  for (const s of sentences) {
    if ((cur + " " + s).trim().length <= maxLen) {
      cur = (cur ? cur + " " + s : s).trim();
    } else {
      if (cur) chunks.push(cur);
      if (s.length > maxLen) {
        const words = s.split(/\s+/);
        let wChunk = "";
        for (const w of words) {
          if ((wChunk + " " + w).trim().length <= maxLen) {
            wChunk = (wChunk ? wChunk + " " + w : w).trim();
          } else {
            if (wChunk) chunks.push(wChunk);
            wChunk = w;
          }
        }
        cur = wChunk;
      } else {
        cur = s.trim();
      }
    }
  }
  if (cur) chunks.push(cur);
  return chunks.length > 0 ? chunks : [clean];
}

/**
 * HARD STOP all ongoing speech, both browser SpeechSynthesis and fallback HTMLAudioElement.
 * Increments speechGeneration to invalidate all pending async TTS operations.
 */
export function stopAllSpeech(): void {
  // Invalidate any ongoing or pending asynchronous TTS promises
  speechGeneration++;

  // Clear any scheduled timeouts
  if (activePendingTimeout) {
    clearTimeout(activePendingTimeout);
    activePendingTimeout = null;
  }
  if (activeSafetyTimeout) {
    clearTimeout(activeSafetyTimeout);
    activeSafetyTimeout = null;
  }

  // Hard stop active HTMLAudioElement
  if (activeFallbackAudio) {
    try {
      activeFallbackAudio.pause();
      activeFallbackAudio.currentTime = 0;
      activeFallbackAudio.onplay = null;
      activeFallbackAudio.onended = null;
      activeFallbackAudio.onerror = null;
      activeFallbackAudio.removeAttribute("src");
      activeFallbackAudio.load();
    } catch {
      // ignore
    }
    activeFallbackAudio = null;
  }

  // Hard cancel native speechSynthesis
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
    window.__activeUtterances?.clear();
    if (window.__ttsKeepAliveInterval) {
      clearInterval(window.__ttsKeepAliveInterval);
      window.__ttsKeepAliveInterval = null;
    }
  }
}

export const stopSpeaking = stopAllSpeech;
export const cancelSpeech = stopAllSpeech;

/**
 * Fallback audio player that generates and streams native Malayalam audio
 * (or any other language) via HTMLAudioElement with strict generation checking.
 */
export async function playAudioFallback(
  text: string,
  lang: Lang,
  options: SpeakOptions = {},
  generation: number = speechGeneration
): Promise<void> {
  if (typeof window === "undefined") {
    options.onError?.("Window is undefined");
    return;
  }

  // If speech generation has changed since invocation, abort immediately
  if (generation !== speechGeneration) {
    return;
  }

  const chunks = chunkText(text);
  let chunkIndex = 0;
  let hasStarted = false;

  const playNext = () => {
    // Check generation before every single chunk playback
    if (generation !== speechGeneration) {
      if (activeFallbackAudio) {
        try {
          activeFallbackAudio.pause();
        } catch {}
        activeFallbackAudio = null;
      }
      return;
    }

    if (chunkIndex >= chunks.length) {
      options.onEnd?.();
      return;
    }

    const currentChunk = chunks[chunkIndex];
    chunkIndex++;

    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      currentChunk
    )}&tl=${encodeURIComponent(lang)}&client=tw-ob`;

    const audio = new Audio();
    activeFallbackAudio = audio;
    audio.volume = 1.0;

    audio.onplay = () => {
      if (generation !== speechGeneration) {
        try {
          audio.pause();
        } catch {}
        return;
      }
      if (!hasStarted) {
        hasStarted = true;
        options.onStart?.();
      }
    };

    audio.onended = () => {
      if (generation !== speechGeneration) return;
      playNext();
    };

    audio.onerror = () => {
      if (generation !== speechGeneration) return;
      // If direct CDN failed, attempt proxy endpoint
      const proxyUrl = `/api/tts?text=${encodeURIComponent(currentChunk)}&lang=${encodeURIComponent(lang)}`;
      const backupAudio = new Audio(proxyUrl);
      activeFallbackAudio = backupAudio;
      backupAudio.volume = 1.0;

      backupAudio.onplay = () => {
        if (generation !== speechGeneration) {
          try {
            backupAudio.pause();
          } catch {}
          return;
        }
        if (!hasStarted) {
          hasStarted = true;
          options.onStart?.();
        }
      };

      backupAudio.onended = () => {
        if (generation !== speechGeneration) return;
        playNext();
      };

      backupAudio.onerror = (e) => {
        if (generation !== speechGeneration) return;
        console.error("Audio fallback playback failed:", e);
        options.onError?.(e);
      };

      backupAudio.play().catch((err) => {
        if (generation !== speechGeneration) return;
        console.warn("Backup audio play() interrupted:", err);
        options.onError?.(err);
      });
    };

    audio.src = audioUrl;
    audio.play().catch((err) => {
      if (generation !== speechGeneration) return;
      console.warn("Audio play() interrupted or blocked, trying backup:", err);
      const proxyUrl = `/api/tts?text=${encodeURIComponent(currentChunk)}&lang=${encodeURIComponent(lang)}`;
      const backupAudio = new Audio(proxyUrl);
      activeFallbackAudio = backupAudio;
      backupAudio.volume = 1.0;

      backupAudio.onplay = () => {
        if (generation !== speechGeneration) {
          try {
            backupAudio.pause();
          } catch {}
          return;
        }
        if (!hasStarted) {
          hasStarted = true;
          options.onStart?.();
        }
      };

      backupAudio.onended = () => {
        if (generation !== speechGeneration) return;
        playNext();
      };

      backupAudio.onerror = (e) => {
        if (generation !== speechGeneration) return;
        options.onError?.(e);
      };

      backupAudio.play().catch((backupErr) => {
        if (generation !== speechGeneration) return;
        console.error("Backup audio play failed:", backupErr);
        options.onError?.(backupErr);
      });
    });
  };

  playNext();
}

/**
 * Universal Speak function that coordinates browser speech synthesis and fallback audio.
 * Enforces strict single-audio-source lifecycle and cancels any existing playback.
 */
export async function speakText(
  text: string,
  lang: Lang,
  options: SpeakOptions = {}
): Promise<void> {
  if (typeof window === "undefined") {
    options.onError?.("Window is undefined");
    return;
  }

  if (!text || !text.trim()) {
    return;
  }

  // 1. HARD STOP previous speech and obtain the new unique speech generation token
  stopAllSpeech();
  const currentGen = speechGeneration;

  // 2. Voice lookup
  const voices = updateVoicesList().length > 0 ? cachedVoices : await loadVoices();
  
  // Abort if generation changed during async voice loading
  if (currentGen !== speechGeneration) {
    return;
  }

  const matchedVoice = findBestVoice(lang, voices);
  const targetLocale = LOCALE_MAP[lang] ?? "en-IN";

  // Check if browser has a genuine native voice for Malayalam
  const hasNativeMalayalamVoice =
    lang === "ml" &&
    voices.some(
      (v) =>
        v.lang.toLowerCase().startsWith("ml") ||
        v.lang.toLowerCase().replace("_", "-") === "ml-in" ||
        v.name.toLowerCase().includes("malayalam")
    );

  // 3. For Malayalam without native voice pack, immediately route to fallback audio
  if (lang === "ml" && (!hasNativeMalayalamVoice || !matchedVoice)) {
    console.log(
      `[TTS] gen=${currentGen} lang=ml (no native voice) -> Using authentic Malayalam audio fallback.`
    );
    await playAudioFallback(text, "ml", options, currentGen);
    return;
  }

  // 4. For environments without speechSynthesis API or SpeechSynthesisUtterance
  if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
    await playAudioFallback(text, lang, options, currentGen);
    return;
  }

  // Initialize global active utterances set to defeat Chrome garbage collector bug
  if (!window.__activeUtterances) {
    window.__activeUtterances = new Set();
  }

  const utterance = new SpeechSynthesisUtterance(text.trim());
  utterance.lang = targetLocale;
  utterance.volume = 1.0;
  utterance.rate = options.rate ?? (lang === "en" ? 0.95 : 0.90);
  utterance.pitch = options.pitch ?? 1.0;

  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  // Retain strong reference
  window.__activeUtterances.add(utterance);

  // Chrome 15-second speech freeze workaround keepalive
  if (window.__ttsKeepAliveInterval) {
    clearInterval(window.__ttsKeepAliveInterval);
    window.__ttsKeepAliveInterval = null;
  }

  window.__ttsKeepAliveInterval = setInterval(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      } else if (!window.speechSynthesis.speaking) {
        if (window.__ttsKeepAliveInterval) {
          clearInterval(window.__ttsKeepAliveInterval);
          window.__ttsKeepAliveInterval = null;
        }
      }
    }
  }, 10000);

  let hasEnded = false;
  let nativeStarted = false;
  let fallbackTriggered = false;

  const cleanup = () => {
    if (hasEnded) return;
    hasEnded = true;
    window.__activeUtterances?.delete(utterance);
    if (window.__activeUtterances?.size === 0 && window.__ttsKeepAliveInterval) {
      clearInterval(window.__ttsKeepAliveInterval);
      window.__ttsKeepAliveInterval = null;
    }
  };

  const triggerFallback = () => {
    if (fallbackTriggered || currentGen !== speechGeneration) return;
    fallbackTriggered = true;
    cleanup();
    try {
      window.speechSynthesis.cancel();
    } catch {}
    playAudioFallback(text, lang, options, currentGen);
  };

  utterance.onstart = () => {
    if (currentGen !== speechGeneration) {
      cleanup();
      try {
        window.speechSynthesis.cancel();
      } catch {}
      return;
    }
    nativeStarted = true;
    options.onStart?.();
  };

  utterance.onend = () => {
    if (currentGen !== speechGeneration) {
      cleanup();
      return;
    }
    cleanup();
    options.onEnd?.();
  };

  utterance.onerror = (e) => {
    if (currentGen !== speechGeneration) {
      cleanup();
      return;
    }
    if (e.error !== "interrupted" && e.error !== "canceled") {
      console.warn(`[TTS] Native synthesis error for ${lang} (${e.error}), switching to audio fallback.`);
      triggerFallback();
    } else {
      cleanup();
      options.onError?.(e);
    }
  };

  // Schedule speech synthesis tick
  activePendingTimeout = setTimeout(() => {
    activePendingTimeout = null;
    if (currentGen !== speechGeneration) {
      cleanup();
      return;
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);

      // Safety check: if for Malayalam native speech didn't start within 500ms, trigger audio fallback
      if (lang === "ml") {
        activeSafetyTimeout = setTimeout(() => {
          activeSafetyTimeout = null;
          if (!nativeStarted && !fallbackTriggered && currentGen === speechGeneration) {
            console.log("[TTS] Native Malayalam speech did not start in time. Triggering audio fallback.");
            triggerFallback();
          }
        }, 500);
      }
    } catch (err) {
      console.error("SpeechSynthesis.speak invocation failed, triggering fallback:", err);
      triggerFallback();
    }
  }, 25);
}

/**
 * Universal alias for speakText
 */
export const speak = speakText;


