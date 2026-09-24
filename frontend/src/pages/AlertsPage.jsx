import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Archive, BellOff, CalendarX, Upload } from "lucide-react";
import { fetchAlertsContext, fetchAlertsRaw } from "../api/client";

// ── Config severity ───────────────────────────────────────────────────────────

const SEV_CFG = {
  CRITICA: { icon: "🚨", label: "Critica",  color: "#ef4444", bg: "#fef2f2", border: "#fca5a5", order: 0 },
  ALTA:    { icon: "⚠️", label: "Alta",     color: "#f97316", bg: "#fff7ed", border: "#fdba74", order: 1 },
  MEDIA:   { icon: "📉", label: "Media",    color: "#eab308", bg: "#fefce8", border: "#fde047", order: 2 },
  BASSA:   { icon: "ℹ️", label: "Bassa",   color: "#94a3b8", bg: "#f8fafc", border: "#cbd5e1", order: 3 },
};

const TABS = [
  { key: "tutte",   label: "Tutte" },
  { key: "CRITICA", label: "🚨 Critiche" },
  { key: "ALTA",    label: "⚠️ Alte" },
  { key: "MEDIA",   label: "📉 Medie" },
  { key: "BASSA",   label: "ℹ️ Basse" },
];

// ── localStorage archive ──────────────────────────────────────────────────────

const ARCHIVE_KEY = "faniq_archived_alerts";

function getArchived() {
  try { return new Set(JSON.parse(localStorage.getItem(ARCHIVE_KEY) || "[]")); }
  catch { return new Set(); }
}

function addArchived(id) {
  const set = getArchived();
  set.add(id);
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify([...set]));
}

// ── Unique alert id: fan_id + severity ────────────────────────────────────────
function alertId(item) {
  return `${item.fan_id}__${item.subscription_anomaly?.severity}__${item.subscription_anomaly?.consecutive_absences}`;
}

