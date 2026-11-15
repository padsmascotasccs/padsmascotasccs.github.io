/* Zeus — asistente virtual de la tienda.
   Funciona por completo en el navegador del cliente: no usa servidor, no gasta
   tokens y está disponible 24/7. Responde a partir de los datos de la tienda
   (catálogo, configuración, inventario y tasa BCV). Si no sabe algo, deriva
   al WhatsApp del negocio con una copia del chat.

   Para ajustar lo que dice: edita los textos de este archivo o los datos de
   data/config.js (sección "zeus") y data/products.json. */
import { CONFIG, esc, $, ico, precio, normalizar, enlaceWhatsApp, tasaBCV, bolivares, textoTasa } from "./core.js";

const CLAVE = "tienda_zeus_chat_v1";
const Z = CONFIG.zeus ?? {};
const AVATAR = Z.avatar || "assets/img/zeus.jpg";

export function montarZeus(root, cat) {
  const prods = cat.productos;
  const P = CONFIG.pedido;
  const porTalla = (s) => prods.find((p) => normalizar(p.sigla) === s);
  const queda = (p) => (p.existencias == null ? null : Math.max(0, Number(p.existencias)));
  let tasa = null;
  tasaBCV().then((t) => (tasa = t));

  /* ---------- historial (se conserva mientras la pestaña siga abierta) ---------- */
  let historial = [];
  try {
    historial = JSON.parse(sessionStorage.getItem(CLAVE) || "[]");
  } catch {}
  const guardar = () => {
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify(historial.slice(-40)));
    } catch {}
  };

  /* ---------- enlace a WhatsApp con copia del chat ---------- */
  function enlaceConChat(motivo = "") {
    const lineas = historial.map((m) => `${m.de === "yo" ? "Cliente" : "Zeus"}: ${m.plano}`);
    let copia = lineas.join("\n");
    if (copia.length > 1500) copia = "…" + copia.slice(-1500);
    const cab = `Hola, vengo del asistente Zeus de la página web.${motivo ? ` ${motivo}` : ""}`;
    return enlaceWhatsApp(copia ? `${cab}\n\n— Copia del chat —\n${copia}` : cab);
  }

  /* ---------- piezas de respuesta ---------- */
  const B = {
    wa: (label = "Escribir por WhatsApp") => ({ wa: true, label }),
    catalogo: { href: "catalogo.html", label: "Ver catálogo" },
    pedido: { href: "catalogo.html", label: "Hacer mi pedido" },
    sala: { href: "modelos-3d.html", label: "Ver en 3D" },
  };
  const lineaPrecio = (p) =>
    `<b>Talla ${esc(p.sigla)}</b> (${esc(p.descripcionCorta.replace(/^Paquete de /, ""))}): <b>${precio(p.precio)}</b> en divisa` +
    (p.precioBs != null ? ` · <b>${precio(p.precioBs)}</b> en bolívares${tasa ? ` (≈ ${bolivares(p.precioBs, tasa)})` : ""}` : "");
  const listaPrecios = () => `<ul>${prods.map((p) => `<li>${lineaPrecio(p)}</li>`).join("")}</ul>`;
  const notaTasa = () => (tasa ? `<small>Bolívares calculados con la ${textoTasa(tasa)}.</small>` : `<small>Los bolívares se calculan a la tasa BCV del día.</small>`);
  const textoStock = (p) => {
    const q = queda(p);
    if (q == null) return p.disponible ? "disponible" : "agotado";
    return q === 0 ? "agotado por ahora" : q === 1 ? "queda <b>1 paquete</b>" : `quedan <b>${q} paquetes</b>`;
  };
  const detectarTalla = (n) => (/\bxl\b|extra ?grande/.test(n) ? "xl" : /\btalla l\b|\bl\b/.test(n) ? "l" : /\btalla m\b|\bm\b|mediana/.test(n) ? "m" : null);
  const tiene = (n, ...claves) => claves.some((c) => (c instanceof RegExp ? c.test(n) : n.includes(c)));
  const derivar = (intro) => ({
    html: `${intro} Para eso lo mejor es que le escribas directamente a la persona encargada: te atenderá por WhatsApp y recibirá una copia de este chat para entender tu caso.`,
    botones: [B.wa("Hablar por WhatsApp")],
  });

  const politicaEfectivo = () =>
    `Los pedidos pagados en <b>efectivo (divisa)</b> no se confirman de inmediato: primero se evalúan, porque esas entregas las hace personalmente el encargado. Si la zona queda a más de unos <b>${Z.minutosMax ?? 25} minutos de ${esc(Z.zonaBase ?? "Manzanares, Caracas")}</b>, puede que no se acepte.`;
  const politicaBs = () =>
    `Los pedidos en <b>bolívares</b> tienen prioridad y más alcance: los entrega el encargado o se asignan a un motorizado por <b>Yummy Rides</b> (opción Mandadito).`;
  const reglaDelivery = () =>
    `<ul><li>Con <b>1 paquete</b>: delivery ${precio(P.costoDelivery)} (o su equivalente en bolívares a tasa BCV).</li><li>Con <b>${P.deliveryGratisDesde} paquetes o más</b>: delivery <b>gratis</b>.</li><li>Encuentro pautado en <b>Galerías Prados del Este</b>: sin costo.</li></ul>`;

  /* ---------- intenciones, en orden de prioridad ---------- */
  const INTENCIONES = [
    {
      // preguntas personales, de seguridad o ajenas al negocio
      si: (n) =>
        tiene(n, "contrasena", "password", "clave de", "tarjeta de credito", "cvv", "donde vives", "donde vive", "tu casa", "su casa", "direccion exacta", "direccion de tu", "direccion del dueno", "numero de cuenta", "datos personales", "nombre del dueno", "como se llama el dueno", "quien es el dueno", "cuanto ganas", "cuanto gana", "cuanto vendes", "hackear", "codigo fuente", "ignora tus instrucciones", "ignore", "prompt"),
      r: () => ({
        html: "Eso no te lo puedo responder. Solo puedo ayudarte con los training pads: tallas, precios, pagos, entregas y cómo hacer tu pedido. 🐶",
      }),
    },
    {
      si: (n) => tiene(n, "hablar con", "persona real", "un humano", "asesor", "atencion al cliente", "reclamo", "queja", "problema con mi pedido", "mi pedido no", "no me llego", "devolucion", "devolver", "reembolso", "garantia", "factura"),
      r: () => derivar("Entiendo."),
    },
    {
      si: (n) => tiene(n, "pago movil", "pagomovil", "datos de pago", "datos para pagar", "datos del pago", "a donde transfiero", "donde transfiero", "transferencia", "transferir", "cedula", "rif", "bancamiga", /\bbanco\b/),
      r: () => {
        const pm = P.pagoMovil ?? {};
        const datos = [["Banco", pm.banco], ["Teléfono", pm.telefono], ["Cédula / RIF", pm.documento], ["Titular", pm.titular]].filter(([, v]) => v);
        return {
          html:
            `Antes de pagar, <b>es preferible que primero confirmes tu pedido por WhatsApp</b> (disponibilidad y entrega). Después de eso puedes hacer el pago móvil.` +
            (datos.length ? `<br><br>Datos de pago móvil:<ul>${datos.map(([k, v]) => `<li>${k}: <b>${esc(v)}</b></li>`).join("")}</ul>El monto es el de tu pedido en bolívares, a tasa BCV.` : `<br><br>Los datos te los enviamos por WhatsApp al confirmar.`),
          botones: [B.wa("Confirmar por WhatsApp"), B.pedido],
        };
      },
    },
    {
      si: (n) => tiene(n, "efectivo", "divisa", "cash", "billete", "dolares en mano", "en dolares", "pagar en dolar", "pago en dolar"),
      r: () => ({
        html: `Sí aceptamos divisa. Ten en cuenta esto:<br><br>${politicaEfectivo()}<br><br>${politicaBs()}<br><br>Precios en divisa:${listaPrecios()}`,
        botones: [B.wa("Consultar mi zona"), B.pedido],
      }),
    },
    {
      si: (n) => tiene(n, "binance", "zinli", "usdt", "cripto", "paypal", "zelle"),
      r: (n) =>
        tiene(n, "paypal", "zelle")
          ? derivar("Los métodos confirmados en dólares son divisa en efectivo, Binance y Zinli; ese otro no lo tengo registrado.")
          : { html: `Sí: en dólares aceptamos <b>divisa en efectivo, Binance y Zinli</b>, al precio en divisa.${listaPrecios()}Conviene confirmar el pedido por WhatsApp antes de pagar.`, botones: [B.wa("Confirmar por WhatsApp"), B.pedido] },
    },
    {
      si: (n) => tiene(n, "bolivar", "bs", "bcv", "tasa", "cambio del dia"),
      r: () => ({ html: `En bolívares los precios son estos, siempre a <b>tasa BCV</b>:${listaPrecios()}${notaTasa()}<br><br>${politicaBs()}`, botones: [B.pedido] }),
    },
    {
      si: (n) => tiene(n, "delivery", "envio", "envian", "enviar", "domicilio", "llevan", "entregan", "entrega a", "motorizado", "yummy", "mandadito", "zona", "llegan a", "llegan hasta", "interior", "nacional", "otro estado", "mrw", "zoom", "tealca", "valencia", "maracay", "barquisimeto", "maracaibo"),
      r: (n) =>
        tiene(n, "interior", "nacional", "otro estado", "mrw", "zoom", "tealca", "valencia", "maracay", "barquisimeto", "maracaibo")
          ? derivar("Las entregas que tengo registradas son en Caracas; envíos fuera de la ciudad no los puedo confirmar.")
          : { html: `Entregamos en <b>Caracas</b>:${reglaDelivery()}${politicaBs()}<br><br>${politicaEfectivo()}`, botones: [B.wa("Consultar mi zona"), B.pedido] },
    },
    {
      si: (n) => tiene(n, "donde estan", "donde quedan", "ubicacion", "ubicados", "tienda fisica", "local", "retirar", "retiro", "pasar buscando", "buscar el", "pick up", "pickup", "prados del este", "galerias", "direccion", "manzanares"),
      r: () => ({
        html: `Somos una <b>tienda online</b> en Caracas, sin local físico. Puedes recibir tu pedido de dos formas:<ul><li><b>Delivery en Caracas</b>.</li><li><b>Encuentro pautado en Galerías Prados del Este</b>, sin costo.</li></ul>La zona de referencia para las entregas es ${esc(Z.zonaBase ?? "Manzanares, Caracas")}.`,
        botones: [B.pedido, B.wa("Coordinar entrega")],
      }),
    },
    {
      si: (n) => tiene(n, "cuando llega", "cuanto tarda", "cuanto demora", "demora", "tiempo de entrega", "hoy mismo", "mismo dia", "para hoy", "manana"),
      r: () => ({ html: `Todas las tallas en inventario son de <b>entrega inmediata</b>; el día y la hora exactos se coordinan por WhatsApp al confirmar tu pedido.<br><br>${politicaBs()}<br><br>${politicaEfectivo()}`, botones: [B.wa("Coordinar entrega"), B.pedido] }),
    },
    {
      si: (n) => tiene(n, "horario", "a que hora", "que hora", "abren", "cierran", "atienden"),
      r: () => derivar("Yo respondo las 24 horas, todos los días. El horario de entregas no lo tengo registrado."),
    },
    {
      si: (n) => tiene(n, "quedan", "queda ", "disponib", "stock", "existencia", "inventario", "agotad", /\bhay\b/, "tienen"),
      r: (n) => {
        const t = detectarTalla(n);
        const p = t && porTalla(t);
        if (p) return { html: `De la <b>Talla ${esc(p.sigla)}</b> (${esc(p.descripcionCorta.replace(/^Paquete de /, ""))}) ${textoStock(p)}. ${queda(p) === 0 ? "" : `Cuesta ${precio(p.precio)} en divisa.`}`, botones: queda(p) === 0 ? [B.wa("Avísenme cuando llegue")] : [{ href: `producto.html?id=${encodeURIComponent(p.id)}`, label: `Ver Talla ${p.sigla}` }] };
        return { html: `Esto es lo que hay ahora mismo:<ul>${prods.map((x) => `<li><b>Talla ${esc(x.sigla)}</b> (${esc(x.descripcionCorta.replace(/^Paquete de /, ""))}): ${textoStock(x)}</li>`).join("")}</ul>Quedan pocas unidades, así que conviene asegurar tu pedido.`, botones: [B.pedido] };
      },
    },
    {
      si: (n) => tiene(n, "precio", "cuanto", "cuesta", "vale", "costo", "valor", "$", "barato", "economico"),
      r: (n) => {
        const p = porTalla(detectarTalla(n) ?? "");
        return p
          ? { html: `${lineaPrecio(p)}.<br>${notaTasa()}`, botones: [{ href: `producto.html?id=${encodeURIComponent(p.id)}`, label: `Ver Talla ${p.sigla}` }] }
          : { html: `Estos son los precios por paquete:${listaPrecios()}${notaTasa()}<br><br>El precio en divisa aplica para efectivo, Binance y Zinli.`, botones: [B.pedido] };
      },
    },
    {
      si: (n) => tiene(n, "talla", "tamano", "medida", "mide", "dimension", " cm", "centimetro", "cual me recomiendas", "cual necesito", "cual me sirve", "cual compro", "que talla", "raza", "perro grande", "perro pequeno", "cachorro"),
      r: () => ({
        html: `Tenemos tres tallas; la diferencia es el tamaño de cada pad y cuántos trae el paquete:<ul>${prods.map((p) => `<li><b>Talla ${esc(p.sigla)}</b>: ${esc(p.descripcionCorta.replace(/^Paquete de /, ""))}</li>`).join("")}</ul>Como guía: mientras más grande el pad, más área cubre. La <b>XL</b> va mejor para perros grandes o cachorros que crecen rápido; la <b>M</b> y la <b>L</b> para perros pequeños y medianos.`,
        botones: [B.catalogo, B.sala],
      }),
    },
    {
      si: (n) => tiene(n, "cuantos pads", "cuantas unidades", "cuantos trae", "cuantos vienen", "que trae", "paquete de", "cuantos son"),
      r: () => ({ html: `Cada paquete trae:<ul>${prods.map((p) => `<li><b>Talla ${esc(p.sigla)}</b>: ${esc(p.descripcionCorta.replace(/^Paquete de /, ""))}</li>`).join("")}</ul>`, botones: [B.catalogo] }),
    },
    {
      si: (n) => tiene(n, "gato", "conejo", "hamster", "ave ", "humano", "adulto mayor", "bebe"),
      r: () => derivar("Nuestros training pads están pensados para el entrenamiento de perros; para otro uso no te puedo dar una recomendación segura."),
    },
    {
      si: (n) => tiene(n, "que es", "que son", "para que sirve", "training pad", "pad", "absorb", "olor", "como se usa", "como funciona", "calidad", "material", "marca", "mascotiland", "sirven", "tapete", "panal"),
      r: () => ({
        html: `Los <b>training pads</b> son tapetes absorbentes para que tu perro haga sus necesidades en un lugar fijo de la casa. Son súper absorbentes y ayudan a controlar los olores. Sirven sobre todo para:<ul><li>Entrenamiento de cachorros.</li><li>Perros que viven en apartamento.</li><li>Perros senior.</li></ul>Los nuestros son marca <b>Mascotiland</b>, en tallas M, L y XL.`,
        botones: [B.catalogo, B.sala],
      }),
    },
    {
      si: (n) => tiene(n, "al mayor", "mayorista", "por bulto", "por caja", "descuento", "promocion", "promo", "oferta", "rebaja", "cupon"),
      r: () => ({ html: `La promoción vigente es <b>delivery gratis en Caracas a partir de ${P.deliveryGratisDesde} paquetes</b>. Para precios al mayor u otras ofertas tendrías que consultarlo directamente.`, botones: [B.wa("Consultar por WhatsApp"), B.pedido] }),
    },
    {
      si: (n) => tiene(n, "como compro", "como pido", "como hago", "como es el proceso", "comprar", "pedir", "pedido", "ordenar", "encargar", "quiero uno", "quiero un", "quiero dos", "quiero 2", "lo quiero", "me interesa", "carrito", "metodos de pago", "formas de pago", "como pago", "como se paga", "aceptan", "pagar", "pago"),
      r: (n) =>
        tiene(n, "pago", "pagar", "aceptan")
          ? { html: `Puedes pagar así:<ul><li><b>Bolívares</b> por pago móvil, a tasa BCV (tienen prioridad).</li><li><b>Dólares</b>: divisa en efectivo, Binance o Zinli.</li></ul>${politicaEfectivo()}`, botones: [B.pedido, B.wa("Confirmar por WhatsApp")] }
          : { html: `Es rápido y lo haces desde aquí mismo:<ol><li>Entra al catálogo y elige tu talla.</li><li>Añádela al carrito y pulsa <b>Finalizar pedido</b>.</li><li>Pon tus datos, elige entrega y forma de pago.</li><li>Se abre WhatsApp con tu pedido ya escrito: solo pulsas <b>Enviar</b>.</li></ol>Con ${P.deliveryGratisDesde} paquetes el delivery en Caracas te sale gratis.`, botones: [B.pedido] },
    },
    {
      si: (n) => tiene(n, "instagram", "redes", "facebook", "tiktok", "ig "),
      r: () => ({ html: `Estamos en Instagram como <b>@${esc(CONFIG.instagram.usuario)}</b>. Ahí publicamos novedades y llegadas de inventario.`, botones: [{ href: CONFIG.instagram.url, label: "Abrir Instagram", ext: true }] }),
    },
    {
      si: (n) => tiene(n, "quien eres", "que eres", "eres un bot", "eres humano", "eres una persona", "robot", "inteligencia artificial", "zeus", "como te llamas", "tu nombre"),
      r: () => ({ html: `Soy <b>Zeus</b> 🐶, el asistente virtual de ${esc(CONFIG.marca.nombre)}. Estoy aquí las 24 horas para ayudarte con tallas, precios, pagos, entregas y tu pedido.` }),
    },
    {
      si: (n) => tiene(n, "gracias", "perfecto", "genial", "excelente", "listo", /^ok/, "vale", "chevere", "fino"),
      r: () => ({ html: "¡Con gusto! 🐾 Si quieres, te dejo listo el camino para hacer tu pedido.", botones: [B.pedido] }),
    },
    {
      si: (n) => tiene(n, "hola", "buenas", "buenos dias", "buen dia", "saludos", "que tal", "hey", "epa", "holi"),
      r: () => ({ html: "¡Hola! 🐶 Soy Zeus. Cuéntame qué necesitas saber de nuestros training pads: tallas, precios, delivery, pagos o cómo pedir." }),
    },
    {
      si: (n) => tiene(n, "adios", "chao", "hasta luego", "nos vemos", "bye"),
      r: () => ({ html: "¡Hasta pronto! 🐾 Aquí estaré cuando quieras hacer tu pedido." }),
    },
  ];

  function responder(texto) {
    const n = ` ${normalizar(texto)} `.replace(/[¿?¡!.,;:()]/g, " ").replace(/\s+/g, " ");
    const it = INTENCIONES.find((i) => i.si(n));
    return it ? it.r(n) : derivar("Esa pregunta no la tengo registrada y no quiero darte un dato equivocado.");
  }

  /* ---------- interfaz ---------- */
  root.innerHTML = `
    <section class="zeus" aria-label="Asistente virtual Zeus">
      <header class="zeus__head">
        <img src="${esc(AVATAR)}" alt="" width="52" height="52">
        <div><strong>Zeus</strong><span><i></i> Asistente virtual · en línea 24/7</span></div>
      </header>
      <div class="zeus__log" id="zeus-log" role="log" aria-live="polite" tabindex="0"></div>
      <div class="zeus__chips" id="zeus-chips">
        ${["Precios", "Tallas y medidas", "Delivery", "Formas de pago", "¿Cuántos quedan?", "Cómo comprar"].map((c) => `<button type="button" data-chip="${esc(c)}">${esc(c)}</button>`).join("")}
      </div>
      <form class="zeus__form" id="zeus-form" autocomplete="off">
        <label class="sr-only" for="zeus-in">Escribe tu pregunta</label>
        <input id="zeus-in" type="text" maxlength="300" placeholder="Pregúntame lo que quieras…" enterkeyhint="send">
        <button type="submit" aria-label="Enviar pregunta">${ico.flecha}</button>
      </form>
    </section>`;
  const log = $("#zeus-log", root);
  const htmlBotones = (bs = []) =>
    bs.length
      ? `<div class="zeus__btns">${bs.map((b) => (b.wa ? `<a class="zeus__btn zeus__btn--wa" data-zeus-wa href="#" target="_blank" rel="noopener">${ico.whatsapp} ${esc(b.label)}</a>` : `<a class="zeus__btn" href="${esc(b.href)}"${b.ext ? ' target="_blank" rel="noopener"' : ""}>${esc(b.label)}</a>`)).join("")}</div>`
      : "";
  function pintar(m) {
    const el = document.createElement("div");
    el.className = `zeus__msg zeus__msg--${m.de}`;
    el.innerHTML = m.de === "yo" ? esc(m.plano) : `<img src="${esc(AVATAR)}" alt="" width="30" height="30"><div class="zeus__bub">${m.html}${htmlBotones(m.botones)}</div>`;
    log.append(el);
    log.scrollTop = log.scrollHeight;
  }
  const aPlano = (html) => {
    const d = document.createElement("div");
    d.innerHTML = html.replace(/<ul>|<ol>/g, "\n").replace(/<li>/g, "• ").replace(/<\/li>|<br\s*\/?>|<\/ul>|<\/ol>|<\/p>/g, "\n");
    return d.textContent.replace(/\n{2,}/g, "\n").trim();
  };
  function decir(resp) {
    const m = { de: "zeus", html: resp.html, botones: resp.botones ?? [], plano: aPlano(resp.html) };
    historial.push(m);
    guardar();
    pintar(m);
  }
  function preguntar(texto) {
    texto = texto.trim();
    if (!texto) return;
    const m = { de: "yo", plano: texto.slice(0, 300) };
    historial.push(m);
    guardar();
    pintar(m);
    const espera = document.createElement("div");
    espera.className = "zeus__msg zeus__msg--zeus zeus__typing";
    espera.innerHTML = `<img src="${esc(AVATAR)}" alt="" width="30" height="30"><div class="zeus__bub"><i></i><i></i><i></i></div>`;
    log.append(espera);
    log.scrollTop = log.scrollHeight;
    setTimeout(() => {
      espera.remove();
      decir(responder(texto));
    }, 550);
  }

  if (historial.length) historial.forEach(pintar);
  else decir({ html: `¡Hola! 🐶 Soy <b>Zeus</b>, el asistente de ${esc(CONFIG.marca.nombre)}. Pregúntame lo que quieras sobre nuestros training pads: tallas, precios, delivery, pagos o cómo hacer tu pedido.` });

  $("#zeus-form", root).addEventListener("submit", (e) => {
    e.preventDefault();
    const inp = $("#zeus-in", root);
    preguntar(inp.value);
    inp.value = "";
  });
  root.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-chip]");
    if (chip) return preguntar(chip.dataset.chip);
    const wa = e.target.closest("[data-zeus-wa]");
    if (wa) wa.href = enlaceConChat(); // se arma al pulsar, con el chat completo hasta ese momento
  });
}
