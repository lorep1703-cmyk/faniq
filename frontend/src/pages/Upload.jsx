import { useState, useRef } from "react";
import { Upload as UploadIcon, CheckCircle, XCircle, FileText, Download, CalendarDays } from "lucide-react";
import { uploadCsv, uploadPartite, API_URL } from "../api/client";

const CSV_TYPES = [
  {
    id: "abbonati",
    label: "Abbonati",
    description: "nome, cognome, email, citta, stagione, importo_pagato",
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

function UploadCard({ type }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState("");
  const inputRef = useRef();
  const c = colorMap[type.color];

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
    try {
      const result = await uploadCsv(type.id, file);
      setStatus("success");
      setMessage(result.message);
    } catch (err) {
      setStatus("error");
      setMessage(err.response?.data?.detail || "Errore durante il caricamento");
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

function PartiteUploadCard() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");
  const inputRef = useRef();

  const handleFile = (f) => { if (!f) return; setFile(f); setStatus(null); setMessage(""); };
  const handleDrop = (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); };

  const handleUpload = async () => {
    if (!file) return;
    setStatus("loading");
    try {
      const result = await uploadPartite(file);
      setStatus("success");
      setMessage(result.message);
    } catch (err) {
      setStatus("error");
      setMessage(err.response?.data?.detail || "Errore durante il caricamento");
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

export default function Upload() {
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
          <UploadCard key={type.id} type={type} />
        ))}
        <PartiteUploadCard />
      </div>

      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-600 mb-2">Come funziona la deduplicazione</h3>
        <ul className="text-sm text-slate-500 space-y-1 list-disc list-inside">
          <li>Se un tifoso ha email, viene riconosciuto attraverso tutte le fonti tramite email</li>
          <li>Se non ha email, viene matchato per nome + cognome</li>
          <li>La spesa totale viene aggregata automaticamente per ogni profilo unificato</li>
        </ul>
      </div>
    </div>
  );
}
