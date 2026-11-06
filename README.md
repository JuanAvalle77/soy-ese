# soy ese — catálogo de muestra

Demo funcional en español, con diseño responsive y sin dependencias de ejecución. Proyecto preparado para publicarse como sitio estático en Vercel.

## Probar

Con Node.js instalado, ejecutar `npm run dev` desde esta carpeta y abrir `http://localhost:4173`. También se puede abrir `index.html`, aunque el guardado en archivos locales depende del navegador. El servidor local ofrece la experiencia más fiable.

En **Administrar** se pueden crear, editar y eliminar productos y categorías. Cada categoría admite campos de texto, números, listas de valores o selección entre opciones, con configuración de obligatoriedad. Las fotos se cargan desde el dispositivo. Los productos pueden quedar como borrador, publicarse o marcarse agotados. En **Mi tienda** se editan la marca, la portada y la moneda. Cambiar moneda no convierte importes.

Si un cambio de esquema deja productos publicados con campos inválidos u obligatorios vacíos, pasan a borrador para revisarlos. Las categorías con productos no se pueden eliminar hasta mover o eliminar esos productos.

## Alcance de la muestra

Los cambios y fotos se guardan en localStorage bajo `michi-shop-demo-v1`, únicamente en ese navegador y origen. No hay backend, cuenta de administradora, base de datos compartida, pagos, carrito ni envíos. El botón Administrar está abierto para explorar la demostración. Publicar esta demo no convierte los cambios locales en un catálogo compartido: cada visitante comienza con los ejemplos.

Para producción hay que incorporar autenticación y autorización de la administradora, persistencia compartida de categorías/campos/productos y almacenamiento de fotos. El navegador puede borrar sus datos y tiene límites de espacio. Las fotos se reducen a 1200 px y JPEG para facilitar las pruebas. La web conserva las fuentes de sistema si Google Fonts no está disponible.

## Vercel

Subir esta carpeta a un repositorio e importarlo en Vercel. La configuración incluida indica `npm run build` y salida `dist`. No se necesitan variables de entorno para esta demo. `npm run build` copia únicamente los archivos públicos. No se realizó un despliegue ni se conectó una cuenta de Vercel.

## Imagen ilustrativa

`assets/coleccion.png` fue creada con la herramienta integrada de generación de imágenes; no representa productos reales. Prompt usado:

> Use case: product-mockup. Create one wide editorial product photograph for a playful cat-themed fashion catalog. A white cotton t-shirt with a large cute black cat face print, a pink baseball cap embroidered with a small black cat face, and two tiny ceramic cat figurines, arranged beautifully on vivid light pink studio blocks against a pink backdrop. Fashion boutique art direction, realistic cloth textures, crisp soft studio shadows, charming premium approachable mood, monochrome black cat motifs. Landscape composition, no lettering, no watermark, no web interface. All products fully visible.

## Identidad visual
Nombre actualizado a soy ese. Paleta y estilo inspirados en las referencias de Instagram proporcionadas: coral, crema, marrón y azul tinta. El logo visible usa la captura aportada; conviene reemplazarlo por el archivo original para producción.

## Marca aplicada — 16 octubre 2026
Paleta oficial F5CDC0, FF8C66, 906F8D, 744C71, 34375A. Neigfriste local para títulos y GEORGEA local para subtítulos; texto y formularios en Arial para legibilidad. Logo original PNG de Drive, mostrado sin alterar el archivo. Confirmar licencia de incrustación comercial de las fuentes antes de publicar. Los productos de ejemplo y los datos guardados se conservan.

## Páginas de producto y variantes
Cada producto publicado tiene una ruta #producto/ID. En Administrar > Productos > Variantes se pueden editar combinaciones de color, talle y material, con precio opcional, disponibilidad y foto por combinación. Precio vacío hereda el general. Las combinaciones duplicadas o incompletas se rechazan. La franela de ejemplo incluye Blanco, Negro y Coral; usa la imagen general hasta cargar fotos propias. Los selectores no realizan pedidos.
En Administrar > Pagos y entrega se pueden crear, activar, desactivar y quitar métodos, editar instrucciones públicas y configurar el delivery. Se precargan Binance, Zelle, Pago Móvil, PayPal y Yummy, sin datos bancarios ni integración de cobros. Todo sigue guardándose únicamente en este navegador.
GEORGEA no tiene soporte completo de tildes: los subtítulos ahora usan Arial para todo el texto, evitando mezclar letras de fuentes diferentes; Neigfriste se conserva para titulares.

