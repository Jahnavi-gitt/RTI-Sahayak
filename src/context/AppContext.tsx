import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Draft, Lang, RtiRequest, FirstAppealData } from "../types";
import { DEPARTMENTS_DATA, getLocalizedAuthority } from "../data/departments";
import { stopAllSpeech } from "../services/tts";

interface AppState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  draft: Draft;
  updateDraft: (patch: Partial<Draft>) => void;
  resetDraft: () => void;
  requests: RtiRequest[];
  addRequest: (r: RtiRequest) => void;
  updateRequest: (r: RtiRequest) => void;
  canEditRequest: (r: RtiRequest) => boolean;
  isEligibleForAppeal: (r: RtiRequest) => boolean;
  addFirstAppeal: (appeal: FirstAppealData) => void;
  appeals: Record<string, FirstAppealData>;
  
  // Accessibility controls
  textScale: number;
  setTextScale: (scale: number) => void;
  largeText: boolean;
  setLargeText: (v: boolean) => void;
  
  // Verification states
  verified: boolean;
  setVerified: (v: boolean) => void;
  verificationMethod: "digilocker" | "gov_id" | "aadhaar_otp" | "pan_otp" | "camera_doc" | null;
  setVerificationMethod: (m: "digilocker" | "gov_id" | "aadhaar_otp" | "pan_otp" | "camera_doc" | null) => void;
  verificationDetails: { method: string; maskedId: string; citizenName: string } | null;
  setVerificationDetails: (d: { method: string; maskedId: string; citizenName: string } | null) => void;
  
  // Attached Documents
  attachedDocs: string[];
  setAttachedDocs: (docs: string[]) => void;
  documentsConnected: boolean;
  setDocumentsConnected: (v: boolean) => void;
  
  // Authentication states
  currentUser: { phone: string; name: string } | null;
  setCurrentUser: (u: { phone: string; name: string } | null) => void;
  userPinHash: string | null;
  setUserPinHash: (h: string | null) => void;
  resetAuth: () => void;
}

const emptyDraft: Draft = { rawProblem: "", understanding: null, questions: [], authority: null };

const AppContext = createContext<AppState | null>(null);

