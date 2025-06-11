// require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const destinasiRouter = require("./router/destinasiRouter");
const userRouter = require("./router/userRouter");
const path = require("path");
// const db = require("./database/db");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

 app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api", destinasiRouter);
app.use("/user", userRouter);
// app.use("/api", usersRouter);

const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
