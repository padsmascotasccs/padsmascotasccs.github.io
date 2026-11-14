/* Elementos compartidos: cabecera, pie, carrito lateral, botón de WhatsApp,
   tarjetas de producto, avisos y animaciones de aparición. */
import {
  CONFIG, esc, $, $$, ico, precio, carrito, cargarCatalogo, resumenCarrito,
  enlaceWhatsApp, nombreCategoria, sinFoto, precioBsHTML,
} from "./core.js";

const NAV = [
  { id: "catalogo", texto: "Catálogo", href: "catalogo.html" },
  { id: "3d", texto: "Modelos 3D", href: "modelos-3d.html" },
  { id: "nosotros", texto: "Nosotros", href: "index.html#nosotros" },
  { id: "instagram", texto: "Instagram", href: "index.html#instagram" },
].filter(
  (n) => n.id !== "nosotros" || CONFIG.modoDemo || CONFIG.nosotros.titulo || CONFIG.nosotros.parrafos.length
);

export function marcaHTML() {
  const { nombre, logo } = CONFIG.marca;
  if (logo) return `<img src="${esc(logo)}" alt="${esc(nombre)}" class="brand__logo">`;
  const [primera, ...resto] = nombre.split(" ");
  return `<span class="brand__word">${esc(primera)}</span>${
    resto.length ? `<span class="brand__dot" aria-hidden="true"></span><span class="brand__word brand__word--alt">${esc(resto.join(" "))}</span>` : ""
  }`;
}

/* ---------- tarjeta de producto ---------- */
export function tarjetaProducto(p, cat) {
  const [img1, img2] = p.imagenes;
  const url = `producto.html?id=${encodeURIComponent(p.id)}`;
  const media = img1
    ? `<img src="${esc(img1)}" alt="${esc(p.nombre)}" loading="lazy" decoding="async" class="card__img">` +
      (img2 ? `<img src="${esc(img2)}" alt="" loading="lazy" decoding="async" class="card__img card__img--alt">` : "")
    : sinFoto(p);
  const badges = [
    CONFIG.modoDemo ? `<span class="badge badge--demo">Ejemplo</span>` : "",
    !p.disponible ? `<span class="badge badge--off">Agotado</span>` : "",
    p.modelo3d ? `<span class="badge badge--3d">${ico.cubo} 3D</span>` : "",
  ].join("");
  return `
  <article class="card reveal${p.disponible ? "" : " is-off"}">
    <a href="${url}" class="card__media" aria-label="${esc(p.nombre)}">
      ${media}
      <span class="card__badges">${badges}</span>
    </a>
    ${
      p.disponible
        ? `<button class="card__add" type="button" data-agregar="${esc(p.id)}" aria-label="Añadir ${esc(p.nombre)} al carrito">${ico.mas}<span>Añadir</span></button>`
        : ""
    }
    <div class="card__body">
      <p class="card__cat">${esc(nombreCategoria(cat, p.categoria))}</p>
      <h3 class="card__name"><a href="${url}">${esc(p.nombre)}</a></h3>
      <p class="card__price${p.precio == null ? " is-ask" : ""}">${precio(p.precio)} ${precioBsHTML(p)}</p>
    </div>
  </article>`;
}

/* ---------- animaciones de aparición ---------- */
let observador;
export function observarReveal(root = document) {
  const els = $$(".reveal:not(.in)", root);
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    els.forEach((e) => e.classList.add("in"));
    return;
  }
  observador ??= new IntersectionObserver(
    (entradas) =>
      entradas.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          observador.unobserve(en.target);
        }
      }),
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );
  els.forEach((e, i) => {
    if (!e.style.getPropertyValue("--d")) e.style.setProperty("--d", `${(i % 4) * 70}ms`);
    observador.observe(e);
  });
  setTimeout(barrido, 1200);
}
/* Red de seguridad: si el observador no avisa, muestra lo que ya está en pantalla. */
function barrido() {
  $$(".reveal:not(.in)").forEach((e) => {
    const r = e.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) e.classList.add("in");
  });
}
let tBarrido;
addEventListener(
  "scroll",
  () => {
    clearTimeout(tBarrido);
    tBarrido = setTimeout(barrido, 150);
  },
  { passive: true }
);

/* ---------- aviso breve ---------- */
let toastT;
export function aviso(texto) {
  let t = $("#toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.className = "toast";
    t.setAttribute("role", "status");
    t.setAttribute("aria-live", "polite");
    document.body.append(t);
  }
  t.innerHTML = `${ico.check}<span>${esc(texto)}</span>`;
  t.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove("show"), 2400);
}

/* ---------- carrito lateral ---------- */
let ultimoFoco;
export function abrirCarrito() {
  ultimoFoco = document.activeElement;
  document.body.classList.add("cart-open");
  $("#drawer").setAttribute("aria-hidden", "false");
  $("#drawer").removeAttribute("inert");
  $("#drawer .drawer__close").focus();
}
export function cerrarCarrito() {
  document.body.classList.remove("cart-open");
  $("#drawer").setAttribute("aria-hidden", "true");
  $("#drawer").setAttribute("inert", "");
  ultimoFoco?.focus?.();
}

