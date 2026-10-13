# Auditoría técnica de Nova Plaza

**Fecha:** 13 de octubre de 2026. **Base:** rama `main`, commit `0978406`. **Alcance:** copia local del repositorio, 62 archivos originales versionados.

## Resultado

Nova Plaza es un prototipo navegable de comercio electrónico construido con HTML, CSS y JavaScript. La interfaz tiene pantallas de acceso, registro, inicio, perfil, favoritos, billetera, tiendas, carrito y detalle de tienda/producto. El repositorio no contiene backend, base de datos, API de negocio ni implementación de sesiones.

**No está preparado para operar cuentas, compras o pagos reales.** El impedimento principal es funcional: las acciones presentan resultados exitosos sin realizar las operaciones que anuncian. Si el objetivo del proyecto es exclusivamente una maqueta académica, debe indicarse qué acciones son simuladas; las incidencias de navegación, accesibilidad y estilos siguen siendo aplicables.

Se identificaron **15 hallazgos: 3 de prioridad alta, 8 media y 4 baja**. La prioridad alta expresa un bloqueo para una tienda operativa; no implica que se haya demostrado explotación de datos reales.

## Comprobaciones realizadas

| Comprobación | Resultado y límite |
|---|---|
| Inventario y lectura del código | 10 documentos HTML, 3 JavaScript externos y 5 CSS. `queso.html` es un archivo de prueba ajeno al flujo principal. |
| Sintaxis JavaScript con Node | **31/31 comprobaciones correctas:** 28 bloques inline y 3 archivos externos. Esto comprueba sintaxis, no funcionalidad. |
| Navegador | Microsoft Edge basado en Chromium, en modo headless, con servidor HTTP exclusivo de loopback. |
| Pantallas y temas | **38 estados cargados:** 9 pantallas × 2 tamaños × 2 temas, más `queso.html` en los 2 tamaños. Resoluciones: 1440×900 y 390×844. |
| Evidencia visual | 38 capturas individuales y 4 hojas de contacto revisadas. Las capturas muestran el estado inicial; `.page-main` tiene desplazamiento interno y una captura completa del documento no recoge automáticamente todo ese contenido. |
| Accesibilidad automatizada | Axe sobre los 38 estados, reglas WCAG 2 A/AA y 2.1 AA. Se encontraron 4 tipos de incumplimiento. No constituye una certificación de accesibilidad ni una auditoría manual exhaustiva de teclado o lector de pantalla. |
| Flujos dirigidos | 13 escenarios: acceso directo, login, registro, correo válido, carrito, compra/favoritos, suscripción/reporte, GET del formulario de tienda, búsqueda, persistencia del tema, controles móviles, menú tras resize y caída del CDN de alertas. |
| Carga inicial | Sin excepciones JavaScript espontáneas en los 38 estados; sin imágenes HTML rotas en las capturas. Sí hubo recursos CSS con HTTP 404. |
| Mapa auxiliar | Extracción AST de `js/` con Graphify. Su cobertura es parcial y no incluye los manejadores inline de los HTML. |

Los escenarios reproducen comportamientos, incluidos defectos; **no equivalen a 13 flujos de negocio aprobados**. Para el carrito se invocó el manejador DOM de un botón original, porque Swiper genera clones fuera de pantalla. En el formulario de reporte se abrió el modal y se asignó el valor del select nativo oculto por niceSelect. Los errores iniciales del procedimiento de prueba se conservan en `harnessErrorsBeforeRetry`; los 13 escenarios finales no tienen errores del procedimiento.

## Hallazgos por prioridad

### NP-01 — Alta: acceso y registro sin autenticación real

**Evidencia:** `index.html:100–128` solo exige usuario y contraseña no vacíos y redirige al inicio. `html/02_register.html:99–139` valida campos y vuelve al login sin crear una cuenta. Se ingresó con `audit-user-does-not-exist` y contraseña `x`; se abrió `04_profile.html` en una sesión nueva sin credenciales. No hubo peticiones de autenticación y los almacenamientos de sesión/local estaban vacíos.

