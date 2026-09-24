import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, LogIn, UserPlus } from "lucide-react";
import { API_URL } from "../api/client";

export default function Login() {
  const [tab, setTab] = useState("login");
  const [slug, setSlug] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = tab === "login" ? "/auth/login" : "/auth/register";
    const body = tab === "login" ? { slug, password } : { slug, nome, email, password };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = data.detail;
        const msg = Array.isArray(detail)
          ? detail.map((e) => e.msg || JSON.stringify(e)).join(", ")
          : detail || "Errore";
        throw new Error(msg);
      }
      localStorage.setItem("faniq_token", data.token);
      localStorage.setItem("faniq_club", JSON.stringify(data.club));
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <Users size={22} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900 tracking-tight">FanIQ</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${tab === "login" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => { setTab("login"); setError(""); }}
            >
              Accedi
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${tab === "register" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => { setTab("register"); setError(""); }}
            >
              Registra club
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "register" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome del club</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="es. FC Torino Nord"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="es. admin@torino.it"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Identificativo club (slug)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                placeholder="es. torino-nord"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              {tab === "register" && (
                <p className="text-xs text-gray-400 mt-1">Minuscolo, senza spazi. Non si può cambiare.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                minLength={8}
              />
              {tab === "login" && (
                <div className="text-right mt-1.5">
                  <Link to="/recupera-password" className="text-xs text-primary-600 hover:text-primary-700">
                    Password dimenticata?
                  </Link>
                </div>
              )}
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
              {loading ? (
                <span>Caricamento...</span>
              ) : tab === "login" ? (
                <><LogIn size={16} /> Accedi</>
              ) : (
                <><UserPlus size={16} /> Registra club</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          FanIQ · Fan Intelligence Platform
        </p>
      </div>
    </div>
  );
}
