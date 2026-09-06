import { searchAuthoritiesLocalized } from "../data/departments.ts";
import { t } from "../i18n/strings.ts";
import type { Authority, Lang, UnderstandResult, RtiQuestion, StatusEvent, RequestStatus } from "../types";

export type { Authority, Lang, UnderstandResult, RtiQuestion, StatusEvent, RequestStatus };

export interface MockResponse {
  whatTheySaid: string;
  whatItMeans: string;
  whatToCheck: string[];
}

export interface GroundOption {
  id: string;
  label: string;
  description: string;
}

export interface AppealEligibility {
  eligible: boolean;
  reason: string;
  daysPassed: number;
  daysRemaining: number;
}

export interface ExtractedFacts {
  duration?: string;
  location?: string;
  referenceId?: string;
  specificIssue?: string;
  namedEntity?: string;
}

// 8 Civic Domains Keyword Dictionary across 8 Indian Languages
const TOPIC_KEYWORDS: Record<string, string[]> = {
  water: [
    "well", "wells", "government well", "public well", "open well", "borewell", "tube well", "hand pump", "handpump", "water tank", "overhead tank", "sump", "water supply", "pipeline", "tap water", "drinking water", "water contamination", "water leakage", "water shortage", "tanker", "chlorination", "water cleaning", "water testing", "clean", "cleaned",
    "कुआं", "कुएं", "सरकारी कुआं", "नलकूप", "हैंडपंप", "हैंडपम्प", "पानी की टंकी", "पेयजल", "जल आपूर्ति", "दूषित पानी", "बोरवेल", "जल शोधन", "पानी की सफाई",
    "బావి", "బావులు", "ప్రభుత్వ బావి", "బోరుబావి", "చేతిపంపు", "నీటి ట్యాంక్", "తాగునీరు", "కలుషిత నీరు", "నీటి సరఫరా", "పైప్‌లైన్ లీకేజీ", "బావి శుభ్రం", "శుభ్రపరచ",
    "கிணறு", "அரசு கிணறு", "ஆழ்துளை கிணறு", "கைப்பம்பு", "தண்ணீர் தொட்டி", "குடிநீர்", "நீர் விநியோகம்", "குடிநீர் குழாய்", "மாசுபட்ட நீர்", "பராமரிப்பு",
    "ಬಾವಿ", "ಸರ್ಕಾರಿ ಬಾವಿ", "ಬೋರ್‌ವೆಲ್", "ಕೈಪಂಪ್", "ನೀರಿನ ಟ್ಯಾಂಕ್", "ಕುಡಿಯುವ ನೀರು", "ನೀರು ಸರಬರಾಜು", "ಕಲುಷಿತ ನೀರು", "ಬಾವಿ ಸ್ವಚ್ಛತೆ",
    "കിണർ", "പൊതു കിണർ", "കുഴൽക്കിണർ", "കൈപ്പമ്പ്", "വാട്ടർ ടാങ്ക്", "കുടിവെള്ളം", "കുടിവെള്ള വിതരണം", "മലിനജലം", "കിണർ വൃത്തിയാക്കൽ",
    "কুয়া", "সরকারি কুয়া", "নলকূপ", "টিউবওয়েল", "জলের ট্যাঙ্ক", "পানীয় জল", "জল সরবরাহ", "দূষিত জল", "কুয়ো সংস্কার",
    "विहीर", "शासकीय विहीर", "सार्वजनिक विहीर", "हातपंप", "बोअरवेल", "पाण्याची टाकी", "पिण्याचे पाणी", "पाणी पुरवठा", "दूषित पाणी", "विहीर स्वच्छता"
  ],
  scholarship: [
    "scholarship", "fee reimbursement", "stipend", "fellowship", "grant", "hostel fee", "tuition fee", "student", "college",
    "छात्रवृत्ति", "शुल्क प्रतिपूर्ति", "छात्रवृति", "स्कॉलरशिप", "स्टाइपेंड",
    "స్కాలర్‌షిప్", "స్కాలర్షిప్", "ఫీజు రీయింబర్స్‌మెంట్", "స్టైపెండ్", "వసతి గృహ",
    "உதவித்தொகை", "கல்வி உதவித்தொகை", "கல்விக் கட்டணம்", "ஸ்டைபெண்ட்",
    "ವಿದ್ಯಾರ್ಥಿವೇತನ", "ಶುಲ್ಕ ಮರುಪಾವತಿ", "ಸ್ಟೈಪೆಂಡ್",
    "സ്കോളർഷിപ്പ്", "ഫീസ് ഇളവ്", "സ്റ്റൈപ്പന്റ്",
    "স্কলারশিপ", "বৃত্তি", "ফি মকুব", "স্টাইপেন্ড",
    "शिष्यवृत्ती", "शुल्क प्रतिपूर्ती", "विद्यावेतन"
  ],
  pension: [
    "pension", "pf", "provident fund", "gratuity", "old age pension", "widow pension", "disability pension", "retiree",
    "पेंशन", "भविष्य निधि", "ग्रेच्युटी", "वृद्धावस्था पेंशन", "विधवा पेंशन", "दिव्यांग पेंशन",
    "పెన్షన్", "పింఛను", "భవిష్య నిధి", "గ్రాట్యుటీ", "వృద్ధాప్య పింఛను", "వితంతు పింఛను", "దివ్యాంగుల పింఛను",
    "ஓய்வூதியம்", "பென்ஷன்", "வருங்கால வைப்பு நிதி", "முதியோர் ஓய்வூதியம்",
    "ಪಿಂಚಣಿ", "ಭವಿಷ್ಯ ನಿಧಿ", "ಗ್ರಾಚ್ಯುಟಿ", "ವೃದ್ಧಾಪ್ಯ ವೇತನ", "ವಿಧವಾ ವೇತನ",
    "പെൻഷൻ", "പ്രൊവിഡന്റ് ഫണ്ട്", "ഗ്രാറ്റുവിറ്റി", "വാർദ്ധക്യ പെൻഷൻ",
    "পেনশন", "প্রভিডেন্ট ফান্ড", "গ্র্যাচুইটি", "বার্ধক্য ভাতা", "বিধবা ভাতা",
    "पेन्शन", "भविष्य निर्वाह निधी", "उपदान", "श्रावण बाळ योजना", "वृद्धापकाळ पेन्शन"
  ],
  "civic-service": [
    "road", "roads", "pothole", "potholes", "drain", "drainage", "garbage", "waste", "street", "park", "footpath", "bridge", "sewage", "overflow",
    "सड़क", "गड्ढा", "नाला", "कचरा", "सफाई", "स्ट्रीट", "ड्रेनेज", "सड़क मरम्मत", "सीवेज",
    "రోడ్డు", "గుంతలు", "కాలువ", "చెత్త", "డ్రైనేజీ", "వీధి", "మరమ్మతు", "మురుగునీరు",
    "சாலை", "குழி", "சாக்கடை", "குப்பை", "தெரு", "பாதாள சாக்கடை", "பழுது",
    "ರಸ್ತೆ", "ಗುಂಡಿ", "ಚರಂಡಿ", "ಕಸ", "ಬೀದಿ", "ಕೊಳಚೆ ನೀರು", "ದುರಸ್ತಿ",
    "റോഡ്", "കുഴി", "ഓട", "മാലിന്യം", "തെരുവ്", "ഡ്രെയിനേജ്",
    "রাস্তা", "গর্ত", "নর্দমা", "আবর্জনা", "নিকাশি", "মেরামত",
    "रस्ता", "खड्डे", "गटार", "कचरा", "सांडपाणी", "दुरुस्ती"
  ],
  health: [
    "hospital", "doctor", "medicine", "medicines", "drug", "drugs", "tablet", "phc", "clinic", "treatment", "ambulance", "health", "x-ray", "xray", "ct scan", "scan",
    "अस्पताल", "डॉक्टर", "दवा", "दवाई", "इलाज", "चिकित्सा", "स्वास्थ्य", "प्राथमिक स्वास्थ्य केंद्र", "एम्बुलेंस", "एक्स-रे",
    "ఆసుపత్రి", "డాక్టర్", "మందులు", "వైద్యం", "చికిత్స", "ఆరోగ్యం", "పీహెచ్‌సీ", "అంబులెన్స్", "ఎక్స్-రే",
    "மருத்துவமனை", "மருத்துவர்", "மருந்து", "சிகிச்சை", "ஆரம்ப சுகாதார நிலையம்", "எக்ஸ்-ரே",
    "ಆಸ್ಪತ್ರೆ", "ವೈದ್ಯರು", "ಔಷಧಿ", "ಚಿಕಿತ್ಸೆ", "ಆರೋಗ್ಯ ಕೇಂದ್ರ", "ಎಕ್ಸ್-ರೇ",
    "ആശുപത്രി", "ഡോക്ടർ", "മരുന്ന്", "ചികിത്സ", "ആരോഗ്യ കേന്ദ്രം", "എക്സ്-റേ",
    "হাসপাতাল", "ডাক্তার", "ওষুধ", "চিকিৎসা", "স্বাস্থ্য কেন্দ্র", "এক্স-রে",
    "रुग्णालय", "डॉक्टर", "औषध", "औषधे", "उपचार", "आरोग्य केंद्र", "एक्स-रे"
  ],
  electricity: [
    "electricity", "power", "meter", "current", "streetlight", "street light", "street lights", "transformer", "bill", "voltage", "outage", "light", "high bill",
    "बिजली", "करंट", "मीटर", "स्ट्रीट लाइट", "ट्रांसफार्मर", "बिजली बिल", "वोल्टेज", "बिजली कटौती", "बत्ती",
    "విద్యుత్", "కరెంట్", "మీటర్", "వీధి దీపాలు", "ట్రాన్స్‌ఫార్మర్", "కరెంట్ బిల్లు", "విద్యుత్ కోత", "లైట్లు",
    "மின்சారం", "கரண்ட்", "மீட்டர்", "தெரு விளக்கு", "மின் கட்டணம்", "மின்வெட்டு",
    "ವಿದ್ಯುತ್", "ಕರೆಂಟ್", "ಮೀಟರ್", "ಬೀದಿ ದೀಪ", "ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್", "ವಿದ್ಯುತ್ ಬಿಲ್", "ವಿದ್ಯುತ್ ಕಡಿತ",
    "വൈദ്യുതി", "കറന്റ്", "മീറ്റർ", "തെരുവ് വിളക്ക്", "വൈദ്യുതി ബിൽ", "ലോഡ്ഷെഡ്ഡിംഗ്",
    "বিদ্যুৎ", "কারেন্ট", "মিটার", "রাস্তার আলো", "বিদ্যুৎ বিল", "লোডশেডিং",
    "वीज", "विद्युत", "मीटर", "स्ट्रीट लाईट", "ट्रान्सफॉर्मर", "वीज बिल", "लोडशेडिंग", "दिवाबत्ती"
  ],
  police: [
    "police", "fir", "complaint", "theft", "stolen", "station", "sho", "investigation", "crime", "harassment", "case",
    "पुलिस", "एफआईआर", "शिकायत", "थाना", "चोरी", "जांच", "अपराध", "प्रताड़ना", "केस",
    "పోలీస్", "ఎఫ్‌ఐఆర్", "ఫిర్యాదు", "స్టేషన్", "దొంగతనం", "విచారణ", "నేరం", "కేసు",
    "காவல்துறை", "போலீஸ்", "எப்ஐஆர்", "புகார்", "நிலையம்", "திருட்டு", "விசாரணை",
    "ಪೊಲೀಸ್", "ಎಫ್‌ಐಆರ್", "ದೂರು", "ಠಾಣೆ", "ಕಳ್ಳತನ", "ತನಿಖೆ", "ಅಪರಾಧ",
    "പോലീസ്", "എഫ്ഐആർ", "പരാതി", "സ്റ്റേഷൻ", "മോഷണം", "അന്വേഷണം",
    "পুলিশ", "এফআইআর", "অভিযোগ", "থানা", "চুরি", "তদন্ত", "অপরাধ",
    "पोलीस", "एफआयआर", "तक्रार", "पोलीस ठाणे", "चोरी", "तपास", "गुन्हा"
  ],
  land: [
    "land", "mutation", "patta", "survey", "khata", "registration", "revenue", "encroachment", "partition", "property", "boundary",
    "भूमि", "जमीन", "दाखिल खारिज", "म्यूटेशन", "पट्टा", "सर्वेक्षण", "खसरा", "खतौनी", "कब्जा", "नामांतरण",
    "భూమి", "మ్యుటేషన్", "పట్టా", "సర్వే", "ఖాతా", "రిజిస్ట్రేషన్", "రెవెన్యూ", "ఆక్రమణ", "భూ రికార్డులు",
    "நிலம்", "பட்டா", "சர்வே", "நில அளவை", "பத்திரப்பதிவு", "வருவாய்", "ஆக்கிரமிப்பு",
    "ಜಮೀನು", "ಭೂಮಿ", "ಖಾತಾ", "ಪಹಣಿ", "ಸರ್ವೆ", "ನೋಂದಣಿ", "ಕಂದಾಯ", "ಒತ್ತುವರಿ",
    "ഭൂമി", "പോക്കുവരവ്", "പട്ടയം", "സർവേ", "രജിസ്ട്രേഷൻ", "റവന്യൂ", "കയ്യേറ്റം",
    "জমি", "নামজারি", "পত্তা", "সার্ভে", "খতিয়ান", "রেজিস্ট্রেশন", "দখল",
    "जमीन", "सातबारा", "नोंदणी", "फेरफार", "पट्टा", "मोजणी", "महसूल", "अतिक्रमण"
  ]
};

/**
 * Extracts facts (duration, sub-issue, specific keywords) from user raw complaint.
 */
export function extractFacts(rawText: string): ExtractedFacts {
  const text = rawText.toLowerCase();
  const facts: ExtractedFacts = {};

  // 1. Duration Extraction
  const durationRegexes = [
    /(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(months?|days?|years?|weeks?)/i,
    /(\d+|एक|दो|तीन|चार|पांच|छह|सात|आठ|नौ|दस)\s*(महीने|महीनों|साल|दिन|हफ्ते)/i,
    /(\d+|ఒక|రెండు|మూడు|నాలుగు|ఐదు|ఆరు|ఏడు|ఎనిమిది|తొమ్మిది|పది)\s*(నెలలు|నెలలుగా|రోజులు|సంవత్సరాలు)/i,
    /(\d+|ஒன்று|இரண்டு|மூன்று|நான்கு|ஐந்து|ஆறு)\s*(மாதங்கள்|மாதங்களாக|நாட்கள்|வருடங்கள்)/i,
    /(\d+|ಒಂದು|ಎರಡು|ಮೂರು|ನಾಲ್ಕು|ಐದು|ಆರು)\s*(ತಿಂಗಳು|ತಿಂಗಳುಗಳಿಂದ|ದಿನಗಳು|ವರ್ಷಗಳು)/i,
    /(\d+|ഒന്ന്|രണ്ട്|മൂന്ന്|നാല്|അഞ്ച്|ആറ്)\s*(മാസം|മാസമായി|ദിവസം|വർഷം)/i,
    /(\d+|এক|দুই|তিন|চার|পাঁচ|ছয়)\s*(মাস|মাস ধরে|দিন|বছর)/i,
    /(\d+|एक|दोन|तीन|चार|पाच|सहा)\s*(महिने|महिन्यांपासून|दिवस|वर्षे)/i
  ];

  for (const rx of durationRegexes) {
    const m = text.match(rx);
    if (m) {
      facts.duration = m[0];
      break;
    }
  }

  // 2. Reference ID or Application No
  const refMatch = rawText.match(/([A-Z0-9]{5,15})/);
  if (refMatch && !["RTI", "THE", "MY"].includes(refMatch[1])) {
    facts.referenceId = refMatch[1];
  }

  return facts;
}

/**
 * Classify domain from text using weighted multi-lingual matching.
 */
export function detectTopicFromText(rawText: string): string {
  const text = rawText.toLowerCase();
  let bestTopic = "general";
  let maxMatches = 0;

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    let count = 0;
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) {
        count += (kw.length > 5 ? 3 : 2);
      }
    }
    if (count > maxMatches) {
      maxMatches = count;
      bestTopic = topic;
    }
  }

  return bestTopic;
}

/**
 * Identifies the specific sub-issue within a domain to ensure non-generic questions.
 */
export function identifySubIssue(rawText: string, domain: string): string {
  const text = rawText.toLowerCase();

  if (domain === "water") {
    if (text.includes("well") || text.includes("clean") || text.includes("cleaning") || text.includes("kuan") || text.includes("bavi") || text.includes("kinaru") || text.includes("borewell") || text.includes("कुआं") || text.includes("బావి") || text.includes("கிணறு") || text.includes("ಬಾವಿ") || text.includes("കിണർ") || text.includes("কুয়া") || text.includes("विहीर") || text.includes("सफाई") || text.includes("శుభ్రం")) {
      return "water.well_cleaning_maintenance";
    }
    if (text.includes("tank") || text.includes("storage") || text.includes("sump") || text.includes("टंकी") || text.includes("ట్యాంక్") || text.includes("தொட்டி")) {
      return "water.tank_storage_cleaning";
    }
    if (text.includes("dirty") || text.includes("contaminated") || text.includes("smell") || text.includes("quality") || text.includes("दूषित") || text.includes("కలుషిత") || text.includes("மாசுபட்ட")) {
      return "water.quality_contamination";
    }
    return "water.supply_irregular";
  }

  if (domain === "scholarship") {
    if (text.includes("reject") || text.includes("rejection") || text.includes("खारिज") || text.includes("రద్దు") || text.includes("తిరస్కరించ") || text.includes("மறுக்க") || text.includes("ನಿರಾಕರಿಸ") || text.includes("നിരസ") || text.includes("প্রত্যাখ্যান")) {
      return "scholarship.rejection";
    }
    if (text.includes("fee") || text.includes("reimbursement") || text.includes("शुल्क") || text.includes("ఫీజు") || text.includes("கட்டணம்")) {
      return "scholarship.fee_reimbursement";
    }
    return "scholarship.delay_pending";
  }

  if (domain === "electricity") {
    if (text.includes("bill") || text.includes("reading") || text.includes("calculation") || text.includes("high bill") || text.includes("बिल") || text.includes("బిల్లు") || text.includes("கட்டணம்") || text.includes("ಬಿಲ್")) {
      return "electricity.billing_meter";
    }
    if (text.includes("street") || text.includes("light") || text.includes("pole") || text.includes("స్ట్రీట్") || text.includes("దీపాలు") || text.includes("தெரு விளக்கு") || text.includes("ಬೀದಿ ದೀಪ") || text.includes("बत्ती")) {
      return "electricity.streetlights";
    }
    return "electricity.outage_power";
  }

  if (domain === "health") {
    if (text.includes("x-ray") || text.includes("xray") || text.includes("machine") || text.includes("equipment") || text.includes("scan") || text.includes("एक्स-रे") || text.includes("ఎక్స్-రే") || text.includes("உபகரணம்")) {
      return "health.xray_equipment";
    }
    if (text.includes("medicine") || text.includes("drug") || text.includes("stock") || text.includes("दवा") || text.includes("మందులు") || text.includes("மருந்து") || text.includes("ಔಷಧ")) {
      return "health.medicines_stock";
    }
    return "health.infrastructure_service";
  }

  if (domain === "civic-service") {
    if (text.includes("pothole") || text.includes("road") || text.includes("गड्ढा") || text.includes("सड़क") || text.includes("గుంత") || text.includes("రోడ్డు") || text.includes("சாலை") || text.includes("ಗುಂಡಿ")) {
      return "civic.potholes_roads";
    }
    if (text.includes("garbage") || text.includes("drain") || text.includes("waste") || text.includes("कचरा") || text.includes("మురుగు") || text.includes("சாக்கடை") || text.includes("ಕಸ")) {
      return "civic.drainage_garbage";
    }
    return "civic.maintenance";
  }

  if (domain === "pension") {
    if (text.includes("reject") || text.includes("stopped") || text.includes("hold") || text.includes("बंद") || text.includes("ఆగిపో")) {
      return "pension.stopped_rejected";
    }
    if (text.includes("pf") || text.includes("gratuity") || text.includes("भविष्य निधि") || text.includes("గ్రాట్యుటీ")) {
      return "pension.pf_gratuity";
    }
    return "pension.delay_pending";
  }

  if (domain === "police") {
    if (text.includes("not registered") || text.includes("refused") || text.includes("fir") || text.includes("दर्ज नहीं") || text.includes("నమోదు చేయలేదు") || text.includes("பதிவு செய்யவில்லை")) {
      return "police.fir_not_registered";
    }
    return "police.investigation_progress";
  }

  if (domain === "land") {
    if (text.includes("mutation") || text.includes("दाखिल खारिज") || text.includes("म्यूटेशन") || text.includes("మ్యుటేషన్") || text.includes("নামজারি") || text.includes("फेरफार")) {
      return "land.mutation_pending";
    }
    return "land.survey_records";
  }

  return "general.public_records";
}

