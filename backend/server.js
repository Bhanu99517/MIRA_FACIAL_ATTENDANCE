const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3001;

// Middleware
// Allow requests from any origin (suitable for development)
app.use(cors()); 
// Parse incoming requests with JSON payloads
app.use(express.json());

// --- Nodemailer Transporter Setup ---
// It's crucial that EMAIL_USER and EMAIL_PASS are set in a .env file in the same directory.
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('🔴 FATAL ERROR: EMAIL_USER or EMAIL_PASS is not set in the .env file.');
    console.error('Please create a .env file in the /backend directory with your email credentials.');
    process.exit(1); // Exit the process if credentials are not found
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // This MUST be a Google App Password
  },
});

// Verify the transporter configuration on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('🔴 Nodemailer transporter configuration error:');
        console.error('   - Ensure EMAIL_USER and EMAIL_PASS are correct in your .env file.');
        console.error('   - For Gmail, you MUST use an "App Password", not your regular password.');
        console.error('   - See: https://support.google.com/accounts/answer/185833');
        console.error(error);
    } else {
        console.log('🟢 Nodemailer transporter is configured and ready to send emails.');
    }
});

// --- API Endpoint to Send Email ---
app.post('/api/send-email', async (req, res) => {
  const { to, subject, body } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ success: false, message: 'Missing required fields: to, subject, or body' });
  }

  const mailOptions = {
    from: `"Mira Attendance System" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: subject,
    text: body,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to} with subject "${subject}"`);
    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    // Provide a more specific error response if possible
    res.status(500).json({ success: false, message: 'Failed to send email. Check server logs for details.' });
  }
});

// A simple root endpoint to check if the server is running
app.get('/', (req, res) => {
    res.send('Mira Attendance Backend is running.');
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Backend server listening at http://localhost:${port}`);
  console.log('Waiting for requests...');
});
