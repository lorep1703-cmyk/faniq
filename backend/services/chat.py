"""Chat AI contestuale sui dati del club."""
import os

from sqlalchemy.orm import Session

from config import CHAT_ANONYMIZE_PII, CHAT_MAX_TOKENS, CHAT_MAX_TURNS, OPENAI_MODEL
from services.analytics import compute_fan_segments, dashboard_stats
from services.insights import generate_insights


def _build_context(db: Session, club_id: int, club_nome: str) -> str:
    stats = dashboard_stats(db, club_id)
    insights = generate_insights(db, club_id)
    segments = compute_fan_segments(db, club_id)

    seg_lines = []
    for s in segments[:20]:
        if CHAT_ANONYMIZE_PII:
            label = f"Tifoso #{s['id']}"
        else:
            label = f"{s.get('nome', '')} {s.get('cognome', '')}".strip() or f"Tifoso #{s['id']}"
        seg_lines.append(f"- {label}: segmento {s['segment']}, spesa {s['total_spend']}€, fonti {s['n_sources']}")

    insight_lines = [f"- {i['title']}: {i['body']}" for i in insights.get("insights", [])[:5]]

    return (
        f"Club: {club_nome}\n"
        f"Tifosi totali: {stats['total_fans']}\n"
        f"Con email: {stats['fans_with_email']}\n"
        f"Revenue totale: {stats['total_revenue']}€\n"
        f"Spesa media: {stats['spesa_media']}€\n\n"
        f"Insights:\n" + "\n".join(insight_lines) + "\n\n"
        f"Top tifosi (max 20):\n" + "\n".join(seg_lines)
    )


def chat_with_ai(db: Session, club_id: int, club_nome: str, messages: list[dict]) -> dict:
    context = _build_context(db, club_id, club_nome)
    system = (
        f"Sei l'assistente AI di FanIQ per il club {club_nome}. "
        "Rispondi in italiano, conciso e operativo. Usa solo i dati forniti nel contesto. "
        "Se non hai dati sufficienti, suggerisci di caricare CSV.\n\n"
        f"CONTESTO DATI:\n{context}"
    )

    api_messages = [{"role": "system", "content": system}]
    for m in messages[-CHAT_MAX_TURNS * 2:]:
        if m.get("role") in ("user", "assistant"):
            api_messages.append({"role": m["role"], "content": m.get("content", "")})

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return {
            "reply": (
                "L'assistente AI non è configurato: imposta OPENAI_API_KEY nel file .env del backend. "
                f"Nel database ci sono {dashboard_stats(db, club_id)['total_fans']} tifosi."
            ),
            "model": None,
        }

    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=api_messages,
            max_tokens=CHAT_MAX_TOKENS,
            temperature=0.4,
        )
        return {"reply": response.choices[0].message.content or "", "model": OPENAI_MODEL}
    except Exception as e:
        return {"reply": f"Errore AI: {str(e)}", "model": OPENAI_MODEL}
