import { esc, $, $$, ico, normalizar, enlaceWhatsApp, nombreCategoria } from "./core.js";
import { iniciarLayout, tarjetaProducto, observarReveal } from "./layout.js";

const cat = await iniciarLayout("catalogo");
const params = new URLSearchParams(location.search);
const estado = {
  q: params.get("q") ?? "",
  cat: params.get("cat") ?? "",
  orden: params.get("orden") ?? "destacados",
  soloDisp: params.get("disp") === "1",
};

const barra = $("#filtros");
const grid = $("#grid");
const cuenta = $("#cuenta");

if (!cat.productos.length) {
  barra.hidden = true;
  cuenta.hidden = true;
  grid.innerHTML = `
    <div class="empty empty--wide">
      <span class="empty__ico">${ico.bolsa}</span>
      <p class="empty__t">${cat.error ? "No pudimos cargar el catálogo" : "El catálogo se está preparando"}</p>
      <p>${cat.error ? "Vuelve a intentarlo en unos minutos o escríbenos directamente." : "Muy pronto verás aquí todos los productos. Mientras tanto, escríbenos y te atendemos directamente."}</p>
      <a class="btn btn--wa" href="${enlaceWhatsApp()}" target="_blank" rel="noopener">${ico.whatsapp} Consultar por WhatsApp</a>
    </div>`;
} else {
  const usadas = cat.categorias.filter((c) => cat.productos.some((p) => p.categoria === c.id));
  barra.innerHTML = `
    <label class="search">
      ${ico.buscar}
      <span class="sr-only">Buscar productos</span>
      <input type="search" id="q" placeholder="Buscar productos…" value="${esc(estado.q)}" autocomplete="off">
    </label>
    <div class="chips" role="group" aria-label="Categorías"${usadas.length < 2 ? " hidden" : ""}>
      <button type="button" class="chip" data-cat="">Todo</button>
      ${usadas.map((c) => `<button type="button" class="chip" data-cat="${esc(c.id)}">${esc(c.nombre)}</button>`).join("")}
    </div>
    <div class="filters__end">
      <label class="check"><input type="checkbox" id="disp"${estado.soloDisp ? " checked" : ""}><span>Solo disponibles</span></label>
      <label class="select">
        <span class="sr-only">Ordenar</span>
        <select id="orden">
          <option value="destacados">Destacados primero</option>
          <option value="precio-asc">Precio: menor a mayor</option>
          <option value="precio-desc">Precio: mayor a menor</option>
          <option value="nombre">Nombre A–Z</option>
        </select>
      </label>
    </div>`;
  $("#orden").value = estado.orden;

  const pintar = () => {
    const q = normalizar(estado.q.trim());
    let lista = cat.productos.filter((p) => {
      if (estado.cat && p.categoria !== estado.cat) return false;
      if (estado.soloDisp && !p.disponible) return false;
      if (!q) return true;
      const texto = normalizar(
        [p.nombre, p.descripcionCorta, p.descripcion, nombreCategoria(cat, p.categoria), ...(p.caracteristicas || []), ...(p.etiquetas || [])].join(" ")
      );
      return q.split(/\s+/).every((t) => texto.includes(t));
    });
    const porPrecio = (dir) => (a, b) => {
      if (a.precio == null) return 1;
      if (b.precio == null) return -1;
      return dir * (a.precio - b.precio);
    };
    if (estado.orden === "precio-asc") lista.sort(porPrecio(1));
    else if (estado.orden === "precio-desc") lista.sort(porPrecio(-1));
    else if (estado.orden === "nombre") lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    else lista = [...lista.filter((p) => p.destacado), ...lista.filter((p) => !p.destacado)];

    $$(".chip", barra).forEach((c) => c.setAttribute("aria-pressed", c.dataset.cat === estado.cat));
    cuenta.textContent = `${lista.length} producto${lista.length === 1 ? "" : "s"}`;
    grid.innerHTML = lista.length
      ? lista.map((p) => tarjetaProducto(p, cat)).join("")
      : `<div class="empty empty--wide">
           <span class="empty__ico">${ico.buscar}</span>
           <p class="empty__t">Sin resultados</p>
           <p>No encontramos productos con esos filtros.</p>
           <button type="button" class="btn btn--ghost" id="limpiar">Quitar filtros</button>
         </div>`;
    observarReveal(grid);

    const u = new URLSearchParams();
    if (estado.q) u.set("q", estado.q);
    if (estado.cat) u.set("cat", estado.cat);
    if (estado.orden !== "destacados") u.set("orden", estado.orden);
    if (estado.soloDisp) u.set("disp", "1");
    history.replaceState(null, "", u.size ? `?${u}` : location.pathname);
  };

  let t;
  $("#q").addEventListener("input", (e) => {
    estado.q = e.target.value;
    clearTimeout(t);
    t = setTimeout(pintar, 120);
  });
  $("#orden").addEventListener("change", (e) => ((estado.orden = e.target.value), pintar()));
  $("#disp").addEventListener("change", (e) => ((estado.soloDisp = e.target.checked), pintar()));
  barra.addEventListener("click", (e) => {
    const c = e.target.closest(".chip");
    if (c) ((estado.cat = c.dataset.cat), pintar());
  });
  grid.addEventListener("click", (e) => {
    if (!e.target.closest("#limpiar")) return;
    Object.assign(estado, { q: "", cat: "", soloDisp: false });
    $("#q").value = "";
    $("#disp").checked = false;
    pintar();
  });

  pintar();
  if (params.get("buscar") === "1") $("#q").focus();
}
