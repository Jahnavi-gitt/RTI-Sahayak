import type { Lang, RtiRequest } from "../types";
import { getLocalizedDepartmentName } from "../data/departments";

// PDF Label Dictionary for 100% Localized Receipts in all 8 Indian Languages
const PDF_LABELS: Record<Lang, Record<string, string>> = {
  en: {
    title: "RTI SAHAYAK — APPLICATION RECEIPT",
    subtitle: "Independent Prototype • Demonstration Acknowledgment Receipt",
    statusBadge: "✓ VERIFIED RTI FILING (DEMO)",
    sec7Notice: "STATUTORY NOTICE (Section 7(1) of RTI Act, 2005):",
    sec7Text: "By law, the Public Information Officer (PIO) is required to provide the requested information within 30 days of receipt. If no response is received, you are entitled to file a First Appeal under Section 19(1).",
    appId: "Application Reference ID:",
    submissionDate: "Date & Time of Filing:",
    applicant: "Applicant Details:",
    applicantVal: "Verified Indian Citizen",
    authority: "Public Authority:",
    department: "Department / Wing:",
    feePaid: "Application Fee Paid:",
    feeVal: "₹10.00 (Standard RTI Fee — Simulated)",
    paymentStatus: "Payment Status:",
    paymentVal: "SUCCESS / VERIFIED",
    questionsTitle: "INFORMATION REQUESTED (RTI QUESTIONS):",
    trackingTitle: "HOW TO TRACK YOUR APPLICATION:",
    trackingText: "Visit RTI Sahayak dashboard and enter your Application Reference ID to view live progress.",
    disclaimer: "Note: This is a hackathon prototype receipt for demonstration purposes."
  },
  hi: {
    title: "आरटीआई सहायक — आवेदन पावती",
    subtitle: "स्वतंत्र प्रोटोटाइप • गैर-सरकारी डेमो रसीद",
    statusBadge: "✓ सत्यापित आरटीआई आवेदन (डेमो)",
    sec7Notice: "वैधानिक सूचना (आरटीआई अधिनियम २००५ की धारा ७(१)):",
    sec7Text: "कानूनन, जन सूचना अधिकारी (PIO) को प्राप्ति के ३० दिनों के भीतर मांगी गई सूचना उपलब्ध कराना अनिवार्य है। उत्तर न मिलने पर आप धारा १९(१) के तहत प्रथम अपील दायर कर सकते हैं।",
    appId: "आवेदन संदर्भ संख्या (ID):",
    submissionDate: "दाखिल करने की तिथि व समय:",
    applicant: "आवेदक का विवरण:",
    applicantVal: "सत्यापित भारतीय नागरिक",
    authority: "सार्वजनिक प्राधिकरण:",
    department: "विभाग / शाखा:",
    feePaid: "जमा किया गया शुल्क:",
    feeVal: "₹१०.०० (मानक आरटीआई शुल्क — सिमुलेटेड)",
    paymentStatus: "भुगतान स्थिति:",
    paymentVal: "सफल एवं सत्यापित",
    questionsTitle: "मांगी गई जानकारी (आरटीआई प्रश्न):",
    trackingTitle: "आवेदन की स्थिति कैसे ट्रैक करें:",
    trackingText: "आरटीआई सहायक डैशबोर्ड पर जाएं और लाइव प्रगति देखने के लिए अपनी संदर्भ संख्या दर्ज करें।",
    disclaimer: "नोट: यह एक हैकथॉन प्रोटोटाइप रसीद है जो केवल प्रदर्शन उद्देश्यों के लिए है।"
  },
  te: {
    title: "ఆర్టీఐ సహాయక్ — దరఖాస్తు రశీదు",
    subtitle: "స్వతంత్ర నమూనా • డెమో గుర్తింపు రశీదు",
    statusBadge: "✓ ధృవీకరించబడిన ఆర్టీఐ దరఖాస్తు (డెమో)",
    sec7Notice: "చట్టబద్ధమైన సమాచారం (సమాచార హక్కు చట్టం 2005 సెక్షన్ 7(1)):",
    sec7Text: "చట్టప్రకారం, ప్రజా సమాచార అధికారి (PIO) దరఖాస్తు అందిన 30 రోజుల్లోగా కోరిన సమాచారాన్ని అందించాలి. సమాధానం రాని పక్షంలో సెక్షన్ 19(1) ప్రకారం మొదటి అప్పీల్ దాఖలు చేయవచ్చు.",
    appId: "దరఖాస్తు రిఫరెన్స్ ఐడీ (ID):",
    submissionDate: "దాఖలు చేసిన తేదీ మరియు సమయం:",
    applicant: "దరఖాస్తుదారు వివరాలు:",
    applicantVal: "ధృవీకరించబడిన భారతీయ పౌరుడు",
    authority: "ప్రజా ప్రాధికార సంస్థ (Authority):",
    department: "ప్రభుత్వ శాఖ / విభాగం:",
    feePaid: "చెల్లించిన దరఖాస్తు రుసుము:",
    feeVal: "₹10.00 (ప్రామాణిక ఆర్టీఐ రుసుము — సిమ్యులేషన్)",
    paymentStatus: "చెల్లింపు స్థితి:",
    paymentVal: "విజయవంతమైంది / ధృవీకరించబడింది",
    questionsTitle: "కోరిన సమాచారం (ఆర్టీఐ ప్రశ్నలు):",
    trackingTitle: "దరఖాస్తును ఎలా ట్రాక్ చేయాలి:",
    trackingText: "ఆర్టీఐ సహాయక్ డ్యాష్‌బోర్డ్‌ను సందర్శించి మీ రిఫరెన్స్ ఐడీని నమోదు చేయడం ద్వారా పురోగతిని చూడవచ్చు.",
    disclaimer: "గమనిక: ఇది హ్యాకథాన్ ప్రదర్శన ప్రయోజనాల కోసం రూపొందించబడిన డెమో రశీదు."
  },
  ta: {
    title: "ஆர்டிஐ சஹாயக் — விண்ணப்ப ரசீது",
    subtitle: "சுயாதீன மாதிரி • டெமோ ஏற்பு ரசீது",
    statusBadge: "✓ சரிபார்க்கப்பட்ட ஆர்டிஐ விண்ணப்பம் (டெமோ)",
    sec7Notice: "சட்டப்பூர்வ அறிவிப்பு (ஆர்டிஐ சட்டம் 2005 பிரிவு 7(1)):",
    sec7Text: "சட்டப்படி, பொது தகவல் அதிகாரி (PIO) விண்ணப்பம் கிடைத்த 30 நாட்களுக்குள் தகவலை வழங்க வேண்டும். பதில் வராவிட்டால் பிரிவு 19(1) கீழ் முதல் மேல்முறையீடு செய்யலாம்.",
    appId: "விண்ணப்ப குறிப்பு எண் (ID):",
    submissionDate: "தாக்கல் செய்த தேதி & நேரம்:",
    applicant: "விண்ணப்பதாரர் விவரங்கள்:",
    applicantVal: "சரிபார்க்கப்பட்ட இந்திய குடிமகன்",
    authority: "பொது அதிகாரம் (Authority):",
    department: "அரசுத் துறை / பிரிவு:",
    feePaid: "செலுத்தப்பட்ட கட்டணம்:",
    feeVal: "₹10.00 (ஆர்டிஐ கட்டணம் — டெமோ)",
    paymentStatus: "கட்டண நிலை:",
    paymentVal: "வெற்றிகரமானது / சரிபார்க்கப்பட்டது",
    questionsTitle: "கோரப்பட்ட தகவல் (ஆர்டிஐ கேள்விகள்):",
    trackingTitle: "விண்ணப்பத்தை எவ்வாறு கண்காணிப்பது:",
    trackingText: "நேரடி நிலையைக் காண ஆர்டிஐ சஹாயக் டாஷ்போர்டில் உங்கள் குறிப்பு எண்ணை உள்ளிடவும்.",
    disclaimer: "குறிப்பு: இது ஹேக்கத்தான் செயல்முறை விளக்கத்திற்கான டெமோ ரசீது."
  },
  kn: {
    title: "ಆರ್ಟಿಐ ಸಹಾಯಕ — ಅರ್ಜಿ ರಶೀದಿ",
    subtitle: "ಸ್ವತಂತ್ರ ಮಾದರಿ • ಡೆಮೊ ಸ್ವೀಕೃತಿ ರಶೀದಿ",
    statusBadge: "✓ ಪರಿಶೀಲಿಸಿದ ಆರ್ಟಿಐ ಸಲ್ಲಿಕೆ (ಡೆಮೊ)",
    sec7Notice: "ಶಾಸನಬದ್ಧ ಸೂಚನೆ (ಆರ್ಟಿಐ ಕಾಯ್ದೆ 2005 ರ ಕಲಂ 7(1)):",
    sec7Text: "ಕಾನೂನಿನ ಪ್ರಕಾರ, ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ ಅಧಿಕಾರಿಯು 30 ದಿನಗಳಲ್ಲಿ ಮಾಹಿತಿಯನ್ನು ಒದಗಿಸಬೇಕು. ಉತ್ತರ ಬಾರದಿದ್ದರೆ ಕಲಂ 19(1) ರ ಅಡಿಯಲ್ಲಿ ಮೊದಲ ಮೇಲ್ಮನವಿ ಸಲ್ಲಿಸಬಹುದು.",
    appId: "ಅರ್ಜಿ ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ (ID):",
    submissionDate: "ಸಲ್ಲಿಸಿದ ದಿನಾಂಕ ಮತ್ತು ಸಮಯ:",
    applicant: "ಅರ್ಜಿದಾರರ ವಿವರಗಳು:",
    applicantVal: "ಪರಿಶೀಲಿಸಿದ ಭಾರತೀಯ ನಾಗರಿಕ",
    authority: "ಸಾರ್ವಜನಿಕ ಪ್ರಾಧಿಕಾರ:",
    department: "ಸರ್ಕಾರಿ ಇಲಾಖೆ / ಶಾಖೆ:",
    feePaid: "ಪಾವತಿಸಿದ ಅರ್ಜಿ ಶುಲ್ಕ:",
    feeVal: "₹10.00 (ಆರ್ಟಿಐ ಶುಲ್ಕ — ಸಿಮ್ಯುಲೇಟೆಡ್)",
    paymentStatus: "ಪಾವತಿ ಸ್ಥಿತಿ:",
    paymentVal: "ಯಶಸ್ವಿ ಮತ್ತು ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
    questionsTitle: "ಕೋರಿದ ಮಾಹಿತಿ (ಆರ್ಟಿಐ ಪ್ರಶ್ನೆಗಳು):",
    trackingTitle: "ಅರ್ಜಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡುವುದು ಹೇಗೆ:",
    trackingText: "ನೇರ ಪ್ರಗತಿಯನ್ನು ನೋಡಲು ಆರ್ಟಿಐ ಸಹಾಯಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ನಿಮ್ಮ ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ.",
    disclaimer: "ಗಮನಿಸಿ: ಇದು ಹ್ಯಾಕಥಾನ್ ಪ್ರಾತ್ಯಕ್ಷಿಕೆಗಾಗಿ ಸಿದ್ಧಪಡಿಸಿದ ಡೆಮೊ ರಶೀದಿಯಾಗಿದೆ."
  },
  ml: {
    title: "ആർ.ടി.ഐ സഹായക് — അപേക്ഷാ രസീത്",
    subtitle: "സ്വതന്ത്ര പ്രോട്ടോടൈപ്പ് • ഡെമോ അക്നോളജ്‌മെന്റ് രസീത്",
    statusBadge: "✓ സ്ഥിരീകരിച്ച ആർടിഐ അപേക്ഷ (ഡെമോ)",
    sec7Notice: "നിയമപരമായ അറിയിപ്പ് (ആർടിഐ നിയമം 2005 സെക്ഷൻ 7(1)):",
    sec7Text: "നിയമപ്രകാരം, പബ്ലിക് ഇൻഫർമേഷൻ ഓഫീസർ 30 ദിവസത്തിനകം വിവരം നൽകണം. മറുപടി ലഭിച്ചില്ലെങ്കിൽ സെക്ഷൻ 19(1) പ്രകാരം ഒന്നാം അപ്പീൽ നൽകാം.",
    appId: "അപേക്ഷാ റഫറൻസ് ഐഡി (ID):",
    submissionDate: "സമർപ്പിച്ച തീയതിയും സമയവും:",
    applicant: "അപേക്ഷകന്റെ വിവരങ്ങൾ:",
    applicantVal: "സ്ഥിരീകരിച്ച ഇന്ത്യൻ പൗരൻ",
    authority: "പബ്ലിക് അതോറിറ്റി:",
    department: "സർക്കാർ വകുപ്പ് / വിഭാഗം:",
    feePaid: "അടച്ച അപേക്ഷാ ഫീസ്:",
    feeVal: "₹10.00 (ആർടിഐ ഫീസ് — സിമുലേഷൻ)",
    paymentStatus: "പേയ്‌മെന്റ് നില:",
    paymentVal: "വിജയകരമായി പൂർത്തിയായി",
    questionsTitle: "ആവശ്യപ്പെട്ട വിവരങ്ങൾ (ആർടിഐ ചോദ്യങ്ങൾ):",
    trackingTitle: "അപേക്ഷ എങ്ങനെ ട്രാക്ക് ചെയ്യാം:",
    trackingText: "തത്സമയ വിവരങ്ങൾ അറിയാൻ ആർടിഐ സഹായക് ഡാഷ്‌ബോർഡിൽ റഫറൻസ് ഐഡി നൽകുക.",
    disclaimer: "ശ്രദ്ധിക്കുക: ഇത് ഒരു ഹാക്കത്തോൺ ഡെമോൺസ്ട്രേഷൻ രസീതാണ്."
  },
  bn: {
    title: "আরটিআই সহায়ক — আবেদন রসিদ",
    subtitle: "স্বাধীন প্রোটোটাইপ • ডেমো স্বীকৃতি রসিদ",
    statusBadge: "✓ যাচাইকৃত আরটিআই আবেদন (ডেমো)",
    sec7Notice: "সংবিধিবদ্ধ বিজ্ঞপ্তি (আরটিআই আইন ২০০৫-এর ধারা ৭(১)):",
    sec7Text: "আইনানুযায়ী, জনতথ্য আধিকারিককে ৩০ দিনের মধ্যে তথ্য প্রদান করতে হবে। উত্তর না পেলে ধারা ১৯(১)-এর অধীনে প্রথম আপিল দায়ের করতে পারেন।",
    appId: "আবেদন রেফারেন্স আইডি (ID):",
    submissionDate: "দাখিলের তারিখ ও সময়:",
    applicant: "আবেদনকারীর বিবরণ:",
    applicantVal: "যাচাইকৃত ভারতীয় নাগরিক",
    authority: "সরকারি কর্তৃপক্ষ:",
    department: "দপ্তর / শাখা:",
    feePaid: "প্রদত্ত আবেদন ফি:",
    feeVal: "₹১০.০০ (আরটিআই ফি — ডেমো)",
    paymentStatus: "পেমেন্ট স্থিতি:",
    paymentVal: "সফল ও যাচাইকৃত",
    questionsTitle: "অনুরোধকৃত তথ্য (আরটিআই প্রশ্নাবলী):",
    trackingTitle: "আবেদন কিভাবে ট্র্যাক করবেন:",
    trackingText: "লাইভ অগ্রগতি দেখতে আরটিআই সহায়ক ড্যাশবোর্ডে আপনার রেফারেন্স নম্বর লিখুন।",
    disclaimer: "দ্রষ্টব্য: এটি একটি হ্যাকাথন প্রদর্শনীমূলক ডেমো রসিদ।"
  },
  mr: {
    title: "आरटीआय सहाय्यक — अर्ज पावती",
    subtitle: "स्वतंत्र प्रोटोटाइप • डेमो पोच पावती",
    statusBadge: "✓ पडताळणी झालेला आरटीआय अर्ज (डेमो)",
    sec7Notice: "वैधानिक सूचना (माहिती अधिकार अधिनियम २००५ चे कलम ७(१)):",
    sec7Text: "कायद्यानुसार, जन माहिती अधिकाऱ्याने अर्ज मिळाल्यापासून ३० दिवसांत माहिती देणे बंधनकारक आहे. उत्तर न मिळाल्यास आपण कलम १९(१) नुसार पहिले अपील करू शकता.",
    appId: "अर्ज संदर्भ क्रमांक (ID):",
    submissionDate: "दाखल केल्याची तारीख व वेळ:",
    applicant: "अर्जदाराचा तपशील:",
    applicantVal: "पडताळणी झालेला भारतीय नागरिक",
    authority: "सार्वजनिक प्राधिकरण:",
    department: "शासकीय विभाग / शाखा:",
    feePaid: "भरलेले अर्ज शुल्क:",
    feeVal: "₹१०.०० (मानक आरटीआय शुल्क — सिमुलेशन)",
    paymentStatus: "पेमेंट स्थिती:",
    paymentVal: "यशस्वी व पडताळणी झाली",
    questionsTitle: "मागितलेली माहिती (आरटीआय प्रश्न):",
    trackingTitle: "अर्जाची स्थिती कशी ट्रॅक करावी:",
    trackingText: "थेट प्रगती पाहण्यासाठी आरटीआय सहाय्यक डॅशबोर्डवर तुमचा संदर्भ क्रमांक टाका.",
    disclaimer: "टीप: ही केवळ सादरीकरणासाठी तयार केलेली हॅकाथॉन डेमो पावती आहे."
  }
};

