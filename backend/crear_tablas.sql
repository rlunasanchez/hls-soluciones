-- Esquema MySQL de soporte_tecnico_db
-- Estado: identidad de equipos desacoplada (datos de servicio viven en ordenes_trabajo)

CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE,
  razon_social VARCHAR(255) NOT NULL,
  giro VARCHAR(100),
  rut VARCHAR(20),
  direccion VARCHAR(255),
  ciudad VARCHAR(100),
  comuna VARCHAR(100),
  telefono VARCHAR(20),
  email VARCHAR(100),
  contacto_nombre VARCHAR(100),
  contacto_email VARCHAR(100),
  contacto_fono VARCHAR(20),
  contacto_cargo VARCHAR(100),
  contacto_direccion VARCHAR(255),
  activo TINYINT(1) DEFAULT 1,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS clientes_contactos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  nombre VARCHAR(100),
  email VARCHAR(100),
  fono VARCHAR(20),
  cargo VARCHAR(100),
  direccion VARCHAR(255),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS clientes_direcciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  tipo_direccion VARCHAR(50),
  direccion VARCHAR(255),
  fono VARCHAR(20),
  ciudad VARCHAR(100),
  comuna VARCHAR(100),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS equipos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE,
  equipo VARCHAR(100) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  marca VARCHAR(100) NOT NULL,
  serie VARCHAR(100),
  activo TINYINT(1) DEFAULT 1,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ordenes_trabajo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero_orden VARCHAR(50) NOT NULL UNIQUE,
  fecha DATE NOT NULL,
  es_garantia TINYINT(1) DEFAULT 0,

  -- Fechas con checkbox
  fecha_ingreso DATE,
  fecha_ingreso_check TINYINT(1) DEFAULT 0,
  fecha_termino DATE,
  fecha_termino_check TINYINT(1) DEFAULT 0,
  fecha_entrega DATE,
  fecha_entrega_check TINYINT(1) DEFAULT 0,
  fecha_compra DATE,
  fecha_compra_check TINYINT(1) DEFAULT 0,

  -- Datos del Cliente (snapshot)
  cliente VARCHAR(200) NOT NULL,
  direccion VARCHAR(300),
  comuna VARCHAR(100),
  contacto VARCHAR(200),
  fono_contacto VARCHAR(50),
  email_contacto VARCHAR(100),
  fono_principal VARCHAR(50),
  email VARCHAR(100),
  tecnico_asignado VARCHAR(200) NOT NULL,
  actividad TEXT,

  -- Datos del Equipo (snapshot)
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

  averia TEXT,
  observaciones TEXT,

  -- Relaciones
  cliente_id INT,
  equipo_id INT,

  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_numero_orden (numero_orden),
  INDEX idx_cliente (cliente),
  INDEX idx_fecha (fecha),
  INDEX idx_tecnico (tecnico_asignado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol ENUM('admin','tecnico') DEFAULT 'tecnico',
  email VARCHAR(100),
  activo TINYINT(1) DEFAULT 1,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