// Translations for Understanding
const TRANSLATIONS_UNDERSTAND: Record<Lang, Record<string, { summary: string; suitability_reason: string }>> = {
  en: {
    water: { summary: "Drinking water well cleaning, pipeline maintenance, and water quality testing records.", suitability_reason: "Eligible under RTI Act Section 2(f) & 2(j) — requests maintenance logbooks, quality test reports, and repair records." },
    scholarship: { summary: "Scholarship or educational financial assistance application processing and disbursement delay.", suitability_reason: "Eligible under RTI Act Section 2(f) — you are requesting existing government scholarship disbursement and file processing records." },
    pension: { summary: "Pension, provident fund, or retirement benefit processing and payment records.", suitability_reason: "Eligible under RTI Act Section 2(f) — you are seeking official pension file movement and sanction details." },
    "civic-service": { summary: "Road maintenance, pothole repairs, drainage work orders, and local civic amenities.", suitability_reason: "Eligible under RTI Act Section 2(j) — citizens have the statutory right to inspect public work orders, expenditure, and maintenance logs." },
    health: { summary: "Government hospital infrastructure, diagnostic equipment maintenance, and medicine availability records.", suitability_reason: "Eligible under RTI Act Section 2(f) — requests official stock registers, equipment downtime logs, and procurement files." },
    electricity: { summary: "Streetlight maintenance, electrical infrastructure repairs, or billing computation records.", suitability_reason: "Eligible under RTI Act Section 2(f) — pertains to public maintenance work orders, fault registers, or billing data." },
    police: { summary: "Police complaint registration (FIR), General Diary entry, or inquiry progress records.", suitability_reason: "Eligible under RTI Act Section 2(f) — requests certified copies of daily diary entries and inquiry action reports." },
    land: { summary: "Land mutation, title transfer, survey records, or revenue department file processing.", suitability_reason: "Eligible under RTI Act Section 2(f) — requests certified copies of mutation registers, field inspection notes, and hearing orders." },
    general: { summary: "Public administration inquiry and official government record request.", suitability_reason: "Eligible under RTI Act Section 2(f) as an information request for certified public records." }
  },
  hi: {
    water: { summary: "पेयजल कुएं की सफाई, जलापूर्ति कार्यक्रम, पाइपलाइन रखरखाव और जल गुणवत्ता परीक्षण रिकॉर्ड।", suitability_reason: "आरटीआई अधिनियम की धारा 2(f) व 2(j) के तहत पात्र — कुआं सफाई लॉगबुक, जलापूर्ति रजिस्टर और गुणवत्ता जांच रिपोर्ट सार्वजनिक रिकॉर्ड हैं।" },
    scholarship: { summary: "छात्रवृत्ति अथवा शैक्षणिक वित्तीय सहायता के वितरण और प्रक्रिया में विलंब की स्थिति।", suitability_reason: "सूचना का अधिकार अधिनियम की धारा 2(f) के तहत पात्र — आप सरकारी छात्रवृत्ति वितरण और फाइल नोटिंग रिकॉर्ड मांग रहे हैं।" },
    pension: { summary: "पेंशन, भविष्य निधि या सेवानिवृत्ति लाभ के भुगतान और फाइल प्रविष्टि संबंधी रिकॉर्ड।", suitability_reason: "आरटीआई अधिनियम की धारा 2(f) के तहत पात्र — आप आधिकारिक पेंशन संवितरण और स्वीकृति रिकॉर्ड की मांग कर रहे हैं।" },
    "civic-service": { summary: "सड़क मरम्मत, गड्ढे भरने, नाला सफाई और नागरिक विकास कार्यों का विवरण।", suitability_reason: "आरटीआई अधिनियम की धारा 2(j) के तहत पात्र — नागरिकों को सार्वजनिक कार्य आदेशों और व्यय रजिस्टर के निरीक्षण का कानूनी अधिकार है।" },
    health: { summary: "सरकारी अस्पताल की आधारभूत संरचना, नैदानिक उपकरण एवं दवाओं के स्टॉक रिकॉर्ड।", suitability_reason: "आरटीआई अधिनियम की धारा 2(f) के तहत पात्र — अस्पताल उपकरण लॉग और दवा खरीद व स्टॉक रिकॉर्ड की मांग की जा सकती है।" },
    electricity: { summary: "स्ट्रीट लाइट मरम्मत, विद्युत आपूर्ति अथवा बिजली बिल गणना से संबंधित रिकॉर्ड।", suitability_reason: "आरटीआई अधिनियम की धारा 2(f) के तहत पात्र — सार्वजनिक रखरखाव कार्य आदेश और शिकायत लॉग आरटीआई के दायरे में आते हैं।" },
    police: { summary: "पुलिस शिकायत (एफआईआर) पंजीकरण, दैनिक डायरी प्रविष्टि अथवा जांच प्रगति का विवरण।", suitability_reason: "आरटीआई अधिनियम की धारा 2(f) के तहत पात्र — जीडी प्रविष्टि और जांच रिपोर्ट की प्रमाणित प्रतियां प्राप्त की जा सकती हैं।" },
    land: { summary: "भूमि दाखिल-खारिज (म्यूटेशन), नामांतरण, सर्वेक्षण अथवा राजस्व विभाग की फाइल स्थिति।", suitability_reason: "आरटीआई अधिनियम की धारा 2(f) के तहत पात्र — नामांतरण रजिस्टर और राजस्व निरीक्षण रिपोर्ट की प्रमाणित प्रतियां प्राप्त की जा सकती हैं।" },
    general: { summary: "सार्वजनिक प्रशासन और आधिकारिक सरकारी रिकॉर्ड से संबंधित सूचना अनुरोध।", suitability_reason: "आरटीआई अधिनियम की धारा 2(f) के तहत सरकारी रिकॉर्ड की प्रमाणित प्रति प्राप्त करना वैध है।" }
  },
  te: {
    water: { summary: "ప్రభుత్వ బావి శుభ్రపరచడం, తాగునీటి సరఫరా షెడ్యూల్, పైప్‌లైన్ నిర్వహణ మరియు నీటి నాణ్యత పరీక్షల రికార్డులు.", suitability_reason: "ఆర్టీఐ చట్టం సెక్షన్ 2(f) & 2(j) ప్రకారం అర్హమైనది — బావి శుభ్రత లాగ్‌బుక్, నీటి సరఫరా మరియు పరీక్ష నివేదికలు పబ్లిక్ రికార్డులు." },
    scholarship: { summary: "స్కాలర్‌షిప్ లేదా విద్యా ఆర్థిక సహాయం మంజూరు మరియు చెల్లింపుల జాప్యానికి సంబంధించిన వివరాలు.", suitability_reason: "ఆర్టీఐ చట్టం సెక్షన్ 2(f) ప్రకారం అర్హమైనది — మీరు ప్రభుత్వ స్కాలర్‌షిప్ మంజూరు మరియు ఫైల్ రికార్డులను కోరుతున్నారు." },
    pension: { summary: "పెన్షన్ లేదా పదవీ విరమణ ప్రయోజనాల చెల్లింపు రికార్డులు మరియు ఫైల్ స్థితి వివరాలు.", suitability_reason: "ఆర్టీఐ చట్టం సెక్షన్ 2(f) ప్రకారం అర్హమైనది — పెన్షన్ మంజూరు మరియు దస్త్రం కదలికల రికార్డులను పొందవచ్చు." },
    "civic-service": { summary: "రోడ్ల మరమ్మతులు, గుంతలు పూడ్చడం, డ్రైనేజీ పనుల వర్క్ ఆర్డర్లు మరియు పౌర సౌకర్యాల వివరాలు.", suitability_reason: "ఆర్టీఐ చట్టం సెక్షన్ 2(j) ప్రకారం అర్హమైనది — పౌరులకు ప్రభుత్వ పనుల రికార్డులు మరియు వ్యయాలను పరిశీలించే హక్కు ఉంది." },
    health: { summary: "ప్రభుత్వ ఆసుపత్రి సౌకర్యాలు, వైద్య పరికరాల నిర్వహణ మరియు మందుల లభ్యత రికార్డులు.", suitability_reason: "ఆర్టీఐ చట్టం సెక్షన్ 2(f) ప్రకారం అర్హమైనది — పరికరాల రిపేర్ లాగ్‌బుక్ మరియు మందుల స్టాక్ రికార్డులు కోరవచ్చు." },
    electricity: { summary: "వీధి దీపాల నిర్వహణ, విద్యుత్ సరఫరా లేదా విద్యుత్ బిల్లు గణన రికార్డులు.", suitability_reason: "ఆర్టీఐ చట్టం సెక్షన్ 2(f) ప్రకారం అర్హమైనది — వీధి దీపాల మరమ్మతు వర్క్ ఆర్డర్లు మరియు ఫిర్యాదుల రిజిస్టర్లను పొందవచ్చు." },
    police: { summary: "పోలీస్ ఫిర్యాదు నమోదు (FIR), జనరల్ డైరీ ఎంట్రీ లేదా విచారణ పురోగతి వివరాలు.", suitability_reason: "ఆర్టీఐ చట్టం సెక్షన్ 2(f) ప్రకారం అర్హమైనది — డైరీ రికార్డులు మరియు దర్యాప్తు చర్యల నివేదికల కాపీలను పొందవచ్చు." },
    land: { summary: "భూమి మ్యుటేషన్, పట్టా బదిలీ, సర్వే లేదా రెవెన్యూ దస్త్రాల పరిశీలన రికార్డులు.", suitability_reason: "ఆర్టీఐ చట్టం సెక్షన్ 2(f) ప్రకారం అర్హమైనది — మ్యుటేషన్ రిజిస్టర్ మరియు క్షేత్రస్థాయి విచారణ రికార్డుల కాపీలు పొందవచ్చు." },
    general: { summary: "ప్రభుత్వ పరిపాలన మరియు అధికారిక రికార్డులకు సంబంధించిన సమాచార అభ్యర్థన.", suitability_reason: "ఆర్టీఐ చట్టం సెక్షన్ 2(f) ప్రకారం ధృవీకరించిన కాపీలను కోరడం చట్టబద్ధం." }
  },
  ta: {
    water: { summary: "அரசு கிணறு சுத்தம் செய்தல், குடிநீர் விநியோக கால அட்டவணை, குழாய் பராமரிப்பு மற்றும் நீர் தர பரிசோதனை பதிவுகள்.", suitability_reason: "ஆர்டிஐ சட்டம் பிரிவு 2(f) & 2(j)ன் கீழ் தகுதியானது — கிணறு பராமரிப்பு பதிவேடு மற்றும் தர பரிசோதனை அறிக்கைகள் பொது ஆவணங்கள் ஆகும்." },
    scholarship: { summary: "கல்வி உதவித்தொகை அல்லது கட்டண சலுகை விண்ணப்ப செயலாக்கம் மற்றும் தாமதம் குறித்த தகவல்.", suitability_reason: "ஆர்டிஐ சட்டம் பிரிவு 2(f)ன் கீழ் தகுதியானது — கல்வி உதவித்தொகை பதிவேடுகள் மற்றும் கோப்பு குறிப்புகளைக் கோரலாம்." },
    pension: { summary: "ஓய்வூதியம் அல்லது நிதிப்பலன்கள் வழங்கல் மற்றும் கோப்பு நகர்வு குறித்த பதிவுகள்.", suitability_reason: "ஆர்டிஐ சட்டம் பிரிவு 2(f)ன் கீழ் தகுதியானது — ஓய்வூதிய கோப்பு செயலாக்கம் மற்றும் ஒப்புதல் பதிவுகளைப் பெறலாம்." },
    "civic-service": { summary: "சாலை பராமரிப்பு, குழி பழுதுபார்ப்பு, வடிகால் மற்றும் உள்ளூர் வளர்ச்சி பணிகள்.", suitability_reason: "ஆர்டிஐ சட்டம் பிரிவு 2(j)ன் கீழ் தகுதியானது — அரசு பணி ஆணைகள் மற்றும் செலவின பதிவேடுகளை ஆய்வு செய்ய சட்ட உரிமை உண்டு." },
    health: { summary: "அரசு மருத்துவமனை உள்கட்டமைப்பு, மருத்துவ உபகரணங்கள் மற்றும் மருந்து இருப்பு விவரங்கள்.", suitability_reason: "ஆர்டிஐ சட்டம் பிரிவு 2(f)ன் கீழ் தகுதியானது — உபகரண பராமரிப்பு பதிவேடு மற்றும் மருந்து இருப்பு பதிவுகளைக் கோரலாம்." },
    electricity: { summary: "தெரு விளக்கு பராமரிப்பு, மின் கட்டமைப்பு அல்லது மின் கட்டண கணக்கீட்டு பதிவுகள்.", suitability_reason: "ஆர்டிஐ சட்டம் பிரிவு 2(f)ன் கீழ் தகுதியானது — பராமரிப்பு பணி ஆணைகள் மற்றும் புகார் பதிவேடுகளைப் பெறலாம்." },
    police: { summary: "காவல்துறை புகார் பதிவு (FIR), பொது நாட்குறிப்பு பதிவு அல்லது விசாரணை நிலை.", suitability_reason: "ஆர்டிஐ சட்டம் பிரிவு 2(f)ன் கீழ் தகுதியானது — நாட்குறிப்பு பதிவுகள் மற்றும் விசாரணை அறிக்கையின் நகல்களைக் கோரலாம்." },
    land: { summary: "நிலப்பட்டா மாறுதல் (மியூட்டேஷன்), நில அளவை அல்லது வருவாய்த்துறை கோப்பு விவரங்கள்.", suitability_reason: "ஆர்டிஐ சட்டம் பிரிவு 2(f)ன் கீழ் தகுதியானது — பட்டா மாறுதல் பதிவேடு மற்றும் கள ஆய்வு குறிப்புகளின் நகல்களைப் பெறலாம்." },
    general: { summary: "பொது நிர்வாகம் மற்றும் அரசு ஆவணங்கள் தொடர்பான தகவல் கோரிக்கை.", suitability_reason: "ஆர்டிஐ சட்டம் பிரிவு 2(f)ன் கீழ் சான்றளிக்கப்பட்ட நகல்களைப் பெறுவது சட்டப்பூர்வமானது." }
  },
  kn: {
    water: { summary: "ಸರ್ಕಾರಿ ಬಾವಿಯ ಸ್ವಚ್ಛತೆ, ಕುಡಿಯುವ ನೀರು ಸರಬರಾಜು ವೇಳಾಪಟ್ಟಿ, ಪೈಪ್‌ಲೈನ್ ನಿರ್ವಹಣೆ ಮತ್ತು ನೀರಿನ ಗುಣಮಟ್ಟ ವರದಿಗಳು.", suitability_reason: "ಆರ್‌ಟಿಐ ಕಾಯ್ದೆ ಸೆಕ್ಷನ್ 2(f) & 2(j) ಅಡಿಯಲ್ಲಿ ಅರ್ಹವಾಗಿದೆ — ಬಾವಿ ನಿರ್ವಹಣಾ ಲಾಗ್‌ಬುಕ್ ಮತ್ತು ಗುಣಮಟ್ಟ ವರದಿಗಳು ಸಾರ್ವಜನಿಕ ದಾಖಲೆಗಳಾಗಿವೆ." },
    scholarship: { summary: "ವಿದ್ಯಾರ್ಥಿವೇತನ ಅಥವಾ ಶೈಕ್ಷಣಿಕ ನೆರವು ಮಂಜೂರಾತಿ ಮತ್ತು ವಿಳಂಬದ ವಿವರಗಳು.", suitability_reason: "ಆರ್‌ಟಿಐ ಕಾಯ್ದೆ ಸೆಕ್ಷನ್ 2(f) ಅಡಿಯಲ್ಲಿ ಅರ್ಹವಾಗಿದೆ — ವಿದ್ಯಾರ್ಥಿವೇತನ ಕಡತದ ನಡಾವಳಿ ದಾಖಲೆಗಳನ್ನು ಪಡೆಯಬಹುದು." },
    pension: { summary: "ಪಿಂಚಣಿ ಅಥವಾ ನಿವೃತ್ತಿ ಸೌಲಭ್ಯಗಳ ವಿತರಣೆ ಮತ್ತು ಕಡತ ವಿಲೇವಾರಿ ದಾಖಲೆಗಳು.", suitability_reason: "ಆರ್‌ಟಿಐ ಕಾಯ್ದೆ ಸೆಕ್ಷನ್ 2(f) ಅಡಿಯಲ್ಲಿ ಅರ್ಹವಾಗಿದೆ — ಪಿಂಚಣಿ ಮಂಜೂರಾತಿ ಮತ್ತು ಕಡತ ಚಲನವಲನದ ವಿವರ ಕೋರಬಹುದು." },
    "civic-service": { summary: "ರಸ್ತೆ ದುರಸ್ತಿ, ಗುಂಡಿ ಮುಚ್ಚುವುದು, ಚರಂಡಿ ಕಾಮಗಾರಿ ಮತ್ತು ಸ್ಥಳೀಯ ಸೌಲಭ್ಯಗಳ ದಾಖಲೆಗಳು.", suitability_reason: "ಆರ್‌ಟಿಐ ಕಾಯ್ದೆ ಸೆಕ್ಷನ್ 2(j) ಅಡಿಯಲ್ಲಿ ಅರ್ಹವಾಗಿದೆ — ಸಾರ್ವಜನಿಕ ಕಾಮಗಾರಿ ಆದೇಶಗಳು ಮತ್ತು ವೆಚ್ಚದ ದಾಖಲೆ ಪರಿಶೀಲಿಸಲು ಹಕ್ಕಿದೆ." },
    health: { summary: "ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆ ಮೂಲಸೌಕರ್ಯ, ವೈದ್ಯಕೀಯ ಉಪಕರಣ ಮತ್ತು ಔಷಧಿ ದಾಸ್ತಾನು ದಾಖಲೆಗಳು.", suitability_reason: "ಆರ್‌ಟಿಐ ಕಾಯ್ದೆ ಸೆಕ್ಷನ್ 2(f) ಅಡಿಯಲ್ಲಿ ಅರ್ಹವಾಗಿದೆ — ಉಪಕರಣ ರಿಪೇರಿ ಮತ್ತು ಔಷಧಿ ದಾಸ್ತಾನು ರಿಜಿಸ್ಟರ್ ಕೋರಬಹುದು." },
    electricity: { summary: "ಬೀದಿ ದೀಪ ನಿರ್ವಹಣೆ, ವಿದ್ಯುತ್ ಸರಬರಾಜು ಅಥವಾ ವಿದ್ಯುತ್ ಬಿಲ್ ಲೆಕ್ಕಾಚಾರದ ದಾಖಲೆಗಳು.", suitability_reason: "ಆರ್‌ಟಿಐ ಕಾಯ್ದೆ ಸೆಕ್ಷನ್ 2(f) ಅಡಿಯಲ್ಲಿ ಅರ್ಹವಾಗಿದೆ — ದುರಸ್ತಿ ಕಾರ್ಯಾದೇಶಗಳು ಮತ್ತು ದೂರು ರಿಜಿಸ್ಟರ್ ಪಡೆಯಬಹುದು." },
    police: { summary: "ಪೊಲೀಸ್ ದೂರು ನೋಂದಣಿ (ಎಫ್‌ಐಆರ್), ಜನರಲ್ ಡೈರಿ ನಮೂದು ಅಥವಾ ತನಿಖಾ ಪ್ರಗತಿಯ ವಿವರ.", suitability_reason: "ಆರ್‌ಟಿಐ ಕಾಯ್ದೆ ಸೆಕ್ಷನ್ 2(f) ಅಡಿಯಲ್ಲಿ ಅರ್ಹವಾಗಿದೆ — ಡೈರಿ ನಮೂದುಗಳು ಮತ್ತು ತನಿಖಾ ವರದಿಯ ದೃಢೀಕೃತ ಪ್ರತಿ ಪಡೆಯಬಹುದು." },
    land: { summary: "ಜಮೀನು ಖಾತಾ ಬದಲಾವಣೆ (ಮ್ಯುಟೇಶನ್), ಸರ್ವೆ ಅಥವಾ ಕಂದಾಯ ಇಲಾಖೆ ಕಡತ ವಿಲೇವಾರಿ.", suitability_reason: "ಆರ್‌ಟಿಐ ಕಾಯ್ದೆ ಸೆಕ್ಷನ್ 2(f) ಅಡಿಯಲ್ಲಿ ಅರ್ಹವಾಗಿದೆ — ಮ್ಯುಟೇಶನ್ ರಿಜಿಸ್ಟರ್ ಮತ್ತು ಸ್ಥಳ ತಪಾಸಣಾ ವರದಿಗಳ ಪ್ರತಿ ಪಡೆಯಬಹುದು." },
    general: { summary: "ಸಾರ್ವಜನಿಕ ಆಡಳಿತ ಮತ್ತು ಅಧಿಕೃತ ಸರ್ಕಾರಿ ದಾಖಲೆಗಳಿಗೆ ಸಂಬಂಧಿಸಿದ ಮಾಹಿತಿ ಕೋರಿಕೆ.", suitability_reason: "ಆರ್‌ಟಿಐ ಕಾಯ್ದೆ ಸೆಕ್ಷನ್ 2(f) ಅಡಿಯಲ್ಲಿ ದೃಢೀಕೃತ ಪ್ರತಿಗಳನ್ನು ಕೋರುವುದು ಕಾನೂನುಬದ್ಧವಾಗಿದೆ." }
  },
  ml: {
    water: { summary: "സർക്കാർ കിണർ വൃത്തിയാക്കൽ, കുടിവെള്ള വിതരണ ഷെഡ്യൂൾ, പൈപ്പ്‌ലൈൻ അറ്റകുറ്റപ്പണി, ജല ഗുണനിലവാര പരിശോധന രേഖകൾ.", suitability_reason: "ആർടിഐ നിയമം സെക്ഷൻ 2(f) & 2(j) പ്രകാരം അർഹമായത് — കിണർ പരിപാലന രേഖകളും ജല പരിശോധനാ റിപ്പോർട്ടുകളും ലഭ്യമാക്കാം." },
    scholarship: { summary: "സ്കോളർഷിപ്പ് അല്ലെങ്കിൽ വിദ്യാഭ്യാസ ആനുകൂല്യങ്ങളുടെ വിതരണത്തിൽ ഉണ്ടായ കാലതാമസത്തിന്റെ വിവരങ്ങൾ.", suitability_reason: "ആർടിഐ നിയമം സെക്ഷൻ 2(f) പ്രകാരം അർഹമായത് — സ്കോളർഷിപ്പ് ഫയൽ കുറിപ്പുകളുടെ പകർപ്പുകൾ ആവശ്യപ്പെടാം." },
    pension: { summary: "പെൻഷൻ അല്ലെങ്കിൽ വിരമിക്കൽ ആനുകൂല്യങ്ങളുടെ പ്രോസസ്സിംഗ് വിവരങ്ങളും ഫയൽ കുറിപ്പുകളും.", suitability_reason: "ആർടിഐ നിയമം സെക്ഷൻ 2(f) പ്രകാരം അർഹമായത് — പെൻഷൻ അനുവദിച്ച രേഖകളും കാലതാമസത്തിന്റെ കാരണങ്ങളും ലഭ്യമാക്കാം." },
    "civic-service": { summary: "റോഡ് അറ്റകുറ്റപ്പണികൾ, കുഴിയടയ്ക്കൽ, ഡ്രെയിനേജ് വർക്ക് ഓർഡറുകൾ എന്നിവയുടെ വിവരങ്ങൾ.", suitability_reason: "ആർടിഐ നിയമം സെക്ഷൻ 2(j) പ്രകാരം അർഹമായത് — പൊതുമരാമത്ത് പ്രവൃത്തികളുടെ രേഖകളും ചെലവ് വിവരങ്ങളും പരിശോധിക്കാം." },
    health: { summary: "സർക്കാർ ആശുപത്രി സൗകര്യങ്ങൾ, ഉപകരണങ്ങളുടെ പ്രവർത്തനം, മരുന്ന് സ്റ്റോക്ക് രേഖകൾ.", suitability_reason: "ആർടിഐ നിയമം സെക്ഷൻ 2(f) പ്രകാരം അർഹമായത് — ആശുപത്രി ഉപകരണ ലോഗ് ബുക്കും മരുന്ന് വാങ്ങിയ രേഖകളും ആവശ്യപ്പെടാം." },
    electricity: { summary: "തെരുവ് വിളക്ക് പരിപാലനം, വൈദ്യുതി തകരാറുകൾ അല്ലെങ്കിൽ ബിൽ കണക്കുകൂട്ടൽ രേഖകൾ.", suitability_reason: "ആർടിഐ നിയമം സെക്ഷൻ 2(f) പ്രകാരം അർഹമായത് — തെരുവ് വിളക്ക് അറ്റകുറ്റപ്പണി വർക്ക് ഓർഡറുകൾ പബ്ലിക് രേഖകളാണ്." },
    police: { summary: "പോലീസ് പരാതി രജിസ്ട്രേഷൻ (FIR), ജനറൽ ഡയറി എൻട്രി അല്ലെങ്കിൽ അന്വേഷണ പുരോഗതി.", suitability_reason: "ആർടിഐ നിയമം സെക്ഷൻ 2(f) പ്രകാരം അർഹമായത് — ജനറൽ ഡയറി രേഖകളും അന്വേഷണ റിപ്പോർട്ടിന്റെ പകർപ്പും ലഭിക്കും." },
    land: { summary: "ഭൂമി പോക്കുവരവ് (മ്യൂട്ടേഷൻ), പട്ടയം, സർവേ അല്ലെങ്കിൽ റവന്യൂ ഫയൽ വിവരങ്ങൾ.", suitability_reason: "ആർടിഐ നിയമം സെക്ഷൻ 2(f) പ്രകാരം അർഹമായത് — പോക്കുവരവ് രജിസ്റ്ററും പരിശോധനാ റിപ്പോർട്ടുകളുടെ പകർപ്പും ലഭിക്കും." },
    general: { summary: "പൊതുഭരണവും ഔദ്യോഗിക സർക്കാർ രേഖകളും സംബന്ധിച്ച വിവരങ്ങൾ.", suitability_reason: "ആർടിഐ നിയമം സെക്ഷൻ 2(f) പ്രകാരം സാക്ഷ്യപ്പെടുത്തിയ പകർപ്പുകൾ ആവശ്യപ്പെടാൻ അവകാശമുണ്ട്." }
  },
  bn: {
    water: { summary: "সরকারি কুয়ার সংস্কার ও পরিচ্ছন্নতা, পানীয় জল সরবরাহ সময়সূচী, পাইপলাইন মেরামত ও জলের গুণমান পরীক্ষার রিপোর্ট।", suitability_reason: "আরটিআই আইন ধারা ২(f) ও ২(j) অনুযায়ী উপযুক্ত — কুয়া রক্ষণাবেক্ষণ রেজিস্টার ও জলের গুণমান পরীক্ষার সার্টিফিকেট চাওয়া যাবে।" },
    scholarship: { summary: "স্কলারশিপ বা শিক্ষা অনুদানের আবেদন প্রক্রিয়া ও বিতরণে বিলম্বের সরকারি রেকর্ড।", suitability_reason: "আরটিআই আইন ধারা ২(f) অনুযায়ী উপযুক্ত — স্কলারশিপ অনুমোদন ও ফাইল নোট সংক্রান্ত তথ্য চাওয়া যাবে।" },
    pension: { summary: "পেনশন বা অবসরকালীন ভাতার অনুমোদন এবং প্রক্রিয়াকরণের ফাইল রেকর্ড।", suitability_reason: "আরটিআই আইন ধারা ২(f) অনুযায়ী উপযুক্ত — পেনশন বিতরণ ও ফাইল নোটের অনুলিপি পাওয়ার অধিকার আছে।" },
    "civic-service": { summary: "রাস্তা মেরামত, গর্ত বোজানো, নিকাশি ও স্থানীয় উন্নয়ন সংক্রান্ত তথ্যাদি।", suitability_reason: "আরটিআই আইন ধারা ২(j) অনুযায়ী উপযুক্ত — সরকারি কাজের ওয়ার্ক অর্ডার ও খরচের খতিয়ান পরীক্ষা করার অধিকার রয়েছে।" },
    health: { summary: "সরকারি হাসপাতালের পরিকাঠামো, ডায়াগনস্টিক যন্ত্রপাতির সচলতা ও ওষুধের স্টক রেকর্ড।", suitability_reason: "আরটিআই আইন ধারা ২(f) অনুযায়ী উপযুক্ত — হাসপাতালের যন্ত্রপাতি লগবুক ও ওষুধ ক্রয়ের বিবরণ চাওয়া যাবে।" },
    electricity: { summary: "রাস্তার আলো রক্ষণাবেক্ষণ, বিদ্যুৎ বিভ্রাট বা বিদ্যুৎ বিলের হিসাব সংক্রান্ত রেকর্ড।", suitability_reason: "আরটিআই আইন ধারা ২(f) অনুযায়ী উপযুক্ত — আলো মেরামত ওয়ার্ক অর্ডার ও অভিযোগ রেজিস্টার সরকারি নথির অন্তর্ভুক্ত।" },
    police: { summary: "পুলিশি অভিযোগ দায়ের (এফআইআর), জেনারেল ডায়েরি এন্ট্রি বা তদন্তের অগ্রগতি রিপোর্ট।", suitability_reason: "আরটিআই আইন ধারা ২(f) অনুযায়ী উপযুক্ত — জিডি এন্ট্রি ও তদন্তের অগ্রগতির প্রত্যয়িত কপি পাওয়া যাবে।" },
    land: { summary: "জমির নামজারি (মিউটেশন), পরচা, জরিপ বা রাজস্ব বিভাগের ফাইল নিষ্পত্তির বিবরণ।", suitability_reason: "আরটিআই আইন ধারা ২(f) অনুযায়ী উপযুক্ত — নামজারি রেজিস্টার ও তদন্ত প্রতিবেদনের অনুলিপি পাওয়া যাবে।" },
    general: { summary: "প্রশাসন ও সরকারি নথিপত্র সম্পর্কিত তথ্য সংক্রান্ত অনুরোধ।", suitability_reason: "আরটিআই আইন ধারা ২(f) অনুযায়ী প্রত্যয়িত অনুলিপি চাওয়া সম্পূর্ণ আইনসম্মত।" }
  },
  mr: {
    water: { summary: "शासकीय विहिरीची स्वच्छता, गाळ काढणे, पिण्याच्या पाण्याचे वेळापत्रक, पाईपलाईन दुरुस्ती व पाणी गुणवत्ता चाचणी अहवाल.", suitability_reason: "आरटीआय कायदा कलम २(f) व २(j) अंतर्गत पात्र — विहीर देखभाल नोंदवही, पाणी पुरवठा लॉगबुक व गुणवत्ता अहवाल आरटीआय अंतर्गत मिळतात." },
    scholarship: { summary: "शिष्यवृत्ती किंवा शैक्षणिक आर्थिक सहाय्य अर्ज प्रक्रिया व वितरणातील विलंबाचे रेकॉर्ड.", suitability_reason: "आरटीआय कायदा कलम २(f) अंतर्गत पात्र — आपण सरकारी शिष्यवृत्ती मंजुरी व फाइल टिपण्यांची माहिती मागत आहात." },
    pension: { summary: "पेन्शन किंवा निवृत्तीवेतन लाभ मंजुरी व वितरण विलंबाच्या फाइल नोंदी.", suitability_reason: "आरटीआय कायदा कलम २(f) अंतर्गत पात्र — पेन्शन मंजुरी प्रक्रिया व फाइल हालचालीचे अधिकृत रेकॉर्ड मिळवता येते." },
    "civic-service": { summary: "रस्ते दुरुस्ती, खड्डे भरणे, सांडपाणी वाहिनी व स्थानिक विकास कामांचे वर्क ऑर्डर रेकॉर्ड.", suitability_reason: "आरटीआय कायदा कलम २(j) अंतर्गत पात्र — नागरिकांना सरकारी कामांचे आदेश व खर्चाचे रजिस्टर तपासण्याचा अधिकार आहे." },
    health: { summary: "शासकीय रुग्णालयातील सुविधा, उपकरणांची स्थिती व औषध साठ्याचे अधिकृत रजिस्टर.", suitability_reason: "आरटीआय कायदा कलम २(f) अंतर्गत पात्र — उपकरण देखभाल लॉग व औषध खरेदी-वाटपाचे रेकॉर्ड मागता येते." },
    electricity: { summary: "स्ट्रीट लाईट दुरुस्ती, वीज पुरवठा खंडित होणे किंवा वीज बिल गणनेचे तपशील.", suitability_reason: "आरटीआय कायदा कलम २(f) अंतर्गत पात्र — पथदिवे दुरुस्ती वर्क ऑर्डर व तक्रार रजिस्टर सार्वजनिक माहिती आहे." },
    police: { summary: "पोलीस तक्रार नोंद (एफआयआर), जनरल डायरी नोंद अथवा चौकशीच्या प्रगतीचा अहवाल.", suitability_reason: "आरटीआय कायदा कलम २(f) अंतर्गत पात्र — डायरी नोंद व तपास अहवालाची प्रमाणित प्रत मिळवता येते." },
    land: { summary: "जमीन फेरफार (म्यूटेशन), सातबारा नोंदणी, मोजणी किंवा महसूल विभागातील फाइल प्रक्रिया.", suitability_reason: "आरटीआय कायदा कलम २(f) अंतर्गत पात्र — फेरफार नोंदवही व स्थळ पाहणी अहवालाची प्रमाणित प्रत मागता येते." },
    general: { summary: "सार्वजनिक प्रशासन आणि शासकीय अभिलेखांशी संबंधित माहिती विनंती.", suitability_reason: "आरटीआय कायदा कलम २(f) अन्वये प्रमाणित प्रती मिळवणे कायदेशीर आहे." }
  }
};

