import { useEffect, useState } from "react";
import { Download, Search, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  fetchAllFans,
  fetchSegments,
  fetchStats,
  fetchTopSpenders,
  exportFans,
  fetchRenewalScores,
} from "../api/client";
import DataHealthPill from "../components/DataHealthPill";
import EmptyState from "../components/EmptyState";

const SEGMENT_COLORS = {
  VIP: "#534AB7",
  Fedele: "#7F79D5",
  Occasionale: "#AAA6E3",
  "A rischio": "#F59E0B",
  Dormiente: "#94A3B8",
  Nuovo: "#34D399",
};

function fmtEur(n) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function RenewalBadge({ score }) {
  if (score == null) return <span className="text-xs text-slate-300">—</span>;
  const cfg = score >= 70
    ? { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" }
    : score >= 40
    ? { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400" }
    : { bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500" };
  return (
    <span
      title="Basato su presenze, trend e storico abbonamenti"
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {score}%
    </span>
  );
}

export default function Report() {
  const [fans, setFans] = useState([]);
  const [segments, setSegments] = useState([]);
  const [topSpenders, setTopSpenders] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("tutti");
  const [soloRischio, setSoloRischio] = useState(false);
  const [renewalMap, setRenewalMap] = useState({});
  const [renewalLoading, setRenewalLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchAllFans(), fetchSegments(), fetchTopSpenders(), fetchStats()])
      .then(([f, seg, top, s]) => {
        setFans(f);
        setSegments(seg);
        setTopSpenders(top);
        setStats(s);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadRenewal = async () => {
    setRenewalLoading(true);
    try {
      const data = await fetchRenewalScores();
      const map = {};
      for (const item of data.items) map[item.fan_id] = item;
      setRenewalMap(map);
    } catch { /* silenzioso */ }
    finally { setRenewalLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats?.total_fans) {
    return (
      <EmptyState
        title="Nessun tifoso da analizzare"
        subtitle="Importa i dati CSV per vedere segmenti RFM, top spender e export."
      />
    );
  }

  const hasRenewal = Object.keys(renewalMap).length > 0;

  const filtered = fans
    .filter((f) => {
      const matchSeg = segmentFilter === "tutti" || f.segment === segmentFilter;
      const q = filter.toLowerCase();
      const matchText = !q || `${f.nome} ${f.cognome} ${f.email} ${f.citta}`.toLowerCase().includes(q);
      const matchRischio = !soloRischio || (renewalMap[f.id]?.score_pct ?? 100) < 40;
      return matchSeg && matchText && matchRischio;
    })
    .sort((a, b) => {
      if (!hasRenewal) return 0;
      const sa = renewalMap[a.id]?.score_pct ?? 100;
      const sb = renewalMap[b.id]?.score_pct ?? 100;
      return sa - sb;
    });

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Report & Segmenti</h1>
          <p className="text-slate-500 text-sm mt-1">
            {stats.total_fans} tifosi — segmentazione RFM automatica
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DataHealthPill />
          <button
            onClick={() => exportFans(segmentFilter)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Segmenti RFM</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={segments}>
              <XAxis dataKey="segment" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name="Tifosi" radius={[4, 4, 0, 0]}>
                {segments.map((s) => (
                  <Cell key={s.segment} fill={SEGMENT_COLORS[s.segment] || "#534AB7"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Top 10 spender</h2>
          <ul className="space-y-2">
            {topSpenders.map((f, i) => (
              <li key={f.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="font-medium text-slate-700">
                    {f.nome} {f.cognome}
                  </span>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {f.segment}
                  </span>
                </div>
                <span className="font-semibold text-slate-800">{fmtEur(f.total_spend)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Cerca per nome, email, città..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            <option value="tutti">Tutti i segmenti</option>
            {segments.map((s) => (
              <option key={s.segment} value={s.segment}>{s.segment}</option>
            ))}
          </select>

          {!hasRenewal ? (
            <button
              onClick={loadRenewal}
              disabled={renewalLoading}
              className="flex items-center gap-2 text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={14} className={renewalLoading ? "animate-spin" : ""} />
              {renewalLoading ? "Calcolo..." : "Calcola prob. rinnovo"}
            </button>
          ) : (
            <button
              onClick={() => setSoloRischio(v => !v)}
              className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 font-medium border transition-colors ${
                soloRischio
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {soloRischio ? "✕ Solo a rischio rinnovo" : "Mostra solo a rischio rinnovo"}
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                <th className="pb-3 pr-4">Nome</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Città</th>
                <th className="pb-3 pr-4">Segmento</th>
                <th className="pb-3 pr-4">RFM</th>
                <th className="pb-3 pr-4">Fonti</th>
                <th className="pb-3 pr-4">Spesa</th>
                {hasRenewal && <th className="pb-3">Prob. rinnovo</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((f) => (
                <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2.5 pr-4 font-medium text-slate-700">
                    {f.nome} {f.cognome}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-500">{f.email || "—"}</td>
                  <td className="py-2.5 pr-4 text-slate-500">{f.citta || "—"}</td>
                  <td className="py-2.5 pr-4">
                    <span className="text-xs font-medium bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
                      {f.segment}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-slate-500">{f.rfm_score}</td>
                  <td className="py-2.5 pr-4 text-slate-500">{f.n_sources}</td>
                  <td className="py-2.5 pr-4 font-semibold text-slate-800">{fmtEur(f.total_spend)}</td>
                  {hasRenewal && (
                    <td className="py-2.5">
                      <RenewalBadge score={renewalMap[f.id]?.score_pct} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 100 && (
            <p className="text-xs text-slate-400 mt-3">Mostrati i primi 100 di {filtered.length} risultati</p>
          )}
        </div>
      </div>
    </div>
  );
}
