/* Página de pedido: resumen, datos del comprador y envío por WhatsApp. */
import { CONFIG, esc, $, ico, precio, carrito, resumenCarrito, enlaceWhatsApp, tasaBCV, bolivares, montoBs, textoTasa } from "./core.js";
import { iniciarLayout, lineaHTML, observarReveal } from "./layout.js";

document.body.classList.add("no-drawer");
const cat = await iniciarLayout("");
const root = $("#pedido");
const CLAVE_DATOS = "tienda_comprador_v1";
let confirmado = false;
const PAGOS = CONFIG.pedido.opcionesPago ?? [];
let pago = PAGOS[0] ?? null;
const campoPago = () => pago?.campo ?? "precio";
/* Entrega elegida y costo del delivery: se cobra solo si se elige delivery y
   el pedido no llega a la cantidad de paquetes para que sea gratis. */
let entrega = CONFIG.pedido.opcionesEntrega[0] ?? "";
function costoEnvio(unidades) {
  const { costoDelivery = 0, deliveryGratisDesde = 0, opcionDelivery } = CONFIG.pedido;
  const esDelivery = opcionDelivery ? entrega === opcionDelivery : true;
  if (!esDelivery) return { esDelivery, envio: 0, gratis: false };
  const gratis = deliveryGratisDesde > 0 && unidades >= deliveryGratisDesde;
  return { esDelivery, envio: gratis ? 0 : Number(costoDelivery) || 0, gratis };
}
/* La tasa se pide al abrir la página para tenerla lista al enviar el pedido. */
let tasa = null;
tasaBCV().then((t) => {
  tasa = t;
  if (!confirmado) pintarResumen();
});

/* ---------------------------------------------------------------------------
   CANALES DE PEDIDO
   Hoy solo existe WhatsApp. Para añadir pagos online más adelante, agrega aquí
   otro canal (p. ej. "tarjeta") con su propia función enviar(pedido), que
   reciba el mismo objeto `pedido` y devuelva { ok, url? }. El formulario y el
   resumen no necesitan cambios.
   --------------------------------------------------------------------------- */
const CANALES = {
  whatsapp: {
    etiqueta: "Enviar pedido por WhatsApp",
    enviar(pedido) {
      const url = enlaceWhatsApp(mensajePedido(pedido));
      window.open(url, "_blank", "noopener");
      return { ok: true, url };
    },
  },
};

export function mensajePedido(pd) {
  const L = [];
  L.push(`*Nuevo pedido — ${CONFIG.marca.nombre}*`);
  L.push(`Ref.: ${pd.ref}`);
  L.push("");
  L.push(`*Cliente:* ${pd.cliente.nombre}`);
  if (pd.cliente.telefono) L.push(`*Teléfono:* ${pd.cliente.telefono}`);
  if (pd.cliente.entrega) L.push(`*Entrega:* ${pd.cliente.entrega}`);
  if (pd.cliente.direccion) L.push(`*Zona / dirección:* ${pd.cliente.direccion}`);
  if (pd.cliente.ubicacion) L.push(`*Ubicación exacta (confirmada):* ${pd.cliente.ubicacion}`);
  if (pd.pago) L.push(`*Pago:* ${pd.pago.etiqueta}`);
  L.push("");
  L.push("*Productos:*");
  pd.lineas.forEach((l) => {
    L.push(
      l.importe != null
        ? `• ${l.cant} × ${l.producto.nombre} — ${precio(l.unit)} c/u = ${precio(l.importe)}`
        : `• ${l.cant} × ${l.producto.nombre} — precio a consultar`
    );
  });
  L.push("");
  if (pd.esDelivery) L.push(`*Delivery:* ${pd.envio ? precio(pd.envio) : pd.gratis ? "gratis" : "a convenir"}`);
  L.push(`*Total:* ${precio(pd.total)}${pd.sinPrecio ? ` (+ ${pd.sinPrecio} producto${pd.sinPrecio > 1 ? "s" : ""} a consultar)` : ""}`);
  if (pd.pago?.pagoMovil && pd.tasa) L.push(`*Total en Bs:* ${bolivares(pd.total, pd.tasa)} (${textoTasa(pd.tasa)})`);
  if (pd.cliente.notas) {
    L.push("");
    L.push(`*Notas:* ${pd.cliente.notas}`);
  }
  return L.join("\n");
}

/* Anota el pedido en la hoja de Google (si está conectada en data/config.js).
   No bloquea ni interrumpe la compra si la hoja no responde. */
