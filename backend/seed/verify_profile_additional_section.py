import asyncio
import os
import sys

sys.path.append(os.getcwd())

from src.core.database import init_db
from src.models.system_options import SystemOption

LANGS = [
    "es", "en", "pt", "fr", "de", "it", "ru", "sv", "nl", "zh",
    "hi", "bn", "ja", "ko", "ar", "sw", "ha", "am", "tl", "ms", "mi",
]


async def main() -> None:
    await init_db()
    docs = await SystemOption.find(
        SystemOption.category == "profile_additional_section"
    ).to_list(2000)
    docs.sort(key=lambda d: d.order)
    print("rows:", len(docs))
    print("distinct values:", len({d.value for d in docs}))

    missing = [d.value for d in docs if any(not getattr(d, f"label_{l}", "") for l in LANGS)]
    print("rows missing a language:", len(missing), missing[:5])

    blank = [d.value for d in docs if any(not str(getattr(d, f"label_{l}", "")).strip() for l in LANGS)]
    print("rows with a blank translation:", len(blank))

    es_mismatch = [d.value for d in docs if d.label != d.label_es]
    print("rows where label != label_es:", len(es_mismatch))

    dupes = {}
    for d in docs:
        dupes[d.value] = dupes.get(d.value, 0) + 1
    print("duplicated values:", [k for k, v in dupes.items() if v > 1])

    by_prefix = {}
    for d in docs:
        prefix = d.value.split(".")[0] if "." in d.value else "(plain)"
        by_prefix[prefix] = by_prefix.get(prefix, 0) + 1
    print("prefixes:", by_prefix)

    for key in ("title", "love.option.quality_time.careImpact", "communication.opt.in_person.careImpact"):
        row = await SystemOption.find_one(
            SystemOption.category == "profile_additional_section",
            SystemOption.value == key,
        )
        if row is None:
            print(f"{key}: MISSING")
            continue
        print(f"--- {key} (order {row.order}) ---")
        for lang in LANGS:
            print(f"  {lang}: {getattr(row, f'label_{lang}', '')}")


if __name__ == "__main__":
    asyncio.run(main())