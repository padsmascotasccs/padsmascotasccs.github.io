/* Página de pedido: resumen, datos del comprador y envío por WhatsApp. */
import { CONFIG, esc, $, ico, precio, carrito, resumenCarrito, enlaceWhatsApp } from "./core.js";
import { iniciarLayout, lineaHTML, observarReveal } from "./layout.js";

document.body.classList.add("no-drawer");
const cat = await iniciarLayout("");
const root = $("#pedido");
const CLAVE_DATOS = "tienda_comprador_v1";
let confirmado = false;
const PAGOS = CONFIG.pedido.opcionesPago ?? [];
let pago = PAGOS[0] ?? null;
const campoPago = () => pago?.campo ?? "precio";

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
  L.push(`*Total:* ${precio(pd.subtotal)}${pd.sinPrecio ? ` (+ ${pd.sinPrecio} producto${pd.sinPrecio > 1 ? "s" : ""} a consultar)` : ""}`);
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
  if (!caja) return;
  if (!r.lineas.length) return pintarVacio();
  caja.innerHTML = `
    <h2>Resumen del pedido</h2>
    <ul class="lines">${r.lineas.map((l) => lineaHTML(l)).join("")}</ul>
    <div class="sum"><span>Subtotal (${r.unidades} ud.)</span><strong>${precio(r.subtotal)}</strong></div>
    ${r.sinPrecio ? `<p class="sum__note">+ ${r.sinPrecio} producto${r.sinPrecio > 1 ? "s" : ""} con precio a consultar.</p>` : ""}
    <div class="sum sum--total"><span>Total</span><strong>${precio(r.subtotal)}</strong></div>
    ${pago ? `<p class="sum__note">Pago: ${esc(pago.etiqueta)}.</p>` : ""}
    ${
      desde
        ? r.unidades >= desde
          ? `<p class="sum__ok">${ico.check} Tu pedido califica para delivery gratis en Caracas.</p>`
          : `<p class="sum__note">Añade ${desde - r.unidades} paquete más y el delivery en Caracas es gratis. Con menos, el costo del delivery se acuerda por WhatsApp.</p>`
        : `<p class="sum__note">El costo de envío, si aplica, se acuerda por WhatsApp.</p>`
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
  pintarResumen();

  const form = $("#form");
  const error = (campo, mostrar) => {
    $(`#e-${campo}`).hidden = !mostrar;
    $(`#${campo}`).setAttribute("aria-invalid", mostrar);
  };
  form.addEventListener("input", (e) => e.target.id && $(`#e-${e.target.id}`) && error(e.target.id, false));
  form.addEventListener("change", (e) => {
    if (e.target.name !== "pago") return;
    pago = PAGOS.find((o) => o.id === e.target.value) ?? pago;
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
    const pedido = { ref: referencia(), cliente, pago, ...r, fecha: new Date().toISOString() };
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
      <div class="summary done__sum">
        <h3>Lo que pediste</h3>
        <ul class="lines">${pd.lineas.map((l) => lineaHTML(l, false)).join("")}</ul>
        <div class="sum sum--total"><span>Total</span><strong>${precio(pd.subtotal)}</strong></div>
        ${pd.pago ? `<p class="sum__note">Pago: ${esc(pd.pago.etiqueta)}.</p>` : ""}
        ${pd.sinPrecio ? `<p class="sum__note">+ ${pd.sinPrecio} producto${pd.sinPrecio > 1 ? "s" : ""} con precio a consultar.</p>` : ""}
      </div>
    </div>`;
  scrollTo({ top: 0, behavior: "smooth" });
}

if (resumenCarrito(cat).lineas.length) {
  pintarFormulario();
  carrito.suscribir(() => !confirmado && pintarResumen());
} else pintarVacio();
observarReveal();
