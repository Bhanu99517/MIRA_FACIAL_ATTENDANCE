// backend/database.js

const mongoose = require('mongoose');

/**
 * Connect to MongoDB using MONGODB_URI.
 * If the URI is not set, we just log a warning and continue without DB.
 */
const connectDB = async () => {
  // FIX: Use the correct environment variable and remove the broken, hardcoded connection string.
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.warn(
      '⚠️  MONGODB_URI is not set. ' +
      'Running backend WITHOUT database (email routes still work).'
    );
    return;
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      autoIndex: true
    });

    console.log(`🟢 MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    // You can decide to exit or continue without DB.
    // Here we exit, because if you configure a URI we assume you actually need DB.
    process.exit(1);
  }
};

module.exports = connectDB;