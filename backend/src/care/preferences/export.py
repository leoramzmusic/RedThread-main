"""Export diario de preferencias CARE a JSON y CSV (CLI + endpoint admin)."""
import argparse
import asyncio
import csv
import io
import json
import os
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from src.care.models.care_user_preference import CareUserPreference

FIELDS = ["user_id", "dimension", "tag", "score", "created_at", "updated_at"]
DEFAULT_EXPORTS_DIR = (
    Path(__file__).resolve().parents[3] / "exports" / "preferences"
)


def _exports_dir() -> Path:
    return Path(os.getenv("CARE_EXPORTS_DIR", str(DEFAULT_EXPORTS_DIR)))


def _record(doc: Any) -> Dict[str, Any]:
    return {
        "user_id": doc.user_id,
        "dimension": doc.dimension,
        "tag": doc.tag,
        "score": doc.score,
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
        "updated_at": doc.updated_at.isoformat() if doc.updated_at else None,
    }


async def collect_records() -> List[Dict[str, Any]]:
    """Filas ordenadas de forma determinista para snapshots reproducibles."""
    docs = await CareUserPreference.find_all().sort(
        "dimension", "user_id"
    ).to_list()
    return [_record(doc) for doc in docs]


def render_json(
    records: List[Dict[str, Any]],
    day: date,
    generated_at: Optional[str] = None,
) -> str:
    payload = {
        "generated_at": generated_at or datetime.utcnow().isoformat(),
        "date": day.isoformat(),
        "count": len(records),
        "records": records,
    }
    return json.dumps(payload, ensure_ascii=False, indent=2)


def render_csv(records: List[Dict[str, Any]]) -> str:
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=FIELDS)
    writer.writeheader()
    for record in records:
        writer.writerow({field: record.get(field) for field in FIELDS})
    return buffer.getvalue()


def _atomic_write(path: Path, content: str) -> None:
    tmp = path.with_name(path.name + ".tmp")
    encoding = "utf-8-sig" if path.suffix == ".csv" else "utf-8"
    tmp.write_text(content, encoding=encoding)
    os.replace(tmp, path)


def write_export(
    records: List[Dict[str, Any]],
    day: Optional[date] = None,
    exports_dir: Optional[os.PathLike] = None,
) -> Dict[str, Any]:
    target_day = day or datetime.utcnow().date()
    folder = Path(exports_dir) if exports_dir else _exports_dir()
    folder.mkdir(parents=True, exist_ok=True)
    json_path = folder / f"{target_day.isoformat()}.json"
    csv_path = folder / f"{target_day.isoformat()}.csv"
    generated_at = datetime.utcnow().isoformat()
    _atomic_write(json_path, render_json(records, target_day, generated_at))
    _atomic_write(csv_path, render_csv(records))
    return {
        "date": target_day.isoformat(),
        "count": len(records),
        "files": {"json": str(json_path), "csv": str(csv_path)},
        "records": records,
    }


async def build_export(day: Optional[date] = None) -> Dict[str, Any]:
    records = await collect_records()
    return write_export(records, day)


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Exporta preferencias CARE a JSON/CSV"
    )
    parser.add_argument("--date", help="Fecha YYYY-MM-DD (default: hoy UTC)")
    args = parser.parse_args(argv)

    day = None
    if args.date:
        try:
            day = date.fromisoformat(args.date)
        except ValueError:
            print(f"Fecha inválida: {args.date}. Usa YYYY-MM-DD.")
            return 2

    async def run() -> Dict[str, Any]:
        from src.core.database import close_db, init_db

        await init_db()
        try:
            return await build_export(day)
        finally:
            await close_db()

    try:
        result = asyncio.run(run())
    except Exception as exc:
        print(f"No se pudo exportar: {exc}")
        return 1
    print(
        f"[export] {result['count']} preferencias -> "
        f"{result['files']['json']} / {result['files']['csv']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
