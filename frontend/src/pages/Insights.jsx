import { useEffect, useState } from "react";
import {
  ShieldAlert,
  TrendingUp,
  Download,
  Users,
  Star,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { fetchInsights, exportFans } from "../api/client";
import EmptyState from "../components/EmptyState";

// ── utils ─────────────────────────────────────────────────────────────────────

function fmt(n) {
  return new Intl.NumberFormat("it-IT").format(Math.round(n ?? 0));
}
function fmtEur(n) {
  if (!n) return "—";
  return `€${fmt(n)}`;
}

// ── Score circle ──────────────────────────────────────────────────────────────

const SCORE_COLOR = (s) =>
  s >= 90 ? "#10b981" : s >= 70 ? "#059669" : s >= 40 ? "#d97706" : "#dc2626";

const SCORE_LABEL = (s) =>
  s >= 90 ? "Eccellente" : s >= 70 ? "Buono" : s >= 40 ? "Da migliorare" : "Critico";

function ScoreCircle({ score }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = SCORE_COLOR(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
          <circle cx="64" cy="64" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
          <circle
            cx="64" cy="64" r={r}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1.2s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black leading-none" style={{ color }}>{score}</span>
          <span className="text-xs text-slate-400 font-medium">/100</span>
        </div>
      </div>
      <p className="text-sm font-bold text-slate-700 mt-2">Salute del club</p>
      <p className="text-xs font-semibold mt-0.5" style={{ color }}>{SCORE_LABEL(score)}</p>
    </div>
  );
}

// ── Alert banner ──────────────────────────────────────────────────────────────

function AlertBanner({ kpi }) {
  const pct = kpi.total_revenue > 0 ? kpi.revenue_a_rischio / kpi.total_revenue : 0;
  if (pct < 0.15 || !kpi.revenue_a_rischio) return null;

  return (
    <div className="mb-6 rounded-xl bg-red-600 text-white px-5 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <ShieldAlert size={22} className="shrink-0" />
        <div>
          <p className="font-bold text-sm">Intervieni ora — {fmtEur(kpi.revenue_a_rischio)} a rischio</p>
          <p className="text-xs text-red-200 mt-0.5">
            {Math.round(pct * 100)}% della revenue storica è in pericolo di perdita permanente
          </p>
        </div>
      </div>
      <span className="text-3xl font-black text-red-300 shrink-0">{Math.round(pct * 100)}%</span>
    </div>
  );
}

// ── KPI strip ─────────────────────────────────────────────────────────────────

function KpiStrip({ kpi }) {
  const items = [
    { label: "Tifosi totali", value: fmt(kpi.total_fans), icon: Users, color: "text-slate-600" },
    {
      label: "Revenue a rischio",
      value: fmtEur(kpi.revenue_a_rischio),
      icon: ShieldAlert,
      color: kpi.revenue_a_rischio > 0 ? "text-red-600" : "text-slate-400",
    },
    {
      label: "Opportunità",
      value: fmtEur(kpi.opportunita_stimata),
      icon: TrendingUp,
      color: kpi.opportunita_stimata > 0 ? "text-emerald-600" : "text-slate-400",
    },
    {
      label: "Super-fan",
      value: fmt(kpi.super_fans),
      icon: Star,
      color: "text-violet-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon size={12} className={item.color} />
              <span className="text-xs text-slate-400">{item.label}</span>
            </div>
            <p className={`text-xl font-black leading-tight ${item.color}`}>{item.value}</p>
          </div>
        );
      })}
    </div>
  );
}

// ── Segment bars ──────────────────────────────────────────────────────────────

const SEG_COLOR = {
  VIP: "#7c3aed",
  Fedele: "#059669",
  "A rischio": "#d97706",
  Dormiente: "#dc2626",
  Nuovo: "#2563eb",
  Occasionale: "#6b7280",
};

