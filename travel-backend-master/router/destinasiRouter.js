require("dotenv").config();
const db = require("../database/db");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const claudinary = require('cloudinary')

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

router.post("/post", upload.single("gambar"), async (req, res) => {
  const { nama, tempat, lokasi, deskripsi } = req.body;
  const gambar = req.file?.path;

  try {

      let cloudinaryData = null;

    if (gambar) {
      cloudinaryData = await cloudinary.uploader.upload(gambar, {
        resource_type: "auto",
      });
      // console.log(cloudinaryData);

      fs.unlinkSync(gambar);
    }
    let fileUrl = cloudinaryData?.secure_url || null;



    const result = await db.query(
      `INSERT INTO informasi_tampat (nama, tempat, lokasi, gambar, deskripsi)
       VALUES ($1, $2, $3, $4, $5)`,
      [nama, tempat, lokasi, fileUrl, deskripsi]
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
