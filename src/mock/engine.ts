import type { Authority, MockResponse, RtiQuestion, StatusEvent, UnderstandResult } from "../types";

// This file is the deterministic, offline "brain" of the prototype.
// It guarantees the primary demo journey always works even if the
// backend / OpenAI call is unavailable, slow, or not configured.

const ACTION_WORDS = [
  "clean",
  "fix",
  "repair",
  "send someone",
  "come and",
  "remove",
  "install",
  "build a",
  "not been cleaned",
  "please send",
  "take action",
];

// Multilingual Mock AI Data
const TRANSLATIONS_UNDERSTAND: Record<string, Record<string, Partial<UnderstandResult>>> = {
  ta: {
    "civic-service": {
      summary: "துறையை நடவடிக்கை எடுக்குமாறு கேட்கிறீர்கள், இருக்கும் தகவலைக் கோரவில்லை.",
      suitability_reason: "ஆர்.டி.ஐ. பொதுவாக இருக்கும் கோப்புகள் மற்றும் தகவல்களைக் கோர பயன்படுகிறது, நடவடிக்கை எடுக்கக் கோர அல்ல. குறைதீர்க்கும் சேனல் இதற்கு உதவக்கூடும்."
    },
    "scholarship": {
      summary: "உதவித்தொகை விண்ணப்பத்தின் நிலையைப் பற்றிய தகவலைப் பெற விரும்புகிறீர்கள்.",
      suitability_reason: "துறை ஏற்கனவே பதிவு செய்த தகவலை நீங்கள் கேட்கிறீர்கள் - ஆர்.டி.ஐ. இதற்கு உதவக்கூடும்."
    },
    "pension": {
      summary: "ஓய்வூதியம் வழங்குவதில் ஏன் தாமதம் ஏற்படுகிறது என்ற தகவலைப் பெற விரும்புகிறீர்கள்.",
      suitability_reason: "துறையிடம் இருக்கும் கோப்புகள் மற்றும் தாமத காரணங்களை நீங்கள் கேட்கிறீர்கள் - ஆர்.டி.ஐ. பொருத்தமானதாக இருக்கக்கூடும்."
    },
    "general": {
      summary: "நீங்கள் கேட்க விரும்புவது:",
      suitability_reason: "இது ஒரு தகவல் கோரிக்கையாகத் தெரிகிறது, ஆனால் குறிப்பிட்ட துறை எங்களுக்குத் தெரியவில்லை. ஆர்.டி.ஐ. உதவலாம்."
    }
  },
  hi: {
    "civic-service": {
      summary: "आप विभाग से कोई कार्रवाई करने का अनुरोध कर रहे हैं, न कि मौजूदा जानकारी माँग रहे हैं।",
      suitability_reason: "आरटीआई का उपयोग विभाग से कार्रवाई करवाने के लिए नहीं, बल्कि रिकॉर्ड माँगने के लिए किया जाता है। शिकायत निवारण अधिक उपयुक्त होगा।"
    },
    "scholarship": {
      summary: "आप छात्रवृत्ति आवेदन की स्थिति के बारे में जानकारी प्राप्त करना चाहते हैं।",
      suitability_reason: "आप वह जानकारी माँग रहे हैं जो विभाग के पास पहले से उपलब्ध है - आरटीआई इसमें आपकी मदद कर सकता है।"
    },
    "pension": {
      summary: "आप जानना चाहते हैं कि पेंशन भुगतान में देरी क्यों हो रही है।",
      suitability_reason: "आप प्रसंस्करण और देरी के कारणों के बारे में मौजूदा रिकॉर्ड माँग रहे हैं - आरटीआई यहाँ उपयुक्त हो सकता है।"
    },
    "general": {
      summary: "आप इसके बारे में जानना चाहते हैं:",
      suitability_reason: "यह एक सूचना अनुरोध प्रतीत होता है, लेकिन विभाग अनिश्चित है। आरटीआई फिर भी मददगार हो सकता है।"
    }
  }
};

