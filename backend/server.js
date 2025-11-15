// backend/server.js

// --- 1. IMPORT NECESSARY MODULES ---

// Import the Express framework, which is a minimal and flexible Node.js web application framework
// that provides a robust set of features for web and mobile applications.
const express = require('express');
// Import Nodemailer, a module for Node.js applications to allow easy as cake email sending.
const nodemailer = require('nodemailer');
// Import CORS, a Node.js package for providing a Connect/Express middleware that can be used to enable CORS with various options.
const cors = require('cors');
// Import and configure dotenv. This allows us to load environment variables from a .env file into process.env.
require('dotenv').config();
// ADD: Import the database connection function from our new database.js file.
const connectDB = require('./database');


// --- 2. INITIALIZE APP & MIDDLEWARE ---

// Create an instance of an Express application.
const app = express();
// Define the port the server will listen on. It will try to use the PORT environment variable, or default to 3001.
const port = process.env.PORT || 3001;

// ADD: Connect to the MongoDB database when the server starts.
connectDB();

// Use the CORS middleware. By default, this allows requests from any origin.
// This is useful for development when your frontend and backend are on different ports/domains.
app.use(cors());
// Use the express.json() middleware. This is a built-in middleware function in Express.
// It parses incoming requests with JSON payloads and is based on body-parser.
app.use(express.json());


// --- 3. NODEMAILER TRANSPORTER SETUP ---

// It's crucial that EMAIL_USER and EMAIL_PASS are set in a .env file in the same directory.
// We check if these environment variables exist before proceeding.
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    // If credentials are not found, log a fatal error to the console.
    console.error('🔴 FATAL ERROR: EMAIL_USER or EMAIL_PASS is not set in the .env file.');
    console.error('Please create a .env file in the /backend directory with your email credentials.');
    // Exit the process with a failure code (1) to prevent the server from running in a misconfigured state.
    process.exit(1);
}

// Create a Nodemailer transporter object using the default SMTP transport.
// This object is responsible for the actual sending of emails.
const transporter = nodemailer.createTransport({
  // We are using Gmail as the email service. Other services like SendGrid, Mailgun, etc., can also be used.
  service: 'gmail',
  // Authentication details for the email account that will send the emails.
  auth: {
    // The email address of the sender, loaded from the .env file.
    user: process.env.EMAIL_USER,
    // The password for the sender's email account. IMPORTANT: For Gmail, this MUST be an "App Password", not the regular account password.
    pass: process.env.EMAIL_PASS,
  },
});

// Verify the transporter configuration on startup to ensure it's ready to send emails.
transporter.verify((error, success) => {
    // If there is an error during verification, log it with helpful debugging tips.
    if (error) {
        console.error('🔴 Nodemailer transporter configuration error:');
        console.error('   - Ensure EMAIL_USER and EMAIL_PASS are correct in your .env file.');
        console.error('   - For Gmail, you MUST use an "App Password", not your regular password.');
        console.error('   - See: https://support.google.com/accounts/answer/185833');
        console.error(error); // Log the actual error object.
    } else {
        // If verification is successful, log a confirmation message.
        console.log('🟢 Nodemailer transporter is configured and ready to send emails.');
    }
});


// --- 4. API ENDPOINTS ---

// Define a POST endpoint at '/api/send-email'. This is where the frontend will send requests to dispatch emails.
// The 'async' keyword allows us to use 'await' inside this function for handling promises.
app.post('/api/send-email', async (req, res) => {
  // Destructure the 'to', 'subject', and 'body' properties from the request body.
  const { to, subject, body } = req.body;

  // Validate the incoming data. If any of the required fields are missing, send a 400 Bad Request response.
  if (!to || !subject || !body) {
    return res.status(400).json({ success: false, message: 'Missing required fields: to, subject, or body' });
  }

  // Construct the mailOptions object that Nodemailer will use to create the email.
  const mailOptions = {
    // The 'from' field, which includes a display name and the sender's email address.
    from: `"Mira Attendance System" <${process.env.EMAIL_USER}>`,
    // The recipient's email address.
    to: to,
    // The subject line of the email.
    subject: subject,
    // The plain text body of the email. For HTML emails, you would use an 'html' property.
    text: body,
  };

  // Use a try-catch block to handle potential errors during the email sending process.
  try {
    // Await the sendMail method of the transporter. This sends the email and returns a promise.
    await transporter.sendMail(mailOptions);
    // If the email is sent successfully, log it to the server console for monitoring.
    console.log(`✅ Email sent successfully to ${to} with subject "${subject}"`);
    // Send a 200 OK response back to the client with a success message.
    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    // If sendMail throws an error, it will be caught here.
    // Log the failure to the server console for debugging.
    console.error(`❌ Failed to send email to ${to}:`, error);
    // Send a 500 Internal Server Error response back to the client.
    res.status(500).json({ success: false, message: 'Failed to send email. Check server logs for details.' });
  }
});

// Define a simple root GET endpoint ('/'). This is useful for health checks or simply confirming the server is running.
app.get('/', (req, res) => {
    // Send a plain text response.
    res.send('Mira Attendance Backend is running.');
});


// --- 5. START THE SERVER ---

// Start the Express server and make it listen for incoming connections on the specified port.
app.listen(port, () => {
  // Log a message to the console once the server is successfully running.
  console.log(`🚀 Backend server listening at http://localhost:${port}`);
  console.log('Waiting for requests...');
});
