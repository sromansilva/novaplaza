// Catálogo de demostración basado en los productos e imágenes del proyecto original.
export const stores = [
  { id:'adidas', name:'Adidas', category:'Moda', logo:'game-1.jpg', color:'#e8e6f5', description:'Movimiento, deporte y estilo para todos los días.' },
  { id:'cinemark', name:'Cinemark', category:'Entretenimiento', logo:'game-2.jpg', color:'#fae6e8', description:'Un plan de película para compartir.' },
  { id:'aruma', name:'Aruma', category:'Belleza', logo:'game-3.jpg', color:'#fbe9f1', description:'Un espacio para tu rutina de cuidado personal.' },
  { id:'bembos', name:'Bembos', category:'Gastronomía', logo:'game-4.jpg', color:'#fff0d9', description:'Dale una pausa deliciosa a tu día.' },
  { id:'belisario', name:'Don Belisario', category:'Gastronomía', logo:'game-5.jpg', color:'#f1e9dd', description:'Encuentra una nueva ocasión para compartir.' },
  { id:'calvin', name:'Calvin Klein', category:'Moda', logo:'game-6.jpg', color:'#e9edf0', description:'Esenciales de líneas simples y estilo propio.' },
  { id:'chinawok', name:'China Wok', category:'Gastronomía', logo:'game-7.jpg', color:'#fff0e1', description:'Sabores para acompañar tus buenos planes.' },
  { id:'claro', name:'Claro', category:'Tecnología', logo:'game-8.jpg', color:'#fde7e7', description:'Conecta con lo que más te gusta.' },
  { id:'coolbox', name:'Coolbox', category:'Tecnología', logo:'game-9.jpg', color:'#e7ebfa', description:'Tecnología y accesorios para tu día a día.' },
  { id:'nike', name:'Nike', category:'Moda', logo:'game-10.jpg', color:'#e5f0e9', description:'Encuentra tu ritmo. Hazlo a tu manera.' },
];

export const products = [
  { id:'superstar', name:'Zapatillas Superstar Originals', store:'adidas', category:'Moda', price:14990, original:19990, image:'c1.jpg', gallery:['c1.jpg','c2.jpg','c3.jpg','c4.jpg'], tag:'Nuestra selección', sizes:['36','37','38','39','40','41','42'], colors:['Negro','Blanco'], stock:12, description:'Un clásico de silueta limpia que combina con tus planes de todos los días. Explora las imágenes y elige tu talla para añadirlo a tu próxima compra.' },
  { id:'airmax', name:'Zapatillas Nike Air Max', store:'nike', category:'Moda', price:23290, original:24990, image:'carrito2.jpg', sizes:['37','38','39','40','41','42'], colors:['Negro'], stock:8, description:'Un toque deportivo para tus looks de todos los días. Selecciona una talla antes de agregar este producto a tu carrito.' },
  { id:'calvin-hoodie', name:'Polera Calvin Klein', store:'calvin', category:'Moda', price:27900, original:34900, image:'gr2.jpg', sizes:['S','M','L','XL'], colors:['Negro'], stock:10, description:'Un esencial cómodo y fácil de combinar. Elige tu talla y completa tu selección con tus favoritos.' },
  { id:'neutrogena', name:'Neutrogena Pack Purified', store:'aruma', category:'Belleza', price:11900, original:13000, image:'gr3.jpg', sizes:[], colors:[], stock:15, description:'Dale un espacio a tu rutina de cuidado con este pack del catálogo de demostración. La información comercial definitiva debe confirmarse con la tienda.' },
  { id:'adidas-pants', name:'Pantalón Adidas FPF', store:'adidas', category:'Moda', price:19900, original:23500, image:'gr1.jpg', sizes:['S','M','L','XL'], colors:['Negro'], stock:9, description:'Una pieza deportiva para acompañar tu rutina. Revisa las tallas disponibles en esta demostración y elige la tuya.' },
  { id:'echo', name:'Echo Dot · 4.ª generación', store:'coolbox', category:'Tecnología', price:17900, original:29900, image:'gr4.jpg', sizes:[], colors:['Negro'], stock:6, description:'Explora este accesorio para tu espacio. Esta ficha utiliza el producto del catálogo original; las especificaciones y disponibilidad final se consultan con la tienda.' },
  { id:'cinemark-combo', name:'Combo Cinemark + vaso', store:'cinemark', category:'Entretenimiento', price:2500, original:4000, image:'gr5.jpg', sizes:[], colors:[], stock:20, description:'Un complemento para tu próximo plan de película. Producto de demostración: no incluye emisión de entradas ni reservas reales.' },
  { id:'redmi', name:'Redmi Note 13 Pro', store:'claro', category:'Tecnología', price:110000, original:125000, image:'gr6.jpg', sizes:[], colors:[], stock:5, description:'Conoce una de las opciones tecnológicas del catálogo original. Los detalles de la versión y condiciones comerciales deben confirmarse con la tienda.' },
  { id:'running-shirt', name:'Polo Own the Run', store:'adidas', category:'Moda', price:10990, original:11880, image:'carrito1.jpg', sizes:['S','M','L','XL'], colors:['Gris'], stock:12, description:'Una silueta deportiva para sumar a tus básicos. Escoge tu talla y combínala con otros productos de la selección.' },
  { id:'headphones', name:'Auriculares Bluetooth azul', store:'coolbox', category:'Tecnología', price:7490, original:8080, image:'carrito4.jpg', sizes:[], colors:['Azul'], stock:10, description:'Un accesorio para llevar tus playlists contigo. Este artículo forma parte del catálogo de prueba y no genera una compra real.' },
  { id:'chinabox', name:'Chinabox Chi Jau Kay', store:'chinawok', category:'Gastronomía', price:3190, original:3980, image:'carrito3.jpg', sizes:[], colors:[], stock:20, description:'Un buen acompañante para una pausa. La demo permite organizar un pedido de prueba; no envía órdenes al restaurante.' },
];

export const categories = ['Todo','Moda','Tecnología','Belleza','Gastronomía','Entretenimiento'];
export const productById = id => products.find(p => p.id === id);
export const storeById = id => stores.find(s => s.id === id);
export const money = cents => new Intl.NumberFormat('es-PE', {style:'currency',currency:'PEN'}).format(cents / 100);
export const discount = p => Math.round((1 - p.price / p.original) * 100);
export const base = new URL('../', import.meta.url);
export const imageUrl = name => new URL('img/' + name, base).href;
export const routes = {home:'index.html',login:'html/01_login.html',register:'html/02_register.html',profile:'html/04_profile.html',favorites:'html/05_favorites.html',wallet:'html/06_wallet.html',stores:'html/07_stores.html',cart:'html/08_cart.html',detail:'html/09_store_profile.html'};
export const href = (route, params={}) => {
  const url = new URL(routes[route] || routes.home, base);
  Object.entries(params).forEach(([key,value]) => url.searchParams.set(key,value));
  return url.pathname + url.search;
};
