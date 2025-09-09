// api/server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

// static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// health
app.get('/health', (_req, res) => res.status(200).send('ok'));

// env login
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// login → set cookie
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ message: 'Username/password required' });
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '12h' });
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: String(process.env.REQUIRE_HTTPS).toLowerCase() === 'true',
      maxAge: 12 * 60 * 60 * 1000
    });
    return res.json({ ok: true });
  }
  return res.status(401).json({ message: 'Invalid credentials' });
});

// logout
app.post('/api/logout', (_req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: String(process.env.REQUIRE_HTTPS).toLowerCase() === 'true'
  });
  res.json({ ok: true });
});

// auth mw
function auth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(401).json({ message: 'Unauthorized' }); }
}

// protected API
app.get('/api/me', auth, (req, res) => res.json({ user: req.user.username }));

// protected page: scanner
app.get('/scanner', auth, (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'scanner.html'));
});

// root
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
