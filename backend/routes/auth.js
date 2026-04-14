import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

dotenv.config();

const router = express.Router();

router.post("/login", async (req, res) => {
  const { usuario, password } = req.body;

  try {
    const [users] = await pool.query(
      "SELECT * FROM usuarios WHERE usuario = ? AND activo = true",
      [usuario]
    );

    if (users.length === 0) {
      return res.status(401).json({ msg: "Usuario no encontrado o inactivo" });
    }

    const user = users[0];
    const passwordValido = await bcrypt.compare(password, user.password);

    if (passwordValido) {
      const token = jwt.sign(
        { usuario: user.usuario, rol: user.rol },
        process.env.JWT_SECRET || "clave_secreta",
        { expiresIn: "8h" }
      );

      return res.json({ token });
    }

    res.status(401).json({ msg: "Credenciales incorrectas" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.post("/registrar", authMiddleware, async (req, res) => {
  const { usuario, password, rol, email } = req.body;

  try {
    const passwordEncriptada = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO usuarios (usuario, password, rol, email, activo) VALUES (?, ?, ?, ?, true)",
      [usuario, passwordEncriptada, rol || "tecnico", email || null]
    );

    res.status(201).json({ msg: "Usuario creado correctamente" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ msg: "El usuario ya existe" });
    }
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/cambiar-password", authMiddleware, async (req, res) => {
  const { usuario, passwordActual, nuevaPassword } = req.body;

  try {
    const [users] = await pool.query(
      "SELECT * FROM usuarios WHERE usuario = ?",
      [usuario]
    );

    if (users.length === 0) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    const user = users[0];
    const passwordValida = await bcrypt.compare(passwordActual, user.password);

    if (!passwordValida) {
      return res.status(401).json({ msg: "Contraseña actual incorrecta" });
    }

    const nuevaPasswordEncriptada = await bcrypt.hash(nuevaPassword, 10);

    await pool.query(
      "UPDATE usuarios SET password = ? WHERE usuario = ?",
      [nuevaPasswordEncriptada, usuario]
    );

    res.json({ msg: "Contraseña actualizada correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/usuarios", authMiddleware, async (req, res) => {
  try {
    const [usuarios] = await pool.query(
      "SELECT id, usuario, email, rol, activo, fecha_creacion FROM usuarios ORDER BY id DESC"
    );
    res.json(usuarios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/resetear-password/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { nuevaPassword } = req.body;

  try {
    const nuevaPasswordEncriptada = await bcrypt.hash(nuevaPassword, 10);

    await pool.query(
      "UPDATE usuarios SET password = ? WHERE id = ?",
      [nuevaPasswordEncriptada, id]
    );

    res.json({ msg: "Contraseña restablecida correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/activar-usuario/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;

  try {
    await pool.query(
      "UPDATE usuarios SET activo = ? WHERE id = ?",
      [activo ? true : false, id]
    );

    res.json({ msg: activo ? "Usuario activado" : "Usuario desactivado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.delete("/eliminar-usuario/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM usuarios WHERE id = ?", [id]);
    res.json({ msg: "Usuario eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/actualizar-usuario/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { usuario, rol, email } = req.body;

  try {
    await pool.query(
      "UPDATE usuarios SET usuario = ?, rol = ?, email = ? WHERE id = ?",
      [usuario, rol, email || null, id]
    );
    res.json({ msg: "Usuario actualizado correctamente" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ msg: "El usuario ya existe" });
    }
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

export default router;