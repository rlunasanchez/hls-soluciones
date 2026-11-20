import { EMPRESA } from "./empresa";
import { parseToken, toUpper } from "./helpers";

// El formulario de la cotización usa los mismos nombres que la OT para el cliente, el contacto y la
// dirección (cliente, rut, email, fonoPrincipal, contacto, direccion…), así se reutilizan los
// componentes de la OT; el servidor guarda las mismas columnas. Aquí se convierte lo que llega y lo que se manda.

export const itemVacio = () => ({ sku: "", detalle: "", cantidad: 1, neto: "", descuento: "" });

export const cotizacionVacia = () => ({
  fechaEmision: new Date().toISOString().split("T")[0],
  fechaValidoHasta: "",
  condicion: "Contado - CLP",
  glosa: "",
  // Cliente (como en la OT)
  clienteId: null,
  clienteTipo: "EMPRESA",
  cliente: "",
  rut: "",
  email: "",
  fonoPrincipal: "",
  // Contacto y dirección (como en la OT)
  contacto: "",
  emailContacto: "",
  fonoContacto: "",
  cargoContacto: "",
  contactoId: null,
  direccion: "",
  ciudad: "",
  comuna: "",
  direccionId: null,
  ejecutivo: parseToken().nombre || parseToken().usuario || "",
  ejecutivoFono: EMPRESA.fono,
  ejecutivoEmail: parseToken().email || "",
  items: [itemVacio()],
  ordenId: null,
  ordenNumero: ""
});

// Ítems que llegan del servidor (filas de cotizacion_items) -> los de los campos del formulario. Siempre hay
// al menos uno. Las cantidades y los descuentos llegan como DECIMAL (texto): se pasan a número.
export const itemsDelServidor = (items) => {
  const lista = (Array.isArray(items) ? items : []).map((i) => ({
    sku: i.sku || "",
    detalle: i.detalle || "",
    cantidad: Number(i.cantidad) || 0,
    neto: i.neto ?? "",
    descuento: Number(i.descuento) ? String(Number(i.descuento)) : ""
  }));
  return lista.length ? lista : [itemVacio()];
};

// Cotización guardada (columnas del servidor) -> formulario. El tipo (Empresa/Persona) viene del cliente
// vinculado, si todavía existe. La dirección es la elegida en el mantenedor de Direcciones (columnas
// contacto_direccion*, con direccion_id); la dirección propia de la ficha del cliente no se usa.
export function cotizacionAFormulario(c, tipoCliente) {
  return {
    fechaEmision: (c.fecha_emision || "").substring(0, 10),
    fechaValidoHasta: (c.fecha_valido_hasta || "").substring(0, 10),
    condicion: c.condicion || "",
    glosa: c.glosa || "",
    clienteId: c.cliente_id || null,
    // El tipo guardado en la cotización manda; si es de antes de guardarlo, el del cliente vinculado.
    clienteTipo: (c.cliente_tipo === "PERSONA" || (!c.cliente_tipo && tipoCliente === "PERSONA")) ? "PERSONA" : "EMPRESA",
    cliente: c.cliente || "",
    rut: c.rut || "",
    email: c.email || "",
    fonoPrincipal: c.fono_principal || "",
    contacto: c.contacto || "",
    emailContacto: c.email_contacto || "",
    fonoContacto: c.fono_contacto || "",
    cargoContacto: c.cargo_contacto || "",
    contactoId: c.contacto_id || null,
    direccion: c.direccion || "",
    ciudad: c.ciudad || "",
    comuna: c.comuna || "",
    direccionId: c.direccion_id || null,
    ejecutivo: c.ejecutivo || "",
    ejecutivoFono: c.ejecutivo_fono || "",
    ejecutivoEmail: c.ejecutivo_email || "",
    items: itemsDelServidor(c.items),
    ordenId: c.orden_id || null,
    ordenNumero: c.orden_numero || ""
  };
}

// Formulario -> lo que espera el servidor (POST/PUT /api/cotizaciones). El formulario ya usa los nombres de la
// OT, así que viaja tal cual; el servidor enlaza el contacto y la dirección con el mantenedor y calcula los
// montos. Solo se mandan los ítems con algo escrito.
export function formularioAPayload(f) {
  return {
    ...f,
    clienteTipo: f.clienteTipo === "PERSONA" ? "PERSONA" : "EMPRESA",
    items: f.items.filter((i) => String(i.sku || "").trim() || String(i.detalle || "").trim() || Number(i.neto) > 0)
  };
}

// OT desde la que se crea la cotización -> formulario (queda asociada: ordenId).
export function formularioDesdeOrden(base, orden, cliente) {
  return {
    ...base,
    clienteId: orden.cliente_id || cliente?.id || null,
    clienteTipo: orden.cliente_tipo === "PERSONA" ? "PERSONA" : "EMPRESA",
    cliente: toUpper(orden.cliente || ""),
    rut: orden.rut || cliente?.rut || "",
    email: orden.email || cliente?.email || "",
    fonoPrincipal: orden.fono_principal || cliente?.telefono || "",
    contacto: toUpper(orden.contacto || ""),
    emailContacto: orden.email_contacto || "",
    fonoContacto: orden.fono_contacto || "",
    cargoContacto: toUpper(orden.cargo_contacto || ""),
    contactoId: orden.contacto_id || null,
    direccion: toUpper(orden.direccion || ""),
    ciudad: toUpper(orden.ciudad || ""),
    comuna: toUpper(orden.comuna || ""),
    direccionId: orden.direccion_id || null,
    ordenId: orden.id,
    ordenNumero: orden.numero_orden || ""
  };
}

// Cliente desde el que se crea la cotización (menú de Clientes): solo sus datos propios y, si es
// una persona, su dirección. Sin OT asociada.
export function formularioDesdeCliente(base, cliente) {
  const persona = cliente.tipo === "PERSONA";
  return {
    ...base,
    clienteId: cliente.id || null,
    clienteTipo: persona ? "PERSONA" : "EMPRESA",
    cliente: toUpper(cliente.razon_social || ""),
    rut: cliente.rut || "",
    email: cliente.email || "",
    fonoPrincipal: cliente.telefono || "",
    ...(persona ? {
      direccion: toUpper(cliente.ot_direccion || ""),
      ciudad: toUpper(cliente.ot_ciudad || ""),
      comuna: toUpper(cliente.ot_comuna || "")
    } : {})
  };
}
