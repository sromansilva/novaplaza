# Nova Plaza

Una experiencia de compras renovada, con diseño adaptable, temas claro y oscuro y flujos locales de demostración. Conserva las imágenes y marcas del proyecto original.

## Ver el proyecto

Necesitas Node.js 20 o posterior. No hay dependencias de runtime ni necesitas ejecutar `npm install`.

```powershell
npm run dev
```

Abre **http://127.0.0.1:4173**. Para revisar los archivos y regenerar las páginas compartidas:

```powershell
npm run build
```

El proyecto debe abrirse desde el servidor local; los módulos y las funciones de cuenta no se ejecutan correctamente abriendo los HTML como archivos `file://`.

## Qué puedes probar

- Buscar por producto o marca, filtrar por categoría y ordenar por precio o descuento.
- Explorar las diez marcas y los once productos del catálogo.
- Ver productos con galería, talla y color; agregar artículos al carrito, cambiar cantidades y quitarlos.
- Guardar favoritos y conservarlos al recargar o navegar.
- Aplicar el cupón de demostración **NOVA10**: 10% adicional desde S/ 100.00.
- Crear una cuenta de prueba, iniciar y cerrar sesión, o usar **Explorar la demo** sin registrarte.
- Recuperar una cuenta de prueba con el código entregado durante el registro. La demo no envía correos de recuperación.
- Editar el nombre de la cuenta, guardar direcciones y consultar pedidos, mensajes y comentarios.
- Agregar saldo ficticio a la billetera y simular un pedido con o sin ese saldo. El pedido queda en el historial y actualiza el saldo cuando corresponde.
- Guardar mensajes, suscripciones y metadatos de adjuntos con validación explícita.
- Usar teclado, enlace para saltar al contenido, modales con foco, menú móvil y preferencia de tema persistente.

## Alcance de la demostración

**No realiza compras, pagos, entregas, reservas ni envíos de correo reales.** Los precios, descuentos y existencias ilustran la experiencia y no constituyen ofertas comerciales vigentes.

Los datos se guardan en este navegador. Los carritos, favoritos, pedidos y saldo de cuentas registradas están separados por cuenta. La sesión permanece en la pestaña y caduca después de 24 horas. La entrada demo abre únicamente la cuenta de prueba; no permite abrir otras cuentas registradas.

Las contraseñas se guardan como verificadores PBKDF2/SHA-256 con sal aleatoria, no como texto. La recuperación utiliza un código aleatorio y su verificador derivado. Esto mejora la demo, pero **el almacenamiento del navegador no sustituye autenticación, autorización ni validación en un servidor**. Usa datos y contraseñas ficticios.

Los adjuntos aceptan PDF, PNG y JPG de hasta 2 MB. Se conservan nombre, tipo y tamaño; el contenido del archivo no se almacena ni se transmite. La interfaz lo indica antes de guardar. Eliminar los datos del sitio en el navegador borra las cuentas y el historial local.

## Estructura

```text
index.html                 Inicio público y catálogo
html/                      Entradas de acceso, registro y pantallas
js/app.js                  Componentes, navegación e interacción
js/store.js                Estado local, cuentas y operaciones de prueba
js/data.js                 Catálogo único, rutas y formatos
js/icons.js                Iconos SVG locales
js/theme.js                Preferencia de tema antes del primer render
css/nova.css               Sistema visual y estilos adaptables
scripts/build-pages.mjs    Genera las entradas HTML compartidas
scripts/check.mjs          Comprueba sintaxis, enlaces y catálogo
scripts/serve.mjs          Servidor local con cabeceras y protección de rutas
auditoria/                 Auditoría inicial y evidencia de la renovación
```

Las entradas HTML se generan desde `scripts/build-pages.mjs`; edita ese archivo para cambiar la estructura común. El servidor solo escucha en loopback y bloquea `.git`, `node_modules` y la carpeta de auditoría. El sitio no depende de CDNs, bibliotecas de interfaz ni fuentes externas.

## Diseño e imagen principal

El diseño usa una paleta lavanda, tarjetas claras, iconos SVG, foco visible y colores específicos para cada tema. Las pantallas admiten anchos pequeños sin un mínimo fijo de escritorio y respetan `prefers-reduced-motion`.

`img/hero-superstar.webp` es un recorte transparente de la imagen original `img/c1.jpg`, creado con la herramienta integrada **ImageGen** y exportado en WebP a 900 px. La fotografía original de la galería se conserva. El prompt y la procedencia están en `auditoria/redesign/hero-prompt.txt`.

## Verificación

La evidencia de la renovación se guarda en `auditoria/redesign/`. El informe inicial `auditoria/AUDITORIA.md` corresponde al commit original `0978406`; describe el estado anterior y no debe interpretarse como el estado de la versión renovada.

Para repetir las comprobaciones de navegador con Playwright y Axe, instala las herramientas de auditoría fuera del proyecto:

```powershell
$novaQaTools = Join-Path $env:TEMP 'novaplaza-audit-tools'
npm install --prefix $novaQaTools --no-audit --no-fund playwright @axe-core/playwright
node auditoria/qa-redesign.cjs $novaQaTools
```

El servidor debe estar ejecutándose. El script usa la instalación estándar de Microsoft Edge de Windows y un contexto de prueba aislado; no modifica los datos de tu navegador personal. La validación automatizada de accesibilidad complementa la revisión visual, pero no representa una certificación WCAG.
