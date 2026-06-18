import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { sendChat } from "../api/client";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Ciao! Sono l'assistente FanIQ. Chiedimi qualcosa sui tuoi tifosi." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await sendChat(newMessages.filter((m) => m.role !== "system"));
      setMessages([...newMessages, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Errore di connessione. Verifica che il backend sia attivo." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-40"
          aria-label="Apri chat"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col h-[480px]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-primary-600 text-white rounded-t-2xl">
            <div>
              <p className="font-semibold text-sm">Assistente FanIQ</p>
              <p className="text-primary-200 text-xs">Powered by AI</p>
            </div>
            <button onClick={() => setOpen(false)} className="hover:bg-primary-500 p-1 rounded-lg">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-sm leading-relaxed px-3 py-2 rounded-xl max-w-[85%] ${
                  m.role === "user"
                    ? "bg-primary-600 text-white ml-auto"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="text-sm text-slate-400 px-3">Sto pensando...</div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-slate-100 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Chiedi qualcosa sui tifosi..."
              className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white p-2.5 rounded-xl transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
