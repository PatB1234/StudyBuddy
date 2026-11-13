"""Cumulative usage counters, kept in a JSON file so they survive restarts.

Run `python stats.py` from Backend/ to print the current totals.
"""

import atexit
import json
import logging
import os
import sqlite3
import threading
import time

STATS_PATH = os.path.join("db", "stats.json")
USERS_DATABASE = os.path.join("db", "users.db")

METRICS = (
    "users_signed_up",
    "questions_generated",
    "questions_answered",
    "flashcards_made",
    "flashcard_decks_made",
    "summaries_made",
    "custom_prompts_asked",
    "total_interactions",
)

# Requests run on worker threads, so read-modify-write must be serialised
_LOCK = threading.Lock()

# Counts wait here and reach the file in batches, as a write per request was slow
FLUSH_SECONDS = 2
_pending = {}
_PENDING_LOCK = threading.Lock()
_flusher_started = False


def _read():
    try:
        with open(STATS_PATH, encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        return {}
    if not isinstance(data, dict):
        raise ValueError(f"{STATS_PATH} does not hold a JSON object")
    return data


def _write(data):
    os.makedirs(os.path.dirname(STATS_PATH) or ".", exist_ok=True)
    temp_path = STATS_PATH + ".tmp"
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)
        f.flush()
        os.fsync(f.fileno())
    # Swapping the file in means a crash mid-write can't leave it half written
    os.replace(temp_path, STATS_PATH)


def record(metric: str, amount: int = 1):
    """Add to a counter. Errors are logged, never raised, so stats can't break a request."""
    if amount <= 0:
        return
    with _PENDING_LOCK:
        _pending[metric] = _pending.get(metric, 0) + amount
    _start_flusher()


def flush():
    """Write the waiting counts to the file."""
    with _LOCK:
        with _PENDING_LOCK:
            waiting = dict(_pending)
            _pending.clear()
        if not waiting:
            return
        try:
            data = _read()
            for metric, amount in waiting.items():
                data[metric] = int(data.get(metric, 0)) + amount
            _write(data)
        # A corrupt file is left alone rather than overwritten with fresh zeros
        except (OSError, ValueError):
            logging.exception("Could not record usage stats %s", waiting)


def _flush_forever():
    while True:
        time.sleep(FLUSH_SECONDS)
        flush()


def _start_flusher():
    global _flusher_started
    with _PENDING_LOCK:
        if _flusher_started:
            return
        _flusher_started = True
    threading.Thread(target=_flush_forever, daemon=True).start()
    # Saves the last couple of seconds when the server stops
    atexit.register(flush)


def count_current_users():
    """Accounts that exist right now, unlike users_signed_up which never goes down."""
    try:
        database = sqlite3.connect(USERS_DATABASE)
        try:
            return database.execute("SELECT COUNT(*) FROM STUDENTS").fetchone()[0]
        finally:
            database.close()
    except sqlite3.Error:
        logging.exception("Could not count current users")
        return None


def get_all():
    flush()
    with _LOCK:
        data = _read()
    totals = {metric: int(data.get(metric, 0)) for metric in METRICS}
    totals["users_current"] = count_current_users()
    return totals


if __name__ == "__main__":
    for name, value in get_all().items():
        print(f"{name:<24}{value}")
