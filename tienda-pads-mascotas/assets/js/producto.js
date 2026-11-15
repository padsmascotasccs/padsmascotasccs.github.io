import { CONFIG, esc, $, $$, ico, precio, enlaceWhatsApp, mensajeProducto, nombreCategoria, sinFoto, precioBsHTML } from "./core.js";
import { iniciarLayout, tarjetaProducto, observarReveal } from "./layout.js";

const cat = await iniciarLayout("catalogo");
const id = new URLSearchParams(location.search).get("id");
const p = cat.productos.find((x) => x.id === id);
const root = $("#producto");

if (!p) {
  document.title = `Producto no encontrado — ${CONFIG.marca.nombre}`;
  root.innerHTML = `
    <div class="empty empty--wide">
      <span class="empty__ico">${ico.buscar}</span>
      <p class="empty__t">No encontramos este producto</p>
      <p>Puede que ya no esté disponible o que el enlace esté incompleto.</p>
      <a class="btn btn--primary" href="catalogo.html">Ver catálogo ${ico.flecha}</a>
    </div>`;
} else {
  const categoria = nombreCategoria(cat, p.categoria);
  document.title = `${p.nombre} — ${CONFIG.marca.nombre}`;
  const desc = p.descripcionCorta || p.descripcion || "";
  $('meta[name="description"]')?.setAttribute("content", desc.slice(0, 155));
  $('meta[property="og:title"]')?.setAttribute("content", p.nombre);
  $('meta[property="og:description"]')?.setAttribute("content", desc.slice(0, 155));
  if (p.imagenes[0]) $('meta[property="og:image"]')?.setAttribute("content", new URL(p.imagenes[0], location.href).href);
  if (!CONFIG.modoDemo) {
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.nombre,
      description: desc,
      image: p.imagenes.map((i) => new URL(i, location.href).href),
      brand: { "@type": "Brand", name: CONFIG.marca.nombre },
    });
    document.head.append(ld);
  }

  const imgs = p.imagenes;
  root.innerHTML = `
    <nav class="crumbs" aria-label="Ruta">
      <a href="index.html">Inicio</a><span>/</span><a href="catalogo.html">Catálogo</a>
      ${categoria ? `<span>/</span><a href="catalogo.html?cat=${encodeURIComponent(p.categoria)}">${esc(categoria)}</a>` : ""}
    </nav>
    <div class="pdp">
      <div class="pdp__gallery reveal">
        <div class="pdp__main">
          ${imgs[0] ? `<img id="foto" src="${esc(imgs[0])}" alt="${esc(p.nombre)}">` : sinFoto(p)}
          ${CONFIG.modoDemo ? `<span class="badge badge--demo pdp__badge">Ejemplo</span>` : ""}
        </div>
        ${
          imgs.length > 1
            ? `<div class="pdp__thumbs" role="group" aria-label="Fotos del producto">${imgs
                .map((src, i) => `<button type="button" class="thumb" data-src="${esc(src)}" aria-label="Foto ${i + 1}" aria-pressed="${i === 0}"><img src="${esc(src)}" alt=""></button>`)
                .join("")}</div>`
            : ""
        }
      </div>
      <div class="pdp__info">
        ${categoria ? `<p class="eyebrow reveal">${esc(categoria)}</p>` : ""}
        <h1 class="reveal">${esc(p.nombre)}</h1>
        <p class="pdp__price reveal${p.precio == null ? " is-ask" : ""}">${precio(p.precio)} ${precioBsHTML(p)}</p>
        <p class="pdp__stock reveal ${!p.disponible ? "off" : p.pocasUnidades ? "low" : "on"}"><i></i>${!p.disponible ? "Agotado por ahora" : p.pocasUnidades ? "Quedan pocas unidades" : "Disponible"}</p>
        ${p.descripcion || p.descripcionCorta ? `<p class="pdp__desc reveal">${esc(p.descripcion || p.descripcionCorta)}</p>` : ""}
        ${p.caracteristicas.length ? `<ul class="pdp__feats reveal">${p.caracteristicas.map((c) => `<li>${ico.check}<span>${esc(c)}</span></li>`).join("")}</ul>` : ""}
        <div class="pdp__buy reveal">
          ${
            p.disponible
              ? `<div class="qty qty--lg" role="group" aria-label="Cantidad">
                   <button type="button" id="menos" aria-label="Restar una unidad">${ico.menos}</button>
                   <output id="cant" aria-live="polite">1</output>
                   <button type="button" id="mas" aria-label="Sumar una unidad">${ico.mas}</button>
                 </div>
                 <button type="button" class="btn btn--primary btn--lg pdp__add" id="agregar" data-agregar="${esc(p.id)}" data-cantidad="1">${ico.bolsa} Añadir al carrito</button>`
              : ""
          }
          <a class="btn btn--wa btn--lg" href="${enlaceWhatsApp(mensajeProducto(p))}" target="_blank" rel="noopener">${ico.whatsapp} Consultar por WhatsApp</a>
        </div>
        ${p.modelo3d ? `<a class="pdp__3d reveal" href="modelos-3d.html?modelo=${encodeURIComponent(p.id)}">${ico.cubo}<span><strong>Ver en 3D</strong>Gira y acerca esta pieza en la sala de exhibición</span>${ico.flecha}</a>` : ""}
        ${CONFIG.info.length ? `<dl class="pdp__info-list reveal">${CONFIG.info.map((i) => `<div><dt>${esc(i.titulo)}</dt><dd>${esc(i.texto)}</dd></div>`).join("")}</dl>` : ""}
        <p class="pdp__note reveal">El pedido se confirma por WhatsApp. No se realiza ningún cobro en esta página.</p>
      </div>
    </div>`;

  /* galería */
  root.addEventListener("click", (e) => {
    const th = e.target.closest(".thumb");
    if (!th) return;
    const foto = $("#foto");
    foto.classList.add("is-swapping");
    setTimeout(() => {
      foto.src = th.dataset.src;
      foto.classList.remove("is-swapping");
    }, 160);
    $$(".thumb", root).forEach((b) => b.setAttribute("aria-pressed", b === th));
  });

  /* cantidad */
  let cant = 1;
  const fijar = (n) => {
    cant = Math.min(99, Math.max(1, n));
    $("#cant").textContent = cant;
    $("#agregar").dataset.cantidad = cant;
  };
  $("#menos")?.addEventListener("click", () => fijar(cant - 1));
  $("#mas")?.addEventListener("click", () => fijar(cant + 1));

  /* relacionados */
  const rel = [
    ...cat.productos.filter((x) => x.id !== p.id && x.categoria === p.categoria),
    ...cat.productos.filter((x) => x.id !== p.id && x.categoria !== p.categoria),
  ].slice(0, 4);
  if (rel.length) {
    $("#relacionados").hidden = false;
    $("#relacionados-grid").innerHTML = rel.map((x) => tarjetaProducto(x, cat)).join("");
  }
}
observarReveal();
