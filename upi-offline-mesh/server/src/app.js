const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const apiRoutes = require('./routes/apiRoutes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Root health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'UPI Offline Mesh Network & Settlement Server',
    version: '1.0.0'
  });
});

app.use('/api', apiRoutes);

// Centralized express error handler (No private key or stack trace exposure)
app.use((err, req, res, next) => {
  console.error('[Error Handler]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

module.exports = app;
