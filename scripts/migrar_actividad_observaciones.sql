-- Migración: Agregar campos actividad y observaciones a ordenes_trabajo
-- Fecha: Julio 2026

ALTER TABLE ordenes_trabajo
  ADD COLUMN actividad TEXT AFTER tecnico_asignado,
  ADD COLUMN observaciones TEXT AFTER averia;
