/* Sala de exhibición 3D.
   Muestra los productos que tengan "modelo3d" (archivo .glb o .gltf) con el
   componente <model-viewer>. Si ninguno tiene modelo, enseña la sala preparada
   sin simular modelos. */
import { CONFIG, esc, $, $$, ico, precio, enlaceWhatsApp, mensajeProducto, nombreCategoria } from "./core.js";

const MODEL_VIEWER = "https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js";
let cargaMV;
function cargarModelViewer() {
  if (customElements.get("model-viewer")) return Promise.resolve();
  cargaMV ??= new Promise((ok, mal) => {
    const s = document.createElement("script");
    s.type = "module";
    s.src = MODEL_VIEWER;
    s.onload = ok;
    s.onerror = () => mal(new Error("No se pudo cargar el visor 3D"));
    document.head.append(s);
  });
  return cargaMV;
}

export function montarSala(root, cat, { inicial } = {}) {
  const modelos = cat.productos.filter((p) => p.modelo3d);

  if (!modelos.length) {
    root.innerHTML = `
      <div class="stage stage--empty reveal">
        <div class="stage__floor" aria-hidden="true"></div>
        <div class="wire" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <div class="stage__empty">
          <p class="eyebrow eyebrow--light">Sala en preparación</p>
          <h3>Los modelos 3D llegarán pronto</h3>
          <p>Estamos digitalizando las piezas para que puedas girarlas, acercarte y verlas desde cualquier ángulo. Mientras tanto, pídenos fotos o videos por WhatsApp.</p>
          <a class="btn btn--wa" href="${enlaceWhatsApp("Hola, vengo de la página web y quiero ver más fotos o videos de sus productos.")}" target="_blank" rel="noopener">${ico.whatsapp} Pedir fotos por WhatsApp</a>
        </div>
      </div>`;
    return;
  }

  let actual = modelos.find((m) => m.id === inicial) ?? modelos[0];

  root.innerHTML = `
    <div class="showroom__grid">
      <div class="stage reveal" id="escenario">
        <div class="stage__floor" aria-hidden="true"></div>
        <div class="stage__viewer" id="visor"><p class="stage__msg">Cargando visor 3D…</p></div>
        <div class="stage__bar" aria-hidden="true"><i></i></div>
        <div class="stage__vista" role="group" aria-label="Qué ver en 3D" hidden>
          <button type="button" class="vista-btn is-on" data-vista="paquete" aria-pressed="true">Paquete</button>
          <button type="button" class="vista-btn" data-vista="pad" aria-pressed="false">Pad abierto</button>
        </div>
        <div class="stage__hud">
          <button type="button" class="hud-btn is-on" data-hud="rotar" aria-pressed="true" title="Giro automático">${ico.girar}<span>Giro</span></button>
          <button type="button" class="hud-btn" data-hud="centrar" title="Restablecer cámara">${ico.cubo}<span>Centrar</span></button>
          <button type="button" class="hud-btn" data-hud="pantalla" title="Pantalla completa">${ico.expandir}<span>Ampliar</span></button>
        </div>
        <p class="stage__hint">Arrastra para girar · Rueda o pellizco para acercar · Dos dedos o clic derecho para mover</p>
      </div>
      <aside class="stage-info reveal" id="ficha3d" aria-live="polite"></aside>
    </div>
    <div class="rail reveal" role="tablist" aria-label="Modelos disponibles">
      ${modelos
        .map(
          (m, i) => `
        <button type="button" role="tab" class="rail__item" data-modelo="${esc(m.id)}" aria-selected="false">
          <span class="rail__n">${String(i + 1).padStart(2, "0")}</span>
          <span class="rail__name">${esc(m.nombre)}</span>
        </button>`
        )
        .join("")}
    </div>`;

  const escenario = $("#escenario", root);
  const visor = $("#visor", root);
  const ficha = $("#ficha3d", root);
  const barra = $(".stage__bar i", root);
  const selVista = $(".stage__vista", root);
  let mv;
  let seguro;
  /* "paquete" = modelo3d · "pad" = modelo3dPad (el pad extendido a medida real) */
  let vista = "paquete";
  const ORBITA = { paquete: "30deg 72deg auto", pad: "25deg 50deg auto" };
  const vistaDe = (p) => (vista === "pad" && p.modelo3dPad ? "pad" : "paquete");

  function pintarVista(p) {
    selVista.hidden = !p.modelo3dPad;
    const v = vistaDe(p);
    $$(".vista-btn", selVista).forEach((b) => {
      const on = b.dataset.vista === v;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", on);
    });
  }

  function pintarFicha(p) {
    ficha.innerHTML = `
      <p class="eyebrow eyebrow--light">${esc(nombreCategoria(cat, p.categoria) || "Modelo 3D")}${CONFIG.modoDemo ? " · Ejemplo" : ""}</p>
      <h3>${esc(p.nombre)}</h3>
      ${p.descripcionCorta ? `<p class="stage-info__desc">${esc(p.descripcionCorta)}</p>` : ""}
      ${
        p.caracteristicas.length
          ? `<ul class="stage-info__list">${p.caracteristicas.slice(0, 4).map((c) => `<li>${esc(c)}</li>`).join("")}</ul>`
          : ""
      }
      <p class="stage-info__price">${precio(p.precio)}</p>
      <div class="stage-info__cta">
        ${
          p.disponible
            ? `<button type="button" class="btn btn--light" data-agregar="${esc(p.id)}">${ico.bolsa} Añadir al carrito</button>`
            : `<span class="badge badge--off">Agotado</span>`
        }
        <a class="btn btn--wa" href="${enlaceWhatsApp(mensajeProducto(p))}" target="_blank" rel="noopener">${ico.whatsapp} Consultar</a>
        <a class="link-light" href="producto.html?id=${encodeURIComponent(p.id)}">Ver ficha completa ${ico.flecha}</a>
      </div>`;
    $$(".rail__item", root).forEach((b) => b.setAttribute("aria-selected", b.dataset.modelo === p.id));
  }

  function mostrar(p) {
    actual = p;
    pintarFicha(p);
    pintarVista(p);
    if (!mv) return;
    const v = vistaDe(p);
    escenario.classList.add("is-switching");
    barra.style.transform = "scaleX(0)";
    barra.parentElement.classList.add("on");
    setTimeout(() => {
      mv.setAttribute("alt", v === "pad" ? `Modelo 3D del pad abierto, ${p.nombre}` : `Modelo 3D de ${p.nombre}`);
      mv.setAttribute("src", v === "pad" ? p.modelo3dPad : p.modelo3d);
    }, 260);
    /* red de seguridad: nunca dejar el visor oculto si el evento "load" se retrasa */
    clearTimeout(seguro);
    seguro = setTimeout(() => escenario.classList.remove("is-switching"), 3500);
  }

  pintarFicha(actual);

  cargarModelViewer()
    .then(() => {
      visor.innerHTML = `
        <model-viewer camera-controls auto-rotate auto-rotate-delay="0" rotation-per-second="20deg"
          shadow-intensity="1.1" shadow-softness="0.9" exposure="1" tone-mapping="neutral"
          environment-image="neutral" interaction-prompt="auto" touch-action="pan-y"
          camera-orbit="30deg 72deg auto" loading="eager" alt=""></model-viewer>`;
      mv = $("model-viewer", visor);
      mv.addEventListener("progress", (e) => {
        const v = e.detail.totalProgress;
        barra.style.transform = `scaleX(${v})`;
        if (v >= 1) setTimeout(() => barra.parentElement.classList.remove("on"), 300);
      });
      mv.addEventListener("load", () => {
        escenario.classList.remove("is-switching");
        escenario.classList.add("is-ready");
        mv.cameraOrbit = ORBITA[vistaDe(actual)];
        mv.cameraTarget = "auto auto auto";
        mv.fieldOfView = "auto";
        mv.jumpCameraToGoal?.();
      });
      mv.addEventListener("error", () => {
        escenario.classList.remove("is-switching");
        visor.insertAdjacentHTML("beforeend", `<p class="stage__msg stage__msg--err">No se pudo cargar este modelo. Revisa la ruta del archivo en el catálogo.</p>`);
      });
      mostrar(actual);
    })
    .catch(() => {
      visor.innerHTML = `<p class="stage__msg stage__msg--err">No se pudo cargar el visor 3D. Comprueba tu conexión e inténtalo de nuevo.</p>`;
    });

  root.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-modelo]");
    if (tab) {
      const p = modelos.find((m) => m.id === tab.dataset.modelo);
      if (p && p.id !== actual.id) {
        $$(".stage__msg--err", visor).forEach((n) => n.remove());
        mostrar(p);
      }
      return;
    }
    const btnVista = e.target.closest("[data-vista]");
    if (btnVista) {
      if (btnVista.dataset.vista !== vistaDe(actual)) {
        vista = btnVista.dataset.vista;
        $$(".stage__msg--err", visor).forEach((n) => n.remove());
        mostrar(actual);
      }
      return;
    }
    const hud = e.target.closest("[data-hud]");
    if (!hud || !mv) return;
    if (hud.dataset.hud === "rotar") {
      const on = !mv.hasAttribute("auto-rotate");
      mv.toggleAttribute("auto-rotate", on);
      hud.classList.toggle("is-on", on);
      hud.setAttribute("aria-pressed", on);
    } else if (hud.dataset.hud === "centrar") {
      mv.cameraOrbit = ORBITA[vistaDe(actual)];
      mv.cameraTarget = "auto auto auto";
      mv.fieldOfView = "auto";
      mv.resetTurntableRotation?.();
    } else if (hud.dataset.hud === "pantalla") {
      if (document.fullscreenElement) document.exitFullscreen();
      else escenario.requestFullscreen?.().catch(() => {});
    }
  });
}
