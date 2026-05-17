-- ============================================
-- SCHEMA POSTGRESQL PARA HLS SOLUCIONES
-- ============================================

-- Tabla clientes
CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE,
  razon_social VARCHAR(255) NOT NULL,
  giro VARCHAR(100),
  rut VARCHAR(20),
  direccion VARCHAR(255),
  ciudad VARCHAR(100),
  comuna VARCHAR(100),
  telefono VARCHAR(20),
  contacto_nombre VARCHAR(100),
  contacto_email VARCHAR(100),
  contacto_fono VARCHAR(20),
  contacto_cargo VARCHAR(100),
  contacto_direccion VARCHAR(255),
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla direcciones/sucursales de clientes
CREATE TABLE IF NOT EXISTS clientes_direcciones (
  id SERIAL PRIMARY KEY,
  cliente_id INT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo_direccion VARCHAR(50),
  direccion VARCHAR(255),
  fono VARCHAR(20),
  ciudad VARCHAR(100),
  comuna VARCHAR(100)
);

-- Tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  usuario VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(20) DEFAULT 'tecnico',
  email VARCHAR(100),
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla equipos (unificada: autocomplete + equipos de clientes)
CREATE TABLE IF NOT EXISTS equipos (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE,
  cliente_id INT REFERENCES clientes(id) ON DELETE SET NULL,
  equipo VARCHAR(100),
  modelo VARCHAR(100),
  marca VARCHAR(100),
  serie VARCHAR(100),
  contador_pag INT DEFAULT 0,
  nivel_tintas VARCHAR(50),
  insumo1 VARCHAR(100),
  insumo2 VARCHAR(100),
  insumo3 VARCHAR(100),
  insumo4 VARCHAR(100),
  insumo5 VARCHAR(100),
  insumo6 VARCHAR(100),
  insumo7 VARCHAR(100),
  insumo8 VARCHAR(100),
  insumo9 VARCHAR(100),
  insumo10 VARCHAR(100),
  insumo11 VARCHAR(100),
  insumo12 VARCHAR(100),
  averia VARCHAR(255),
  tipo VARCHAR(100),
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla órdenes de trabajo
CREATE TABLE IF NOT EXISTS ordenes_trabajo (
  id SERIAL PRIMARY KEY,
  numero_orden VARCHAR(50) NOT NULL UNIQUE,
  fecha DATE NOT NULL,
  es_garantia BOOLEAN DEFAULT FALSE,
  fecha_ingreso DATE,
  fecha_ingreso_check BOOLEAN DEFAULT FALSE,
  fecha_termino DATE,
  fecha_termino_check BOOLEAN DEFAULT FALSE,
  fecha_entrega DATE,
  fecha_entrega_check BOOLEAN DEFAULT FALSE,
  fecha_compra DATE,
  fecha_compra_check BOOLEAN DEFAULT FALSE,
  cliente VARCHAR(200) NOT NULL,
  direccion VARCHAR(300),
  comuna VARCHAR(100),
  contacto VARCHAR(200),
  fono_principal VARCHAR(50),
  tecnico_asignado VARCHAR(200) NOT NULL,
  actividad TEXT,
  equipo VARCHAR(100) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  marca VARCHAR(100) NOT NULL,
  serie VARCHAR(100),
  contador_pag_out VARCHAR(50),
  nivel_tinta VARCHAR(100),
  insumo1 VARCHAR(100),
  insumo2 VARCHAR(100),
  insumo3 VARCHAR(100),
  insumo4 VARCHAR(100),
  insumo5 VARCHAR(100),
  insumo6 VARCHAR(100),
  insumo7 VARCHAR(100),
  insumo8 VARCHAR(100),
  insumo9 VARCHAR(100),
  insumo10 VARCHAR(100),
  insumo11 VARCHAR(100),
  insumo12 VARCHAR(100),
  averia TEXT,
  cliente_id INT,
  equipo_id INT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ordenes_numero_orden ON ordenes_trabajo(numero_orden);
CREATE INDEX IF NOT EXISTS idx_ordenes_cliente ON ordenes_trabajo(cliente);
CREATE INDEX IF NOT EXISTS idx_ordenes_fecha ON ordenes_trabajo(fecha);
CREATE INDEX IF NOT EXISTS idx_ordenes_tecnico ON ordenes_trabajo(tecnico_asignado);

-- Usuario admin por defecto (password: admin123)
INSERT INTO usuarios (usuario, password, rol, email, activo)
VALUES ('admin', '$2b$10$aU9gGKL5F3GUHLjgA56FIOre7lBKK85wddtqaXROgflL/lT2BgEYG', 'admin', 'admin@test.com', true)
ON CONFLICT (usuario) DO NOTHING;

-- Equipos iniciales (catálogo autocomplete)
INSERT INTO equipos (tipo, marca, modelo) VALUES
('Impresora Termica', 'Sewoo', 'LK-T200'),
('Impresora Termica', 'Sewoo', 'LK-T300'),
('Impresora Matriz', 'Olivetti', 'PR2-PLUS'),
('Scanner', 'SmartSource', 'SSP1'),
('Lector de cheque', 'Uniform', '8310-50KR USB'),
('Impresora Laser', 'HP', 'LaserJet Pro'),
('Impresora Laser', 'Brother', 'HL-L2350DW'),
('Computador', 'Dell', 'Optiplex'),
('Computador', 'HP', 'ProDesk'),
('Monitor', 'Samsung', 'SyncMaster'),
('Monitor', 'LG', 'Flatron')
ON CONFLICT DO NOTHING;