/**
 * Dynamic RTI Questions Generator:
 * Generates 4 complementary, legally structured RTI queries tailored to the exact sub-issue,
 * injected duration, and user facts.
 * NEVER falls back to scholarship when domain is unclassified.
 */
export function buildDynamicQuestions(
  subIssue: string,
  facts: ExtractedFacts,
  lang: Lang
): string[] {
  const dur = facts.duration;

  // ENGLISH
  if (lang === "en") {
    switch (subIssue) {
      case "water.well_cleaning_maintenance":
        return [
          `Provide certified copies of the official cleaning, desilting, and maintenance logbook for the public/government well in this area${dur ? ` for the past ${dur}` : ""}.`,
          "Provide certified copies of the water quality and bacteriological testing reports conducted on the well water, along with the chlorination schedule and inspection memos.",
          `Provide certified copies of the maintenance work orders, expenditure sanctioned, and funds released to the contractor/agency for the cleaning and repair of this public well${dur ? ` during the past ${dur}` : ""}.`,
          "Provide the name, designation, and official contact details of the Junior Engineer / Gram Panchayat Secretary responsible for the upkeep and sanitation of public drinking water wells in this ward."
        ];
      case "water.tank_storage_cleaning":
        return [
          `Provide certified copies of the overhead water tank cleaning logbook, inspection reports, and sanitization records for this area${dur ? ` for the past ${dur}` : ""}.`,
          "Provide certified copies of the tender contract awarded for water reservoir cleaning and chemical disinfection schedules.",
          "Provide the water quality testing certificates issued after the last periodic cleaning of the storage reservoir.",
          "Provide the name and designation of the Assistant Engineer responsible for inspecting and approving water tank sanitation."
        ];
      case "water.quality_contamination":
        return [
          `Provide certified copies of all chemical and bacteriological water quality testing laboratory reports for tap water supplied to this area${dur ? ` for the past ${dur}` : ""}.`,
          "Provide certified copies of the pipeline inspection logs, contamination complaint registers, and leak repair work orders in this water distribution zone.",
          "Provide the schedule and logbook of chlorination, filtration, and water reservoir cleaning undertaken during the last 6 months.",
          "Provide the name and designation of the Assistant Engineer (Water Supply & Quality Assurance) responsible for safe potable water distribution."
        ];
      case "water.supply_irregular":
        return [
          `Provide certified copies of the daily water pressure logs, pumping hours register, and water supply schedules for this locality${dur ? ` over the past ${dur}` : ""}.`,
          "Provide certified copies of the logbook for government water tanker deployments, trip sheets, and delivery receipts in this water-stressed area.",
          "Provide details of the sanctioned water quota versus actual water volume supplied daily to this distribution feeder during the last 3 months.",
          "Provide the name, designation, and official phone number of the Water Works Engineer responsible for regulating supply and resolving low-pressure complaints."
        ];

      case "scholarship.rejection":
        return [
          "Provide certified copies of the official rejection order, file notings, and recorded legal grounds on which my scholarship application was rejected.",
          "Provide the name, official designation, and office address of the competent authority who authorized the rejection of the scholarship.",
          "Provide certified copies of the eligibility scrutiny checklist and verification remarks recorded by the dealing verification officer.",
          "Provide the relevant statutory guidelines, rules, and circulars along with the prescribed appellate procedure for appealing against this scholarship rejection."
        ];
      case "scholarship.fee_reimbursement":
        return [
          "Provide the current processing status and certified copies of file notings regarding the tuition fee reimbursement / scholarship grant.",
          "Provide certified copies of the fund sanction order, budget allocation register, and treasury release voucher for the concerned academic session.",
          "Provide the recorded reasons and official remarks for the non-disbursement of the sanctioned fee reimbursement amount.",
          "Provide the designation of the officer responsible for releasing the reimbursement amount and the standard statutory processing timeline."
        ];
      case "scholarship.delay_pending":
        return [
          `Provide the current stage-wise processing status and certified copies of all file notings relating to my scholarship application${dur ? ` which has been pending for ${dur}` : ""}.`,
          "Provide the date-wise file movement log showing the dates on which the application was received, reviewed, and forwarded by each dealing official.",
          "Provide the name, designation, and official contact details of the officer currently dealing with this scholarship file.",
          `Provide the recorded official reasons for the delay in disbursement${dur ? ` exceeding ${dur}` : ""} along with the expected date of fund release.`
        ];

      case "electricity.billing_meter":
        return [
          "Provide certified copies of the detailed electricity billing calculation sheet, slab-wise tariff computation, and applicable surcharge breakdown for the disputed billing cycle.",
          "Provide certified copies of the meter reading log, photo-reading records, and MRI (Meter Reading Instrument) download data for the relevant period.",
          "Provide certified copies of the meter testing report, accuracy calibration certificate, and fault investigation records for the concerned electricity meter.",
          "Provide the designation of the billing officer responsible for verifying abnormal consumption spikes and the procedure for billing dispute adjustment."
        ];
      case "electricity.streetlights":
        return [
          `Provide certified copies of the maintenance logbook, fault complaints register, and repair work orders for streetlights in the concerned area${dur ? ` for the past ${dur}` : ""}.`,
          "Provide the name, designation, and official contact details of the electrical contractor or department engineer responsible for streetlight maintenance in this ward/locality.",
          `Provide certified copies of the funds sanctioned, bills submitted, and payments made to the maintenance agency${dur ? ` during the last ${dur}` : " during the current fiscal year"}.`,
          "Provide the recorded reasons for the persistent failure to repair non-functional streetlights and the prescribed statutory timeline for resolving street lighting complaints."
        ];
      case "electricity.outage_power":
        return [
          `Provide certified copies of the power feeder outage log, breakdown register, and daily interruption reports for the concerned locality${dur ? ` during the last ${dur}` : ""}.`,
          "Provide certified copies of the technical inspection reports and load-sanction records for the distribution transformer serving this area.",
          "Provide the recorded reasons for frequent unannounced power disruptions and details of preventive maintenance carried out in the last 6 months.",
          "Provide the designation of the Assistant Engineer (Operations) responsible for power continuity and standard service restoration benchmarks."
        ];

      case "health.xray_equipment":
        return [
          `Provide certified copies of the equipment functionality register, downtime logbook, and maintenance contract (AMC/CMC) for the X-ray machine and diagnostic equipment at this hospital${dur ? ` for the past ${dur}` : ""}.`,
          "Provide certified copies of all repair requisitions, service engineer visit reports, and spare parts procurement orders issued for the non-functional diagnostic equipment.",
          "Provide the total funds allocated, sanctioned, and spent on medical equipment maintenance at this facility during the current and preceding financial years.",
          "Provide the name and designation of the hospital superintendent or biomedical engineer responsible for equipment uptime and patient referral arrangements."
        ];
      case "health.medicines_stock":
        return [
          "Provide certified copies of the essential medicines stock register, daily dispensing log, and out-of-stock indent slips at this public health facility.",
          "Provide certified copies of the medicine purchase orders, supplier delivery challans, and batch quality testing certificates received in the last 6 months.",
          "Provide the list of medicines currently unavailable at the hospital pharmacy along with the recorded reasons and emergency local procurement records.",
          "Provide the name and designation of the medical officer in charge of pharmacy procurement and citizen grievance redressal for medicine shortages."
        ];
      case "health.infrastructure_service":
        return [
          "Provide certified copies of the sanctioned staff strength versus actual in-position doctors, nurses, and technical staff at this government health facility.",
          "Provide certified copies of the annual infrastructure maintenance grants, sanitization contracts, and civic inspection reports for this hospital.",
          "Provide the daily patient footfall register and average consultation time recorded in the Outpatient Department (OPD) for the preceding month.",
          "Provide the name and designation of the administrative officer responsible for hospital sanitation, infrastructure upkeep, and patient grievance redressal."
        ];

      case "civic.potholes_roads":
        return [
          `Provide certified copies of the road repair work orders, contractor agreement, and defect liability period (DLP) records for the concerned stretch of road${dur ? ` unrepaired for ${dur}` : ""}.`,
          "Provide certified copies of the measurement book (MB) entries, quality test inspection reports, and asphalt/concrete batching records for the road.",
          `Provide details of the total expenditure incurred, contractor name, and bill payment vouchers released for this road work${dur ? ` over the past ${dur}` : " in the last 2 years"}.`,
          "Provide the name and designation of the municipal executive engineer responsible for road quality supervision and road safety certification."
        ];
      case "civic.drainage_garbage":
        return [
          `Provide certified copies of the municipal sanitation schedule, drain desilting logs, and waste collection monitoring registers for the concerned locality${dur ? ` covering the past ${dur}` : ""}.`,
          "Provide certified copies of the contract awarded for solid waste management, daily sanitation worker deployment roster, and vehicle GPS tracking records.",
          "Provide the total monthly expenditure sanctioned and disbursed to the sanitation agency for waste lifting and drainage cleaning in this ward.",
          "Provide the name, designation, and official contact details of the Ward Sanitary Inspector and Assistant Municipal Commissioner responsible for this area."
        ];
      case "civic.maintenance":
        return [
          "Provide certified copies of the civic amenity maintenance register, citizen complaint logs, and action taken reports for this area.",
          "Provide certified copies of the annual budgetary allocation and work estimates sanctioned for local civic repairs in the current financial year.",
          "Provide the names and designations of the municipal officers responsible for inspecting public amenities and verifying contractor compliance.",
          "Provide the citizen charter timeline prescribed for resolving public civic grievances and recorded reasons for non-compliance."
        ];

      case "pension.stopped_rejected":
        return [
          "Provide certified copies of the official order, file notings, and recorded reasons for stopping or discontinuing my pension disbursements.",
          "Provide certified copies of the annual life certificate (Jeevan Pramaan) verification record and bank reconciliation statement on my pension account.",
          "Provide the name, designation, and office address of the officer who authorized the withholding or cancellation of the pension amount.",
          "Provide the detailed statutory remedial procedure, document checklist, and timeline for immediate restoration and arrears disbursement of the pension."
        ];
      case "pension.pf_gratuity":
        return [
          "Provide certified copies of the final settlement calculation sheet, interest computation register, and sanction order for my Provident Fund (PF) / Gratuity.",
          "Provide the date-wise file processing log showing file movements between the employer, pension trust, and the Regional Provident Fund Office (RPFO).",
          "Provide certified copies of the objection slips or audit queries, if any, raised on the settlement claim and the recorded explanation submitted.",
          "Provide the designation of the Accounts Officer responsible for issuing the final payment scroll and electronic transfer mandate."
        ];
      case "pension.delay_pending":
        return [
          `Provide the current processing status and certified copies of all file notings regarding my pension application${dur ? ` pending for ${dur}` : ""}.`,
          "Provide the date-wise file movement record showing the receipt and disposal dates across various administrative and audit verification desks.",
          "Provide the name, designation, and contact details of the pension sanctioning authority and dealing assistant currently holding the file.",
          `Provide the recorded reasons for the delay${dur ? ` beyond ${dur}` : ""} and the time-bound schedule for releasing monthly pension and accrued arrears.`
        ];

      case "police.fir_not_registered":
        return [
          "Provide certified copies of the General Diary (GD) / Daily Diary (DD) entry made upon the receipt of my written police complaint.",
          "Provide certified copies of the preliminary inquiry report, spot inspection memo, or action taken report recorded by the Station House Officer (SHO).",
          "Provide the recorded legal reasons under Section 154 CrPC / Bharatiya Nagarik Suraksha Sanhita (BNSS) for not registering a First Information Report (FIR).",
          "Provide the name, designation, and badge number of the police officer to whom the complaint was assigned for preliminary verification."
        ];
      case "police.investigation_progress":
        return [
          "Provide the current investigation status and certified copies of the case diary abstracts (excluding witness identities) for the concerned case/complaint.",
          "Provide the dates on which the Investigating Officer (IO) visited the scene of occurrence and recorded statements in connection with the complaint.",
          "Provide the name, rank, and police station of the current Investigating Officer and supervisory Sub-Divisional Police Officer (SDPO).",
          "Provide the recorded reasons for the delay in concluding the investigation and filing the final police report/charge sheet before the jurisdictional court."
        ];

      case "land.mutation_pending":
        return [
          `Provide the current stage-wise processing status and certified copies of all file notings regarding my land mutation (Namantaran/Khata Transfer) application${dur ? ` pending for ${dur}` : ""}.`,
          "Provide certified copies of the Village Administrative Officer / Revenue Inspector (RI) field inquiry report, boundary verification sketch, and notice publication register.",
          "Provide the date-wise file movement log showing dates of file movement between the RI, Deputy Tahsildar, and Tahsildar offices.",
          "Provide the name and designation of the revenue officer currently responsible for passing the final mutation order and reasons for exceeding statutory citizen charter timelines."
        ];
      case "land.survey_records":
        return [
          "Provide certified copies of the official survey sketch, field measurement book (FMB) extract, and boundary demarcation report for the concerned land parcel.",
          "Provide certified copies of the revenue village map, resettlement register (SLR/A-Register), and title transfer notings relating to this property.",
          "Provide certified copies of the notice served to adjoining land owners prior to the conduct of the land boundary survey.",
          "Provide the name and designation of the Taluk Surveyor and Tahsildar responsible for certifying land demarcation and updating revenue records."
        ];

      case "general.public_records":
      default:
        return [
          "Provide certified copies of all file notings, official remarks, and action taken reports recorded on my complaint / representation.",
          "Provide the date-wise file movement register showing the receipt and forwarding dates across various dealing official desks.",
          "Provide the name, designation, and official contact details of the public authority official currently responsible for resolving this matter.",
          "Provide the citizen charter statutory timeline prescribed for resolving such public grievances and recorded reasons for delay."
        ];
    }
  }

  // HINDI
  if (lang === "hi") {
    switch (subIssue) {
      case "water.well_cleaning_maintenance":
        return [
          `इस क्षेत्र के सार्वजनिक / सरकारी कुएं की सफाई, गाद निकालने (डिसिल्टिंग) और रखरखाव लॉगबुक की प्रमाणित प्रति प्रदान करें${dur ? ` (पिछले ${dur} के रिकॉर्ड)` : ""}।`,
          "कुएं के पानी की गुणवत्ता जांच और जीवाणु परीक्षण (Bacteriological Test) रिपोर्ट तथा क्लोरीनीकरण (Chlorination) रजिस्टर की प्रमाणित प्रतियां दें।",
          `इस सरकारी कुएं की सफाई और मरम्मत के लिए स्वीकृत कार्य आदेशों (Work Orders), वित्तीय आवंटन और भुगतान वाउचरों की प्रतियां प्रदान करें${dur ? ` (पिछले ${dur} का विवरण)` : ""}।`,
          "इस वार्ड/ग्राम पंचायत में सार्वजनिक कुओं की सफाई और पेयजल रखरखाव के लिए जिम्मेदार कनिष्ठ अभियंता / पंचायत सचिव का नाम एवं पदनाम बताएं।"
        ];
      case "water.tank_storage_cleaning":
        return [
          `पानी की टंकी की सफाई, निरीक्षण लॉगबुक और ब्लीचिंग/कीटाणुशोधन रिकॉर्ड की प्रमाणित प्रतियां प्रदान करें${dur ? ` (पिछले ${dur} के रिकॉर्ड)` : ""}।`,
          "पानी की टंकी की सफाई के लिए जारी किए गए टेंडर अनुबंध और आवधिक सफाई कार्यक्रम का विवरण दें।",
          "टंकी की सफाई के बाद जारी किए गए जल गुणवत्ता परीक्षण प्रमाण पत्र की प्रमाणित प्रति दें।",
          "पानी की टंकी की स्वच्छता और रखरखाव के लिए जिम्मेदार संबंधित अभियंता का नाम व पदनाम बताएं।"
        ];
      case "water.quality_contamination":
        return [
          `इस क्षेत्र में आपूर्ति किए जा रहे नल के पानी की सभी रासायनिक और जीवाणु परीक्षण रिपोर्टों की प्रमाणित प्रतियां प्रदान करें${dur ? ` (पिछले ${dur} के रिकॉर्ड)` : ""}।`,
          "जल वितरण क्षेत्र में पाइपलाइन निरीक्षण लॉग, संदूषण शिकायत रजिस्टर और मरम्मत कार्य आदेशों की प्रतियां दें।",
          "पिछले 6 महीनों में किए गए क्लोरीनीकरण, निस्पंदन और जलाशय सफाई का विवरण व लॉगबुक प्रदान करें।",
          "शुद्ध पेयजल आपूर्ति सुनिश्चित करने के लिए जिम्मेदार सहायक अभियंता (जल आपूर्ति) का नाम एवं पदनाम बताएं।"
        ];
      case "water.supply_irregular":
        return [
          `इस इलाके में दैनिक जल दबाव लॉग, पंपिंग घंटे रजिस्टर और जलापूर्ति समय सारणी की प्रमाणित प्रतियां दें${dur ? ` (पिछले ${dur} के रिकॉर्ड)` : ""}।`,
          "इस क्षेत्र में सरकारी पानी के टैंकरों की तैनाती, ट्रिप शीट और वितरण रसीदों की प्रमाणित प्रतियां प्रदान करें।",
          "स्वीकृत जल कोटा बनाम पिछले 3 महीनों में प्रतिदिन आपूर्ति किए गए वास्तविक जल की मात्रा का विवरण दें।",
          "जलापूर्ति को विनियमित करने और कम दबाव की शिकायतों के निवारण के लिए जिम्मेदार जलकल अभियंता का नाम व संपर्क नंबर दें।"
        ];

      case "scholarship.rejection":
        return [
          "मेरे छात्रवृत्ति आवेदन को खारिज करने के आधिकारिक आदेश, फाइल नोटिंग और दर्ज कानूनी आधारों की प्रमाणित प्रतियां प्रदान करें।",
          "उस सक्षम प्राधिकारी का नाम, पदनाम और कार्यालय का पता बताएं जिन्होंने इस छात्रवृत्ति को खारिज करने की स्वीकृति दी।",
          "सत्यापन अधिकारी द्वारा दर्ज की गई पात्रता जांच सूची (Scrutiny Checklist) और सत्यापन टिप्पणियों की प्रतियां दें।",
          "इस छात्रवृत्ति निरस्तीकरण के विरुद्ध अपील दायर करने की निर्धारित प्रक्रिया और अपीलीय प्राधिकारी का विवरण प्रदान करें।"
        ];
      case "scholarship.fee_reimbursement":
        return [
          "मेरी शिक्षण शुल्क प्रतिपूर्ति / छात्रवृत्ति अनुदान से संबंधित वर्तमान प्रसंस्करण स्थिति और फाइल नोटिंग्स की प्रतियां प्रदान करें।",
          "संबंधित शैक्षणिक सत्र के लिए निधि स्वीकृति आदेश, बजट आवंटन रजिस्टर और ट्रेजरी वाउचर की प्रमाणित प्रतियां दें।",
          "स्वीकृत शुल्क प्रतिपूर्ति राशि का भुगतान न किए जाने के दर्ज आधिकारिक कारण बताएं।",
          "प्रतिपूर्ति राशि जारी करने के लिए जिम्मेदार अधिकारी का पदनाम और निर्धारित वैधानिक समय-सीमा बताएं।"
        ];
      case "scholarship.delay_pending":
        return [
          `मेरे छात्रवृत्ति आवेदन की वर्तमान चरणवार स्थिति और संबंधित सभी फाइल नोटिंग्स की प्रमाणित प्रतियां प्रदान करें${dur ? ` (जो पिछले ${dur} से लंबित है)` : ""}।`,
          "दिनांकवार फाइल संचलन रिकॉर्ड (File Movement Log) प्रदान करें जिससे पता चले कि आवेदन किस-किस अधिकारी के पास कब पहुंचा।",
          "वर्तमान में इस छात्रवृत्ति फाइल को देख रहे संबंधित अधिकारी का नाम, पदनाम और आधिकारिक संपर्क विवरण दें।",
          `छात्रवृत्ति राशि के भुगतान में हुए विलंब के दर्ज कारण बताएं और राशि कब तक खाते में जारी की जाएगी${dur ? ` (${dur} का विलंब)` : ""}।`
        ];

      case "electricity.billing_meter":
        return [
          "विवादित बिजली बिल के गणना पत्रक (Calculation Sheet), स्लैब-वार दर और लागू सरचार्ज के पूर्ण विवरण की प्रमाणित प्रति दें।",
          "संबंधित अवधि के मीटर रीडिंग लॉग, फोटो रीडिंग रिकॉर्ड और एमआरआई (MRI) डेटा की प्रतियां प्रदान करें।",
          "संबंधित बिजली मीटर की परीक्षण रिपोर्ट (Meter Testing Report) और सटीकता प्रमाण पत्र की प्रमाणित प्रति दें।",
          "अत्यधिक खपत की जांच करने वाले बिलिंग अधिकारी का पदनाम और बिल विवाद निपटान की प्रक्रिया बताएं।"
        ];
      case "electricity.streetlights":
        return [
          `संबंधित क्षेत्र में स्ट्रीट लाइटों के रखरखाव लॉगबुक, शिकायत रजिस्टर और मरम्मत कार्य आदेशों की प्रतियां दें${dur ? ` (पिछले ${dur} के रिकॉर्ड)` : ""}।`,
          "इस वार्ड/क्षेत्र में स्ट्रीट लाइट रखरखाव के लिए जिम्मेदार विद्युत ठेकेदार या विभागीय अभियंता का नाम व पदनाम बताएं।",
          `रखरखाव एजेंसी को स्वीकृत धनराशि, प्रस्तुत बिलों और किए गए भुगतानों की प्रमाणित प्रतियां प्रदान करें${dur ? ` (पिछले ${dur} का विवरण)` : ""}।`,
          "खराब स्ट्रीट लाइटों को ठीक न किए जाने के दर्ज कारण और शिकायत निवारण की निर्धारित समय-सीमा बताएं।"
        ];
      case "electricity.outage_power":
        return [
          `इस इलाके के बिजली फीडर आउटेज लॉग, ब्रेकडाउन रजिस्टर और दैनिक व्यवधान रिपोर्ट की प्रमाणित प्रतियां दें${dur ? ` (पिछले ${dur} के रिकॉर्ड)` : ""}।`,
          "इस क्षेत्र के वितरण ट्रांसफार्मर की तकनीकी निरीक्षण रिपोर्ट और स्वीकृत भार क्षमता का विवरण दें।",
          "बार-बार होने वाली अघोषित बिजली कटौती के कारण और पिछले 6 महीनों में किए गए निवारक रखरखाव का विवरण दें।",
          "विद्युत आपूर्ति निरंतरता के लिए जिम्मेदार सहायक अभियंता (संचालन) का पदनाम और बहाली मानक बताएं।"
        ];

      case "civic.potholes_roads":
        return [
          `सड़क मरम्मत कार्य आदेश, ठेकेदार अनुबंध और दोष दायित्व अवधि (DLP) रिकॉर्ड की प्रमाणित प्रतियां दें${dur ? ` (सड़क ${dur} से क्षतिग्रस्त है)` : ""}।`,
          "सड़क कार्य की माप पुस्तिका (MB) प्रविष्टियों और गुणवत्ता परीक्षण निरीक्षण रिपोर्टों की प्रमाणित प्रतियां प्रदान करें।",
          `इस सड़क निर्माण/मरम्मत पर खर्च की गई कुल राशि, ठेकेदार का नाम और भुगतान वाउचरों का विवरण दें${dur ? ` (पिछले ${dur} का विवरण)` : ""}।`,
          "सड़क गुणवत्ता पर्यवेक्षण और सुरक्षा प्रमाणन के लिए जिम्मेदार नगर निगम अभियंता का नाम व पदनाम बताएं।"
        ];
      case "civic.drainage_garbage":
        return [
          `इस क्षेत्र के स्वच्छता कार्यक्रम, नाला सफाई लॉग और कचरा संग्रहण निगरानी रजिस्टर की प्रमाणित प्रतियां दें${dur ? ` (पिछले ${dur} के रिकॉर्ड)` : ""}।`,
          "कचरा प्रबंधन के लिए अनुबंधित एजेंसी, दैनिक सफाई कर्मचारी उपस्थिति और वाहनों के जीपीएस ट्रैकिंग रिकॉर्ड दें।",
          "इस वार्ड में कचरा उठाने और जल निकासी सफाई के लिए एजेंसी को प्रतिमाह स्वीकृत व भुगतान की गई राशि का विवरण दें।",
          "इस क्षेत्र के वार्ड सेनेटरी इंस्पेक्टर और सहायक नगर आयुक्त का नाम एवं संपर्क विवरण बताएं।"
        ];
      case "civic.maintenance":
        return [
          "नागरिक सुविधा रखरखाव रजिस्टर, नागरिक शिकायत लॉग और की गई कार्रवाई रिपोर्ट की प्रमाणित प्रतियां दें।",
          "चालू वित्त वर्ष में स्थानीय नागरिक मरम्मत कार्यों के लिए स्वीकृत बजट आवंटन और प्राक्कलन की प्रतियां दें।",
          "सार्वजनिक सुविधाओं के निरीक्षण और ठेकेदार अनुपालन की जांच के लिए जिम्मेदार अधिकारियों के नाम व पदनाम बताएं।",
          "नागरिक शिकायतों के समाधान के लिए निर्धारित समय-सीमा और अनुपालन न होने के दर्ज कारण बताएं।"
        ];

      case "health.xray_equipment":
        return [
          `इस अस्पताल में एक्स-रे मशीन व नैदानिक उपकरणों के कार्यशीलता रजिस्टर, डाउनटाइम लॉगबुक और रखरखाव अनुबंध (AMC) की प्रतियां दें${dur ? ` (पिछले ${dur} के रिकॉर्ड)` : ""}।`,
          "खराब उपकरणों की मरम्मत के लिए भेजे गए मांग पत्रों, सर्विस इंजीनियर रिपोर्टों और स्पेयर पार्ट्स खरीद आदेशों की प्रतियां दें।",
          "वर्तमान और पिछले वित्तीय वर्षों में चिकित्सा उपकरणों के रखरखाव पर स्वीकृत और खर्च की गई कुल धनराशि का विवरण दें।",
          "उपकरणों की सक्रियता और वैकल्पिक जांच व्यवस्था के लिए जिम्मेदार अस्पताल अधीक्षक का नाम व पदनाम बताएं।"
        ];
      case "health.medicines_stock":
        return [
          "इस सरकारी स्वास्थ्य केंद्र के आवश्यक दवा स्टॉक रजिस्टर और दैनिक दवा वितरण लॉग की प्रमाणित प्रतियां प्रदान करें।",
          "पिछले 6 महीनों में प्राप्त दवा खरीद आदेशों, सप्लायर डिलीवरी चालान और गुणवत्ता परीक्षण प्रमाण पत्रों की प्रतियां दें।",
          "अस्पताल फार्मेसी में वर्तमान में अनुपलब्ध दवाओं की सूची और स्थानीय आपातकालीन खरीद (Local Purchase) के रिकॉर्ड दें।",
          "दवाओं की उपलब्धता और कमी पर नागरिक शिकायतों के निवारण के लिए जिम्मेदार चिकित्सा अधिकारी का नाम व पदनाम बताएं।"
        ];
      case "health.infrastructure_service":
        return [
          "इस सरकारी स्वास्थ्य केंद्र में स्वीकृत पदों के सापेक्ष वर्तमान में पदस्थ डॉक्टरों, नर्सों और पैरामेडिकल स्टाफ की सूची दें।",
          "अस्पताल भवन रखरखाव अनुदान, स्वच्छता अनुबंध और सार्वजनिक निरीक्षण रिपोर्टों की प्रमाणित प्रतियां दें।",
          "पिछले माह के ओपीडी (OPD) दैनिक रोगी पंजीकरण रजिस्टर और औसत परामर्श समय का विवरण दें।",
          "अस्पताल स्वच्छता, बुनियादी ढांचे और नागरिक शिकायतों के निवारण के लिए जिम्मेदार प्रशासनिक अधिकारी का विवरण दें।"
        ];

      case "pension.stopped_rejected":
        return [
          "मेरी पेंशन रोकने या बंद करने के आधिकारिक आदेश, फाइल नोटिंग और दर्ज कारणों की प्रमाणित प्रतियां प्रदान करें।",
          "वार्षिक जीवन प्रमाण पत्र (Jeevan Pramaan) सत्यापन रिकॉर्ड और बैंक समाधान विवरण की प्रमाणित प्रतियां दें।",
          "पेंशन राशि रोकने या रद्द करने वाले सक्षम प्राधिकारी का नाम, पदनाम और कार्यालय का पता बताएं।",
          "पेंशन पुनः शुरू करने और बकाया राशि (Arrears) के भुगतान की वैधानिक प्रक्रिया और समय-सीमा बताएं।"
        ];
      case "pension.pf_gratuity":
        return [
          "भविष्य निधि (PF) / ग्रेच्युटी के अंतिम निपटान गणना पत्रक, ब्याज गणना रजिस्टर और स्वीकृति आदेश की प्रतियां दें।",
          "नियोक्ता, पेंशन ट्रस्ट और क्षेत्रीय भविष्य निधि कार्यालय (RPFO) के बीच फाइल संचलन की दिनांकवार सूची दें।",
          "दावा निपटान पर उठाई गई आपत्तियों (Objection Slips) और प्रस्तुत किए गए स्पष्टीकरण की प्रमाणित प्रतियां दें।",
          "अंतिम भुगतान आदेश और इलेक्ट्रॉनिक ट्रांसफर जारी करने वाले लेखा अधिकारी का पदनाम बताएं।"
        ];
      case "pension.delay_pending":
        return [
          `मेरे पेंशन आवेदन की वर्तमान प्रसंस्करण स्थिति और सभी फाइल नोटिंग्स की प्रमाणित प्रतियां प्रदान करें${dur ? ` (जो ${dur} से लंबित है)` : ""}।`,
          "प्रशासनिक और लेखा परीक्षण स्तरों पर आवेदन के संचलन की दिनांकवार सूची प्रदान करें।",
          "वर्तमान में इस पेंशन फाइल को देख रहे स्वीकृति अधिकारी और सहायक का नाम, पदनाम व संपर्क विवरण दें।",
          `पेंशन स्वीकृति में देरी के दर्ज कारण और मासिक पेंशन व एरियर भुगतान का समयबद्ध कार्यक्रम बताएं${dur ? ` (${dur} का विलंब)` : ""}।`
        ];

      case "police.fir_not_registered":
        return [
          "मेरी लिखित शिकायत पर पुलिस स्टेशन में की गई जनरल डायरी (GD) / डेली डायरी प्रविष्टि की प्रमाणित प्रति दें।",
          "थाना प्रभारी (SHO) द्वारा की गई प्राथमिक जांच रिपोर्ट, मौका मुआयना ज्ञापन या कार्रवाई रिपोर्ट की प्रति दें।",
          "प्रथम सूचना रिपोर्ट (FIR) दर्ज न करने के दर्ज कानूनी कारणों का विवरण प्रदान करें।",
          "उस पुलिस अधिकारी का नाम, पदनाम और बैच नंबर बताएं जिसे शिकायत सत्यापन के लिए सौंपी गई थी।"
        ];
      case "police.investigation_progress":
        return [
          "संबंधित मामले/शिकायत की वर्तमान जांच स्थिति और केस डायरी के सार की प्रमाणित प्रतियां प्रदान करें।",
          "जांच अधिकारी द्वारा घटनास्थल का दौरा करने और गवाहों के बयान दर्ज करने की तिथियों का विवरण दें।",
          "वर्तमान जांच अधिकारी (IO) और अनुविभागीय पुलिस अधिकारी (SDPO) का नाम, पद व थाना बताएं।",
          "जांच पूर्ण करने और न्यायालय में अंतिम रिपोर्ट/चार्जशीट दाखिल करने में देरी के दर्ज कारण बताएं।"
        ];

      case "land.mutation_pending":
        return [
          `भूमि दाखिल-खारिज (नामांतरण/म्यूटेशन) आवेदन की वर्तमान स्थिति और फाइल नोटिंग्स की प्रतियां दें${dur ? ` (जो ${dur} से लंबित है)` : ""}।`,
          "राजस्व निरीक्षक (RI) / लेखपाल की स्थलीय जांच रिपोर्ट, सीमांकन मानचित्र और नोटिस प्रकाशन रजिस्टर की प्रतियां दें।",
          "लेखपाल, कानूनगो, नायब तहसीलदार और तहसीलदार कार्यालय के बीच फाइल संचलन की तिथियों का विवरण दें।",
          "अंतिम आदेश पारित करने के लिए जिम्मेदार राजस्व अधिकारी का नाम, पदनाम और देरी के कारण बताएं।"
        ];
      case "land.survey_records":
        return [
          "संबंधित भूमि का आधिकारिक सर्वेक्षण नक्शा, फील्ड मेजरमेंट बुक (FMB) और सीमांकन रिपोर्ट की प्रमाणित प्रति दें।",
          "राजस्व ग्राम का नक्शा, बंदोबस्त रजिस्टर (खतौनी/अधिकार अभिलेख) और स्वामित्व अंतरण नोटिंग्स की प्रतियां दें।",
          "भूमि सीमांकन से पूर्व निकटवर्ती भू-स्वामियों को जारी किए गए नोटिस की प्रमाणित प्रति प्रदान करें।",
          "भूमि सीमांकन और राजस्व रिकॉर्ड अद्यतन करने के लिए जिम्मेदार अमीन/सर्वेयर व तहसीलदार का विवरण दें।"
        ];

      case "general.public_records":
      default:
        return [
          "मेरी शिकायत / आवेदन पर संबंधित कार्यालय द्वारा दर्ज की गई सभी फाइल नोटिंग्स और कार्रवाई रिपोर्ट की प्रमाणित प्रति दें।",
          "विभिन्न अधिकारियों के बीच फाइल संचलन की दिनांकवार सूची (File Movement Register) प्रदान करें।",
          "वर्तमान में इस मामले के निस्तारण के लिए जिम्मेदार सक्षम प्राधिकारी का नाम, पदनाम और संपर्क विवरण दें।",
          "नागरिक अधिकार पत्र (Citizen Charter) के अनुसार इस शिकायत के निस्तारण की निर्धारित समय-सीमा और देरी के दर्ज कारण बताएं।"
        ];
    }
  }

  // TELUGU
  if (lang === "te") {
    switch (subIssue) {
      case "water.well_cleaning_maintenance":
        return [
          `ఈ ప్రాంతంలోని ప్రభుత్వ/పబ్లిక్ బావి శుభ్రపరచడం, పూడికతీత మరియు నిర్వహణ లాగ్‌బుక్ రికార్డుల ధృవీకరించిన కాపీలను అందించండి${dur ? ` (గత ${dur} కాలానికి)` : ""}..`,
          "బావి నీటి నాణ్యతా పరీక్ష (Bacteriological & Chemical Test) నివేదికలు మరియు క్లోరినేషన్ రిజిస్టర్ రికార్డుల కాపీలను ఇవ్వండి.",
          `ఈ ప్రభుత్వ బావి మరమ్మతులు మరియు స్వచ్ఛత పనుల కోసం విడుదల చేసిన వర్క్ ఆర్డర్లు, మంజూరైన నిధులు మరియు కాంట్రాక్టర్ చెల్లింపుల బిల్లుల వివరాలు అందించండి${dur ? ` (గత ${dur} కాలానికి)` : ""}..`,
          "ఈ ప్రాంతంలో పబ్లిక్ తాగునీటి బావుల నిర్వహణకు మరియు స్వచ్ఛతకు బాధ్యత వహించే పంచాయతీ కార్యదర్శి / ఇంజనీర్ పేరు, హోదాను తెలియజేయండి."
        ];
      case "water.tank_storage_cleaning":
        return [
          `నీటి ట్యాంక్ శుభ్రపరిచిన లాగ్‌బుక్, తనిఖీ నివేదికలు మరియు బ్లీచింగ్ రికార్డుల ధృవీకరించిన కాపీలను ఇవ్వండి${dur ? ` (గత ${dur} రికార్డులు)` : ""}..`,
          "ఓవర్‌హెడ్ వాటర్ ట్యాంక్ శుభ్రపరిచే టెండర్ కాంట్రాక్ట్ మరియు ఆవర్తన శుభ్రపరిచే షెడ్యూల్ వివరాలు అందించండి.",
          "ట్యాంక్ శుభ్రం చేసిన తర్వాత నిర్వహించిన నీటి నాణ్యతా పరీక్ష ధృవీకరణ పత్రాల కాపీలను ఇవ్వండి.",
          "నీటి ట్యాంక్ పరిశుభ్రత మరియు నిర్వహణను పర్యవేక్షించే బాధ్యత గల ఇంజనీర్ పేరు, హోదా తెలపండి."
        ];
      case "water.quality_contamination":
        return [
          `ఈ ప్రాంతంలో సరఫరా చేస్తున్న తాగునీటి రసాయన మరియు బాక్టీరియా పరీక్ష నివేదికల ధృవీకరించిన కాపీలను అందించండి${dur ? ` (గత ${dur} కాలానికి)` : ""}..`,
          "పైప్‌లైన్ తనిఖీ లాగ్, కలుషిత నీటి ఫిర్యాదుల రిజిస్టర్ మరియు లీకేజీ రిపేర్ వర్క్ ఆర్డర్ల కాపీలను ఇవ్వండి.",
          "గత 6 నెలల్లో చేపట్టిన క్లోరినేషన్, ఫిల్ట్రేషన్ మరియు రిజర్వాయర్ శుభ్రత లాగ్‌బుక్ వివరాలు తెలపండి.",
          "సురక్షిత తాగునీటి సరఫరాకు బాధ్యత వహించే అసిస్టెంట్ ఇంజనీర్ (వాటర్ సప్లై) పేరు, హోదాను తెలియజేయండి."
        ];
      case "water.supply_irregular":
        return [
          `ఈ ప్రాంతంలో రోజువారీ నీటి ఒత్తిడి లాగ్, పంపింగ్ గంటల రిజిస్టర్ మరియు నీటి సరఫరా సమయ పట్టిక ధృవీకరించిన కాపీలను ఇవ్వండి${dur ? ` (గత ${dur} రికార్డులు)` : ""}..`,
          "ఈ ప్రాంతంలో ప్రభుత్వ నీటి ట్యాంకర్ల పంపిణీ వివరాలు, ట్రిప్ షీట్లు మరియు రసీదుల కాపీలను అందించండి.",
          "గత 3 నెలల్లో కేటాయించిన నీటి కోటా మరియు సరఫరా చేసిన వాస్తవ నీటి పరిమాణం వివరాలను తెలపండి.",
          "నీటి సరఫరా నియంత్రణ మరియు తక్కువ పీడన ఫిర్యాదుల పరిష్కారానికి బాధ్యులైన ఇంజనీర్ పేరు, ఫోన్ నంబర్ ఇవ్వండి."
        ];

      case "scholarship.rejection":
        return [
          "నా స్కాలర్‌షిప్ దరఖాస్తును తిరస్కరించడానికి గల అధికారిక కారణాలు, తిరస్కరణ ఉత్తర్వులు మరియు సంబంధిత ఫైల్ నోటింగ్స్ యొక్క ధృవీకరించిన కాపీలను అందించండి.",
          "ఈ స్కాలర్‌షిప్ తిరస్కరణకు ఆమోదం తెలిపిన సక్షమ అధికారి పేరు, అధికారిక హోదా మరియు కార్యాలయ చిరునామాను తెలియజేయండి.",
          "పరిశీలన అధికారి నమోదు చేసిన అర్హత తనిఖీ జాబితా మరియు క్షేత్రస్థాయి పరిశీలన నివేదికల ధృవీకరించిన కాపీలను ఇవ్వండి.",
          "ఈ తిరస్కరణపై అప్పీల్ చేసుకోవడానికి అందుబాటులో ఉన్న చట్టబద్ధ నిబంధనలు మరియు అప్పీలేట్ అథారిటీ వివరాలను అందించండి."
        ];
      case "scholarship.fee_reimbursement":
        return [
          "నా ఫీజు రీయింబర్స్‌మెంట్ / స్కాలర్‌షిప్ నిధుల మంజూరుకు సంబంధించిన ప్రస్తుత ఫైల్ స్థితి మరియు దస్త్రం నోటింగ్స్ ధృవీకరించిన కాపీలను ఇవ్వండి.",
          "సంబంధిత విద్యా సంవత్సరానికి కేటాయించిన బడ్జెట్ విడుదల మరియు ట్రెజరీ బిల్లుల రికార్డుల ధృవీకరించిన కాపీలను అందించండి.",
          "మంజూరైన ఫీజు రీయింబర్స్‌మెంట్ మొత్తం విడుదల చేయకపోవడానికి ఫైలులో నమోదు చేసిన అధికారిక కారణాలను తెలియజేయండి.",
          "ఈ నిధులను విడుదల చేయడానికి బాధ్యులైన అధికారి హోదా మరియు చట్టబద్ధ గడువు వివరాలను తెలపండి."
        ];
      case "scholarship.delay_pending":
        return [
          `నా స్కాలర్‌షిప్ దరఖాస్తుపై తీసుకున్న చర్యల ప్రస్తుత స్థితి మరియు సంబంధిత ఫైల్ నోటింగ్స్ ధృవీకరించిన కాపీలను అందించండి${dur ? ` (${dur} నుండి పెండింగ్‌లో ఉన్నది)` : ""}..`,
          "ఈ దరఖాస్తు ఏయే అధికారుల వద్ద ఏయే తేదీలలో పరిశీలించబడిందో తెలిపే దస్త్రం కదలికల (File Movement) వివరాలు ఇవ్వండి.",
          "ప్రస్తుతం ఈ స్కాలర్‌షిప్ ఫైలును పరిశీలిస్తున్న బాధ్యతాయుత అధికారి పేరు, హోదా మరియు సంప్రదింపు వివరాలు తెలపండి.",
          `స్కాలర్‌షిప్ చెల్లింపులో ఆలస్యానికి గల కారణాలు మరియు నిధులు ఎప్పటిలోగా ఖాతాలో జమ చేయబడతాయో రికార్డుల ఆధారంగా తెలపండి${dur ? ` (${dur} జాప్యం)` : ""}..`
        ];

      case "electricity.billing_meter":
        return [
          "నా విద్యుత్ బిల్లు గణన విధానం, స్లాబ్ వారీ ఛార్జీలు మరియు వర్తింపజేసిన అదనపు రుసుముల పూర్తి లెక్కింపు పత్రం (Billing Calculation Sheet) ధృవీకరించిన కాపీని ఇవ్వండి.",
          "సంబంధిత కాలానికి సంబంధించి మీటర్ రీడింగ్ లాగ్, ఫోటో రీడింగ్ రికార్డులు మరియు ఎంఆర్ఐ (MRI) డౌన్‌లోడ్ డేటా కాపీలను అందించండి.",
          "ఈ విద్యుత్ మీటర్ యొక్క పనితీరు మరియు కచ్చితత్వ పరీక్ష నివేదిక (Meter Testing Report) కాపీని అందించండి.",
          "అసాధారణ రీడింగ్ పెంపుపై అభ్యంతరాలను పరిష్కరించే అధికారి హోదా మరియు బిల్లు సర్దుబాటు నిబంధనల వివరాలు తెలపండి."
        ];
      case "electricity.streetlights":
        return [
          `సంబంధిత ప్రాంతంలో వీధి దీపాల నిర్వహణ లాగ్‌బుక్, ఫిర్యాదుల రిజిస్టర్ మరియు రిపేర్ వర్క్ ఆర్డర్ల ధృవీకరించిన కాపీలను ఇవ్వండి${dur ? ` (గత ${dur} రికార్డులు)` : ""}..`,
          "ఈ ప్రాంతంలో వీధి దీపాల నిర్వహణకు బాధ్యత వహిస్తున్న విద్యుత్ కాంట్రాక్టర్ లేదా శాఖ ఇంజనీర్ పేరు మరియు సంప్రదింపు వివరాలు తెలపండి.",
          `వీధి దీపాల నిర్వహణ కోసం విడుదల చేసిన నిధులు మరియు నిర్వహణ సంస్థకు చేసిన చెల్లింపుల బిల్లుల కాపీలను అందించండి${dur ? ` (గత ${dur} కాలానికి)` : ""}..`,
          "పనిచేయని వీధి దీపాలను బాగు చేయకపోవడానికి గల కారణాలు మరియు సిటిజన్ చార్టర్ ప్రకారం పరిష్కార గడువు వివరాలు తెలపండి."
        ];
      case "electricity.outage_power":
        return [
          `ఈ ప్రాంతానికి సంబంధించి విద్యుత్ సరఫరా నిలిపివేత లాగ్, బ్రేక్‌డౌన్ రిజిస్టర్ మరియు అంతరాయాల నివేదికల ధృవీకరించిన కాపీలను ఇవ్వండి${dur ? ` (గత ${dur} రికార్డులు)` : ""}..`,
          "ఈ ప్రాంత విద్యుత్ ట్రాన్స్‌ఫార్మర్ తనిఖీ నివేదికలు మరియు లోడ్ సామర్థ్య రికార్డుల కాపీలను అందించండి.",
          "తరచూ విద్యుత్ సరఫరాలో అంతరాయాలు కలగడానికి గల కారణాలు మరియు గత 6 నెలల్లో చేపట్టిన నిర్వహణ వివరాలు తెలపండి.",
          "ఈ సబ్‌స్టేషన్ పరిధిలోని అసిస్టెంట్ ఇంజనీర్ (ఆపరేషన్స్) అధికారిక హోదా మరియు సేవల పునరుద్ధరణ ప్రమాణాలను అందించండి."
        ];

      case "civic.potholes_roads":
        return [
          `ఈ రోడ్డు మరమ్మతు పనుల వర్క్ ఆర్డర్లు, కాంట్రాక్టర్ ఒప్పందం మరియు లోప నివారణ కాలపరిమితి (Defect Liability Period) రికార్డుల ధృవీకరించిన కాపీలను ఇవ్వండి${dur ? ` (${dur}గా మరమ్మతు జరగలేదు)` : ""}..`,
          "రోడ్డు పనుల మెజర్‌మెంట్ బుక్ (MB) రికార్డులు మరియు నాణ్యత తనిఖీ నివేదికల ధృవీకరించిన కాపీలను అందించండి.",
          `ఈ రోడ్డు నిర్మాణం లేదా మరమ్మతు కోసం మంజూరైన మొత్తం వ్యయం, కాంట్రాక్టర్ వివరాలు మరియు చెల్లింపుల వోచర్ల కాపీలను ఇవ్వండి${dur ? ` (గత ${dur} కాలానికి)` : ""}..`,
          "రోడ్డు నాణ్యతా ప్రమాణాలను పర్యవేక్షించే బాధ్యత గల మున్సిపల్ ఇంజనీర్ పేరు మరియు అధికారిక హోదాను తెలపండి."
        ];
      case "civic.drainage_garbage":
        return [
          `ఈ ప్రాంతంలో పారిశుద్ధ్య నిర్వహణ షెడ్యూల్, డ్రైనేజీ పూడికతీత లాగ్‌బుక్ మరియు చెత్త సేకరణ రిజిస్టర్ ధృవీకరించిన కాపీలను అందించండి${dur ? ` (గత ${dur} రికార్డులు)` : ""}..`,
          "పారిశుద్ధ్య కార్మికుల రోజువారీ హాజరు పట్టిక మరియు చెత్త రవాణా వాహనాల జీపీఎస్ లాగ్ రికార్డుల కాపీలను ఇవ్వండి.",
          "ఈ వార్డులో పారిశుద్ధ్య నిర్వహణ కోసం ప్రతి నెలా ఏజెన్సీకి మంజూరు చేసి చెల్లిస్తున్న నిధుల వివరాలను తెలపండి.",
          "ఈ ప్రాంత పారిశుద్ధ్య పనులను పర్యవేక్షించే శానిటరీ ఇన్‌స్పెక్టర్ మరియు అసిస్టెంట్ మున్సిపల్ కమిషనర్ అధికారిక వివరాలు ఇవ్వండి."
        ];
      case "civic.maintenance":
        return [
          "పౌర సౌకర్యాల నిర్వహణ రిజిస్టర్, ప్రజల ఫిర్యాదుల లాగ్ మరియు చేపట్టిన చర్యల నివేదికల ధృవీకరించిన కాపీలను ఇవ్వండి.",
          "ప్రస్తుత ఆర్థిక సంవత్సరంలో స్థానిక మరమ్మతుల కోసం కేటాయించిన బడ్జెట్ మరియు పని అంచనాల కాపీలను ఇవ్వండి.",
          "సౌకర్యాల తనిఖీ మరియు కాంట్రాక్టర్ల పనుల ధృవీకరణకు బాధ్యులైన మున్సిపల్ అధికారుల పేర్లు, హోదాలు తెలపండి.",
          "పౌర ఫిర్యాదుల పరిష్కారానికి గల చట్టబద్ధ గడువు మరియు ఆలస్యానికి గల కారణాలను రికార్డుల ద్వారా తెలియజేయండి."
        ];

      case "health.xray_equipment":
        return [
          `ఈ ఆసుపత్రిలోని ఎక్స్-రే యంత్రం మరియు వైద్య పరికరాల పనితీరు రిజిస్టర్, డౌన్‌టైమ్ లాగ్‌బుక్ మరియు వార్షిక నిర్వహణ కాంట్రాక్ట్ (AMC) ధృవీకరించిన కాపీలను అందించండి${dur ? ` (గత ${dur} కాలానికి)` : ""}..`,
          "పనిచేయని ఎక్స్-రే పరికరాల మరమ్మతు కోసం పంపిన లేఖలు, సర్వీస్ ఇంజనీర్ తనిఖీ నివేదికలు మరియు స్పేర్ పార్ట్స్ ఆర్డర్ల కాపీలను ఇవ్వండి.",
          "ప్రస్తుత మరియు మునుపటి ఆర్థిక సంవత్సరాల్లో వైద్య పరికరాల నిర్వహణ కోసం కేటాయించిన మరియు ఖర్చు చేసిన నిధుల వివరాలు అందించండి.",
          "పరికరాల నిరంతర పనితీరుకు మరియు రోగుల ప్రత్యామ్నాయ వైద్య పరీక్షల ఏర్పాట్లకు బాధ్యులైన ఆసుపత్రి సూపరింటెండెంట్ పేరు, హోదా తెలపండి."
        ];
      case "health.medicines_stock":
        return [
          "ఈ ప్రభుత్వ ఆసుపత్రిలోని నిత్యావసర ఔషధాల స్టాక్ రిజిస్టర్ మరియు రోజువారీ మందుల పంపిణీ లాగ్ ధృవీకరించిన కాపీలను అందించండి.",
          "గత 6 నెలల్లో సేకరించిన మందుల కొనుగోలు ఆర్డర్లు, సరఫరాదారుల డెలివరీ చలానాలు మరియు నాణ్యతా పరీక్ష ధృవీకరణ పత్రాల కాపీలను ఇవ్వండి.",
          "ప్రస్తుతం ఫార్మసీలో అందుబాటులో లేని మందుల జాబితా మరియు స్థానిక అత్యవసర కొనుగోలు (Local Purchase) వివరాలను తెలపండి.",
          "మందుల కొనుగోలు మరియు కొరతపై పౌరుల ఫిర్యాదుల పరిష్కారానికి బాధ్యత వహించే మెడికల్ ఆఫీసర్ పేరు, హోదాను తెలపండి."
        ];
      case "health.infrastructure_service":
        return [
          "ఈ ప్రభుత్వ ఆసుపత్రిలో మంజూరైన పోస్టులకు గాను ప్రస్తుతం పనిచేస్తున్న వైద్యులు, నర్సులు మరియు ఇతర సిబ్బంది వివరాలు ఇవ్వండి.",
          "ఆసుపత్రి భవన నిర్వహణ గ్రాంట్లు, పారిశుద్ధ్య ఒప్పందాలు మరియు పబ్లిక్ తనిఖీ నివేదికల ధృవీకరించిన కాపీలను ఇవ్వండి.",
          "గత నెల ఓపీడీ (OPD) రోగుల రిజిస్ట్రేషన్ రికార్డులు మరియు సగటు వైద్య సంప్రదింపు సమయం వివరాలు అందించండి.",
          "ఆసుపత్రి పరిశుభ్రత, మౌలిక వసతులు మరియు రోగుల ఫిర్యాదుల పరిష్కారానికి బాధ్యులైన పరిపాలనా అధికారి వివరాలు తెలపండి."
        ];

      case "pension.stopped_rejected":
        return [
          "నా పెన్షన్ నిలిపివేయడానికి గల అధికారిక కారణాలు, ఉత్తర్వులు మరియు సంబంధిత ఫైల్ నోటింగ్స్ ధృవీకరించిన కాపీలను అందించండి.",
          "వార్షిక జీవిత ధృవీకరణ పత్రం (Jeevan Pramaan) పరిశీలన రికార్డు మరియు బ్యాంక్ ఖాతా వివరాల కాపీలను ఇవ్వండి.",
          "పెన్షన్ నిలిపివేతకు ఆదేశాలు జారీ చేసిన సక్షమ అధికారి పేరు, అధికారిక హోదా మరియు కార్యాలయ చిరునామా తెలపండి.",
          "పెన్షన్ పునరుద్ధరణ మరియు బకాయిల చెల్లింపు కోసం అనుసరించాల్సిన చట్టబద్ధ నిబంధనలు మరియు కాలపరిమితిని తెలపండి."
        ];
      case "pension.pf_gratuity":
        return [
          "ప్రావిడెంట్ ఫండ్ (PF) / గ్రాట్యుటీ తుది పరిష్కార లెక్కింపు పత్రం, వడ్డీ లెక్కల రికార్డు మరియు మంజూరు ఉత్తర్వుల కాపీలను ఇవ్వండి.",
          "యాజమాన్యం, పెన్షన్ ట్రస్ట్ మరియు ప్రాంతీయ పీఎఫ్ కార్యాలయం (RPFO) మధ్య ఫైలు కదలికల తేదీల వారీ వివరాలను అందించండి.",
          "క్లెయిమ్ పరిష్కారంలో నమోదు చేసిన అభ్యంతరాలు (Objection Slips) మరియు ఇచ్చిన వివరణల కాపీలను అందించండి.",
          "తుది చెల్లింపు ఆదేశాలు మరియు ఎలక్ట్రానిక్ బదిలీని జారీ చేయడానికి బాధ్యులైన అకౌంట్స్ అధికారి హోదా తెలపండి."
        ];
      case "pension.delay_pending":
        return [
          `నా పెన్షన్ దరఖాస్తు ప్రస్తుత స్థితి మరియు అన్ని స్థాయిల ఫైల్ నోటింగ్స్ ధృవీకరించిన కాపీలను అందించండి${dur ? ` (${dur} నుండి పెండింగ్‌లో ఉన్నది)` : ""}..`,
          "వివిధ పరిపాలనా మరియు ఆడిట్ విభాగాలలో దరఖాస్తు పరిష్కార తేదీలను చూపే ఫైల్ మూవ్‌మెంట్ రికార్డు ఇవ్వండి.",
          "ఈ పెన్షన్ దస్త్రం ప్రస్తుతం ఎవరి వద్ద పరిశీలనలో ఉందో ఆ అధికారి పేరు, హోదా మరియు సంప్రదింపు వివరాలు తెలపండి.",
          `పెన్షన్ మంజూరులో జాప్యానికి గల కారణాలు మరియు నెలవారీ పెన్షన్ విడుదల తేదీల షెడ్యూల్ తెలపండి${dur ? ` (${dur} ఆలస్యం)` : ""}..`
        ];

      case "police.fir_not_registered":
        return [
          "నేను సమర్పించిన లిఖితపూర్వక ఫిర్యాదుపై పోలీస్ స్టేషన్‌లో నమోదు చేసిన జనరల్ డైరీ (GD) / డైలీ డైరీ ఎంట్రీ ధృవీకరించిన కాపీని ఇవ్వండి.",
          "స్టేషన్ హౌస్ ఆఫీసర్ (SHO) నిర్వహించిన ప్రాథమిక విచారణ నివేదిక, ఘటనా స్థల పంచనామా లేదా చర్యల నివేదిక కాపీని అందించండి.",
          "ఫస్ట్ ఇన్ఫర్మేషన్ రిపోర్ట్ (FIR) నమోదు చేయకపోవడానికి గల చట్టబద్ధమైన కారణాలను రికార్డుల ఆధారంగా తెలపండి.",
          "ఈ ఫిర్యాదును పరిశీలించడానికి కేటాయించిన పోలీసు అధికారి పేరు, హోదా మరియు బ్యాడ్జ్ నంబర్ వివరాలు ఇవ్వండి."
        ];
      case "police.investigation_progress":
        return [
          "సంబంధిత కేసు/ఫిర్యాదు దర్యాప్తు ప్రస్తుత స్థితి మరియు కేస్ డైరీ సారాంశాల ధృవీకరించిన కాపీలను అందించండి.",
          "దర్యాప్తు అధికారి (IO) ఘటనా స్థలాన్ని సందర్శించిన మరియు సాక్షుల వాంగ్మూలాలు నమోదు చేసిన తేదీల వివరాలు ఇవ్వండి.",
          "ప్రస్తుత దర్యాప్తు అధికారి (IO) మరియు సబ్-డివిజనల్ పోలీస్ అధికారి (SDPO) పేరు, హోదా మరియు పోలీస్ స్టేషన్ వివరాలు తెలపండి.",
          "దర్యాప్తు పూర్తి చేసి కోర్టులో తుది నివేదిక/ఛార్జ్‌షీట్ దాఖలు చేయడంలో ఆలస్యానికి గల కారణాలను తెలపండి."
        ];

      case "land.mutation_pending":
        return [
          `భూమి మ్యుటేషన్ (ఖాతా బదిలీ) దరఖాస్తు ప్రస్తుత స్థితి మరియు సంబంధిత ఫైల్ నోటింగ్స్ కాపీలను అందించండి${dur ? ` (${dur}గా పెండింగ్‌లో ఉన్నది)` : ""}..`,
          "గ్రామ పరిపాలన అధికారి / రెవెన్యూ ఇన్‌స్పెక్టర్ (RI) క్షేత్రస్థాయి విచారణ నివేదిక మరియు నోటీసు ప్రచురణ రికార్డుల కాపీలను ఇవ్వండి.",
          "ఆర్ఐ, డిప్యూటీ తహశీల్దార్ మరియు తహశీల్దార్ కార్యాలయాల మధ్య ఫైల్ కదలికల తేదీల వారీ లాగ్ ఇవ్వండి.",
          "తుది మ్యుటేషన్ ఉత్తర్వులు జారీ చేయడానికి బాధ్యులైన రెవెన్యూ అధికారి పేరు, హోదా మరియు ఆలస్యానికి కారణాలు తెలపండి."
        ];
      case "land.survey_records":
        return [
          "సంబంధిత భూమి యొక్క అధికారిక సర్వే స్కెచ్, ఫీల్డ్ మెజర్‌మెంట్ బుక్ (FMB) కాపీ మరియు సరిహద్దు విభజన నివేదికను అందించండి.",
          "రెవెన్యూ గ్రామ మ్యాప్, రీసెటిల్‌మెంట్ రిజిస్టర్ (A-Register) మరియు యాజమాన్య హక్కుల బదిలీ రికార్డుల కాపీలను ఇవ్వండి.",
          "భూ సరిహద్దు సర్వే నిర్వహణకు ముందు పొరుగు భూ యజమానులకు జారీ చేసిన నోటీసుల కాపీలను అందించండి.",
          "సర్వే సరిహద్దులను ధృవీకరించే తాలూకా సర్వేయర్ మరియు తహశీల్దార్ వివరాలను తెలపండి."
        ];

      case "general.public_records":
      default:
        return [
          "నా ఫిర్యాదు / వినతిపత్రంపై సంబంధిత కార్యాలయం నమోదు చేసిన అన్ని ఫైల్ నోటింగ్స్ మరియు తీసుకున్న చర్యల నివేదికల ధృవీకరించిన కాపీలను ఇవ్వండి.",
          "వివిధ అధికారుల వద్ద దస్త్రం కదలికల తేదీల వారీ వివరాలను (File Movement Register) అందించండి.",
          "ప్రస్తుతం ఈ సమస్యను పరిష్కరించడానికి బాధ్యత వహించే ప్రజా ప్రాధికార అధికారి పేరు, హోదా మరియు సంప్రదింపు వివరాలు తెలపండి.",
          "సిటిజన్ చార్టర్ ప్రకారం ఈ ఫిర్యాదు పరిష్కారానికి గల చట్టబద్ధ గడువు మరియు ఆలస్యానికి రికార్డులలో నమోదైన కారణాలు తెలపండి."
        ];
    }
  }

  // TAMIL, KANNADA, MALAYALAM, BENGALI, MARATHI
  const genericBuilder = (l: Lang) => {
    switch (subIssue) {
      case "water.well_cleaning_maintenance":
        return l === "ta" ? [
          `இந்த பகுதியில் உள்ள அரசு / பொதுக் கிணற்றை தூர்வாருதல், சுத்தம் செய்தல் மற்றும் பராமரிப்பு பதிவேட்டின் சான்றளிக்கப்பட்ட நகல்களை வழங்கவும்${dur ? ` (கடந்த ${dur} பதிவுகள்)` : ""}..`,
          "கிணற்று நீரின் தரப் பரிசோதனை அறிக்கைகள் மற்றும் குளோரினேஷன் (Chlorination) கால அட்டவணை பதிவேட்டின் நகல்களை வழங்கவும்.",
          `இந்த அரசு கிணற்றின் பராமரிப்பு மற்றும் சீரமைப்புக்காக அனுமதிக்கப்பட்ட நிதி, பணி ஆணைகள் (Work Orders) மற்றும் ஒப்பந்ததாரர் கொடுப்பனவு விவரங்களை வழங்கவும்${dur ? ` (கடந்த ${dur} விபரம்)` : ""}..`,
          "பொதுக் குடிநீர்க் கிணறுகளை தூய்மையாகப் பராமரிப்பதற்குப் பொறுப்பான பஞ்சாயத்துச் செயலாளர் / நகராட்சி பொறியாளரின் பெயர் மற்றும் பதவி விவரங்களை தெரிவிக்கவும்."
        ] : l === "kn" ? [
          `ಈ ಪ್ರದೇಶದ ಸರ್ಕಾರಿ / ಸಾರ್ವಜನಿಕ ಬಾವಿಯ ಸ್ವಚ್ಛತೆ, ಹೂಳೆತ್ತುವಿಕೆ ಮತ್ತು ನಿರ್ವಹಣಾ ಲಾಗ್‌ಬುಕ್ ದಾಖಲೆಗಳ ದೃಢೀಕೃತ ಪ್ರತಿಗಳನ್ನು ಒದಗಿಸಿ${dur ? ` (ಕಳೆದ ${dur} ದಾಖಲೆಗಳು)` : ""}..`,
          "ಬಾವಿಯ ನೀರಿನ ಗುಣಮಟ್ಟ ಪರೀಕ್ಷಾ ವರದಿಗಳು (Water Quality Tests) ಮತ್ತು ಕ್ಲೋರಿನೇಷನ್ ತಪಾಸಣಾ ರಿಜಿಸ್ಟರ್ ಪ್ರತಿಗಳನ್ನು ನೀಡಿ.",
          `ಈ ಸಾರ್ವಜನಿಕ ಬಾವಿಯ ಸ್ವಚ್ಛತೆ ಮತ್ತು ದುರಸ್ತಿ ಕಾಮಗಾರಿಗಳಿಗೆ ಮಂಜೂರಾದ ಕಾರ್ಯಾದೇಶಗಳು (Work Orders), ಅನುದಾನ ಮತ್ತು ಪಾವತಿ ವೋಚರ್‌ಗಳ ವಿವರಗಳನ್ನು ಒದಗಿಸಿ${dur ? ` (ಕಳೆದ ${dur} ವಿವರ)` : ""}..`,
          "ಸಾರ್ವಜನಿಕ ಕುಡಿಯುವ ನೀರಿನ ಬಾವಿಗಳ ನೈರ್ಮಲ್ಯ ಮತ್ತು ನಿರ್ವಹಣೆಗೆ ಜವಾಬ್ದಾರರಾಗಿರುವ ಪಂಚಾಯತ್ ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ (PDO) / ಎಂಜಿನಿಯರ್ ಹೆಸರು ಮತ್ತು ಹುದ್ದೆಯ ವಿವರಗಳನ್ನು ತಿಳಿಸಿ."
        ] : l === "ml" ? [
          `ഈ പ്രദേശത്തെ പൊതു / സർക്കാർ കിണർ വൃത്തിയാക്കൽ, ചെളി നീക്കൽ, അറ്റകുറ്റപ്പണി എന്നിവയുടെ ലോഗ് ബുക്ക് രേഖകളുടെ സാക്ഷ്യപ്പെടുത്തിയ പകർപ്പുകൾ നൽകുക${dur ? ` (കഴിഞ്ഞ ${dur} രേഖകൾ)` : ""}..`,
          "കിണറ്റിലെ വെള്ളത്തിന്റെ ഗുണനിലവാര പരിശോധനാ റിപ്പോർട്ടുകളും ക്ലോറിനേഷൻ ഷെഡ്യൂൾ രജിസ്റ്ററും ലഭ്യമാക്കുക.",
          `ഈ പൊതു കിണറിന്റെ ശുചീകരണത്തിനും അറ്റകുറ്റപ്പണികൾക്കുമായി അനുവദിച്ച തുക, വർക്ക് ഓർഡറുകൾ, കരാറുകാരന് നൽകിയ പേയ്‌മെന്റ് വൗച്ചറുകൾ എന്നിവയുടെ പകർപ്പുകൾ നൽകുക${dur ? ` (കഴിഞ്ഞ ${dur} വിവരങ്ങൾ)` : ""}..`,
          "പൊതു കുടിവെള്ള കിണറുകളുടെ പരിപാലനത്തിന് ചുമതലപ്പെട്ട പഞ്ചായത്ത് സെക്രട്ടറി / അസിസ്റ്റന്റ് എൻജിനീയറുടെ പേരും ഔദ്യോഗിക പദവിയും വ്യക്തമാക്കുക."
        ] : l === "bn" ? [
          `এই এলাকার সরকারি / সার্বজনীন কুয়ার পরিচ্ছন্নতা, পলি নিষ্কাশন ও রক্ষণাবেক্ষণ রেজিস্টারের প্রত্যয়িত অনুলিপি প্রদান করুন${dur ? ` (বিগত ${dur} নথিপত্র)` : ""}।`,
          "কুয়ার জলের গুণমান পরীক্ষা রিপোর্ট এবং ক্লোরিনেশনের (Chlorination) পরিদর্শন লগবুকের অনুলিপি দিন।",
          `এই সরকারি কুয়া সংস্কার ও রক্ষণাবেক্ষণের জন্য বরাদ্দকৃত অর্থ, ওয়ার্ক অর্ডার এবং ঠিকাদারকে প্রদত্ত বিলের বিবরণ প্রদান করুন${dur ? ` (বিগত ${dur} হিসাব)` : ""}।`,
          "পৌরসভা / গ্রাম পঞ্চায়েত এলাকায় সার্বজনীন পানীয় জলের কুয়া রক্ষণাবেক্ষণের দায়িত্বপ্রাপ্ত আধিকারিকের নাম ও পদবী জানান।"
        ] : [
          `या परिसरातील शासकीय / सार्वजनिक विहिरीची स्वच्छता, गाळ काढणे व देखभालीच्या अधिकृत नोंदवहीची प्रमाणित प्रत द्यावी${dur ? ` (गेल्या ${dur} चे रेकॉर्ड)` : ""}..`,
          "विहिरीच्या पाण्याची गुणवत्ता तपासणी अहवाल (Water Testing Report) व क्लोरीनेशन (Chlorination) तपासणी नोंदवहीच्या प्रती द्याव्यात.",
          `या शासकीय विहिरीच्या दुरुस्ती व स्वच्छतेसाठी मंजूर निधी, वर्क ऑर्डर (Work Order) आणि कंत्राटदाराला दिलेल्या देयकांची माहिती द्यावी${dur ? ` (गेल्या ${dur} चा तपशील)` : ""}..`,
          "सार्वजनिक पिण्याच्या पाण्याच्या विहिरींची स्वच्छता व देखभालीस जबाबदार असलेल्या ग्रामसेवक / शाखा अभियंत्याचे नाव व पदनाम द्यावे."
        ];

      case "water.supply_irregular":
      case "water.quality_contamination":
      case "water.tank_storage_cleaning":
        return l === "ta" ? [
          `குடிநீர் விநியோக கால அட்டவணை, குழாய் பராமரிப்பு மற்றும் நீர் தர பரிசோதனை பதிவுகளின் நகல்களை வழங்கவும்${dur ? ` (கடந்த ${dur} காலத்திற்கு)` : ""}..`,
          "குடிநீர் விநியோக குறைபாடுகள், கசிவு பழுதுபார்ப்பு பணி ஆணைகள் மற்றும் புகார் பதிவேட்டின் நகல்களை வழங்கவும்.",
          "குடிநீர் தொட்டி சுத்திகரிப்பு மற்றும் குளோரினேஷன் பதிவேட்டின் நகல்களை வழங்கவும்.",
          "பாதுகாப்பான குடிநீர் விநியோகத்திற்கு பொறுப்பான நகராட்சி பொறியாளரின் பெயர் மற்றும் பதவி விவரங்களை தெரிவிக்கவும்."
        ] : l === "kn" ? [
          `ಕುಡಿಯುವ ನೀರು ಸರಬರಾಜು ವೇಳಾಪಟ್ಟಿ, ಪೈಪ್‌ಲೈನ್ ನಿರ್ವಹಣೆ ಮತ್ತು ನೀರಿನ ಗುಣಮಟ್ಟ ವರದಿಗಳ ದೃಢೀಕೃತ ಪ್ರತಿಗಳನ್ನು ಒದಗಿಸಿ${dur ? ` (ಕಳೆದ ${dur} ವಿವರ)` : ""}..`,
          "ನೀರು ಸರಬರಾಜು ದೂರುಗಳ ರಿಜಿಸ್ಟರ್ ಮತ್ತು ಸೋರಿಕೆ ದುರಸ್ತಿ ಕಾರ್ಯಾದೇಶಗಳ ಪ್ರತಿಗಳನ್ನು ನೀಡಿ.",
          "ನೀರಿನ ಟ್ಯಾಂಕ್ ಸ್ವಚ್ಛತೆ ಮತ್ತು ಕ್ಲೋರಿನೇಷನ್ ಪರಿಶೀಲನಾ ರಿಜಿಸ್ಟರ್ ಪ್ರತಿಗಳನ್ನು ಒದಗಿಸಿ.",
          "ಕುಡಿಯುವ ನೀರು ಸರಬರಾಜು ನಿರ್ವಹಣೆಗೆ ಜವಾಬ್ದಾರರಾಗಿರುವ ಎಂಜಿನಿಯರ್ ಹೆಸರು ಮತ್ತು ಹುದ್ದೆಯ ವಿವರಗಳನ್ನು ತಿಳಿಸಿ."
        ] : l === "ml" ? [
          `കുടിവെള്ള വിതരണ ഷെഡ്യൂൾ, പൈപ്പ്‌ലൈൻ അറ്റകുറ്റപ്പണി, ജല ഗുണനിലവാര പരിശോധന രേഖകളുടെ പകർപ്പുകൾ ലഭ്യമാക്കുക${dur ? ` (കഴിഞ്ഞ ${dur} വിവരങ്ങൾ)` : ""}..`,
          "കുടിവെള്ള വിതരണ തടസ്സങ്ങൾ, ചോർച്ച പരിഹരിച്ച വർക്ക് ഓർഡറുകൾ എന്നിവയുടെ പകർപ്പുകൾ നൽകുക.",
          "വാട്ടർ ടാങ്ക് ശുചീകരണത്തിന്റെയും ക്ലോറിനേഷന്റെയും ലോഗ് ബുക്ക് ലഭ്യമാക്കുക.",
          "കുടിവെള്ള വിതരണത്തിന് ഉത്തരവാദിയായ അസിസ്റ്റന്റ് എൻജിനീയറുടെ പേരും വിവരങ്ങളും വ്യക്തമാക്കുക."
        ] : l === "bn" ? [
          `পানীয় জল সরবরাহ সময়সূচী, পাইপলাইন মেরামত ও জলের গুণমান পরীক্ষার রিপোর্টের প্রত্যয়িত অনুলিপি দিন${dur ? ` (বিগত ${dur} হিসাব)` : ""}।`,
          "জল সরবরাহ পাইপলাইনের পরিদর্শন লগ ও লিকেজ মেরামতের কাজের আদেশের অনুলিপি প্রদান করুন।",
          "জলের ট্যাঙ্ক পরিষ্কার ও ক্লোরিনেশনের পরিদর্শন লগবুকের অনুলিপি দিন।",
          "পানীয় জল সরবরাহের দায়িত্বপ্রাপ্ত পৌর প্রকৌশলীর নাম ও পদবী জানান।"
        ] : [
          `पिण्याच्या पाण्याचे वेळापत्रक, पाईपलाईन गळती दुरुस्ती व पाणी गुणवत्ता चाचणी अहवालाच्या प्रमाणित प्रती द्याव्यात${dur ? ` (गेल्या ${dur} चा तपशील)` : ""}..`,
          "पाणी पुरवठा तक्रार नोंदवही व दुरुस्ती कामाच्या वर्क ऑर्डरच्या प्रती द्याव्यात.",
          "पाण्याच्या टाकीची स्वच्छता व क्लोरीनेशन तपासणी नोंदवही द्यावी.",
          "पिण्याच्या पाण्याच्या पुरवठ्यासाठी जबाबदार असलेल्या अभियंत्याचे नाव व संपर्क क्रमांक द्यावा."
        ];

      case "electricity.streetlights":
      case "electricity.billing_meter":
      case "electricity.outage_power":
        return l === "ta" ? [
          `தெரு விளக்கு பராமரிப்பு பதிவேடு, மின் கட்டண கணக்கீட்டு தாள் மற்றும் புகார் பதிவேட்டின் நகல்களை வழங்கவும்${dur ? ` (கடந்த ${dur} காலத்திற்கு)` : ""}..`,
          "மின் கட்டமைப்பு பழுது நீக்கும் பணி ஆணைகள் மற்றும் ஒப்பந்ததாரர் விவரங்களை தெரிவிக்கவும்.",
          "மின்சார பராமரிப்புக்காக அனுமதிக்கப்பட்ட நிதி மற்றும் செலவின விவரங்களை வழங்கவும்.",
          "மின்சார பராமரிப்பிற்கு பொறுப்பான உதவி பொறியாளரின் பெயர் மற்றும் பதவி விவரங்களை தெரிவிக்கவும்."
        ] : l === "kn" ? [
          `ಬೀದಿ ದೀಪ ನಿರ್ವಹಣಾ ಲಾಗ್‌ಬುಕ್, ದೂರು ರಿಜಿಸ್ಟರ್ ಮತ್ತು ವಿದ್ಯುತ್ ಬಿಲ್ ಲೆಕ್ಕಾಚಾರದ ಪ್ರತಿಗಳನ್ನು ಒದಗಿಸಿ${dur ? ` (ಕಳೆದ ${dur} ವಿವರ)` : ""}..`,
          "ವಿದ್ಯುತ್ ದುರಸ್ತಿ ಕಾರ್ಯಾದೇಶಗಳು ಮತ್ತು ನಿರ್ವಹಣಾ ಗುತ್ತಿಗೆದಾರರ ವಿವರಗಳನ್ನು ನೀಡಿ.",
          "ವಿದ್ಯುತ್ ಮೂಲಸೌಕರ್ಯ ನಿರ್ವಹಣೆಗೆ ಬಿಡುಗಡೆಯಾದ ಅನುದಾನದ ವಿವರಗಳನ್ನು ಒದಗಿಸಿ.",
          "ವಿದ್ಯುತ್ ನಿರ್ವಹಣೆಗೆ ಜವಾಬ್ದಾರರಾಗಿರುವ ಎಂಜಿನಿಯರ್ ಹೆಸರು ಮತ್ತು ಹುದ್ದೆಯ ವಿವರಗಳನ್ನು ತಿಳಿಸಿ."
        ] : l === "ml" ? [
          `തെരുവ് വിളക്ക് പരിപാലന ലോഗ് ബുക്ക്, വൈദ്യുതി തകരാർ രജിസ്റ്റർ എന്നിവയുടെ സാക്ഷ്യപ്പെടുത്തിയ പകർപ്പുകൾ നൽകുക${dur ? ` (കഴിഞ്ഞ ${dur} വിവരങ്ങൾ)` : ""}..`,
          "അറ്റകുറ്റപ്പണി വർക്ക് ഓർഡറുകളും കരാറുകാരന്റെ വിവരങ്ങളും ലഭ്യമാക്കുക.",
          "വൈദ്യുതി പരിപാലനത്തിനായി അനുവദിച്ച തുകയുടെ വിനിയോഗ വിവരങ്ങൾ നൽകുക.",
          "വൈദ്യുതി പരിപാലനത്തിന് ചുമതലപ്പെട്ട അസിസ്റ്റന്റ് എൻജിനീയറുടെ പേരും പദവിയും വ്യക്തമാക്കുക."
        ] : l === "bn" ? [
          `রাস্তার আলো রক্ষণাবেক্ষণ লগবুক, অভিযোগ রেজিস্টার ও বিদ্যুৎ বিলের হিসাবের প্রত্যয়িত অনুলিপি দিন${dur ? ` (বিগত ${dur} হিসাব)` : ""}।`,
          "বিদ্যুৎ পরিকাঠামো মেরামতের কাজের আদেশ ও ঠিকাদারের বিবরণ প্রদান করুন।",
          "বিদ্যুৎ রক্ষণাবেক্ষণের জন্য বরাদ্দকৃত অর্থের ব্যয়ের খতিয়ান দিন।",
          "বিদ্যুৎ ব্যবস্থার দায়িত্বপ্রাপ্ত সহকারী প্রকৌশলীর নাম ও পদবী জানান।"
        ] : [
          `स्ट्रीट लाईट दुरुस्ती लॉगबुक, वीज बिल गणना पत्रक व तक्रार नोंदवहीच्या प्रमाणित प्रती द्याव्यात${dur ? ` (गेल्या ${dur} चा तपशील)` : ""}..`,
          "विद्युत दुरुस्ती वर्क ऑर्डर व कंत्राटदाराचा तपशील द्यावा.",
          "विद्युत देखभालीसाठी मंजूर निधी व खर्चाचा तपशील द्यावा.",
          "विद्युत देखभालीस जबाबदार असलेल्या शाखा अभियंत्याचे नाव व पदनाम द्यावे."
        ];

      case "civic.potholes_roads":
      case "civic.drainage_garbage":
      case "civic.maintenance":
        return l === "ta" ? [
          `சாலை பழுதுபார்ப்பு பணி ஆணைகள், வடிகால் தூர்வாருதல் மற்றும் ஒப்பந்ததாரர் ஒப்பந்த நகல்களை வழங்கவும்${dur ? ` (கடந்த ${dur} பதிவுகள்)` : ""}..`,
          "பணிகளின் அளவீட்டுப் புத்தகம் (MB) மற்றும் தரப் பரிசோதனை அறிக்கைகளின் நகல்களை வழங்கவும்.",
          "இந்த வளர்ச்சிப் பணிகளுக்கு செலவிடப்பட்ட மொத்த நிதி மற்றும் கொடுப்பனவு விவரங்களை வழங்கவும்.",
          "பணிகளை மேற்பார்வையிடும் நகராட்சி பொறியாளர் மற்றும் சுகாதார ஆய்வாளரின் விவரங்களை தெரிவிக்கவும்."
        ] : l === "kn" ? [
          `ರಸ್ತೆ ದುರಸ್ತಿ ಕಾರ್ಯಾದೇಶಗಳು, ಚರಂಡಿ ಹೂಳೆತ್ತುವಿಕೆ ಮತ್ತು ಗುತ್ತಿಗೆ ಕರಾರು ಪತ್ರದ ಪ್ರತಿಗಳನ್ನು ಒದಗಿಸಿ${dur ? ` (ಕಳೆದ ${dur} ವಿವರ)` : ""}..`,
          "ಕಾಮಗಾರಿಯ ಮಾಪನ ಪುಸ್ತಕ (MB) ಮತ್ತು ಗುಣಮಟ್ಟ ತಪಾಸಣಾ ವರದಿಗಳನ್ನು ನೀಡಿ.",
          "ಈ ಸಾರ್ವಜನಿಕ ಕಾಮಗಾರಿಗೆ ಖರ್ಚು ಮಾಡಿದ ಒಟ್ಟು ಅನುದಾನ ಮತ್ತು ಪಾವತಿ ವಿವರಗಳನ್ನು ಒದಗಿಸಿ.",
          "ಕಾಮಗಾರಿ ಮೇಲ್ವಿಚಾರಣೆ ನಡೆಸುವ ಮುನ್ಸಿಪಲ್ ಎಂಜಿನಿಯರ್ ಹೆಸರು ಮತ್ತು ಹುದ್ದೆಯ ವಿವರ ತಿಳಿಸಿ."
        ] : l === "ml" ? [
          `റോഡ് അറ്റകുറ്റപ്പണി വർക്ക് ഓർഡറുകൾ, ഡ്രെയിനേജ് ശുചീകരണം, കരാർ രേഖകൾ എന്നിവയുടെ പകർപ്പുകൾ നൽകുക${dur ? ` (കഴിഞ്ഞ ${dur} വിവരങ്ങൾ)` : ""}..`,
          "പ്രവൃത്തികളുടെ മെഷർമെന്റ് ബുക്ക് (MB), ഗുണനിലവാര പരിശോധനാ റിപ്പോർട്ട് എന്നിവ ലഭ്യമാക്കുക.",
          "ഈ പൊതുമരാമത്ത് പ്രവൃത്തിക്ക് ചെലവഴിച്ച ആകെ തുകയുടെയും പേയ്‌മെന്റ് വൗച്ചറുകളുടെയും വിവരം നൽകുക.",
          "മേൽനോട്ടം വഹിച്ച മുൻസിപ്പൽ എൻജിനീയറുടെയും സാനിറ്ററി ഇൻസ്‌പെക്ടറുടെയും വിവരങ്ങൾ വ്യക്തമാക്കുക."
        ] : l === "bn" ? [
          `রাস্তা মেরামত কাজের আদেশ, নিকাশি নালা পরিচ্ছন্নতা ও চুক্তিনামার প্রত্যয়িত অনুলিপি দিন${dur ? ` (বিগত ${dur} হিসাব)` : ""}।`,
          "কাজের পরিমাপ বই (MB) ও গুণমান পরীক্ষার রিপোর্টের অনুলিপি প্রদান করুন।",
          "এই উন্নয়নমূলক কাজে মোট ব্যয়ের হিসাব ও বিল ভাউচারের বিবরণ দিন।",
          "কাজের তদারকিকারী পৌর প্রকৌশলী ও স্যানিটারি ইন্সপেক্টরের নাম ও পদবী জানান।"
        ] : [
          `रस्ते दुरुस्ती वर्क ऑर्डर, सांडपाणी वाहिनी स्वच्छता व कंत्राट कराराच्या प्रमाणित प्रती द्याव्यात${dur ? ` (गेल्या ${dur} चा तपशील)` : ""}..`,
          "कामाची मोजमाप नोंदवही (MB) व गुणवत्ता चाचणी अहवाल द्यावा.",
          "या कामासाठी झालेल्या एकूण खर्चाची माहिती व पेमेंट व्हाउचर द्यावेत.",
          "कामाचे पर्यवेक्षण करणाऱ्या पालिका अभियंत्याचे नाव व पदनाम द्यावे."
        ];

      case "health.medicines_stock":
      case "health.xray_equipment":
      case "health.infrastructure_service":
        return l === "ta" ? [
          `அரசு மருத்துவமனையின் மருந்து இருப்பு பதிவேடு மற்றும் மருத்துவ உபகரண பராமரிப்பு பதிவேட்டின் நகல்களை வழங்கவும்${dur ? ` (கடந்த ${dur} பதிவுகள்)` : ""}..`,
          "மருந்து கொள்முதல் ஆணைகள் மற்றும் உபகரண பழுது நீக்கும் அறிக்கைகளின் நகல்களை வழங்கவும்.",
          "மருத்துவமனை பராமரிப்புக்காக அனுமதிக்கப்பட்ட நிதி மற்றும் செலவின விவரங்களை வழங்கவும்.",
          "மருத்துவமனை கண்காணிப்பாளர் மற்றும் மருந்தக அதிகாரியின் பெயர், பதவி விவரங்களை தெரிவிக்கவும்."
        ] : l === "kn" ? [
          `ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆಯ ಔಷಧಿ ದಾಸ್ತಾನು ರಿಜಿಸ್ಟರ್ ಮತ್ತು ಉಪಕರಣ ನಿರ್ವಹಣಾ ಲಾಗ್‌ಬುಕ್ ಪ್ರತಿಗಳನ್ನು ಒದಗಿಸಿ${dur ? ` (ಕಳೆದ ${dur} ವಿವರ)` : ""}..`,
          "ಔಷಧಿ ಖರೀದಿ ಆದೇಶಗಳು ಮತ್ತು ಉಪಕರಣ ರಿಪೇರಿ ವರದಿಗಳ ಪ್ರತಿಗಳನ್ನು ನೀಡಿ.",
          "ಆಸ್ಪತ್ರೆ ನಿರ್ವಹಣೆಗೆ ಮಂಜೂರಾದ ಅನುದಾನ ಮತ್ತು ಖರ್ಚಿನ ವಿವರಗಳನ್ನು ಒದಗಿಸಿ.",
          "ಆಸ್ಪತ್ರೆ ಅಧೀಕ್ಷಕರು ಮತ್ತು ಫಾರ್ಮಸಿ ಅಧಿಕಾರಿಯ ಹೆಸರು, ಹುದ್ದೆಯ ವಿವರಗಳನ್ನು ತಿಳಿಸಿ."
        ] : l === "ml" ? [
          `സർക്കാർ ആശുപത്രിയിലെ മരുന്ന് സ്റ്റോക്ക് രജിസ്റ്റർ, ഉപകരണ ലോഗ് ബുക്ക് എന്നിവയുടെ പകർപ്പുകൾ നൽകുക${dur ? ` (കഴിഞ്ഞ ${dur} വിവരങ്ങൾ)` : ""}..`,
          "മരുന്ന് വാങ്ങിയ ഓർഡറുകളും ഉപകരണ അറ്റകുറ്റപ്പണി റിപ്പോർട്ടുകളും ലഭ്യമാക്കുക.",
          "ആശുപത്രി പരിപാലനത്തിനായി അനുവദിച്ച ഫണ്ടിന്റെ വിനിയോഗ വിവരങ്ങൾ നൽകുക.",
          "ആശുപത്രി സൂപ്രണ്ടിന്റെയും മെഡിക്കൽ ഓഫീസറുടെയും പേരും പദവിയും വ്യക്തമാക്കുക."
        ] : l === "bn" ? [
          `সরকারি হাসপাতালের ওষুধের স্টক রেজিস্টার ও যন্ত্রপাতি রক্ষণাবেক্ষণ লগবুকের অনুলিপি দিন${dur ? ` (বিগত ${dur} হিসাব)` : ""}।`,
          "ওষুধ ক্রয়ের আদেশপত্র ও যন্ত্রপাতি মেরামতের রিপোর্টের অনুলিপি প্রদান করুন।",
          "হাসপাতাল পরিকাঠামো রক্ষণাবেক্ষণের জন্য বরাদ্দকৃত অর্থের বিবরণ দিন।",
          "হাসপাতাল সুপারিন্টেন্ডেন্ট ও ফার্মাসিস্টের নাম ও পদবী জানান।"
        ] : [
          `शासकीय रुग्णालयातील औषध साठा नोंदवही व उपकरण देखभाल लॉगबुकच्या प्रमाणित प्रती द्याव्यात${dur ? ` (गेल्या ${dur} चा तपशील)` : ""}..`,
          "औषध खरेदी आदेश व उपकरण दुरुस्ती अहवाल द्यावा.",
          "रुग्णालय देखभालीसाठी मंजूर निधी व खर्चाचा तपशील द्यावा.",
          "रुग्णालय अधीक्षक व वैद्यकीय अधिकाऱ्याचे नाव व पदनाम द्यावे."
        ];

      case "pension.delay_pending":
      case "pension.stopped_rejected":
      case "pension.pf_gratuity":
        return l === "ta" ? [
          `ஓய்வூதிய விண்ணப்பத்தின் தற்போதைய நிலை மற்றும் அனைத்து கோப்பு குறிப்புகளின் நகல்களை வழங்கவும்${dur ? ` (${dur} தாமதம்)` : ""}..`,
          "பல்வேறு அதிகாரிகளுக்கு இடையே கோப்பு நகர்வு செய்யப்பட்ட தேதி வாரியான பதிவேட்டை வழங்கவும்.",
          "ஓய்வூதிய கோப்பை பரிசீலிக்கும் பொறுப்பான அதிகாரியின் பெயர் மற்றும் பதவி விவரங்களை தெரிவிக்கவும்.",
          "ஓய்வூதியம் வழங்குவதில் ஏற்பட்ட தாமதத்திற்கான காரணங்கள் மற்றும் நிலுவைத் தொகை வழங்கும் கால அட்டவணையை தெரிவிக்கவும்."
        ] : l === "kn" ? [
          `ಪಿಂಚಣಿ ಅರ್ಜಿಯ ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ ಮತ್ತು ಕಡತದ ಟಿಪ್ಪಣಿಗಳ ದೃಢೀಕೃತ ಪ್ರತಿಗಳನ್ನು ಒದಗಿಸಿ${dur ? ` (${dur} ವಿಳಂಬ)` : ""}..`,
          "ವಿವಿಧ ಅಧಿಕಾರಿಗಳ ನಡುವೆ ಕಡತ ಚಲನವಲನದ ದಿನಾಂಕವಾರು ವಿವರಗಳನ್ನು ನೀಡಿ.",
          "ಪಿಂಚಣಿ ಕಡತವನ್ನು ವಿಲೇವಾರಿ ಮಾಡುವ ಅಧಿಕಾರಿಯ ಹೆಸರು ಮತ್ತು ಹುದ್ದೆಯ ವಿವರ ತಿಳಿಸಿ.",
          "ಪಿಂಚಣಿ ವಿತರಣೆಯಲ್ಲಿನ ವಿಳಂಬಕ್ಕೆ ಕಾರಣಗಳು ಮತ್ತು ಬಾಕಿ ಹಣ ಬಿಡುಗಡೆಯ ವೇಳಾಪಟ್ಟಿಯನ್ನು ತಿಳಿಸಿ."
        ] : l === "ml" ? [
          `പെൻഷൻ അപേക്ഷയുടെ നിലവിലെ പ്രോസസ്സിംഗ് വിവരങ്ങളും ഫയൽ കുറിപ്പുകളുടെ പകർപ്പും നൽകുക${dur ? ` (${dur} കാലതാമസം)` : ""}..`,
          "വിവിധ വകുപ്പുകൾ തമ്മിലുള്ള ഫയൽ നീക്കങ്ങളുടെ തീയതി വിവരങ്ങൾ ലഭ്യമാക്കുക.",
          "പെൻഷൻ ഫയൽ കൈകാര്യം ചെയ്യുന്ന ബന്ധപ്പെട്ട ഉദ്യോഗസ്ഥന്റെ പേരും പദവിയും വ്യക്തമാക്കുക.",
          "പെൻഷൻ അനുവദിക്കുന്നതിലുണ്ടായ കാലതാമസത്തിന്റെ കാരണങ്ങളും തുക ലഭിക്കുന്ന തീയതിയും വ്യക്തമാക്കുക."
        ] : l === "bn" ? [
          `পেনশন আবেদনের বর্তমান প্রক্রিয়াকরণ স্থিতি ও ফাইল নোটের প্রত্যয়িত অনুলিপি দিন${dur ? ` (${dur} বিলম্ব)` : ""}।`,
          "বিভিন্ন দপ্তরের মধ্যে ফাইল চলাচলের তারিখভিত্তিক বিবরণ প্রদান করুন।",
          "পেনশন ফাইল পরিচালনাকারী দায়িত্বপ্রাপ্ত আধিকারিকের নাম ও পদবী জানান।",
          "পেনশন বিতরণে বিলম্বের কারণ ও বকেয়া অর্থ প্রদানের সময়সূচী জানান।"
        ] : [
          `पेन्शन अर्जाची सद्यस्थिती व सर्व फाइल टिपण्यांच्या प्रमाणित प्रती द्याव्यात${dur ? ` (${dur} विलंब)` : ""}..`,
          "विविध टेबलांमधील फाइल हालचालीचा दिनांकनिहाय तपशील द्यावा.",
          "पेन्शन फाइल हाताळणाऱ्या जबाबदार अधिकाऱ्याचे नाव व पदनाम द्यावे.",
          "पेन्शन वितरणातील विलंबाची कारणे व थकबाकी जमा करण्याचे वेळापत्रक द्यावे."
        ];

      case "police.fir_not_registered":
      case "police.investigation_progress":
        return l === "ta" ? [
          "காவல் நிலையத்தில் சமர்ப்பிக்கப்பட்ட புகாரின் பொது நாட்குறிப்பு (GD) பதிவின் நகலை வழங்கவும்.",
          "புகார் மீது மேற்கொள்ளப்பட்ட முதற்கட்ட விசாரணை அறிக்கை அல்லது சம்பவ இட ஆய்வு அறிக்கையின் நகலை வழங்கவும்.",
          "முதல் தகவல் அறிக்கை (FIR) பதிவு செய்யப்படாததற்கான சட்டப்பூர்வ காரணங்களை தெரிவிக்கவும்.",
          "விசாரணைக்கு நியமிக்கப்பட்ட காவல் அதிகாரியின் பெயர் மற்றும் பதவி விவரங்களை தெரிவிக்கவும்."
        ] : l === "kn" ? [
          "ಪೊಲೀಸ್ ಠಾಣೆಯಲ್ಲಿ ಸಲ್ಲಿಸಿದ ದೂರಿನ ಜನರಲ್ ಡೈರಿ (GD) ನಮೂದಿನ ದೃಢೀಕೃತ ಪ್ರತಿಯನ್ನು ನೀಡಿ.",
          "ದೂರಿನ ಮೇಲಿನ ಪ್ರಾಥಮಿಕ ತನಿಖಾ ವರದಿ ಅಥವಾ ಸ್ಥಳ ತಪಾಸಣಾ ವರದಿಯ ಪ್ರತಿಯನ್ನು ಒದಗಿಸಿ.",
          "ಪ್ರಥಮ ವರ್ತಮಾನ ವರದಿ (ಎಫ್‌ಐಆರ್) ದಾಖಲಿಸದಿರಲು ದಾಖಲಾದ ಕಾನೂನುಬದ್ಧ ಕಾರಣಗಳನ್ನು ತಿಳಿಸಿ.",
          "ದೂರಿನ ತನಿಖೆ ನಡೆಸುತ್ತಿರುವ ಪೊಲೀಸ್ ಅಧಿಕಾರಿಯ ಹೆಸರು ಮತ್ತು ಹುದ್ದೆಯ ವಿವರಗಳನ್ನು ಒದಗಿಸಿ."
        ] : l === "ml" ? [
          "പോലീസ് സ്റ്റേഷനിൽ നൽകിയ പരാതിയിന്മേൽ രേഖപ്പെടുത്തിയ ജനറൽ ഡയറി (GD) എൻട്രിയുടെ പകർപ്പ് നൽകുക.",
          "പരാതിയിന്മേൽ നടത്തിയ പ്രാഥമിക അന്വേഷണ റിപ്പോർട്ടിന്റെ പകർപ്പ് ലഭ്യമാക്കുക.",
          "എഫ്ഐആർ (FIR) രജിസ്റ്റർ ചെയ്യാതിരുന്നതിനുള്ള രേഖപ്പെടുത്തിയ കാരണങ്ങൾ വ്യക്തമാക്കുക.",
          "അന്വേഷണ ചുമതലയുള്ള പോലീസ് ഉദ്യോഗസ്ഥന്റെ പേരും പദവിയും വ്യക്തമാക്കുക."
        ] : l === "bn" ? [
          "থানায় জমা দেওয়া অভিযোগের জেনারেল ডায়েরি (GD) এন্ট্রির প্রত্যয়িত কপি দিন।",
          "অভিযোগের ওপর প্রাথমিক তদন্ত রিপোর্ট বা ঘটনাস্থল পরিদর্শনের নোটের অনুলিপি প্রদান করুন।",
          "এফআইআর (FIR) দায়ের না করার নথিভুক্ত আইনি কারণ জানান।",
          "তদন্তকারী পুলিশ অফিসারের নাম ও ব্যাচ নম্বর প্রদান করুন।"
        ] : [
          "पोलीस ठाण्यात दिलेल्या तक्रारीची जनरल डायरी (GD) नोंदीची प्रमाणित प्रत द्यावी.",
          "तक्रारीवरील प्राथमिक चौकशी अहवाल किंवा घटनास्थळ पंचनाम्याची प्रत द्यावी.",
          "प्रथम खबरी अहवाल (FIR) दाखल न केल्याची कायदेशीर कारणे द्यावीत.",
          "तपास अधिकाऱ्याचे नाव, पद व पोलीस ठाण्याचा तपशील द्यावा."
        ];

      case "scholarship.delay_pending":
      case "scholarship.rejection":
      case "scholarship.fee_reimbursement":
        return l === "ta" ? [
          `கல்வி உதவித்தொகை விண்ணப்பத்தின் தற்போதைய நிலை மற்றும் கோப்பு குறிப்புகளின் நகல்களை வழங்கவும்${dur ? ` (${dur} தாமதம்)` : ""}..`,
          "அதிகாரிகளுக்கு இடையே கோப்பு நகர்வு செய்யப்பட்ட தேதி வாரியான பதிவேட்டை வழங்கவும்.",
          "உதவித்தொகை கோப்பை பரிசீலிக்கும் பொறுப்பான அதிகாரியின் பெயர், பதவி விவரங்களை தெரிவிக்கவும்.",
          "உதவித்தொகை விடுவிப்பதில் ஏற்பட்ட தாமதத்திற்கான காரணங்கள் மற்றும் தொகை வழங்கப்படும் தேதியை தெரிவிக்கவும்."
        ] : l === "kn" ? [
          `ವಿದ್ಯಾರ್ಥಿವೇತನ ಅರ್ಜಿಯ ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ ಮತ್ತು ಕಡತದ ಟಿಪ್ಪಣಿಗಳ ದೃಢೀಕೃತ ಪ್ರತಿಗಳನ್ನು ಒದಗಿಸಿ${dur ? ` (${dur} ವಿಳಂಬ)` : ""}..`,
          "ಕಡತ ಚಲನವಲನದ ದಿನಾಂಕವಾರು ವಿವರಗಳನ್ನು ನೀಡಿ.",
          "ವಿದ್ಯಾರ್ಥಿವೇತನ ಕಡತವನ್ನು ವಿಲೇವಾರಿ ಮಾಡುವ ಅಧಿಕಾರಿಯ ಹೆಸರು, ಹುದ್ದೆಯ ವಿವರ ತಿಳಿಸಿ.",
          "ಹಣ ಬಿಡುಗಡೆಯಲ್ಲಿನ ವಿಳಂಬಕ್ಕೆ ಕಾರಣಗಳು ಮತ್ತು ಹಣ ಜಮೆಯಾಗುವ ದಿನಾಂಕವನ್ನು ತಿಳಿಸಿ."
        ] : l === "ml" ? [
          `സ്കോളർഷിപ്പ് അപേക്ഷയുടെ നിലവിലെ പ്രോസസ്സിംഗ് വിവരങ്ങളും ഫയൽ കുറിപ്പുകളുടെ പകർപ്പും നൽകുക${dur ? ` (${dur} കാലതാമസം)` : ""}..`,
          "ഫയൽ നീക്കങ്ങളുടെ തീയതി വിവരങ്ങൾ ലഭ്യമാക്കുക.",
          "സ്കോളർഷിപ്പ് ഫയൽ കൈകാര്യം ചെയ്യുന്ന ഉദ്യോഗസ്ഥന്റെ പേരും പദവിയും വ്യക്തമാക്കുക.",
          "തുക അനുവദിക്കുന്നതിലുണ്ടായ കാലതാമസത്തിന്റെ കാരണങ്ങളും തീയതിയും വ്യക്തമാക്കുക."
        ] : l === "bn" ? [
          `স্কলারশিপ আবেদনের বর্তমান প্রক্রিয়াকরণ স্থিতি ও ফাইল নোটের প্রত্যয়িত অনুলিপি দিন${dur ? ` (${dur} বিলম্ব)` : ""}।`,
          "ফাইল চলাচলের তারিখভিত্তিক বিবরণ প্রদান করুন।",
          "স্কলারশিপ ফাইল পরিচালনাকারী আধিকারিকের নাম ও পদবী জানান।",
          "অর্থ প্রদানে বিলম্বের কারণ ও টাকা পাওয়ার নির্ধারিত তারিখ জানান।"
        ] : [
          `शिष्यवृत्ती अर्जाची सद्यस्थिती व सर्व फाइल टिपण्यांच्या प्रमाणित प्रती द्याव्यात${dur ? ` (${dur} विलंब)` : ""}..`,
          "फाइल हालचालीचा दिनांकनिहाय तपशील द्यावा.",
          "शिष्यवृत्ती फाइल हाताळणाऱ्या अधिकाऱ्याचे नाव व पदनाम द्यावे.",
          "शिष्यवृत्ती वितरणातील विलंबाची कारणे व रक्कम मिळण्याची तारीख द्यावी."
        ];

      case "general.public_records":
      default:
        return l === "ta" ? [
          "எனது புகார் / மனு மீது அரசு அலுவலகத்தில் பதிவு செய்யப்பட்ட அனைத்து கோப்பு குறிப்புகள் மற்றும் எடுக்கப்பட்ட நடவடிக்கை அறிக்கையின் நகல்களை வழங்கவும்.",
          "பல்வேறு அதிகாரிகளுக்கு இடையே கோப்பு நகர்வு செய்யப்பட்ட தேதி வாரியான பதிவேட்டை வழங்கவும்.",
          "இப்பிரச்சினையை தீர்ப்பதற்கு பொறுப்பான அரசு அதிகாரியின் பெயர், பதவி மற்றும் தொடர்பு விவரங்களை தெரிவிக்கவும்.",
          "குடிமக்கள் சாசனத்தின்படி இப்புகாரை தீர்ப்பதற்கான கால வரம்பு மற்றும் தாமதத்திற்கான காரணங்களை தெரிவிக்கவும்."
        ] : l === "kn" ? [
          "ನನ್ನ ದೂರು / ಮನವಿಯ ಮೇಲೆ ಸರ್ಕಾರಿ ಕಚೇರಿಯಲ್ಲಿ ದಾಖಲಾದ ಎಲ್ಲಾ ಕಡತದ ಟಿಪ್ಪಣಿಗಳು ಮತ್ತು ಕೈಗೊಂಡ ಕ್ರಮದ ವರದಿಗಳ ದೃಢೀಕೃತ ಪ್ರತಿಗಳನ್ನು ನೀಡಿ.",
          "ವಿವಿಧ ಅಧಿಕಾರಿಗಳ ನಡುವೆ ಕಡತ ಚಲನವಲನದ ದಿನಾಂಕವಾರು ರಿಜಿಸ್ಟರ್ ವಿವರಗಳನ್ನು ಒದಗಿಸಿ.",
          "ಈ ಸಮಸ್ಯೆಯನ್ನು ಬಗೆಹರಿಸಲು ಜವಾಬ್ದಾರರಾಗಿರುವ ಸಾರ್ವಜನಿಕ ಪ್ರಾಧಿಕಾರದ ಅಧಿಕಾರಿಯ ಹೆಸರು, ಹುದ್ದೆ ಮತ್ತು ಸಂಪರ್ಕ ವಿವರ ತಿಳಿಸಿ.",
          "ಸಿಟಿಜನ್ ಚಾರ್ಟರ್ ಪ್ರಕಾರ ಈ ದೂರು ಪರಿಹಾರಕ್ಕೆ ನಿಗದಿಯಾದ ಕಾಲಮಿತಿ ಮತ್ತು ವಿಳಂಬಕ್ಕೆ ದಾಖಲಾದ ಕಾರಣಗಳನ್ನು ತಿಳಿಸಿ."
        ] : l === "ml" ? [
          "എന്റെ പരാതിയിന്മേൽ സർക്കാർ ഓഫീസിൽ രേഖപ്പെടുത്തിയ എല്ലാ ഫയൽ കുറിപ്പുകളുടെയും സ്വീകരിച്ച നടപടി റിപ്പോർട്ടുകളുടെയും പകർപ്പ് നൽകുക.",
          "വിവിധ ഉദ്യോഗസ്ഥർ തമ്മിലുള്ള ഫയൽ നീക്കങ്ങളുടെ തീയതി രജിസ്റ്റർ ലഭ്യമാക്കുക.",
          "ഈ വിഷയം പരിഹരിക്കാൻ ചുമതലപ്പെട്ട പബ്ലിക് അതോറിറ്റി ഉദ്യോഗസ്ഥന്റെ പേരും പദവിയും വ്യക്തമാക്കുക.",
          "പൗരാവകാശ രേഖ പ്രകാരം ഈ പരാതി തീർപ്പാക്കേണ്ട സമയപരിധിയും കാലതാമസത്തിന്റെ കാരണങ്ങളും വ്യക്തമാക്കുക."
        ] : l === "bn" ? [
          "আমার অভিযোগের ওপর সরকারি দপ্তরে নথিভুক্ত সমস্ত ফাইল নোট ও গৃহীত পদক্ষেপ সংক্রান্ত রিপোর্টের প্রত্যয়িত অনুলিপি দিন।",
          "বিভিন্ন আধিকারিকের মধ্যে ফাইল চলাচলের তারিখভিত্তিক রেজিস্টার প্রদান করুন।",
          "এই বিষয়টি নিষ্পত্তির দায়িত্বপ্রাপ্ত উপযুক্ত সরকারি কর্মকর্তার নাম, পদবী ও যোগাযোগের বিবরণ জানান।",
          "সিটিজেন চার্টার অনুযায়ী অভিযোগ নিষ্পত্তির নির্ধারিত সময়সীমা ও বিলম্বের কারণ জানান।"
        ] : [
          "माझ्या तक्रारीवर शासकीय कार्यालयात नोंदवलेल्या सर्व फाइल टिपण्या व केलेल्या कारवाई अहवालाच्या प्रमाणित प्रती द्याव्यात.",
          "विविध अधिकाऱ्यांमधील फाइल हालचालीची दिनांकनिहाय नोंदवही द्यावी.",
          "हा विषय निकाली काढण्यास जबाबदार असलेल्या सक्षम अधिकाऱ्याचे नाव, पदनाम व संपर्क तपशील द्यावा.",
          "नागरी हक्क सनदेनुसार (Citizen Charter) तक्रार निवारणाची विहित मुदत व विलंबाची नोंदवलेली कारणे द्यावीत."
        ];
    }
  };

  return genericBuilder(lang);
}

