import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2','.json':'application/json; charset=utf-8'};
const server=http.createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});return res.end();}
  let pathname;
  try {pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end('Invalid URL');}
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)||pathname.includes('\\')||pathname.split('/').some(p=>p.startsWith('.'))||pathname.startsWith('/auditoria/')||pathname.startsWith('/node_modules/')){res.writeHead(403);return res.end('Forbidden');}
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});return res.end('<html lang="es"><title>Nova Plaza · Página no encontrada</title><h1>No encontramos esta página</h1><a href="/">Volver al inicio</a></html>');}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",'Cache-Control':'no-cache'});
  if(req.method==='HEAD')return res.end();
  const stream=fs.createReadStream(file);stream.on('error',()=>res.destroy());stream.pipe(res);
});
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`Nova Plaza lista en http://127.0.0.1:${port}`));
