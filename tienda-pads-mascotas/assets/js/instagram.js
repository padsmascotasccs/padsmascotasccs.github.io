/* Sección de Instagram.
   Galería administrable desde data/instagram.json. Cada publicación admite:
   { "imagen": "assets/img/instagram/1.jpg", "enlace": "https://www.instagram.com/p/XXXX/", "alt": "…" }
   o bien, para usar la inserción oficial de Instagram (sin subir la foto):
   { "enlace": "https://www.instagram.com/p/XXXX/", "incrustar": true } */
import { CONFIG, esc, ico } from "./core.js";

export async function montarInstagram(root) {
  const { usuario, url } = CONFIG.instagram;
  let pubs = [];
  try {
    const r = await fetch("data/instagram.json", { cache: "no-cache" });
    if (r.ok) pubs = (await r.json()).publicaciones ?? [];
  } catch (e) {
    console.error("[instagram]", e);
  }
  pubs = pubs.filter((p) => p && (p.imagen || (p.incrustar && p.enlace))).slice(0, 8);

  const cabecera = `
    <div class="ig__head">
      <div>
        <p class="eyebrow reveal">Instagram</p>
        <h2 class="reveal">Síguenos en <a href="${url}" target="_blank" rel="noopener">@${esc(usuario)}</a></h2>
        <p class="ig__lead reveal">Novedades, piezas nuevas y el día a día del emprendimiento se publican primero allí.</p>
      </div>
      <a class="btn btn--primary reveal" href="${url}" target="_blank" rel="noopener">${ico.instagram} Seguir en Instagram</a>
    </div>`;

  let cuerpo;
  if (!pubs.length) {
    cuerpo = `
      <a class="ig__card reveal" href="${url}" target="_blank" rel="noopener">
        <span class="ig__ring">${ico.instagram}</span>
        <span class="ig__user">@${esc(usuario)}</span>
        <span class="ig__go">Ver el perfil ${ico.flecha}</span>
      </a>`;
  } else {
    const hayEmbeds = pubs.some((p) => p.incrustar);
    cuerpo = `<div class="ig__grid">${pubs
      .map((p) =>
        p.incrustar
          ? `<div class="ig__embed reveal"><blockquote class="instagram-media" data-instgrm-permalink="${esc(p.enlace)}" data-instgrm-version="14"><a href="${esc(p.enlace)}" target="_blank" rel="noopener">Ver publicación en Instagram</a></blockquote></div>`
          : `<a class="ig__tile reveal" href="${esc(p.enlace || url)}" target="_blank" rel="noopener" aria-label="${esc(p.alt || "Ver publicación en Instagram")}">
               <img src="${esc(p.imagen)}" alt="${esc(p.alt || "")}" loading="lazy" decoding="async">
               <span class="ig__over">${ico.instagram}</span>
             </a>`
      )
      .join("")}</div>`;
    if (hayEmbeds) {
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://www.instagram.com/embed.js";
      document.body.append(s);
    }
  }
  root.innerHTML = cabecera + cuerpo;
}
