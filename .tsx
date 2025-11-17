// This file contains environment variables. It is formatted as a JS module
// to be syntactically correct while being named .tsx, as required by the backend configuration.
declare var module: any;
module.exports = {
  PORT: '5000',
  CORS_ORIGIN: 'http://localhost:5173',
  MONGODB_URI: 'mongodb://127.0.0.1:27017/mira-attendance',
  EMAIL_HOST: 'smtp.gmail.com',
  EMAIL_PORT: '587',
  EMAIL_SECURE: 'false',
  EMAIL_USER: 'bhanu99517@gmail.com',
  EMAIL_PASS: 'your_app_password',
  EMAIL_FROM: '"Mira Attendance <bhanu934785@gmail.com>"',
};
