import { MongoClient, MongoClientOptions } from 'mongodb';
import { attachDatabasePool } from '@vercel/functions';

const options: MongoClientOptions = {
  appName: "devrel.vercel.integration",
  maxIdleTimeMS: 5000
};
const client = new MongoClient(process.env.MONGODB_URI, options);
   
// Attach the client to ensure proper cleanup on function suspension
attachDatabasePool(client);

// Export a module-scoped MongoClient to ensure the client can be shared across functions.
export default client; 




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