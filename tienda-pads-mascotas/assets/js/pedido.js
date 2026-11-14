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

  const error = (campo, mostrar) => {
    $(`#e-${campo}`).hidden = !mostrar;
    $(`#${campo}`).setAttribute("aria-invalid", mostrar);
  };
  form.addEventListener("input", (e) => e.target.id && $(`#e-${e.target.id}`) && error(e.target.id, false));
  form.addEventListener("change", (e) => {
    if (e.target.name === "entrega") entrega = e.target.value;
    else if (e.target.name === "pago") pago = PAGOS.find((o) => o.id === e.target.value) ?? pago;
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
    const pedido = { ref: referencia(), cliente, pago, tasa, ...r, ...env, total: r.subtotal + env.envio, fecha: new Date().toISOString() };
    const res = CANALES.whatsapp.enviar(pedido);
    try {
      const { notas, ...recordar } = cliente;
      localStorage.setItem(CLAVE_DATOS, JSON.stringify(recordar));
    } catch {}
    pintarConfirmacion(pedido, res.url);
    carrito.vaciar();
  });
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
      <div class="pm__comp">
        <h4>Envía tu comprobante</h4>
        <p class="sum__note">Después de pagar, adjunta la captura o el PDF del comprobante.</p>
        <label class="pm__file">
          <input type="file" id="comprobante" accept="image/*,application/pdf">
          <span id="comp-nombre">${ico.imagen} Elegir foto o archivo</span>
        </label>
        <button type="button" class="btn btn--wa btn--block" id="comp-enviar" disabled>${ico.whatsapp} Enviar comprobante por WhatsApp</button>
        <p class="sum__note" id="comp-ayuda" role="status" aria-live="polite"></p>
      </div>
    </section>`;
}

function activarPagoMovil(pd) {
  const entrada = $("#comprobante");
  const boton = $("#comp-enviar");
  const ayuda = $("#comp-ayuda");
  const texto = `Comprobante de pago móvil — Pedido ${pd.ref} — ${pd.cliente.nombre}`;
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
    ayuda.innerHTML = `Este navegador no permite enviar el archivo desde aquí. <a href="${esc(enlaceWhatsApp(`Hola, envío el comprobante de pago móvil del pedido ${pd.ref}.`))}" target="_blank" rel="noopener">Abre nuestro chat de WhatsApp</a> y adjúntalo con el clip.`;
  });
}

if (resumenCarrito(cat).lineas.length) {
  pintarFormulario();
  carrito.suscribir(() => !confirmado && pintarResumen());
} else pintarVacio();
observarReveal();
