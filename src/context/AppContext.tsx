import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Authority, Lang, RtiQuestion, RtiRequest, UnderstandResult } from "../types";

interface Draft {
  rawProblem: string;
  understanding: UnderstandResult | null;
  questions: RtiQuestion[];
  authority: Authority | null;
}

interface AppState {
  lang: Lang;
  setLang: (l: Lang) => void;
  draft: Draft;
  updateDraft: (patch: Partial<Draft>) => void;
  resetDraft: () => void;
  requests: RtiRequest[];
  addRequest: (r: RtiRequest) => void;
  largeText: boolean;
  setLargeText: (v: boolean) => void;
  verified: boolean;
  setVerified: (v: boolean) => void;
  verificationMethod: "digilocker" | "gov_id" | null;
  setVerificationMethod: (m: "digilocker" | "gov_id" | null) => void;
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
      { id: "q1", text: "Please provide the current processing status of my scholarship application." },
      { id: "q2", text: "Please provide the scheduled release date for the scholarship amount." }
    ],
    authority: {
      id: "edu",
      name: "Department of Higher Education",
      department: "Education",
      matchedFor: ["scholarship"],
      whyMatch: "Handles scholarship approvals"
    },
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    statusHistory: [
      { status: "SUBMITTED", date: "28 Aug 2026", label: "Submitted" },
      { status: "RECEIVED", date: "28 Aug 2026", label: "Received" },
      { status: "UNDER_REVIEW", date: "29 Aug 2026", label: "Under review" }
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
      { id: "q1", text: "Please provide copies of the repair contract and road maintenance reports for Main Road." }
    ],
    authority: {
      id: "mun",
      name: "Municipal Authority Office",
      department: "Municipal",
      matchedFor: ["road", "garbage"],
      whyMatch: "Responsible for local civic services"
    },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    statusHistory: [
      { status: "SUBMITTED", date: "23 Aug 2026", label: "Submitted" },
      { status: "RECEIVED", date: "24 Aug 2026", label: "Received" },
      { status: "UNDER_REVIEW", date: "24 Aug 2026", label: "Under review" },
      { status: "RESPONSE_RECEIVED", date: "27 Aug 2026", label: "Response received" }
    ],
    currentStatus: "RESPONSE_RECEIVED"
  }
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [requests, setRequests] = useState<RtiRequest[]>(initialRequests);
  const [largeText, setLargeText] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<"digilocker" | "gov_id" | null>(null);
  const [attachedDocs, setAttachedDocs] = useState<string[]>([]);
  const [documentsConnected, setDocumentsConnected] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<{ phone: string; name: string } | null>(null);
  const [userPinHash, setUserPinHash] = useState<string | null>(null);

  const value = useMemo<AppState>(
    () => ({
      lang,
      setLang,
      draft,
      updateDraft: (patch) => setDraft((d) => ({ ...d, ...patch })),
      resetDraft: () => {
        setDraft(emptyDraft);
        setAttachedDocs([]);
        setDocumentsConnected(false);
      },
      requests,
      addRequest: (r) => setRequests((rs) => [r, ...rs]),
      largeText,
      setLargeText,
      verified,
      setVerified,
      verificationMethod,
      setVerificationMethod,
      attachedDocs,
      setAttachedDocs,
      documentsConnected,
      setDocumentsConnected,
      
      // Authentication
      currentUser,
      setCurrentUser,
      userPinHash,
      setUserPinHash,
      resetAuth: () => {
        setCurrentUser(null);
        setUserPinHash(null);
        setVerified(false);
        setVerificationMethod(null);
        setAttachedDocs([]);
        setDocumentsConnected(false);
      }
    }),
    [lang, draft, requests, largeText, verified, verificationMethod, attachedDocs, documentsConnected, currentUser, userPinHash]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
