// backend/server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./database");
const User = require("./models/User");
const Student = require("./models/Student");
const Attendance = require("./models/Attendance");

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// --- Middleware ---
const allowedOrigins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    }
  })
);

app.use(express.json());

// --- DB ---
connectDB();

// --- Routes ---

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ---------- USERS ----------

// Register a new user (dashboard user/admin/staff/student)
app.post("/api/users", async (req, res) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email) {
      return res
        .status(400)
        .json({ success: false, error: "Name and email are required." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, error: "User with this email already exists." });
    }

    const user = await User.create({ name, email, role });
    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ success: false, error: "Server error creating user." });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, error: "Server error fetching users." });
  }
});

// ---------- STUDENTS ----------

// Register a new student (with reference image URL)
app.post("/api/students", async (req, res) => {
  try {
    const { name, rollNumber, email, userId, referenceImageUrl, faceEmbedding } =
      req.body;

    if (!name || !rollNumber) {
      return res.status(400).json({
        success: false,
        error: "Name and rollNumber are required."
      });
    }

    const existing = await Student.findOne({ rollNumber });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: "Student with this rollNumber already exists."
      });
    }

    const student = await Student.create({
      name,
      rollNumber,
      email,
      user: userId || undefined,
      referenceImageUrl,
      faceEmbedding
    });

    res.json({ success: true, data: student });
  } catch (error) {
    console.error("Error creating student:", error);
    res
      .status(500)
      .json({ success: false, error: "Server error creating student." });
  }
});

app.get("/api/students", async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json({ success: true, data: students });
  } catch (error) {
    console.error("Error fetching students:", error);
    res
      .status(500)
      .json({ success: false, error: "Server error fetching students." });
  }
});

// ---------- ATTENDANCE ----------

// Mark attendance when you already KNOW the studentId
// (e.g. your face-recognition service has matched the face)
app.post("/api/attendance/mark", async (req, res) => {
  try {
    const { studentId, status, deviceId, confidence, method } = req.body;

    if (!studentId) {
      return res
        .status(400)
        .json({ success: false, error: "studentId is required." });
    }

    // Ensure student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, error: "Student not found." });
    }

    const record = await Attendance.create({
      student: student._id,
      status: status || "PRESENT",
      deviceId,
      confidence,
      method: method || "face-recognition"
    });

    res.json({ success: true, data: record });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res
      .status(500)
      .json({ success: false, error: "Server error marking attendance." });
  }
});

// List attendance records
app.get("/api/attendance", async (req, res) => {
  try {
    const records = await Attendance.find()
      .populate("student")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: records });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res
      .status(500)
      .json({ success: false, error: "Server error fetching attendance." });
  }
});

// Example: mark attendance from rollNumber + confidence (for MaixCAM/Python integration)
app.post("/api/attendance/mark-from-face", async (req, res) => {
  try {
    const { rollNumber, confidence, deviceId } = req.body;

    if (!rollNumber || typeof confidence !== "number") {
      return res.status(400).json({
        success: false,
        error: "rollNumber and confidence are required."
      });
    }

    // threshold – only mark attendance when match is strong
    const THRESHOLD = 0.75; // 75% similarity for example

    if (confidence < THRESHOLD) {
      return res.status(400).json({
        success: false,
        error: "Face match confidence too low. Attendance not marked."
      });
    }

    const student = await Student.findOne({ rollNumber });
    if (!student) {
      return res
        .status(404)
        .json({ success: false, error: "Student not found for rollNumber." });
    }

    const record = await Attendance.create({
      student: student._id,
      status: "PRESENT",
      deviceId,
      confidence,
      method: "face-recognition"
    });

    res.json({ success: true, data: record });
  } catch (error) {
    console.error("Error in /mark-from-face:", error);
    res
      .status(500)
      .json({ success: false, error: "Server error marking attendance." });
  }
});

// --- Start server ---
app.listen(port, () => {
  console.log(`🚀 Backend server running at http://localhost:${port}`);
});