**Impacto:** la pantalla de login no establece una identidad ni protege el perfil o la billetera. Los datos visibles son estáticos; esta auditoría no demuestra acceso a datos privados reales de otros usuarios. Los enlaces sociales llevan a las páginas públicas de las redes y la recuperación de contraseña vuelve al mismo login.

**Recomendación:** si habrá usuarios reales, implementar autenticación con un servicio o backend, verificar la sesión y autorización en el servidor, y definir registro, recuperación y cierre de sesión. Un indicador guardado en el navegador no sustituye esa protección. Si seguirá siendo una maqueta, indicar el acceso de demostración y las acciones simuladas.

### NP-02 — Alta: carrito, compra y favoritos anuncian operaciones inexistentes

**Evidencia:** `html/03_home.html:899–933` y `html/05_favorites.html:766` solo muestran una alerta al agregar productos. `html/09_store_profile.html:384–428` anuncia «¡Compra exitosa!» y «Añadido a favoritos», sin crear pedidos ni guardar favoritos. Al agregar «Pantalón Adidas FPF», el carrito conservó exactamente los cuatro productos iniciales. Compra y favoritos no generaron peticiones de negocio ni estado persistido. La billetera y los movimientos están escritos directamente en `html/06_wallet.html:154–201`.

**Impacto:** el usuario recibe confirmaciones incorrectas. No existe un flujo de checkout, cobro, actualización del saldo ni historial transaccional real en esta copia.

**Recomendación:** definir un modelo de carrito y pedidos; persistir cantidades y favoritos; confirmar una compra únicamente después del resultado de la operación. Para producción, el servidor debe validar precios, existencias e identidad y conciliar el resultado del proveedor de pagos. Para una demo local puede implementarse estado local y rotular explícitamente la simulación.

### NP-03 — Alta: reportes, suscripciones y comentarios dan confirmaciones falsas

**Evidencia:** `html/03_home.html:787–889` muestra «¡Suscripción exitosa!» y «¡Reporte enviado!» sin enviar datos. La prueba reprodujo ambos mensajes sin peticiones XHR/fetch/POST. `html/04_profile.html:574–606` muestra «¡Mensaje enviado!» y limpia el comentario; no lo publica. El archivo seleccionado para reportar se obtiene, pero no se transmite ni utiliza. Esta lógica se repite en varias pantallas.

**Impacto:** se pierde el contenido ingresado y el usuario cree que será atendido o suscrito.

**Recomendación:** conectar cada acción a un destino real y mostrar éxito solo tras recibir una confirmación. Conservar los datos ante errores y permitir reintento. Mientras no exista integración, mostrar que se trata de una demostración.

### NP-04 — Media: cinco enlaces apuntan a páginas que no existen

| Ubicación | Destino inexistente |
|---|---|
| `html/04_profile.html:73` | `01_login.html` |
| `html/04_profile.html:105` | `01_login.html` |
| `html/04_profile.html:302` | `15_group.html` |
| `html/05_favorites.html:105` | `01_login.html` |
| `html/06_wallet.html:180` | `09_games-store.html` |

**Impacto:** navegación interrumpida, incluido el retorno al acceso desde partes del perfil/favoritos. **Recomendación:** corregir hacia rutas existentes, implementar los destinos necesarios o desactivar los controles con una explicación; incorporar una comprobación de enlaces locales.

### NP-05 — Media: imports CSS ausentes y URLs de recursos corruptas

**Evidencia:** `css/styles.css:18–28` importa once CSS inexistentes: `animate.min.css`, `normalize.css`, `icomoon.css`, `font-awesome.min.css`, `meanmenu.css`, `owl.carousel.min.css`, `swiper.min.css`, `slick.css`, `jquery.fancybox.min.css`, `jquery-ui.css` y `nice-select.css`. El navegador confirmó los 404. También falta `images/body_bg.png`, referenciado en la línea 50.

