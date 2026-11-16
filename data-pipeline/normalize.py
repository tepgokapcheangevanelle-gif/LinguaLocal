#!/usr/bin/env python3
"""Normalisation des termes français (implémentation de référence Python).

Règles (docs/database-schema.md §3) :
1. minuscules ;
2. NFD puis suppression des marques diacritiques ;
3. apostrophes typographiques -> apostrophe droite ;
4. espaces multiples réduits, bords rognés.

La même fonction existe en TypeScript dans app/src/lib/normalize.ts ; les deux
sont vérifiées par shared/normalization_cases.json.
"""
from __future__ import annotations

import re
import unicodedata

_APOSTROPHES = str.maketrans({"’": "'", "‘": "'", "‛": "'"})
_SPACES = re.compile(r"\s+")


def normalize(text: str) -> str:
    lowered = text.lower()
    decomposed = unicodedata.normalize("NFD", lowered)
    unaccented = "".join(c for c in decomposed if not unicodedata.combining(c))
    quoted = unaccented.translate(_APOSTROPHES)
    return _SPACES.sub(" ", quoted).strip()


if __name__ == "__main__":
    import json
    from pathlib import Path

    cases_path = Path(__file__).resolve().parent.parent / "shared" / "normalization_cases.json"
    cases = json.loads(cases_path.read_text(encoding="utf-8"))["cases"]
    failures = [c for c in cases if normalize(c["input"]) != c["expected"]]
    for case in failures:
        print(f"ÉCHEC {case['input']!r} -> {normalize(case['input'])!r} (attendu {case['expected']!r})")
    print(f"{len(cases) - len(failures)}/{len(cases)} cas passés")
    raise SystemExit(1 if failures else 0)
