/**
 * Pads Mascotas — registro de pedidos e inventario en Google Sheets.
 *
 * Este código va dentro de una hoja de cálculo tuya (Extensiones → Apps Script).
 * Hace dos cosas:
 *   - doPost: la tienda le envía cada pedido y lo anota en la pestaña "Pedidos".
 *   - doGet:  la tienda le pregunta cuántos paquetes quedan (pestaña "Inventario").
 *
 * La hoja sigue siendo privada: solo se expone el número de paquetes por talla.
 * Pasos de instalación en google/LEEME-google.md.
 */

var HOJA_PEDIDOS = "Pedidos";
var HOJA_INVENTARIO = "Inventario";
var COLUMNAS = ["Fecha", "Referencia", "Nombre y apellido", "Teléfono", "Entrega", "Zona / dirección", "Pago", "Productos", "Paquetes", "Subtotal $", "Delivery $", "Total $", "Tasa BCV", "Total Bs", "Notas", "Estado"];
var CAMPOS = ["fecha", "referencia", "nombre", "telefono", "entrega", "direccion", "pago", "productos", "paquetes", "subtotal", "delivery", "total", "tasa", "totalBs", "notas"];

/** Crea las pestañas la primera vez. Puedes ejecutarla a mano desde el editor. */
function preparar() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var pedidos = libro.getSheetByName(HOJA_PEDIDOS);
  if (!pedidos) {
    pedidos = libro.insertSheet(HOJA_PEDIDOS);
    pedidos.appendRow(COLUMNAS);
    pedidos.getRange(1, 1, 1, COLUMNAS.length).setFontWeight("bold").setBackground("#1f86c9").setFontColor("#ffffff");
    pedidos.setFrozenRows(1);
  }
  var inv = libro.getSheetByName(HOJA_INVENTARIO);
  if (!inv) {
    inv = libro.insertSheet(HOJA_INVENTARIO);
    inv.getRange(1, 1, 4, 2).setValues([["Talla", "Paquetes disponibles"], ["M", 1], ["L", 2], ["XL", 3]]);
    inv.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#1f86c9").setFontColor("#ffffff");
    inv.getRange("D1").setValue("Cambia solo los números de la columna B. La tienda los lee al momento.");
    inv.setFrozenRows(1);
  }
  return { pedidos: pedidos, inv: inv };
}

/** Evita que un texto escrito por un cliente se interprete como fórmula. */
function limpio(v) {
  if (typeof v !== "string") return v;
  v = v.slice(0, 600);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

/* ---------- Opiniones (quejas, sugerencias, felicitaciones) ---------- */
var HOJA_OPINIONES = "Opiniones";
var COLUMNAS_OPINION = ["Fecha", "Tipo", "Mensaje", "Nombre", "Contacto", "Leída"];

function hojaOpiniones() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var h = libro.getSheetByName(HOJA_OPINIONES);
  if (!h) {
    h = libro.insertSheet(HOJA_OPINIONES);
    h.appendRow(COLUMNAS_OPINION);
    h.getRange(1, 1, 1, COLUMNAS_OPINION.length).setFontWeight("bold").setBackground("#1f86c9").setFontColor("#ffffff");
    h.setFrozenRows(1);
    h.setColumnWidth(3, 420);
  }
  return h;
}

/** Guarda la opinión en la pestaña "Opiniones" y te la manda por correo (a la cuenta dueña de este script). */
function guardarOpinion(d) {
  if (d.web) return ContentService.createTextOutput("ok"); // trampa anti-spam: los humanos no llenan este campo
  var mensaje = String(d.mensaje || "").trim().slice(0, 1500);
  if (mensaje.length < 3) return ContentService.createTextOutput("vacio");
  var tipo = ["Sugerencia", "Queja", "Felicitación"].indexOf(d.clase) >= 0 ? d.clase : "Sugerencia";
  var nombre = String(d.nombre || "").trim().slice(0, 120);
  var contacto = String(d.contacto || "").trim().slice(0, 160);
  var fecha = d.fecha || new Date().toLocaleString("es-VE", { timeZone: "America/Caracas" });
  hojaOpiniones().appendRow([limpio(fecha), tipo, limpio(mensaje), limpio(nombre), limpio(contacto), "No"]);

  var cuerpo = "Nueva " + tipo.toLowerCase() + " desde la página web de Pads Mascotas:\n\n" +
    mensaje + "\n\n" +
    "Nombre: " + (nombre || "(no lo dejó)") + "\n" +
    "Contacto: " + (contacto || "(no lo dejó)") + "\n" +
    "Fecha: " + fecha + "\n\n" +
    "También quedó guardada en la pestaña \"Opiniones\" de tu hoja.";
  var correo = { to: Session.getEffectiveUser().getEmail(), subject: tipo + " en Pads Mascotas" + (nombre ? " · " + nombre : ""), body: cuerpo, name: "Pads Mascotas · Opiniones" };
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contacto)) correo.replyTo = contacto;
  MailApp.sendEmail(correo);
  return ContentService.createTextOutput("ok");
}

/** Ejecútala una vez desde el editor para dar el permiso de enviar correos (te llega un correo de prueba). */
function probarCorreoOpiniones() {
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), "Prueba · Opiniones de Pads Mascotas", "Si te llegó este correo, las opiniones de la página web te llegarán aquí.");
  hojaOpiniones();
}

/** La tienda envía aquí cada pedido (y también las opiniones, con tipo "opinion"). */
function doPost(e) {
  var candado = LockService.getScriptLock();
  candado.waitLock(10000);
  try {
    var d = JSON.parse(e.postData.contents);
    if (d.tipo === "opinion") return guardarOpinion(d);
    var hojas = preparar();
    var fila = CAMPOS.map(function (c) { return limpio(d[c] == null ? "" : d[c]); });
    fila.push("Pendiente");
    hojas.pedidos.appendRow(fila);
    return ContentService.createTextOutput("ok");
  } catch (err) {
    return ContentService.createTextOutput("error");
  } finally {
    candado.releaseLock();
  }
}

/** La tienda pregunta aquí cuántos paquetes quedan. Devuelve, por ejemplo, {"M":1,"L":2,"XL":3}. */
function doGet() {
  var inv = preparar().inv;
  var datos = inv.getRange(2, 1, Math.max(inv.getLastRow() - 1, 1), 2).getValues();
  var salida = {};
  datos.forEach(function (f) {
    var talla = String(f[0]).trim().toUpperCase();
    if (talla && f[1] !== "" && !isNaN(Number(f[1]))) salida[talla] = Number(f[1]);
  });
  return ContentService.createTextOutput(JSON.stringify(salida)).setMimeType(ContentService.MimeType.JSON);
}
