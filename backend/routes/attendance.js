// backend/routes/Attendance.js
// at top of backend/routes/attendance*.js
const { isInsideCampus } = require("../geofence");

const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },
    status: {
      type: String,
      enum: ["PRESENT", "ABSENT", "LATE"],
      default: "PRESENT"
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    deviceId: { type: String },         // e.g. "MAIXCAM_LAB01"
    method: { type: String, default: "face-recognition" }, // or "manual"
    confidence: { type: Number }        // face match confidence (0–1 or 0–100)
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", AttendanceSchema);
