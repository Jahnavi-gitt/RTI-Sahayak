import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Search } from "lucide-react";
import Shell from "../components/Shell";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";
import { t } from "../i18n/strings";
import { findAuthorities } from "../services/ai";
import type { Authority } from "../types";

export default function AuthorityMatch() {
  const { lang, draft, updateDraft } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState(draft.understanding?.topic === "general" ? "" : draft.understanding?.topic ?? "");
  const [results, setResults] = useState<Authority[]>([]);
  const [selected, setSelected] = useState<Authority | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (query.trim()) runSearch(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runSearch(q: string) {
    const r = await findAuthorities(q);
    setResults(r);
    setNotFound(r.length === 0);
  }

  function confirm() {
    if (!selected) return;
    updateDraft({ authority: selected });
    navigate("/review");
  }

  return (
    <Shell step="write" onBack={() => navigate("/supporting")}>
      <div className="flex flex-col gap-5 pt-4">
        <h1 className="font-display text-3xl font-semibold text-teal-900">{t(lang, "authorityTitle")}</h1>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" size={20} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch(query)}
            placeholder={t(lang, "authoritySearch")}
            aria-label={t(lang, "authoritySearch")}
            className="w-full min-h-[52px] pl-11 pr-4 rounded-full border-2 border-teal-100 focus-visible:border-teal-500 bg-white text-lg"
          />
        </div>
        <Button variant="ghost" onClick={() => runSearch(query)} className="self-start">
          {t(lang, "searchAgain")}
        </Button>

        {notFound && (
          <p className="text-sm text-ink/70 bg-teal-50 rounded-lg p-3">
            {t(lang, "authorityNotFound")}
          </p>
        )}

        <div className="flex flex-col gap-3">
          {results.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelected(a)}
              className={`text-left rounded-card p-4 border-2 transition-colors ${
                selected?.id === a.id ? "border-teal-600 bg-teal-50" : "border-teal-100 bg-white hover:border-teal-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <Building2 className="text-teal-600 shrink-0 mt-0.5" size={22} aria-hidden="true" />
                <div>
                  <p className="font-semibold text-ink">{a.name}</p>
                  <p className="text-sm text-ink/60 mt-0.5">{a.whyMatch}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {selected && <p className="text-xs text-ink/50 italic">{t(lang, "suggestedAuthority")}</p>}

        <Button full onClick={confirm} disabled={!selected}>
          {t(lang, "confirm")}
        </Button>
      </div>
    </Shell>
  );
}