function registrarPedido(pd) {
  const url = CONFIG.registro?.url;
  if (!url) return;
  const fila = {
    fecha: new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" }),
    referencia: pd.ref,
    nombre: pd.cliente.nombre,
    telefono: pd.cliente.telefono || "",
    entrega: pd.cliente.entrega || "",
    direccion: [pd.cliente.direccion, pd.cliente.ubicacion && `Ubicación: ${pd.cliente.ubicacion}`].filter(Boolean).join(" · "),
    pago: pd.pago?.etiqueta || "",
    productos: pd.lineas.map((l) => `${l.cant} × ${l.producto.nombre}`).join("; "),
    paquetes: pd.unidades,
    subtotal: pd.subtotal,
    delivery: pd.envio,
    total: pd.total,
    tasa: pd.tasa?.valor ?? "",
    totalBs: pd.tasa && pd.pago?.pagoMovil ? montoBs(pd.total, pd.tasa) : "",
    notas: pd.cliente.notas || "",
  };
  try {
    fetch(url, { method: "POST", mode: "no-cors", keepalive: true, headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(fila) }).catch(() => {});
  } catch {}
}

function referencia() {
  const d = new Date();
  const f = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${CONFIG.pedido.prefijo}-${f}-${r}`;
}

function datosGuardados() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_DATOS) || "{}");
  } catch {
    return {};
  }
}

function pintarVacio() {
  root.innerHTML = `
    <div class="empty empty--wide">
      <span class="empty__ico">${ico.bolsa}</span>
      <p class="empty__t">Aún no hay productos en tu pedido</p>
      <p>Añade productos desde el catálogo y vuelve aquí para enviarlo.</p>
      <a class="btn btn--primary" href="catalogo.html">Ver catálogo ${ico.flecha}</a>
    </div>`;
}

function pintarResumen() {
  const r = resumenCarrito(cat, campoPago());
  const caja = $("#resumen");
  const desde = CONFIG.pedido.deliveryGratisDesde;
  const env = costoEnvio(r.unidades);
  const total = r.subtotal + env.envio;
  if (!caja) return;
  if (!r.lineas.length) return pintarVacio();
  caja.innerHTML = `
    <h2>Resumen del pedido</h2>
    <ul class="lines">${r.lineas.map((l) => lineaHTML(l)).join("")}</ul>
    <div class="sum"><span>Subtotal (${r.unidades} ud.)</span><strong>${precio(r.subtotal)}</strong></div>
    ${r.sinPrecio ? `<p class="sum__note">+ ${r.sinPrecio} producto${r.sinPrecio > 1 ? "s" : ""} con precio a consultar.</p>` : ""}
    ${env.esDelivery ? `<div class="sum sum--line"><span>Delivery en Caracas</span><strong>${env.envio ? precio(env.envio) : env.gratis ? "Gratis" : "A convenir"}</strong></div>` : `<div class="sum sum--line"><span>Encuentro pautado</span><strong>Sin costo</strong></div>`}
    <div class="sum sum--total"><span>Total</span><strong>${precio(total)}</strong></div>
    ${pago?.pagoMovil && tasa ? `<div class="sum sum--bs"><span>En bolívares</span><strong>${bolivares(total, tasa)}</strong></div><p class="sum__note">Calculado con la ${textoTasa(tasa)}.</p>` : ""}
    ${pago?.pagoMovil && !tasa ? `<p class="sum__note">El monto en bolívares se calcula con la tasa BCV del día; te lo confirmamos por WhatsApp.</p>` : ""}
    ${pago ? `<p class="sum__note">Pago: ${esc(pago.etiqueta)}.</p>` : ""}
    ${
      !env.esDelivery
        ? ""
        : env.gratis
          ? `<p class="sum__ok">${ico.check} Tu pedido califica para delivery gratis en Caracas.</p>`
          : desde
            ? `<p class="sum__note">Añade ${desde - r.unidades} paquete más y el delivery en Caracas te sale gratis.</p>`
            : ""
    }`;
}

function pintarFormulario() {
  const g = datosGuardados();
  const opciones = CONFIG.pedido.opcionesEntrega;
  root.innerHTML = `
    <div class="checkout">
      <form class="form reveal" id="form" novalidate>
        <h2>Tus datos</h2>
        <div class="field">
          <label for="nombre">Nombre y apellido <span aria-hidden="true">*</span></label>
          <input id="nombre" name="nombre" type="text" autocomplete="name" required maxlength="80" value="${esc(g.nombre)}" aria-describedby="e-nombre">
          <p class="field__err" id="e-nombre" hidden>Escribe tu nombre para identificar el pedido.</p>
        </div>
        <div class="field">
          <label for="telefono">Teléfono de contacto <small>(opcional)</small></label>
          <input id="telefono" name="telefono" type="tel" autocomplete="tel" inputmode="tel" maxlength="30" value="${esc(g.telefono)}" aria-describedby="e-telefono">
          <p class="field__err" id="e-telefono" hidden>Revisa el número: solo dígitos, espacios, + y guiones.</p>
        </div>
        ${
          opciones.length
            ? `<fieldset class="field">
                 <legend>Entrega</legend>
                 <div class="options">${opciones.map((o, i) => `<label class="option"><input type="radio" name="entrega" value="${esc(o)}"${(g.entrega ? g.entrega === o : i === 0) ? " checked" : ""}><span>${esc(o)}</span></label>`).join("")}</div>
               </fieldset>`
            : ""
        }
        ${
          PAGOS.length
            ? `<fieldset class="field">
                 <legend>Forma de pago</legend>
                 <div class="options">${PAGOS.map((o) => `<label class="option"><input type="radio" name="pago" value="${esc(o.id)}"${o.id === pago.id ? " checked" : ""}><span>${esc(o.etiqueta)}</span></label>`).join("")}</div>
               </fieldset>`
            : ""
        }
        <div class="field">
          <label for="direccion">Zona o dirección de entrega <small>(opcional)</small></label>
          <input id="direccion" name="direccion" type="text" autocomplete="street-address" maxlength="160" value="${esc(g.direccion)}">
        </div>
        <fieldset class="field ubic" id="ubic" hidden>
          <legend>Ubicación exacta para el delivery <span aria-hidden="true">*</span></legend>
          <p class="ubic__ayuda">Marca en el mapa el punto exacto donde recibes el pedido: usa tu ubicación o toca el mapa, y arrastra el pin hasta tu puerta.</p>
          <button type="button" class="btn btn--ghost btn--block" id="ubic-gps">📍 Usar mi ubicación actual</button>
          <div class="ubic__mapa" id="ubic-mapa" role="application" aria-label="Mapa para marcar tu ubicación"></div>
          <p class="ubic__estado" id="ubic-estado" role="status" aria-live="polite">Todavía no has marcado tu ubicación.</p>
          <label class="ubic__ok"><input type="checkbox" id="ubic-confirma" disabled> <span>Sí, esta es mi ubicación exacta</span></label>
          <p class="field__err" id="e-ubic" hidden>Marca tu ubicación en el mapa y confírmala para poder enviarte el delivery.</p>
        </fieldset>
        <div class="field">
          <label for="notas">Notas para tu pedido <small>(opcional)</small></label>
          <textarea id="notas" name="notas" rows="3" maxlength="500" placeholder="Colores, medidas, horario de entrega, dudas…"></textarea>
        </div>
        <button class="btn btn--wa btn--lg btn--block" type="submit">${ico.whatsapp} ${CANALES.whatsapp.etiqueta}</button>
        <p class="form__note">Al enviar se abrirá WhatsApp con tu pedido ya escrito. Solo tienes que pulsar «Enviar» en el chat.</p>
      </form>
      <aside class="summary reveal" id="resumen" aria-label="Resumen del pedido"></aside>
    </div>`;
  const form = $("#form");
  entrega = form.querySelector("input[name=entrega]:checked")?.value ?? entrega;
  pintarResumen();
  const ubic = montarUbicacion();
  ubic.mostrar(costoEnvio(0).esDelivery);

  const error = (campo, mostrar) => {
    $(`#e-${campo}`).hidden = !mostrar;
    $(`#${campo}`).setAttribute("aria-invalid", mostrar);
  };
  form.addEventListener("input", (e) => e.target.id && $(`#e-${e.target.id}`) && error(e.target.id, false));
  form.addEventListener("change", (e) => {
    if (e.target.name === "entrega") {
      entrega = e.target.value;
      ubic.mostrar(costoEnvio(0).esDelivery);
    } else if (e.target.name === "pago") pago = PAGOS.find((o) => o.id === e.target.value) ?? pago;
    else return;
    pintarResumen();
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const cliente = Object.fromEntries([...fd].map(([k, v]) => [k, String(v).trim()]));
    const okNombre = cliente.nombre.length >= 2;
    const okTel = !cliente.telefono || /^[\d\s()+-]{7,}$/.test(cliente.telefono);
    error("nombre", !okNombre);
    error("telefono", !okTel);
    if (!okNombre || !okTel) return $(okNombre ? "#telefono" : "#nombre").focus();

    delete cliente.pago;
    const r = resumenCarrito(cat, campoPago());
    if (!r.lineas.length) return pintarVacio();
    if (cliente.entrega) entrega = cliente.entrega;
    const env = costoEnvio(r.unidades);
    if (env.esDelivery) {
      const punto = ubic.valor();
      $("#e-ubic").hidden = !!punto;
      if (!punto) return $("#ubic").scrollIntoView({ behavior: "smooth", block: "center" });
      cliente.ubicacion = punto;
    }
    const pedido = { ref: referencia(), cliente, pago, tasa, ...r, ...env, total: r.subtotal + env.envio, fecha: new Date().toISOString() };
    const res = CANALES.whatsapp.enviar(pedido);
    registrarPedido(pedido);
    try {
      const { notas, ubicacion, ...recordar } = cliente; // la ubicación no se guarda en el navegador
      localStorage.setItem(CLAVE_DATOS, JSON.stringify(recordar));
    } catch {}
    pintarConfirmacion(pedido, res.url);
    carrito.vaciar();
  });
}

