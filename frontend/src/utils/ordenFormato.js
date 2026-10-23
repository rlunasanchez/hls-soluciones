// Conversión de una orden guardada (fila de ordenes_trabajo) al estado del formulario de la OT.
import { toUpper, parseToken } from "./helpers";

const fmtDate = (d) => {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return "";
  return dt.toISOString().split("T")[0];
};

const parseExtra = (val) => {
  try {
    const arr = JSON.parse(val || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

// Adjuntos: la columna guarda JSON array [{nombre, tipo, data}] o null.
// Compatibilidad con datos viejos guardados como data URL suelto.
const parseAdjuntos = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const arr = JSON.parse(val);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

// Estado del formulario (nuevaOrden) a partir de la orden guardada.
export function ordenAFormulario(orden) {
  return {
    numeroOrden: orden.numero_orden || "",
    fecha: fmtDate(orden.fecha),
    esGarantia: orden.es_garantia || false,
    fechaIngreso: fmtDate(orden.fecha_ingreso),
    fechaIngresoCheck: orden.fecha_ingreso_check || false,
    fechaTermino: fmtDate(orden.fecha_termino),
    fechaTerminoCheck: orden.fecha_termino_check || false,
    fechaEntrega: fmtDate(orden.fecha_entrega),
    fechaEntregaCheck: orden.fecha_entrega_check || false,
    fechaCompra: fmtDate(orden.fecha_compra),
    fechaCompraCheck: orden.fecha_compra_check || false,
    cliente: toUpper(orden.cliente),
    direccion: toUpper(orden.direccion),
    ciudad: toUpper(orden.ciudad),
    comuna: toUpper(orden.comuna),
    rut: orden.rut || "",
    email: orden.email || "",
    fonoPrincipal: orden.fono_principal || "",
    contacto: toUpper(orden.contacto),
    fonoContacto: orden.fono_contacto || "",
    emailContacto: orden.email_contacto || "",
    cargoContacto: toUpper(orden.cargo_contacto) || "",
    tecnicoAsignado: toUpper(orden.tecnico_asignado),
    equipo: toUpper(orden.equipo),
    modelo: toUpper(orden.modelo),
    marca: toUpper(orden.marca),
    serie: toUpper(orden.serie),
    contadorPagOut: orden.contador_pag_out || "",
    nivelTinta: toUpper(orden.nivel_tinta),
    averia: toUpper(orden.averia),
    actividad: toUpper(orden.actividad),
    observaciones: toUpper(orden.observaciones),
    infoInterna: toUpper(orden.info_interna),
    clienteTipo: orden.cliente_tipo === "PERSONA" ? "PERSONA" : "EMPRESA",
    // Adjuntos antiguos (JSON en la propia OT): se pasan a la tabla orden_adjuntos al abrir la OT en Editar
    adjuntosAntiguos: parseAdjuntos(orden.adjunto),
    contactosExtra: parseExtra(orden.contactos_extra),
    direccionesExtra: parseExtra(orden.direcciones_extra)
  };
}

// Registro del mantenedor de Equipos que coincide con Equipo + Marca + Modelo de la orden (o null).
export function buscarEquipoDeOrden(orden, equipos = []) {
  const norm = (v) => String(v || "").trim().toUpperCase();
  if (!(orden.equipo && orden.marca && orden.modelo)) return null;
  return equipos.find((e) =>
    norm(e.equipo) === norm(orden.equipo) && norm(e.marca) === norm(orden.marca) && norm(e.modelo) === norm(orden.modelo)
  ) || null;
}

// Los 12 insumos de la orden como lista de { nombre } y cuántos mostrar (mínimo 2).
export function insumosDeOrden(orden) {
  const usados = [];
  for (let i = 1; i <= 12; i++) {
    const nombre = orden[`insumo${i}`];
    if (nombre) usados.push({ nombre });
  }
  const insumos = [...usados];
  while (insumos.length < 12) insumos.push({ nombre: "" });
  return { insumos, visibles: Math.max(2, usados.length) };
}

// Formulario de una OT nueva, sin datos. El técnico viene de la sesión.
export function ordenVacia(tecnicoAsignado = "") {
  return {
    numeroOrden: "", fecha: "", esGarantia: false,
    fechaIngreso: "", fechaIngresoCheck: false,
    fechaTermino: "", fechaTerminoCheck: false,
    fechaEntrega: "", fechaEntregaCheck: false,
    fechaCompra: "", fechaCompraCheck: false,
    cliente: "", direccion: "", ciudad: "", comuna: "", rut: "", email: "", fonoPrincipal: "",
    contacto: "", fonoContacto: "", emailContacto: "", cargoContacto: "",
    tecnicoAsignado,
    equipo: "", modelo: "", marca: "", serie: "", contadorPagOut: "", nivelTinta: "",
    averia: "", actividad: "", observaciones: "", infoInterna: "",
    clienteTipo: "EMPRESA",
    adjuntosAntiguos: [], contactosExtra: [], direccionesExtra: []
  };
}

// Los 12 insumos en blanco (cada uno es un objeto propio).
export const insumosVacios = () => Array.from({ length: 12 }, () => ({ nombre: "" }));

// Campos de la OT que se llevan de la ficha de un cliente al abrir una OT nueva desde Clientes.
// Viaja solo el contacto y la dirección marcados "En la OT" (sin marca, vacíos).
export function ordenParaCliente(cliente) {
  return {
    cliente: toUpper(cliente.razon_social),
    direccion: toUpper(cliente.ot_direccion),
    ciudad: toUpper(cliente.ot_ciudad),
    comuna: toUpper(cliente.ot_comuna),
    rut: cliente.rut || "",
    email: cliente.email || "",
    fonoPrincipal: cliente.telefono || "",
    contacto: toUpper(cliente.contacto_nombre),
    fonoContacto: cliente.contacto_fono || "",
    emailContacto: cliente.contacto_email || "",
    cargoContacto: toUpper(cliente.contacto_cargo),
    clienteTipo: cliente.tipo === "PERSONA" ? "PERSONA" : "EMPRESA"
  };
}

// Nombre y apellido de la sesión actual, para precargar el Técnico Asignado en una OT nueva (mismo
// formato que el resto del campo: mayúsculas, sin caracteres que no sean letras/espacios). El campo
// no es editable en el formulario, así que si todavía no se cargó el Nombre del usuario se usa el
// nombre de usuario de login como respaldo (nunca debe quedar vacío).
export const tecnicoDeSesion = () => {
  const { nombre, usuario } = parseToken();
  return toUpper(nombre || usuario || "").replace(/[^A-ZÁÉÍÓÚÑ\s]/g, "");
};

// Una persona no tiene contacto: va sin datos de contacto y con la dirección que tiene vinculada
// (copia, snapshot). En una empresa el contacto y la dirección se eligen aparte.
export const datosDelTipo = (cliente) => cliente.tipo === "PERSONA"
  ? {
      clienteTipo: "PERSONA",
      contacto: "", fonoContacto: "", emailContacto: "", cargoContacto: "",
      // Su dirección es la que tiene vinculada en el mantenedor de Direcciones
      direccion: toUpper(cliente.ot_direccion),
      ciudad: toUpper(cliente.ot_ciudad),
      comuna: toUpper(cliente.ot_comuna)
    }
  : { clienteTipo: "EMPRESA" };

// Campos de la OT que cambian al elegir un cliente (se mezclan con el estado anterior).
// Solo se llevan sus datos propios (razón social, RUT, fono, email); el contacto y la dirección salen
// y se eligen con sus buscadores (una persona trae los suyos, ver datosDelTipo).
// - OT guardada (editando): el equipo no se toca; si es el mismo cliente se conservan sus contactos y
//   direcciones adicionales, si es otro se limpian.
// - OT desde cero: además se limpian el equipo y la avería.
export function datosAlElegirCliente(cliente, { editando, mismoCliente }) {
  const datosCliente = {
    cliente: toUpper(cliente.razon_social),
    direccion: "", ciudad: "", comuna: "",
    rut: cliente.rut || "",
    email: cliente.email || "",
    fonoPrincipal: cliente.telefono || "",
    contacto: "", fonoContacto: "", emailContacto: "", cargoContacto: ""
  };
  if (editando) {
    return { ...datosCliente, ...(mismoCliente ? {} : { contactosExtra: [], direccionesExtra: [] }), ...datosDelTipo(cliente) };
  }
  return {
    ...datosCliente,
    contactosExtra: [], direccionesExtra: [],
    equipo: "", modelo: "", marca: "", serie: "", nivelTinta: "", contadorPagOut: "",
    averia: "", actividad: "", observaciones: "",
    ...datosDelTipo(cliente)
  };
}
