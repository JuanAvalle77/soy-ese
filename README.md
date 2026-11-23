# soy ese — catálogo web

Catálogo de ropa y accesorios de **soy ese** (Venezuela). Los clientes eligen productos y variantes, arman un pedido y lo envían por WhatsApp con el método de pago elegido. Pueden pedir sin cuenta o crear una para guardar sus datos y ver sus pedidos en «Mi cuenta». La dueña entra con su cuenta de administradora y gestiona pedidos, productos, categorías, textos, pagos y entrega desde la propia web.

Sitio estático (HTML, CSS y JavaScript sin frameworks) + [Supabase](https://supabase.com) para datos, login de administradora y fotos.

## Probar en local

```bash
npm run dev
```

Abrir http://localhost:4173. Si `config.js` no tiene claves de Supabase, la web funciona en **modo de prueba local**: cuentas, pedidos y cambios se guardan solo en ese navegador.

En modo local, `local-config.json` (no se sube a GitHub) define la cuenta admin de prueba y los datos de WhatsApp y pagos del primer arranque. Para empezar de cero, borrar los datos del sitio en el navegador.

## Configurar Supabase (una sola vez)

1. Crear un proyecto en supabase.com.
2. En **SQL Editor**, ejecutar `supabase/schema.sql` y después `supabase/datos-privados.sql`. Este segundo archivo no está en el repositorio porque tiene los datos de pago y el email de la administradora.
3. En **Authentication → Users → Add user**, crear el usuario de la administradora con el mismo email que figura en `admins` (con "Auto confirm user").
4. En **Authentication → Sign In / Providers**, dejar activado "Allow new users to sign up" (los clientes crean su cuenta desde la web). Si "Confirm email" está activado, los clientes reciben un email para confirmar; el plan gratis envía pocos emails por hora, así que para empezar conviene desactivarlo.
5. Copiar la **Project URL** y la **anon public key** (Project Settings → API) en `config.js`. Nunca usar la `service_role` key en la web.

Seguridad: cualquiera puede leer el catálogo y crear una cuenta de cliente; cada cliente ve solo sus pedidos. Solo los emails de la tabla `admins` pueden modificar la tienda, subir fotos, ver todos los pedidos y cambiar su estado (políticas RLS en `schema.sql`).

## Publicar en Vercel

Importar el repositorio en vercel.com. `vercel.json` ya indica `npm run build` y la carpeta `dist`. No hace falta configurar variables de entorno. Cada push a `main` se publica solo.

## Notas

- Todos los pedidos llegan como mensaje de WhatsApp. Los de clientes con cuenta además se guardan (pestaña Pedidos del panel). El carrito vive en el navegador del cliente.
- Las fotos se reducen a 1200 px JPEG antes de subirlas. Al borrar un producto, su foto queda en el bucket `fotos`.
- Tipografías: Neigfriste (títulos) y GEORGEA, de la carpeta de marca. Falta confirmar que su licencia permite el uso web comercial.
- `assets/coleccion.png` es una imagen ilustrativa generada con IA; conviene reemplazarla por fotos reales.
