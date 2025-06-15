require("dotenv").config();
const db = require("../database/db");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const claudinary = require('cloudinary').v2;
const fs = require("fs");

claudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, "_"); // hilangkan spasi
    const uniqueName = `${Date.now()}_${name}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage: storage });

router.get("/data", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM informasi_tampat");
    console.log(result);
    res.json(result.rows);
  } catch (error) {
    console.error("Error saat mengambil data:", error);
    res.status(500).json({ message: "Gagal mengambil data" });
  }
});

router.get("/data/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query("SELECT * FROM informasi_tampat WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error saat mengambil data berdasarkan ID:", error);
    res.status(500).json({ message: "Gagal mengambil data" });
  }
});

router.post("/post", upload.single("gambar"), async (req, res) => {
  const { nama, tempat, lokasi, deskripsi } = req.body;
  const gambar = req.file?.path;

  try {
    let cloudinaryData = null;

    if (gambar) {
      cloudinaryData = await claudinary.uploader.upload(gambar, {
        resource_type: "auto",
      });
      console.log(cloudinaryData);

      fs.unlinkSync(gambar);
    }
    let gambarData = cloudinaryData?.secure_url || null;

    const result = await db.query(
      `INSERT INTO informasi_tampat (nama, tempat, lokasi, gambar, deskripsi) VALUES ($1, $2, $3, $4, $5)`,
      [nama, tempat, lokasi, gambarData, deskripsi]
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

router.put("/data/:id", upload.single("gambar"), async (req, res) => {
  const { id } = req.params;
  const { nama, tempat, lokasi, deskripsi } = req.body;
  const gambar = req.file?.path;

  try {
    // Get current data first
    const currentData = await db.query("SELECT * FROM informasi_tampat WHERE id = $1", [id]);
    
    if (currentData.rows.length === 0) {
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }

    let gambarData = currentData.rows[0].gambar;

    // If new image is uploaded
    if (gambar) {
      // Upload new image to Cloudinary
      const cloudinaryData = await claudinary.uploader.upload(gambar, {
        resource_type: "auto",
      });
      
      // Delete the old image from Cloudinary if it exists
      if (gambarData) {
        const publicId = gambarData.split('/').pop().split('.')[0];
        await claudinary.uploader.destroy(publicId);
      }
      
      gambarData = cloudinaryData.secure_url;
      fs.unlinkSync(gambar);
    }

    const result = await db.query(
      `UPDATE informasi_tampat 
       SET nama = $1, tempat = $2, lokasi = $3, gambar = $4, deskripsi = $5 
       WHERE id = $6
       RETURNING *`,
      [nama, tempat, lokasi, gambarData, deskripsi, id]
    );

    res.json({
      message: "Data berhasil diperbarui",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Gagal update data:", error);
    res.status(500).json({ message: "Gagal memperbarui data" });
  }
});

router.delete("/data/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Get current data first to check if it exists and get image URL
    const currentData = await db.query("SELECT * FROM informasi_tampat WHERE id = $1", [id]);
    
    if (currentData.rows.length === 0) {
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }

    // Delete image from Cloudinary if it exists
    const gambarData = currentData.rows[0].gambar;
    if (gambarData) {
      const publicId = gambarData.split('/').pop().split('.')[0];
      await claudinary.uploader.destroy(publicId);
    }

    // Delete the record from database
    await db.query("DELETE FROM informasi_tampat WHERE id = $1", [id]);

    res.json({ message: "Data berhasil dihapus" });
  } catch (error) {
    console.error("Gagal menghapus data:", error);
    res.status(500).json({ message: "Gagal menghapus data" });
  }
});

module.exports = router;