export type Lang = "en" | "ta" | "hi" | "te" | "kn" | "ml" | "bn" | "mr";

export type Suitability = "likely" | "maybe" | "unlikely";

export interface UnderstandResult {
  topic: string;
  goal: "request_information" | "request_action";
  summary: string;
  rti_suitability: Suitability;
  suitability_reason: string;
  confidence: number;
  source: "ai" | "fallback";
}

export interface RtiQuestion {
  id: string;
  text: string;
}

export interface Authority {
  id: string;
  name: string;
  department: string;
  matchedFor: string[];
  whyMatch: string;
}

export type RequestStatus =
  | "DRAFT"
  | "READY_FOR_SUBMISSION"
  | "SUBMITTED"
  | "RECEIVED"
  | "UNDER_REVIEW"
  | "TRANSFERRED"
  | "RESPONSE_RECEIVED"
  | "APPEAL_FILED"
  | "APPEAL_UNDER_REVIEW"
  | "APPEAL_DISPOSED";

export interface StatusEvent {
  status: RequestStatus;
  date: string;
  label: string;
}

export type AppealGround =
  | "no_response"
  | "incomplete"
  | "rejected"
  | "unreasonable_fee";

export interface FirstAppealData {
  appealId: string;
  originalRequestId: string;
  ground: AppealGround;
  groundLabel: string;
  facts: string;
  prayer: string;
  filedDate: string;
  faaName: string;
  faaDesignation: string;
  feePaid: number;
  status: "APPEAL_FILED" | "APPEAL_UNDER_REVIEW" | "APPEAL_DISPOSED";
}

export interface RtiRequest {
  id: string;
  rawProblem: string;
  understanding: UnderstandResult;
  questions: RtiQuestion[];
  authority: Authority;
  createdAt: string;
  statusHistory: StatusEvent[];
  currentStatus: RequestStatus;
  firstAppeal?: FirstAppealData;
}

export interface MockResponse {
  whatTheySaid: string;
  whatItMeans: string;
  whatToCheck: string[];
}

export type IdVerificationMethod = "digilocker" | "aadhaar_otp" | "pan_otp" | "camera_doc";

export interface Draft {
  rawProblem: string;
  understanding: UnderstandResult | null;
  questions: RtiQuestion[];
  authority: Authority | null;
}

