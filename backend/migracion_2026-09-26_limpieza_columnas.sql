-- Limpieza de columnas que ningún código usa (auditoría 2026-09-26, solo main / MySQL local).
-- Correr una sola vez. Falla si alguna columna ya no existe (MySQL 8 no soporta DROP COLUMN IF EXISTS).
-- Hacer respaldo antes (mysqldump).

-- equipos: el mantenedor solo usa codigo, equipo, modelo, marca, serie.
-- Estas columnas no las escribe ni las lee nada (los datos de servicio viven en ordenes_trabajo).
ALTER TABLE equipos
  DROP COLUMN cliente_id,
  DROP COLUMN insumo1, DROP COLUMN insumo2, DROP COLUMN insumo3, DROP COLUMN insumo4,
  DROP COLUMN insumo5, DROP COLUMN insumo6, DROP COLUMN insumo7, DROP COLUMN insumo8,
  DROP COLUMN insumo9, DROP COLUMN insumo10, DROP COLUMN insumo11, DROP COLUMN insumo12,
  DROP COLUMN averia,
  DROP COLUMN actividad,
  DROP COLUMN observaciones,
  DROP COLUMN activo;

-- Estas tablas se borran con DELETE real y nunca se filtra por "activo".
ALTER TABLE clientes DROP COLUMN activo;
ALTER TABLE contactos DROP COLUMN activo;
ALTER TABLE direcciones DROP COLUMN activo;

-- No se tocan: usuarios.activo (se usa en Gestión de Usuarios) ni fecha_creacion/fecha_actualizacion.
