import { useState, useRef, useEffect, useCallback } from "react";
import { Upload as UploadIcon, CheckCircle, XCircle, FileText, Download, CalendarDays, Trash2, Clock } from "lucide-react";
import { uploadCsv, uploadPartite, getUploadStatus, API_URL, fetchUploadHistory, undoUpload, resetAllData } from "../api/client";

const CSV_TYPES = [
  {
    id: "abbonati",
    label: "Abbonati",
    description: "nome, cognome, email, citta, stagione, importo_pagato, data_acquisto",
    color: "primary",
  },
  {
    id: "biglietteria",
    label: "Biglietteria",
    description: "nome, cognome, email, data_partita, settore, prezzo",
    color: "blue",
  },
  {
    id: "shop",
    label: "Shop",
    description: "email, prodotto, importo, data",
    color: "amber",
  },
];

const colorMap = {
  primary: {
    bg: "bg-primary-50",
    border: "border-primary-200",
    text: "text-primary-600",
    badge: "bg-primary-100 text-primary-700",
    btn: "bg-primary-600 hover:bg-primary-700",
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-600",
    badge: "bg-blue-100 text-blue-700",
    btn: "bg-blue-600 hover:bg-blue-700",
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-600",
    badge: "bg-amber-100 text-amber-700",
    btn: "bg-amber-500 hover:bg-amber-600",
  },
};