/**
 * Renders a high-resolution, pixel-perfect A4 canvas with native browser complex script shaping
 * for Telugu, Hindi, Tamil, Kannada, Malayalam, Bengali, Marathi, and English.
 */
function renderReceiptToCanvas(request: RtiRequest, lang: Lang, citizenName: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  // A4 aspect ratio at 180 DPI (1485 x 2100 px) for crisp text and print fidelity
  const width = 1485;
  const height = 2100;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const labels = PDF_LABELS[lang] || PDF_LABELS.en;

  // Background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  // Border outline
  ctx.strokeStyle = "#0D6B6B";
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 30, width - 60, height - 60);

  // Inner border
  ctx.strokeStyle = "#E6F4F1";
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  // Header band (Teal)
  ctx.fillStyle = "#0B5D5D";
  ctx.fillRect(45, 45, width - 90, 190);

  // Header Title
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 44px 'Segoe UI', Roboto, 'Noto Sans', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(labels.title, 80, 115);

  // Header Subtitle
  ctx.fillStyle = "#A3E0D8";
  ctx.font = "22px 'Segoe UI', Roboto, 'Noto Sans', sans-serif";
  ctx.fillText(labels.subtitle, 80, 155);

  // Top Verified Badge
  ctx.fillStyle = "#E5A000";
  ctx.fillRect(80, 180, 340, 34);
  ctx.fillStyle = "#112F2E";
  ctx.font = "bold 17px 'Segoe UI', Roboto, 'Noto Sans', sans-serif";
  ctx.fillText(labels.statusBadge, 95, 203);

  // Date Formatting
  const reqDate = new Date(request.createdAt || Date.now());
  const dateStr = reqDate.toLocaleDateString(lang === "en" ? "en-IN" : "en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }) + " • " + reqDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  let y = 280;

  // Metadata Table Box
  ctx.fillStyle = "#F6FBF9";
  ctx.fillRect(70, y, width - 140, 300);
  ctx.strokeStyle = "#BCE3DC";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(70, y, width - 140, 300);

  // Table rows
  const metaRows: [string, string][] = [
    [labels.appId, request.id || "RTI-2026-DEMO-001"],
    [labels.submissionDate, dateStr],
    [labels.applicant, citizenName || labels.applicantVal],
    [labels.authority, getLocalizedDepartmentName(request.authority, lang)],
    [labels.department, request.authority?.department || labels.applicantVal],
    [labels.feePaid, labels.feeVal],
  ];

  ctx.font = "bold 22px 'Segoe UI', Roboto, 'Noto Sans', sans-serif";
  const labelX = 100;
  const valX = 520;
  let rowY = y + 42;

  metaRows.forEach(([lbl, val]) => {
    ctx.fillStyle = "#0B5D5D";
    ctx.font = "bold 21px 'Segoe UI', Roboto, 'Noto Sans', sans-serif";
    ctx.fillText(lbl, labelX, rowY);

    ctx.fillStyle = "#1E293B";
    ctx.font = "500 21px 'Segoe UI', Roboto, 'Noto Sans', sans-serif";
    // Truncate long value if necessary
    const displayVal = val.length > 60 ? val.slice(0, 58) + "…" : val;
    ctx.fillText(displayVal, valX, rowY);

    rowY += 46;
  });

  y += 340;

  // Section: Information Requested Header
  ctx.fillStyle = "#0B5D5D";
  ctx.fillRect(70, y, width - 140, 48);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 22px 'Segoe UI', Roboto, 'Noto Sans', sans-serif";
  ctx.fillText(labels.questionsTitle, 90, y + 33);

  y += 75;

  // Formulated RTI Questions List
  const qs = request.questions && request.questions.length > 0
    ? request.questions
    : [
        { id: "q1", text: "Please provide the certified daily processing status of my application." },
        { id: "q2", text: "Please provide the dates on which my file was processed at each stage." },
        { id: "q3", text: "Please provide the name and designation of the officer currently handling this matter." },
        { id: "q4", text: "Please provide the official recorded reason for any delay in disbursement." }
      ];

  qs.forEach((q, idx) => {
    // Question number circle
    ctx.fillStyle = "#E5A000";
    ctx.beginPath();
    ctx.arc(100, y + 14, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#112F2E";
    ctx.font = "bold 20px 'Segoe UI', Roboto, 'Noto Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(idx + 1), 100, y + 21);
    ctx.textAlign = "left";

    // Question Text with word-wrap
    ctx.fillStyle = "#1E293B";
    ctx.font = "500 22px 'Segoe UI', Roboto, 'Noto Sans', sans-serif";
    
    const words = q.text.split(" ");
    let line = "";
    const maxWidth = width - 240;
    const textStartX = 135;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, textStartX, y + 20);
        line = words[i] + " ";
        y += 32;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, textStartX, y + 20);
    y += 55;
  });

  // Statutory Timeline Box (Section 7(1) Notice)
  y = Math.max(y + 20, 1420);
  ctx.fillStyle = "#FEF9E7";
  ctx.fillRect(70, y, width - 140, 150);
  ctx.strokeStyle = "#F3CA68";
  ctx.lineWidth = 2;
  ctx.strokeRect(70, y, width - 140, 150);

  ctx.fillStyle = "#996500";
  ctx.font = "bold 20px 'Segoe UI', Roboto, 'Noto Sans', sans-serif";
  ctx.fillText(labels.sec7Notice, 100, y + 40);

  ctx.fillStyle = "#4B3600";
  ctx.font = "500 19px 'Segoe UI', Roboto, 'Noto Sans', sans-serif";
  
  // Wrap sec7 text
  const secWords = labels.sec7Text.split(" ");
  let secLine = "";
  let secY = y + 74;
  for (let i = 0; i < secWords.length; i++) {
    const testLine = secLine + secWords[i] + " ";
    if (ctx.measureText(testLine).width > (width - 240) && i > 0) {
      ctx.fillText(secLine, 100, secY);
      secLine = secWords[i] + " ";
      secY += 28;
    } else {
      secLine = testLine;
    }
  }
  ctx.fillText(secLine, 100, secY);

  // Tracking Guide Footer
  y += 180;
  ctx.fillStyle = "#F0F9F8";
  ctx.fillRect(70, y, width - 140, 110);
  ctx.strokeStyle = "#BCE3DC";
  ctx.lineWidth = 1;
  ctx.strokeRect(70, y, width - 140, 110);

  ctx.fillStyle = "#0B5D5D";
  ctx.font = "bold 19px 'Segoe UI', Roboto, 'Noto Sans', sans-serif";
  ctx.fillText(labels.trackingTitle, 100, y + 38);

  ctx.fillStyle = "#475569";
  ctx.font = "18px 'Segoe UI', Roboto, 'Noto Sans', sans-serif";
  ctx.fillText(labels.trackingText, 100, y + 74);

  // Bottom Disclaimer
  ctx.fillStyle = "#94A3B8";
  ctx.font = "italic 16px 'Segoe UI', Roboto, 'Noto Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(labels.disclaimer, width / 2, height - 60);

  return canvas;
}

