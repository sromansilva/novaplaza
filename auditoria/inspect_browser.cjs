// Usage: node auditoria/inspect_browser.cjs <absolute audit-tools directory>
// The dependencies live outside the project. The HTTP server only listens on loopback.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(path.join(process.argv[2], 'node_modules/playwright'));
const AxeBuilder = require(path.join(process.argv[2], 'node_modules/@axe-core/playwright')).default;
const root = path.resolve(__dirname, '..');
const out = __dirname;
const shots = path.join(out, 'capturas');
fs.mkdirSync(shots, { recursive: true });
const types = { '.html':'text/html; charset=utf-8', '.js':'application/javascript', '.css':'text/css', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.woff':'font/woff', '.woff2':'font/woff2' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!(file === root || file.startsWith(root + path.sep))) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
const flowsOnly = process.argv.includes('--flows-only');
const results = flowsOnly ? JSON.parse(fs.readFileSync(path.join(out,'browser-results.json'),'utf8')) : { date:'2026-10-13', browser:'Microsoft Edge (Chromium, headless)', states:[], flows:[], scope:'Local static site. No load test or deployed-server audit.' };
let browser;
let origin;
function save() { fs.writeFileSync(path.join(out, 'browser-results.json'), JSON.stringify(results, null, 2)); }
async function ready(page, url) {
  await page.goto(origin + url, { waitUntil:'load', timeout:30000 });
  await page.locator('#page-preloader').waitFor({ state:'hidden', timeout:5000 }).catch(() => {});
  await page.waitForTimeout(150);
}
async function dismiss(page) { await page.evaluate(() => window.Swal?.close()); }
async function flow(name, fn) {
  const previous=results.flows.find(f=>f.name===name);
  if (process.argv.includes('--only-retry') && previous && !previous.error) return;
  if(previous?.error) (results.harnessErrorsBeforeRetry ||= []).push(previous);
  results.flows=results.flows.filter(f=>f.name!==name);
  try { results.flows.push({ name, ...await fn() }); }
  catch(error) { results.flows.push({ name, error:String(error) }); }
  save();
  console.log(JSON.stringify(results.flows.at(-1)));
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless:true });
  const routes = ['/index.html', ...fs.readdirSync(path.join(root,'html')).filter(f=>f.endsWith('.html')).sort().map(f=>'/html/'+f)];
  if (!flowsOnly) for (const viewport of [{width:1440,height:900}, {width:390,height:844}]) {
    const context = await browser.newContext({viewport});
    for (const route of routes) {
      const page = await context.newPage();
      const errors = [], failed = [], requests = [];
      page.on('pageerror', e => errors.push(String(e)));
      page.on('response', r => { if(r.status() >= 400) failed.push({url:r.url(),status:r.status()}); });
      page.on('requestfailed', r => failed.push({url:r.url(),failure:r.failure()}));
      page.on('request', r => requests.push({url:r.url(), method:r.method(),type:r.resourceType()}));
      try {
        await ready(page,route);
        for (const theme of ['light','dark']) {
          if (theme === 'dark') {
            if (!await page.locator('#toggle').count()) continue;
            // Dispatch the actual change handler even when the template visually hides the input.
            await page.locator('#toggle').evaluate(el=>el.click());
            await page.waitForTimeout(150);
          }
          const layout = await page.evaluate(() => ({
            title:document.title, viewport:innerWidth, width:document.documentElement.scrollWidth,
            overflow:document.documentElement.scrollWidth>innerWidth,
            dark:document.body.classList.contains('dark-theme'),
            brokenImages:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.getAttribute('src')),
            forms:[...document.forms].map(f=>({id:f.id,action:f.action,method:f.method})),
            jquery:window.jQuery?.fn.jquery, uikit:window.UIkit?.version,
          }));
          const a11y = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
          const screenshot = path.basename(route,'.html')+'-'+viewport.width+'-'+theme+'.png';
          await page.screenshot({path:path.join(shots,screenshot),fullPage:true,animations:'disabled'});
          results.states.push({route,viewport,theme,layout,errors:[...errors],failedRequests:[...failed],requests:[...requests],screenshot,
            accessibility:a11y.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,helpUrl:v.helpUrl,nodes:v.nodes.map(n=>({target:n.target,html:n.html,failureSummary:n.failureSummary}))}))});
          save();
          console.log(route+' '+viewport.width+' '+theme+' errors='+errors.length+' failed='+failed.length+' axe='+a11y.violations.length+' overflow='+layout.overflow);
        }
      } catch(error) {
        results.states.push({route,viewport,error:String(error),errors,failedRequests:failed}); save();
      }
      await page.close();
    }
    await context.close();
  }
  const context = await browser.newContext({viewport:{width:1440,height:900}});
  const page = await context.newPage();
  const requests = [], errors = [];
  page.on('request', r=>requests.push({url:r.url(),method:r.method(),type:r.resourceType()}));
  page.on('pageerror', e=>errors.push(String(e)));
  const apiRequests = start => requests.slice(start).filter(r=>['fetch','xhr'].includes(r.type)||r.method==='POST');
  await flow('direct-access-without-session', async()=>{
    await ready(page,'/html/04_profile.html');
    return {url:page.url(),profileVisible:await page.locator('main').isVisible(),storage:await page.evaluate(()=>({local:Object.keys(localStorage),session:Object.keys(sessionStorage)}))};
  });
  await flow('login-arbitrary-credentials', async()=>{
    await ready(page,'/index.html'); const start=requests.length;
    await page.locator('#username').fill('audit-user-does-not-exist');
    await page.locator('#password').fill('x');
    await page.locator('#login-form').evaluate(f=>f.requestSubmit());
    await page.waitForURL('**/html/03_home.html',{timeout:8000});
    return {url:page.url(),apiRequests:apiRequests(start)};
  });
  await flow('registration-no-account-created', async()=>{
    await ready(page,'/html/02_register.html');const start=requests.length;
    await page.locator('#email').fill('audit@example.com'); await page.locator('#username').fill('audit-user'); await page.locator('#password').fill('x');
    await page.locator('#registration-form').evaluate(f=>f.requestSubmit());
    await page.waitForURL('**/index.html',{timeout:8000});
    return {url:page.url(),apiRequests:apiRequests(start),storage:await page.evaluate(()=>({local:Object.keys(localStorage),session:Object.keys(sessionStorage)}))};
  });
  await flow('registration-valid-email-rejected', async()=>{
    await ready(page,'/html/02_register.html');
    await page.locator('#email').fill('audit+test@example.technology');await page.locator('#username').fill('audit-user');await page.locator('#password').fill('valid-password');
    const nativeValid=await page.locator('#email').evaluate(e=>e.checkValidity());
    await page.locator('#registration-form').evaluate(f=>f.requestSubmit());
    const message=await page.locator('.swal2-html-container').innerText();await dismiss(page);
    return {nativeValid,message,url:page.url()};
  });
  await flow('add-to-cart-no-persistence', async()=>{
    await ready(page,'/html/08_cart.html');const before=await page.locator('.widjet-game__title').allTextContents();
    await ready(page,'/html/03_home.html');const start=requests.length;
    const originalButton=page.locator('.swiper-slide:not(.swiper-slide-duplicate) .fl-join-group').first();
    const product=await originalButton.evaluate(b=>b.closest('.fl-gp-box').querySelector('.fl-gp-title a').textContent.trim());
    // The first match is a Swiper loop clone outside the viewport. Invoke the
    // handler explicitly; this flow tests the data operation, not pointer reachability.
    await originalButton.evaluate(el=>el.click());
    const message=await page.locator('.swal2-title').innerText();await dismiss(page);
    await ready(page,'/html/08_cart.html');const after=await page.locator('.widjet-game__title').allTextContents();
    return {interaction:'DOM click handler invoked',product,message,before,after,unchanged:JSON.stringify(before)===JSON.stringify(after),apiRequests:apiRequests(start)};
  });
  await flow('purchase-and-favorite-only-alerts', async()=>{
    await ready(page,'/html/09_store_profile.html');const start=requests.length;
    await page.locator('.uk-button-buy').click();const buy=await page.locator('.swal2-title').innerText();await dismiss(page);
    await page.locator('.uk-button-favorite').click();const favorite=await page.locator('.swal2-title').innerText();await dismiss(page);
    return {buy,favorite,apiRequests:apiRequests(start),storage:await page.evaluate(()=>({local:Object.keys(localStorage),session:Object.keys(sessionStorage)}))};
  });
  await flow('subscription-and-report-only-alerts', async()=>{
    await ready(page,'/html/03_home.html');const start=requests.length;
    await page.locator('#fullName').fill('Audit Test');await page.locator('#email').fill('audit@example.com');
    await page.locator('#subscribe-form').evaluate(f=>f.requestSubmit());const subscription=await page.locator('.swal2-title').innerText();await dismiss(page);
    await page.evaluate(()=>UIkit.modal('#modal-report').show());
    await page.locator('#report-details').waitFor({state:'visible'});
    // niceSelect hides the native select; set its data value for this handler test.
    await page.locator('#report-subject').selectOption({index:1},{force:true});await page.locator('#report-details').fill('Audit report test');
    await page.locator('#report-form').evaluate(f=>f.requestSubmit());const report=await page.locator('.swal2-title').innerText();await dismiss(page);
    return {subscription,report,apiRequests:apiRequests(start)};
  });
  await flow('store-subscription-default-get', async()=>{
    await ready(page,'/html/09_store_profile.html');
    await page.locator('.form_subscri input').nth(0).fill('Audit Name');await page.locator('.form_subscri input').nth(1).fill('audit@example.com');
    await page.locator('.form_subscri').evaluate(f=>f.requestSubmit());
    await page.waitForURL('**/*Email*',{timeout:8000});return {url:page.url(),message:'Synthetic name and email submitted in URL by default GET'};
  });
  await flow('search-does-not-filter', async()=>{
    await ready(page,'/html/03_home.html');const before=await page.locator('.fl-gp-title').allTextContents();
    await page.locator('input[type="search"]').first().fill('product-not-present-xyz');await page.waitForTimeout(300);
    const after=await page.locator('.fl-gp-title').allTextContents();return {beforeCount:before.length,afterCount:after.length,unchanged:JSON.stringify(before)===JSON.stringify(after)};
  });
  await flow('theme-not-preserved', async()=>{
    await ready(page,'/html/03_home.html');await page.locator('#toggle').evaluate(el=>el.click());
    const before=await page.evaluate(()=>document.body.classList.contains('dark-theme'));
    await ready(page,'/html/04_profile.html');return {before,after:await page.evaluate(()=>document.body.classList.contains('dark-theme'))};
  });
  await flow('mobile-purchase-controls-visible', async()=>{
    await page.setViewportSize({width:390,height:844});await ready(page,'/html/09_store_profile.html');
    return {buyVisible:await page.locator('.uk-button-buy').isVisible(),favoriteVisible:await page.locator('.uk-button-favorite').isVisible(),priceVisible:await page.locator('.game-profile-price__value').isVisible()};
  });
  await flow('mobile-menu-listeners-accumulate', async()=>{
    await page.setViewportSize({width:390,height:844});await ready(page,'/html/03_home.html');
    const state=()=>page.evaluate(()=>({sidebar:document.querySelector('.sidebar').classList.contains('is-show'),noScroll:document.body.classList.contains('no-scroll'),handlers:(jQuery._data(document,'events')?.click||[]).filter(h=>h.selector==='.menu-btn').length}));
    await page.locator('.menu-btn').click();const first=await state();await page.locator('.menu-btn').click();
    await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(150);await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);
    await page.locator('.menu-btn').click();const second=await state();return {first,second};
  });
  await context.close();
  const offline = await browser.newContext();
  await offline.route('**/cdn.jsdelivr.net/npm/sweetalert2@11**',route=>route.abort());
  const offlinePage=await offline.newPage();const offlineErrors=[];offlinePage.on('pageerror',e=>offlineErrors.push(String(e)));
  await flow('sweetalert-cdn-unavailable',async()=>{
    await ready(offlinePage,'/index.html');await offlinePage.locator('#username').fill('audit');await offlinePage.locator('#password').fill('x');
    await offlinePage.locator('#login-form').evaluate(f=>f.requestSubmit());await offlinePage.waitForTimeout(300);
    return {url:offlinePage.url(),errors:offlineErrors};
  });
  await offline.close();save();
})().catch(e=>{results.fatal=String(e);save();console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
