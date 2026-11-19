import { EMPRESA } from "./empresa";
import { parseToken, toUpper } from "./helpers";

// El formulario de la cotización usa los mismos nombres que la OT para el cliente, el contacto y la
// dirección (cliente, rut, email, fonoPrincipal, contacto, direccion…), así se reutilizan los
// componentes de la OT. Aquí se convierte entre ese formulario y lo que guarda el servidor.

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
  contactosExtra: [],
  ejecutivo: parseToken().nombre || parseToken().usuario || "",
  ejecutivoFono: EMPRESA.fono,
  ejecutivoEmail: parseToken().email || "",
  items: [itemVacio()],
  ordenId: null,
  ordenNumero: ""
});

const leerJson = (val) => {
  try {
    const arr = JSON.parse(val || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

// Los ítems siempre tienen al menos uno; "Otros Contactos" (contactos_extra) puede ser vacío.
export const parseItems = (val) => {
  const arr = leerJson(val);
  return arr.length ? arr : [itemVacio()];
};
export const parseExtra = (val) => leerJson(val);

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
    cliente: c.cliente_razon_social || "",
    rut: c.cliente_rut || "",
    email: c.cliente_email || "",
    fonoPrincipal: c.cliente_telefono || "",
    contacto: c.contacto_nombre || "",
    emailContacto: c.contacto_email || "",
    fonoContacto: c.contacto_fono || "",
    cargoContacto: c.contacto_cargo || "",
    contactoId: c.contacto_id || null,
    direccion: c.contacto_direccion || "",
    ciudad: c.contacto_ciudad || "",
    comuna: c.contacto_comuna || "",
    direccionId: c.direccion_id || null,
    contactosExtra: parseExtra(c.contactos_extra),
    ejecutivo: c.ejecutivo || "",
    ejecutivoFono: c.ejecutivo_fono || "",
    ejecutivoEmail: c.ejecutivo_email || "",
    items: parseItems(c.items),
    ordenId: c.orden_id || null,
    ordenNumero: c.orden_numero || ""
  };
}

// Formulario -> lo que espera el servidor (POST/PUT /api/cotizaciones). La dirección del formulario va en
// contacto_direccion* y direccion_id; las columnas cliente_direccion* quedan vacías.
export function formularioAPayload(f) {
  return {
    fechaEmision: f.fechaEmision,
    fechaValidoHasta: f.fechaValidoHasta,
    condicion: f.condicion,
    glosa: f.glosa,
    clienteId: f.clienteId,
    clienteTipo: f.clienteTipo === "PERSONA" ? "PERSONA" : "EMPRESA",
    clienteRut: f.rut,
    clienteRazonSocial: f.cliente,
    clienteDireccion: "",
    clienteCiudad: "",
    clienteComuna: "",
    clienteDireccionId: null,
    clienteTelefono: f.fonoPrincipal,
    clienteEmail: f.email,
    contactoNombre: f.contacto,
    contactoFono: f.fonoContacto,
    contactoEmail: f.emailContacto,
    contactoCargo: f.cargoContacto,
    contactoId: f.contactoId,
    contactoDireccion: f.direccion,
    contactoCiudad: f.ciudad,
    contactoComuna: f.comuna,
    direccionId: f.direccionId,
    contactosExtra: f.contactosExtra,
    ejecutivo: f.ejecutivo,
    ejecutivoFono: f.ejecutivoFono,
    ejecutivoEmail: f.ejecutivoEmail,
    // Solo se guardan los ítems con algo escrito
    items: f.items.filter((i) => String(i.sku || "").trim() || String(i.detalle || "").trim() || Number(i.neto) > 0),
    ordenId: f.ordenId,
    ordenNumero: f.ordenNumero
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
