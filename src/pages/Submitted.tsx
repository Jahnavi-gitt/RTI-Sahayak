import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Download } from "lucide-react";
import Shell from "../components/Shell";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";

export default function Submitted() {
  const { lang, requests } = useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const request = requests.find((r) => r.id === id);

  if (!request) {
    navigate("/");
    return null;
  }

  function downloadReceipt() {
    const lines = [
      t(lang, "receiptHeader"),
      t(lang, "receiptSimulatedNote"),
      "",
      `${t(lang, "requestId")}: ${request!.id}`,
      `${t(lang, "authority")}: ${request!.authority.name}`,
      `${t(lang, "date")}: ${new Date(request!.createdAt).toLocaleDateString(lang === "en" ? "en-IN" : "hi-IN", { day: "2-digit", month: "long", year: "numeric" })}`,
      "",
      t(lang, "receiptQuestionsHeader"),
      ...request!.questions.map((q, i) => `${i + 1}. ${q.text}`),
    ].join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${request!.id}-demo-receipt.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Shell step="submit" hideChrome={false}>
      <div className="flex flex-col items-center text-center gap-5 pt-8">
        <CheckCircle2 className="text-leaf" size={56} aria-hidden="true" />
        <h1 className="font-display text-2xl font-semibold text-teal-900">{t(lang, "submittedTitle")}</h1>

        <div className="bg-white border-2 border-teal-100 rounded-card p-5 w-full text-left space-y-2">
          <Row label={t(lang, "requestId")} value={request.id} mono />
          <Row label={t(lang, "authority")} value={request.authority.name} />
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
