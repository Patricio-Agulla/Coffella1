# Club Coffella · Comunidad v5 (v3 + marca de coffella.vercel.app)

Versión del 26/10/2026. Corrige la base del mix: el cliente quería mezclar la **v3** ([../web-comunidad-v3/](../web-comunidad-v3/)) con lo que le gustó de [coffella.vercel.app](https://coffella.vercel.app/), no la v2. La [v4](../web-comunidad-v4/) queda como estaba.

- Figma: página **08 · Comunidad (rediseño)**, sección `337:3` "v5 · Mix sobre v3", a la derecha de la v4. Tiene la página completa en desktop y mobile, la invitación, el registro en sus 3 pasos (el 2 con errores), cuatro estados del carnet (3 sellos, sirviéndose la 4ª visita, taza de regalo y completo) y el registro 1 y 3 en mobile.

## Ajustes después de la revisión (26/10)

1. **Nosotros:** queda solo la frase de qué es Coffella (con las tres fotos en línea). Se quitaron el texto de apoyo, los números y la nota.
2. **Hero sin foto:** un panel Amarillo con el titular, los botones y la taza asomando desde el borde inferior. En la precarga, las fotos ya no terminan en el hero: caen dentro de la taza, que se despierta.
3. **Gratis como beneficio:** "Gratis" y "Sin costo" pasaron a ser el primer beneficio de cada tarjeta de rol, en negrita. Ya no hay nota debajo del botón.

Para verla, desde la raíz `COFFELLA/` corré `npx http-server . -p 5173 -c-1` y abrí `http://127.0.0.1:5173/web-comunidad-v5/index.html`.

## Qué se pidió y cómo quedó

| Pedido | En la v5 |
|---|---|
| 1. Incorporar la marca, sobre todo el logo | El isotipo (la taza) aparece en cuatro lugares: asoma desde el borde inferior del panel del hero, en el pie (sale del panel café), en la invitación y en la precarga (una taza chica que se llena con el porcentaje). Los sellos del carnet también son tazas, y el carnet lleva el sticker "coffella CLUB". |
| 2. Formas de unirse como en la v4, en un solo color más claro | Las 4 tarjetas de la v4 (Tomo café, Preparo café, Tengo una cafetería, El Club completo), todas en amarillo claro (`#FAEEC4`). Al pasar el puntero se llenan de Amarillo pleno. El primer beneficio es "Gratis" o "Sin costo" y el botón va al pie, así los cuatro quedan en la misma línea. |
| 3. Quitar "Para probar", "Para aprender", etc. | El bento de "Lo que compartimos" ya no tiene esas bajadas. La foto de "Carnet de sellos" cambió para no repetir la del carnet. |
| 4. Presentación del carnet de la v2, reversionada | Foto a sangre en un marco redondeado: texto abajo a la izquierda y carnet a la derecha con el sticker del Club. Los sellos son tazas: "Probá cómo se sella" sirve el café, la taza se llena y abre los ojos. En la 4ª y la 8ª la taza es naranja (premio). Debajo, "Cómo funciona" con cuatro cuencos que se llenan paso a paso. |
| 5. Cards de juntadas con fechas más livianas y CTA alineados | Fecha en una ficha horizontal: número en Sora 600 de 24 px y día, mes y hora en Figtree 600 de 12 px, sin mayúsculas. El pie de cada tarjeta (lugares y "Reservar mi lugar") queda abajo, así los cuatro botones quedan en la misma línea. |
| 6. Historias tal cual la v3 | Igual: selector Notas/Videos, mismas tarjetas. Solo cambia la tipografía de los titulares (Sora). |
| 7. Mapa y estructura de la v3 | Igual: mismo orden de secciones, mapa a todo el ancho con buscador, filtros y tarjetas. |
| 8. Sin humo en la taza del hero, algo más pensado | Al terminar la precarga, las fotos caen dentro de la taza, que sube dormida desde el borde del panel, se despierta, recorre el titular palabra por palabra y mira "Sumate al Club". Después mira con inercia lo que señalás y parpadea cada tanto. Al bajar se hunde en el panel y vuelve a asomar cuando volvés arriba. Si la tocás, parpadea. |
| 9. Redes con más contexto | "El Club, en Instagram.": qué se publica y cada cuánto, un epígrafe en cada foto (cuenta y qué pasó), cómo aparecer (#ClubCoffella o etiquetar a @clubcoffella), un botón para seguir, otro que copia el hashtag y tres datos (seguidores, frecuencia y fotos de miembros). |

Del pedido anterior se mantienen:
- **Tipografía:** Sora 600 para titulares e interfaz y Figtree para leer, con escala propia y nada por debajo de 500.
- **Márgenes:** contenedor de 1560 px y márgenes de 16 a 40 px (la v3 tenía 1320 px y hasta 56 px).
- **Botones:** al pasar el puntero se llenan de color desde abajo.

## Microinteracciones

- **Taza del hero:** recibe las fotos de la precarga, se despierta, lee el titular, mira con inercia y parpadea. Se hunde y vuelve a asomar con el scroll.
- **Taza del pie:** duerme hasta que llegás; ahí se despierta y mira el formulario y el campo donde escribís.
- **Taza de la invitación:** asoma y mira el email.
- **Sello:** el café se sirve, la taza se llena y abre los ojos.
- **Tarjetas de rol y botones:** se llenan de color al pasar el puntero.
- **Reserva:** el contador de lugares salta.
- **Guardar nota:** el marcador hace "pop".
- **Copiar #ClubCoffella:** el botón confirma en el lugar ("Copiado: pegalo en tu post").
- **Cómo funciona:** los cuencos se llenan al aparecer.
- **De la v3:** precarga, contador de miembros, fotos en la frase de "Nosotros" y cierre que se abre.

## Accesibilidad

Se revisó en Chromium headless a 1440 × 900 y 390 × 844:
- **Contraste:** ningún texto por debajo de 4,5:1 (3:1 en texto grande).
- **Ancho:** nada se desborda horizontalmente.
- **Nombres accesibles:** todos los controles tienen nombre.
- **Táctil:** objetivos de 28 a 32 px o más en el pie.
- **Sin animaciones:** con `prefers-reduced-motion` no hay precarga y las tazas quedan quietas y despiertas.

## Parámetros de URL

Los de la v3 (`?static`, `?frame`, `?noload`, `?open=…`, `?role=…`, `?user=1`, `?reset`), más:
- `?noinvite`: sin la invitación;
- `?carnet=3|4|8|pour`: carnet de ejemplo con N sellos, o sirviéndose la 4ª visita;
- `?only=carnet`: solo la sección del carnet;
- `?errors`: con `open=signup-2`, muestra los errores del paso 2.

`?static` deja las tazas y los sellos listos para capturar a Figma: pasa estilos y transforms del SVG a atributos y da radios circulares en px a los cuencos. También fija los renglones (con las fuentes ya cargadas) de los textos con fotos o links en línea y de los que usan `text-wrap: balance`, porque Figma no aplica el balanceo y deja palabras sueltas. El estado se guarda en `localStorage` con el prefijo `coffella-com5:`.

## Fotos

- **Carnet:** la foto del carnet de la v2 (Cosmos), recortada en local (`assets/img/carnet-*.webp`) porque desde Cosmos pesaba 1,5 MB y tardaba en aparecer.
- **Sticker:** "coffella CLUB" (`assets/img/sticker-club.webp`), copiado de `web/assets/stickers/`.
- **Resto:** las mismas fotos que la v3. Las de Cosmos y Unsplash son de terceros y hay que reemplazarlas antes de publicar.

## Pendiente

- Fotos propias o licenciadas.
- Datos reales.
- Envío del link mágico.
- Proveedor de mapas con API key.