export function lineaHTML(l, editable = true) {
  const p = l.producto;
  return `
  <li class="line">
    <a class="line__img" href="producto.html?id=${encodeURIComponent(p.id)}">
      ${p.imagenes[0] ? `<img src="${esc(p.imagenes[0])}" alt="">` : p.sigla ? `<b class="line__sigla">${esc(p.sigla)}</b>` : ico.imagen}
    </a>
    <div class="line__info">
      <a class="line__name" href="producto.html?id=${encodeURIComponent(p.id)}">${esc(p.nombre)}</a>
      <span class="line__unit">${precio(l.unit)}${l.unit != null ? " c/u" : ""}</span>
      ${
        editable
          ? `<div class="qty" role="group" aria-label="Cantidad de ${esc(p.nombre)}">
              <button type="button" data-cant="${esc(p.id)}" data-delta="-1" aria-label="Restar una unidad">${ico.menos}</button>
              <output aria-live="polite">${l.cant}</output>
              <button type="button" data-cant="${esc(p.id)}" data-delta="1" aria-label="Sumar una unidad">${ico.mas}</button>
            </div>`
          : `<span class="line__unit">Cantidad: ${l.cant}</span>`
      }
    </div>
    <div class="line__end">
      <strong>${l.importe != null ? precio(l.importe) : "A consultar"}</strong>
      ${editable ? `<button type="button" class="line__del" data-quitar="${esc(p.id)}" aria-label="Eliminar ${esc(p.nombre)}">${ico.basura}</button>` : ""}
    </div>
  </li>`;
}

function pintarCarrito(cat) {
  const r = resumenCarrito(cat);
  $$("[data-cuenta]").forEach((el) => {
    el.textContent = r.unidades;
    el.hidden = r.unidades === 0;
  });
  const cuerpo = $("#drawer .drawer__body");
  const pie = $("#drawer .drawer__foot");
  if (!r.lineas.length) {
    cuerpo.innerHTML = `
      <div class="empty">
        <span class="empty__ico">${ico.bolsa}</span>
        <p class="empty__t">Tu carrito está vacío</p>
        <p>Explora el catálogo y añade lo que te guste.</p>
        <a class="btn btn--primary" href="catalogo.html">Ver catálogo ${ico.flecha}</a>
      </div>`;
    pie.hidden = true;
    return;
  }
  cuerpo.innerHTML = `<ul class="lines">${r.lineas.map((l) => lineaHTML(l)).join("")}</ul>`;
  pie.hidden = false;
  pie.innerHTML = `
    <div class="sum"><span>Subtotal</span><strong>${precio(r.subtotal)}</strong></div>
    ${r.sinPrecio ? `<p class="sum__note">+ ${r.sinPrecio} producto${r.sinPrecio > 1 ? "s" : ""} con precio a consultar.</p>` : ""}
    <p class="sum__note">Total en dólares. Si pagas en Bs a tasa BCV, lo eliges en el siguiente paso. No se cobra nada en la página.</p>
    <a class="btn btn--primary btn--block" href="pedido.html">Finalizar pedido ${ico.flecha}</a>
    <button type="button" class="link-btn" data-vaciar>Vaciar carrito</button>`;
}