function UploadCard({ type, onSuccess }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState("");
  const inputRef = useRef();
  const c = colorMap[type.color];

  useEffect(() => {
    if (status === "success") onSuccess?.();
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setStatus(null);
    setMessage("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus("loading");
    setMessage("Caricamento in corso — può richiedere qualche minuto per file grandi...");
    try {
      const { job_id } = await uploadCsv(type.id, file);
      // polling
      const deadline = Date.now() + 5 * 60 * 1000;
      const MAX_CONSECUTIVE_POLL_FAILURES = 3; // tollera blip di rete transitori (cold start / restart Render)
      let consecutiveFailures = 0;
      await new Promise((resolve) => {
        const interval = setInterval(async () => {
          try {
            const job = await getUploadStatus(job_id);
            consecutiveFailures = 0;
            if (job.status === "done") {
              clearInterval(interval);
              setStatus("success");
              setMessage(job.message || `${job.rows} righe importate`);
              resolve();
            } else if (job.status === "error") {
              clearInterval(interval);
              setStatus("error");
              setMessage("Errore durante l'importazione. Riprova.");
              resolve();
            } else if (Date.now() > deadline) {
              clearInterval(interval);
              setStatus("error");
              setMessage("L'operazione sta richiedendo più tempo del previsto. Controlla lo storico tra qualche minuto.");
              resolve();
            }
          } catch (err) {
            // Job non trovato (404): il processo backend è stato riavviato e ha perso
            // lo stato del job — questo è un fallimento reale, non un blip di rete.
            const jobLost = err?.response?.status === 404;
            consecutiveFailures += 1;
            if (jobLost || consecutiveFailures >= MAX_CONSECUTIVE_POLL_FAILURES || Date.now() > deadline) {
              clearInterval(interval);
              setStatus("error");
              setMessage(
                jobLost
                  ? "Il server si è riavviato durante il caricamento. Controlla lo storico prima di ricaricare il file."
                  : "Errore durante l'importazione. Riprova."
              );
              resolve();
            }
            // altrimenti: errore transitorio, il prossimo tick riprova
          }
        }, 2000);
      });
    } catch (err) {
      setStatus("error");
      if (err.code === "ECONNABORTED") {
        setMessage("Il server si sta riattivando (può richiedere fino a un minuto dopo un periodo di inattività). Riprova tra poco.");
      } else {
        setMessage(err.response?.data?.detail || err.userMessage || "Errore durante il caricamento");
      }
    }
  };

  return (
    <div className={`bg-white rounded-xl border ${c.border} shadow-sm p-6`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>{type.label}</span>
          <h3 className="text-slate-700 font-semibold mt-2">{type.label}</h3>
        </div>
        <FileText className={c.text} size={20} />
      </div>

      <p className="text-xs text-slate-400 mb-3 font-mono bg-slate-50 rounded px-3 py-2">
        Colonne: {type.description}
      </p>

      <a
        href={`${API_URL}/upload/template/${type.id}`}
        download
        className={`inline-flex items-center gap-1.5 text-xs font-medium mb-4 ${c.text} hover:underline`}
      >
        <Download size={13} />
        Scarica template CSV
      </a>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          file ? `${c.bg} ${c.border}` : "border-slate-200 hover:border-slate-300"
        }`}
        onClick={() => inputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        {file ? (
          <div>
            <UploadIcon className={`mx-auto mb-2 ${c.text}`} size={22} />
            <p className={`text-sm font-medium ${c.text}`}>{file.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        ) : (
          <div>
            <UploadIcon className="mx-auto mb-2 text-slate-300" size={22} />
            <p className="text-sm text-slate-400">Trascina qui il file CSV</p>
            <p className="text-xs text-slate-300 mt-0.5">oppure clicca per selezionare</p>
          </div>
        )}
      </div>

      {/* Feedback */}
      {status === "loading" && message && (
        <div className="mt-3 flex items-center gap-2 text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
          <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin shrink-0" />
          <span className="text-sm">{message}</span>
        </div>
      )}
      {status === "success" && (
        <div className="mt-3 flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
          <CheckCircle size={16} />
          <span className="text-sm">{message}</span>
        </div>
      )}
      {status === "error" && (
        <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-3 py-2">
          <XCircle size={16} />
          <span className="text-sm">{message}</span>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || status === "loading"}
        className={`mt-4 w-full py-2.5 rounded-lg text-white text-sm font-semibold transition-colors ${c.btn} disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {status === "loading" ? "Caricamento..." : `Carica ${type.label}`}
      </button>
    </div>
  );
}

function PartiteUploadCard({ onSuccess }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");
  const inputRef = useRef();

  useEffect(() => {
    if (status === "success") onSuccess?.();
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFile = (f) => { if (!f) return; setFile(f); setStatus(null); setMessage(""); };
  const handleDrop = (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); };

  const handleUpload = async () => {
    if (!file) return;
    setStatus("loading");
    setMessage("Caricamento in corso...");
    try {
      const result = await uploadPartite(file);
      setStatus("success");
      setMessage(result.message);
    } catch (err) {
      setStatus("error");
      if (err.code === "ECONNABORTED") {
        setMessage("Il server si sta riattivando (può richiedere fino a un minuto dopo un periodo di inattività). Riprova tra poco.");
      } else {
        setMessage(err.response?.data?.detail || err.userMessage || "Errore durante il caricamento");
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Calendario</span>
          <h3 className="text-slate-700 font-semibold mt-2">Calendario Partite</h3>
        </div>
        <CalendarDays className="text-emerald-600" size={20} />
      </div>

      <p className="text-xs text-slate-400 mb-3 font-mono bg-slate-50 rounded px-3 py-2">
        Colonne: data, avversario, casa_trasferta, competizione
      </p>

      <a
        href={`${API_URL}/partite/template`}
        download
        className="inline-flex items-center gap-1.5 text-xs font-medium mb-4 text-emerald-600 hover:underline"
      >
        <Download size={13} />
        Scarica template CSV
      </a>

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          file ? "bg-emerald-50 border-emerald-200" : "border-slate-200 hover:border-slate-300"
        }`}
        onClick={() => inputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <input ref={inputRef} type="file" accept=".csv" className="hidden"
          onChange={(e) => handleFile(e.target.files[0])} />
        {file ? (
          <div>
            <UploadIcon className="mx-auto mb-2 text-emerald-600" size={22} />
            <p className="text-sm font-medium text-emerald-600">{file.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        ) : (
          <div>
            <UploadIcon className="mx-auto mb-2 text-slate-300" size={22} />
            <p className="text-sm text-slate-400">Trascina qui il file CSV</p>
            <p className="text-xs text-slate-300 mt-0.5">oppure clicca per selezionare</p>
          </div>
        )}
      </div>

      {status === "loading" && message && (
        <div className="mt-3 flex items-center gap-2 text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
          <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin shrink-0" />
          <span className="text-sm">{message}</span>
        </div>
      )}
      {status === "success" && (
        <div className="mt-3 flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
          <CheckCircle size={16} /><span className="text-sm">{message}</span>
        </div>
      )}
      {status === "error" && (
        <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-3 py-2">
          <XCircle size={16} /><span className="text-sm">{message}</span>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || status === "loading"}
        className="mt-4 w-full py-2.5 rounded-lg text-white text-sm font-semibold transition-colors bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {status === "loading" ? "Caricamento..." : "Carica Calendario"}
      </button>
    </div>
  );
}

function UploadHistory({ refreshKey }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUploadHistory();
      setHistory(data);
    } catch (err) {
      setError(err.userMessage || "Errore nel caricamento dello storico");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const handleUndo = async (id, filename) => {
    if (!window.confirm(`Annullare il caricamento "${filename}"? I record importati verranno rimossi.`)) return;
    setDeletingId(id);
    try {
      await undoUpload(id);
      await load();
    } catch (err) {
      setError(err.userMessage || "Errore durante l'annullamento");
    } finally {
      setDeletingId(null);
    }
  };

  const typeLabel = {
    abbonati: "Abbonati",
    biglietteria: "Biglietteria",
    shop: "Shop",
    partite: "Calendario",
  };

  return (
    <div className="mt-8 bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
        <Clock size={16} className="text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-700">Storico caricamenti</h3>
      </div>

      {loading && (
        <p className="text-sm text-slate-400 px-5 py-6 text-center">Caricamento...</p>
      )}

      {error && (
        <div className="mx-5 my-4 flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-3 py-2">
          <XCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {!loading && !error && history.length === 0 && (
        <p className="text-sm text-slate-400 px-5 py-6 text-center">Nessun caricamento ancora.</p>
      )}

      {!loading && history.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {history.map((u) => (
            <li key={u.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
              <div className="flex items-center gap-3 min-w-0">
                <FileText size={15} className="text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {typeLabel[u.type] || u.type}
                    </span>
                    <span className="text-sm text-slate-700 truncate">{u.filename}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {u.rows_imported} record · {u.uploaded_at ? new Date(u.uploaded_at).toLocaleString("it-IT") : "—"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleUndo(u.id, u.filename)}
                disabled={deletingId === u.id}
                className="ml-4 shrink-0 flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 size={13} />
                {deletingId === u.id ? "Annullamento..." : "Annulla"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ResetSection() {
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'

  const handleReset = async () => {
    const confirmed = window.confirm(
      "Sei sicuro? Questa azione elimina TUTTI i fan, abbonamenti, biglietti, shop e partite del club. Non è reversibile."
    );
    if (!confirmed) return;
    setStatus("loading");
    try {
      await resetAllData();
      setStatus("success");
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="mt-10 border border-red-200 bg-red-50 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-red-700 mb-1">Zona pericolosa</h3>
      <p className="text-xs text-red-500 mb-4">
        Elimina permanentemente tutti i dati del club (fan, abbonamenti, biglietti, shop, partite). Azione irreversibile.
      </p>

      {status === "success" && (
        <div className="mb-3 flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <CheckCircle size={16} />
          <span className="text-sm">Dati eliminati con successo</span>
        </div>
      )}
      {status === "error" && (
        <div className="mb-3 flex items-center gap-2 text-red-700 bg-red-100 border border-red-200 rounded-lg px-3 py-2">
          <XCircle size={16} />
          <span className="text-sm">Errore durante il reset. Riprova.</span>
        </div>
      )}

      <button
        onClick={handleReset}
        disabled={status === "loading" || status === "success"}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Trash2 size={15} />
        {status === "loading" ? "Eliminazione in corso..." : "Reset dati"}
      </button>
    </div>
  );
}

export default function Upload() {
  // Incrementato ad ogni upload riuscito (qualunque delle 4 card) — fa
  // ricaricare "Storico caricamenti" senza bisogno di un reload manuale.
  const [refreshKey, setRefreshKey] = useState(0);
  const bumpRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Carica CSV</h1>
        <p className="text-slate-500 text-sm mt-1">
          Importa i dati dei tifosi dai sistemi del club. I profili vengono deduplicati automaticamente per email.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {CSV_TYPES.map((type) => (
          <UploadCard key={type.id} type={type} onSuccess={bumpRefresh} />
        ))}
        <PartiteUploadCard onSuccess={bumpRefresh} />
      </div>

      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-600 mb-2">Come funziona la deduplicazione</h3>
        <ul className="text-sm text-slate-500 space-y-1 list-disc list-inside">
          <li>Se un tifoso ha email, viene riconosciuto attraverso tutte le fonti tramite email</li>
          <li>Se non ha email, viene matchato per nome + cognome</li>
          <li>La spesa totale viene aggregata automaticamente per ogni profilo unificato</li>
        </ul>
      </div>

      <UploadHistory refreshKey={refreshKey} />
      <ResetSection />
    </div>
  );
}