/**
 * Validates generated RTI questions against original user input.
 * Strips and regenerates questions if irrelevant domain leaks are detected.
 */
export function validateQuestionsRelevance(
  questions: RtiQuestion[],
  domain: string,
  rawText: string,
  lang: Lang
): RtiQuestion[] {
  const lowerText = rawText.toLowerCase();
  const isEducationIssue = [
    "scholarship", "college", "student", "tuition", "degree", "fee reimbursement", "stipend",
    "छात्रवृत्ति", "स्कॉलरशिप", "స్కాలర్‌షిప్", "உதவித்தொகை", "ವಿದ್ಯಾರ್ಥಿವೇತನ", "സ്കോളർഷിപ്പ്", "স্কলারশিপ", "शिष्यवृत्ती"
  ].some(k => lowerText.includes(k));

  // If NOT an education issue, check for scholarship leakage
  const hasScholarshipLeak = questions.some(q => {
    const qLower = q.text.toLowerCase();
    return !isEducationIssue && (
      qLower.includes("scholarship") ||
      qLower.includes("छात्रवृत्ति") ||
      qLower.includes("స్కాలర్‌షిప్") ||
      qLower.includes("உதவித்தொகை") ||
      qLower.includes("ವಿದ್ಯಾರ್ಥಿವೇತನ") ||
      qLower.includes("സ്കോളർഷിപ്പ്") ||
      qLower.includes("স্কলারশিপ") ||
      qLower.includes("शिष्यवृत्ती") ||
      qLower.includes("student") ||
      qLower.includes("tuition")
    );
  });

  if (hasScholarshipLeak) {
    console.warn(`[Relevance Validation] Detected scholarship leak for non-education input: "${rawText.slice(0, 40)}...". Regenerating domain questions for: ${domain}`);
    const facts = extractFacts(rawText);
    const subIssue = identifySubIssue(rawText, domain);
    const validQuestionStrings = buildDynamicQuestions(subIssue, facts, lang);
    return validQuestionStrings.map((qText, i) => ({
      id: `q${i + 1}`,
      text: qText
    }));
  }

  return questions;
}

