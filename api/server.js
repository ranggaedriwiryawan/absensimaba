import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Import API handlers
import healthHandler from './health.js';
import loginHandler from './login.js';
import logoutHandler from './logout.js';
import mahasiswaHandler from './mahasiswa.js';
import mahasiswaQrHandler from './mahasiswa-qr.js';
import scanHandler from './scan.js';
import presensiHandler from './presensi.js';
import headersHandler from './headers.js';
import debugEnvHandler from './debug-env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5500;

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static(PUBLIC_DIR));

// Cookie config
const COOKIE_NAME = 'auth';

// Middleware cek login
const requireAuth = (req, res, next) => {
  if (req.cookies?.[COOKIE_NAME] === '1') return next();
  return res.redirect('/index.html');
};

// === API ROUTES ===
app.get('/api/health', healthHandler);
app.post('/api/login', loginHandler);
app.post('/api/logout', logoutHandler);
app.get('/api/mahasiswa', mahasiswaHandler);
app.get('/api/mahasiswa-qr', mahasiswaQrHandler);
app.post('/api/scan', scanHandler);
app.post('/api/presensi', presensiHandler);
app.get('/api/headers', headersHandler);
app.get('/api/debug-env', debugEnvHandler);

// === PROTECTED ROUTES ===
app.get('/scanner.html', requireAuth, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'scanner.html'));
});

// === LOGIN API HANDLER ===
async function loginHandler(req, res) {
  const { email, password } = req.body || {};
  const validEmail = process.env.LOGIN_EMAIL_DOMAIN
    ? email?.endsWith(process.env.LOGIN_EMAIL_DOMAIN)
    : true;
  const validPass = password === process.env.PANITIA_PASSWORD;

  if (!email || !password) {
    return res.status(400).json({ ok: false, message: 'Email & password wajib.' });
  }

  if (!validEmail || !validPass) {
    return res.status(401).json({ ok: false, message: 'Email atau password salah.' });
  }

  // Set cookie login
  res.cookie(COOKIE_NAME, '1', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 12 * 60 * 60 * 1000 // 12 jam
  });

  res.json({ ok: true });
}

// === LOGOUT API HANDLER ===
async function logoutHandler(req, res) {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
}

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/index.html');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ ok: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ ok: false, message: 'Internal server error' });
});

// Jalankan server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`📁 Public directory: ${PUBLIC_DIR}`);
  console.log(`🔑 Auth cookie name: ${COOKIE_NAME}`);
});
