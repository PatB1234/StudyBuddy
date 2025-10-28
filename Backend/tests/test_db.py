import pytest
from ..db import hash_password, verify_password
from .. import db


def test_hash_and_verify_success():
    pw = "TestPassword123!"
    hashed = hash_password(pw)
    assert hashed != pw
    assert verify_password(pw, hashed) is True


def test_verify_fails_for_wrong_password():
    hashed = hash_password("correct_password")
    assert verify_password("incorrect_password", hashed) is False


def test_hash_is_unique_each_call():
    pw = "repeated_password"
    h1 = hash_password(pw)
    h2 = hash_password(pw)
    assert h1 != h2


def test_empty_password_hash_and_verify():
    pw = ""
    hashed = hash_password(pw)
    assert verify_password(pw, hashed) is True


def test_cursor_func_creates_writes_reads_and_deletes_table(tmp_path, monkeypatch):
    temp_db = tmp_path / "test_users.db"
    monkeypatch.setattr(db, "DATABASE_URL", str(temp_db))

    # Create table
    db.cursor_func(
        "CREATE TABLE IF NOT EXISTS tst (id INTEGER, val TEXT);", False)

    # Insert using positional values parameter
    db.cursor_func("INSERT INTO tst (id, val) VALUES (?, ?);",
                   False, (1, "hello"))

    # Read using named values parameter
    rows = db.cursor_func(
        "SELECT id, val FROM tst WHERE id = ?;", True, values=(1,))
    assert rows == [(1, "hello")]

    # Insert a second row using named values and verify selecting all rows
    db.cursor_func("INSERT INTO tst (id, val) VALUES (?, ?);",
                   False, values=[2, "world"])
    rows_all = db.cursor_func("SELECT id, val FROM tst ORDER BY id;", True)
    assert rows_all == [(1, "hello"), (2, "world")]

    # Drop the table and verify it no longer exists
    db.cursor_func("DROP TABLE tst;", False)
    tables = db.cursor_func(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='tst';", True)
    assert tables == []
