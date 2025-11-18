// backend/database.js
const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.warn(
      "⚠️  MONGODB_URI not set in .env. Backend will not connect to a database."
    );
    return;
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      autoIndex: true
    });
    console.log(
      `🟢 MongoDB connected: ${conn.connection.host}/${conn.connection.name}`
    );
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;