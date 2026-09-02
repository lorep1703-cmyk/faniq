import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { fetchFanDetailPanel, fetchFanIntelligence } from "../api/client";
import JourneyBadge from "./intelligence/JourneyBadge";
import FanAnomalyBanner from "./intelligence/FanAnomalyBanner";

function RenewalDot({ prob }) {
  if (prob == null) return null;
  const pct = Math.round(prob * 100);
  const color = pct >= 70 ? "text-emerald-600" : pct >= 40 ? "text-amber-500" : "text-red-600";
  return <span className={`font-semibold ${color}`}>{pct}%</span>;
}

export default function FanDetailPanel({ fanId, onClose }) {
  const [detail, setDetail] = useState(null);
  const [intel, setIntel] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (fanId == null) return;
    setDetail(null);
    setIntel(null);
    setLoading(true);
    Promise.all([
      fetchFanDetailPanel(fanId),
      fetchFanIntelligence(fanId).catch(() => null),
    ])
      .then(([d, i]) => { setDetail(d); setIntel(i); })
      .finally(() => setLoading(false));
  }, [fanId]);

  if (fanId == null) return null;

  const showAnomaly =
    intel?.subscription_anomaly &&
    (intel.subscription_anomaly.severity === "ALTA" ||
      intel.subscription_anomaly.severity === "MEDIA");

  return (
    <>
      {/* overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* panel */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col overflow-y-auto">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          {detail ? (
            <h2 className="text-lg font-bold text-slate-800 truncate">
              {detail.nome} {detail.cognome}
            </h2>
          ) : (
            <div className="h-6 w-40 bg-slate-100 rounded animate-pulse" />
          )}
          <button
            onClick={onClose}
            className="ml-3 shrink-0 p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-6">
          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && detail && (
            <>
              {/* Intelligence */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                  Intelligence
                </h3>

                {showAnomaly && (
                  <FanAnomalyBanner anomaly={intel.subscription_anomaly} />
                )}

                {intel ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Prob. rinnovo</span>
                      <RenewalDot prob={intel.renewal_probability} />
                    </div>
                    {intel.renewal_probability != null && detail.spesa_stagione_recente != null && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500" title="Spesa media recente per stagione × probabilità di rinnovo">
                          Valore futuro atteso
                        </span>
                        <span className="font-semibold text-emerald-700">
                          {new Intl.NumberFormat("it-IT", {
                            style: "currency", currency: "EUR", maximumFractionDigits: 0,
                          }).format(intel.renewal_probability * detail.spesa_stagione_recente)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Stadio journey</span>
                      <JourneyBadge stage={intel.journey_stage} size="sm" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Intelligence score</span>
                      <span className="font-semibold text-slate-700">{intel.intelligence_score}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Intelligence non ancora calcolata</p>
                )}
              </section>

              {/* Abbonamenti */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                  Abbonamenti
                </h3>
                {detail.abbonamenti.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">Nessun abbonamento registrato</p>
                ) : (
                  <ul className="space-y-1.5">
                    {detail.abbonamenti.map((a, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2"
                      >
                        <span className="font-medium text-slate-700">{a.stagione || "—"}</span>
                        <div className="flex items-center gap-2 text-slate-500">
                          {a.tipo && <span>{a.tipo}</span>}
                          {a.stato && (
                            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                              {a.stato}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Presenze & Shop */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                  Presenze & Shop
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-slate-800">{detail.totale_biglietti}</p>
                    <p className="text-xs text-slate-500 mt-1">Biglietti</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-slate-800">
                      {new Intl.NumberFormat("it-IT", {
                        style: "currency",
                        currency: "EUR",
                        maximumFractionDigits: 2,
                      }).format(detail.spesa_shop)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Spesa shop</p>
                  </div>
                </div>

                {detail.spesa_shop_prevista_qualita !== "INSUFFICIENT" && (
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-2.5">
                    <span className="text-xs font-medium text-emerald-700">Spesa shop attesa · prossimi 3 mesi</span>
                    <span className="text-sm font-bold text-emerald-700">
                      {new Intl.NumberFormat("it-IT", {
                        style: "currency",
                        currency: "EUR",
                        maximumFractionDigits: 0,
                      }).format(detail.spesa_shop_prevista)}
                    </span>
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* footer */}
        <div className="px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
          <button
            onClick={() => { onClose(); navigate("/alerts"); }}
            className="w-full text-sm font-medium text-slate-600 border border-slate-200 rounded-xl py-2 hover:bg-slate-50 transition-colors"
          >
            Vedi Alerts
          </button>
        </div>
      </div>
    </>
  );
}
