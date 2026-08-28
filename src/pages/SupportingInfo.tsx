import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, UploadCloud, Shield, Check, AlertCircle } from "lucide-react";
import Shell from "../components/Shell";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";

type DocMode = "choice" | "digilocker_connect" | "digilocker_auth" | "digilocker_docs" | "upload" | "attached";

const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

export default function SupportingInfo() {
  const { lang, attachedDocs, setAttachedDocs, verified } = useApp();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<DocMode>(attachedDocs.length > 0 ? "attached" : "choice");
  const [selectedDigiDocs, setSelectedDigiDocs] = useState<string[]>(attachedDocs);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(
    attachedDocs.length > 0 && !attachedDocs.some(d => ["Address Proof", "Identity Proof", "Scholarship Certificate", "Income Certificate"].includes(d))
      ? { name: attachedDocs[0], size: "Attached" }
      : null
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // DigiLocker Demo Documents list
  const DIGILOCKER_DOCS = [
    "Address Proof",
    "Identity Proof",
    "Scholarship Certificate",
    "Income Certificate"
  ];

  function toggleDigiDoc(doc: string) {
    setSelectedDigiDocs((prev) =>
      prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]
    );
  }

  function handleDigiSubmit() {
    if (selectedDigiDocs.length === 0) {
      setError(t(lang, "digiDocsError"));
      return;
    }
    setError(null);
    setAttachedDocs(selectedDigiDocs);
    setMode("attached");
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploadedFile(null);

    // 1. Frontend validation
    if (file.type !== "application/pdf") {
      setError(t(lang, "verifyChooseGovIdSub")); // Fallback or PDF only notice
      return;
    }

    const sizeMb = file.size / (1024 * 1024);
    if (file.size > 5 * 1024 * 1024) {
      setError(`${t(lang, "uploadErrorTitle")} This PDF is ${sizeMb.toFixed(1)} MB. Please choose a file smaller than 5 MB.`);
      return;
    }

    // 2. Optional Backend Validation
    if (API_BASE) {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(`${API_BASE}/api/upload-validate`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json();
          setError(errData.detail || "Upload validation failed.");
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Backend validation failed, falling back to frontend check", err);
      } finally {
        setLoading(false);
      }
    }

    // Success
    setUploadedFile({
      name: file.name,
      size: `${sizeMb.toFixed(1)} MB`
    });
    setAttachedDocs([file.name]);
  }

  return (
    <Shell step="write" onBack={() => {
      if (mode === "choice") {
        navigate("/questions");
      } else {
        setMode("choice");
        setError(null);
      }
    }}>
      <div className="flex flex-col gap-5 pt-4">
        {mode === "choice" && (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h1 className="font-display text-3xl font-semibold text-teal-900 mb-2">
                {t(lang, "docsChoiceTitle")}
              </h1>
              <p className="text-sm text-ink/60">
                {t(lang, "docsChoiceSub")}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => {
                  if (verified) {
                    setMode("digilocker_docs");
                  } else {
                    setMode("digilocker_connect");
                  }
                }}
                className="w-full text-left bg-white border-2 border-teal-100 hover:border-teal-500 rounded-card p-5 flex items-start gap-4 shadow-card transition-colors min-h-[96px]"
              >
                <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 shrink-0">
                  <Shield size={24} />
                </div>
                <div>
                  <span className="font-semibold text-lg text-ink block">{t(lang, "docsChoiceDigiLocker")}</span>
                  <span className="text-xs text-ink/65">{t(lang, "docsChoiceDigiLockerSub")}</span>
                </div>
              </button>

              <button
                onClick={() => setMode("upload")}
                className="w-full text-left bg-white border-2 border-teal-100 hover:border-teal-500 rounded-card p-5 flex items-start gap-4 shadow-card transition-colors min-h-[96px]"
              >
                <div className="w-12 h-12 rounded-full bg-marigold-100 flex items-center justify-center text-marigold-600 shrink-0">
                  <UploadCloud size={24} />
                </div>
                <div>
                  <span className="font-semibold text-lg text-ink block">{t(lang, "docsChoiceUpload")}</span>
                  <span className="text-xs text-ink/65">{t(lang, "docsChoiceUploadSub")}</span>
                </div>
              </button>
            </div>

            <Button full variant="ghost" onClick={() => navigate("/authority")}>
              {t(lang, "skip")}
            </Button>
          </div>
        )}

        {mode === "digilocker_connect" && (
          <div className="flex flex-col gap-6 max-w-md mx-auto text-center items-center">
            <div className="font-display font-bold text-teal-600 text-3xl">DigiLocker</div>
            <div className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {t(lang, "verifyConnectSub")}
            </div>

            <h2 className="font-display text-2xl font-semibold text-teal-900 mt-2">
              {t(lang, "verifyConnectTitle")}
            </h2>
            
            <p className="text-base text-ink/80 leading-relaxed max-w-sm">
              {t(lang, "verifyConnectBody")}
            </p>

            <div className="w-full flex flex-col gap-3 mt-4">
              <Button full onClick={() => setMode("digilocker_auth")}>
                {t(lang, "verifyConnectButton")}
              </Button>
              <Button full variant="secondary" onClick={() => setMode("choice")}>
                {t(lang, "cancel")}
              </Button>
            </div>
          </div>
        )}

        {mode === "digilocker_auth" && (
          <div className="flex flex-col gap-6 max-w-md mx-auto">
            <div className="text-center">
              <div className="font-display font-bold text-teal-600 text-2xl mb-1">DigiLocker Demo</div>
              <h2 className="font-display text-2xl font-semibold text-teal-900">{t(lang, "verifyChooseTitle")}</h2>
            </div>

            <div className="bg-white border-2 border-teal-100 rounded-card p-5 space-y-4 shadow-card">
              <p className="text-sm font-semibold text-ink">{t(lang, "verifyChooseSub")}</p>
              <ul className="space-y-2 text-sm text-ink/80">
                <li className="flex items-center gap-2 font-medium">
                  <span className="text-leaf"><Check size={16} strokeWidth={3} /></span> Identity document
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <span className="text-leaf"><Check size={16} strokeWidth={3} /></span> Address document
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <span className="text-leaf"><Check size={16} strokeWidth={3} /></span> Supporting certificate
                </li>
              </ul>
              <p className="text-xs text-ink/60 border-t border-teal-50 pt-3 italic">
                {t(lang, "verifyStatusDisclaimer")}
              </p>
            </div>

            <div className="w-full flex flex-col gap-3">
              <Button full onClick={() => setMode("digilocker_docs")}>
                {t(lang, "verifyConnectButton")}
              </Button>
              <Button full variant="secondary" onClick={() => setMode("choice")}>
                {t(lang, "cancel")}
              </Button>
            </div>
          </div>
        )}

        {mode === "digilocker_docs" && (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <div className="font-display font-bold text-teal-600 text-2xl mb-1">{t(lang, "digiDocsTitle")}</div>
              <p className="text-sm text-ink/60">{t(lang, "digiDocsSub")}</p>
            </div>

            {error && (
              <div className="bg-brick/10 text-brick text-sm p-3 rounded-lg flex items-center gap-2 font-medium">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div className="flex flex-col gap-3">
              {DIGILOCKER_DOCS.map((doc) => {
                const selected = selectedDigiDocs.includes(doc);
                return (
                  <button
                    key={doc}
                    onClick={() => toggleDigiDoc(doc)}
                    className={`w-full text-left rounded-card p-4 border-2 flex items-center justify-between font-semibold transition-all ${
                      selected
                        ? "border-leaf bg-leaf/5 text-leaf shadow-sm"
                        : "border-teal-100 bg-white text-ink"
                    }`}
                  >
                    <span>{doc}</span>
                    {selected && (
                      <span className="bg-leaf text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <Button full onClick={handleDigiSubmit} className="mt-2">
              {t(lang, "digiDocsButton")}
            </Button>
          </div>
        )}

        {mode === "upload" && (
          <div className="flex flex-col gap-5">
            <div className="text-center">
              <h2 className="font-display text-2xl font-semibold text-teal-900 mb-2">{t(lang, "uploadTitle")}</h2>
              <p className="text-sm text-ink/65">{t(lang, "uploadSub")}</p>
            </div>

            {!uploadedFile ? (
              <button
                onClick={() => inputRef.current?.click()}
                disabled={loading}
                className="border-2 border-dashed border-teal-300 rounded-card p-8 flex flex-col items-center gap-3 text-teal-700 hover:bg-teal-50 min-h-[160px] justify-center transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-pulse text-teal-600 font-semibold">{t(lang, "readingStatus")}</span>
                ) : (
                  <>
                    <UploadCloud size={32} aria-hidden="true" />
                    <span className="font-semibold">{t(lang, "uploadButton")}</span>
                    <span className="text-xs text-ink/50">{t(lang, "docsChoiceUploadSub")}</span>
                  </>
                )}
              </button>
            ) : (
              <div className="bg-white border-2 border-teal-100 rounded-card p-5 space-y-4 shadow-card">
                <div className="flex items-center gap-3">
                  <FileText className="text-teal-600 shrink-0" size={24} aria-hidden="true" />
                  <div className="flex-1 truncate">
                    <p className="font-semibold text-ink truncate">{uploadedFile.name}</p>
                    <p className="text-xs text-ink/50">{uploadedFile.size}</p>
                  </div>
                  <span className="text-leaf font-bold text-sm flex items-center gap-1">
                    <Check size={16} strokeWidth={3} /> {t(lang, "uploadReady")}
                  </span>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <Button full onClick={() => setMode("attached")}>
                    {t(lang, "continue")}
                  </Button>
                  <button
                    onClick={() => {
                      setUploadedFile(null);
                      setAttachedDocs([]);
                    }}
                    className="min-h-[52px] px-4 rounded-card font-body font-semibold text-[17px] border-2 border-brick text-brick hover:bg-brick/5 flex-1"
                  >
                    {t(lang, "uploadChooseAnother")}
                  </button>
                </div>
              </div>
            )}

            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileUpload}
            />

            {error && (
              <div className="bg-brick/10 border-2 border-brick/30 rounded-card p-4 flex gap-3 items-start">
                <AlertCircle className="text-brick shrink-0" size={20} aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-brick">{t(lang, "uploadErrorTitle")}</p>
                  <p className="text-xs text-brick mt-1 leading-relaxed">{error}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === "attached" && (
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h2 className="font-display text-2xl font-semibold text-teal-900">{t(lang, "attachedTitle")}</h2>
              <p className="text-sm text-ink/60 mt-1">{t(lang, "attachedSub")}</p>
            </div>

            <div className="bg-white border-2 border-teal-100 rounded-card p-5 space-y-3 shadow-card">
              <p className="text-xs font-bold text-teal-600 tracking-wide uppercase">{t(lang, "reviewDocumentsLabel")}</p>
              <ul className="space-y-2">
                {attachedDocs.map((doc, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-ink font-medium">
                    <span className="text-leaf"><Check size={16} strokeWidth={3} /></span> {doc}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              <Button full onClick={() => navigate("/authority")}>
                {t(lang, "continue")}
              </Button>
              <Button full variant="secondary" onClick={() => {
                setAttachedDocs([]);
                setSelectedDigiDocs([]);
                setUploadedFile(null);
                setMode("choice");
              }}>
                {t(lang, "attachedButtonChange")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
