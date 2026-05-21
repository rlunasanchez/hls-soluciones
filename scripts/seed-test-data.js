import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "backend", ".env") });

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "6498",
  database: process.env.DB_NAME || "soporte_tecnico_db",
  waitForConnections: true,
  connectionLimit: 5,
});

// ── Client data ──
const clientes = [
  { razon_social: "TechSolutions Chile SpA", giro: "Servicios informáticos", rut: "76.123.456-7", ciudad: "Santiago", comuna: "Las Condes", direccion: "Av. Apoquindo 4500, Of 301", telefono: "+562 2123 4500", contacto: "Carlos Muñoz", email: "carlos@techsolutions.cl", fono: "+569 8765 4321" },
  { razon_social: "Distribuidora del Sur Ltda", giro: "Distribución mayorista", rut: "77.234.567-8", ciudad: "Concepción", comuna: "San Pedro de la Paz", direccion: "Av. Los Carrera 1200", telefono: "+564 1234 5678", contacto: "María Soto", email: "maria@delsur.cl", fono: "+569 7654 3210" },
  { razon_social: "Minera Los Andes SA", giro: "Minería", rut: "78.345.678-9", ciudad: "Antofagasta", comuna: "Antofagasta", direccion: "Av. Grecia 550", telefono: "+565 2345 6789", contacto: "Pedro Ramírez", email: "pedro@mineraandes.cl", fono: "+569 6543 2109" },
  { razon_social: "Constructora Norte Grande EIRL", giro: "Construcción", rut: "79.456.789-0", ciudad: "Iquique", comuna: "Iquique", direccion: "Av. Arturo Prat 890", telefono: "+565 3456 7890", contacto: "Ana Torres", email: "ana@constructoranorte.cl", fono: "+569 5432 1098" },
  { razon_social: "Farmacias del Centro SA", giro: "Farmacéutico", rut: "80.567.890-1", ciudad: "Santiago", comuna: "Santiago Centro", direccion: "Huérfanos 1050", telefono: "+562 3456 7890", contacto: "Luis Vega", email: "luis@farmaciascentro.cl", fono: "+569 4321 0987" },
  { razon_social: "Agroindustria Verde SpA", giro: "Agroindustrial", rut: "81.678.901-2", ciudad: "Rancagua", comuna: "Rancagua", direccion: "Av. Libertador 320", telefono: "+567 4567 8901", contacto: "Carmen Flores", email: "carmen@agroverde.cl", fono: "+569 3210 9876" },
  { razon_social: "Transportes Rápidos Ltda", giro: "Transporte", rut: "82.789.012-3", ciudad: "Valparaíso", comuna: "Viña del Mar", direccion: "Av. España 1500", telefono: "+563 4567 8901", contacto: "José Martínez", email: "jose@transportes.cl", fono: "+569 2109 8765" },
  { razon_social: "Clínica del Sur SA", giro: "Salud", rut: "83.890.123-4", ciudad: "Temuco", comuna: "Temuco", direccion: "Av. Alemania 800", telefono: "+564 5678 9012", contacto: "Dra. Patricia Ríos", email: "patricia@clinicasur.cl", fono: "+569 1098 7654" },
  { razon_social: "Hotel Plaza Mayor SA", giro: "Hotelería", rut: "84.901.234-5", ciudad: "Santiago", comuna: "Providencia", direccion: "Av. Providencia 2345", telefono: "+562 4567 8901", contacto: "Andrés López", email: "andres@hotelplaza.cl", fono: "+569 0987 6543" },
  { razon_social: "Imprenta Gráfica Rápida EIRL", giro: "Imprenta", rut: "85.012.345-6", ciudad: "Santiago", comuna: "Ñuñoa", direccion: "Av. Irarrázaval 3456", telefono: "+562 5678 9012", contacto: "Valeria Díaz", email: "valeria@graficarapida.cl", fono: "+569 9876 5432" },
  { razon_social: "Laboratorios Químicos del Pacífico SA", giro: "Químico", rut: "86.123.456-7", ciudad: "Valparaíso", comuna: "Valparaíso", direccion: "Av. Argentina 678", telefono: "+563 5678 9012", contacto: "Dr. Ricardo Mora", email: "ricardo@labpacifico.cl", fono: "+569 8765 4321" },
  { razon_social: "Comercial Muebles Finos SpA", giro: "Mueblería", rut: "87.234.567-8", ciudad: "Santiago", comuna: "La Florida", direccion: "Av. La Florida 7890", telefono: "+562 6789 0123", contacto: "Daniela Pino", email: "daniela@mueblesfinos.cl", fono: "+569 7654 3210" },
  { razon_social: "Pesquera del Sur Ltda", giro: "Pesquero", rut: "88.345.678-9", ciudad: "Puerto Montt", comuna: "Puerto Montt", direccion: "Av. Diego Portales 450", telefono: "+566 5678 9012", contacto: "Francisco Vera", email: "francisco@pesquerasur.cl", fono: "+569 6543 2109" },
  { razon_social: "Inmobiliaria Nuevo Hogar SA", giro: "Inmobiliaria", rut: "89.456.789-0", ciudad: "Santiago", comuna: "Las Condes", direccion: "Av. Vitacura 5600", telefono: "+562 7890 1234", contacto: "Gabriela Silva", email: "gabriela@nuevohogar.cl", fono: "+569 5432 1098" },
  { razon_social: "Taller Mecánico Rápido EIRL", giro: "Mecánica", rut: "90.567.890-1", ciudad: "Santiago", comuna: "Maipú", direccion: "Av. Pajaritos 3200", telefono: "+562 8901 2345", contacto: "Roberto Castro", email: "roberto@tallermecanico.cl", fono: "+569 4321 0987" },
  { razon_social: "Estudio Jurídico Muñoz & Cía", giro: "Servicios legales", rut: "91.678.901-2", ciudad: "Santiago", comuna: "Santiago Centro", direccion: "Agustinas 1200, Piso 8", telefono: "+562 9012 3456", contacto: "Marcela Muñoz", email: "marcela@estudiojuridico.cl", fono: "+569 3210 9876" },
  { razon_social: "Panadería La Espiga de Oro SA", giro: "Panadería", rut: "92.789.012-3", ciudad: "Santiago", comuna: "San Miguel", direccion: "Av. Gran Avenida 5600", telefono: "+562 0123 4567", contacto: "Jorge Alarcón", email: "jorge@espigadeoro.cl", fono: "+569 2109 8765" },
  { razon_social: "Colegio San Andrés Ltda", giro: "Educación", rut: "93.890.123-4", ciudad: "Santiago", comuna: "La Reina", direccion: "Av. Príncipe de Gales 4567", telefono: "+562 1234 5678", contacto: "Prof. Marta Lagos", email: "marta@colsandres.cl", fono: "+569 1098 7654" },
  { razon_social: "Automotriz del Valle SA", giro: "Automotriz", rut: "94.901.234-5", ciudad: "Rancagua", comuna: "Rancagua", direccion: "Av. Bernardo O'Higgins 2500", telefono: "+567 6789 0123", contacto: "Cristián Rojas", email: "cristian@automotrizvalle.cl", fono: "+569 0987 6543" },
  { razon_social: "Empresa Eléctrica del Norte SA", giro: "Generación eléctrica", rut: "95.012.345-6", ciudad: "Calama", comuna: "Calama", direccion: "Av. Granaderos 120", telefono: "+565 7890 1234", contacto: "Hugo Pizarro", email: "hugo@electricanorte.cl", fono: "+569 9876 5432" },
  { razon_social: "Centro Médico Salud Total SpA", giro: "Salud", rut: "96.123.456-7", ciudad: "Santiago", comuna: "Providencia", direccion: "Av. Manuel Montt 1800", telefono: "+562 2345 6789", contacto: "Dr. Sergio Valdés", email: "sergio@saludtotal.cl", fono: "+569 8765 4321" },
  { razon_social: "Viña del Mar Turismo Ltda", giro: "Turismo", rut: "97.234.567-8", ciudad: "Viña del Mar", comuna: "Viña del Mar", direccion: "Av. San Martín 500", telefono: "+563 7890 1234", contacto: "Claudia Olivares", email: "claudia@vinaturismo.cl", fono: "+569 7654 3210" },
  { razon_social: "Ferretería El Constructor SA", giro: "Ferretería", rut: "98.345.678-9", ciudad: "Santiago", comuna: "Estación Central", direccion: "Av. Libertador 5000", telefono: "+562 3456 7890", contacto: "Patricio Soto", email: "patricio@ferreteria.cl", fono: "+569 6543 2109" },
  { razon_social: "Tecnología Médica del Sur SA", giro: "Tecnología médica", rut: "99.456.789-0", ciudad: "Concepción", comuna: "Concepción", direccion: "Av. Paicaví 2300", telefono: "+564 7890 1234", contacto: "Ing. Karen Díaz", email: "karen@tecmedsur.cl", fono: "+569 5432 1098" },
  { razon_social: "Distribuidora de Alimentos Miramar Ltda", giro: "Alimentos", rut: "60.567.890-1", ciudad: "Valparaíso", comuna: "Valparaíso", direccion: "Av. Colón 3400", telefono: "+563 8901 2345", contacto: "Fernando Lara", email: "fernando@alimentosmiramar.cl", fono: "+569 4321 0987" },
  { razon_social: "Seguros del Sur SA", giro: "Seguros", rut: "61.678.901-2", ciudad: "Santiago", comuna: "Las Condes", direccion: "Av. Isidora Goyenechea 3000", telefono: "+562 4567 8901", contacto: "Andrea Bascur", email: "andrea@segurossur.cl", fono: "+569 3210 9876" },
  { razon_social: "Restaurante El Buen Sabor SpA", giro: "Restaurante", rut: "62.789.012-3", ciudad: "Santiago", comuna: "Bellavista", direccion: "Av. Pío Nono 450", telefono: "+562 5678 9012", contacto: "César Tapia", email: "cesar@buensabor.cl", fono: "+569 2109 8765" },
  { razon_social: "Gimnasio Fitness Total EIRL", giro: "Gimnasio", rut: "63.890.123-4", ciudad: "Santiago", comuna: "Ñuñoa", direccion: "Av. Irarrázaval 4500", telefono: "+562 6789 0123", contacto: "Tamara Rivas", email: "tamara@fitnesstotal.cl", fono: "+569 1098 7654" },
  { razon_social: "Consultoría Estratégica SpA", giro: "Consultoría", rut: "64.901.234-5", ciudad: "Santiago", comuna: "El Golf", direccion: "Av. El Bosque Sur 850", telefono: "+562 7890 1234", contacto: "Mauricio Palma", email: "mauricio@consultora.cl", fono: "+569 0987 6543" },
  { razon_social: "Reciclajes Industriales Chile SA", giro: "Reciclaje", rut: "65.012.345-6", ciudad: "Santiago", comuna: "Quilicura", direccion: "Av. Américo Vespucio 5600", telefono: "+562 8901 2345", contacto: "Nelson Fuentes", email: "nelson@reciclaje.cl", fono: "+569 9876 5432" },
  { razon_social: "Sociedad Minera del Cobre SpA", giro: "Minería", rut: "66.123.456-7", ciudad: "Calama", comuna: "Calama", direccion: "Av. Chacabuco 450", telefono: "+565 9012 3456", contacto: "Raúl Vega", email: "raul@mineracobre.cl", fono: "+569 8765 4321" },
  { razon_social: "Bodegas del Valle Central SA", giro: "Vitivinícola", rut: "67.234.567-8", ciudad: "Rancagua", comuna: "Rancagua", direccion: "Av. Bernardo O'Higgins 3100", telefono: "+567 0123 4567", contacto: "Sofía Martínez", email: "sofia@bodegasvalle.cl", fono: "+569 7654 3210" },
  { razon_social: "Logística Express Ltda", giro: "Logística", rut: "68.345.678-9", ciudad: "Santiago", comuna: "San Bernardo", direccion: "Av. Portales 2300", telefono: "+562 1234 5678", contacto: "Ignacio Cruz", email: "ignacio@logisticaexpress.cl", fono: "+569 6543 2109" },
  { razon_social: "Clínica Dental Care SpA", giro: "Salud dental", rut: "69.456.789-0", ciudad: "Santiago", comuna: "Providencia", direccion: "Av. Suecia 350", telefono: "+562 2345 6789", contacto: "Dra. Paula Ríos", email: "paula@dentalcare.cl", fono: "+569 5432 1098" },
  { razon_social: "Automotriz del Sur SA", giro: "Automotriz", rut: "70.567.890-1", ciudad: "Concepción", comuna: "Concepción", direccion: "Av. Arturo Prat 1500", telefono: "+564 3456 7890", contacto: "Diego Fuentes", email: "diego@automotrizsur.cl", fono: "+569 4321 0987" },
  { razon_social: "Comercial Textil Andina SpA", giro: "Textil", rut: "71.678.901-2", ciudad: "Santiago", comuna: "Santiago Centro", direccion: "Herreros 850", telefono: "+562 4567 8901", contacto: "Laura Campos", email: "laura@textilandina.cl", fono: "+569 3210 9876" },
  { razon_social: "Empresa Portuaria del Pacífico SA", giro: "Portuario", rut: "72.789.012-3", ciudad: "Valparaíso", comuna: "Valparaíso", direccion: "Av. Altamirano 2500", telefono: "+563 5678 9012", contacto: "Capitán Mauricio Soto", email: "mauricio@portuariopacifico.cl", fono: "+569 2109 8765" },
  { razon_social: "Constructora Viviendas del Sur Ltda", giro: "Construcción", rut: "73.890.123-4", ciudad: "Temuco", comuna: "Temuco", direccion: "Av. Pablo Neruda 1200", telefono: "+564 6789 0123", contacto: "Héctor Muñoz", email: "hector@vivsur.cl", fono: "+569 1098 7654" },
  { razon_social: "Farmacias Cruz del Norte SA", giro: "Farmacéutico", rut: "74.901.234-5", ciudad: "Antofagasta", comuna: "Antofagasta", direccion: "Av. Argentina 1800", telefono: "+565 6789 0123", contacto: "Marcelo Rojas", email: "marcelo@cruznorte.cl", fono: "+569 0987 6543" },
  { razon_social: "Inversiones y Servicios del Maule SpA", giro: "Inversiones", rut: "75.012.345-6", ciudad: "Talca", comuna: "Talca", direccion: "Av. San Miguel 600", telefono: "+567 8901 2345", contacto: "Carmen Díaz", email: "carmen@inversionesmaule.cl", fono: "+569 9876 5432" },
  { razon_social: "Hotel & Spa Termas del Sur SA", giro: "Hotelería", rut: "66.789.012-3", ciudad: "Puerto Varas", comuna: "Puerto Varas", direccion: "Ruta 5 Sur Km 950", telefono: "+566 7890 1234", contacto: "Carolina Vega", email: "carolina@termasur.cl", fono: "+569 8765 4321" },
  { razon_social: "Distribuidora Industrial del Norte EIRL", giro: "Distribución", rut: "67.890.123-4", ciudad: "Iquique", comuna: "Iquique", direccion: "Av. Circunvalación 1200", telefono: "+565 8901 2345", contacto: "Felipe Rojas", email: "felipe@industrialnorte.cl", fono: "+569 7654 3210" },
  { razon_social: "Centro de Estudios Técnicos SpA", giro: "Educación", rut: "68.901.234-5", ciudad: "Santiago", comuna: "Ñuñoa", direccion: "Av. Irarrázaval 3450", telefono: "+562 7890 1234", contacto: "Prof. Roberto Muñoz", email: "roberto@cet.cl", fono: "+569 6543 2109" },
  { razon_social: "Metalúrgica del Sur Ltda", giro: "Metalurgia", rut: "69.012.345-6", ciudad: "Concepción", comuna: "Concepción", direccion: "Av. Pedro de Valdivia 2800", telefono: "+564 9012 3456", contacto: "Mario Gutiérrez", email: "mario@metalurgicasur.cl", fono: "+569 5432 1098" },
  { razon_social: "Transportes del Valle Central SA", giro: "Transporte", rut: "70.123.456-7", ciudad: "Rancagua", comuna: "Rancagua", direccion: "Av. La Compañía 1500", telefono: "+567 0123 4567", contacto: "Patricia González", email: "patricia@transportevalle.cl", fono: "+569 4321 0987" },
  { razon_social: "Restaurante Mariscos del Pacífico EIRL", giro: "Restaurante", rut: "71.234.567-8", ciudad: "Viña del Mar", comuna: "Viña del Mar", direccion: "Av. Perú 1200, Local 5", telefono: "+563 1234 5678", contacto: "Ricardo Palma", email: "ricardo@mariscospacifico.cl", fono: "+569 3210 9876" },
  { razon_social: "Tecnologías de Información del Sur SA", giro: "Tecnología", rut: "72.345.678-9", ciudad: "Santiago", comuna: "Las Condes", direccion: "Av. Apoquindo 4000, Piso 12", telefono: "+562 9012 3456", contacto: "Ing. Andrea Soto", email: "andrea@tisur.cl", fono: "+569 2109 8765" },
  { razon_social: "Comercial Agropecuaria del Sur Ltda", giro: "Agropecuario", rut: "73.456.789-0", ciudad: "Temuco", comuna: "Temuco", direccion: "Av. Alemania 2100", telefono: "+564 1234 5678", contacto: "Samuel Treuer", email: "samuel@agrosur.cl", fono: "+569 1098 7654" },
  { razon_social: "Seguros y Corredores de Bolsa del Pacífico SA", giro: "Corredora de seguros", rut: "74.567.890-1", ciudad: "Santiago", comuna: "Las Condes", direccion: "Av. El Bosque Norte 500", telefono: "+562 2345 6789", contacto: "Valentina Espinoza", email: "valentina@segurospacifico.cl", fono: "+569 0987 6543" },
  { razon_social: "Energías Renovables del Norte SpA", giro: "Energía", rut: "75.678.901-2", ciudad: "Calama", comuna: "Calama", direccion: "Av. Granaderos 2200", telefono: "+565 7890 1234", contacto: "Tomás Silva", email: "tomas@enernorte.cl", fono: "+569 9876 5432" },
];