export function mockUnderstand(rawText: string, lang: string = "en"): UnderstandResult {
  const currentLang = (lang as Lang) || "en";
  const domain = detectTopicFromText(rawText);
  const trans = TRANSLATIONS_UNDERSTAND[currentLang]?.[domain] || TRANSLATIONS_UNDERSTAND.en[domain] || TRANSLATIONS_UNDERSTAND.en.general;

  return {
    topic: domain,
    goal: "request_information",
    summary: trans.summary,
    rti_suitability: "likely",
    suitability_reason: trans.suitability_reason,
    confidence: 0.95,
    source: "fallback",
  };
}

export function mockGenerateQuestions(
  understanding: UnderstandResult,
  rawText: string = "",
  lang: string = "en"
): RtiQuestion[] {
  const currentLang = (lang as Lang) || "en";
  const domain = understanding.topic || detectTopicFromText(rawText);
  const facts = extractFacts(rawText);
  const subIssue = identifySubIssue(rawText, domain);

  const questionStrings = buildDynamicQuestions(subIssue, facts, currentLang);
  const rawQuestions: RtiQuestion[] = questionStrings.map((qText, i) => ({
    id: `q${i + 1}`,
    text: qText,
  }));

  return validateQuestionsRelevance(rawQuestions, domain, rawText, currentLang);
}