function SegmentBars({ counts }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (!total) return null;

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
        Segmenti
      </p>
      <div className="space-y-2.5">
        {sorted.map(([seg, count]) => {
          const pct = (count / total) * 100;
          const color = SEG_COLOR[seg] ?? "#6b7280";
          return (
            <div key={seg} className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-20 shrink-0">{seg}</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              <span className="text-xs font-bold text-slate-600 w-8 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Revenue Watch ─────────────────────────────────────────────────────────────

function RevenueWatch({ data, onExport }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-1">
        <ShieldAlert size={15} className="text-red-500" />
        <h2 className="text-sm font-bold text-slate-700">Revenue Watch</h2>
      </div>
      <p className="text-xs text-slate-400 mb-4">Revenue storica a rischio perdita permanente</p>

      {!data.items.length ? (
        <p className="text-sm text-slate-400">Nessuna criticità rilevata.</p>
      ) : (
        <>
          <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 flex items-baseline justify-between mb-4">
            <span className="text-xs font-semibold text-red-700">Totale a rischio</span>
            <span className="text-2xl font-black text-red-600">{fmtEur(data.totale_a_rischio)}</span>
          </div>

          <div className="space-y-3">
            {data.items.map((item) => (
              <div
                key={item.segment}
                className={`rounded-lg border p-4 ${
                  item.severity === "high"
                    ? "border-red-200 bg-red-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.sublabel}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-lg font-black ${item.severity === "high" ? "text-red-600" : "text-amber-600"}`}>
                      {fmtEur(item.revenue)}
                    </p>
                    <p className="text-xs text-slate-400">{item.count} tifosi</p>
                  </div>
                </div>
                <button
                  onClick={() => onExport(item.segment)}
                  className="mt-3 flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                >
                  <Download size={12} />
                  Esporta segmento
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Opportunità ───────────────────────────────────────────────────────────────

function Opportunita({ items, onExport }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp size={15} className="text-emerald-500" />
        <h2 className="text-sm font-bold text-slate-700">Opportunità</h2>
      </div>
      <p className="text-xs text-slate-400 mb-4">Revenue aggiuntiva stimata con azioni mirate</p>

      {!items.length ? (
        <p className="text-sm text-slate-400">Carica più dati per sbloccare opportunità.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.tipo} className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-800">{item.titolo}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.descrizione}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-black text-emerald-600">{fmtEur(item.revenue_stimata)}</p>
                  <p className="text-xs text-slate-400">potenziale</p>
                </div>
              </div>
              <button
                onClick={() => onExport(item.azione_segment)}
                className="mt-3 flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                <Download size={12} />
                {item.azione_label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Qualità database ──────────────────────────────────────────────────────────

function QualitaStrip({ qualita }) {
  const metrics = [
    { label: "Email raccolte", value: qualita.email_pct, suffix: "%" },
    { label: "Consensi marketing", value: qualita.consenso_pct, suffix: "%" },
    { label: "Fonti attive", value: Math.round((qualita.fonti_attive / 3) * 100), suffix: "%" },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Qualità Database
        </p>
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full ${
            qualita.score >= 70
              ? "bg-emerald-50 text-emerald-700"
              : qualita.score >= 40
              ? "bg-amber-50 text-amber-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {qualita.score}/100
        </span>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-4">
        {metrics.map((m) => (
          <div key={m.label}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">{m.label}</span>
              <span className="font-bold text-slate-700">{m.value}{m.suffix}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${m.value}%`,
                  backgroundColor:
                    m.value >= 70 ? "#10b981" : m.value >= 40 ? "#d97706" : "#ef4444",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {qualita.issues.length > 0 && (
        <div className="space-y-1.5 pt-3 border-t border-slate-100">
          {qualita.issues.map((issue, i) => (
            <div key={i} className="flex items-start gap-2">
              <AlertTriangle size={11} className="text-amber-400 shrink-0 mt-0.5" />
              <span className="text-xs text-slate-500">{issue}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Azioni settimana ──────────────────────────────────────────────────────────

function AzioniSettimana({ azioni }) {
  if (!azioni.length) return null;

  const URGENCY = {
    alta: { bar: "bg-red-500", label: "Urgente" },
    media: { bar: "bg-amber-400", label: "Questa settimana" },
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={15} className="text-primary-600" />
        <h2 className="text-sm font-bold text-slate-700">Cosa fare adesso</h2>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Azioni in ordine di priorità — presto le riceverai automaticamente
      </p>

      <div className="space-y-2">
        {azioni.map((a, i) => {
          const u = URGENCY[a.urgenza] ?? URGENCY.media;
          return (
            <div
              key={i}
              className="flex items-center gap-4 rounded-lg border border-slate-100 px-4 py-3 hover:bg-slate-50 transition-colors"
            >
              <div className={`w-1 h-8 rounded-full ${u.bar} shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">{a.azione}</p>
                <p className="text-xs text-slate-400 mt-0.5">{u.label}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-slate-600">{a.valore}</p>
              </div>
              <ChevronRight size={14} className="text-slate-300 shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Pagina ────────────────────────────────────────────────────────────────────

export default function Insights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchInsights()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async (segment) => {
    try {
      await exportFans(segment);
      setToast(`Export "${segment}" avviato`);
    } catch {
      setToast("Errore durante l'export");
    } finally {
      setTimeout(() => setToast(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || data.empty || !data.kpi?.total_fans) {
    return (
      <EmptyState
        title="Intelligence in attesa di dati"
        subtitle="Carica i CSV di abbonati, biglietteria e shop per ricevere insights automatici sui tuoi tifosi."
      />
    );
  }

  return (
    <div className="flex-1 p-8 overflow-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Intelligence</h1>
        <p className="text-slate-400 text-sm mt-1">{data.summary}</p>
      </div>

      {/* Alert banner */}
      <AlertBanner kpi={data.kpi} />

      {/* Hero row: score + KPI + segment bars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Score */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 flex items-center justify-center">
          <ScoreCircle score={data.kpi.data_score} />
        </div>

        {/* KPI */}
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <KpiStrip kpi={data.kpi} />
        </div>

        {/* Segment bars */}
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <SegmentBars counts={data.segment_counts} />
        </div>
      </div>

      {/* Revenue Watch + Opportunità */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RevenueWatch data={data.revenue_watch} onExport={handleExport} />
        <Opportunita items={data.opportunita} onExport={handleExport} />
      </div>

      {/* Qualità database */}
      <div className="mb-6">
        <QualitaStrip qualita={data.qualita} />
      </div>

      {/* Azioni settimana */}
      <AzioniSettimana azioni={data.azioni_settimana} />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
