import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, ArrowLeft } from "lucide-react";
import AuthCard from "../components/AuthCard";
import { confirmPasswordReset } from "../api/client";

export default function ReimpostaPassword() {
  const [token] = useState(() => new URLSearchParams(window.location.search).get("token") || "");

  // Tolto subito dall'indirizzo: così il token non resta nella cronologia e non
  // finisce nell'header Referer di altre richieste (OWASP).
  useEffect(() => {
    if (window.location.search) window.history.replaceState(null, "", window.location.pathname);
  }, []);
  const [password, setPassword] = useState("");
  const [conferma, setConferma] = useState("");
  const [done, setDone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== conferma) {
      setError("Le due password non coincidono.");
      return;
    }
    setLoading(true);
    try {
      const data = await confirmPasswordReset(token, password);
      setDone(data.message);
    } catch (err) {
      setError(err.userMessage || "Qualcosa è andato storto. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent";

  if (!token) {
    return (
      <AuthCard title="Link non valido" subtitle="Questo link è incompleto. Richiedine uno nuovo.">
        <Link to="/recupera-password" className="text-sm font-medium text-primary-600 hover:text-primary-700">
          Richiedi un nuovo link
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Scegli una nuova password"
      subtitle="Almeno 8 caratteri, con una maiuscola, una minuscola, un numero e un carattere speciale."
    >
      {done ? (
        <>
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-3 py-3 rounded-lg">
            {done}
          </div>
          <Link
            to="/login"
            className="mt-6 w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            Vai all'accesso
          </Link>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nuova password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputCls}
              required
              minLength={8}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ripeti la password</label>
            <input
              type="password"
              value={conferma}
              onChange={(e) => setConferma(e.target.value)}
              placeholder="••••••••"
              className={inputCls}
              required
              minLength={8}
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
              {error}
              {error.startsWith("Link non valido") && (
                <Link to="/recupera-password" className="block mt-1 font-medium underline">
                  Richiedi un nuovo link
                </Link>
              )}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? "Salvataggio..." : <><KeyRound size={16} /> Salva la nuova password</>}
          </button>
        </form>
      )}
      {!done && (
        <Link
          to="/login"
          className="mt-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={14} /> Torna all'accesso
        </Link>
      )}
    </AuthCard>
  );
}
