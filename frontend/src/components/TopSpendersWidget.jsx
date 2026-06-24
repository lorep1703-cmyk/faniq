import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { fetchTopSpenders } from "../api/client";

const SEGMENT_COLORS = {
  VIP:         "#534AB7",
  Fedele:      "#7F79D5",
  Nuovo:       "#34D399",
  "A rischio": "#F59E0B",
  Dormiente:   "#94A3B8",
  Occasionale: "#AAA6E3",
};

const MEDALS = ["🥇", "🥈", "🥉"];

function fmtEur(n) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n ?? 0);
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

function SegmentPill({ segment }) {
  const color = SEGMENT_COLORS[segment] ?? "#6b7280";
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full"
      style={{
        backgroundColor: `rgba(${hexToRgb(color)}, 0.12)`,
        color,
      }}
    >
      {segment}
    </span>
  );
}

export default function TopSpendersWidget({ data: dataProp, showFetch = true, limit = 5 }) {
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
    fetchTopSpenders()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [showFetch, dataProp]);

  const displayed = (data ?? []).slice(0, limit);

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={15} className="text-amber-500" />
        <h2 className="text-sm font-bold text-slate-700">
          Top Spender{displayed.length > 0 ? ` (${displayed.length})` : ""}
        </h2>
      </div>

      {loading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-xs text-slate-400">Dati non disponibili.</p>
      )}

      {!loading && !error && displayed.length === 0 && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-5 text-center">
          <p className="text-sm font-semibold text-slate-500">Nessun dato disponibile.</p>
          <p className="text-xs text-slate-400 mt-1">
            Importa i CSV per vedere i top spender.
          </p>
        </div>
      )}

      {!loading && !error && displayed.length > 0 && (
        <>
          <ul>
            {displayed.map((f, i) => {
              const medal = MEDALS[i];
              const initials = f.cognome ? `${f.cognome[0]}.` : "";
              return (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-50 last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {medal ? (
                      <span className="text-base leading-none shrink-0">{medal}</span>
                    ) : (
                      <span className="w-5 text-center text-xs font-semibold text-slate-400 shrink-0">
                        {i + 1}
                      </span>
                    )}
                    <span className="text-sm font-medium text-slate-700 truncate">
                      {f.nome} {initials}
                    </span>
                    {f.segment && <SegmentPill segment={f.segment} />}
                  </div>
                  <span className="text-sm font-semibold text-slate-800 shrink-0 tabular-nums">
                    {fmtEur(f.total_spend)}
                  </span>
                </li>
              );
            })}
          </ul>

          <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
            Spesa cumulata: abbonamenti · biglietti · shop
          </p>
        </>
      )}
    </div>
  );
}
