import api from "../services/api";

// Consultas puntuales de clientes al servidor (la OT ya no carga la lista completa).

// ¿Existe un cliente con ese RUT o esa razón social? -> { porRut, porNombre } (cada uno con
// { id, codigo, razon_social, rut } o null). Lanza error si no hay conexión.
export async function verificarCliente({ rut = "", razon_social = "" } = {}) {
  const { data } = await api.get("/api/clientes/verificar", { params: { rut, razon_social } });
  return data;
}

// Cliente (con su contacto y dirección de la OT) por id; null si no existe.
export async function clientePorId(id) {
  try {
    return (await api.get(`/api/clientes/${id}`)).data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
}

// Cliente al que pertenece una OT guardada: por id o, si ese id ya no existe (el cliente se borró y
// se registró de nuevo), por nombre. Devuelve { cliente, inactivo }: inactivo = la OT tiene cliente_id
// pero ya no hay ningún cliente que la represente. Sin conexión se trata como no encontrado.
export async function clienteDeOrden(orden) {
  try {
    let cliente = orden.cliente_id ? await clientePorId(orden.cliente_id) : null;
    if (!cliente && orden.cliente) {
      const { porNombre } = await verificarCliente({ razon_social: orden.cliente });
      if (porNombre) cliente = await clientePorId(porNombre.id);
    }
    return { cliente, inactivo: !cliente && !!orden.cliente_id };
  } catch {
    return { cliente: null, inactivo: !!orden.cliente_id };
  }
}
