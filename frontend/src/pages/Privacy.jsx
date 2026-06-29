import { useEffect, useState } from "react";
import { ShieldCheck, Trash2, Download, Clock } from "lucide-react";
import {
  fetchConsentSummary,
  fetchDataRetention,
  fetchPrivacyLog,
  fetchAllFans,
  fetchFanGdprData,
  deleteFanGdpr,
  updateFanConsent,
} from "../api/client";

export default function Privacy() {
  const [consent, setConsent] = useState(null);
  const [retention, setRetention] = useState(null);
  const [logs, setLogs] = useState([]);
  const [fans, setFans] = useState([]);
  const [selectedFan, setSelectedFan] = useState("");
  const [exportData, setExportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [consentFeedback, setConsentFeedback] = useState(null); // { type: 'success'|'error', message: string }
  const [consentSaving, setConsentSaving] = useState(null); // 'marketing'|'profilazione'|null

  useEffect(() => {
    Promise.all([
      fetchConsentSummary(),
      fetchDataRetention(),
      fetchPrivacyLog(15),
      fetchAllFans(),
    ])
      .then(([c, r, l, f]) => {
        setConsent(c);
        setRetention(r);
        setLogs(l);
        setFans(f);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    if (!selectedFan) return;
    const data = await fetchFanGdprData(selectedFan);
    setExportData(data);
  };

  const handleConsentChange = async (tipo, nuovoValore) => {
    if (!selectedFan) return;
    setConsentSaving(tipo);
    setConsentFeedback(null);
    try {
      await updateFanConsent(Number(selectedFan), tipo, nuovoValore);
      setFans(fans.map((f) =>
        f.id === Number(selectedFan)
          ? { ...f, [tipo]: nuovoValore }
          : f
      ));
      setConsentFeedback({ type: "success", message: "Consenso aggiornato e registrato nel log privacy." });
    } catch (err) {
      setConsentFeedback({ type: "error", message: err.userMessage || "Errore durante l'aggiornamento del consenso." });
    } finally {
      setConsentSaving(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedFan) return;
    if (!window.confirm("Confermi la cancellazione definitiva di questo tifoso?")) return;
    await deleteFanGdpr(selectedFan);
    setFans(fans.filter((f) => f.id !== Number(selectedFan)));
    setSelectedFan("");
    setExportData(null);
    const l = await fetchPrivacyLog(15);
    setLogs(l);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheck size={24} className="text-primary-600" />
          Privacy & GDPR
        </h1>
        <p className="text-slate-500 text-sm mt-1">Gestione consensi, retention e diritti del tifoso</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Consenso marketing</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {consent?.consenso_marketing?.si ?? 0} Sì
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {consent?.consenso_marketing?.no ?? 0} No · {consent?.consenso_marketing?.non_registrato ?? 0} non registrato
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Contattabili</p>
          <p className="text-2xl font-bold text-primary-600 mt-1">{consent?.contattabili ?? 0}</p>
          <p className="text-xs text-slate-400 mt-1">con email + consenso marketing</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Tifosi totali</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{consent?.total_fans ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-700 mb-4">Diritti del tifoso</h2>
          <div className="space-y-3">
            <select
              value={selectedFan}
              onChange={(e) => { setSelectedFan(e.target.value); setConsentFeedback(null); }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Seleziona un tifoso...</option>
              {fans.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome} {f.cognome} — {f.email || "no email"}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                disabled={!selectedFan}
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-lg"
              >
                <Download size={16} />
                Export GDPR
              </button>
              <button
                onClick={handleDelete}
                disabled={!selectedFan}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-lg"
              >
                <Trash2 size={16} />
                Cancella
              </button>
            </div>
            {exportData && (
              <pre className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-auto max-h-48">
                {JSON.stringify(exportData, null, 2)}
              </pre>
            )}

            {selectedFan && (() => {
              const fan = fans.find((f) => f.id === Number(selectedFan));
              if (!fan) return null;
              return (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Consensi</p>

                  {[
                    { key: "consenso_marketing", label: "Consenso marketing" },
                    { key: "consenso_profilazione", label: "Consenso profilazione" },
                  ].map(({ key, label }) => {
                    const current = fan[key] ?? false;
                    const saving = consentSaving === key;
                    return (
                      <label
                        key={key}
                        className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-slate-200 cursor-pointer select-none transition-colors ${saving ? "opacity-60" : "hover:bg-slate-50"}`}
                      >
                        <span className="text-sm text-slate-700">{label}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          {fan[key] === null || fan[key] === undefined ? (
                            <span className="text-xs text-slate-400 italic">non registrato</span>
                          ) : null}
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => handleConsentChange(key, !current)}
                            aria-label={`${label}: ${current ? "attivo" : "inattivo"}`}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1 ${current ? "bg-emerald-500" : "bg-slate-300"}`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${current ? "translate-x-4" : "translate-x-0.5"}`}
                            />
                          </button>
                        </div>
                      </label>
                    );
                  })}

                  {consentFeedback && (
                    <p className={`text-xs px-3 py-2 rounded-lg ${consentFeedback.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                      {consentFeedback.message}
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Clock size={18} />
            Data retention
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">{retention?.policy}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="font-bold text-slate-700">{retention?.fans_with_activity}</p>
              <p className="text-xs text-slate-400">Con attività</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="font-bold text-slate-700">{retention?.fans_dormant}</p>
              <p className="text-xs text-slate-400">Dormienti</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">{retention?.recommendation}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-semibold text-slate-700 mb-4">Registro privacy</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-slate-400">Nessuna operazione registrata</p>
        ) : (
          <ul className="space-y-2">
            {logs.map((log) => (
              <li key={log.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-50">
                <div>
                  <span className="font-medium text-slate-700">{log.action}</span>
                  {log.details && <span className="text-slate-400 ml-2">— {log.details}</span>}
                </div>
                <span className="text-xs text-slate-400">
                  {log.created_at ? new Date(log.created_at).toLocaleString("it-IT") : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
