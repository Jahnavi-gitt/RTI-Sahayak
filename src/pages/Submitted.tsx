import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Download } from "lucide-react";
import Shell from "../components/Shell";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";
import { downloadReceiptPdf } from "../utils/pdfGenerator";
import { getLocalizedDepartmentName } from "../data/departments";

export default function Submitted() {
  const { lang, requests, currentUser } = useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const request = requests.find((r) => r.id === id);

  if (!request) {
    navigate("/");
    return null;
  }

  function downloadReceipt() {
    downloadReceiptPdf(request!, lang, currentUser?.name);
  }

  return (
    <Shell step="submit" hideChrome={false}>
      <div className="flex flex-col items-center text-center gap-5 pt-8">
        <CheckCircle2 className="text-leaf" size={56} aria-hidden="true" />
        <h1 className="font-display text-2xl font-semibold text-teal-900">{t(lang, "submittedTitle")}</h1>

        <div className="bg-white border-2 border-teal-100 rounded-card p-5 w-full text-left space-y-2">
          <Row label={t(lang, "requestId")} value={request.id} mono />
          <Row label={t(lang, "authority")} value={getLocalizedDepartmentName(request.authority, lang)} />
          <Row
            label={t(lang, "date")}
            value={new Date(request.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          />
        </div>

        <p className="text-sm text-ink/60">{t(lang, "simulatedNote")}</p>

        <div className="w-full flex flex-col gap-3 mt-2">
          <Button full onClick={() => navigate(`/track/${request.id}`)}>
            {t(lang, "trackRequest")}
          </Button>
          <Button full variant="ghost" onClick={downloadReceipt}>
            <span className="inline-flex items-center gap-2 justify-center">
              <Download size={16} /> {t(lang, "downloadReceipt")}
            </span>
          </Button>
        </div>
      </div>
    </Shell>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-ink/50">{label}</span>
      <span className={`text-right font-semibold text-ink ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
