#!/usr/bin/env python3
"""Construit la base de test de l'application (livrable du jour 1).

Source : data/inverted_sample.csv, paires réellement extraites du
« Dictionnaire peul de l'agriculture et de la nature » (Tourneux & Daïrou, 1998)
sur les pages 60-69 et 300-309. Aucun mot n'est saisi de mémoire.

Sortie : app/assets/db/seed_test.db, avec le schéma de
docs/database-schema.md. Toutes les lignes sont marquées `unverified`.

Usage : python build_seed_db.py
"""
from __future__ import annotations

import csv
import sqlite3
import sys
from datetime import date
from pathlib import Path

from normalize import normalize

ROOT = Path(__file__).resolve().parent
SOURCE_CSV = ROOT / "data" / "inverted_sample.csv"
OUTPUT_DB = ROOT.parent / "app" / "assets" / "db" / "seed_test.db"

SOURCE_TITLE = "Dictionnaire peul de l'agriculture et de la nature (Diamaré, Cameroun)"
SOURCE_AUTHOR = "Henry Tourneux, Yaya Daïrou"
SOURCE_YEAR = 1998
DIALECT = "Extrême-Nord"
DICTIONARY_VERSION = "test-0.1"

# 30 entrées de test, choisies parmi les paires extraites et vérifiables.
SEED_TERMS = [
    "sac",
    "petit serpent très venimeux",
    "babouin",
    "brouette",
    "sorgho repiqué",
    "punaise de lit",
    "moucheron",
    "foin",
    "billet de mille francs",
    "être bon marché",
    "prix bas",
    "balai",
    "échelle de grenier",
    "être proche",
    "indigotier",
    "fosse de teinturier",
    "soulever",
    "relever",
    "couler",
    "se déplacer",
    "s’assécher",
    "s’infiltrer",
    "graisse",
    "gras",
    "être gras",
    "mûrir",
    "être cuit",
    "coeur",
    "haricot vert",
    "poisson",
]

SCHEMA = """
PRAGMA foreign_keys = ON;

CREATE TABLE db_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE languages (
  id   INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE TABLE dialects (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  language_id INTEGER NOT NULL REFERENCES languages(id)
);

CREATE TABLE sources (
  id           INTEGER PRIMARY KEY,
  title        TEXT NOT NULL,
  author       TEXT,
  year         INTEGER,
  license_note TEXT
);

CREATE TABLE entries (
  id                   INTEGER PRIMARY KEY,
  term                 TEXT NOT NULL,
  term_normalized      TEXT NOT NULL,
  language_id          INTEGER NOT NULL REFERENCES languages(id),
  grammatical_category TEXT,
  definition           TEXT
);

CREATE TABLE translations (
  id                    INTEGER PRIMARY KEY,
  entry_id              INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  target_term           TEXT NOT NULL,
  target_term_normalized TEXT NOT NULL,
  dialect_id            INTEGER REFERENCES dialects(id),
  example               TEXT,
  validation_status     TEXT NOT NULL DEFAULT 'unverified'
                        CHECK (validation_status IN ('verified','unverified')),
  source_id             INTEGER REFERENCES sources(id),
  source_reference      TEXT,
  note                  TEXT
);

CREATE INDEX idx_entries_term_norm   ON entries(term_normalized);
CREATE INDEX idx_translations_entry  ON translations(entry_id);
CREATE INDEX idx_translations_status ON translations(validation_status);
"""


def main() -> int:
    with SOURCE_CSV.open(encoding="utf-8", newline="") as handle:
        rows = {row["french_term"]: row for row in csv.DictReader(handle)}

    missing = [term for term in SEED_TERMS if term not in rows]
    if missing:
        print(f"Termes absents de {SOURCE_CSV.name} : {missing}", file=sys.stderr)
        return 1

    OUTPUT_DB.parent.mkdir(parents=True, exist_ok=True)
    if OUTPUT_DB.exists():
        OUTPUT_DB.unlink()

    con = sqlite3.connect(OUTPUT_DB)
    con.executescript(SCHEMA)
    con.executemany(
        "INSERT INTO db_meta (key, value) VALUES (?, ?)",
        [
            ("dictionary_version", DICTIONARY_VERSION),
            ("built_at", date.today().isoformat()),
            ("dataset", "seed_test"),
        ],
    )
    con.executemany(
        "INSERT INTO languages (id, code, name) VALUES (?, ?, ?)",
        [(1, "fr", "Français"), (2, "ff", "Fulfulde")],
    )
    con.execute(
        "INSERT INTO dialects (id, name, description, language_id) VALUES (?, ?, ?, ?)",
        (1, DIALECT, "Variante de l'Extrême-Nord du Cameroun", 2),
    )
    con.execute(
        "INSERT INTO sources (id, title, author, year, license_note) VALUES (?, ?, ?, ?, ?)",
        (1, SOURCE_TITLE, SOURCE_AUTHOR, SOURCE_YEAR, None),
    )

    for entry_id, term in enumerate(SEED_TERMS, start=1):
        row = rows[term]
        con.execute(
            """INSERT INTO entries
               (id, term, term_normalized, language_id, grammatical_category, definition)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                entry_id,
                term,
                normalize(term),
                1,
                row["category"] or None,
                row["definition"] or None,
            ),
        )
        con.execute(
            """INSERT INTO translations
               (id, entry_id, target_term, target_term_normalized, dialect_id,
                example, validation_status, source_id, source_reference, note)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                entry_id,
                entry_id,
                row["fulfulde_term"],
                normalize(row["fulfulde_term"]),
                1,
                None,
                "unverified",
                1,
                f"p. {row['page']}",
                None,
            ),
        )

    con.commit()
    entries = con.execute("SELECT COUNT(*) FROM entries").fetchone()[0]
    translations = con.execute("SELECT COUNT(*) FROM translations").fetchone()[0]
    orphans = con.execute(
        "SELECT COUNT(*) FROM entries e LEFT JOIN translations t ON t.entry_id = e.id WHERE t.id IS NULL"
    ).fetchone()[0]
    con.close()

    print(f"Base générée : {OUTPUT_DB.relative_to(ROOT.parent)}")
    print(f"Entrées : {entries} | traductions : {translations} | entrées sans traduction : {orphans}")
    print(f"Termes demandés : {len(SEED_TERMS)} | sources trouvées : {len(rows)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
