import { useEffect, useState } from "react";
import {
  Calendar, Home, Plane, Plus, Trash2, Upload as UploadIcon,
  Download, Trophy, Star, Users, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  fetchPartite, addPartita, deletePartita, uploadPartite,
  fetchBehavioral, API_URL,
} from "../api/client";

// ── utils ─────────────────────────────────────────────────────────────────────

const fmtDate = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("it-IT", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
  });

const BADGE_STYLE = {
  "Ultras":            { bg: "bg-violet-100", text: "text-violet-700", dot: "bg-violet-500" },
  "Fedele trasferta":  { bg: "bg-blue-100",   text: "text-blue-700",   dot: "bg-blue-500" },
  "Casa-only":         { bg: "bg-slate-100",  text: "text-slate-600",  dot: "bg-slate-400" },
  "Occasionale":       { bg: "bg-amber-100",  text: "text-amber-700",  dot: "bg-amber-400" },
  "Nessun dato trasferta": { bg: "bg-slate-50", text: "text-slate-400", dot: "bg-slate-300" },
};

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color = "text-slate-600" }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 px-5 py-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={13} className={color} />
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}

// ── Form aggiungi partita ─────────────────────────────────────────────────────

function AddForm({ onAdded }) {
  const [open, setOpen]   = useState(false);
  const [form, setForm]   = useState({ data: "", avversario: "", casa_trasferta: "casa", competizione: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr]     = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.data || !form.avversario) return;
    setSaving(true);
    setErr(null);
    try {
      await addPartita({ ...form, competizione: form.competizione || null });
      setForm({ data: "", avversario: "", casa_trasferta: "casa", competizione: "" });
      setOpen(false);
      onAdded();
    } catch {
      setErr("Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Plus size={15} className="text-primary-600" />
          Aggiungi partita manualmente
        </div>
        {open ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
      </button>

      {open && (
        <form onSubmit={submit} className="border-t border-slate-100 px-5 py-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Data *</label>
              <input type="date" required value={form.data}
                onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-300" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Casa / Trasferta *</label>
              <select value={form.casa_trasferta}
                onChange={e => setForm(f => ({ ...f, casa_trasferta: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-300">
                <option value="casa">Casa</option>
                <option value="trasferta">Trasferta</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Avversario *</label>
              <input type="text" required placeholder="es. Ascoli" value={form.avversario}
                onChange={e => setForm(f => ({ ...f, avversario: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-300" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Competizione</label>
              <input type="text" placeholder="es. Serie B" value={form.competizione}
                onChange={e => setForm(f => ({ ...f, competizione: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-300" />
            </div>
          </div>
          {err && <p className="text-xs text-red-500 mb-2">{err}</p>}
          <button type="submit" disabled={saving}
            className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-40">
            {saving ? "Salvataggio..." : "Salva partita"}
          </button>
        </form>
      )}
    </div>
  );
}

// ── Upload CSV ────────────────────────────────────────────────────────────────

function UploadCsv({ onUploaded }) {
  const [status, setStatus] = useState(null);
  const [msg, setMsg]       = useState("");

  const handle = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatus("loading");
    try {
      const res = await uploadPartite(file);
      setStatus("success");
      setMsg(res.message);
      onUploaded();
    } catch {
      setStatus("error");
      setMsg("Errore durante l'importazione");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <p className="text-sm font-semibold text-slate-700">Importa da CSV</p>
        <p className="text-xs text-slate-400 mt-0.5">Formato: data, avversario, casa_trasferta, competizione</p>
        {status === "success" && <p className="text-xs text-emerald-600 mt-1">{msg}</p>}
        {status === "error"   && <p className="text-xs text-red-500 mt-1">{msg}</p>}
      </div>
      <div className="flex items-center gap-2">
        <a href={`${API_URL}/partite/template`} download
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-2">
          <Download size={12} />
          Template
        </a>
        <label className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer transition-colors">
          <UploadIcon size={12} />
          {status === "loading" ? "Importazione..." : "Carica CSV"}
          <input type="file" accept=".csv" className="hidden" onChange={handle} />
        </label>
      </div>
    </div>
  );
}

// ── Lista partite ─────────────────────────────────────────────────────────────

function MatchList({ partite, onDelete }) {
  const future = partite.filter(p => !p.passata);
  const past   = partite.filter(p => p.passata);

  const Row = ({ p }) => (
    <div className={`flex items-center gap-4 px-4 py-3 rounded-lg border transition-colors ${
      p.passata ? "border-slate-100 bg-white opacity-60" : "border-primary-100 bg-primary-50"
    }`}>
      <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
        p.casa_trasferta === "casa" ? "bg-emerald-100" : "bg-blue-100"
      }`}>
        {p.casa_trasferta === "casa"
          ? <Home size={14} className="text-emerald-600" />
          : <Plane size={14} className="text-blue-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 truncate">vs {p.avversario}</p>
        <p className="text-xs text-slate-400 mt-0.5">{fmtDate(p.data)}{p.competizione ? ` · ${p.competizione}` : ""}</p>
      </div>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
        p.casa_trasferta === "casa"
          ? "bg-emerald-100 text-emerald-700"
          : "bg-blue-100 text-blue-700"
      }`}>
        {p.casa_trasferta === "casa" ? "Casa" : "Trasferta"}
      </span>
      <button onClick={() => onDelete(p.id)} className="text-slate-300 hover:text-red-400 transition-colors shrink-0">
        <Trash2 size={14} />
      </button>
    </div>
  );

  if (!partite.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 px-5 py-10 text-center">
        <Calendar size={32} className="text-slate-200 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-500">Nessuna partita caricata</p>
        <p className="text-xs text-slate-400 mt-1">Aggiungi le partite per sbloccare l'analisi comportamentale</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {future.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Prossime partite</p>
          <div className="space-y-2">
            {future.map(p => <Row key={p.id} p={p} />)}
          </div>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Partite passate</p>
          <div className="space-y-2">
            {past.map(p => <Row key={p.id} p={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Behavioral — loyalty badges ───────────────────────────────────────────────

function BehavioralSection({ data }) {
  const [showAll, setShowAll] = useState(false);
  if (!data || data.empty) return null;

  const fans = data.fan_scores ?? [];
  const visible = showAll ? fans : fans.slice(0, 8);

  const badgeOrder = ["Ultras", "Fedele trasferta", "Casa-only", "Occasionale", "Nessun dato trasferta"];

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-1">
        <Trophy size={15} className="text-violet-500" />
        <h2 className="text-sm font-bold text-slate-700">Comportamento in trasferta</h2>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Basato su {data.past_away} trasferte giocate su {data.total_away} in calendario
      </p>

      {/* Badge counts */}
      <div className="flex flex-wrap gap-2 mb-5">
        {badgeOrder.map(badge => {
          const count = data.badge_counts?.[badge];
          if (!count) return null;
          const s = BADGE_STYLE[badge] ?? BADGE_STYLE["Occasionale"];
          return (
            <div key={badge} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${s.bg}`}>
              <div className={`w-2 h-2 rounded-full ${s.dot}`} />
              <span className={`text-xs font-semibold ${s.text}`}>{badge}</span>
              <span className={`text-xs font-bold ${s.text}`}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Fan table */}
      {fans.length > 0 && (
        <>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Top tifosi per trasferta</p>
          <div className="rounded-lg border border-slate-100 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-3 py-2 font-semibold text-slate-500">Nome</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-500">Badge</th>
                  <th className="text-center px-3 py-2 font-semibold text-slate-500">Trasferte</th>
                  <th className="text-center px-3 py-2 font-semibold text-slate-500">% Casa</th>
                  <th className="text-center px-3 py-2 font-semibold text-slate-500">% Trasferta</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(f => {
                  const s = BADGE_STYLE[f.badge] ?? BADGE_STYLE["Occasionale"];
                  return (
                    <tr key={f.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium text-slate-700">{f.nome} {f.cognome}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>{f.badge}</span>
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-blue-600">{f.away_attended}</td>
                      <td className="px-3 py-2 text-center text-slate-500">{f.home_rate}%</td>
                      <td className="px-3 py-2 text-center text-slate-500">{f.away_rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {fans.length > 8 && (
            <button onClick={() => setShowAll(v => !v)}
              className="mt-2 text-xs font-medium text-slate-400 hover:text-slate-600 flex items-center gap-1">
              {showAll ? <><ChevronUp size={12} /> Mostra meno</> : <><ChevronDown size={12} /> Vedi tutti ({fans.length})</>}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── Pagina principale ─────────────────────────────────────────────────────────

export default function Calendario() {
  const [partite,    setPartite]    = useState([]);
  const [behavioral, setBehavioral] = useState(null);
  const [loading,    setLoading]    = useState(true);

  const load = async () => {
    try {
      const [p, b] = await Promise.all([fetchPartite(), fetchBehavioral()]);
      setPartite(p);
      setBehavioral(b);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    await deletePartita(id);
    load();
  };

  const totalHome  = partite.filter(p => p.casa_trasferta === "casa").length;
  const totalAway  = partite.filter(p => p.casa_trasferta === "trasferta").length;
  const prossima   = partite.filter(p => !p.passata).sort((a, b) => a.data.localeCompare(b.data))[0];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Calendario Partite</h1>
        <p className="text-slate-400 text-sm mt-1">
          Registra le partite per sbloccare l'analisi comportamentale dei tifosi
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Partite totali"  value={partite.length}  icon={Calendar} />
        <StatCard label="In casa"         value={totalHome}       icon={Home}  color="text-emerald-600" />
        <StatCard label="In trasferta"    value={totalAway}       icon={Plane} color="text-blue-600" />
        <StatCard
          label="Prossima"
          value={prossima ? `vs ${prossima.avversario}` : "—"}
          icon={Trophy}
          color="text-primary-600"
        />
      </div>

      {/* Aggiungi + upload */}
      <div className="space-y-3 mb-6">
        <AddForm onAdded={load} />
        <UploadCsv onUploaded={load} />
      </div>

      {/* Lista partite */}
      <div className="mb-6">
        <MatchList partite={partite} onDelete={handleDelete} />
      </div>

      {/* Behavioral */}
      {behavioral && !behavioral.empty && (
        <BehavioralSection data={behavioral} />
      )}

      {partite.length > 0 && (!behavioral || behavioral.empty) && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 flex items-center gap-3">
          <Star size={16} className="text-amber-400 shrink-0" />
          <p className="text-sm text-slate-500">
            Carica la biglietteria per vedere chi segue la squadra in trasferta e assegnare i loyalty badge.
          </p>
        </div>
      )}
    </div>
  );
}
