"""Narrative generation for CARE compatibility (single source of truth)."""
from typing import Any, Dict, Optional

from src.care.formula.service import CANONICAL_BLOCKS, CANONICAL_LABELS_ES, compatibility_label

VALID_TONES = ("directo", "poetico", "ludico", "emocional", "curioso")

_TONE_OPENERS = {
    "directo": "Compatibilidad {label}.",
    "poetico": "Sus almas trazan un puente de afinidad: sintonía {label}.",
    "ludico": "¡Match detectado! Afinidad {label} en el tablero CARE.",
    "emocional": "Hay una corriente emotiva genuina aquí: afinidad {label}.",
    "curioso": "Interesante: el motor CARE mide una afinidad {label}.",
}

_TONE_TOP = {
    "directo": "Sobre todo coinciden en {top1} y {top2}.",
    "poetico": "Sus {top1} resuenan en armonía, y {top2} los acompaña.",
    "ludico": "Combo fuerte en {top1} + {top2}.",
    "emocional": "Se sienten vistos en {top1}, y {top2} refuerza el vínculo.",
    "curioso": "Los factores con mayor peso combinado son {top1} y {top2}.",
}

_TONE_CONTRAST = {
    "directo": "Aunque difieren en {low}, el resto sostiene la conexión.",
    "poetico": "Aunque {low} susurre en otra tonada, la melodía común prevalece.",
    "ludico": "Ojo: {low} es su zona baja, pero ya ganaron en lo demás.",
    "emocional": "Hay distancia en {low}, aunque el corazón afina en el resto.",
    "curioso": "El punto débil comparado es {low}.",
}

_TONE_CHAOS = {
    "directo": " Caos aplicado: {chi:+.2f}.",
    "poetico": " El azar controlado ({chi:+.2f}) tejió una sorpresa.",
    "ludico": " χ(t) inyectó {chi:+.2f} de caos reproducible.",
    "emocional": " Un atisbo de incertidumbre ({chi:+.2f}) hace único este vínculo.",
    "curioso": " Término de caos χ = {chi:+.2f}.",
}


def generate_narrative(
    breakdown: Dict[str, Any],
    tone: str = "directo",
    weights: Optional[Dict[str, float]] = None,
) -> Dict[str, str]:
    if tone not in VALID_TONES:
        tone = "directo"
    weights = weights or CANONICAL_BLOCKS

    final_score = None
    for candidate_key in ("final_score", "compatibility_score", "score"):
        if isinstance(breakdown.get(candidate_key), (int, float)):
            final_score = float(breakdown[candidate_key])
            break
    if final_score is None:
        final_score = sum(
            float(breakdown.get(k, 0.0)) * weights.get(k, 0.0) for k in CANONICAL_BLOCKS
        )

    label = breakdown.get("compatibility_label") or compatibility_label(final_score)

    contributions = {
        k: float(breakdown.get(k, 0.0)) * weights.get(k, 0.0) for k in CANONICAL_BLOCKS
    }
    ordered = sorted(contributions, key=contributions.get, reverse=True)
    top1 = CANONICAL_LABELS_ES[ordered[0]].lower()
    top2 = CANONICAL_LABELS_ES[ordered[1]].lower()
    f_values = {k: float(breakdown.get(k, 0.0)) for k in CANONICAL_BLOCKS}
    low = CANONICAL_LABELS_ES[min(f_values, key=f_values.get)].lower()

    text = _TONE_OPENERS[tone].format(label=label.lower())
    text += " " + _TONE_TOP[tone].format(top1=top1, top2=top2)
    if top1 != low and top2 != low:
        text += " " + _TONE_CONTRAST[tone].format(low=low)
    chi = breakdown.get("chaos_applied") or 0.0
    if chi:
        text += _TONE_CHAOS[tone].format(chi=float(chi))
    if breakdown.get("saturated"):
        text += " Score saturado en el rango límite."

    return {"tone": tone, "text": text.strip(), "label": label}
