import DecayBadge from "./DecayBadge";

const CONTEXT = {
  VOLATILE: "Questo tifoso tende ad allontanarsi dopo ogni assenza. Contattalo entro la prima partita saltata.",
  RAPIDO:   "Si perde rapidamente ma si recupera anche in fretta. Reagisce bene alle campagne.",
  MEDIO:    "Comportamento standard. Nessuna urgenza particolare.",
  LENTO:    "Fan solido. Puoi permetterti di aspettare senza rischiare di perderlo.",
};

// Frase predittiva da half_life_value: "in media, quante partite salta prima
// di tornare" diventa una stima di quando aspettarsi il ritorno, invece di
// restare solo un'etichetta descrittiva del profilo.
function predictionSentence(halfLifeValue) {
  if (halfLifeValue == null) return null;
  if (halfLifeValue === 0) return "Non ha mai saltato una partita finora.";
  const partite = Math.round(halfLifeValue);
  return `In media, quando salta una partita, torna entro ${partite === 1 ? "1 partita" : `${partite} partite`}.`;
}

export default function FanDecayProfile({ profile, halfLifeValue }) {
  if (!profile) return null;

  const key = profile.toUpperCase();
  const sentence = CONTEXT[key];
  if (!sentence) return null;

  const prediction = predictionSentence(halfLifeValue);

  return (
    <div className="mt-5 pt-4 border-t border-slate-100">
      <h3 className="text-sm font-bold text-slate-700 mb-2">Profilo fedeltà</h3>
      <div className="mb-2">
        <DecayBadge profile={profile} size="lg" />
      </div>
      <p className="text-sm text-slate-500 leading-relaxed">{sentence}</p>
      {prediction && (
        <p className="text-sm font-medium text-slate-700 leading-relaxed mt-2">{prediction}</p>
      )}
    </div>
  );
}