/**
 * Pure binary PDF-1.4 builder that embeds the high-resolution multi-script canvas image
 * directly into a standard vector A4 PDF page.
 * Guarantees zero "???" or broken glyphs across all 8 Indian languages.
 */
export function generateReceiptPdfBlob(request: RtiRequest, lang: Lang = "en", citizenName: string = "Citizen User"): Blob {
  const canvas = renderReceiptToCanvas(request, lang, citizenName);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
  const base64Data = dataUrl.split(",")[1];
  const binaryImg = atob(base64Data);
  const imgLength = binaryImg.length;

  const pdfWidth = 595.28;  // A4 width in pt
  const pdfHeight = 841.89; // A4 height in pt

  const header = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";

  const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfWidth} ${pdfHeight}] /Contents 4 0 R /Resources << /XObject << /Img1 5 0 R >> >> >>\nendobj\n`;
  
  const contentStream = `q\n${pdfWidth} 0 0 ${pdfHeight} 0 0 cm\n/Img1 Do\nQ\n`;
  const obj4 = `4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`;

  const obj5Header = `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgLength} >>\nstream\n`;
  const obj5Footer = "\nendstream\nendobj\n";

  // Calculate byte offsets for xref table
  let currentOffset = header.length;
  const offset1 = currentOffset;
  currentOffset += obj1.length;
  const offset2 = currentOffset;
  currentOffset += obj2.length;
  const offset3 = currentOffset;
  currentOffset += obj3.length;
  const offset4 = currentOffset;
  currentOffset += obj4.length;
  const offset5 = currentOffset;

  const imgUint8 = new Uint8Array(imgLength);
  for (let i = 0; i < imgLength; i++) {
    imgUint8[i] = binaryImg.charCodeAt(i);
  }

  const beforeImg = header + obj1 + obj2 + obj3 + obj4 + obj5Header;
  const totalObj5Length = obj5Header.length + imgLength + obj5Footer.length;
  const xrefOffset = header.length + obj1.length + obj2.length + obj3.length + obj4.length + totalObj5Length;

  const xref = `xref\n0 6\n0000000000 65535 f \n${String(offset1).padStart(10, "0")} 00000 n \n${String(offset2).padStart(10, "0")} 00000 n \n${String(offset3).padStart(10, "0")} 00000 n \n${String(offset4).padStart(10, "0")} 00000 n \n${String(offset5).padStart(10, "0")} 00000 n \n`;
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const beforeBytes = new TextEncoder().encode(beforeImg);
  const afterBytes = new TextEncoder().encode(obj5Footer + xref + trailer);

  const totalLength = beforeBytes.length + imgUint8.length + afterBytes.length;
  const finalPdf = new Uint8Array(totalLength);
  finalPdf.set(beforeBytes, 0);
  finalPdf.set(imgUint8, beforeBytes.length);
  finalPdf.set(afterBytes, beforeBytes.length + imgUint8.length);

  return new Blob([finalPdf], { type: "application/pdf" });
}

/**
 * Download the generated multilingual PDF receipt directly to the user's browser.
 */
export function downloadReceiptPdf(request: RtiRequest, lang: Lang = "en", citizenName: string = "Citizen User"): void {
  try {
    const blob = generateReceiptPdfBlob(request, lang, citizenName);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const reqId = request.id || "RTI-RECEIPT";
    a.download = `${reqId}-${lang.toUpperCase()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch (err) {
    console.error("Error downloading PDF receipt:", err);
  }
}
