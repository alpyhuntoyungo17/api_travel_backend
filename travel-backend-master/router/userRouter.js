require("dotenv").config();
const express = require("express");
const router = express.Router();
const db = require("../database/db");

// Ambil semua data user
router.get("/get", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (error) {
    console.error("Gagal mengambil data user:", error);
    res.status(500).json({ message: "Gagal mengambil data user" });
  }
});


router.get("/get/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "user tidak ditemukan" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error saat mengambil user berdasarkan ID:", error);
    res.status(500).json({ message: "Gagal mengambil user" });
  }
});


// Tambahkan user baru
router.post("/add", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *`,
      [username, email, password]
    );
    res.status(201).json({
      message: "User berhasil ditambahkan",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Gagal menambahkan user:", error);
    res.status(500).json({ message: "Gagal menambahkan user" });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await database.query(
      "SELECT * FROM users WHERE username = $2 AND password = $4",
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Username atau password salah" });
    }

    res.json({
      message: "Login berhasil",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Gagal login:", err);
    res.status(500).send("Terjadi kesalahan saat login");
  }
});

// Update user
router.put("/put/:id", async (req, res) => {
  const { id } = req.params;
  const { username, email, password } = req.body;

  try {
    const result = await db.query(
      `UPDATE users SET username = $1, email = $2, password = $3 WHERE id = $4 RETURNING *`,
      [username, email, password, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    res.json({
      message: "User berhasil diperbarui",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Gagal memperbarui user:", error);
    res.status(500).json({ message: "Gagal memperbarui user" });
  }
});

// Hapus user
router.delete("/dlt/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query("DELETE FROM users WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    res.json({
      message: "User berhasil dihapus",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Gagal menghapus user:", error);
    res.status(500).json({ message: "Gagal menghapus user" });
  }
});

module.exports = router;