export function searchAuthorities(query: string, lang: string = "en"): Authority[] {
  return searchAuthoritiesLocalized(query, (lang as Lang) || "en");
}

export function generateRequestId(): string {
  const prefix = "RTI-2026";
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${rand}`;
}

export function generateAppealId(): string {
  const prefix = "APPEAL-2026";
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${rand}`;
}

export function getAppealGrounds(lang: string = "en"): GroundOption[] {
  const currentLang = (lang as Lang) || "en";
  return [
    {
      id: "no_response",
      label: t(currentLang, "groundNoResponse") || "No response received within statutory 30-day limit (Section 7(1))",
      description: t(currentLang, "groundNoResponseDesc") || "The PIO failed to provide any reply or decision within 30 days of receiving the RTI application."
    },
    {
      id: "refused",
      label: t(currentLang, "groundRefused") || "Information wrongfully refused or rejected under Section 8/9",
      description: t(currentLang, "groundRefusedDesc") || "The PIO denied the requested records without valid statutory exemption or justification."
    },
    {
      id: "incomplete",
      label: t(currentLang, "groundIncomplete") || "Incomplete, misleading, or distorted information provided",
      description: t(currentLang, "groundIncompleteDesc") || "The response received fails to answer all specific questions or omits crucial certified records."
    },
    {
      id: "excessive_fee",
      label: t(currentLang, "groundExcessiveFee") || "Unreasonable or excessive additional fee demanded",
      description: t(currentLang, "groundExcessiveFeeDesc") || "The PIO demanded disproportionate copying fees not in accordance with standard RTI rules."
    }
  ];
}