const TRANSLATIONS_QUESTIONS: Record<string, Record<string, string[]>> = {
  ta: {
    scholarship: [
      "என் உதவித்தொகை விண்ணப்பத்தின் தற்போதைய நிலையை வழங்கவும்.",
      "ஒவ்வொரு கட்டத்திலும் என் விண்ணப்பம் செயலாக்கப்பட்ட தேதிகளை வழங்கவும்.",
      "விண்ணப்பம் தற்போது நிலுவையில் உள்ள அலுவலகத்தின் பெயரை வழங்கவும்.",
      "விண்ணப்பம் நிராகரிக்கப்பட்டிருந்தால், அதற்கான பதிவு செய்யப்பட்ட காரணத்தை வழங்கவும்."
    ],
    pension: [
      "என் ஓய்வூதிய விண்ணப்பம்/பணம் செலுத்துதலின் தற்போதைய நிலையை வழங்கவும்.",
      "ஒவ்வொரு கட்டத்திலும் செயலாக்கம் முடிந்த தேதிகளை வழங்கவும்.",
      "தற்போது இந்த வழக்கை கையாளும் அலுவலகத்தின் பெயரை வழங்கவும்.",
      "ஏதேனும் தொகை நிறுத்தி வைக்கப்பட்டிருந்தால், அதற்கான காரணத்தை வழங்கவும்."
    ],
    general: [
      "மேலே விவரிக்கப்பட்ட விஷயத்தின் தற்போதைய நிலையை வழங்கவும்.",
      "ஒவ்வொரு கட்டத்திலும் அது செயலாக்கப்பட்ட தேதிகளை வழங்கவும்.",
      "தற்போது இதை கையாளும் அலுவலகத்தின் பெயர்/பதவியை வழங்கவும்.",
      "ஏதேனும் தாமதம் அல்லது நிராகரிப்புக்கான பதிவு செய்யப்பட்ட காரணத்தை வழங்கவும்."
    ]
  },
  hi: {
    scholarship: [
      "कृपया मेरे छात्रवृत्ति आवेदन की वर्तमान स्थिति प्रदान करें।",
      "कृपया वह तिथियां प्रदान करें जिन पर मेरा आवेदन प्रत्येक चरण में संसाधित किया गया था।",
      "कृपया उस कार्यालय का नाम प्रदान करें जहां आवेदन वर्तमान में लंबित है।",
      "यदि आवेदन अस्वीकार किया गया था, तो कृपया उस निर्णय का दर्ज कारण प्रदान करें।"
    ],
    pension: [
      "कृपया मेरे पेंशन आवेदन/भुगतान की वर्तमान स्थिति प्रदान करें।",
      "कृपया वह तिथियां प्रदान करें जिन पर प्रसंस्करण का प्रत्येक चरण पूरा किया गया था।",
      "कृपया वर्तमान में इस मामले को संभालने वाले कार्यालय का पदनाम प्रदान करें।",
      "यदि कोई राशि रोकी गई या देरी हुई, तो कृपया दर्ज कारण प्रदान करें।"
    ],
    general: [
      "कृपया ऊपर वर्णित मामले की वर्तमान स्थिति प्रदान करें।",
      "कृपया वह तिथियां प्रदान करें जिन पर इसे प्रत्येक चरण में संसाधित किया गया था।",
      "कृपया वर्तमान में इसे संभालने वाले कार्यालय का नाम/पदनाम प्रदान करें।",
      "कृपया किसी भी देरी, अस्वीकृति या रोक का दर्ज कारण प्रदान करें।"
    ]
  }
};

