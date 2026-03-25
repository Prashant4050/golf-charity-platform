const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");

// Connect DB
connectDB();

const app = express();

// ---------------- SECURITY ----------------
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// ---------------- RATE LIMIT ----------------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
app.use("/api/", limiter);

// ---------------- CORS ----------------
// For single deployment, this is enough
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// ---------------- WEBHOOK ----------------
app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json" })
);

// ---------------- BODY ----------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ---------------- LOGGING ----------------
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ---------------- STATIC FILES ----------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------------- API ROUTES ----------------
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/scores", require("./routes/scores"));
app.use("/api/charities", require("./routes/charities"));
app.use("/api/draws", require("./routes/draws"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/winners", require("./routes/winners"));

// ---------------- HEALTH CHECK ----------------
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API is running",
    timestamp: new Date(),
  });
});

// =====================================================
// 🔥 SERVE FRONTEND (IMPORTANT FOR OPTION 1)
// =====================================================
const buildPath = path.join(__dirname, "build");

app.use(express.static(buildPath));

// React routing support
app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

// ---------------- ERROR HANDLER ----------------
app.use((err, req, res, next) => {
  console.error("❌ ERROR:", err.stack);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Server Error",
  });
});

// ---------------- SERVER ----------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});