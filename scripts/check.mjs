import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {products,stores} from '../js/data.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const failures=[];
const files=['index.html',...fs.readdirSync(path.join(root,'html')).filter(x=>x.endsWith('.html')).map(x=>'html/'+x)];
for(const file of files){const source=fs.readFileSync(path.join(root,file),'utf8');for(const m of source.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^(https?:|data:)/.test(m[1]))continue;const dest=path.resolve(root,path.dirname(file),m[1].split(/[?#]/)[0]);if(!dest.startsWith(root+path.sep)||!fs.existsSync(dest))failures.push(`${file}: missing ${m[1]}`);}}
for(const file of fs.readdirSync(path.join(root,'js')).filter(x=>x.endsWith('.js'))){const check=spawnSync(process.execPath,['--check',path.join(root,'js',file)],{encoding:'utf8'});if(check.status!==0)failures.push(check.stderr);}
for(const p of products){if(!Number.isSafeInteger(p.price)||p.price<=0||p.original<p.price||!stores.some(s=>s.id===p.store))failures.push('Invalid product '+p.id);for(const img of [p.image,...p.gallery||[]])if(!fs.existsSync(path.join(root,'img',img)))failures.push('Missing image '+img);}
for(const s of stores)if(!fs.existsSync(path.join(root,'img',s.logo)))failures.push('Missing store logo '+s.logo);
if(new Set(products.map(p=>p.id)).size!==products.length)failures.push('Duplicate product ids');
if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}else console.log(`OK: ${files.length} HTML entry points, JS syntax, ${products.length} products and ${stores.length} stores.`);