export function buildStatusHistory(finalStatus: RequestStatus = "SUBMITTED"): StatusEvent[] {
  const now = new Date();
  const d1 = new Date(now.getTime() - 25 * 86400000).toISOString().split("T")[0];
  const d2 = new Date(now.getTime() - 18 * 86400000).toISOString().split("T")[0];
  const d3 = new Date(now.getTime() - 5 * 86400000).toISOString().split("T")[0];
  const d4 = now.toISOString().split("T")[0];

  const base: StatusEvent[] = [
    {
      status: "SUBMITTED",
      date: d1,
      label: "Application successfully submitted and application fee verified.",
    },
    {
      status: "RECEIVED",
      date: d2,
      label: "Central Public Information Officer (CPIO) initiated record search.",
    },
    {
      status: "UNDER_REVIEW",
      date: d3,
      label: "Officer gathering files from regional field offices.",
    },
  ];

  if (finalStatus === "RESPONSE_RECEIVED") {
    base.push({
      status: "RESPONSE_RECEIVED",
      date: d4,
      label: "Official certified response dispatched by Public Authority.",
    });
  }

  return base;
}

export function mockExplainResponse(lang: string = "en"): MockResponse {
  const l = (lang as Lang) || "en";
  const dict: Record<Lang, MockResponse> = {
    en: {
      whatTheySaid: "The Public Information Officer stated that records have been partially supplied and the remaining information is under inter-departmental consultation under Section 6(3).",
      whatItMeans: "The department has acknowledged your request and provided preliminary records. The remaining files are being transferred to the concerned nodal branch.",
      whatToCheck: [
        "Check whether all specific questions you asked have been addressed with certified copies.",
        "Verify that dispatch numbers and dates are mentioned on the official response letter.",
        "If records are incomplete, note the 30-day statutory expiry date for filing a First Appeal."
      ],
    },
    hi: {
      whatTheySaid: "लोक सूचना अधिकारी ने सूचित किया कि उपलब्ध रिकॉर्ड आंशिक रूप से प्रदान किए गए हैं और शेष जानकारी संबंधित शाखा से एकत्र की जा रही है।",
      whatItMeans: "विभाग ने आपके आवेदन को स्वीकार कर लिया है। आंशिक दस्तावेज संलग्न हैं और शेष सूचना जल्द भेजी जाएगी।",
      whatToCheck: [
        "जांचें कि क्या आपके द्वारा पूछे गए सभी प्रश्नों के बिंदुवार उत्तर दिए गए हैं।",
        "सरकारी पत्र पर प्रेषण संख्या (Dispatch Number) और अधिकारी के हस्ताक्षर सत्यापित करें।",
        "यदि जानकारी अधूरी है, तो 30 दिन पूरे होने पर प्रथम अपील दायर करने की तिथि नोट करें।"
      ],
    },
    te: {
      whatTheySaid: "ప్రజా సమాచార అధికారి అభ్యర్థించిన సమాచారంలో కొంత భాగాన్ని జతపరిచినట్లు, మిగిలిన రికార్డులను సేకరిస్తున్నట్లు తెలిపారు.",
      whatItMeans: "విభాగం మీ దరఖాస్తును పరిశీలించి ప్రాథమిక సమాచారాన్ని అందించింది. మిగిలిన దస్త్రాలు బదిలీ చేయబడుతున్నాయి.",
      whatToCheck: [
        "మీరు అడిగిన అన్ని ప్రశ్నలకు ధృవీకరించిన సమాధానాలు లభించాయో లేదో సరిచూసుకోండి.",
        "అధికారిక లేఖపై డిస్పాచ్ నంబర్ మరియు పిఐఓ సంతకం ఉన్నాయో లేదో తనిఖీ చేయండి.",
        "సమాచారం అసంపూర్తిగా ఉంటే, 30 రోజుల గడువు ముగిసిన తర్వాత మొదటి అప్పీల్ దాఖలు చేయడానికి సిద్ధంగా ఉండండి."
      ],
    },
    ta: {
      whatTheySaid: "பொது தகவல் அதிகாரி தகவல்களை பகுதியளவு வழங்கியுள்ளதாகவும், மீதமுள்ள ஆவணங்கள் சேகரிக்கப்பட்டு வருவதாகவும் தெரிவித்துள்ளார்.",
      whatItMeans: "அரசுத்துறை உங்கள் விண்ணப்பத்தை ஏற்றுக்கொண்டு முதற்கட்ட ஆவணங்களை வழங்கியுள்ளது. மீதமுள்ள தகவல் விரைவில் அனுப்பப்படும்.",
      whatToCheck: [
        "நீங்கள் கேட்ட அனைத்து கேள்விகளுக்கும் சான்றளிக்கப்பட்ட பதில்கள் உள்ளதா என சரிபார்க்கவும்.",
        "அதிகாரப்பூர்வ கடிதத்தில் அனுப்புதல் எண் (Dispatch No) மற்றும் கையொப்பம் உள்ளதா என சரிபார்க்கவும்.",
        "தகவல் முழுமையடையவில்லை என்றால், முதல் மேல்முறையீடு செய்ய 30 நாள் காலக்கெடுவை குறித்துக்கொள்ளவும்."
      ],
    },
    kn: {
      whatTheySaid: "ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿಯು ಲಭ್ಯವಿರುವ ದಾಖಲೆಗಳನ್ನು ಭಾಗಶಃ ಒದಗಿಸಲಾಗಿದ್ದು, ಉಳಿದ ಮಾಹಿತಿಯನ್ನು ಸಂಗ್ರಹಿಸಲಾಗುತ್ತಿದೆ ಎಂದು ತಿಳಿಸಿದ್ದಾರೆ.",
      whatItMeans: "ಇಲಾಖೆಯು ನಿಮ್ಮ ಅರ್ಜಿಯನ್ನು ಸ್ವೀಕರಿಸಿದೆ ಮತ್ತು ಪ್ರಾಥಮಿಕ ದಾಖಲೆಗಳನ್ನು ಒದಗಿಸಿದೆ. ಬಾಕಿ ಮಾಹಿತಿ ಶೀಘ್ರದಲ್ಲೇ ಬರಲಿದೆ.",
      whatToCheck: [
        "ನೀವು ಕೇಳಿದ ಎಲ್ಲಾ ಪ್ರಶ್ನೆಗಳಿಗೆ ಅಧಿಕೃತ ಉತ್ತರ ನೀಡಲಾಗಿದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ.",
        "ಸರ್ಕಾರಿ ಪತ್ರದ ಮೇಲೆ ರವಾನೆ ಸಂಖ್ಯೆ (Dispatch No) ಮತ್ತು ಅಧಿಕಾರಿಯ ಸಹಿ ಪರಿಶೀಲಿಸಿ.",
        "ಮಾಹಿತಿ ಅಪೂರ್ಣವಾಗಿದ್ದರೆ, ಮೊದಲ ಮೇಲ್ಮನವಿ ಸಲ್ಲಿಸಲು 30 ದಿನಗಳ ಕಾಲಮಿತಿಯನ್ನು ಗಮನಿಸಿ."
      ],
    },
    ml: {
      whatTheySaid: "ലഭ്യമായ വിവരങ്ങൾ ഭാഗികമായി നൽകിയിട്ടുണ്ടെന്നും ബാക്കി രേഖകൾ ശേഖരിച്ചു വരികയാണെന്നും പബ്ലിക് ഇൻഫർമേഷൻ ഓഫീസർ അറിയിച്ചു.",
      whatItMeans: "വകുപ്പ് നിങ്ങളുടെ അപേക്ഷ സ്വീകരിക്കുകയും പ്രാഥമിക രേഖകൾ നൽകുകയും ചെയ്തു. ബാക്കി വിവരങ്ങൾ ഉടൻ ലഭ്യമാകും.",
      whatToCheck: [
        "ചോദിച്ച എല്ലാ ചോദ്യങ്ങൾക്കും വ്യക്തമായ മറുപടി ലഭിച്ചിട്ടുണ്ടോ എന്ന് പരിശോധിക്കുക.",
        "ഔദ്യോഗിക കത്തിൽ ഡിസ്പാച്ച് നമ്പറും ഉദ്യോഗസ്ഥന്റെ ഒപ്പും ഉണ്ടെന്ന് ഉറപ്പുവരുത്തുക.",
        "വിവരങ്ങൾ അപൂർണ്ണമാണെങ്കിൽ ഒന്നാം അപ്പീൽ നൽകാനുള്ള 30 ദിവസത്തെ സമയപരിധി ശ്രദ്ധിക്കുക."
      ],
    },
    bn: {
      whatTheySaid: "জন তথ্য আধিকারিক জানিয়েছেন যে আংশিক নথি সরবরাহ করা হয়েছে এবং অবশিষ্ট তথ্য শাখা থেকে সংগ্রহ করা হচ্ছে।",
      whatItMeans: "দপ্তর আপনার আবেদন গ্রহণ করেছে এবং প্রাথমিক নথি প্রদান করেছে। অবশিষ্ট ফাইল শীঘ্রই পাঠানো হবে।",
      whatToCheck: [
        "আপনার করা সমস্ত প্রশ্নের প্রত্যয়িত উত্তর দেওয়া হয়েছে কিনা তা পরীক্ষা করুন।",
        "অফিসিয়াল চিঠিতে ডিসপ্যাচ নম্বর এবং আধিকারিকের স্বাক্ষর যাচাই করুন।",
        "তথ্য অসম্পূর্ণ থাকলে ৩০ দিন পূর্ণ হওয়ার পর প্রথম আপিল দায়ের করার তারিখ নোট করুন।"
      ],
    },
    mr: {
      whatTheySaid: "जन माहिती अधिकाऱ्यांनी कळविले आहे की उपलब्ध माहिती अंशतः पुरवण्यात आली असून उर्वरित दस्तऐवज गोळा केले जात आहेत.",
      whatItMeans: "विभागाने आपला अर्ज स्वीकारला असून प्राथमिक माहिती दिली आहे. उर्वरित माहिती लवकरच पाठवली जाईल.",
      whatToCheck: [
        "विचारलेल्या सर्व मुद्द्यांची प्रमाणित उत्तरे मिळाली आहेत का ते तपासा.",
        "शासकीय पत्रावर जावक क्रमांक (Dispatch No) व अधिकाऱ्याची स्वाक्षरी तपासा.",
        "माहिती अपूर्ण असल्यास प्रथम अपील दाखल करण्यासाठी ३० दिवसांची मुदत लक्षात ठेवा."
      ],
    },
  };

  return dict[l] || dict.en;
}