/* ---------- montaje ---------- */
export async function iniciarLayout(activo = "") {
  const { marca, instagram } = CONFIG;
  const anio = new Date().getFullYear();

  document.body.insertAdjacentHTML(
    "afterbegin",
    `<a class="skip" href="#contenido">Saltar al contenido</a>
    ${CONFIG.modoDemo ? `<div class="demo-bar" role="note"><strong>Vista de demostración.</strong> Los productos y precios que ves son ejemplos, no el catálogo real.</div>` : ""}
    <header class="site-header" id="cabecera">
      <div class="container site-header__in">
        <a class="brand" href="index.html" aria-label="${esc(marca.nombre)} — inicio">${marcaHTML()}</a>
        <nav class="nav" aria-label="Principal">
          ${NAV.map((n) => `<a href="${n.href}"${n.id === activo ? ' aria-current="page"' : ""}>${n.texto}</a>`).join("")}
        </nav>
        <div class="site-header__actions">
          <a class="icon-btn" href="catalogo.html?buscar=1" aria-label="Buscar productos">${ico.buscar}</a>
          <button class="icon-btn" type="button" data-abrir-carrito aria-label="Abrir carrito">
            ${ico.bolsa}<span class="count" data-cuenta hidden>0</span>
          </button>
          <button class="icon-btn nav-toggle" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="menu-movil">${ico.menu}</button>
        </div>
      </div>
    </header>
    <div class="mobile-menu" id="menu-movil" aria-hidden="true" inert>
      <nav aria-label="Menú móvil">
        <a href="index.html">Inicio</a>
        ${NAV.map((n) => `<a href="${n.href}">${n.texto}</a>`).join("")}
        <a href="pedido.html">Mi pedido</a>
      </nav>
      <div class="mobile-menu__foot">
        <a class="btn btn--wa" href="${enlaceWhatsApp()}" target="_blank" rel="noopener">${ico.whatsapp} WhatsApp</a>
        <a class="btn btn--ghost" href="${instagram.url}" target="_blank" rel="noopener">${ico.instagram} @${esc(instagram.usuario)}</a>
      </div>
    </div>`
  );

  document.body.insertAdjacentHTML(
    "beforeend",
    `<footer class="footer">
      <div class="container">
        <div class="footer__top">
          <div class="footer__brand">
            <a class="brand brand--xl" href="index.html">${marcaHTML()}</a>
            <p>Training pads para mascotas en tallas M, L y XL. Pedidos directos por WhatsApp.</p>
          </div>
          <nav class="footer__col" aria-label="Navegación del pie">
            <h2>Navegar</h2>
            <a href="index.html">Inicio</a>
            ${NAV.map((n) => `<a href="${n.href}">${n.texto}</a>`).join("")}
            <a href="pedido.html">Mi pedido</a>
          </nav>
          <div class="footer__col">
            <h2>Contacto</h2>
            <a href="${enlaceWhatsApp()}" target="_blank" rel="noopener">${ico.whatsapp} WhatsApp</a>
            <a href="${instagram.url}" target="_blank" rel="noopener">${ico.instagram} @${esc(instagram.usuario)}</a>
            ${marca.email ? `<a href="mailto:${esc(marca.email)}">${esc(marca.email)}</a>` : ""}
            ${marca.ubicacion ? `<span>${esc(marca.ubicacion)}</span>` : ""}
          </div>
        </div>
        <div class="footer__bottom">
          <span>© ${anio} ${esc(marca.nombre)}. Todos los derechos reservados.</span>
          <a href="#cabecera">Volver arriba ↑</a>
        </div>
      </div>
    </footer>
    <a class="fab" href="${enlaceWhatsApp()}" target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp">${ico.whatsapp}<span>Escríbenos</span></a>
    <div class="overlay" data-cerrar-carrito></div>
    <aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-label="Carrito de compras" aria-hidden="true" inert>
      <header class="drawer__head">
        <h2>Tu carrito</h2>
        <button class="icon-btn drawer__close" type="button" data-cerrar-carrito aria-label="Cerrar carrito">${ico.x}</button>
      </header>
      <div class="drawer__body"></div>
      <footer class="drawer__foot" hidden></footer>
    </aside>`
  );

  /* cabecera con sombra al hacer scroll */
  const cab = $("#cabecera");
  const alScroll = () => cab.classList.toggle("is-stuck", scrollY > 8);
  addEventListener("scroll", alScroll, { passive: true });
  alScroll();

  /* menú móvil */
  const toggle = $(".nav-toggle");
  const menu = $("#menu-movil");
  const fijarMenu = (abierto) => {
    document.body.classList.toggle("menu-open", abierto);
    toggle.setAttribute("aria-expanded", abierto);
    toggle.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
    toggle.innerHTML = abierto ? ico.x : ico.menu;
    menu.setAttribute("aria-hidden", !abierto);
    menu.toggleAttribute("inert", !abierto);
  };
  toggle.addEventListener("click", () => fijarMenu(!document.body.classList.contains("menu-open")));
  menu.addEventListener("click", (e) => e.target.closest("a") && fijarMenu(false));

  const cat = await cargarCatalogo();
  pintarCarrito(cat);
  carrito.suscribir(() => pintarCarrito(cat));

  /* delegación global de acciones */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-agregar],[data-abrir-carrito],[data-cerrar-carrito],[data-cant],[data-quitar],[data-vaciar]");
    if (!t) return;
    if (t.dataset.agregar) {
      const p = cat.productos.find((x) => x.id === t.dataset.agregar);
      if (!p || !p.disponible) return;
      const cant = Math.max(1, parseInt(t.dataset.cantidad || "1", 10) || 1);
      carrito.agregar(p.id, cant);
      aviso(`${p.nombre} añadido al carrito`);
      if (!document.body.classList.contains("no-drawer")) abrirCarrito();
    } else if ("abrirCarrito" in t.dataset) abrirCarrito();
    else if ("cerrarCarrito" in t.dataset) cerrarCarrito();
    else if (t.dataset.cant) {
      const it = carrito.items.find((i) => i.id === t.dataset.cant);
      if (it) carrito.fijar(it.id, it.cant + Number(t.dataset.delta));
    } else if (t.dataset.quitar) carrito.quitar(t.dataset.quitar);
    else if ("vaciar" in t.dataset) carrito.vaciar();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (document.body.classList.contains("cart-open")) cerrarCarrito();
    if (document.body.classList.contains("menu-open")) fijarMenu(false);
  });

  observarReveal();
  return cat;
}