export function mockUnderstand(rawText: string, lang: string = "en"): UnderstandResult {
  const text = rawText.toLowerCase();
  const isAction = ACTION_WORDS.some((w) => text.includes(w));
  
  let topic: "civic-service" | "scholarship" | "pension" | "general" = "general";
  let goal: "request_information" | "request_action" = "request_information";
  let rti_suitability: "likely" | "maybe" | "unlikely" = "maybe";
  let confidence = 0.6;
  
  let summary = `You want to know more about: "${rawText.slice(0, 90)}${rawText.length > 90 ? "…" : ""}"`;
  let suitability_reason = "This looks like an information request, but we're less certain of the exact department. RTI may still help you.";

  if (isAction) {
    topic = "civic-service";
    goal = "request_action";
    rti_suitability = "unlikely";
    confidence = 0.81;
    summary = "You want the department to take an action (like a repair or cleanup), rather than to share existing information.";
    suitability_reason = "RTI is generally used to request information or records the department already holds — not to ask it to act. A grievance or service request may fit better here.";
  } else if (text.includes("scholarship")) {
    topic = "scholarship";
    rti_suitability = "likely";
    confidence = 0.92;
    summary = "You want information about the status of a scholarship application.";
    suitability_reason = "You are asking what the department already knows and recorded about your case — this is the kind of thing RTI can help you request.";
  } else if (text.includes("pension")) {
    topic = "pension";
    rti_suitability = "likely";
    confidence = 0.88;
    summary = "You want information about why a pension payment is delayed.";
    suitability_reason = "You are asking for existing records about processing and delay reasons — RTI may be appropriate here.";
  }

  // Override text if regional translation is configured
  if (lang !== "en" && TRANSLATIONS_UNDERSTAND[lang]?.[topic]) {
    const translation = TRANSLATIONS_UNDERSTAND[lang][topic];
    if (translation.summary) {
      if (topic === "general") {
        summary = `${translation.summary} "${rawText.slice(0, 90)}${rawText.length > 90 ? "…" : ""}"`;
      } else {
        summary = translation.summary;
      }
    }
    if (translation.suitability_reason) suitability_reason = translation.suitability_reason;
  }

  return {
    topic,
    goal,
    summary,
    rti_suitability,
    suitability_reason,
    confidence,
    source: "fallback",
  };
}

export function mockGenerateQuestions(
  understanding: UnderstandResult,
  rawText: string,
  lang: string = "en"
): RtiQuestion[] {
  const text = rawText.toLowerCase();
  let topic = understanding.topic;
  if (topic === "general" && text.includes("scholarship")) topic = "scholarship";
  if (topic === "general" && text.includes("pension")) topic = "pension";

  let questionTexts = [
    "Please provide the current status of the matter described.",
    "Please provide the dates on which it was processed at each stage.",
    "Please provide the name/designation of the office currently handling it.",
    "Please provide the recorded reason for any delay, rejection, or hold."
  ];

  if (topic === "scholarship") {
    questionTexts = [
      "Please provide the current status of my scholarship application.",
      "Please provide the dates on which my application was processed at each stage.",
      "Please provide the name/designation of the office where the application is pending.",
      "If the application was rejected or placed on hold, please provide the recorded reason."
    ];
  } else if (topic === "pension") {
    questionTexts = [
      "Please provide the current status of my pension application/payment.",
      "Please provide the dates on which each stage of processing was completed.",
      "Please provide the office and designation currently handling this case.",
      "If any amount was withheld or delayed, please provide the recorded reason."
    ];
  }

  // Override text if regional translation is configured
  if (lang !== "en" && TRANSLATIONS_QUESTIONS[lang]?.[topic]) {
    questionTexts = TRANSLATIONS_QUESTIONS[lang][topic];
  }

  return questionTexts.map((q, i) => ({ id: `q${i + 1}`, text: q }));
}

