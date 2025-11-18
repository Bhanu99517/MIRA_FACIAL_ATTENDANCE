// backend/models/Student.js
const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    rollNumber: { type: String, required: true, unique: true },
    email: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional link to User
    referenceImageUrl: { type: String }, // URL/path to reference face image
    faceEmbedding: {
      type: [Number], // optional: vector from your face-rec model
      default: undefined
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", StudentSchema);