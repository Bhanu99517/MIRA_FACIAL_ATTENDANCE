// backend/models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ["admin", "staff", "student"],
      default: "student"
    }
    // If later you add password/OTP/etc, put here.
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);