`css/libs.min.css` contiene supuestas URLs `data:` precedidas por rutas como `../../../node_modules/uikit/dist/css/` y `../../../node_modules/swiper/`. Se tratan como rutas HTTP, no como recursos embebidos válidos. Se confirmó, entre otros, el 404 de la fuente embebida de Swiper. En toda la inspección estática hubo **51 referencias CSS sin destino**, incluidas alternativas de fuentes; una referencia de fallback ausente no significa necesariamente que el icono falle si otra alternativa disponible funciona. La ejecución registró **24 URLs distintas con 404**.

**Impacto:** solicitudes inútiles y pérdida de estilos o recursos de ciertos componentes. **Recomendación:** eliminar imports no utilizados, recuperar solo los recursos necesarios y regenerar las bibliotecas CSS respetando las URLs `data:`. Priorizar los fallos efectivamente solicitados por el navegador.

### NP-06 — Media: el formulario de tienda envía nombre y correo en la URL

**Evidencia:** `html/09_store_profile.html:349–363` no tiene manejador de suscripción, destino ni método explícito. El navegador hace un GET al mismo documento. La prueba con datos ficticios terminó en `09_store_profile.html?Your+Name=Audit+Name&Email=audit%40example.com`. El reporte de esta misma pantalla, en la línea 240, también usa un formulario convencional con `action="#"`, sin integración; «Cancelar» y «Enviar» carecen de `type` explícito y actúan como submit.

**Impacto:** datos personales quedan en el historial y pueden quedar en registros del servidor; la acción no suscribe ni envía el reporte. **Recomendación:** implementar el envío al destino correcto, evitar datos personales en la URL y usar `type="button"` y cierre del modal para cancelar.

### NP-07 — Media: se acumulan manejadores del menú móvil

**Evidencia:** `js/main.js:11–20` añade otro manejador de clic cada vez que entra al breakpoint móvil; `js/main.js:29–35` hace algo similar al ocultar la barra lateral. En la prueba: primer clic con menú abierto → `noScroll=true`, 2 manejadores; después de pasar a escritorio y volver a móvil → menú abierto, `noScroll=false`, 3 manejadores.

**Impacto:** las alternancias repetidas se cancelan entre sí y el bloqueo del desplazamiento queda incoherente. **Recomendación:** registrar una sola vez los eventos y calcular el bloqueo desde el estado final del menú. Usar eventos con namespace si es necesario reemplazarlos.

### NP-08 — Media: contraste insuficiente y controles sin nombre accesible

**Evidencia:** Axe detectó `color-contrast`, `button-name`, `label` y `link-name`. Por ejemplo, en el login oscuro, usuario y contraseña tienen contraste **1.03:1**, frente al mínimo 4.5:1 que evalúa la herramienta; el logotipo tiene 1.41:1. Las capturas muestran textos casi invisibles. `css/main.css:4969` cambia el fondo de los inputs del login sin ajustar suficientemente el color del texto/placeholder.

El interruptor `#toggle` no tiene nombre accesible. Los botones de micrófono y varios enlaces de iconos también carecen de texto o etiqueta accesible. `css/styles.css:59` y otras reglas eliminan `outline`, por lo que debe verificarse y restablecerse un indicador de foco visible. El perfil oscuro conserva grandes áreas blancas junto a etiquetas oscuras, confirmado visualmente.

**Impacto:** dificulta la lectura y el uso con tecnologías de asistencia. Las etiquetas «critical»/«serious» de Axe describen accesibilidad, no vulnerabilidades críticas de seguridad. **Recomendación:** definir colores por tema, corregir contrastes, añadir nombres accesibles y labels permanentes, y revisar teclado, foco y modales. Los 612 nodos señalados a lo largo de los estados incluyen repeticiones; no son 612 defectos independientes.

### NP-09 — Media: validación de correo rechaza direcciones válidas

