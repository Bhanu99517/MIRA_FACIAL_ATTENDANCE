// backend/database.js

// Import the mongoose library, which is a popular Object Data Modeling (ODM) library for MongoDB and Node.js.
// It manages relationships between data, provides schema validation, and is used to translate between objects in code and the representation of those objects in MongoDB.
const mongoose = require('mongoose');

// Define an asynchronous function to connect to the database.
// Using an async function allows us to use the 'await' keyword for cleaner handling of the promise-based connection.
const connectDB = async () => {
  try {
    // --- IMPORTANT: ADD YOUR DATABASE CONNECTION STRING ---
    // The connection URI is fetched from the environment variables.
    // You MUST create a '.env' file in this 'backend' directory and add your MongoDB connection string to it.
    // Example for a local MongoDB instance: MONGODB_URI=mongodb://127.0.0.1:27017/mira-attendance
    // Example for MongoDB Atlas: MONGODB_URI=mongodb+srv://<username>:<password>@your-cluster.mongodb.net/mira-attendance?retryWrites=true&w=majority
    const mongoURI = process.env.MONGODB_URI;

    // Check if the MongoDB URI is provided in the environment variables.
    // This is a critical check to prevent the application from running without a database connection.
    if (!mongoURI) {
      // Log a fatal error to the console.
      console.error('🔴 FATAL ERROR: MONGODB_URI is not set in the .env file.');
      // Exit the Node.js process with a failure code (1). This stops the server from starting.
      process.exit(1);
    }

    // Attempt to connect to the MongoDB database using the URI from the .env file.
    // mongoose.connect returns a promise, so we 'await' its resolution.
    const conn = await mongoose.connect(mongoURI);

    // If the connection is successful, log a confirmation message to the console.
    // We include the host of the connected database for verification purposes.
    console.log(`🟢 MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    // If an error occurs during the connection attempt, it will be caught here.
    // Log the detailed error message to the console for debugging.
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Exit the Node.js process with a failure code (1). This is important because the application cannot function correctly without a database.
    process.exit(1);
  }
};

// Export the connectDB function so it can be imported and used in other files, such as the main server.js file.
module.exports = connectDB;
