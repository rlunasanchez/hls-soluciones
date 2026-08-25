import api from "./api";

// Cache en memoria para GET de listados (clientes, equipos, órdenes).
// Objetivo: al volver a un mantenedor ya visitado, los datos se pintan
// al instante en vez de re-pedir todo el dataset a cada cambio de página.
//
// - TTL corto (por defecto 60s) como red de seguridad ante cambios hechos
//   por otro usuario; la frescura real la da invalidar(), llamada automáticamente
//   por el interceptor de api.js después de cada escritura (POST/PUT/DELETE).
// - Deduplica requests en vuelo para la misma URL (p. ej. si dos componentes
//   piden /api/clientes casi al mismo tiempo, solo se dispara un GET).

const DEFAULT_MAX_AGE = 60_000;

const store = new Map(); // url -> { data, ts }
const inflight = new Map(); // url -> Promise<{ data }>

export async function getCached(url, { signal, maxAge = DEFAULT_MAX_AGE } = {}) {
  const entrada = store.get(url);
  if (entrada && Date.now() - entrada.ts < maxAge) {
    // Hit de cache: no hay request de por medio, no hay nada que abortar.
    return { data: entrada.data };
  }

  if (inflight.has(url)) {
    return inflight.get(url);
  }

  const promesa = api
    .get(url, { signal })
    .then((res) => {
      store.set(url, { data: res.data, ts: Date.now() });
      return res;
    })
    .finally(() => {
      inflight.delete(url);
    });

  inflight.set(url, promesa);
  return promesa;
}

// Borra del cache toda entrada cuya URL empiece con `prefijo` (ej: "/api/clientes").
export function invalidar(prefijo) {
  for (const url of store.keys()) {
    if (url.startsWith(prefijo)) store.delete(url);
  }
}
