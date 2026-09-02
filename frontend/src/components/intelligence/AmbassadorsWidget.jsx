import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { fetchClubIntelligence } from "../../api/client";
import AmbassadorBadge, { getTier } from "./AmbassadorBadge";

export default function AmbassadorsWidget() {
  const [ambassadors, setAmbassadors] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchClubIntelligence({ per_page: 500 })
      .then((data) => {
        // Stessa soglia di AmbassadorBadge — una sola fonte (getTier), non un
        // secondo "60" hardcoded qui che potrebbe scollegarsi dall'altro.
        const withScore = data.items.filter((f) => getTier(f.ambassador_score) === "ambassador");
        withScore.sort((a, b) => b.ambassador_score - a.ambassador_score);
        setTotal(withScore.length);
        setAmbassadors(withScore.slice(0, 10));
      })
      .catch((err) => setError(err.userMessage || "Errore caricamento"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users size={15} className="text-violet-500" />
        <h2 className="text-sm font-bold text-slate-700">
          Ambassador{total > 0 ? ` (${total})` : ""}
        </h2>
      </div>

      {loading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {!loading && !error && ambassadors.length === 0 && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-5 text-center">
          <p className="text-sm font-semibold text-slate-500">Nessun ambassador identificato ancora.</p>
          <p className="text-xs text-slate-400 mt-1">
            Servono almeno 8 partite di dati per calcolarlo.
          </p>
        </div>
      )}

      {!loading && !error && ambassadors.length > 0 && (
        <>
          <ul className="space-y-2">
            {ambassadors.map((fan) => (
              <li
                key={fan.fan_id}
                className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-50 last:border-0"
              >
                <span className="text-sm font-medium text-slate-700 truncate">
                  {fan.nome || fan.cognome ? `${fan.nome ?? ""} ${fan.cognome ?? ""}`.trim() : `Fan #${fan.fan_id}`}
                </span>
                <AmbassadorBadge score={fan.ambassador_score} size="sm" />
              </li>
            ))}
          </ul>

          <p className="text-xs text-slate-400 mt-4 leading-relaxed border-t border-slate-100 pt-3">
            Questi tifosi portano altri allo stadio — trattali come canali, non solo come fan.
          </p>
        </>
      )}
    </div>
  );
}
