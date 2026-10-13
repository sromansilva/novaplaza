import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const pages={
  'index.html':['home','Descubre'],
  'html/01_login.html':['login','Iniciar sesión'],
  'html/02_register.html':['register','Crear cuenta'],
  'html/03_home.html':['home','Descubre'],
  'html/04_profile.html':['profile','Mi cuenta'],
  'html/05_favorites.html':['favorites','Mis favoritos'],
  'html/06_wallet.html':['wallet','Mi billetera'],
  'html/07_stores.html':['stores','Explorar tiendas'],
  'html/08_cart.html':['cart','Mi carrito'],
  'html/09_store_profile.html':['detail','Descubre el producto'],
};
for(const [file,[page,title]] of Object.entries(pages)) {
  const prefix=file.includes('/')?'../':'';
  fs.writeFileSync(path.join(root,file),`<!DOCTYPE html>
<html lang="es" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#7460d8">
  <meta name="description" content="Descubre moda, tecnología y buenos planes en Nova Plaza. Una experiencia de compras de demostración.">
  <title>${title} · Nova Plaza</title>
  <link rel="icon" href="${prefix}img/logo.png" type="image/png">
  <script src="${prefix}js/theme.js"></script>
  <link rel="stylesheet" href="${prefix}css/nova.css">
  <script type="module" src="${prefix}js/app.js"></script>
</head>
<body data-page="${page}">
  <a class="skip-link" href="#main">Saltar al contenido</a>
  <div id="app"><main id="main" class="loading-state"><span class="loading-orbit" aria-hidden="true"></span><p>Preparando tu próxima buena compra…</p></main></div>
  <noscript><p class="noscript-message">Activa JavaScript para explorar el catálogo interactivo. Esta demostración guarda los cambios en tu navegador.</p></noscript>
  <div id="toast-region" class="toast-region" aria-live="polite" aria-atomic="true"></div>
  <dialog id="modal" aria-labelledby="modal-title"></dialog>
  <dialog id="mobile-nav" class="nav-dialog" aria-labelledby="mobile-nav-title"></dialog>
</body>
</html>
`, 'utf8');
}
console.log('Generated '+Object.keys(pages).length+' shared page shells.');
