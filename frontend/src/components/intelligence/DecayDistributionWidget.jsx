import { useEffect, useState } from "react";
import { fetchIntelligenceSummary } from "../../api/client";
import { PROFILES } from "./DecayBadge";

const ORDER = ["VOLATILE", "RAPIDO", "MEDIO", "LENTO", null];

const NULL_CFG = { icon: "—", label: "N/D", color: "#94a3b8", bg: "#f8fafc" };

function getInsight(dist, total) {
  if (!total) return null;
  const volatilePct = Math.round(((dist.VOLATILE ?? 0) / total) * 100);
  const lentoPct    = Math.round(((dist.LENTO    ?? 0) / total) * 100);
  if (volatilePct > 30)
    return `Il ${volatilePct}% dei tuoi tifosi abbandona facilmente. Contattali alla prima assenza.`;
  if (lentoPct > 40)
    return `La tua base è solida: il ${lentoPct}% dei tifosi resiste alle assenze.`;
  return "Distribuzione nella norma.";
}

export default function DecayDistributionWidget() {
  const [dist, setDist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchIntelligenceSummary()
      .then((data) => setDist(data.decay_distribution ?? null))
      .catch((err) => setError(err.userMessage || "Errore caricamento"))
      .finally(() => setLoading(false));
  }, []);

  const total = dist ? Object.values(dist).reduce((a, b) => a + b, 0) : 0;
  const insight = dist ? getInsight(dist, total) : null;

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-700">Profilo fedeltà</h2>
        <p className="text-xs text-slate-400 mt-0.5">Come reagiscono i tifosi alle assenze</p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-20 h-4 bg-slate-100 rounded animate-pulse shrink-0" />
              <div className="flex-1 h-3 bg-slate-100 rounded-full animate-pulse" />
              <div className="w-8 h-4 bg-slate-100 rounded animate-pulse shrink-0" />
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      {!loading && !error && !dist && (
        <p className="text-sm text-slate-400">Nessun dato disponibile.</p>
      )}

      {!loading && !error && dist && (
        <>
          <div className="space-y-3">
            {ORDER.map((key) => {
              const count = key ? (dist[key] ?? 0) : (dist[null] ?? dist["null"] ?? 0);
              const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
              const cfg   = key ? PROFILES[key] : NULL_CFG;

              return (
                <div key={key ?? "null"} className="flex items-center gap-3">
                  <div className="w-22 flex items-center gap-1.5 shrink-0 min-w-[88px]">
                    <span className="text-sm leading-none">{cfg.icon}</span>
                    <span className="text-xs font-medium text-slate-600">{cfg.label}</span>
                  </div>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: cfg.color }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 w-8 text-right shrink-0">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>

          {insight && (
            <p className="text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100 leading-relaxed">
              {insight}
            </p>
          )}
        </>
      )}
    </div>
  );
}
