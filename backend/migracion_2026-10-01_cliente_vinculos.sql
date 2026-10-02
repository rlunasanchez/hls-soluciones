-- Vínculos Cliente <-> Contactos / Direcciones (muchos a muchos).
-- Solo crea tablas vacías: NO migra ni modifica datos existentes.
-- Contactos y Direcciones siguen siendo catálogos globales; un mismo contacto
-- o dirección puede estar vinculado a varios clientes. Seguro de repetir.
-- "orden" conserva el orden de la lista. "a_ot" = 1 marca el contacto/dirección que viaja a la OT
-- (uno por cliente y por tabla; ninguno marcado = la OT pregunta).

CREATE TABLE IF NOT EXISTS cliente_contactos (
  cliente_id INT NOT NULL,
  contacto_id INT NOT NULL,
  orden INT NOT NULL DEFAULT 0,
  a_ot TINYINT(1) NOT NULL DEFAULT 0,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (cliente_id, contacto_id),
  INDEX idx_cc_contacto (contacto_id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  FOREIGN KEY (contacto_id) REFERENCES contactos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cliente_direcciones (
  cliente_id INT NOT NULL,
  direccion_id INT NOT NULL,
  orden INT NOT NULL DEFAULT 0,
  a_ot TINYINT(1) NOT NULL DEFAULT 0,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (cliente_id, direccion_id),
  INDEX idx_cd_direccion (direccion_id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  FOREIGN KEY (direccion_id) REFERENCES direcciones(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
