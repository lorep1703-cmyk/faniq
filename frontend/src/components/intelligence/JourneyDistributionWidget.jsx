import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { fetchIntelligenceSummary } from "../../api/client";
import { STAGE_CONFIG } from "./JourneyBadge";

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-slate-100 rounded w-1/2" />
      <div className="h-40 bg-slate-100 rounded-full w-40 mx-auto" />
      <div className="space-y-2">
        <div className="h-3 bg-slate-100 rounded w-3/4 mx-auto" />
        <div className="h-3 bg-slate-100 rounded w-1/2 mx-auto" />
      </div>
    </div>
  );
}

function buildInsight(dist, total) {
  if (!total) return null;
  const pct = (key) => ((dist[key] || 0) / total) * 100;

  const recuperati = dist["RECUPERATO"] || 0;
  const rischioN = dist["RISCHIO"] || 0;
  const dormientiN = dist["DORMIENTE"] || 0;

  if (recuperati > 0 && pct("RECUPERATO") > 5) {
    return {
      color: "#8b5cf6",
      bg: "#f5f3ff",
      text: `Hai ${recuperati} tifosi tornati di recente — contattali subito.`,
    };
  }
  if (pct("RISCHIO") > 20) {
    return {
      color: "#f97316",
      bg: "#fff7ed",
      text: `1 tifoso su 5 è a rischio abbandono. Agisci prima dei rinnovi.`,
    };
  }
  if (pct("DORMIENTE") > 40) {
    return {
      color: "#94a3b8",
      bg: "#f8fafc",
      text: `Quasi metà dei tuoi tifosi è dormiente. Serve una campagna di riattivazione.`,
    };
  }
  return { color: "#10b981", bg: "#ecfdf5", text: "La distribuzione degli stadi è nella norma." };
}

const STAGE_ORDER = ["PICCO", "FEDELTA", "ABITUDINE", "SCOPERTA", "RECUPERATO", "RISCHIO", "DORMIENTE"];

export default function JourneyDistributionWidget() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchIntelligenceSummary()
      .then(setData)
      .catch((err) => setError(err.userMessage || "Dati non disponibili"));
  }, []);

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-700 mb-4">Distribuzione Journey</h2>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-700 mb-4">Distribuzione Journey</h2>
        <Skeleton />
      </div>
    );
  }

  const dist = data.journey_distribution || {};
  const total = Object.values(dist).reduce((s, n) => s + n, 0);

  if (total === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-700 mb-4">Distribuzione Journey</h2>
        <p className="text-sm text-slate-400 text-center py-6">Nessun dato disponibile.</p>
      </div>
    );
  }

  const chartData = STAGE_ORDER
    .filter((k) => (dist[k] || 0) > 0)
    .map((k) => ({
      name: STAGE_CONFIG[k]?.label || k,
      value: dist[k],
      key: k,
      color: STAGE_CONFIG[k]?.color || "#94a3b8",
    }));

  const insight = buildInsight(dist, total);

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
      <h2 className="text-base font-semibold text-slate-700 mb-1">Distribuzione Journey</h2>
      <p className="text-xs text-slate-400 mb-4">{total} tifosi analizzati</p>

      <div className="flex gap-6 items-center">
        {/* Donut */}
        <div className="shrink-0 w-36 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%" cy="50%"
                innerRadius={38} outerRadius={58}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} (${Math.round(value / total * 100)}%)`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legenda */}
        <ul className="flex-1 space-y-1.5">
          {chartData.map((entry) => (
            <li key={entry.key} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-600">{entry.name}</span>
              </div>
              <span className="font-semibold text-slate-700 ml-2">
                {entry.value} <span className="text-slate-400 font-normal">({Math.round(entry.value / total * 100)}%)</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Insight testuale */}
      {insight && (
        <div
          className="mt-4 rounded-lg px-3 py-2.5 text-xs font-medium"
          style={{ backgroundColor: insight.bg, color: insight.color }}
        >
          {insight.text}
        </div>
      )}
    </div>
  );
}
