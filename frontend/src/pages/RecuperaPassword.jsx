import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import AuthCard from "../components/AuthCard";
import { requestPasswordReset } from "../api/client";

export default function RecuperaPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await requestPasswordReset(email);
      setMessage(data.message);
    } catch (err) {
      setError(err.userMessage || "Qualcosa è andato storto. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Password dimenticata"
      subtitle="Inserisci l'email del club: ti mandiamo un link per sceglierne una nuova."
    >
      {message ? (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-3 py-3 rounded-lg">
          {message}
          <p className="text-green-700 mt-2">Non la trovi? Controlla anche nello spam.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email del club</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="es. admin@torino.it"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              autoFocus
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? "Invio in corso..." : <><Mail size={16} /> Inviami il link</>}
          </button>
        </form>
      )}
      <Link
        to="/login"
        className="mt-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={14} /> Torna all'accesso
      </Link>
    </AuthCard>
  );
}
