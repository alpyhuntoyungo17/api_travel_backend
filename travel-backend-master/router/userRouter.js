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

// Tambahkan user baru
router.post("/", async (req, res) => {
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

// Update user
router.put("/:id", async (req, res) => {
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
router.delete("/:id", async (req, res) => {
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