// ── Contatori per severity ────────────────────────────────────────────────────
function counts(items) {
  const c = { CRITICA: 0, ALTA: 0, MEDIA: 0, BASSA: 0 };
  items.forEach((i) => { if (c[i.subscription_anomaly.severity] !== undefined) c[i.subscription_anomaly.severity]++; });
  return c;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="animate-pulse bg-white rounded-xl border border-slate-100 p-4 flex gap-4">
          <div className="w-10 h-10 bg-slate-100 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-100 rounded w-1/3" />
            <div className="h-3 bg-slate-100 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Alert card ────────────────────────────────────────────────────────────────
function AlertCard({ item, onArchive }) {
  const anomaly = item.subscription_anomaly;
  const cfg = SEV_CFG[anomaly.severity] ?? SEV_CFG.BASSA;
  const nome = [item.nome, item.cognome].filter(Boolean).join(" ") || `Fan #${item.fan_id}`;
  const email = item.email;

  const mailtoHref = email
    ? `mailto:${email}?subject=${encodeURIComponent("Ti aspettiamo allo stadio")}`
    : null;

  return (
    <div
      className="bg-white rounded-xl border shadow-sm p-4 flex items-start gap-4 transition-all"
      style={{ borderColor: cfg.border, borderLeftWidth: "4px" }}
    >
      {/* Icona severity */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
        style={{ backgroundColor: cfg.bg }}
      >
        {cfg.icon}
      </div>

      {/* Corpo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="font-semibold text-slate-800 text-sm">{nome}</span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ color: cfg.color, backgroundColor: cfg.bg }}
          >
            {cfg.label}
          </span>
          <span className="text-xs text-slate-400">
            {anomaly.consecutive_absences} partite consecutive
          </span>
        </div>
        {/* Messaggio direttamente dall'API — già in italiano */}
        <p className="text-sm text-slate-600 leading-snug mt-1">{anomaly.message}</p>
      </div>

      {/* Azioni */}
      <div className="flex items-center gap-2 shrink-0">
        {mailtoHref ? (
          <a
            href={mailtoHref}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Mail size={13} />
            Contatta
          </a>
        ) : (
          <span className="text-xs text-slate-300 px-3 py-1.5">No email</span>
        )}
        <button
          onClick={() => onArchive(item)}
          title="Archivia — non mostrerà più questo avviso"
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <Archive size={13} />
          Archivia
        </button>
      </div>
    </div>
  );
}

// ── Pagina principale ─────────────────────────────────────────────────────────

export default function AlertsPage() {
  const [rawItems, setRawItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("tutte");
  const [archived, setArchived] = useState(() => getArchived());

  const [context, setContext] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAlertsRaw()
      .then(setRawItems)
      .catch((err) => setError(err.userMessage || "Impossibile caricare i dati. Riprova."))
      .finally(() => setLoading(false));
    // Solo per spiegare una pagina vuota: se fallisce resta il messaggio generico.
    fetchAlertsContext().then(setContext).catch(() => {});
  }, []);

  // Gli alert riguardano solo gli abbonati della stagione in corso: senza di loro
  // la pagina è vuota per mancanza di dati, non perché va tutto bene.
  const noCurrentSubscribers = context?.active_subscribers === 0;

  // Filtra archiviati
  const activeItems = useMemo(
    () => rawItems.filter((i) => !archived.has(alertId(i))),
    [rawItems, archived]
  );

  // Ordina: severity order → consecutive_absences decrescente
  const sorted = useMemo(
    () =>
      [...activeItems].sort((a, b) => {
        const oa = SEV_CFG[a.subscription_anomaly.severity]?.order ?? 9;
        const ob = SEV_CFG[b.subscription_anomaly.severity]?.order ?? 9;
        if (oa !== ob) return oa - ob;
        return b.subscription_anomaly.consecutive_absences - a.subscription_anomaly.consecutive_absences;
      }),
    [activeItems]
  );

  const filtered = activeTab === "tutte"
    ? sorted
    : sorted.filter((i) => i.subscription_anomaly.severity === activeTab);

  const c = counts(activeItems);

  function handleArchive(item) {
    const id = alertId(item);
    addArchived(id);
    setArchived((prev) => new Set([...prev, id]));   // ottimistic update immediato
  }

  // ── Header contatori ───────────────────────────────────────────────────────
  const counterParts = [
    c.CRITICA > 0 && `${c.CRITICA} ${c.CRITICA === 1 ? "Critica" : "Critiche"}`,
    c.ALTA    > 0 && `${c.ALTA} ${c.ALTA === 1 ? "Alta" : "Alte"}`,
    c.MEDIA   > 0 && `${c.MEDIA} ${c.MEDIA === 1 ? "Media" : "Medie"}`,
    c.BASSA   > 0 && `${c.BASSA} ${c.BASSA === 1 ? "Bassa" : "Basse"}`,
  ].filter(Boolean);

  return (
    <div className="flex-1 p-8 overflow-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Da contattare</h1>
        <p className="text-slate-500 text-sm mt-1">
          {loading
            ? "Caricamento..."
            : counterParts.length > 0
            ? counterParts.join(" · ")
            : noCurrentSubscribers
            ? `Nessun abbonato per la stagione ${context.current_season}.`
            : "Nessuna situazione da gestire al momento."}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && <Skeleton />}

      {/* Contenuto */}
      {!loading && !error && (
        <>
          {activeItems.length === 0 && noCurrentSubscribers ? (
            <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto">
              <CalendarX size={40} className="text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium">
                Nessun abbonamento per la stagione {context.current_season}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                {context.latest_season
                  ? `L'ultima stagione caricata è la ${context.latest_season}. `
                  : "Non hai ancora caricato abbonamenti. "}
                Gli avvisi riguardano solo gli abbonati della stagione in corso: carica il loro file per attivarli.
              </p>
              <button
                onClick={() => navigate("/upload")}
                className="mt-5 inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <Upload size={16} />
                Carica abbonamenti
              </button>
            </div>
          ) : activeItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <BellOff size={40} className="text-slate-200 mb-4" />
              <p className="text-slate-500 font-medium">Tutto sotto controllo</p>
              <p className="text-slate-400 text-sm mt-1">Non ci sono abbonati con assenze prolungate.</p>
            </div>
          ) : (
            <>
              {/* Tab filtro */}
              <div className="flex gap-2 flex-wrap mb-5">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      activeTab === t.key
                        ? "bg-slate-800 text-white border-slate-800"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {t.label}
                    {t.key !== "tutte" && c[t.key] > 0 && (
                      <span className="ml-1.5 text-xs opacity-70">({c[t.key]})</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Lista */}
              {filtered.length === 0 ? (
                <p className="text-slate-400 text-sm py-8 text-center">
                  Nessun tifoso in questa categoria.
                </p>
              ) : (
                <div className="space-y-3">
                  {filtered.map((item) => (
                    <AlertCard key={alertId(item)} item={item} onArchive={handleArchive} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
