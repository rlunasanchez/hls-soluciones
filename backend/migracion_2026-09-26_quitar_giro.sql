-- clientes.giro: el formulario lo tenía oculto y nada lo lee ni lo escribe (2026-09-26, solo main / MySQL local).
-- Hacer respaldo antes (mysqldump). Falla si la columna ya no existe.
ALTER TABLE clientes DROP COLUMN giro;
