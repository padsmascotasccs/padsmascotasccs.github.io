/* Núcleo: configuración, catálogo, formato de precios, WhatsApp y carrito. */
import { CONFIG } from "../../data/config.js";
export { CONFIG };

/* ---------- utilidades ---------- */
const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ESC[c]);
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const normalizar = (s) =>
  String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function precio(valor) {
  if (valor == null || Number.isNaN(Number(valor))) return "Precio a consultar";
  const { simbolo, locale, decimales } = CONFIG.moneda;
  const n = Number(valor).toLocaleString(locale, {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
  return `${simbolo}${n}`;
}

/* ---------- catálogo ---------- */
let _catalogo;
export function cargarCatalogo() {
  if (_catalogo) return _catalogo;
  const url = CONFIG.modoDemo ? "data/demo/products.json" : "data/products.json";
  _catalogo = fetch(url, { cache: "no-cache" })
    .then((r) => {
      if (!r.ok) throw new Error(`No se pudo cargar ${url} (${r.status})`);
      return r.json();
    })
    .then((d) => {
      const categorias = Array.isArray(d.categorias) ? d.categorias : [];
      const productos = (Array.isArray(d.productos) ? d.productos : [])
        .filter((p) => p && p.id && p.nombre)
        .map((p) => ({
          descripcionCorta: "",
          descripcion: "",
          caracteristicas: [],
          imagenes: [],
          disponible: true,
          destacado: false,
          modelo3d: null,
          precio: null,
          precioBs: null,
          sigla: "",
          ...p,
        }));
      return { categorias, productos };
    })
    .catch((e) => {
      console.error("[catálogo]", e);
      return { categorias: [], productos: [], error: true };
    });
  return _catalogo;
}

export const nombreCategoria = (cat, id) =>
  cat.categorias.find((c) => c.id === id)?.nombre ?? "";

/* ---------- WhatsApp ---------- */
export function enlaceWhatsApp(mensaje = CONFIG.whatsapp.mensajeGeneral) {
  const numero = String(CONFIG.whatsapp.numero || "").replace(/\D/g, "");
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
export const sinFoto = (p) =>
  p.sigla
    ? `<span class="card__sigla"><small>Talla</small><b>${esc(p.sigla)}</b><span>${esc(p.descripcionCorta)}</span></span>`
    : `<span class="card__noimg">${ico.imagen}<span>Foto pendiente</span></span>`;
export const precioBsHTML = (p) =>
  p.precioBs != null && p.precio != null ? `<span class="bs">o ${precio(p.precioBs)} en Bs a tasa BCV</span>` : "";
export const mensajeProducto = (p) =>
  `Hola, vengo de la página web y quiero consultar por: ${p.nombre}` +
  (p.precio != null ? ` (${precio(p.precio)})` : "") +
  `.`;

/* ---------- carrito (persistente en localStorage) ---------- */
const CLAVE = "tienda_carrito_v1";
const oyentes = new Set();
function leer() {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE) || "[]");
    return Array.isArray(v) ? v.filter((i) => i && i.id && i.cant > 0) : [];
  } catch {
    return [];
  }
}
let items = leer();
function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(items));
  } catch {}
  oyentes.forEach((fn) => fn(items));
}
window.addEventListener("storage", (e) => {
  if (e.key === CLAVE) {
    items = leer();
    oyentes.forEach((fn) => fn(items));
  }
});

export const carrito = {
  get items() {
    return items;
  },
  cantidadTotal: () => items.reduce((n, i) => n + i.cant, 0),
  agregar(id, cant = 1) {
    const it = items.find((i) => i.id === id);
    if (it) it.cant = Math.min(99, it.cant + cant);
    else items.push({ id, cant: Math.min(99, Math.max(1, cant)) });
    guardar();
  },
  fijar(id, cant) {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    if (cant <= 0) return this.quitar(id);
    it.cant = Math.min(99, cant);
    guardar();
  },
  quitar(id) {
    items = items.filter((i) => i.id !== id);
    guardar();
  },
  vaciar() {
    items = [];
    guardar();
  },
  suscribir(fn) {
    oyentes.add(fn);
    return () => oyentes.delete(fn);
  },
};

/* Cruza el carrito con el catálogo: líneas válidas, subtotal y pendientes de precio. */
export function resumenCarrito(cat, campo = "precio") {
  const lineas = items
    .map((i) => {
      const p = cat.productos.find((x) => x.id === i.id);
      if (!p) return null;
      const unit = p[campo] ?? p.precio;
      const importe = unit != null ? unit * i.cant : null;
      return { producto: p, cant: i.cant, unit, importe };
    })
    .filter(Boolean);
  const subtotal = lineas.reduce((s, l) => s + (l.importe ?? 0), 0);
  const sinPrecio = lineas.filter((l) => l.importe == null).length;
  const unidades = lineas.reduce((n, l) => n + l.cant, 0);
  return { lineas, subtotal, sinPrecio, unidades };
}

/* ---------- iconos (trazo, 24x24) ---------- */
const svg = (d, extra = "") =>
  `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
export const ico = {
  bolsa: svg('<path d="M6 8h12l1 12H5L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'),
  buscar: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  x: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  mas: svg('<path d="M12 5v14M5 12h14"/>'),
  menos: svg('<path d="M5 12h14"/>'),
  basura: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  flecha: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  menu: svg('<path d="M4 8h16M4 16h16"/>'),
  cubo: svg('<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>'),
  girar: svg('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>'),
  expandir: svg('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  instagram: svg('<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><path d="M16.6 7.4h.01"/>'),
  whatsapp: svg('<path d="m3 21 1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>'),
  imagen: svg('<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="m4 16 4.5-4.5 4 4 2.5-2.5 5 5"/><circle cx="15.5" cy="9" r="1.3"/>'),
};
