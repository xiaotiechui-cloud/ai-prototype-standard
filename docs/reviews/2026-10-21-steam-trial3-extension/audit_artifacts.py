"""Extract bounded artifact evidence; never emit embedded document bodies."""
from __future__ import annotations
import collections
import hashlib
import json
import re
from inspect_extension import HERE, sources, write_json


def assignment(text, name):
    m = re.search(r'window\.' + name + r'\s*=\s*', text)
    if not m:
        raise ValueError(name)
    return json.JSONDecoder().raw_decode(text, m.end())[0], text.count('\n', 0, m.start()) + 1


def section_text(section):
    if isinstance(section, str):
        return section
    return str(section.get('body', section.get('content', section.get('text', section.get('md', '')))))


def main():
    result = {'method': 'embedded-json-and-external-file-hashes', 'browser_verification': 'not_run', 'versions': {}}
    for version, src in sources().items():
        comps, comp_line = assignment(src['text'], 'COMP_DOCS')
        docs, doc_line = assignment(src['text'], 'DOCS')
        diagrams, diagram_line = assignment(src['text'], 'DIAGRAMS')
        repeated = []
        for n in range(10):
            buckets = collections.defaultdict(list)
            for key, comp in comps.items():
                sections = comp.get('sections', [])
                if n < len(sections):
                    text = section_text(sections[n])
                    if text:
                        buckets[text].append(key)
            if buckets:
                text, ids = max(buckets.items(), key=lambda p: len(p[1]))
                repeated.append({'section': n + 1, 'max_exact_repetitions': len(ids), 'sample_ids': ids[:4],
                                 'short_evidence': text.replace('\n', ' ')[:150]})
        files = []
        for doc in docs:
            external = __import__('pathlib').Path(src['path']).parent / doc['file']
            embedded_hash = hashlib.sha256(doc['md'].encode('utf-8')).hexdigest()
            external_hash = None
            raw_hash = None
            diff = None
            if external.is_file():
                raw = external.read_bytes()
                raw_hash = hashlib.sha256(raw).hexdigest()
                external_text = raw.decode('utf-8-sig').replace('\r\n', '\n')
                external_hash = hashlib.sha256(external_text.encode('utf-8')).hexdigest()
                embedded_text = doc['md'].replace('\r\n', '\n')
                if embedded_text != external_text:
                    i = next((i for i, (a, b) in enumerate(zip(embedded_text, external_text)) if a != b), min(len(embedded_text), len(external_text)))
                    diff = {'first_diff_embedded_line': embedded_text.count('\n', 0, i) + 1,
                            'embedded_chars': len(embedded_text), 'external_chars': len(external_text),
                            'embedded_short': embedded_text[i:i + 95], 'external_short': external_text[i:i + 95]}
            normalized = hashlib.sha256(doc['md'].replace('\r\n', '\n').encode('utf-8')).hexdigest()
            files.append({'file': doc['file'], 'embedded_sha256_utf8': embedded_hash,
                          'external_path': str(external), 'external_raw_sha256': raw_hash,
                          'equal_after_bom_newline_normalization': external_hash == normalized if external_hash else None,
                          'difference': diff})
        # Short local evidence only. Claims are document text, never treated as verification.
        claims = []
        patterns = [('search', r'无匹配[^\n]{0,85}|无结果[^\n]{0,85}|历史[^\n]{0,85}'),
                    ('async', r'迟到[^\n]{0,85}|reqVer[^\n]{0,85}'),
                    ('verification', r'未验证[^\n]{0,85}|未执行[^\n]{0,85}|已通过[^\n]{0,85}')]
        for prefix, rx in patterns:
            matching = [d for d in docs if d['file'].startswith({'search': '03_', 'async': '05_', 'verification': '08_'}[prefix])]
            if matching:
                doc = matching[0]
                for m in list(re.finditer(rx, doc['md']))[:3]:
                    claims.append({'topic': prefix, 'file': doc['file'],
                                   'embedded_line': doc['md'].count('\n', 0, m.start()) + 1,
                                   'short_evidence': m.group(0)[:110]})
        comp_examples = []
        for cid in ['COM-CLIENT-C01', 'COM-CLIENT-C05', 'ADM-PRODUCT-01-C01', 'ADM-GOODS-01-C01']:
            if cid in comps:
                comp_examples.append({'id': cid, 'name': comps[cid].get('name'),
                                      'section_count': len(comps[cid].get('sections', []))})
        diagram_sources = {d.get('src', '').strip() for d in diagrams}
        fences = []
        for doc in docs:
            for m in re.finditer(r'```plantuml\s*\n([\s\S]*?)```', doc['md']):
                fences.append({'file': doc['file'], 'embedded_line': doc['md'].count('\n', 0, m.start()) + 1,
                               'exact_trimmed_source_match': m.group(1).strip() in diagram_sources})
        result['versions'][version] = {'component_assignment_line': comp_line, 'document_assignment_line': doc_line,
                                       'diagram_assignment_line': diagram_line, 'repeated_sections': repeated,
                                       'component_examples': comp_examples, 'documents': files, 'claims': claims,
                                       'plantuml_fence_mapping': fences,
                                       'diagrams': [{'id': d['id'], 'source_document': d.get('from'),
                                                     'source_sha256': hashlib.sha256(d.get('src', '').encode('utf-8')).hexdigest(),
                                                     'contains_svg': '<svg' in d.get('svg', '')} for d in diagrams]}
    write_json(HERE / '10_交付物局部核对.json', result)
    print(json.dumps({v: {'components': len(assignment(s['text'], 'COMP_DOCS')[0]),
                         'document_count': len(result['versions'][v]['documents']),
                         'external_match': collections.Counter(str(d['equal_after_bom_newline_normalization']) for d in result['versions'][v]['documents']),
                         'diagram_fences': len(result['versions'][v]['plantuml_fence_mapping']),
                         'unmapped_exact_sources': sum(not f['exact_trimmed_source_match'] for f in result['versions'][v]['plantuml_fence_mapping']),
                         'section_shape': list(next(iter(assignment(s['text'], 'COMP_DOCS')[0].values()))['sections'][0]) if isinstance(next(iter(assignment(s['text'], 'COMP_DOCS')[0].values()))['sections'][0], dict) else 'string',
                         'repeated_sections': result['versions'][v]['repeated_sections'] if v == 'final' else [],
                         'diff_samples': [{'file': d['file'], **d['difference']} for d in result['versions'][v]['documents'] if d['difference']][:3]}
                      for v, s in sources().items()}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