const DEMO_REQUEST_TRANSLATIONS: Record<string, Record<Lang, { problem: string; summary: string; q1: string; q2?: string }>> = {
  "RTI-DEMO-28491": {
    en: {
      problem: "My higher education scholarship hasn't arrived for 4 months",
      summary: "You want to check the status of your higher education scholarship which is delayed by 4 months.",
      q1: "Please provide the certified current processing status of my scholarship application.",
      q2: "Please provide the scheduled release date and file notings for the scholarship amount."
    },
    hi: {
      problem: "मेरी उच्च शिक्षा छात्रवृत्ति 4 महीने से नहीं आई है",
      summary: "आप अपनी उच्च शिक्षा छात्रवृत्ति की स्थिति जानना चाहते हैं जो 4 महीने से लंबित है।",
      q1: "कृपया मेरे छात्रवृत्ति आवेदन की वर्तमान प्रसंस्करण स्थिति प्रदान करें।",
      q2: "कृपया छात्रवृत्ति राशि जारी करने की निर्धारित तिथि और फाइल नोटिंग्स प्रदान करें।"
    },
    te: {
      problem: "నా ఉన్నత విద్యా స్కాలర్‌షిప్ 4 నెలలుగా రాలేదు",
      summary: "4 నెలలుగా ఆలస్యమైన మీ ఉన్నత విద్యా స్కాలర్‌షిప్ ప్రాసెసింగ్ స్థితిని తెలుసుకోవాలనుకుంటున్నారు.",
      q1: "దయచేసి నా స్కాలర్‌షిప్ దరఖాస్తు యొక్క ప్రస్తుత ప్రాసెసింగ్ స్థితిని తెలపండి.",
      q2: "స్కాలర్‌షిప్ మొత్తం విడుదల తేదీ మరియు ఫైల్ నోటింగ్స్ వివరాలు అందించండి."
    },
    ta: {
      problem: "எனது உயர் கல்வி உதவித்தொகை 4 மாதங்களாக வரவில்லை",
      summary: "4 மாதங்களாக நிலுவையில் உள்ள உதவித்தொகை விண்ணப்பத்தின் நிலையை அறிய விரும்புகிறீர்கள்.",
      q1: "எனது உதவித்தொகை விண்ணப்பத்தின் தற்போதைய செயலாக்க நிலையை வழங்கவும்.",
      q2: "உதவித்தொகை விடுவிக்கப்படும் தேதி மற்றும் கோப்புக் குறிப்புகளை வழங்கவும்."
    },
    kn: {
      problem: "ನನ್ನ ಉನ್ನತ ಶಿಕ್ಷಣ ವಿದ್ಯಾರ್ಥಿವೇತನ 4 ತಿಂಗಳಿಂದ ಬಂದಿಲ್ಲ",
      summary: "4 ತಿಂಗಳಿಂದ ವಿಳಂಬವಾಗಿರುವ ವಿದ್ಯಾರ್ಥಿವೇತನ ಅರ್ಜಿಯ ಪ್ರಸ್ತುತ ಸ್ಥಿತಿಯನ್ನು ತಿಳಿಯಲು ಬಯಸುತ್ತೀರಿ.",
      q1: "ದಯವಿಟ್ಟು ನನ್ನ ವಿದ್ಯಾರ್ಥಿವೇತನ ಅರ್ಜಿಯ ಪ್ರಸ್ತುತ ಸಂಸ್ಕರಣಾ ಸ್ಥಿತಿಯನ್ನು ಒದಗಿಸಿ.",
      q2: "ವಿದ್ಯಾರ್ಥಿವೇತನ ಹಣ ಬಿಡುಗಡೆಯ ದಿನಾಂಕ ಮತ್ತು ಕಡತದ ಟಿಪ್ಪಣಿಗಳನ್ನು ಒದಗಿಸಿ."
    },
    ml: {
      problem: "എന്റെ ഉന്നത വിദ്യാഭ്യാസ സ്കോളർഷിപ്പ് 4 മാസമായി ലഭിച്ചിട്ടില്ല",
      summary: "4 മാസമായി കാലതാമസം നേരിടുന്ന സ്കോളർഷിപ്പ് അപേക്ഷയുടെ നിലവിലെ സ്ഥിതി അറിയാൻ ആഗ്രഹിക്കുന്നു.",
      q1: "എന്റെ സ്കോളർഷിപ്പ് അപേക്ഷയുടെ നിലവിലെ പ്രോസസ്സിംഗ് വിവരങ്ങൾ നൽകുക.",
      q2: "തുക അനുവദിക്കുന്ന തീയതിയും ഫയൽ കുറിപ്പുകളും ലഭ്യമാക്കുക."
    },
    bn: {
      problem: "আমার উচ্চশিক্ষার স্কলারশিপ ৪ মাস ধরে আসেনি",
      summary: "৪ মাস ধরে বিলম্বিত স্কলারশিপ আবেদনের স্থিতি জানতে চান।",
      q1: "অনুগ্রহ করে আমার স্কলারশিপ আবেদনের বর্তমান প্রক্রিয়াকরণ স্থিতি জানান।",
      q2: "স্কলারশিপের অর্থ প্রদানের নির্ধারিত তারিখ এবং ফাইল নোট প্রদান করুন।"
    },
    mr: {
      problem: "माझी उच्च शिक्षण शिष्यवृत्ती ४ महिन्यांपासून आलेली नाही",
      summary: "४ महिन्यांपासून प्रलंबित असलेल्या शिष्यवृत्ती अर्जाची सद्यस्थिती जाणून घ्यायची आहे.",
      q1: "कृपया माझ्या शिष्यवृत्ती अर्जाची सद्यस्थिती उपलब्ध करून द्यावी.",
      q2: "शिष्यवृत्ती वितरणाची नियोजित तारीख आणि फाइल टिपण्या द्याव्यात."
    }
  },
  "RTI-DEMO-19342": {
    en: {
      problem: "Potholes on the main road in our area have not been repaired",
      summary: "You want municipal road repair records, work order details, and budget estimates.",
      q1: "Please provide copies of the repair contract, estimate, and work order for Main Road repairs."
    },
    hi: {
      problem: "हमारे क्षेत्र की मुख्य सड़क के गड्ढों की मरम्मत नहीं की गई है",
      summary: "आप नगर निगम सड़क मरम्मत रिकॉर्ड, वर्क ऑर्डर और बजट प्राक्कलन की जानकारी चाहते हैं।",
      q1: "कृपया मुख्य सड़क की मरम्मत के अनुबंध, प्राक्कलन (एस्टिमेट) और वर्क ऑर्डर की प्रतियां प्रदान करें।"
    },
    te: {
      problem: "మా ప్రాంతంలోని ప్రధాన రహదారిపై గుంతలు మరమ్మతు చేయలేదు",
      summary: "మున్సిపల్ రోడ్డు మరమ్మతుల రికార్డులు, వర్క్ ఆర్డర్ మరియు బడ్జెట్ ఎస్టిమేట్ వివరాలను కోరుతున్నారు.",
      q1: "దయచేసి ప్రధాన రహదారి మరమ్మతుల కాంట్రాక్ట్, ఎస్టిమేట్ మరియు వర్క్ ఆర్డర్ కాపీలను అందించండి."
    },
    ta: {
      problem: "எங்கள் பகுதியில் உள்ள பிரதான சாலையில் உள்ள குழிகள் சரிசெய்யப்படவில்லை",
      summary: "சாலை பழுதுபார்ப்பு பதிவுகள், பணி ஆணை மற்றும் மதிப்பீட்டு விவரங்களை அறிய விரும்புகிறீர்கள்.",
      q1: "பிரதான சாலை பழுதுபார்ப்புக்கான ஒப்பந்தம், மதிப்பீடு மற்றும் பணி ஆணை நகல்களை வழங்கவும்."
    },
    kn: {
      problem: "ನಮ್ಮ ಪ್ರದೇಶದ ಮುಖ್ಯ ರಸ್ತೆಯ ಗುಂಡಿಗಳನ್ನು ದುರಸ್ತಿ ಮಾಡಲಾಗಿಲ್ಲ",
      summary: "ರಸ್ತೆ ದುರಸ್ತಿ ದಾಖಲೆಗಳು, ಕಾಮಗಾರಿ ಆದೇಶ ಮತ್ತು ಅಂದಾಜು ಪಟ್ಟಿಯ ವಿವರಗಳನ್ನು ತಿಳಿಯಲು ಬಯಸುತ್ತೀರಿ.",
      q1: "ಮುಖ್ಯ ರಸ್ತೆ ದುರಸ್ತಿಯ ಗುತ್ತಿಗೆ ಕರಾರು, ಅಂದಾಜು ಪಟ್ಟಿ ಮತ್ತು ಕಾಮಗಾರಿ ಆದೇಶದ ಪ್ರತಿಗಳನ್ನು ನೀಡಿ."
    },
    ml: {
      problem: "ഞങ്ങളുടെ പ്രദേശത്തെ പ്രധാന റോഡിലെ കുഴികൾ നന്നാക്കിയിട്ടില്ല",
      summary: "റോഡ് അറ്റകുറ്റപ്പണി രേഖകൾ, വർക്ക് ഓർഡർ, എസ്റ്റിമേറ്റ് എന്നിവയുടെ വിവരങ്ങൾ ആവശ്യപ്പെടുന്നു.",
      q1: "പ്രധാന റോഡ് അറ്റകുറ്റപ്പണിയുടെ കരാർ, എസ്റ്റിമേറ്റ്, വർക്ക് ഓർഡർ എന്നിവയുടെ പകർപ്പുകൾ നൽകുക."
    },
    bn: {
      problem: "আমাদের এলাকার প্রধান রাস্তার গর্ত মেরামত করা হয়নি",
      summary: "পৌর রাস্তার মেরামত রেকর্ড, কাজের আদেশ এবং বাজেট এস্টিমেট জানতে চান।",
      q1: "অনুগ্রহ করে প্রধান রাস্তার মেরামতের চুক্তি, এস্টিমেট এবং কাজের আদেশের প্রতিলিপি দিন।"
    },
    mr: {
      problem: "आमच्या परिसरातील मुख्य रस्त्यावरील खड्डे दुरुस्त केलेले नाहीत",
      summary: "रस्ता दुरुस्तीच्या शासकीय नोंदी, वर्क ऑर्डर आणि अंदाजपत्रकाचा तपशील हवा आहे.",
      q1: "कृपया मुख्य रस्त्याच्या दुरुस्तीचा करार, अंदाजपत्रक आणि वर्क ऑर्डरच्या प्रती द्याव्यात."
    }
  }
};