// ── Equipment definitions ──
const equiposDef = [
  { equipo: "Impresora Láser", modelo: "LBP-2900B", marca: "Canon" },
  { equipo: "Impresora Láser", modelo: "M404dn", marca: "HP" },
  { equipo: "Impresora Láser", modelo: "P2650dw", marca: "Brother" },
  { equipo: "Impresora Láser", modelo: "MB-2720", marca: "OKI" },
  { equipo: "Impresora Láser", modelo: "M203dw", marca: "HP" },
  { equipo: "Impresora Láser", modelo: "MFP M227fdw", marca: "HP" },
  { equipo: "Impresora Láser", modelo: "MC-363", marca: "OKI" },
  { equipo: "Impresora Láser", modelo: "LBP-6650dn", marca: "Canon" },
  { equipo: "Impresora Láser", modelo: "HL-L2370DW", marca: "Brother" },
  { equipo: "Impresora Multifuncional", modelo: "MFC-L2710DW", marca: "Brother" },
  { equipo: "Impresora Multifuncional", modelo: "LaserJet Pro MFP M428fdw", marca: "HP" },
  { equipo: "Impresora Multifuncional", modelo: "ImageClass MF-744Cdw", marca: "Canon" },
  { equipo: "Impresora Multifuncional", modelo: "MC-853dn", marca: "OKI" },
  { equipo: "Impresora Multifuncional", modelo: "MFC-J6545DW", marca: "Brother" },
  { equipo: "Impresora Multifuncional", modelo: "Smart Tank 515", marca: "HP" },
  { equipo: "Impresora Multifuncional", modelo: "G3110", marca: "Canon" },
  { equipo: "Impresora Matricial", modelo: "DOT-Matrix 590", marca: "Epson" },
  { equipo: "Impresora Matricial", modelo: "FX-2190II", marca: "Epson" },
  { equipo: "Impresora Térmica", modelo: "TSP-143", marca: "Star" },
  { equipo: "Impresora Térmica", modelo: "TM-T20X", marca: "Epson" },
  { equipo: "Notebook", modelo: "ThinkPad X1 Carbon", marca: "Lenovo" },
  { equipo: "Notebook", modelo: "Latitude 3540", marca: "Dell" },
  { equipo: "Notebook", modelo: "Pavilion 14", marca: "HP" },
  { equipo: "Escritorio", modelo: "OptiPlex 7080", marca: "Dell" },
  { equipo: "Escritorio", modelo: "ThinkCentre M720q", marca: "Lenovo" },
  { equipo: "Monitor", modelo: "27GL850-B", marca: "LG" },
  { equipo: "Monitor", modelo: "P2721Q", marca: "Dell" },
  { equipo: "Servidor", modelo: "PowerEdge T340", marca: "Dell" },
  { equipo: "Servidor", modelo: "ThinkSystem SR250", marca: "Lenovo" },
  { equipo: "Switch", modelo: "SG-250-10", marca: "Cisco" },
  { equipo: "Router", modelo: "RV340", marca: "Cisco" },
  { equipo: "Firewall", modelo: "FortiGate 60F", marca: "Fortinet" },
  { equipo: "UPS", modelo: "BX1500M", marca: "APC" },
  { equipo: "Escáner", modelo: "iS1000", marca: "Fujitsu" },
  { equipo: "Fotocopiadora", modelo: "eStudio 3029AC", marca: "Toshiba" },
  { equipo: "Fotocopiadora", modelo: "D-COP 2500MF", marca: "Develop" },
  { equipo: "Tablet", modelo: "Tab S9 FE", marca: "Samsung" },
  { equipo: "Proyector", modelo: "EB-U50", marca: "Epson" },
  { equipo: "Impresora Plotter", modelo: "DesignJet T830", marca: "HP" },
  { equipo: "Impresora Láser Color", modelo: "CLP-775ND", marca: "Samsung" },
];

