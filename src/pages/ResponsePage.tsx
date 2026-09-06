import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Shell from "../components/Shell";
import Button from "../components/Button";
import ListenButton from "../components/ListenButton";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";
import { explainResponse } from "../services/ai";
import type { MockResponse } from "../types";

const RAW_RESPONSE =
  "The application was transferred to the Regional Scholarship Cell on 12 July for verification of bank details, and is currently awaiting confirmation from that office.";

export default function ResponsePage() {
  const { lang, requests } = useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const request = requests.find((r) => r.id === id);
  const [loading, setLoading] = useState(true);
  const [explained, setExplained] = useState<MockResponse | null>(null);

  useEffect(() => {
    explainResponse(RAW_RESPONSE, lang).then((r) => {
      setExplained(r);
      setLoading(false);
    });
  }, [lang]);

  if (!request) {
    navigate("/");
    return null;
  }

  return (
    <Shell step="track" onBack={() => navigate(`/track/${request.id}`)}>
      <div className="flex flex-col gap-5 pt-4">
        <h1 className="font-display text-2xl font-semibold text-teal-900">{t(lang, "responseReceived")}</h1>

        <div className="bg-teal-50 border-l-4 border-teal-600 rounded-r-card p-4 text-sm text-ink/70 italic">
          “{RAW_RESPONSE}”
        </div>

        <p className="font-semibold text-marigold-600">{t(lang, "simpleVersion")}</p>

        {loading || !explained ? (
          <div className="flex items-center gap-2 text-ink/60 py-6 justify-center">
            <Loader2 className="animate-spin" size={22} /> {t(lang, "loadingPlainLanguage")}
          </div>
        ) : (
          <>
            <Block title={t(lang, "whatTheySaid")} body={explained.whatTheySaid} />
            <Block title={t(lang, "whatItMeans")} body={explained.whatItMeans} />
            <div className="bg-white border-2 border-teal-100 rounded-card p-4">
              <p className="text-xs font-bold text-teal-600 tracking-wide mb-2">{t(lang, "whatToCheck")}</p>
              <ul className="list-disc list-inside text-ink/80 space-y-1 text-sm leading-relaxed">
                {explained.whatToCheck.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
            <ListenButton text={`${explained.whatTheySaid} ${explained.whatItMeans}`} />
          </>
        )}

        <Button full onClick={() => navigate(`/track/${request.id}/end`)}>
          {t(lang, "gotIt")}
        </Button>
      </div>
    </Shell>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-white border-2 border-teal-100 rounded-card p-4">
      <p className="text-xs font-bold text-teal-600 tracking-wide mb-1">{title}</p>
      <p className="text-ink leading-relaxed">{body}</p>
    </div>
  );
}
