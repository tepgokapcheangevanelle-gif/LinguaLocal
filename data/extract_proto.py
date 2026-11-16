#!/usr/bin/env python3
"""Prototype d'extraction LinguaLocal (jour 1).

PDF (Tourneux & Yaya 1998) -> raw_peul_sample.csv (peul -> français)
                           -> inverted_sample.csv (français -> fulfulde)

Usage : python extract_proto.py Dictionnaire_Peul.pdf 60-69,300-309 out_dir
Les correspondances de lettres (CHAR_MAP) sont des HYPOTHESES à confirmer
visuellement sur des pages échantillons avant d'être figées.
"""
import csv, re, sys, collections
from pathlib import Path
import pdfplumber

# Lettres spéciales : uniquement pour les caractères en police Doulos (SIL).
CHAR_MAP = {'÷': 'ɓ', 'é': 'ɗ', '»': 'ŋ', 'ñ': 'ƴ', '°': 'Ɓ'}  # ɓ ŋ ƴ Ɓ confirmés visuellement ; ɗ très probable
BULLET = '•'
FOOTER_TOP = 690            # en dessous : pied de page (numéro, référence)
CAT_RE = re.compile(r',\s*((?:n|v|adj|adv|prép|conj|pron|interj|idéo|num|loc)[a-zé\.\s]*?\.)(?=\s|;|$)')
FOOTER_RE = re.compile(r'Karthala|Wageningen|Montpellier|Dictionnaire peul de l|suivi d.un index|OURNEUX|^T H\. & Y|547 p\.')
DANGLING = re.compile(r'\b(de|du|des|d|à|au|la|le|les|un|une|et|ou)$')
SCI_FRAG = re.compile(r'\b(var|sp|spp|subsp|race|cv)\.|\bL\.|\bsyn\.|\bcf\.')

def parse_pages(spec, n):
    out = []
    for part in spec.split(','):
        a, _, b = part.partition('-')
        out += range(int(a), int(b or a) + 1)
    return [p for p in out if 1 <= p <= n]

def fam(fontname):
    f = fontname.split('+')[-1]
    if 'Doulos' in f: return 'P'
    if 'Symbol' in f: return 'S'
    return 'T'

def make_lines(page):
    chars = [c for c in page.chars if c['top'] < FOOTER_TOP]
    chars.sort(key=lambda c: (c['top'], c['x0']))
    lines = []
    for c in chars:
        if lines and c['top'] < lines[-1]['bottom'] - 3:
            lines[-1]['chars'].append(c)
            lines[-1]['bottom'] = max(lines[-1]['bottom'], c['bottom'])
        else:
            lines.append({'chars': [c], 'bottom': c['bottom']})
    res = []
    for ln in lines:
        cs = sorted(ln['chars'], key=lambda c: c['x0'])
        full, plain, inv = [], [], collections.Counter()
        for c in cs:
            t = c['text']; fn = c['fontname']; f = fam(fn)
            if f == 'P':
                inv[t] += 1
                t = CHAR_MAP.get(t, t)
            full.append(t)
            if 'Italic' not in fn:
                plain.append(t)
        first = cs[0]
        res.append({
            'x0': first['x0'],
            'text': ''.join(full).strip(),
            'plain': ''.join(plain),
            'bold': 'Bold' in first['fontname'],
            'fam': fam(first['fontname']),
            'doulos': inv,
        })
    return [r for r in res if r['text'] and not re.fullmatch(r'\d+', r['text']) and not FOOTER_RE.search(r['text'])]

def split_forms(head):
    """'liingu / liɗɗi (ngu/ɗi), n.' -> (sing, plur, classes, cat)"""
    cat = ''
    m = CAT_RE.search(head)
    if m: cat = m.group(1).strip(); head = head[:m.start()]
    cls = ''
    m = re.search(r'\(([^)]*)\)\s*$', head.strip())
    if m: cls = m.group(1); head = head.strip()[:m.start()]
    forms = [x.strip() for x in head.split(' / ')]
    return forms[0], (forms[1] if len(forms) > 1 else ''), cls, cat

def clean_gloss(plain):
    g = re.sub(r'\([^)]*\)', '', plain)          # (Malvaceae), précisions
    g = re.sub(r'\s+', ' ', g).strip(' ,;.')
    terms = []
    for frag in re.split(r'[;,]', g):
        frag = frag.strip()
        if not frag or SCI_FRAG.search(frag): continue
        if len(frag.split()) > 6: continue         # trop long : reste en définition
        if frag[0].isupper() or re.search(r'[\d=]', frag) or DANGLING.search(frag): continue  # auteurs, années, fragments coupés
        terms.append(frag)
    return g, terms

