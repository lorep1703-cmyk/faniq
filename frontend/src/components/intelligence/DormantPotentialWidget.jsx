import { useEffect, useState } from "react";
import { Moon } from "lucide-react";
import { fetchDormantPotential } from "../../api/client";

const fmtEur = (n) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n ?? 0);

export default function DormantPotentialWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDormantPotential()
      .then(setData)
      .catch((err) => setError(err.userMessage || "Errore caricamento"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-1">
        <Moon size={15} className="text-slate-400" />
        <h2 className="text-sm font-bold text-slate-700">Potenziale dormienti</h2>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Quanto valevano storicamente i tifosi ora dormienti — non una previsione di risposta a una campagna
      </p>

      {loading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      {!loading && !error && data && data.fans_count === 0 && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-5 text-center">
          <p className="text-sm font-semibold text-slate-500">Nessun tifoso dormiente al momento.</p>
        </div>
      )}

      {!loading && !error && data && data.fans_count > 0 && (
        <>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 mb-4">
            <span className="text-xs font-semibold text-slate-600">{data.fans_count} tifosi dormienti</span>
            <span className="text-xl font-black text-slate-700">{fmtEur(data.potenziale_totale)}</span>
          </div>

          {data.top_fans.length > 0 && (
            <>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Valevano di più</p>
              <ul className="space-y-1.5">
                {data.top_fans.slice(0, 5).map((f) => (
                  <li key={f.fan_id} className="flex items-center justify-between text-sm py-1">
                    <span className="text-slate-700 truncate">{f.nome} {f.cognome}</span>
                    <span className="font-semibold text-slate-600">{fmtEur(f.valore_storico)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
