require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: {
  //   rejectUnauthorized: false,
  // },
});

pool
  .connect()
  .then(client => {
    console.log("✅ Koneksi ke PostgreSQL berhasil!");
    return client
      .query("SELECT NOW()")
      .then(res => {
        console.log("🕒 Waktu saat ini di DB:", res.rows[0]);
        client.release();
      })
      .catch(err => {
        client.release();
        console.error("❌ Gagal query:", err.stack);
      });
  })
  .catch(err => {
    console.error("❌ Gagal koneksi:", err.stack);
  });

module.exports = pool;
