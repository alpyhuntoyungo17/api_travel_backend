require("dotenv").config();
const express = require("express");
const router = express.Router();
const db = require("../database/db");
const multer = require("multer");
const path = require("path");
const cloudinary = require('cloudinary').v2;
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    const uniqueName = `${Date.now()}_${name}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage: storage });

// Get all events with city filtering
router.get("/get", async (req, res) => {
  const { city } = req.query;

  try {
    let query = "SELECT * FROM events";
    const params = [];
    
    if (city && city !== 'All') {
      query += " WHERE lokasi = $1";
      params.push(city);
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Failed to fetch events" });
  }
});

// Get single event by ID
router.get("/get/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query("SELECT * FROM events WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ message: "Failed to fetch event" });
  }
});

// Create new event
router.post("/add", upload.single("gambar"), async (req, res) => {
  const { nama, lokasi, deskripsi, tanggal, harga } = req.body;
  const gambar = req.file?.path;

  try {
    let cloudinaryData = null;

    if (gambar) {
      cloudinaryData = await cloudinary.uploader.upload(gambar, {
        resource_type: "auto",
      });
      fs.unlinkSync(gambar);
    }

    const result = await db.query(
      `INSERT INTO events (nama, lokasi, gambar, deskripsi, tanggal, harga)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        nama,
        lokasi,
        cloudinaryData?.secure_url || null,
        deskripsi,
        tanggal,
        parseFloat(harga) || 0
      ]
    );

    res.status(201).json({
      message: "Event created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Failed to create event:", error);
    res.status(500).json({ message: "Failed to create event" });
  }
});

// Update event
router.put("/update/:id", upload.single("gambar"), async (req, res) => {
  const { id } = req.params;
  const { nama, lokasi, deskripsi, tanggal, harga } = req.body;
  const gambar = req.file?.path;

  try {
    const currentData = await db.query("SELECT * FROM events WHERE id = $1", [id]);
    
    if (currentData.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    let gambarUrl = currentData.rows[0].gambar;

    if (gambar) {
      const cloudinaryData = await cloudinary.uploader.upload(gambar, {
        resource_type: "auto",
      });
      
      if (gambarUrl) {
        const publicId = gambarUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }
      
      gambarUrl = cloudinaryData.secure_url;
      fs.unlinkSync(gambar);
    }

    const result = await db.query(
      `UPDATE events 
       SET nama = $1, lokasi = $2, gambar = $3, deskripsi = $4, tanggal = $5, harga = $6
       WHERE id = $7
       RETURNING *`,
      [
        nama,
        lokasi,
        gambarUrl,
        deskripsi,
        tanggal,
        parseFloat(harga) || 0,
        id
      ]
    );

    res.json({
      message: "Event updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Failed to update event:", error);
    res.status(500).json({ message: "Failed to update event" });
  }
});

// Delete event
router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const currentData = await db.query("SELECT * FROM events WHERE id = $1", [id]);
    
    if (currentData.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    const gambarUrl = currentData.rows[0].gambar;
    if (gambarUrl) {
      const publicId = gambarUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await db.query("DELETE FROM events WHERE id = $1", [id]);

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Failed to delete event:", error);
    res.status(500).json({ message: "Failed to delete event" });
  }
});

module.exports = router;