**Evidencia:** `html/02_register.html:119`, `html/03_home.html:819`, `html/04_profile.html:644`, `js/validaciones.js:35` y otras copias restringen el dominio final a 2–6 letras y no admiten `+` en el nombre local. `audit+test@example.technology` pasó `checkValidity()` del campo email, pero el código lo rechazó.

**Recomendación:** usar `type="email"` con una validación consistente, evitar esta expresión restrictiva y validar también en el destino del envío. Unificar la implementación compartida.

### NP-10 — Media: búsqueda, filtros y numerosos enlaces son decorativos

**Evidencia:** buscar `product-not-present-xyz` en el inicio conservó los diez títulos de producto del DOM. `js/main.js` configura niceSelect y carruseles, pero no implementa búsqueda o filtrado; los selectores incluyen opciones como «Elemento 1». Hay **140 enlaces `#` o `#!`** en los HTML. Algunos tienen manejadores válidos, por lo que esa cifra no representa 140 controles rotos; numerosos enlaces de «Ver más», edición y footer siguen siendo placeholders.

**Recomendación:** implementar búsqueda, orden y filtros sobre los datos disponibles; auditar los enlaces placeholder por intención y vincular o desactivar cada uno. No presentar redes públicas como login social funcional.

### NP-11 — Media: dependencia obligatoria del CDN y bibliotecas sin actualización reproducible

**Evidencia:** las nueve pantallas principales cargan SweetAlert desde `https://cdn.jsdelivr.net/npm/sweetalert2@11`, sin versión exacta ni atributo de integridad. Al bloquear ese recurso, enviar el login causó **`ReferenceError: Swal is not defined`** y no redirigió. El bundle local identifica jQuery **3.6.0**, UIkit **3.9.2** y Swiper **7.2.0**; no hay manifiesto/lockfile que documente su instalación o reconstrucción.

