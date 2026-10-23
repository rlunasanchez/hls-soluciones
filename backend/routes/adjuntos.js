import express from "express";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { LIMITES, coincideConTipo, validarNuevoAdjunto } from "../utils/limitesAdjuntos.js";

const router = express.Router();

// Lista los adjuntos de una orden (sin el archivo): GET /api/adjuntos?orden_id=N
router.get("/", authMiddleware, async (req, res) => {
  const ordenId = parseInt(req.query.orden_id, 10);
  if (!ordenId) return res.status(400).json({ msg: "Falta la orden" });
  try {
    const result = await pool.query(
      "SELECT id, orden_id, nombre, tipo, tamano, miniatura, fecha_creacion FROM orden_adjuntos WHERE orden_id = $1 ORDER BY id",
      [ordenId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

// Sube un archivo: { orden_id, nombre, tipo, base64, miniatura } (el base64 va sin el prefijo "data:...")
router.post("/", authMiddleware, async (req, res) => {
  const { orden_id, nombre, tipo, base64, miniatura } = req.body;
  const ordenId = parseInt(orden_id, 10);
  if (!ordenId || !nombre || !tipo || !base64) return res.status(400).json({ msg: "Datos incompletos" });
  try {
    const orden = await pool.query("SELECT id FROM ordenes_trabajo WHERE id = $1", [ordenId]);
    if (orden.rows.length === 0) return res.status(404).json({ msg: "Orden no encontrada" });

    const archivo = Buffer.from(String(base64), "base64");
    const existentes = await pool.query("SELECT tipo, tamano FROM orden_adjuntos WHERE orden_id = $1", [ordenId]);
    const problema = validarNuevoAdjunto({ tipo, bytes: archivo.length }, existentes.rows);
    if (problema) return res.status(400).json({ msg: problema });
    if (!coincideConTipo(archivo, tipo)) return res.status(400).json({ msg: "El contenido del archivo no corresponde a su tipo." });

    const mini = miniatura && String(miniatura).startsWith("data:image/") && String(miniatura).length <= LIMITES.maxMiniatura ? miniatura : null;
    const nombreFinal = String(nombre).slice(0, 255);
    const r = await pool.query(
      "INSERT INTO orden_adjuntos (orden_id, nombre, tipo, tamano, miniatura, archivo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [ordenId, nombreFinal, tipo, archivo.length, mini, archivo]
    );
    res.status(201).json({ id: r.rows[0].id, orden_id: ordenId, nombre: nombreFinal, tipo, tamano: archivo.length, miniatura: mini });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

// Baja el archivo (para ver o descargar): GET /api/adjuntos/:id/archivo
router.get("/:id/archivo", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(404).json({ msg: "Adjunto no encontrado" });
    const result = await pool.query("SELECT nombre, tipo, archivo FROM orden_adjuntos WHERE id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ msg: "Adjunto no encontrado" });
    const fila = result.rows[0];
    res.set("Content-Type", fila.tipo);
    res.set("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(fila.nombre)}`);
    res.send(fila.archivo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

// Los adjuntos antiguos (JSON base64 en ordenes_trabajo.adjunto) ya se pasaron a esta tabla: se vacía la columna.
router.post("/migrado", authMiddleware, async (req, res) => {
  const ordenId = parseInt(req.body.orden_id, 10);
  if (!ordenId) return res.status(400).json({ msg: "Falta la orden" });
  try {
    await pool.query("UPDATE ordenes_trabajo SET adjunto = NULL WHERE id = $1", [ordenId]);
    res.json({ msg: "Adjuntos antiguos migrados" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(404).json({ msg: "Adjunto no encontrado" });
    await pool.query("DELETE FROM orden_adjuntos WHERE id = $1", [id]);
    res.json({ msg: "Adjunto eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

export default router;
