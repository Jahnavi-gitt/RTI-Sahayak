import { useNavigate, useSearchParams } from "react-router-dom";
import Shell from "../components/Shell";
import { useApp } from "../context/AppContext";
import { LANG_LABELS, t } from "../i18n/strings";
import type { Lang } from "../types";

export default function LanguageSelect() {
  const { lang, setLang } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dest = searchParams.get("dest");

  function selectLanguage(selected: Lang) {
    setLang(selected);
    if (dest) {
      navigate({ pathname: `/${dest}`, search: searchParams.toString() });
    } else {
      navigate("/");
    }
  }

  return (
    <Shell onBack={() => navigate({ pathname: "/", search: searchParams.toString() })}>
      <div className="flex flex-col gap-6 pt-4 max-w-md mx-auto">
        <div className="text-center">
          <h1 className="font-display text-3xl font-semibold text-teal-900 mb-2">
            {t(lang, "shellSelectLanguage")}
          </h1>
          <p className="text-sm text-ink/60">
            {t(lang, "kioskSelectLangSub")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => selectLanguage(l)}
              className={`min-h-[64px] rounded-card border-2 p-4 text-center font-body font-semibold text-lg transition-all ${
                lang === l
                  ? "bg-teal-50 border-teal-600 text-teal-900 shadow-md"
                  : "bg-white border-teal-100 hover:border-teal-400 text-ink shadow-sm"
              }`}
            >
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
      </div>
    </Shell>
  );
}