const initialRequests: RtiRequest[] = [
  {
    id: "RTI-DEMO-28491",
    rawProblem: "My higher education scholarship hasn't arrived for 4 months",
    understanding: {
      topic: "scholarship",
      goal: "request_information",
      summary: "You want to check the status of your higher education scholarship which is delayed by 4 months.",
      rti_suitability: "likely",
      suitability_reason: "RTI is generally used to request records and status information held by a public authority.",
      confidence: 0.95,
      source: "fallback"
    },
    questions: [
      { id: "q1", text: "Please provide the certified current processing status of my scholarship application." },
      { id: "q2", text: "Please provide the scheduled release date and file notings for the scholarship amount." }
    ],
    authority: getLocalizedAuthority(DEPARTMENTS_DATA[0], "en"),
    createdAt: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString(),
    statusHistory: [
      { status: "SUBMITTED", date: "04 Aug 2026", label: "Submitted" },
      { status: "RECEIVED", date: "05 Aug 2026", label: "Received by PIO" },
      { status: "UNDER_REVIEW", date: "06 Aug 2026", label: "Under Official Review" }
    ],
    currentStatus: "UNDER_REVIEW"
  },
  {
    id: "RTI-DEMO-19342",
    rawProblem: "Potholes on the main road in our area have not been repaired",
    understanding: {
      topic: "civic-service",
      goal: "request_information",
      summary: "You want municipal road repair records and cost details.",
      rti_suitability: "maybe",
      suitability_reason: "Grievance is usually faster, but RTI can ask for contracts.",
      confidence: 0.9,
      source: "fallback"
    },
    questions: [
      { id: "q1", text: "Please provide copies of the repair contract, estimate, and work order for Main Road repairs." }
    ],
    authority: getLocalizedAuthority(DEPARTMENTS_DATA[3], "en"),
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    statusHistory: [
      { status: "SUBMITTED", date: "21 Aug 2026", label: "Submitted" },
      { status: "RECEIVED", date: "22 Aug 2026", label: "Received by PIO" },
      { status: "UNDER_REVIEW", date: "22 Aug 2026", label: "Under Official Review" },
      { status: "RESPONSE_RECEIVED", date: "27 Aug 2026", label: "Response received" }
    ],
    currentStatus: "RESPONSE_RECEIVED"
  }
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem("rti_lang") as Lang;
      if (saved && ["en", "hi", "te", "ta", "kn", "ml", "bn", "mr"].includes(saved)) {
        return saved;
      }
    } catch {}
    return "en";
  });
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [requests, setRequests] = useState<RtiRequest[]>(initialRequests);
  const [appeals, setAppeals] = useState<Record<string, FirstAppealData>>({});
  
  const [textScale, setTextScale] = useState<number>(() => {
    const saved = localStorage.getItem("rti_text_scale");
    return saved ? parseInt(saved, 10) : 100;
  });
  const [largeText, setLargeText] = useState(false);
  
  const [verified, setVerified] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<"digilocker" | "gov_id" | "aadhaar_otp" | "pan_otp" | "camera_doc" | null>(null);
  const [verificationDetails, setVerificationDetails] = useState<{ method: string; maskedId: string; citizenName: string } | null>(null);
  
  const [attachedDocs, setAttachedDocs] = useState<string[]>([]);
  const [documentsConnected, setDocumentsConnected] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<{ phone: string; name: string } | null>(() => {
    const saved = localStorage.getItem("rti_current_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [userPinHash, setUserPinHash] = useState<string | null>(() => {
    return localStorage.getItem("rti_pin_hash") || null;
  });

  useEffect(() => {
    localStorage.setItem("rti_lang", lang);
    stopAllSpeech();
  }, [lang]);

  // Universal Root-Level Text Scaling to resize all Tailwind rem typography
  useEffect(() => {
    localStorage.setItem("rti_text_scale", textScale.toString());
    if (typeof document !== "undefined") {
      document.documentElement.style.fontSize = `${textScale}%`;
    }
  }, [textScale]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("rti_current_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("rti_current_user");
    }
  }, [currentUser]);

  useEffect(() => {
    if (userPinHash) {
      localStorage.setItem("rti_pin_hash", userPinHash);
    } else {
      localStorage.removeItem("rti_pin_hash");
    }
  }, [userPinHash]);

  const updateRequest = (updated: RtiRequest) => {
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const canEditRequest = (req: RtiRequest): boolean => {
    // Only draft or unsubmitted applications can be modified
    return req.currentStatus === "DRAFT";
  };

  const isEligibleForAppeal = (req: RtiRequest): boolean => {
    if (req.currentStatus === "APPEAL_FILED" || req.currentStatus === "APPEAL_UNDER_REVIEW" || req.currentStatus === "APPEAL_DISPOSED") {
      return false; // Appeal already active
    }
    // Eligible if response received OR if >30 days without response
    if (req.currentStatus === "RESPONSE_RECEIVED") {
      return true;
    }
    const daysSinceCreation = (Date.now() - new Date(req.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreation >= 30; // 30-day statutory period
  };

  const addFirstAppeal = (appeal: FirstAppealData) => {
    setAppeals((prev) => ({ ...prev, [appeal.appealId]: appeal }));
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === appeal.originalRequestId) {
          const updatedHistory = [
            ...r.statusHistory,
            {
              status: "APPEAL_FILED" as const,
              date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
              label: `First Appeal Filed (${appeal.appealId})`
            }
          ];
          return {
            ...r,
            currentStatus: "APPEAL_FILED" as const,
            statusHistory: updatedHistory,
            firstAppeal: appeal
          };
        }
        return r;
      })
    );
  };

  // Localize demo requests dynamically based on the current active language
  const localizedRequests = useMemo(() => {
    return requests.map((r) => {
      const demoTrans = DEMO_REQUEST_TRANSLATIONS[r.id]?.[lang];
      if (demoTrans) {
        return {
          ...r,
          rawProblem: demoTrans.problem,
          understanding: r.understanding ? { ...r.understanding, summary: demoTrans.summary } : r.understanding,
          questions: [
            { id: "q1", text: demoTrans.q1 },
            ...(demoTrans.q2 ? [{ id: "q2", text: demoTrans.q2 }] : [])
          ],
          authority: r.authority?.id === "auth-edu-higher" || r.authority?.id === "edu"
            ? getLocalizedAuthority(DEPARTMENTS_DATA[0], lang)
            : getLocalizedAuthority(DEPARTMENTS_DATA[3], lang)
        };
      }
      return r;
    });
  }, [requests, lang]);

  const resetAuth = () => {
    setCurrentUser(null);
    setUserPinHash(null);
    localStorage.removeItem("rti_current_user");
    localStorage.removeItem("rti_pin_hash");
  };

  const value = useMemo<AppState>(
    () => ({
      lang,
      setLang,
      draft,
      updateDraft: (patch) => setDraft((d: Draft) => ({ ...d, ...patch })),
      resetDraft: () => {
        setDraft(emptyDraft);
        setAttachedDocs([]);
        setDocumentsConnected(false);
      },
      requests: localizedRequests,
      addRequest: (r) => setRequests((rs) => [r, ...rs]),
      updateRequest,
      canEditRequest,
      isEligibleForAppeal,
      addFirstAppeal,
      appeals,
      
      // Accessibility
      textScale,
      setTextScale,
      largeText,
      setLargeText,
      
      // Verification
      verified,
      setVerified,
      verificationMethod,
      setVerificationMethod,
      verificationDetails,
      setVerificationDetails,
      
      // Documents
      attachedDocs,
      setAttachedDocs,
      documentsConnected,
      setDocumentsConnected,
      
      // Auth
      currentUser,
      setCurrentUser,
      userPinHash,
      setUserPinHash,
      resetAuth,
    }),
    [
      lang,
      draft,
      localizedRequests,
      appeals,
      textScale,
      largeText,
      verified,
      verificationMethod,
      verificationDetails,
      attachedDocs,
      documentsConnected,
      currentUser,
      userPinHash,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
