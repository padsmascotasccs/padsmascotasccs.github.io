import { $, ico, enlaceWhatsApp } from "./core.js";
import { iniciarLayout, observarReveal } from "./layout.js";
import { montarSala } from "./showroom.js";

const cat = await iniciarLayout("3d");
montarSala($("#sala"), cat, { inicial: new URLSearchParams(location.search).get("modelo") });
$("#cta-3d").innerHTML = `
  <a class="btn btn--wa btn--lg" href="${enlaceWhatsApp("Hola, vengo de la sala 3D de la página web y quiero más información.")}" target="_blank" rel="noopener">${ico.whatsapp} Hablar por WhatsApp</a>
  <a class="btn btn--outline-light btn--lg" href="catalogo.html">Ver todo el catálogo ${ico.flecha}</a>`;
observarReveal();
