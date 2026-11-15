# Hoja de Google: pedidos e inventario

Con esto la tienda anota cada pedido en una hoja tuya y lee de esa misma hoja
cuántos paquetes quedan. Tú cambias un número en la hoja (desde el teléfono
sirve) y la página se actualiza sola. No gasta tokens ni depende de nadie.

## Instalación (una sola vez, unos 10 minutos)

1. Entra a <https://sheets.new> con la cuenta de Google del negocio. Ponle un
   nombre a la hoja, por ejemplo "Pads Mascotas — Ventas".
2. Menú **Extensiones → Apps Script**.
3. Borra lo que aparece y pega todo el contenido de `apps-script.gs`. Guarda.
4. Arriba, elige la función **preparar** y pulsa **Ejecutar**. Google te pedirá
   autorizar: elige tu cuenta, luego **Configuración avanzada → Ir a (nombre del
   proyecto)** y **Permitir**. Esto crea las pestañas "Pedidos" e "Inventario".
5. Botón **Implementar → Nueva implementación**. Tipo: **Aplicación web**.
   - Ejecutar como: **Yo**.
   - Quién tiene acceso: **Cualquier persona**.
   Pulsa **Implementar** y copia la **URL de la aplicación web** (termina en `/exec`).
6. Abre `data/config.js` y pega esa URL en los dos sitios:
   `inventario.url` y `registro.url`.
7. Sube la carpeta de la tienda a GitHub como siempre.

## Uso diario

- **Cambiar cuántos paquetes quedan**: pestaña **Inventario**, columna B. Si
  pones 0, esa talla sale como agotada y no se puede pedir.
- **Ver ventas**: pestaña **Pedidos**. Cada pedido llega con estado
  "Pendiente"; cámbialo tú a "Pagado", "Entregado" o "Cancelado".
- La tienda **no descuenta sola** el inventario: un pedido enviado todavía no es
  una venta cobrada. Baja el número tú cuando confirmes la venta.

## A tener en cuenta

- Se anota un pedido cuando el cliente pulsa "Enviar pedido" en la página,
  aunque después no llegue a enviarte el mensaje por WhatsApp.
- La dirección `/exec` es pública: alguien que la conozca podría mandar filas
  falsas. Si pasa, bórralas; no pueden leer tus datos.
- Si cambias el código, hay que hacer **Implementar → Gestionar
  implementaciones → Editar → Versión nueva** para que tome efecto.