La política oficial consultada indica que jQuery 3.x solo recibe correcciones críticas y recomienda migrar a la rama actual. Esto es un problema de mantenimiento; **la antigüedad por sí sola no prueba una vulnerabilidad explotable**. [Política de soporte de jQuery](https://jquery.com/support/).

**Recomendación:** fijar versiones, documentar cómo se generan los bundles y planificar actualizaciones con comprobación de compatibilidad. Servir la dependencia esencial localmente o proporcionar una alternativa de error cuando no cargue. Si se usa CDN, considerar integridad para recursos versionados; jQuery documenta este mecanismo en su [guía de descarga](https://jquery.com/download/).

### NP-12 — Baja: pequeño desbordamiento horizontal en móvil

**Evidencia:** las siete pantallas internas tienen ancho de documento **398 px** en un viewport de **390 px**, en ambos temas. Acceso y registro permanecen en 390 px. `css/main.css:824` fija además un mínimo de 380 px en `.page-wrapper`, una restricción que debe revisarse para anchos menores. No se probó un viewport de 320 px.

**Recomendación:** identificar el elemento que excede el ancho, revisar padding y flex del encabezado y eliminar mínimos innecesarios. Evitar ocultar el overflow como única solución, porque puede recortar controles.

### NP-13 — Baja: el tema se pierde al navegar

**Evidencia:** se activó oscuro en el inicio y al navegar al perfil volvió a claro. Los manejadores de `#toggle` solo alternan una clase en el documento actual.

**Recomendación:** centralizar y restaurar la preferencia de tema antes del primer render, respetando también la preferencia del sistema si no hay una selección guardada.

### NP-14 — Baja: recursos pesados y carga bloqueante

**Evidencia:** una pantalla interna enlaza **1,280,086 bytes** de JavaScript y CSS locales, antes de HTML, fuentes externas e imágenes. `js/libs.js` pesa 730,411 bytes; `img/bg-first-screen.jpg`, 884,410 bytes. Los scripts están en el head sin `defer`, las imágenes HTML no usan `loading="lazy"`, y se cargan familias tipográficas adicionales desde imports CSS.

**Impacto:** hay oportunidades claras de reducir carga, particularmente en móvil. Estas cifras son tamaños de archivo sin comprimir, no tiempos de descarga ni métricas Core Web Vitals; no se ejecutó Lighthouse ni una simulación de red lenta.

**Recomendación:** retirar librerías/CSS innecesarios, optimizar imágenes, diferir scripts conservando el orden y añadiendo correctamente los manejadores dependientes, y cargar de forma diferida las imágenes fuera de la vista inicial. Medir después en un despliegue representativo.

### NP-15 — Baja: documentación mínima y lógica duplicada

**Evidencia:** `README.md` solo contiene el nombre del proyecto. Navegación, footer, formularios y validaciones están repetidos entre pantallas. `js/validaciones.js` no se carga activamente; en billetera aparece comentado y no protege su acceso al formulario con una comprobación de existencia. `html/queso.html` contiene el texto de prueba «jamonadas» y el título «Document». No hay pruebas, configuración de CI ni instrucciones de validación en el repositorio original.

**Recomendación:** documentar ejecución, alcance de la demo y estado de cada flujo; extraer lógica compartida y establecer una fuente común para navegación/footer. Retirar el archivo de prueba si no tiene propósito. Añadir comprobaciones útiles de enlaces y flujos, sin exigir un cambio de framework solo por la auditoría.

## Orden propuesto de corrección

1. Definir si el entregable seguirá siendo una maqueta o será una tienda operativa. Para una maqueta, rotular las acciones simuladas y corregir los mensajes engañosos; para una tienda, resolver autenticación, persistencia y transacciones antes de habilitar operaciones reales.
2. Corregir enlaces, imports CSS y URLs corruptas; evitar el GET de los formularios de tienda y arreglar el menú móvil.
3. Corregir contraste, nombres accesibles y validación de correo; implementar búsqueda/filtros y revisar los placeholders.
4. Unificar preferencias y componentes compartidos, documentar dependencias, reducir recursos y establecer comprobaciones repetibles.

## Evidencias y reproducción

- [Resultados estáticos](static-results.json): ubicaciones y líneas, enlaces, recursos, tamaños y sintaxis.
- [Resultados del navegador](browser-results.json): estados, accesibilidad, peticiones y los 13 escenarios finales.
- [Capturas](capturas/): vistas individuales y `resumen-{1440,390}-{light,dark}.png`.
- [Mapa auxiliar Graphify](graphify-out/graph.html) y [límites del mapa](graphify-out/GRAPH_REPORT.md).

Desde la raíz del proyecto:

```powershell
python auditoria/inspect_static.py

$auditToolDir = Join-Path $env:TEMP 'novaplaza-audit-tools'
npm install --prefix $auditToolDir --no-audit --no-fund playwright @axe-core/playwright
node auditoria/inspect_browser.cjs $auditToolDir
```

El script de navegador usa la instalación estándar de Edge en Windows, levanta un servidor local temporal y lo cierra al terminar. Las dependencias de auditoría se instalaron en carpetas temporales, fuera del proyecto. Para Graphify se usó un entorno Python temporal y los scripts `inspect_graph.py` y `finish_graph.py`.

**Advertencia del mapa auxiliar:** el grafo de JavaScript tiene 9 autorrelaciones y agrupa 325 relaciones con los mismos extremos; no modela los bloques inline y muchas funciones de bibliotecas tienen nombres minimizados. Sus 209 nodos y 797 aristas no deben interpretarse como cobertura completa de la aplicación. Los hallazgos del informe se confirmaron leyendo el código y con comprobaciones específicas, sin depender de inferencias del grafo.

**Fuera de alcance:** despliegue público, cabeceras/configuración del servidor de producción, pruebas de carga, pruebas de pagos reales, auditoría dinámica de una API, pentest completo, revisión legal y certificación WCAG. No se confirmó una CVE explotable. No hay una API de negocio local contra la que ejecutar Postman en este repositorio.

Los archivos originales de la aplicación permanecieron sin cambios; los entregables se añadieron únicamente en `auditoria/`.
