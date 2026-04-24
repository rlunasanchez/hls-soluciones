-- Tabla de equipos para autocomplete
CREATE TABLE IF NOT EXISTS equipos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo VARCHAR(100) NOT NULL,
  marca VARCHAR(100) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar equipos iniciales
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
('Monitor', 'LG', 'Flatron');

-- ============================================
-- TABLA DE ÓRDENES DE TRABAJO
-- ============================================

CREATE TABLE IF NOT EXISTS ordenes_trabajo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Datos de la Orden
  numero_orden VARCHAR(50) NOT NULL UNIQUE,
  fecha DATE NOT NULL,
  es_garantia BOOLEAN DEFAULT FALSE,
  
  -- Fechas con checkbox
  fecha_ingreso DATE,
  fecha_ingreso_check BOOLEAN DEFAULT FALSE,
  fecha_termino DATE,
  fecha_termino_check BOOLEAN DEFAULT FALSE,
  fecha_entrega DATE,
  fecha_entrega_check BOOLEAN DEFAULT FALSE,
  fecha_compra DATE,
  fecha_compra_check BOOLEAN DEFAULT FALSE,
  
  -- Datos del Cliente
  cliente VARCHAR(200) NOT NULL,
  direccion VARCHAR(300),
  comuna VARCHAR(100),
  contacto VARCHAR(200),
  fono_principal VARCHAR(50),
  tecnico_asignado VARCHAR(200) NOT NULL,
  actividad TEXT,
  
  -- Datos del Equipo
  equipo VARCHAR(100) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  marca VARCHAR(100) NOT NULL,
  serie VARCHAR(100),
  contador_pag_out VARCHAR(50),
  nivel_tinta VARCHAR(100),
  
  -- Insumos (hasta 12)
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
  
  -- Avería/Falla/Incidencia
  averia TEXT,
  
  -- Relaciones (opcionales - si el cliente/equipo existen en sus tablas)
  cliente_id INT,
  equipo_id INT,
  
  -- Metadatos
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Índices para búsquedas frecuentes
  INDEX idx_numero_orden (numero_orden),
  INDEX idx_cliente (cliente),
  INDEX idx_fecha (fecha),
  INDEX idx_tecnico (tecnico_asignado)
);