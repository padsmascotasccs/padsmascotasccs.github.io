/* ==========================================================================
   CONFIGURACIÓN DEL SITIO
   Este es el único archivo que necesitas editar para los datos generales.
   Los productos están en  data/products.json
   La galería de Instagram está en  data/instagram.json
   ========================================================================== */

export const CONFIG = {
  /* ---------------------------------------------------------------------
     MODO DEMOSTRACIÓN
     true  -> muestra productos DE EJEMPLO (data/demo/products.json) y un aviso
              visible. Sirve para ver cómo luce la tienda antes de cargar los
              productos reales.
     false -> muestra únicamente tu catálogo real (data/products.json).
     >>> Pon false antes de compartir el enlace con clientes. <<<
     --------------------------------------------------------------------- */
  modoDemo: false,

  marca: {
    nombre: "Pads Mascotas", // PENDIENTE DE CONFIRMAR: tomado del usuario de Instagram
    logo: "", // opcional: ruta a un logo, p. ej. "assets/img/logo.svg"
    ubicacion: "Caracas, Venezuela",
    email: "", // opcional
  },

  /* ---------------------------------------------------------------------
     >>> WHATSAPP: ESCRIBE AQUÍ TU NÚMERO <<<
     Formato internacional, solo dígitos, sin "+", espacios ni guiones.
     Ejemplo de formato para Venezuela: 58 + código de operadora sin el 0 + número.
     Mientras esté vacío, los botones abren WhatsApp con el mensaje listo
     pero sin destinatario (el cliente tendría que elegir el contacto).
     --------------------------------------------------------------------- */
  whatsapp: {
    numero: "584126354963", // +58 412-6354963
    mensajeGeneral: "¡Hola! Vengo de la página web y quiero más información sobre los training pads.",
  },

  instagram: {
    usuario: "padsmascotas_ccs",
    url: "https://www.instagram.com/padsmascotas_ccs/",
  },

  /* Precios en dólares. "precioBs" de cada producto = monto en $ que se paga en Bs a tasa BCV. */
  moneda: { simbolo: "$", locale: "es-VE", decimales: 2 },

  /* ---------------------------------------------------------------------
     TASA BCV
     La tienda consulta sola la tasa oficial del día para mostrar los montos
     en bolívares. Si algún día la fuente falla o quieres fijarla tú, escribe
     el valor en "manual" (p. ej. 911.62) y se usará ese; con 0 es automática.
     --------------------------------------------------------------------- */
  tasaBCV: {
    url: "https://ve.dolarapi.com/v1/dolares/oficial",
    manual: 0,
  },

  /* Textos del inicio. */
  hero: {
    etiqueta: "Tienda online",
    titulo: "Training pads para tu *mascota*, en su talla.", // *palabra* = cursiva de acento
    subtitulo:
      "Tres presentaciones —M, L y XL— disponibles para entrega inmediata en Caracas. Arma tu pedido y envíalo por WhatsApp en un par de minutos.",
    // Hasta 3 fotos tuyas para la composición del inicio (verticales lucen mejor).
    // Ej.: ["assets/img/hero/1.jpg", "assets/img/hero/2.jpg", "assets/img/hero/3.jpg"]
    imagenes: [],
    // Frases de la cinta animada bajo el inicio
    cinta: ["Tallas M · L · XL", "Entrega inmediata", "Delivery gratis en Caracas desde 2 paquetes", "Pedidos por WhatsApp"],
  },

  /* Bloque "Cómo comprar" del inicio y de cada ficha de producto */
  info: [
    { titulo: "Entregas", texto: "Delivery en Caracas: $4 con un paquete y gratis a partir de dos. También puedes pautar un encuentro en Galerías Prados del Este, sin costo." },
    { titulo: "Pagos", texto: "En dólares: divisa en efectivo, Binance o Zinli. En bolívares: a tasa BCV, con el precio en Bs de cada talla." },
    { titulo: "Disponibilidad", texto: "Todas las tallas están disponibles para entrega inmediata." },
  ],

  /* Sección "Sobre nosotros". Déjalo vacío para ocultarla (fuera del modo demo). */
  nosotros: {
    titulo: "Un emprendimiento caraqueño, a un mensaje de distancia",
    parrafos: [
      "Somos un emprendimiento en Caracas y funcionamos como tienda online: eliges tu talla aquí, nos escribes por WhatsApp y coordinamos la entrega contigo.",
      "Con la compra de dos paquetes, el delivery en Caracas es gratis. Si lo prefieres, también pautamos un encuentro en Galerías Prados del Este.",
    ],
    imagen: "assets/img/productos/training-pads-l.jpg", // cámbiala por una foto tuya cuando quieras
    // Hasta 3 diferenciadores: [{ titulo: "…", texto: "…" }]
    valores: [
      { titulo: "En Caracas", texto: "Emprendimiento local, con atención directa." },
      { titulo: "Tienda online", texto: "Pides desde el teléfono, sin filas ni traslados." },
      { titulo: "Delivery gratis", texto: "Con la compra de dos paquetes o más." },
    ],
  },

  /* ---------------------------------------------------------------------
     ZEUS — asistente virtual del inicio
     Funciona dentro de la página (sin servidor ni tokens). Sus respuestas
     salen de este archivo, de data/products.json y de assets/js/zeus.js.
     --------------------------------------------------------------------- */
  zeus: {
    avatar: "assets/img/zeus.jpg",
    zonaBase: "Manzanares, Caracas", // referencia para evaluar entregas en efectivo
    minutosMax: 25, // más lejos que esto, un pedido en efectivo puede no aceptarse
  },

  /* ---------------------------------------------------------------------
     INVENTARIO Y REGISTRO DE PEDIDOS (Google Sheets)
     Pega aquí la dirección de tu "aplicación web" de Apps Script (termina en
     /exec). Sirve para las dos cosas: la tienda lee de ahí cuántos paquetes
     quedan y anota ahí cada pedido. Instrucciones en google/LEEME-google.md.
     Mientras esté vacío, el inventario sale de "existencias" en
     data/products.json y los pedidos no se anotan en ninguna hoja.
     --------------------------------------------------------------------- */
  inventario: {
    url: "https://script.google.com/macros/s/AKfycby64_s1_hbtzmZTqSjW-RVAXPZzaiouHB72WuSDkLzrkh-efyVwxWseIBeEfTZb2sSO/exec",
    pocasDesde: 5, // con esta cantidad o menos, el aviso sale en rojo
  },
  registro: {
    url: "https://script.google.com/macros/s/AKfycby64_s1_hbtzmZTqSjW-RVAXPZzaiouHB72WuSDkLzrkh-efyVwxWseIBeEfTZb2sSO/exec",
  },

  /* Formulario de pedido */
  pedido: {
    prefijo: "PM", // prefijo del número de referencia del pedido
    // Opciones de entrega que ofreces. Vacío = campo de texto libre.
    // Ej.: ["Retiro personal", "Delivery", "Envío nacional"]
    opcionesEntrega: ["Delivery en Caracas", "Encuentro en Galerías Prados del Este"],
    // Delivery gratis a partir de esta cantidad de paquetes (0 = no mostrar el aviso)
    deliveryGratisDesde: 2,
    // Costo del delivery (en $) cuando el pedido NO llega a esa cantidad. 0 = se acuerda por WhatsApp.
    costoDelivery: 4,
    // Cuál de las opciones de entrega es la que cobra delivery (debe coincidir con el texto de arriba)
    opcionDelivery: "Delivery en Caracas",
    // Formas de pago. "campo" indica qué precio del producto se usa para el total.
    opcionesPago: [
      { id: "usd", etiqueta: "Dólares (divisa, Binance o Zinli)", campo: "precio" },
      { id: "bs", etiqueta: "Pago móvil (Bs a tasa BCV)", campo: "precioBs", pagoMovil: true },
    ],
    /* -------------------------------------------------------------------
       >>> PAGO MÓVIL: ESCRIBE AQUÍ TUS DATOS <<<
       Se muestran al cliente después de enviar el pedido, con botón de copiar.
       Los campos vacíos no se muestran. OJO: estos datos quedan públicos.
       ------------------------------------------------------------------- */
    pagoMovil: {
      banco: "Bancamiga",
      telefono: "04126354963",
      documento: "31230001",
      titular: "", // opcional
    },
  },
};
