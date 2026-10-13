import json
import sys
from pathlib import Path
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json, to_html
from graphify.detect import save_manifest

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'auditoria'/'graphify-out'
ast=json.loads((OUT/'.graphify_extract.json').read_text(encoding='utf-8'))
detection=json.loads((OUT/'.graphify_detect.json').read_text(encoding='utf-8'))
analysis=json.loads((OUT/'.graphify_analysis.json').read_text(encoding='utf-8'))
G=build_from_json(ast,root=str(ROOT/'js'),directed=False)
communities={int(k):v for k,v in analysis['communities'].items()}
labels={cid:'Utilidades biblioteca '+str(cid+1) for cid in communities}
labels.update({4:'Control de carruseles',5:'Eventos y temporizadores',7:'Atributos y utilidades',9:'Adaptación del DOM',13:'Menú y encabezado',14:'Validación de suscripción'})
questions=suggest_questions(G,communities,labels)
cohesion={int(k):v for k,v in analysis['cohesion'].items()}
report=generate(G,communities,cohesion,labels,analysis['gods'],analysis['surprises'],detection,{'input':0,'output':0},str(ROOT/'js'),suggested_questions=questions)
preface='''# Alcance y límites del mapa auxiliar

Solo JavaScript externo: `js/`. No incluye HTML, manejadores inline ni imágenes. Se generó para apoyar la auditoría, cuya evidencia definitiva está en el código y las pruebas de navegador.

Advertencia de integridad: 9 autorrelaciones y 325 relaciones con los mismos extremos se agrupan en el grafo no dirigido. No hay extremos faltantes ni relaciones colgantes. El extractor no encontró símbolos en `validaciones.js` más allá del archivo; muchas funciones de `libs.js` tienen nombres minimizados. Las comunidades de bibliotecas se identifican de forma genérica para no inventar significado. Los nodos centrales no representan por sí solos la arquitectura del producto.

Costo de extracción semántica: 0 tokens de entrada / 0 de salida (solo AST). No mide el consumo total de esta conversación.

'''
(OUT/'GRAPH_REPORT.md').write_text(preface+report,encoding='utf-8')
to_json(G,communities,str(OUT/'graph.json'),community_labels=labels)
to_html(G,communities,str(OUT/'graph.html'),community_labels=labels)
save_manifest(detection['files'],manifest_path=str(OUT/'manifest.json'),root=ROOT/'js')
(OUT/'.graphify_python').write_text(sys.executable,encoding='utf-8')
(OUT/'.graphify_root').write_text(str(ROOT/'js'),encoding='utf-8')
(OUT/'cost.json').write_text(json.dumps({'runs':[{'date':'2026-10-13','input_tokens':0,'output_tokens':0,'files':3}],'total_input_tokens':0,'total_output_tokens':0},indent=2),encoding='utf-8')
print('Graph report and HTML exported. See GRAPH_REPORT.md for graph limitations.')
