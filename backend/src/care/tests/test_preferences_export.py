"""Export de preferencias: render puro, escritura atómica y CLI."""
import csv
import json
from datetime import date
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

from src.care.preferences import export


RECORDS = [
    {
        "user_id": "u2",
        "dimension": "music",
        "tag": None,
        "score": 40,
        "created_at": "2026-10-19T10:00:00",
        "updated_at": "2026-10-19T10:00:00",
    },
    {
        "user_id": "u1",
        "dimension": "values",
        "tag": "appearance",
        "score": 80,
        "created_at": "2026-10-19T09:00:00",
        "updated_at": "2026-10-19T09:30:00",
    },
]


def test_render_json_has_required_shape():
    payload = json.loads(render := export.render_json(RECORDS, date(2026, 10, 19)))
    assert payload["date"] == "2026-10-19"
    assert payload["count"] == 2
    assert payload["records"] == RECORDS
    assert render.startswith("{")


def test_render_csv_has_headers_and_rows():
    content = export.render_csv(RECORDS)
    rows = list(csv.DictReader(content.splitlines()))
    assert rows[0]["user_id"] == "u2"
    assert rows[0]["tag"] == ""
    assert rows[1]["dimension"] == "values"
    assert list(rows[0].keys()) == [
        "user_id", "dimension", "tag", "score", "created_at", "updated_at"
    ]


def test_write_export_creates_both_files_and_overwrites(tmp_path):
    first = export.write_export(RECORDS, date(2026, 10, 19), tmp_path)
    assert first["count"] == 2
    json_path = Path(first["files"]["json"])
    csv_path = Path(first["files"]["csv"])
    assert json_path.read_text(encoding="utf-8")
    with csv_path.open(encoding="utf-8-sig", newline="") as fh:
        assert len(list(csv.DictReader(fh))) == 2

    second = export.write_export(RECORDS[:1], date(2026, 10, 19), tmp_path)
    payload = json.loads(json_path.read_text(encoding="utf-8"))
    assert second["count"] == 1
    assert payload["count"] == 1


@pytest.mark.asyncio
async def test_build_export_uses_collected_records(tmp_path, monkeypatch):
    monkeypatch.setenv("CARE_EXPORTS_DIR", str(tmp_path))
    with patch.object(export, "collect_records", AsyncMock(return_value=RECORDS)):
        result = await export.build_export(date(2026, 10, 19))
    assert result["count"] == 2
    assert Path(result["files"]["json"]).exists()


def test_cli_rejects_invalid_date():
    assert export.main(["--date", "2026-13-40"]) == 2
