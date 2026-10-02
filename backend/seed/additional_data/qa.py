"""QA checks for the `profile_additional_section` seed data.

These catch the classes of mistakes that are easy to make when hand-writing
~2,600 translations:

* a missing / misspelled language keyword (caught by ``L`` at import time),
* stray leading/trailing whitespace or doubled spaces,
* left-over placeholder debris such as ``(Tree)`` or ``(rt)``,
* untranslated English fragments accidentally left inside a translation for a
  language that does not use the Latin script.

Run inside the backend container:
    docker exec -w /app redthread-backend python seed/additional_data/qa.py
"""

import re
import sys

from .common import LANGS

# Languages written in scripts where a run of latin letters is almost certainly
# a mistake (proper nouns are kept short or transliterated on purpose).
NON_LATIN = {"ru", "zh", "hi", "bn", "ja", "ko", "ar", "am"}

LATIN_RUN = re.compile(r"[A-Za-z]{3,}")
DEBRIS = re.compile(r"\(|\)|\{\}|\[\]|\bTODO\b|\bFIXME\b|\.\.\.", re.IGNORECASE)
DOUBLE_SPACE = re.compile(r"  ")

# Deliberate latin tokens that are brand/loan terms kept verbatim in every
# language, so they must not be reported as untranslated debris.
ALLOWED_LATIN = {"CARE", "Swinger"}

# A translation for these languages must actually be written in its own script.
# This catches Chinese pasted into an Arabic field, or a Spanish sentence left
# untranslated, which a pure "is it empty" check would happily accept.
SCRIPT_RANGES = {
    "ar": (("\u0600", "\u06ff"),),
    "ru": (("\u0400", "\u04ff"),),
    "zh": (("\u4e00", "\u9fff"),),
    # Japanese mixes kana with kanji, and some very common words are written
    # entirely in kanji (身長, 普通, 独占性), so either block is acceptable.
    "ja": (("\u3040", "\u30ff"), ("\u4e00", "\u9fff")),
    "ko": (("\uac00", "\ud7af"),),
    "hi": (("\u0900", "\u097f"),),
    "bn": (("\u0980", "\u09ff"),),
    "am": (("\u1200", "\u137f"),),
}

# (key, lang) pairs where the translation is legitimately spelled exactly like
# the Spanish. Audited individually; keep this list short and justified.
ALLOWED_SAME = {
    # Portuguese keeps the gendered form for both languages.
    ("relationship.opt.monogamy.label", "pt"),
    ("height.pref.tall", "pt"),
    # "Signo zodiacal" and "Contacto físico" are spelled identically in
    # Spanish and Portuguese.
    ("zodiac.title", "pt"),
    ("love.option.physical_touch.label", "pt"),
}

# Spanish values that are proper nouns. Several languages (notably Hausa and
# Māori) have no established zodiac vocabulary and keep the Latin/English name,
# so an identical-to-Spanish match here is a deliberate loan, not a missing
# translation.
PROPER_NOUNS = {
    "Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo", "Libra",
    "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis",
}


def has_own_script(lang: str, value: str) -> bool:
    ranges = SCRIPT_RANGES.get(lang)
    if not ranges:
        return True
    return any(
        low <= char <= high
        for low, high in ranges
        for char in value
    )


def latin_tokens(value: str) -> set:
    return {run for run in LATIN_RUN.findall(value)}


def collect() -> list:
    """Return every TEXTS list from the sibling data modules.

    Modules that do not exist yet are skipped so the QA can run while the
    section is being built up subsection by subsection.
    """
    import importlib

    found = []
    for module_name in (
        "title", "height", "relationship", "zodiac", "family", "communication",
        "love",
    ):
        try:
            module = importlib.import_module(f".{module_name}", __package__)
        except ModuleNotFoundError:
            continue
        found.append((module_name, module.TEXTS))
    return found


def check(module_name: str, rows: list, problems: list) -> None:
    seen = set()
    for row in rows:
        value = row["value"]
        if value in seen:
            problems.append(f"[{module_name}] duplicate key: {value}")
        seen.add(value)

        translations = row["translations"]
        if set(translations) != set(LANGS):
            problems.append(f"[{module_name}] {value}: wrong language set")

        spanish = translations["es"]
        spanish_is_real = bool(LATIN_RUN.search(spanish))
        for lang, text_value in translations.items():
            if not isinstance(text_value, str) or not text_value.strip():
                problems.append(f"[{module_name}] {value}.{lang}: empty")
                continue
            if text_value != text_value.strip():
                problems.append(f"[{module_name}] {value}.{lang}: padded whitespace")
            if DOUBLE_SPACE.search(text_value):
                problems.append(f"[{module_name}] {value}.{lang}: double space")
            if DEBRIS.search(text_value):
                problems.append(
                    f"[{module_name}] {value}.{lang}: debris -> {text_value!r}"
                )
            if spanish_is_real and not has_own_script(lang, text_value):
                problems.append(
                    f"[{module_name}] {value}.{lang}: wrong/absent script -> "
                    f"{text_value!r}"
                )
            if (
                lang != "es"
                and text_value == spanish
                and spanish_is_real
                and latin_tokens(spanish) - ALLOWED_LATIN
                and spanish not in PROPER_NOUNS
                and (value, lang) not in ALLOWED_SAME
            ):
                problems.append(
                    f"[{module_name}] {value}.{lang}: identical to Spanish"
                )
            if lang in NON_LATIN:
                for run in latin_tokens(text_value) - ALLOWED_LATIN:
                    problems.append(
                        f"[{module_name}] {value}.{lang}: latin run "
                        f"{run!r} inside -> {text_value!r}"
                    )


def main() -> int:
    problems: list = []
    total = 0
    per_module = []
    for module_name, rows in collect():
        total += len(rows)
        per_module.append(f"{module_name}={len(rows)}")
        check(module_name, rows, problems)

    print(f"checked {total} keys across {len(per_module)} modules: "
          f"{', '.join(per_module)}")
    if problems:
        print(f"\n{len(problems)} problem(s):")
        for problem in problems:
            print(f"  - {problem}")
        return 1
    print("all checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())