const AUTHORITY_DB: Authority[] = [
  {
    id: "auth-edu",
    name: "Department of Higher Education",
    department: "Education",
    matchedFor: ["scholarship", "education", "college", "university", "fee"],
    whyMatch: "This appears related to the scholarship service you described.",
  },
  {
    id: "auth-social",
    name: "Directorate of Social Welfare",
    department: "Social Welfare",
    matchedFor: ["pension", "welfare", "disability", "widow"],
    whyMatch: "This appears related to a welfare or pension scheme.",
  },
  {
    id: "auth-municipal",
    name: "Municipal Corporation — Sanitation Wing",
    department: "Urban Local Body",
    matchedFor: ["clean", "garbage", "sanitation", "road", "streetlight"],
    whyMatch: "This appears related to a civic/sanitation service in your ward.",
  },
  {
    id: "auth-health",
    name: "Directorate of Public Health",
    department: "Health",
    matchedFor: ["hospital", "health", "medicine", "vaccination"],
    whyMatch: "This appears related to a public health service.",
  },
  {
    id: "auth-general",
    name: "State Public Information Office (General)",
    department: "General Administration",
    matchedFor: [],
    whyMatch: "We couldn't match a specific department, so this general office is suggested as a starting point.",
  },
];

export function searchAuthorities(query: string): Authority[] {
  const q = query.trim().toLowerCase();
  if (!q) return AUTHORITY_DB;
  const matches = AUTHORITY_DB.filter((a) => a.matchedFor.some((k) => k.includes(q) || q.includes(k)));
  return matches.length > 0 ? matches : [AUTHORITY_DB[AUTHORITY_DB.length - 1]];
}

export function buildStatusHistory(): StatusEvent[] {
  const today = new Date();
  const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  const d0 = new Date(today);
  const d1 = new Date(today);
  d1.setDate(d1.getDate() + 1);
  return [
    { status: "SUBMITTED", date: fmt(d0), label: "Submitted" },
    { status: "RECEIVED", date: fmt(d1), label: "Received" },
    { status: "UNDER_REVIEW", date: "", label: "Under review" },
    { status: "RESPONSE_RECEIVED", date: "", label: "Response" },
  ];
}

export function mockExplainResponse(lang: string = "en"): MockResponse {
  if (lang === "ta") {
    return {
      whatTheySaid: "விண்ணப்பம் ஜூலை 12 அன்று பிராந்திய உதவித்தொகை பிரிவுக்கு மாற்றப்பட்டது.",
      whatItMeans: "உங்கள் கோரிக்கை செயலில் உள்ளது மற்றும் நிராகரிக்கப்படவில்லை.",
      whatToCheck: [
        "உங்கள் வங்கி கணக்கு விவரங்கள் சரியாக உள்ளதா என்று சரிபார்க்கவும்.",
        "பிராந்திய உதவித்தொகை பிரிவுக்கு ஏதேனும் ஆவணங்கள் தேவையா என்று சரிபார்க்கவும்."
      ]
    };
  }
  if (lang === "hi") {
    return {
      whatTheySaid: "आवेदन को 12 जुलाई को क्षेत्रीय छात्रवृत्ति सेल में स्थानांतरित किया गया था।",
      whatItMeans: "आपका अनुरोध अभी भी सक्रिय है और खारिज नहीं किया गया है।",
      whatToCheck: [
        "जाँचें कि क्या आपके बैंक खाते का विवरण सही और सक्रिय है।",
        "जाँचें कि क्या क्षेत्रीय छात्रवृत्ति सेल को आपसे किसी दस्तावेज़ की आवश्यकता है।"
      ]
    };
  }
  return {
    whatTheySaid:
      "The application was transferred to the Regional Scholarship Cell on 12 July for verification of bank details, and is currently awaiting confirmation from that office.",
    whatItMeans:
      "Your case is still active and hasn't been rejected. It's sitting with a different office than the one you originally contacted, likely because they need to verify a detail before releasing the payment.",
    whatToCheck: [
      "Whether your bank account details on file are correct and active.",
      "Whether the Regional Scholarship Cell needs any document from you.",
      "The date you may want to follow up if there's no update in a few weeks.",
    ],
  };
}

export function generateRequestId(): string {
  const n = 20000 + Math.floor(Math.random() * 9999);
  return `RTI-DEMO-${n}`;
}