def main(pdf_path, spec, outdir):
    outdir = Path(outdir); outdir.mkdir(parents=True, exist_ok=True)
    stats = collections.Counter(); doulos_inv = collections.Counter()
    rows = []
    with pdfplumber.open(pdf_path) as pdf:
        pages = parse_pages(spec, len(pdf.pages))
        parsed = {p: make_lines(pdf.pages[p - 1]) for p in pages}
        # marge gauche par parité de page = valeur la plus fréquente du x0 minimal
        margins = {}
        for par in (0, 1):
            v = [round(min(l['x0'] for l in parsed[p])) for p in pages if p % 2 == par and parsed[p]]
            margins[par] = collections.Counter(v).most_common(1)[0][0] if v else 133
        entry, pending_bullet, last = None, False, None
        for p in pages:
            m = margins[p % 2]
            for ln in parsed[p]:
                stats['lignes'] += 1
                doulos_inv.update(ln['doulos'])
                t, x = ln['text'], ln['x0']
                at_margin = abs(x - m) <= 4
                if ln['fam'] == 'S' and t.startswith(BULLET):
                    body = t[1:].strip(); pbody = ln['plain'].lstrip(BULLET).strip()
                    if entry is not None:
                        if body:
                            entry['glosses'].append([pbody]); last = 'gloss'; pending_bullet = False
                        else:
                            pending_bullet = True
                    continue
                if pending_bullet and entry is not None and ln['fam'] != 'S':
                    entry['glosses'].append([ln['plain'].strip()]); pending_bullet = False; last = 'gloss'; continue
                if ln['bold'] and at_margin:                      # nouvelle entrée
                    sing, plur, cls, cat = split_forms(t)
                    entry = {'page': p, 'head_raw': t, 'sing': sing, 'plur': plur,
                             'classes': cls, 'cat': cat, 'etym': '', 'glosses': [], 'notes': []}
                    rows.append(entry); stats['entrées'] += 1; last = 'head'; continue
                if entry is None: stats['avant_1re_entrée'] += 1; continue
                if t.startswith('«') and at_margin:
                    entry['etym'] = t; last = 'etym'; continue
                if last == 'gloss' and not ln['bold'] and x < m + 12 and not t.startswith(('«', 'Cf', 'cf', 'syn')):
                    entry['glosses'][-1].append(ln['plain'].strip()); continue
                if ln['fam'] == 'S': stats['sous_entrée_marqueur'] += 1
                entry['notes'].append(t); last = 'note'
    # --- sorties
    raw_path = outdir / 'raw_peul_sample.csv'
    inv_path = outdir / 'inverted_sample.csv'
    n_gloss = n_terms = sans_gloss = 0
    inverted = []
    with open(raw_path, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f); w.writerow(['page', 'head_raw', 'peul_sing', 'peul_plur', 'classes', 'category', 'etym_quote', 'gloss_raw', 'notes_raw'])
        for e in rows:
            glosses = [' '.join(g).strip() for g in e['glosses']]
            if not glosses: sans_gloss += 1
            w.writerow([e['page'], e['head_raw'], e['sing'], e['plur'], e['classes'], e['cat'], e['etym'],
                        ' || '.join(glosses), ' | '.join(e['notes'])[:400]])
            for g in glosses:
                n_gloss += 1
                full, terms = clean_gloss(g)
                for term in terms:
                    n_terms += 1
                    inverted.append([term, e['sing'], e['plur'], e['cat'], full, e['page']])
    with open(inv_path, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f); w.writerow(['french_term', 'fulfulde_term', 'fulfulde_plural', 'category', 'definition', 'page'])
        w.writerows(inverted)
    print(f"Pages traitées : {len(pages)} | marges (pair/impair) : {margins}")
    print(f"Entrées : {stats['entrées']} | sans équivalent : {sans_gloss} | équivalents (sens) : {n_gloss}")
    print(f"Termes français obtenus après inversion : {n_terms}")
    print(f"Marqueurs de sous-entrée vus : {stats['sous_entrée_marqueur']}")
    print("Caractères en police Doulos (original -> nombre) :", dict(doulos_inv.most_common(20)))
    return rows, inverted

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3])