// ── Distribución: 40 equipos para 30 clientes ──
// Clientes 1-20: 1 equipo / Clientes 21-30: 2 equipos
const distribucion = [];
for (let i = 0; i < 20; i++) distribucion.push(i + 1);
for (let i = 0; i < 10; i++) { distribucion.push(21 + i); distribucion.push(21 + i); }

// ── OT technicians and status ──
const tecnicos = ["Roberto Muñoz", "Carolina Vega", "Felipe Rojas", "Daniela Soto", "Esteban Castro"];
const averias = [
  "No enciende el equipo",
  "Atasco de papel frecuente",
  "Error 5200 en pantalla",
  "Impresión con rayas verticales",
  "No reconoce el cartucho",
  "Ruido anormal al imprimir",
  "Se apaga repentinamente",
  "Pantalla azul al iniciar",
  "Problemas de conexión WiFi",
  "Bajo rendimiento general",
  "No imprime en color",
  "El escáner no funciona",
  "Tóner se derrama",
  "Falla en la alimentación de papel",
  "Sobrecalentamiento",
  "Lento al procesar trabajos",
  "Error de comunicación USB",
  "No carga el sistema operativo",
  "Teclado no responde",
  "Batería no carga",
];

async function seed() {
  const connection = await pool.getConnection();

  try {
    // ── Insert clientes ──
    console.log("Insertando clientes...");
    for (let i = 0; i < clientes.length; i++) {
      const c = clientes[i];
      const codigo = `CL-${String(i + 1).padStart(4, "0")}`;
      await connection.query(
        `INSERT IGNORE INTO clientes (codigo, razon_social, giro, rut, direccion, ciudad, comuna, telefono, contacto_nombre, contacto_email, contacto_fono, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [codigo, c.razon_social, c.giro, c.rut, c.direccion, c.ciudad, c.comuna,
         c.telefono, c.contacto, c.email, c.fono]
      );
    }
    console.log(`  ${clientes.length} clientes procesados`);

    // ── Obtener IDs reales de clientes por código ──
    const codes = clientes.map((_, i) => `CL-${String(i + 1).padStart(4, "0")}`);
    const [clientesDb] = await connection.query(
      `SELECT id, codigo FROM clientes WHERE codigo IN (${codes.map(() => "?").join(",")}) ORDER BY codigo`,
      codes
    );
    const idPorCode = {};
    clientesDb.forEach(r => { idPorCode[r.codigo] = r.id; });
    console.log(`  IDs reales: ${JSON.stringify(idPorCode)}`);

    // ── Insert equipos ──
    console.log("Insertando equipos...");
    for (let i = 0; i < equiposDef.length; i++) {
      const e = equiposDef[i];
      const codigo = `EQ-${String(i + 1).padStart(4, "0")}`;
      const cliCode = `CL-${String(distribucion[i]).padStart(4, "0")}`;
      const clienteId = idPorCode[cliCode];
      const serie = `${e.marca.substring(0, 3).toUpperCase()}-${String(1000 + i)}-${String(i + 1).padStart(2, "0")}`;
      await connection.query(
        `INSERT IGNORE INTO equipos (codigo, cliente_id, equipo, modelo, marca, serie, contador_pag, nivel_tintas, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [codigo, clienteId, e.equipo, e.modelo, e.marca, serie,
         Math.floor(Math.random() * 50000) + 1000,
         ["Alto", "Medio", "Bajo", "Crítico"][Math.floor(Math.random() * 4)]]
      );
    }
    console.log(`  ${equiposDef.length} equipos procesados`);

    // ── Obtener IDs reales de equipos por código ──
    const eqCodes = equiposDef.map((_, i) => `EQ-${String(i + 1).padStart(4, "0")}`);
    const [equiposDb] = await connection.query(
      `SELECT id, codigo FROM equipos WHERE codigo IN (${eqCodes.map(() => "?").join(",")}) ORDER BY codigo`,
      eqCodes
    );
    const idEqPorCode = {};
    equiposDb.forEach(r => { idEqPorCode[r.codigo] = r.id; });

    // ── Insert ordenes de trabajo ──
    console.log("Insertando órdenes de trabajo...");
    const year = new Date().getFullYear();
    for (let i = 0; i < equiposDef.length; i++) {
      const numOrden = `OT-${year}-${String(i + 1).padStart(4, "0")}`;
      const cliCode = `CL-${String(distribucion[i]).padStart(4, "0")}`;
      const clienteId = idPorCode[cliCode];
      const eqCode = `EQ-${String(i + 1).padStart(4, "0")}`;
      const equipoId = idEqPorCode[eqCode];
      const c = clientes[distribucion[i] - 1];
      const e = equiposDef[i];
      const tecnico = tecnicos[Math.floor(Math.random() * tecnicos.length)];
      const averia = averias[Math.floor(Math.random() * averias.length)];
      const esGarantia = Math.random() > 0.7 ? 1 : 0;
      const diasAtras = Math.floor(Math.random() * 60);
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - diasAtras);
      const fechaStr = fecha.toISOString().split("T")[0];
      const fechaIngreso = new Date(fecha);
      fechaIngreso.setDate(fechaIngreso.getDate() - Math.floor(Math.random() * 3));
      const fechaTermino = esGarantia ? fecha : null;

      await connection.query(
        `INSERT IGNORE INTO ordenes_trabajo (numero_orden, fecha, es_garantia, fecha_ingreso, fecha_ingreso_check,
          fecha_termino, fecha_termino_check, cliente, direccion, comuna, contacto, fono_principal,
          tecnico_asignado, equipo, modelo, marca, serie, contador_pag_out, nivel_tinta, averia,
          cliente_id, equipo_id)
         VALUES (?, ?, ?, ?, 1, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [numOrden, fechaStr, esGarantia,
         fechaIngreso.toISOString().split("T")[0],
         fechaTermino ? fechaTermino.toISOString().split("T")[0] : null,
         c.razon_social, c.direccion, c.comuna,
         c.contacto, c.fono, tecnico,
         e.equipo, e.modelo, e.marca,
         `${e.marca.substring(0, 3).toUpperCase()}-${String(1000 + i)}-${String(i + 1).padStart(2, "0")}`,
         String(Math.floor(Math.random() * 50000) + 1000),
         ["Alto", "Medio", "Bajo", "Crítico"][Math.floor(Math.random() * 4)],
         averia, clienteId, equipoId]
      );
    }
    console.log(`  ${equiposDef.length} órdenes procesadas`);
    console.log("\n✅ Datos de prueba insertados correctamente");

    // Verificar
    const [counts] = await connection.query(`
      SELECT (SELECT COUNT(*) FROM clientes) as clientes,
             (SELECT COUNT(*) FROM equipos) as equipos,
             (SELECT COUNT(*) FROM ordenes_trabajo) as ot`);
    console.log(`Total: ${counts[0].clientes} clientes, ${counts[0].equipos} equipos, ${counts[0].ot} OT`);
  } catch (err) {
    console.error("Error:", err.message);
    await connection.rollback();
  } finally {
    connection.release();
    pool.end();
  }
}

seed();