/* ---------------------------------------------------------------------------
   UBICACIÓN EXACTA (solo para delivery)
   Mapa de OpenStreetMap con Leaflet (gratis, sin clave). El cliente usa su GPS
   o toca el mapa, ajusta el pin y confirma. Se envía como enlace de Google Maps.
   --------------------------------------------------------------------------- */
const CARACAS = [10.4806, -66.9036];
let cargaLeaflet;
function cargarLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  cargaLeaflet ??= new Promise((ok, mal) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.append(css);
    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onload = () => ok(window.L);
    s.onerror = () => mal(new Error("No se pudo cargar el mapa"));
    document.head.append(s);
  });
  return cargaLeaflet;
}

function montarUbicacion() {
  const caja = $("#ubic");
  const estado = $("#ubic-estado");
  const confirma = $("#ubic-confirma");
  let mapa, pin, punto = null;

  const enlace = () => (punto ? `https://maps.google.com/?q=${punto.lat.toFixed(6)},${punto.lng.toFixed(6)}` : null);
  function fijar(latlng, zoom) {
    punto = latlng;
    if (!pin) {
      pin = window.L.marker(latlng, { draggable: true, autoPan: true }).addTo(mapa);
      pin.on("dragend", () => fijar(pin.getLatLng()));
    } else pin.setLatLng(latlng);
    if (zoom) mapa.setView(latlng, zoom);
    confirma.disabled = false;
    confirma.checked = false;
    estado.innerHTML = `Pin marcado. Revisa que esté justo en tu puerta y confírmalo. <a href="${esc(enlace())}" target="_blank" rel="noopener">Ver en Google Maps</a>`;
    $("#e-ubic").hidden = true;
  }

  async function iniciarMapa() {
    if (mapa) return mapa.invalidateSize();
    try {
      const L = await cargarLeaflet();
      mapa = L.map("ubic-mapa", { scrollWheelZoom: false }).setView(CARACAS, 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(mapa);
      mapa.on("click", (e) => fijar(e.latlng));
      setTimeout(() => mapa.invalidateSize(), 200);
    } catch {
      estado.textContent = "No se pudo cargar el mapa. Escribe tu dirección y te la pediremos por WhatsApp.";
    }
  }

  $("#ubic-gps").addEventListener("click", async () => {
    await iniciarMapa();
    if (!mapa) return;
    if (!navigator.geolocation) return (estado.textContent = "Tu navegador no permite usar el GPS. Toca el mapa para marcar tu ubicación.");
    estado.textContent = "Buscando tu ubicación…";
    navigator.geolocation.getCurrentPosition(
      (p) => fijar(window.L.latLng(p.coords.latitude, p.coords.longitude), 18),
      () => (estado.textContent = "No pudimos obtener tu ubicación (revisa el permiso del GPS). Toca el mapa para marcarla."),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
  confirma.addEventListener("change", () => confirma.checked && ($("#e-ubic").hidden = true));

  return {
    mostrar(si) {
      caja.hidden = !si;
      if (si) iniciarMapa();
    },
    valor: () => (punto && confirma.checked ? enlace() : null),
  };
}

function pintarConfirmacion(pd, url) {
  confirmado = true;
  root.innerHTML = `
    <div class="done">
      <span class="done__ico">${ico.check}</span>
      <p class="eyebrow">Pedido ${esc(pd.ref)}</p>
      <h2>¡Casi listo, ${esc(pd.cliente.nombre.split(" ")[0])}!</h2>
      <p class="done__lead">Abrimos WhatsApp con tu pedido ya escrito. <strong>Pulsa «Enviar» en el chat</strong> para que lo recibamos y te confirmemos disponibilidad y entrega.</p>
      <div class="done__cta">
        <a class="btn btn--wa btn--lg" href="${esc(url)}" target="_blank" rel="noopener">${ico.whatsapp} ¿No se abrió? Abrir WhatsApp</a>
        <a class="btn btn--ghost btn--lg" href="catalogo.html">Seguir viendo el catálogo</a>
      </div>
      ${pd.pago?.pagoMovil ? bloquePagoMovil(pd) : ""}
      ${pd.pago?.binance ? bloqueBinance(pd) : ""}
      <div class="summary done__sum">
        <h3>Lo que pediste</h3>
        <ul class="lines">${pd.lineas.map((l) => lineaHTML(l, false)).join("")}</ul>
        ${pd.esDelivery ? `<div class="sum sum--line"><span>Delivery en Caracas</span><strong>${pd.envio ? precio(pd.envio) : pd.gratis ? "Gratis" : "A convenir"}</strong></div>` : ""}
        <div class="sum sum--total"><span>Total</span><strong>${precio(pd.total)}</strong></div>
        ${pd.pago?.pagoMovil && pd.tasa ? `<div class="sum sum--bs"><span>En bolívares</span><strong>${bolivares(pd.total, pd.tasa)}</strong></div>` : ""}
        ${pd.pago ? `<p class="sum__note">Pago: ${esc(pd.pago.etiqueta)}.</p>` : ""}
        ${pd.sinPrecio ? `<p class="sum__note">+ ${pd.sinPrecio} producto${pd.sinPrecio > 1 ? "s" : ""} con precio a consultar.</p>` : ""}
      </div>
    </div>`;
  scrollTo({ top: 0, behavior: "smooth" });
  if (pd.pago?.pagoMovil) activarPagoMovil(pd);
  if (pd.pago?.binance) activarPagoMovil(pd, "Binance Pay");
}

/* BINANCE PAY (cuenta personal): Pay ID, monto en USDT y el código del pedido
   para la nota del pago. La verificación la hace el dueño en su app de Binance. */
function bloqueBinance(pd) {
  const bn = CONFIG.pedido.binance ?? {};
  const monto = Number(pd.total).toFixed(2);
  const filas = [
    ["Binance Pay ID", bn.payId],
    ["Usuario", bn.usuario],
    ["Nota del pago", pd.ref],
  ].filter(([, v]) => v);
  return `
    <section class="pm" aria-labelledby="t-bn">
      <h3 id="t-bn">Paga con Binance Pay</h3>
      ${bn.payId ? "" : `<p class="sum__note">Te enviaremos nuestro Binance Pay ID por WhatsApp al recibir tu pedido.</p>`}
      <dl class="pm__datos">${filas
        .map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd><button type="button" class="pm__copiar" data-copiar="${esc(v)}" aria-label="Copiar ${k.toLowerCase()}">Copiar</button></div>`)
        .join("")}</dl>
      <p class="pm__monto"><span>Monto a enviar</span><strong>${monto} USDT</strong><small>Equivale a ${precio(pd.total)}${pd.envio ? ` (incluye ${precio(pd.envio)} de delivery)` : ""}. En la app de Binance: <b>Pagar → Enviar</b>, pega el Pay ID y escribe <b>${esc(pd.ref)}</b> en la nota.</small><button type="button" class="pm__copiar" data-copiar="${monto}" aria-label="Copiar monto">Copiar monto</button></p>
      ${comprobanteHTML()}
    </section>`;
}

function comprobanteHTML() {
  return `
      <div class="pm__comp">
        <h4>Envía tu comprobante</h4>
        <p class="sum__note">Después de pagar, adjunta la captura o el PDF del comprobante.</p>
        <label class="pm__file">
          <input type="file" id="comprobante" accept="image/*,application/pdf">
          <span id="comp-nombre">${ico.imagen} Elegir foto o archivo</span>
        </label>
        <button type="button" class="btn btn--wa btn--block" id="comp-enviar" disabled>${ico.whatsapp} Enviar comprobante por WhatsApp</button>
        <p class="sum__note" id="comp-ayuda" role="status" aria-live="polite"></p>
      </div>`;
}

/* ---------------------------------------------------------------------------
   PAGO MÓVIL
   Muestra los datos para pagar (data/config.js → pedido.pagoMovil) y permite
   adjuntar el comprobante. El sitio no tiene servidor: el archivo no se sube a
   ninguna parte, se comparte desde el teléfono directamente a WhatsApp.
   --------------------------------------------------------------------------- */
function bloquePagoMovil(pd) {
  const pm = CONFIG.pedido.pagoMovil ?? {};
  const filas = [
    ["Banco", pm.banco],
    ["Teléfono", pm.telefono],
    ["Cédula / RIF", pm.documento],
    ["Titular", pm.titular],
  ].filter(([, v]) => v);
  return `
    <section class="pm" aria-labelledby="t-pm">
      <h3 id="t-pm">Paga con pago móvil</h3>
      ${
        filas.length
          ? `<dl class="pm__datos">${filas
              .map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd><button type="button" class="pm__copiar" data-copiar="${esc(v)}" aria-label="Copiar ${k.toLowerCase()}">Copiar</button></div>`)
              .join("")}</dl>`
          : `<p class="sum__note">Te enviaremos los datos del pago móvil por WhatsApp al recibir tu pedido.</p>`
      }
      ${
        pd.tasa
          ? `<p class="pm__monto"><span>Monto a pagar</span><strong>${bolivares(pd.total, pd.tasa)}</strong><small>Equivale a ${precio(pd.total)}${pd.envio ? ` (incluye ${precio(pd.envio)} de delivery)` : ""} con la ${textoTasa(pd.tasa)}.</small><button type="button" class="pm__copiar" data-copiar="${montoBs(pd.total, pd.tasa).toFixed(2).replace(".", ",")}" aria-label="Copiar monto">Copiar monto</button></p>`
          : `<p class="pm__monto"><span>Monto a pagar</span><strong>${precio(pd.total)}</strong><small>en bolívares, a la tasa BCV del día. Te confirmamos el monto exacto por WhatsApp.</small></p>`
      }
      ${comprobanteHTML()}
    </section>`;
}

function activarPagoMovil(pd, metodo = "pago móvil") {
  const entrada = $("#comprobante");
  const boton = $("#comp-enviar");
  const ayuda = $("#comp-ayuda");
  const texto = `Comprobante de ${metodo} — Pedido ${pd.ref} — ${pd.cliente.nombre}`;
  let archivo = null;

  root.addEventListener("click", async (e) => {
    const c = e.target.closest("[data-copiar]");
    if (!c) return;
    try {
      await navigator.clipboard.writeText(c.dataset.copiar);
      c.textContent = "Copiado";
      setTimeout(() => (c.textContent = "Copiar"), 1600);
    } catch {
      ayuda.textContent = "No se pudo copiar automáticamente; mantén pulsado el dato para copiarlo.";
    }
  });

  entrada.addEventListener("change", () => {
    archivo = entrada.files[0] ?? null;
    ayuda.textContent = "";
    if (archivo && archivo.size > 15 * 1024 * 1024) {
      ayuda.textContent = "El archivo pesa más de 15 MB. Elige una captura más liviana.";
      archivo = null;
    }
    $("#comp-nombre").innerHTML = archivo ? `${ico.check} ${esc(archivo.name)}` : `${ico.imagen} Elegir foto o archivo`;
    boton.disabled = !archivo;
  });

  boton.addEventListener("click", async () => {
    if (!archivo) return;
    if (navigator.canShare?.({ files: [archivo] })) {
      try {
        await navigator.share({ files: [archivo], text: texto });
        ayuda.textContent = "Listo. Si elegiste WhatsApp y nuestro chat, ya recibimos tu comprobante.";
      } catch (err) {
        if (err.name !== "AbortError") ayuda.textContent = "No se pudo compartir el archivo. Adjúntalo directamente en el chat de WhatsApp.";
      }
      return;
    }
    ayuda.innerHTML = `Este navegador no permite enviar el archivo desde aquí. <a href="${esc(enlaceWhatsApp(`Hola, envío el comprobante de ${metodo} del pedido ${pd.ref}.`))}" target="_blank" rel="noopener">Abre nuestro chat de WhatsApp</a> y adjúntalo con el clip.`;
  });
}

if (resumenCarrito(cat).lineas.length) {
  pintarFormulario();
  carrito.suscribir(() => !confirmado && pintarResumen());
} else pintarVacio();
observarReveal();
