import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import FanDetailPanel from "../components/FanDetailPanel";
import { Download, Search, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import RfmDistributionWidget from "../components/RfmDistributionWidget";
import TopSpendersWidget from "../components/TopSpendersWidget";
import {
  fetchAllFans,
  fetchSegments,
  fetchStats,
  fetchTopSpenders,
  fetchSeasons,
  exportFans,
  fetchRenewalScores,
  fetchClubIntelligence,
} from "../api/client";
import DataHealthPill from "../components/DataHealthPill";
import EmptyState from "../components/EmptyState";
import JourneyBadge from "../components/intelligence/JourneyBadge";
import AmbassadorBadge, { getTier, TIERS } from "../components/intelligence/AmbassadorBadge";
import FanCommunityImpact from "../components/intelligence/FanCommunityImpact";
import DecayBadge, { PROFILES as DECAY_PROFILES } from "../components/intelligence/DecayBadge";
import FanDecayProfile from "../components/intelligence/FanDecayProfile";

const JOURNEY_STAGES = [
  { value: "", label: "Tutti gli stadi" },
  { value: "SCOPERTA",   label: "🌱 Scoperta" },
  { value: "ABITUDINE",  label: "📈 Abitudine" },
  { value: "FEDELTA",    label: "💪 Fedeltà" },
  { value: "PICCO",      label: "⭐ Picco" },
  { value: "RISCHIO",    label: "⚠️ A rischio" },
  { value: "DORMIENTE",  label: "😴 Dormiente" },
  { value: "RECUPERATO", label: "🔄 Recuperato" },
];

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
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("tutti");
  const [journeyFilter, setJourneyFilter] = useState("");
  const [soloRischio, setSoloRischio] = useState(false);
  const [renewalMap, setRenewalMap] = useState({});
  const [renewalLoading, setRenewalLoading] = useState(false);
  const [intelligenceMap, setIntelligenceMap] = useState({});
  const [intelligenceLoading, setIntelligenceLoading] = useState(false);
  const [intelligenceError, setIntelligenceError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ambassadorSort, setAmbassadorSort] = useState(false);
  const [decaySort, setDecaySort] = useState(false);
  const [expandedFanId, setExpandedFanId] = useState(null);
  const [selectedFanId, setSelectedFanId] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [seasonFilter, setSeasonFilter] = useState("");

  useEffect(() => {
    Promise.all([fetchAllFans(), fetchSegments(), fetchTopSpenders(), fetchStats(), fetchSeasons()])
      .then(([f, seg, top, s, seas]) => {
        setFans(f);
        setSegments(seg);
        setTopSpenders(top);
        setStats(s);
        setSeasons(seas || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSeasonChange = async (stagione) => {
    setSeasonFilter(stagione);
    setLoading(true);
    try {
      const f = await fetchAllFans(stagione || null);
      setFans(f);
    } finally {
      setLoading(false);
    }
  };

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

  const loadIntelligence = async (stage = "") => {
    setIntelligenceLoading(true);
    setIntelligenceError(null);
    try {
      const params = stage ? { journey_stage: stage } : {};
      const data = await fetchClubIntelligence(params);
      const map = {};
      for (const item of data.items) map[item.fan_id] = item;
      setIntelligenceMap(map);
    } catch (err) {
      setIntelligenceError(err.userMessage || "Errore caricamento intelligence");
    } finally {
      setIntelligenceLoading(false);
    }
  };

  // Carica intelligence al mount
  useEffect(() => { loadIntelligence(""); }, []);

  useEffect(() => {
    if (searchParams.get("filter") === "at_risk") setSoloRischio(true);
  }, [searchParams]);

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
  const hasIntelligence = Object.keys(intelligenceMap).length > 0;

  const filtered = fans
    .filter((f) => {
      const matchSeg = segmentFilter === "tutti" || f.segment === segmentFilter;
      const q = filter.toLowerCase();
      const matchText = !q || `${f.nome} ${f.cognome} ${f.email} ${f.citta}`.toLowerCase().includes(q);
      const matchRischio = !soloRischio || (renewalMap[f.id]?.score_pct ?? 100) < 40;
      const matchJourney = !journeyFilter || intelligenceMap[f.id]?.journey_stage === journeyFilter;
      return matchSeg && matchText && matchRischio && matchJourney;
    })
    .sort((a, b) => {
      if (decaySort) {
        const DECAY_ORDER = { VOLATILE: 0, RAPIDO: 1, MEDIO: 2, LENTO: 3 };
        const da = DECAY_ORDER[intelligenceMap[a.id]?.decay_profile] ?? 4;
        const db = DECAY_ORDER[intelligenceMap[b.id]?.decay_profile] ?? 4;
        return da - db;
      }
      if (ambassadorSort) {
        const sa = intelligenceMap[a.id]?.ambassador_score ?? -1;
        const sb = intelligenceMap[b.id]?.ambassador_score ?? -1;
        return sb - sa;
      }
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
        <RfmDistributionWidget data={segments} showFetch={false} />

        <TopSpendersWidget data={topSpenders} showFetch={false} limit={5} />
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

          {seasons.length > 0 && (
            <select
              value={seasonFilter}
              onChange={(e) => handleSeasonChange(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              <option value="">Tutte le stagioni</option>
              {seasons.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}

          <select
            value={journeyFilter}
            onChange={(e) => {
              const v = e.target.value;
              setJourneyFilter(v);
              loadIntelligence(v);
            }}
            disabled={intelligenceLoading}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:opacity-50"
          >
            {JOURNEY_STAGES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {intelligenceError && (
            <span className="text-xs text-red-500">{intelligenceError}</span>
          )}

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
                <th className="pb-3 pr-4">Stadio</th>
                <th className="pb-3 pr-4">RFM</th>
                <th className="pb-3 pr-4">Fonti</th>
                <th className="pb-3 pr-4">Spesa</th>
                {hasRenewal && <th className="pb-3 pr-4">Prob. rinnovo</th>}
                {hasIntelligence && (
                  <th className="pb-3 pr-4">
                    <button
                      onClick={() => { setAmbassadorSort(v => !v); setDecaySort(false); }}
                      title="Ordina per impatto comunitario"
                      className={`flex items-center gap-1 uppercase tracking-wide text-xs transition-colors ${
                        ambassadorSort ? "text-violet-500" : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      Impatto {ambassadorSort ? "↓" : "↕"}
                    </button>
                  </th>
                )}
                {hasIntelligence && (
                  <th className="pb-3">
                    <button
                      onClick={() => { setDecaySort(v => !v); setAmbassadorSort(false); }}
                      title="Ordina per profilo fedeltà (Volatile prima)"
                      className={`flex items-center gap-1 uppercase tracking-wide text-xs transition-colors ${
                        decaySort ? "text-amber-500" : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      Fedeltà {decaySort ? "↓" : "↕"}
                    </button>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((f) => {
                const intel = intelligenceMap[f.id];
                const isRecuperato = intel?.journey_stage === "RECUPERATO";
                const isExpanded = expandedFanId === f.id;
                const ambassadorScore = intel?.ambassador_score ?? null;
                const tierKey = getTier(ambassadorScore);
                const tierTooltip = tierKey
                  ? `${TIERS[tierKey].icon} ${TIERS[tierKey].label} (score: ${ambassadorScore})`
                  : "Dati insufficienti per calcolarlo";

                return (
                  <>
                    <tr
                      key={f.id}
                      onClick={() => { setExpandedFanId(isExpanded ? null : f.id); setSelectedFanId(f.id); }}
                      className={`border-b border-slate-50 cursor-pointer ${
                        isExpanded ? "bg-slate-50" : "hover:bg-slate-50"
                      } ${isRecuperato ? "border-l-2 border-l-violet-400" : ""}`}
                    >
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
                      <td className="py-2.5 pr-4">
                        {intelligenceLoading
                          ? <span className="inline-block w-16 h-4 bg-slate-100 rounded animate-pulse" />
                          : <JourneyBadge stage={intel?.journey_stage} size="sm" />
                        }
                      </td>
                      <td className="py-2.5 pr-4 text-slate-500">{f.rfm_score}</td>
                      <td className="py-2.5 pr-4 text-slate-500">{f.n_sources}</td>
                      <td className="py-2.5 pr-4 font-semibold text-slate-800">{fmtEur(f.total_spend)}</td>
                      {hasRenewal && (
                        <td className="py-2.5 pr-4">
                          <RenewalBadge score={renewalMap[f.id]?.score_pct} />
                        </td>
                      )}
                      {hasIntelligence && (
                        <td className="py-2.5 pr-4" title={tierTooltip}>
                          {intelligenceLoading
                            ? <span className="inline-block w-10 h-4 bg-slate-100 rounded animate-pulse" />
                            : <AmbassadorBadge score={ambassadorScore} size="sm" />
                          }
                        </td>
                      )}
                      {hasIntelligence && (
                        <td
                          className="py-2.5"
                          title={
                            intel?.decay_profile
                              ? DECAY_PROFILES[intel.decay_profile]?.desc
                              : "Storico insufficiente (meno di 8 partite)"
                          }
                        >
                          {intelligenceLoading
                            ? <span className="inline-block w-14 h-4 bg-slate-100 rounded animate-pulse" />
                            : <DecayBadge profile={intel?.decay_profile} size="sm" />
                          }
                        </td>
                      )}
                    </tr>

                    {isExpanded && (
                      <tr key={`${f.id}-detail`} className="bg-slate-50">
                        <td colSpan={8 + (hasRenewal ? 1 : 0) + (hasIntelligence ? 2 : 0)} className="px-4 pb-4">
                          <FanDecayProfile profile={intel?.decay_profile} />
                          <FanCommunityImpact score={ambassadorScore} />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
          {filtered.length > 100 && (
            <p className="text-xs text-slate-400 mt-3">Mostrati i primi 100 di {filtered.length} risultati</p>
          )}
        </div>
      </div>

      <FanDetailPanel fanId={selectedFanId} onClose={() => setSelectedFanId(null)} />
    </div>
  );
}
