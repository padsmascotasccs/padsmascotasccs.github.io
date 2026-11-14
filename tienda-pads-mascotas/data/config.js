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
    { titulo: "Entregas", texto: "Delivery gratis en Caracas a partir de dos paquetes, o encuentro pautado en Galerías Prados del Este." },
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

  /* Formulario de pedido */
  pedido: {
    prefijo: "PM", // prefijo del número de referencia del pedido
    // Opciones de entrega que ofreces. Vacío = campo de texto libre.
    // Ej.: ["Retiro personal", "Delivery", "Envío nacional"]
    opcionesEntrega: ["Delivery en Caracas", "Encuentro en Galerías Prados del Este"],
    // Delivery gratis a partir de esta cantidad de paquetes (0 = no mostrar el aviso)
    deliveryGratisDesde: 2,
    // Formas de pago. "campo" indica qué precio del producto se usa para el total.
    opcionesPago: [
      { id: "usd", etiqueta: "Dólares (divisa, Binance o Zinli)", campo: "precio" },
      { id: "bs", etiqueta: "Bolívares a tasa BCV", campo: "precioBs" },
    ],
  },
};
