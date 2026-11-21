require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const storyRoutes = require("./routes/storyRoutes");
const authRoutes = require("./routes/authRoutes");
const friendRoutes = require("./routes/friendRoutes");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => res.json({ message: "Snapchat MERN API is running" }));
app.use("/api/auth", authRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/stories", storyRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error"
  });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  });
