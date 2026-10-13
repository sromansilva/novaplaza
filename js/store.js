import { productById } from './data.js';
const KEY = 'novaplaza-v3';
const sessionKey = 'nova-session-v3';
const blankBasket = () => ({cart:[], favorites:[], orders:[], addresses:[], reports:[], comments:[], balance:0, transactions:[], coupon:''});
const fresh = () => ({version:3,accounts:[],guest:blankBasket(),baskets:{},subscriptions:[]});
const isObject = v => v && typeof v === 'object' && !Array.isArray(v);
const validVariant = (p,size,color) => (p.sizes.length ? p.sizes.includes(size) : size === '') && (p.colors.length ? p.colors.includes(color) : color === '');
function cleanBasket(input) {
  const b = blankBasket();
  if (!isObject(input)) return b;
  b.cart = Array.isArray(input.cart) ? input.cart.filter(i => isObject(i) && productById(i.id) && validVariant(productById(i.id),i.size,i.color) && Number.isInteger(i.qty) && i.qty>0 && i.qty<=productById(i.id).stock).map(i=>({id:i.id,size:i.size,color:i.color,qty:i.qty})) : [];
  b.favorites = Array.isArray(input.favorites) ? [...new Set(input.favorites.filter(id=>productById(id)))] : [];
  for (const k of ['orders','addresses','reports','comments','transactions']) b[k] = Array.isArray(input[k]) ? input[k].filter(isObject).slice(0,100) : [];
  b.balance = Number.isSafeInteger(input.balance) && input.balance>=0 ? input.balance : 0;
  b.coupon = input.coupon === 'NOVA10' ? 'NOVA10' : '';
  return b;
}
let storageAvailable = true;
let data = fresh();
try {
  const parsed = JSON.parse(localStorage.getItem(KEY));
  if (parsed?.version === 3) {
    data.guest = cleanBasket(parsed.guest);
    data.accounts = Array.isArray(parsed.accounts) ? parsed.accounts.filter(a=>isObject(a) && typeof a.id==='string' && typeof a.email==='string' && typeof a.name==='string' && /^[a-f0-9]{64}$/.test(a.hash) && /^[a-f0-9]{32}$/.test(a.salt) && /^[a-f0-9]{64}$/.test(a.recoveryHash)).slice(-100) : [];
    for (const a of data.accounts) data.baskets[a.id] = cleanBasket(parsed.baskets?.[a.id]);
    data.subscriptions = Array.isArray(parsed.subscriptions) ? parsed.subscriptions.filter(s=>isObject(s) && typeof s.email==='string').slice(-100) : [];
  }
} catch { storageAvailable = false; }
let session;
try { session = JSON.parse(sessionStorage.getItem(sessionKey)); } catch { session = null; }
if (!session || !data.accounts.some(a=>a.id===session.id) || !Number.isFinite(session.expires) || session.expires<Date.now()) session = null;
const commit = draft => {
  try { localStorage.setItem(KEY,JSON.stringify(draft)); storageAvailable=true; }
  catch { throw new Error('No pudimos guardar los cambios. Revisa el espacio o los permisos de almacenamiento de este navegador.'); }
  data = draft;
};
const mutate = fn => { const draft = structuredClone(data); const result=fn(draft); commit(draft); return result; };
export const currentUser = () => session ? data.accounts.find(a=>a.id===session.id) : null;
const currentId = () => currentUser()?.id;
export const basket = () => data.baskets[currentId()] || data.guest;
const draftBasket = d => currentId() ? d.baskets[currentId()] : d.guest;
export const storageStatus = () => storageAvailable;
export const cartKey = i => `${i.id}|${i.size}|${i.color}`;
export const cartCount = () => basket().cart.reduce((n,i)=>n+i.qty,0);
export function addCart(id,size='',color='',qty=1) {
  const p=productById(id);
  if (!p || !validVariant(p,size,color) || !Number.isInteger(qty) || qty<1 || qty>p.stock) throw new Error('Elige una combinación válida y una cantidad disponible.');
  return mutate(d=>{
    const b=draftBasket(d), item=b.cart.find(i=>cartKey(i)===cartKey({id,size,color}));
    if (item && item.qty+qty>p.stock) throw new Error(`El máximo disponible para esta combinación es ${p.stock}.`);
    if(item) item.qty+=qty; else b.cart.push({id,size,color,qty});
  });
}
export function changeQty(key,delta) {
  mutate(d=>{
    const b=draftBasket(d), item=b.cart.find(i=>cartKey(i)===key);
    if(!item) return;
    if(item.qty+delta<1) b.cart=b.cart.filter(i=>cartKey(i)!==key);
    else if(item.qty+delta>productById(item.id).stock) throw new Error('Llegaste a la cantidad disponible en esta demo.');
    else item.qty+=delta;
  });
}
export const removeCart = key => mutate(d=>{const b=draftBasket(d);b.cart=b.cart.filter(i=>cartKey(i)!==key);});
export const toggleFavorite = id => mutate(d=>{if(!productById(id)) return;const b=draftBasket(d);b.favorites=b.favorites.includes(id)?b.favorites.filter(x=>x!==id):[...b.favorites,id];});
export const applyCoupon = code => {
  if(code.trim().toUpperCase()!=='NOVA10') throw new Error('Ese cupón no está disponible. Puedes probar con NOVA10.');
  if(totals().subtotal<10000) throw new Error('NOVA10 se aplica a compras de prueba desde S/ 100.00.');
  mutate(d=>{draftBasket(d).coupon='NOVA10';});
};
export const removeCoupon = () => mutate(d=>{draftBasket(d).coupon='';});
export function totals(delivery=false) {
  const b=basket(), subtotal=b.cart.reduce((sum,i)=>sum+productById(i.id).price*i.qty,0);
  const reduction=b.coupon==='NOVA10' && subtotal>=10000 ? Math.round(subtotal*.1) : 0;
  const shipping=delivery && subtotal ? 990 : 0;
  return {subtotal,discount:reduction,shipping,total:subtotal-reduction+shipping};
}
function randomHex(bytes) {return [...crypto.getRandomValues(new Uint8Array(bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function derive(value,salt) {
  if(!crypto.subtle) throw new Error('Abre la demo desde el servidor local para poder crear una cuenta de prueba.');
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(value),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new Uint8Array(salt.match(/../g).map(h=>parseInt(h,16))),iterations:120000},key,256);
  return [...new Uint8Array(bits)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export const validatePassword = password => password.length>=8 && password.length<=128 && /\p{L}/u.test(password) && /\d/.test(password);
export const normalizeEmail = email => email.trim().toLowerCase();
export async function register(name,email,password) {
  email=normalizeEmail(email);
  if(data.accounts.some(a=>a.email===email)) throw new Error('Ya existe una cuenta de prueba con este correo en este navegador.');
  if(!validatePassword(password)) throw new Error('Usa de 8 a 128 caracteres, con al menos una letra y un número.');
  const salt=randomHex(16), code='NOVA-'+randomHex(6).toUpperCase();
  const account={id:crypto.randomUUID(),name:name.trim(),email,salt,hash:await derive(password,salt),recoveryHash:await derive(code,salt),createdAt:new Date().toISOString()};
  // Recheck after asynchronous derivation; avoid duplicate submissions.
  if(data.accounts.some(a=>a.email===email)) throw new Error('Este correo ya tiene una cuenta en la demo.');
  mutate(d=>{d.accounts.push(account);d.baskets[account.id]=blankBasket();});
  establishSession(account.id);
  return code;
}
function establishSession(id) {
  const next={id,expires:Date.now()+24*60*60*1000};
  mutate(d=>{
    const b=d.baskets[id];
    for(const item of d.guest.cart) {const existing=b.cart.find(i=>cartKey(i)===cartKey(item));if(existing)existing.qty=Math.min(existing.qty+item.qty,productById(item.id).stock);else b.cart.push(item);}
    b.favorites=[...new Set([...b.favorites,...d.guest.favorites])];
    b.reports=[...d.guest.reports,...b.reports].slice(0,100);
    b.comments=[...d.guest.comments,...b.comments].slice(0,100);
    d.guest.cart=[];d.guest.favorites=[];
    d.guest.reports=[];d.guest.comments=[];
  });
  try { sessionStorage.setItem(sessionKey,JSON.stringify(next)); } catch { throw new Error('Permite el almacenamiento de sesión para iniciar la demo.'); }
  session=next;
}
export async function login(email,password) {
  const account=data.accounts.find(a=>a.email===normalizeEmail(email));
  if(!account || await derive(password,account.salt)!==account.hash) throw new Error('El correo o la contraseña no coinciden con una cuenta de esta demo.');
  establishSession(account.id);
}
export async function enterDemo() {
  // Demo account has a random, unshared verifier; the demo button intentionally bypasses login for this account only.
  let account=data.accounts.find(a=>a.demo===true);
  if(!account) {
    const salt=randomHex(16);account={id:crypto.randomUUID(),name:'Explorador Nova',email:'demo@novaplaza.local',salt,hash:await derive(randomHex(24),salt),recoveryHash:await derive(randomHex(24),salt),demo:true,createdAt:new Date().toISOString()};
    mutate(d=>{d.accounts.push(account);d.baskets[account.id]=blankBasket();});
  }
  establishSession(account.id);
}
export const logout = () => {sessionStorage.removeItem(sessionKey);session=null;};
export async function recover(email,code,password) {
  const a=data.accounts.find(a=>a.email===normalizeEmail(email) && !a.demo);
  if(!a || await derive(code.trim().toUpperCase(),a.salt)!==a.recoveryHash) throw new Error('El correo o el código de recuperación no son correctos.');
  if(!validatePassword(password)) throw new Error('La nueva contraseña necesita al menos 8 caracteres, una letra y un número.');
  const hash=await derive(password,a.salt);
  mutate(d=>{d.accounts.find(x=>x.id===a.id).hash=hash;});
  if(session?.id===a.id) logout();
}
export const updateProfile = name => mutate(d=>{const a=d.accounts.find(a=>a.id===currentId());if(!a)throw new Error('Inicia una sesión de prueba.');a.name=name.trim();});
export const saveAddress = address => mutate(d=>{const b=draftBasket(d);if(b.addresses.length>=10)throw new Error('Puedes guardar hasta diez direcciones.');b.addresses.push({...address,id:crypto.randomUUID()});});
export const removeAddress = id => mutate(d=>{const b=draftBasket(d);b.addresses=b.addresses.filter(a=>a.id!==id);});
export function deposit(cents) {
  if(!currentUser()) throw new Error('Inicia una sesión de prueba.');
  if(!Number.isSafeInteger(cents)||cents<100||cents>500000) throw new Error('Ingresa un importe de S/ 1.00 a S/ 5,000.00.');
  mutate(d=>{const b=draftBasket(d);if(b.balance+cents>10000000)throw new Error('El saldo máximo de prueba es S/ 100,000.00.');b.balance+=cents;b.transactions.unshift({id:crypto.randomUUID(),amount:cents,label:'Recarga de prueba',date:new Date().toISOString()});});
}
export function placeOrder(details) {
  if(!currentUser()) throw new Error('Inicia una sesión de prueba antes de guardar el pedido.');
  if(!basket().cart.length) throw new Error('Tu carrito está vacío.');
  if(!['pickup','delivery'].includes(details.delivery)||!['demo','wallet'].includes(details.payment)) throw new Error('Elige una opción de entrega y pago de prueba válida.');
  const amount=totals(details.delivery==='delivery');
  const items=basket().cart.map(i=>({...i,unitPrice:productById(i.id).price,name:productById(i.id).name}));
  const order={id:'NP-'+Date.now().toString(36).toUpperCase(),date:new Date().toISOString(),items,...amount,details,status:'Pedido de prueba'};
  mutate(d=>{const b=draftBasket(d);if(details.payment==='wallet'){if(b.balance<amount.total)throw new Error('Tu saldo de prueba no alcanza. Recarga la billetera o elige la simulación sin saldo.');b.balance-=amount.total;b.transactions.unshift({id:order.id,amount:-amount.total,label:'Pedido de prueba '+order.id,date:order.date});}b.orders.unshift(order);b.cart=[];b.coupon='';});
  return order;
}
export const subscribe = email => mutate(d=>{email=normalizeEmail(email);if(d.subscriptions.some(s=>s.email===email))throw new Error('Este correo ya está guardado en la lista de prueba.');d.subscriptions.push({email,date:new Date().toISOString()});});
export const saveReport = report => mutate(d=>{const item={...report,id:'R-'+Date.now().toString(36).toUpperCase(),date:new Date().toISOString(),status:'Guardado localmente'};draftBasket(d).reports.unshift(item);return item;});
export const saveComment = text => mutate(d=>{draftBasket(d).comments.unshift({id:crypto.randomUUID(),text,date:new Date().toISOString()});});
