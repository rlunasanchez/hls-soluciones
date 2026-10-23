// Validaciones previas a guardar una OT y armado de lo que se envía al servidor.
import { validarRUT, normalizarRut, validarEmail } from "./helpers";

// Devuelve el mensaje del primer problema encontrado, o null si la orden se puede guardar.
// `verificacion` es la respuesta de verificarCliente({ rut, razon_social }) hecha antes de llamar.
export function validarOrden(orden, { verificacion = {}, clienteSeleccionado = null } = {}) {
  if (!orden.cliente || !orden.cliente.trim()) {
    return "Complete el Cliente antes de guardar la orden.";
  }
  if (!orden.tecnicoAsignado || !orden.tecnicoAsignado.trim()) {
    return "Complete el Técnico Asignado antes de guardar la orden.";
  }

  // RUT "19" = comodín (cliente sin RUT conocido): se permite sin validar formato
  const rutNorm = normalizarRut(orden.rut);
  if (rutNorm !== "19" && (!orden.rut || !orden.rut.trim() || !validarRUT(orden.rut))) {
    return "Complete el RUT del cliente (con guion y dígito verificador) antes de guardar la orden.";
  }

  // Emails con formato válido: cliente, contacto y contactos adicionales
  const emails = [
    ["Email", orden.email],
    ["Email Contacto", orden.emailContacto],
    ...(orden.contactosExtra || []).map((c, i) => [`Email contacto ${i + 1}`, c.email]),
  ];
  for (const [campo, valor] of emails) {
    if (String(valor || "").trim() && !validarEmail(valor)) return `Email inválido (${campo}).`;
  }

  // El cliente debe existir en el mantenedor de Clientes
  const existe = verificacion.porNombre || (rutNorm && verificacion.porRut);
  if (!existe) return 'El cliente no está registrado. Use "Registrar en Clientes".';

  // Y debe estar seleccionado explícitamente en el buscador
  if (!clienteSeleccionado) return "Seleccione un cliente del buscador antes de guardar.";

  // El RUT escrito no puede pertenecer a otro cliente distinto del seleccionado
  // (el comodín "19" se excluye porque lo comparten varios clientes)
  if (rutNorm && rutNorm !== "19") {
    const dueno = verificacion.porRut;
    if (dueno && dueno.id !== clienteSeleccionado.id) {
      return `El RUT ${orden.rut} pertenece al cliente ${dueno.codigo || "CL-????"}.`;
    }
  }

  return null;
}

// Cuerpo que se envía al servidor: los datos del formulario + el cliente vinculado + insumo1..insumo12.
export function armarPayloadOrden(orden, insumos, clienteSeleccionado) {
  const nombres = insumos.filter((i) => i.nombre.trim() !== "").map((i) => i.nombre);
  // Los adjuntos no viajan con la OT: se suben aparte (ver useAdjuntosOrden)
  const { adjuntosAntiguos, ...datos } = orden;
  const payload = { ...datos, clienteId: clienteSeleccionado?.id || null };
  for (let n = 1; n <= 12; n++) payload[`insumo${n}`] = nombres[n - 1] || "";
  return payload;
}
