import { useEffect, useState } from "react";
import {
  ShieldAlert, TrendingUp, Download, Users, Star,
  ChevronRight, Sparkles, ChevronDown, ChevronUp,
  CalendarDays, Megaphone,
} from "lucide-react";
import { fetchInsights, exportFans, fetchPartite, fetchPredizione } from "../api/client";
import EmptyState from "../components/EmptyState";

// ── utils ─────────────────────────────────────────────────────────────────────

const fmt    = (n) => new Intl.NumberFormat("it-IT").format(Math.round(n ?? 0));
const fmtEur = (n) => n ? `€${fmt(n)}` : "—";
const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })
  : "—";

// ── Business Score ────────────────────────────────────────────────────────────

const scoreColor = (s) => s >= 75 ? "#10b981" : s >= 50 ? "#f59e0b" : s >= 25 ? "#ef4444" : "#dc2626";
const scoreLabel = (s) => s >= 75 ? "Buona salute" : s >= 50 ? "Attenzione" : s >= 25 ? "A rischio" : "Critico";

function BusinessScore({ score }) {
  const r    = 52;
  const circ = 2 * Math.PI * r;
  const off  = circ * (1 - score / 100);
  const col  = scoreColor(score);

  return (
    <div className="flex flex-col items-center justify-center py-2">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
          <circle cx="64" cy="64" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
          <circle cx="64" cy="64" r={r} fill="none" stroke={col} strokeWidth="10"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off}
            style={{ transition: "stroke-dashoffset 1.2s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black leading-none" style={{ color: col }}>{score}</span>
          <span className="text-xs text-slate-400 font-medium">/100</span>
        </div>
      </div>
      <p className="text-sm font-bold text-slate-700 mt-3">Salute del club</p>
      <p className="text-xs font-semibold mt-0.5" style={{ color: col }}>{scoreLabel(score)}</p>
      <p className="text-xs text-slate-400 mt-2 text-center leading-relaxed px-2">
        Attività tifosi · Revenue a rischio · Potenziale di crescita
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
            {Math.round(pct * 100)}% della revenue storica rischia di andare persa definitivamente
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
    { label: "Tifosi totali",     value: fmt(kpi.total_fans),           icon: Users,      color: "text-slate-600" },
    { label: "Revenue a rischio", value: fmtEur(kpi.revenue_a_rischio), icon: ShieldAlert, color: kpi.revenue_a_rischio > 0 ? "text-red-600" : "text-slate-400" },
    { label: "Opportunità",       value: fmtEur(kpi.opportunita_stimata),icon: TrendingUp, color: kpi.opportunita_stimata > 0 ? "text-emerald-600" : "text-slate-400" },
    { label: "Super-fan",         value: fmt(kpi.super_fans),           icon: Star,       color: "text-violet-600" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
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

// ── Segment bars ──────────────────────────────────────────────────────────────

const SEG_COLOR = {
  VIP: "#7c3aed", Fedele: "#059669", "A rischio": "#d97706",
  Dormiente: "#dc2626", Nuovo: "#2563eb", Occasionale: "#6b7280",
};

function SegmentBars({ counts }) {
  const total  = Object.values(counts).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return (
    <div className="flex flex-col justify-center gap-2.5">
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

// ── Fan table (inline, dati già inclusi) ──────────────────────────────────────

function FanTable({ fans, label }) {
  const [open, setOpen] = useState(false);
  if (!fans?.length) return null;

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
      >
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {open ? "Nascondi" : `Vedi chi sono (${fans.length}${fans.length === 10 ? "+" : ""})`}
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-3 py-2 font-semibold text-slate-500">Nome</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-500 hidden sm:table-cell">Email</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-500">Ultima att.</th>
                <th className="text-right px-3 py-2 font-semibold text-slate-500">Spesa</th>
              </tr>
            </thead>
            <tbody>
              {fans.map((f) => (
                <tr key={f.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-700">{f.nome} {f.cognome}</td>
                  <td className="px-3 py-2 text-slate-400 hidden sm:table-cell">{f.email ?? "—"}</td>
                  <td className="px-3 py-2 text-slate-400">{fmtDate(f.last_activity)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-700">{fmtEur(f.total_spend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Revenue Watch con sotto-cluster ──────────────────────────────────────────

function RevenueWatch({ data, onExport }) {
  if (!data.sotto_cluster?.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 p-6">
        <SectionTitle icon={ShieldAlert} color="text-red-500" title="Revenue Watch" sub="Revenue storica a rischio perdita permanente" />
        <p className="text-sm text-slate-400 mt-4">Nessuna criticità rilevata — ottimo.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6">
      <SectionTitle icon={ShieldAlert} color="text-red-500" title="Revenue Watch" sub="Revenue storica a rischio, divisa per urgenza di intervento" />

      <div className="flex items-baseline justify-between rounded-lg bg-red-50 border border-red-100 px-4 py-3 mt-4 mb-5">
        <span className="text-xs font-semibold text-red-700">Totale a rischio · {data.fans_count} tifosi</span>
        <span className="text-2xl font-black text-red-600">{fmtEur(data.totale_a_rischio)}</span>
      </div>

      <div className="space-y-4">
        {data.sotto_cluster.map((cluster) => (
          <div key={cluster.nome} className="rounded-lg border p-4"
            style={{ borderColor: cluster.color + "33", backgroundColor: cluster.color + "0d" }}>

            {/* Header cluster */}
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: cluster.color }} />
                <p className="text-sm font-bold text-slate-800">{cluster.nome}</p>
                <span className="text-xs text-slate-400">· {cluster.count} tifosi</span>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-black" style={{ color: cluster.color }}>{fmtEur(cluster.revenue)}</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 ml-4 leading-relaxed">{cluster.consiglio}</p>

            <div className="ml-4">
              <FanTable fans={cluster.fans} />
            </div>

            <button
              onClick={() => onExport(cluster.nome === "A rischio" ? "A rischio" : "Dormiente")}
              className="mt-3 ml-4 flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Download size={12} />
              Esporta questo gruppo
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Opportunità ───────────────────────────────────────────────────────────────

function Opportunita({ items, onExport }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6">
      <SectionTitle icon={TrendingUp} color="text-emerald-500" title="Opportunità" sub="Revenue aggiuntiva stimata con azioni mirate" />

      {!items.length ? (
        <p className="text-sm text-slate-400 mt-4">Carica più dati per sbloccare opportunità.</p>
      ) : (
        <div className="space-y-4 mt-4">
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
              <FanTable fans={item.fans} />
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
  const urgencyBar = { alta: "bg-red-500", media: "bg-amber-400" };
  const urgencyLabel = { alta: "Urgente", media: "Questa settimana" };

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6">
      <SectionTitle icon={Sparkles} color="text-primary-600" title="Cosa fare adesso"
        sub="Ogni azione esporta il segmento giusto — presto porterà direttamente alla sezione Marketing" />
      <div className="space-y-2 mt-4">
        {azioni.map((a, i) => (
          <button key={i} onClick={() => onExport(a.segment)}
            className="w-full flex items-center gap-4 rounded-lg border border-slate-100 px-4 py-3 hover:bg-slate-50 hover:border-slate-200 transition-colors text-left">
            <div className={`w-1 h-8 rounded-full shrink-0 ${urgencyBar[a.urgenza] ?? "bg-slate-300"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700">{a.azione}</p>
              <p className="text-xs text-slate-400 mt-0.5">{urgencyLabel[a.urgenza]}</p>
            </div>
            <p className="text-xs font-bold text-slate-600 shrink-0">{a.valore}</p>
            <ChevronRight size={14} className="text-slate-300 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── helper UI ─────────────────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, color, title, sub }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon size={15} className={color} />
        <h2 className="text-sm font-bold text-slate-700">{title}</h2>
      </div>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Predizione Presenze ───────────────────────────────────────────────────────

const TIER_ORDER = ["alta", "media", "bassa", "nessun_dato"];

function TierRow({ tier, label, color, count, prob, fans }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border" style={{ borderColor: color + "33", backgroundColor: color + "0d" }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <div>
            <p className="text-sm font-bold text-slate-800">{label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{count} tifosi{prob > 0 ? ` · probabilità ~${prob}%` : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl font-black" style={{ color }}>{count}</span>
          {count > 0 && (open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />)}
        </div>
      </button>

      {open && fans?.length > 0 && (
        <div className="px-4 pb-4">
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-3 py-2 font-semibold text-slate-500">Nome</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-500 hidden sm:table-cell">Segmento</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-500 hidden sm:table-cell">Email</th>
                  <th className="text-right px-3 py-2 font-semibold text-slate-500">Presenze %</th>
                </tr>
              </thead>
              <tbody>
                {fans.map((f) => (
                  <tr key={f.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-700">{f.nome} {f.cognome}</td>
                    <td className="px-3 py-2 text-slate-400 hidden sm:table-cell">{f.segment}</td>
                    <td className="px-3 py-2 text-slate-400 hidden sm:table-cell">{f.email ?? "—"}</td>
                    <td className="px-3 py-2 text-right font-bold" style={{ color }}>
                      {f.rate != null ? `${f.rate}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {count > fans.length && (
              <p className="text-xs text-slate-400 px-3 py-2 border-t border-slate-100">
                + altri {count - fans.length} tifosi non mostrati
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PredizionPresenze() {
  const [partite, setPartite]       = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [pred, setPred]             = useState(null);
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    fetchPartite()
      .then((rows) => {
        const future = rows.filter((p) => !p.passata);
        setPartite(future);
      })
      .catch(() => setPartite([]));
  }, []);

  useEffect(() => {
    if (!selectedId) { setPred(null); return; }
    setLoading(true);
    fetchPredizione(selectedId)
      .then(setPred)
      .catch(() => setPred(null))
      .finally(() => setLoading(false));
  }, [selectedId]);

  const fmtData = (iso) =>
    new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <SectionTitle
          icon={CalendarDays}
          color="text-blue-500"
          title="Predizione Presenze"
          sub="Chi verrà alla prossima partita, basato sullo storico reale di ogni tifoso"
        />
      </div>

      {/* Selettore partita */}
      {partite.length === 0 ? (
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-5 text-center">
          <CalendarDays size={22} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-500">Nessuna partita futura in calendario</p>
          <p className="text-xs text-slate-400 mt-1">Carica il calendario dalla sezione <span className="font-semibold">Carica dati</span> per abilitare le predizioni.</p>
        </div>
      ) : (
        <>
          <select
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-5"
          >
            <option value="">— Seleziona una partita —</option>
            {partite.map((p) => (
              <option key={p.id} value={p.id}>
                {fmtData(p.data)} · {p.avversario} ({p.casa_trasferta}){p.competizione ? ` · ${p.competizione}` : ""}
              </option>
            ))}
          </select>

          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && pred && !pred.empty && (
            <>
              {/* Totale previsto */}
              <div className="flex items-center justify-between rounded-xl bg-blue-50 border border-blue-100 px-5 py-4 mb-5">
                <div>
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Presenze stimate</p>
                  <p className="text-xs text-blue-400 mt-0.5">
                    {pred.partita.avversario} · {pred.partita.casa_trasferta} · {fmtData(pred.partita.data)}
                  </p>
                </div>
                <span className="text-4xl font-black text-blue-600">{pred.totale_previsto}</span>
              </div>

              {/* Tier */}
              <div className="space-y-3 mb-5">
                {TIER_ORDER.map((key) => {
                  const t = pred.tiers[key];
                  return (
                    <TierRow
                      key={key}
                      label={t.label}
                      color={t.color}
                      count={t.count}
                      prob={t.prob}
                      fans={t.fans}
                    />
                  );
                })}
              </div>

              {/* CTA Marketing */}
              <div className="rounded-lg border border-dashed border-slate-300 px-4 py-3 flex items-center gap-3">
                <Megaphone size={16} className="text-slate-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-600">Crea campagna per chi probabilmente non viene</p>
                  <p className="text-xs text-slate-400 mt-0.5">Raggiungi i tifosi "Presenza incerta" e "Nessun dato" prima della partita</p>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md shrink-0">Presto</span>
              </div>
            </>
          )}

          {!loading && pred?.empty && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-5 text-center">
              <p className="text-sm font-semibold text-slate-500">Nessun dato comportamentale disponibile</p>
              <p className="text-xs text-slate-400 mt-1">Carica i biglietti con data partita per abilitare le predizioni individuali.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Pagina principale ─────────────────────────────────────────────────────────

export default function Insights() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]   = useState(null);

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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Intelligence</h1>
        <p className="text-slate-400 text-sm mt-1">{data.summary}</p>
      </div>

      {/* 1 — Alert */}
      <AlertBanner kpi={data.kpi} />

      {/* 2 — Come stai */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <BusinessScore score={data.kpi.business_score} />
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <KpiStrip kpi={data.kpi} />
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <SegmentBars counts={data.segment_counts} />
        </div>
      </div>

      {/* 3 — Cosa rischi + Cosa puoi guadagnare */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RevenueWatch data={data.revenue_watch} onExport={handleExport} />
        <Opportunita  items={data.opportunita}  onExport={handleExport} />
      </div>

      {/* 4 — Cosa fai adesso */}
      <AzioniSettimana azioni={data.azioni_settimana} onExport={handleExport} />

      {/* 5 — Predizione presenze */}
      <div className="mt-6">
        <PredizionPresenze />
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
