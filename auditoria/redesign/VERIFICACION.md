# Verificación de la renovación de Nova Plaza

Fecha: 13 de octubre de 2026. Vista local: **http://127.0.0.1:4173**.

## Resultado

- **15 de 15 escenarios principales correctos** en un contexto aislado de Microsoft Edge/Chromium.
- **60 estados principales de pantalla** revisados en 1440, 390 y 320 px, en temas claro y oscuro.
- **22 estados adicionales**: inicio final con imagen optimizada en 1440, 768, 390 y 320 px; seis modales/menú móvil en ambos temas; fichas de tiendas con y sin productos.
- **Sin excepciones JavaScript, HTTP 404 ni desbordamiento horizontal** en las comprobaciones finales.
- **Cero incidencias de las reglas Axe WCAG A/AA seleccionadas** en los 82 estados. Esto no constituye certificación WCAG ni una prueba exhaustiva con lectores de pantalla.
- `npm run build` y `git diff --check` correctos.

## Flujos comprobados

| Escenario | Evidencia |
|---|---|
| Búsqueda y categorías | Resultados reales, coincidencias por marca, estado vacío y limpieza de búsqueda. |
| Favoritos | Persisten al navegar y recargar, y se transfieren de visitante a la nueva cuenta. |
| Inicio de sesión | Credenciales inexistentes rechazadas; no basta con completar los campos. |
| Registro | Correos con `+` y dominio largo aceptados; contraseñas débiles o distintas bloqueadas. |
| Contraseñas | No se conserva la contraseña de prueba como texto en el estado guardado. |
| Recuperación | Código incorrecto rechazado; el código emitido permite establecer e iniciar con la nueva contraseña de prueba. |
| Carrito | Talla elegida, cantidades, persistencia y precios calculados con enteros en céntimos. |
| Cupón | Código inválido rechazado; NOVA10 calcula el descuento correspondiente. |
| Billetera | Importe negativo rechazado; recarga ficticia registrada. |
| Checkout | Valida dirección, celular y consentimiento; guarda el pedido, vacía el carrito y descuenta saldo cuando corresponde. |
| Transacciones fallidas | Un pedido con saldo insuficiente conserva saldo, carrito e historial. |
| Existencias y recibos | Cantidad fuera del límite rechazada; precios unitarios guardados en el pedido. |
| Perfil y direcciones | Nombre y dirección guardados; contenido HTML ingresado como nombre se muestra como texto. |
| Mensajes y comentarios | Persisten localmente; archivo no admitido rechazado, metadatos PDF registrados. |
| Suscripción | Se guarda el correo de prueba sin introducir datos personales en la URL. |
| Tema y menú móvil | Tema conservado entre rutas; menú y bloqueo de scroll coherentes tras varios cambios de tamaño. |
| Dependencias externas | Catálogo y favoritos funcionan bloqueando peticiones a orígenes externos. |

## Diseño y recursos

Todas las pantallas comparten navegación, componentes, catálogo, estado y estilos. Se retiraron las bibliotecas y hojas de estilo antiguas que no se utilizan; el sitio no carga CDNs ni fuentes externas.

Los archivos activos de JavaScript y CSS suman aproximadamente **125 kB sin comprimir**, frente a los **1.28 MB** de recursos locales enlazados por una pantalla interna de la versión anterior. Esto mide bytes de archivo, no rendimiento de red ni Core Web Vitals.

La imagen principal es `img/hero-superstar.webp`: recorte transparente creado con la herramienta integrada ImageGen a partir de `img/c1.jpg`, exportado a 900×507 px y aproximadamente 55 kB. La fotografía original se conserva. El prompt completo está en `hero-prompt.txt`.

## Evidencia

- `results.json`: 15 escenarios principales y 60 estados.
- `final-checks.json`: comprobación transaccional adicional y 22 estados finales.
- PNG en esta carpeta: escritorio, móvil, ambos temas y modales.
- `first-pass-results.json`: resultado previo a los ajustes de contraste, ancho pequeño y espera de la comprobación de recuperación; es histórico y no es el resultado final.

Las pruebas usan cuentas, correos, mensajes, direcciones y saldo ficticios en un navegador aislado. El navegador personal queda abierto en el inicio público y no recibe esos datos de prueba.

## Límites

La experiencia está lista para explorar localmente. Las cuentas, recuperación, saldo y pedidos son de demostración y se guardan en el navegador. No se ha implementado autenticación o autorización con servidor, integración de pagos, correo, despacho de productos ni conexión con las tiendas.

Los mensajes aclaran si los datos se guardan localmente y los formularios de pago no piden tarjetas reales. El contenido de los adjuntos no se almacena ni se transmite. La capa de producción requiere servicios reales y sus propias comprobaciones.
