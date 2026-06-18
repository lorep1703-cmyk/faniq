import { useEffect, useState } from "react";
import { FlaskConical, Users, Euro, Percent } from "lucide-react";
import { fetchSuggestedBase, fetchAttendance } from "../api/client";
import StatCard from "../components/StatCard";

const MATCH_TYPES = [
  { id: "standard", label: "Standard" },
  { id: "importante", label: "Partita importante" },
  { id: "derby", label: "Derby" },
  { id: "finale", label: "Finale / playoff" },
];

const WEATHER = [
  { id: "sole", label: "Sole" },
  { id: "nuvoloso", label: "Nuvoloso" },
  { id: "pioggia", label: "Pioggia" },
  { id: "neve", label: "Neve" },
];

const PROMOS = [
  { id: "nessuna", label: "Nessuna promo" },
  { id: "sconto_10", label: "Sconto 10%" },
  { id: "sconto_20", label: "Sconto 20%" },
  { id: "family_pack", label: "Family pack" },
];

function fmtEur(n) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

export default function Simulatore() {
  const [base, setBase] = useState(1500);
  const [matchType, setMatchType] = useState("standard");
  const [weather, setWeather] = useState("sole");
  const [promo, setPromo] = useState("nessuna");
  const [capienza, setCapienza] = useState(7500);
  const [prezzoMedio, setPrezzoMedio] = useState(15);
  const [abbonati, setAbbonati] = useState(0);
  const [result, setResult] = useState(null);
  const [baseInfo, setBaseInfo] = useState(null);

  useEffect(() => {
    fetchSuggestedBase().then((data) => {
      setBaseInfo(data);
      if (data.base) setBase(data.base);
    });
  }, []);

  useEffect(() => {
    fetchAttendance({
      base,
      match_type: matchType,
      weather,
      promo,
      capienza,
      prezzo_medio: prezzoMedio,
      abbonati,
    }).then(setResult);
  }, [base, matchType, weather, promo, capienza, prezzoMedio, abbonati]);

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FlaskConical size={24} className="text-primary-600" />
          Simulatore affluenza
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Stima presenze e revenue per la prossima partita
          {baseInfo?.source === "historical" && (
            <span className="text-primary-600"> — base calcolata da {baseInfo.matches} partite storiche</span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-slate-700">Parametri</h2>

          <label className="block">
            <span className="text-sm text-slate-500">Base biglietti venduti</span>
            <input
              type="number"
              value={base}
              onChange={(e) => setBase(Number(e.target.value))}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-500">Tipo partita</span>
            <select
              value={matchType}
              onChange={(e) => setMatchType(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              {MATCH_TYPES.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-slate-500">Meteo</span>
            <select
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              {WEATHER.map((w) => (
                <option key={w.id} value={w.id}>{w.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-slate-500">Promozione</span>
            <select
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              {PROMOS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm text-slate-500">Capienza</span>
              <input
                type="number"
                value={capienza}
                onChange={(e) => setCapienza(Number(e.target.value))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-500">Prezzo medio €</span>
              <input
                type="number"
                value={prezzoMedio}
                onChange={(e) => setPrezzoMedio(Number(e.target.value))}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm text-slate-500">Abbonati attesi</span>
            <input
              type="number"
              value={abbonati}
              onChange={(e) => setAbbonati(Number(e.target.value))}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </label>
        </div>

        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Affluenza stimata"
                value={result.affluenza_stimata.toLocaleString("it-IT")}
                sub={`${result.occupazione_pct}% capienza`}
                icon={Users}
                color="primary"
              />
              <StatCard
                label="Revenue stimata"
                value={fmtEur(result.revenue_stimata)}
                sub="biglietti + abbonati"
                icon={Euro}
                color="green"
              />
              <StatCard
                label="Occupazione"
                value={`${result.occupazione_pct}%`}
                sub={`su ${result.capienza.toLocaleString("it-IT")} posti`}
                icon={Percent}
                color="blue"
              />
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-semibold text-slate-700 mb-3">Dettaglio calcolo</h3>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>Biglietti stimati: <strong>{result.biglietti_stimati}</strong></li>
                <li>Abbonati: <strong>{result.abbonati}</strong></li>
                <li>Moltiplicatore partita: <strong>{result.fattori.match_multiplier}x</strong></li>
                <li>Moltiplicatore meteo: <strong>{result.fattori.weather_multiplier}x</strong></li>
                <li>Moltiplicatore promo: <strong>{result.fattori.promo_multiplier}x</strong></li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
