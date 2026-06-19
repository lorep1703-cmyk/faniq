import { useEffect, useState } from "react";
import {
  AlertTriangle,
  TrendingUp,
  Database,
  Users,
  Euro,
  ShieldAlert,
  Sparkles,
  Download,
  ChevronRight,
} from "lucide-react";
import { fetchInsights } from "../api/client";
import { exportFans } from "../api/client";
import EmptyState from "../components/EmptyState";

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("it-IT").format(Math.round(n));
}

function fmtEur(n) {
  if (n == null || n === 0) return "—";
  return `€${fmt(n)}`;
}

// ── KPI Bar ──────────────────────────────────────────────────────────────────

function KpiBar({ kpi }) {
  const items = [
    { label: "Tifosi totali", value: fmt(kpi.total_fans), icon: Users, color: "text-slate-700" },
    { label: "Revenue storica", value: fmtEur(kpi.total_revenue), icon: Euro, color: "text-slate-700" },
    {
      label: "Revenue a rischio",
      value: fmtEur(kpi.revenue_a_rischio),
      icon: ShieldAlert,
      color: kpi.revenue_a_rischio > 0 ? "text-rose-600" : "text-slate-400",
      bg: kpi.revenue_a_rischio > 0 ? "bg-rose-50 border-rose-100" : "",
    },
    {
      label: "Opportunità stimata",
      value: fmtEur(kpi.opportunita_stimata),
      icon: TrendingUp,
      color: kpi.opportunita_stimata > 0 ? "text-emerald-600" : "text-slate-400",
      bg: kpi.opportunita_stimata > 0 ? "bg-emerald-50 border-emerald-100" : "",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className={`rounded-xl border p-4 bg-white ${item.bg || "border-slate-100"}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon size={14} className={item.color} />
              <span className="text-xs text-slate-400 font-medium">{item.label}</span>
            </div>
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
          </div>
        );
      })}
    </div>
  );
}

// ── Revenue Watch ─────────────────────────────────────────────────────────────

function RevenueWatch({ data, onExport }) {
  if (!data.items.length) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white p-6">
        <SectionHeader icon={ShieldAlert} title="Revenue Watch" color="text-rose-500" />
        <p className="text-sm text-slate-400 mt-3">Nessuna criticità rilevata — ottimo.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-rose-100 bg-white p-6">
      <SectionHeader icon={ShieldAlert} title="Revenue Watch" color="text-rose-500" />
      <p className="text-xs text-slate-400 mt-1 mb-4">
        Revenue storica a rischio di perdita permanente
      </p>

      <div className="mb-4 rounded-lg bg-rose-50 border border-rose-100 px-4 py-3 flex items-baseline justify-between">
        <span className="text-sm text-rose-700 font-medium">Totale a rischio</span>
        <span className="text-2xl font-bold text-rose-600">{fmtEur(data.totale_a_rischio)}</span>
      </div>

      <div className="space-y-3">
        {data.items.map((item) => (
          <div
            key={item.segment}
            className={`rounded-lg border p-4 ${
              item.severity === "high"
                ? "border-rose-200 bg-rose-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.sublabel}</p>
              </div>
              <div className="text-right shrink-0">
                <p
                  className={`text-lg font-bold ${
                    item.severity === "high" ? "text-rose-600" : "text-amber-600"
                  }`}
                >
                  {fmtEur(item.revenue)}
                </p>
                <p className="text-xs text-slate-400">{item.count} tifosi</p>
              </div>
            </div>
            <button
              onClick={() => onExport(item.segment)}
              className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              <Download size={12} />
              Esporta segmento
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Opportunità ───────────────────────────────────────────────────────────────

function Opportunita({ items, onExport }) {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white p-6">
        <SectionHeader icon={TrendingUp} title="Opportunità" color="text-emerald-500" />
        <p className="text-sm text-slate-400 mt-3">
          Carica più dati per sbloccare opportunità di crescita.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-100 bg-white p-6">
      <SectionHeader icon={TrendingUp} title="Opportunità" color="text-emerald-500" />
      <p className="text-xs text-slate-400 mt-1 mb-4">
        Revenue aggiuntiva stimata con azioni mirate
      </p>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.tipo} className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{item.titolo}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.descrizione}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-emerald-600">
                  {fmtEur(item.revenue_stimata)}
                </p>
                <p className="text-xs text-slate-400">potenziale</p>
              </div>
            </div>
            <button
              onClick={() => onExport(item.azione_segment)}
              className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              <Download size={12} />
              {item.azione_label}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Qualità Database ──────────────────────────────────────────────────────────

function QualitaDatabase({ qualita }) {
  const metrics = [
    { label: "Email", value: qualita.email_pct, suffix: "%" },
    { label: "Consensi marketing", value: qualita.consenso_pct, suffix: "%" },
    { label: "Fonti attive", value: Math.round((qualita.fonti_attive / 3) * 100), suffix: "%" },
  ];

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <SectionHeader icon={Database} title="Qualità Database" color="text-slate-500" />
        <span
          className={`text-sm font-bold px-3 py-1 rounded-full ${
            qualita.score >= 70
              ? "bg-emerald-50 text-emerald-600"
              : qualita.score >= 40
              ? "bg-amber-50 text-amber-600"
              : "bg-rose-50 text-rose-600"
          }`}
        >
          {qualita.score}/100
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        {metrics.map((m) => (
          <div key={m.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500">{m.label}</span>
              <span className="font-semibold text-slate-700">
                {m.value}
                {m.suffix}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  m.value >= 70
                    ? "bg-emerald-400"
                    : m.value >= 40
                    ? "bg-amber-400"
                    : "bg-rose-400"
                }`}
                style={{ width: `${m.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {qualita.issues.length > 0 && (
        <div className="space-y-1.5">
          {qualita.issues.map((issue, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-slate-500">
              <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />
              {issue}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Azioni settimana (hint punto 2) ──────────────────────────────────────────

function AzioniSettimana({ azioni }) {
  if (!azioni.length) return null;

  return (
    <div className="rounded-xl border border-primary-100 bg-primary-50 p-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={16} className="text-primary-600" />
        <h2 className="text-sm font-bold text-primary-700">Cosa fare questa settimana</h2>
      </div>
      <p className="text-xs text-primary-400 mb-4">
        Azioni consigliate in ordine di priorità — presto le riceverai direttamente via notifica
      </p>
      <div className="space-y-2">
        {azioni.map((a, i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-white rounded-lg border border-primary-100 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-base">{a.icona}</span>
              <span className="text-sm text-slate-700">{a.azione}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-400">{a.valore}</span>
              <ChevronRight size={14} className="text-slate-300" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── helper UI ─────────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, color }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={16} className={color} />
      <h2 className="text-sm font-bold text-slate-700">{title}</h2>
    </div>
  );
}

// ── Pagina principale ─────────────────────────────────────────────────────────

export default function Insights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportMsg, setExportMsg] = useState(null);

  useEffect(() => {
    fetchInsights()
      .then(setData)
      .catch(() => setError("Impossibile caricare l'analisi"))
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async (segment) => {
    try {
      await exportFans(segment);
      setExportMsg(`Export ${segment} avviato`);
      setTimeout(() => setExportMsg(null), 3000);
    } catch {
      setExportMsg("Errore durante l'export");
      setTimeout(() => setExportMsg(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (data?.empty || !data?.kpi?.total_fans) {
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
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Sparkles size={22} className="text-primary-600" />
          Intelligence
        </h1>
        <p className="text-slate-400 text-sm mt-1">{data.summary}</p>
      </div>

      {/* Export toast */}
      {exportMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg z-50 animate-fade-in">
          {exportMsg}
        </div>
      )}

      {/* KPI Bar */}
      <KpiBar kpi={data.kpi} />

      {/* Revenue Watch + Opportunità */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RevenueWatch data={data.revenue_watch} onExport={handleExport} />
        <Opportunita items={data.opportunita} onExport={handleExport} />
      </div>

      {/* Qualità Database */}
      <div className="mb-6">
        <QualitaDatabase qualita={data.qualita} />
      </div>

      {/* Hint Punto 2 — Azioni settimana */}
      <AzioniSettimana azioni={data.azioni_settimana} />
    </div>
  );
}
