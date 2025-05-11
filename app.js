// Dit is een eenvoudige health check app voor Heroku
// Dit is ALLEEN een backup file in het geval dat de main app niet werkt

const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

// Basis route
app.get('/', (req, res) => {
  res.send('ReachImpact API is draaiend!');
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// API status route
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Start de server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server draait op poort ${port}`);
});