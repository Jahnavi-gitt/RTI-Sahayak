import { useNavigate, useParams } from "react-router-dom";
import Shell from "../components/Shell";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";

export default function ExplainStatus() {
  const { lang, requests } = useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const request = requests.find((r) => r.id === id);
  if (!request) {
    navigate("/");
    return null;
  }

  return (
    <Shell step="track" onBack={() => navigate(`/track/${request.id}`)}>
      <div className="flex flex-col gap-5 pt-4">
        <p className="text-xs font-mono bg-teal-50 text-teal-700 rounded-full px-3 py-1 self-start">
          {t(lang, "statusOfficialLabel")}
        </p>

        <Block title={t(lang, "whatHappened")} body={t(lang, "statusWhatHappenedBody")} />
        <Block
          title={t(lang, "whatItMeans")}
          body={t(lang, "statusWhatItMeansBody")}
        />
        <Block title={t(lang, "whatShouldYouDo")} body={t(lang, "statusWhatShouldYouDoBody")} />

        <p className="text-xs text-ink/50 italic">
          {t(lang, "statusDisclaimer")}
        </p>

        <Button full onClick={() => navigate(`/track/${request.id}`)}>
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
