import { useEffect, useState } from "react";
import {
  ShieldAlert, TrendingUp, Download, Users, Star,
  AlertTriangle, ChevronRight, Sparkles, ChevronDown, ChevronUp,
} from "lucide-react";
import { fetchInsights, fetchFansBySegment, exportFans } from "../api/client";
import EmptyState from "../components/EmptyState";

// ── utils ─────────────────────────────────────────────────────────────────────

function fmt(n) {
  return new Intl.NumberFormat("it-IT").format(Math.round(n ?? 0));
}
function fmtEur(n) {
  if (!n) return "—";
  return `€${fmt(n)}`;
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Business Score circle ─────────────────────────────────────────────────────

const scoreColor = (s) =>
  s >= 75 ? "#10b981" : s >= 50 ? "#f59e0b" : s >= 25 ? "#ef4444" : "#dc2626";
const scoreLabel = (s) =>
  s >= 75 ? "Buona salute" : s >= 50 ? "Attenzione" : s >= 25 ? "A rischio" : "Critico";

function BusinessScore({ score }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = scoreColor(score);

  return (
    <div className="flex flex-col items-center justify-center h-full py-4">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
          <circle cx="64" cy="64" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
          <circle
            cx="64" cy="64" r={r}
            fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1.2s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black leading-none" style={{ color }}>{score}</span>
          <span className="text-xs text-slate-400 font-medium">/100</span>
        </div>
      </div>
      <p className="text-sm font-bold text-slate-700 mt-3">Salute del club</p>
      <p className="text-xs font-semibold mt-0.5" style={{ color }}>{scoreLabel(score)}</p>
      <p className="text-xs text-slate-400 mt-2 text-center max-w-[140px] leading-relaxed">
        Basato su attività tifosi, revenue a rischio e potenziale di crescita
      </p>
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
            {Math.round(pct * 100)}% della revenue storica a rischio perdita permanente
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
    { label: "Revenue a rischio", value: fmtEur(kpi.revenue_a_rischio), icon: ShieldAlert, color: kpi.revenue_a_rischio > 0 ? "text-red-600" : "text-slate-400" },
    { label: "Opportunità stimata", value: fmtEur(kpi.opportunita_stimata), icon: TrendingUp, color: kpi.opportunita_stimata > 0 ? "text-emerald-600" : "text-slate-400" },
    { label: "Super-fan", value: fmt(kpi.super_fans), icon: Star, color: "text-violet-600" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 h-full content-center">
      {items.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
          <div className="flex items-center gap-1.5 mb-1">
            <Icon size={12} className={color} />
            <span className="text-xs text-slate-400">{label}</span>
          </div>
          <p className={`text-xl font-black leading-tight ${color}`}>{value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Qualità pills ─────────────────────────────────────────────────────────────

function QualitaPills({ qualita }) {
  const pills = [
    { label: "Email", value: qualita.email_pct, suffix: "%" },
    { label: "Consensi", value: qualita.consenso_pct, suffix: "%" },
    { label: "Fonti", value: qualita.fonti_attive, suffix: "/3" },
  ];
  return (
    <div className="flex flex-col justify-center h-full gap-3">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Qualità Dati</p>
      {pills.map((p) => {
        const pct = p.suffix === "/3" ? (p.value / 3) * 100 : p.value;
        const color = pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444";
        return (
          <div key={p.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500">{p.label}</span>
              <span className="font-bold text-slate-700">{p.value}{p.suffix}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Segment bars ──────────────────────────────────────────────────────────────

const SEG_COLOR = {
  VIP: "#7c3aed", Fedele: "#059669", "A rischio": "#d97706",
  Dormiente: "#dc2626", Nuovo: "#2563eb", Occasionale: "#6b7280",
};

function SegmentBars({ counts }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (!total) return null;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return (
    <div className="flex flex-col justify-center h-full gap-2.5">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Segmenti</p>
      {sorted.map(([seg, count]) => (
        <div key={seg} className="flex items-center gap-3">
          <span className="text-xs text-slate-500 w-20 shrink-0">{seg}</span>
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(count / total) * 100}%`, backgroundColor: SEG_COLOR[seg] ?? "#6b7280" }} />
          </div>
          <span className="text-xs font-bold text-slate-600 w-6 text-right">{count}</span>
        </div>
      ))}
    </div>
  );
}

// ── Fan mini-list (espandibile) ───────────────────────────────────────────────

function FanList({ segment }) {
  const [fans, setFans] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!open && fans === null) {
      setLoading(true);
      try {
        const data = await fetchFansBySegment(segment);
        setFans(data.slice(0, 10)); // max 10 in preview
      } finally {
        setLoading(false);
      }
    }
    setOpen((v) => !v);
  };

  return (
    <div className="mt-3">
      <button
        onClick={toggle}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
      >
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {open ? "Nascondi tifosi" : "Vedi chi sono"}
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-3 text-xs text-slate-400 text-center">Caricamento...</div>
          ) : !fans?.length ? (
            <div className="p-3 text-xs text-slate-400 text-center">Nessun tifoso trovato</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-3 py-2 font-semibold text-slate-500">Nome</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-500">Email</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-500">Ultima attività</th>
                  <th className="text-right px-3 py-2 font-semibold text-slate-500">Spesa</th>
                </tr>
              </thead>
              <tbody>
                {fans.map((f) => (
                  <tr key={f.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-700">{f.nome} {f.cognome}</td>
                    <td className="px-3 py-2 text-slate-400">{f.email ?? "—"}</td>
                    <td className="px-3 py-2 text-slate-400">{fmtDate(f.last_activity)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-700">{fmtEur(f.total_spend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
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
          <div className="space-y-4">
            {data.items.map((item) => (
              <div key={item.segment} className={`rounded-lg border p-4 ${item.severity === "high" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.sublabel}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-lg font-black ${item.severity === "high" ? "text-red-600" : "text-amber-600"}`}>{fmtEur(item.revenue)}</p>
                    <p className="text-xs text-slate-400">{item.count} tifosi</p>
                  </div>
                </div>
                <FanList segment={item.segment} />
                <button
                  onClick={() => onExport(item.segment)}
                  className="mt-3 flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
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
        <div className="space-y-4">
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
              <FanList segment={item.azione_segment} />
              <button
                onClick={() => onExport(item.azione_segment)}
                className="mt-3 flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
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

// ── Cosa fare adesso ──────────────────────────────────────────────────────────

function AzioniSettimana({ azioni, onExport }) {
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
        Ogni azione esporta direttamente il segmento giusto — presto porterà alla sezione Marketing
      </p>
      <div className="space-y-2">
        {azioni.map((a, i) => {
          const u = URGENCY[a.urgenza] ?? URGENCY.media;
          return (
            <button
              key={i}
              onClick={() => onExport(a.segment)}
              className="w-full flex items-center gap-4 rounded-lg border border-slate-100 px-4 py-3 hover:bg-slate-50 hover:border-slate-200 transition-colors text-left"
            >
              <div className={`w-1 h-8 rounded-full ${u.bar} shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700">{a.azione}</p>
                <p className="text-xs text-slate-400 mt-0.5">{u.label}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-slate-600">{a.valore}</p>
              </div>
              <ChevronRight size={14} className="text-slate-300 shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Pagina principale ─────────────────────────────────────────────────────────

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
    if (!segment) return;
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Intelligence</h1>
        <p className="text-slate-400 text-sm mt-1">{data.summary}</p>
      </div>

      <AlertBanner kpi={data.kpi} />

      {/* Hero row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <BusinessScore score={data.kpi.business_score} />
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <KpiStrip kpi={data.kpi} />
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <SegmentBars counts={data.segment_counts} />
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <QualitaPills qualita={data.qualita} />
        </div>
      </div>

      {/* Revenue Watch + Opportunità */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RevenueWatch data={data.revenue_watch} onExport={handleExport} />
        <Opportunita items={data.opportunita} onExport={handleExport} />
      </div>

      {/* Cosa fare adesso */}
      <AzioniSettimana azioni={data.azioni_settimana} onExport={handleExport} />

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
