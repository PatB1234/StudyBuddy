import json
import sqlite3
import threading

import pytest

from .. import stats


@pytest.fixture(autouse=True)
def temp_files(tmp_path, monkeypatch):
    monkeypatch.setattr(stats, "STATS_PATH", str(tmp_path / "db" / "stats.json"))
    monkeypatch.setattr(stats, "USERS_DATABASE", str(tmp_path / "users.db"))
    return tmp_path


def test_missing_file_reads_as_zero():
    totals = stats.get_all()
    assert all(totals[metric] == 0 for metric in stats.METRICS)


def test_record_creates_file_and_accumulates(temp_files):
    stats.record("flashcards_made", 12)
    stats.record("flashcards_made", 8)
    stats.record("summaries_made")

    assert stats.get_all()["flashcards_made"] == 20
    assert stats.get_all()["summaries_made"] == 1
    with open(temp_files / "db" / "stats.json", encoding="utf-8") as f:
        assert json.load(f) == {"flashcards_made": 20, "summaries_made": 1}


def test_zero_or_negative_amounts_are_ignored():
    stats.record("questions_generated", 0)
    stats.record("questions_generated", -5)
    assert stats.get_all()["questions_generated"] == 0


def test_concurrent_records_are_not_lost():
    threads = [
        threading.Thread(target=stats.record, args=("total_interactions",))
        for _ in range(50)
    ]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()
    assert stats.get_all()["total_interactions"] == 50


def test_corrupt_file_is_not_overwritten(temp_files):
    path = temp_files / "db" / "stats.json"
    path.parent.mkdir()
    path.write_text("{not json", encoding="utf-8")

    stats.record("summaries_made")
    assert path.read_text(encoding="utf-8") == "{not json"


def test_current_users_counts_students_table(temp_files):
    database = sqlite3.connect(temp_files / "users.db")
    database.execute("CREATE TABLE STUDENTS (name TEXT, email TEXT, password TEXT, id INTEGER)")
    database.executemany(
        "INSERT INTO STUDENTS VALUES (?, ?, ?, ?)",
        [("a", "a@x.com", "h", 0), ("b", "b@x.com", "h", 1)],
    )
    database.commit()
    database.close()

    assert stats.get_all()["users_current"] == 2


def test_current_users_is_none_without_database():
    assert stats.get_all()["users_current"] is None
