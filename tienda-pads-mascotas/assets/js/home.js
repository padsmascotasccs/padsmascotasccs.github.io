import { CONFIG, esc, $, ico, enlaceWhatsApp } from "./core.js";
import { iniciarLayout, tarjetaProducto, observarReveal } from "./layout.js";
import { montarSala } from "./showroom.js";
import { montarInstagram } from "./instagram.js";

const cat = await iniciarLayout("");
const { hero, nosotros, marca, instagram } = CONFIG;

/* ---------- hero ---------- */
const palabras = hero.titulo.split(/\s+/).map((w, i) => {
  const acento = /^\*.+\*[.,;:!?]?$/.test(w);
  const limpio = esc(w.replaceAll("*", ""));
  return `<span class="w"><span style="--i:${i}">${acento ? `<em>${limpio}</em>` : limpio}</span></span>`;
});
const fotos = hero.imagenes.slice(0, 3);
const marcos = [0, 1, 2]
  .map((i) =>
    fotos[i]
      ? `<figure class="arch arch--${i + 1}"><img src="${esc(fotos[i])}" alt="" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}></figure>`
      : `<figure class="arch arch--${i + 1} arch--empty" aria-hidden="true"><span></span></figure>`
  )
  .join("");

$("#hero").innerHTML = `
  <div class="container hero__in">
    <div class="hero__copy">
      <p class="eyebrow hero__fade" style="--i:0">${esc(hero.etiqueta)} · @${esc(instagram.usuario)}</p>
      <h1 class="hero__title">${palabras.join(" ")}</h1>
      <p class="hero__sub hero__fade" style="--i:2">${esc(hero.subtitulo)}</p>
      <div class="hero__cta hero__fade" style="--i:3">
        <a class="btn btn--primary btn--lg" href="catalogo.html">Explorar catálogo ${ico.flecha}</a>
        <a class="btn btn--ghost btn--lg" href="${enlaceWhatsApp()}" target="_blank" rel="noopener">${ico.whatsapp} Escribir por WhatsApp</a>
      </div>
    </div>
    <div class="hero__art hero__fade" style="--i:1">${marcos}<span class="hero__orb" aria-hidden="true"></span></div>
  </div>
  <div class="marquee" aria-hidden="true"><div class="marquee__track">
    ${Array(2).fill(`${[...hero.cinta, "@" + instagram.usuario].map((t) => `<span>${esc(t)}</span><i></i>`).join("")}`).join("")}
  </div></div>`;
setTimeout(() => $("#hero").classList.add("in"), 40);

/* ---------- destacados ---------- */
const destacados = (cat.productos.some((p) => p.destacado) ? cat.productos.filter((p) => p.destacado) : cat.productos).slice(0, 4);
$("#destacados-grid").innerHTML = destacados.length
  ? destacados.map((p) => tarjetaProducto(p, cat)).join("")
  : `<div class="empty empty--wide">
       <span class="empty__ico">${ico.bolsa}</span>
       <p class="empty__t">El catálogo se está preparando</p>
       <p>Muy pronto verás aquí todos los productos. Mientras tanto, escríbenos y te atendemos directamente.</p>
       <a class="btn btn--wa" href="${enlaceWhatsApp()}" target="_blank" rel="noopener">${ico.whatsapp} Consultar por WhatsApp</a>
     </div>`;

/* ---------- cómo comprar ---------- */
if (CONFIG.info.length)
  $("#info-in").innerHTML = CONFIG.info
    .map((i, n) => `<li class="reveal"><span>${String(n + 1).padStart(2, "0")}</span><h3>${esc(i.titulo)}</h3><p>${esc(i.texto)}</p></li>`)
    .join("");
else $("#info").hidden = true;

/* ---------- sala 3D ---------- */
montarSala($("#sala"), cat);

/* ---------- nosotros ---------- */
const hayNosotros = nosotros.titulo || nosotros.parrafos.length;
const secNos = $("#nosotros");
if (!hayNosotros && !CONFIG.modoDemo) {
  secNos.hidden = true;
  document.querySelectorAll('a[href$="#nosotros"]').forEach((a) => (a.hidden = true));
} else {
  const pendiente = !hayNosotros;
  $("#nosotros-in").innerHTML = `
    <div class="about__media reveal">
      ${nosotros.imagen ? `<img src="${esc(nosotros.imagen)}" alt="${esc(marca.nombre)}" loading="lazy">` : `<span class="about__ph">${ico.imagen}<span>${pendiente ? "Aquí va una foto tuya o de tu taller" : ""}</span></span>`}
    </div>
    <div class="about__copy">
      <p class="eyebrow reveal">Sobre nosotros</p>
      <h2 class="reveal">${esc(nosotros.titulo || "La historia detrás de la marca")}</h2>
      ${
        pendiente
          ? `<p class="pending reveal"><strong>Contenido pendiente.</strong> Este espacio está listo para tu historia: quién eres, cómo empezó el emprendimiento y qué te diferencia. Se edita en <code>data/config.js</code>, sección <code>nosotros</code>.</p>`
          : nosotros.parrafos.map((t) => `<p class="reveal">${esc(t)}</p>`).join("")
      }
      ${
        nosotros.valores.length
          ? `<ul class="values">${nosotros.valores.slice(0, 3).map((v, i) => `<li class="reveal"><span>${String(i + 1).padStart(2, "0")}</span><h3>${esc(v.titulo)}</h3><p>${esc(v.texto)}</p></li>`).join("")}</ul>`
          : ""
      }
      <a class="btn btn--ghost reveal" href="${instagram.url}" target="_blank" rel="noopener">${ico.instagram} Conócenos en Instagram</a>
    </div>`;
}

/* ---------- instagram ---------- */
await montarInstagram($("#instagram-in"));

observarReveal();
if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
