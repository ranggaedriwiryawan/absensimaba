const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve file statis dari folder public
app.use(express.static(path.join(__dirname, '../public')));

// Route root → index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Route scanner → scanner.html
app.get('/scanner', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'scanner.html'));
});

// Railway / lokal port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
