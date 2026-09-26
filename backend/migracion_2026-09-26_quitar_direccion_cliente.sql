-- clientes.direccion/ciudad/comuna: la dirección ya no vive en Cliente, se busca en el mantenedor
-- de Direcciones desde la OT/Cotización (2026-09-26, solo main / MySQL local).
-- Hacer respaldo antes (mysqldump). Falla si alguna columna ya no existe.
ALTER TABLE clientes
  DROP COLUMN direccion,
  DROP COLUMN ciudad,
  DROP COLUMN comuna;
