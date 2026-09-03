import { useEffect, useState } from "react";
import { fetchSegments } from "../api/client";
import EmptyState from "./EmptyState";

export const SEGMENT_COLORS = {
  VIP:         "#534AB7",
  Fedele:      "#7F79D5",
  Nuovo:       "#34D399",
  "A rischio": "#F59E0B",
  Dormiente:   "#94A3B8",
  Occasionale: "#AAA6E3",
};

const DISPLAY_ORDER = ["VIP", "Fedele", "Nuovo", "Occasionale", "A rischio", "Dormiente"];

function getInsight(data, total) {
  if (!total) return null;
  const byKey = Object.fromEntries(data.map((d) => [d.segment, d.count]));
  const risky = (byKey["A rischio"] ?? 0) + (byKey["Dormiente"] ?? 0);
  const solid = (byKey["VIP"] ?? 0) + (byKey["Fedele"] ?? 0);
  const solidPct = Math.round((solid / total) * 100);
  if (risky > total * 0.5)
    return "Oltre metà dei tuoi tifosi necessita di attenzione. Pianifica una campagna di riattivazione.";
  if (solid > total * 0.6)
    return `Base solida: il ${solidPct}% dei tuoi tifosi è fedele o VIP. Focus sulla retention.`;
  return "Distribuzione nella norma.";
}

export default function RfmDistributionWidget({ data: dataProp, showFetch = true }) {
  const [data, setData] = useState(dataProp ?? null);
  const [loading, setLoading] = useState(showFetch && !dataProp);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!showFetch) {
      setData(dataProp ?? []);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchSegments()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [showFetch, dataProp]);

  const filtered = (data ?? [])
    .filter((d) => DISPLAY_ORDER.includes(d.segment) && d.count > 0)
    .sort((a, b) => DISPLAY_ORDER.indexOf(a.segment) - DISPLAY_ORDER.indexOf(b.segment));

  const total = filtered.reduce((s, d) => s + d.count, 0);
  const insight = data && !loading && !error ? getInsight(filtered, total) : null;

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-700">Segmenti RFM</h2>
        {!loading && !error && total > 0 && (
          <p className="text-xs text-slate-400 mt-0.5">{total} tifosi analizzati</p>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-4 h-4 bg-slate-100 rounded-full animate-pulse shrink-0" />
              <div className="w-20 h-4 bg-slate-100 rounded animate-pulse shrink-0" />
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full animate-pulse" />
              <div className="w-10 h-4 bg-slate-100 rounded animate-pulse shrink-0" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-xs text-slate-400">Dati segmentazione non disponibili.</p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          title="Nessun segmento"
          subtitle="Importa i dati CSV per attivare la segmentazione RFM."
        />
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          <div className="space-y-3">
            {filtered.map((d) => {
              const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
              const color = SEGMENT_COLORS[d.segment] ?? "#6b7280";
              return (
                <div key={d.segment} className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs font-medium text-slate-600 w-20 shrink-0">
                    {d.segment}
                  </span>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-16 text-right shrink-0 tabular-nums">
                    {d.count} ({pct}%)
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
