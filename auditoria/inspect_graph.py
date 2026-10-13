"""Structural Graphify map of the JavaScript subsystem used by this audit."""
import json
from pathlib import Path
from graphify.detect import detect, save_manifest
from graphify.extract import collect_files, extract
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json, to_html
from graphify.diagnostics import diagnose_extraction, format_diagnostic_report

ROOT = Path(__file__).resolve().parents[1]
SCOPE = ROOT / 'js'
OUT = ROOT / 'auditoria' / 'graphify-out'
OUT.mkdir(exist_ok=True)
detection = detect(SCOPE)
files = [Path(p) for p in detection['files'].get('code', [])]
print(f"Corpus JavaScript: {detection['total_files']} files, {detection.get('total_words',0)} words")
ast = extract(files, cache_root=OUT)
print(f"AST: {len(ast['nodes'])} nodes, {len(ast['edges'])} edges")
ast.update(hyperedges=[], input_tokens=0, output_tokens=0)
G = build_from_json(ast, root=str(SCOPE), directed=False)
if G.number_of_nodes() == 0:
    raise SystemExit('Graphify produced no nodes; direct source evidence remains the audit authority.')
communities = cluster(G)
cohesion = score_all(G, communities)
labels = {cid:'JavaScript community '+str(cid) for cid in communities}
tokens = {'input':0,'output':0}
gods = god_nodes(G)
surprises = surprising_connections(G, communities)
questions = suggest_questions(G, communities, labels)
if not to_json(G, communities, str(OUT / 'graph.json')):
    raise SystemExit('Graphify refused graph export')
health = diagnose_extraction(ast, directed=False, root=str(SCOPE))
(OUT / 'health.json').write_text(json.dumps(health,ensure_ascii=False,indent=2),encoding='utf-8')
print(format_diagnostic_report(health))
(OUT / 'communities.json').write_text(json.dumps({str(cid):[G.nodes[n].get('label',n) for n in ns] for cid,ns in communities.items()},ensure_ascii=False,indent=2),encoding='utf-8')
(OUT / '.graphify_extract.json').write_text(json.dumps(ast,ensure_ascii=False),encoding='utf-8')
(OUT / '.graphify_detect.json').write_text(json.dumps(detection,ensure_ascii=False),encoding='utf-8')
(OUT / '.graphify_analysis.json').write_text(json.dumps({'communities':{str(k):v for k,v in communities.items()},'cohesion':{str(k):v for k,v in cohesion.items()},'gods':gods,'surprises':surprises,'questions':questions},ensure_ascii=False),encoding='utf-8')
print(f"Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges, {len(communities)} communities")
