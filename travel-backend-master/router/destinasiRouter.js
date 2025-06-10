require("dotenv").config();
const db = require("../database/db");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // simpan di folder uploads/
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({ storage: storage });

router.get("/data", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM informasi_tempat");
    console.log(result);
    res.json(result.rows);
  } catch (error) {
    console.error("Error saat mengambil data:", error);
    res.status(500).json({ message: "Gagal mengambil data" });
  }
});

router.post("/post", upload.single("gambar"), async (req, res) => {
  const { nama, tempat, lokasi, deskripsi } = req.body;
  const gambar = req.file ? req.file.filename : null;

  try {
    const result = await db.query(
      `INSERT INTO informasi_tempat (nama, tempat, lokasi, gambar, deskripsi)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nama, tempat, lokasi, gambar, deskripsi]
    );

    res.status(201).json({
      message: "Data berhasil ditambahkan",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Gagal insert data:", error);
    res.status(500).json({ message: "Gagal menambahkan data" });
  }
});

router.put("/", (req, res) => {
  res.json(dataTempat);
});
router.delete("/", (req, res) => {
  res.json(dataTempat);
});

module.exports = router;
