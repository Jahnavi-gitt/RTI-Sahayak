# RTI Sahayak

> "You don't need to understand the bureaucracy first. Just tell us what happened."

An independent hackathon prototype built to make India's Right to Information (RTI) process simple, accessible, and completely human-friendly for citizens who don't speak legalese.

---

### The Problem
Most public service portals are structured around departments, complex legal sections, and official jargon. If your scholarship or pension is late, you shouldn't have to figure out which municipal ward or sub-department handles it, nor should you need a lawyer to draft the query.

### The Solution
RTI Sahayak lets citizens explain their issue in their own words. The application translates the complaint into a structured request, matches it to the correct public authority, and generates clear, editable information requests.

---

## Key Features We Built / Polished

### 1. Onboarding & Demo Authentication (PIN + 2FA)
- A clean demo signup and login flow.
- Simulates phone verification (OTP: `123456`) and secures account access with a 6-digit PIN.
- Uses native browser WebCrypto API (`SHA-256`) to hash PINs securely, falling back to a deterministic string hash on non-secure connections (e.g. testing on mobile over local network IP addresses) to prevent browser crashes.

### 2. Citizen Request Dashboard
- A dedicated homepage displaying active requests, responses received, and items requiring action.
- Prepopulated with illustrative requests (such as scholarship delays and road repair records) to showcase tracking timelines and status updates.
- Pinned bottom navigation bar for mobile viewports and a clean menu header on desktops.

### 3. Duplicate Filing Prevention
- Scans user input at the problem description stage against previous request history.
- If overlapping keywords are detected (e.g., "scholarship", "pension", "road"), the app alerts the user with a warning card: *"You may already have a request about this"* to review the active case before proceeding.

### 4. Dynamic Multilingual Support (8 Languages)
- Dynamic, end-to-end localization supporting **English, Hindi (हिन्दी), Tamil (தமிழ்), Telugu (తెలుగు), Kannada (ಕನ್ನಡ), Malayalam (മലയാളം), Bengali (বাংলা), and Marathi (मराठी)**.
- Persists chosen language throughout the entire user journey without repeated selector prompts.
- Translates everything including error modals, validation warnings, placeholder prompts, and dynamic AI output fallbacks.

### 5. Assisted Touch-Assist Kiosk Mode
- A kiosk experience designed for public setups.
- **Explain Voice Guidance:** The `🔊 Explain` button uses native Web Speech Synthesis, mapping correct voices (like `hi-IN` for Hindi, `ta-IN` for Tamil) to speak contextual assistance (What is this, what to do, what happens next) rather than just reading button labels.
- **Session Isolation:** Automatically wipes all cached states, drafts, documents, and credentials upon timeout (75s warning, 90s reset) or clicking **Finish** to protect public citizen privacy.

### 6. Document Attachments & Upload Limits
- Integrates a mock DigiLocker document grid that skips repeated verification prompts once identity is established.
- Enforces strict 5 MB file size and PDF-only validation constraints on manual uploads, showing user-friendly warning details.

---

## Project Structure
```
rti-sahayak/
├── src/                      # React + Vite + TypeScript frontend
│   ├── pages/                # Pages (Dashboard, Auth, Kiosk, Onboarding)
│   ├── components/           # Pinned Shell layouts, buttons, Voice capture
│   ├── context/              # AppContext state (history, language, auth)
│   ├── services/ai.ts        # AI backend handlers with client fallback hooks
│   ├── mock/engine.ts        # Deterministic multilingual mock engine
│   ├── i18n/strings.ts       # Localization dictionaries
│   └── utils/security.ts     # PIN hashing and formatting utils
├── backend/                  # FastAPI backend (optional, handles real OpenAI calls)
│   ├── app/main.py           # FastAPI routes & CORS
│   └── app/ai.py             # OpenAI completions engine
└── README.md                 # This file
```

---

## Running Locally

### Frontend Only (Runs completely standalone with built-in mock fallback)
```bash
npm install
npm run dev
```
Open `http://localhost:5173`. You can test the full primary journey offline or without configuration. 
- To test the portal login, use pre-filled credentials: **Phone: `9876543210`, PIN: `123456`**.

### Testing on Mobile/Phones
To access the application on your phone over your local Wi-Fi network, start the server exposing local network hosts:
```bash
npm run dev -- --host
```
Open the network link printed by the terminal (e.g. `http://<your-laptop-ip>:5173`) in your mobile browser.

---

*Disclaimer: This is an independent hackathon prototype. It is NOT connected to the Government of India or any public department. All submissions, payments, identity checks, and timelines are fully simulated.*
