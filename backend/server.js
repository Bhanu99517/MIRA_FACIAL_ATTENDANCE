// backend/server.js

// --- 1. IMPORTS ---
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const connectDB = require('./database');
// FIX: Add path module to construct a robust path to the environment file.
const path = require('path');

// Load environment variables from the root .tsx file which is now a JS module
try {
  const config = require(path.resolve(__dirname, '..', '.tsx'));
  for (const key in config) {
    if (Object.prototype.hasOwnProperty.call(config, key)) {
      process.env[key] = config[key];
    }
  }
} catch (error) {
    console.error('FATAL: Could not load environment variables from .tsx file. Make sure it exists and is a valid module.', error);
    process.exit(1);
}


// --- 2. APP SETUP ---
const app = express();
const port = process.env.PORT || 5000;

// CORS: allow frontend origin (or * if not set)
const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // For tools like Postman (no origin header)
      if (!origin || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    }
  })
);

app.use(express.json());

// --- 3. DATABASE (OPTIONAL) ---
connectDB().catch(err => {
  console.error('⚠️  Failed to connect to MongoDB:', err.message);
});

// --- 4. EMAIL TRANSPORTER ---

// Validate required envs
if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn(
    '⚠️  EMAIL_HOST / EMAIL_USER / EMAIL_PASS not fully set. ' +
    'POST /api/send-email will FAIL until these are configured.'
  );
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Optional: verify transporter on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter verification failed:', error.message);
  } else {
    console.log('📧 Email transporter ready');
  }
});

// --- 5. ROUTES ---

// Simple root
app.get('/', (req, res) => {
  res.send('Mira Attendance Backend is running.');
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString()
  });
});

/**
 * POST /api/send-email
 * Body: { to: string, subject: string, body: string }
 * Used by the frontend to send OTP and other mails.
 */
app.post('/api/send-email', async (req, res) => {
  const { to, subject, body } = req.body || {};

  if (!to || !subject || !body) {
    return res.status(400).json({
      success: false,
      message: 'Missing "to", "subject", or "body" in request.'
    });
  }

  try {
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

    await transporter.sendMail({
      from,
      to,
      subject,
      text: body,
      // Optional: also send HTML
      html: body.replace(/\n/g, '<br>')
    });

    console.log(`📧 Email sent to ${to} with subject "${subject}"`);

    return res.json({ success: true });
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

// --- 6. START SERVER ---
app.listen(port, () => {
  console.log(`🚀 Backend server listening at http://localhost:${port}`);
  console.log('Waiting for requests...');
});