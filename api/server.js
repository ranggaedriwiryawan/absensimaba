import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Import handlers (inline untuk Railway compatibility)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5500;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve static files with proper headers
app.use(express.static(PUBLIC_DIR, {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    }
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    }
  }
}));

// Cookie config
const COOKIE_NAME = 'auth';

// Middleware cek login
const requireAuth = (req, res, next) => {
  console.log('Auth check - cookies:', req.cookies);
  if (req.cookies?.[COOKIE_NAME] === '1') {
    return next();
  }
  return res.redirect('/index.html');
};

// === INLINE API HANDLERS ===

// Health check
app.get('/api/health', async (req, res) => {
  try {
    res.status(200).json({ 
      ok: true, 
      status: 'Server running', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      port: PORT
    });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// Login handler
app.post('/api/login', async (req, res) => {
  console.log('Login attempt:', req.body);
  
  const { email, password } = req.body || {};
  
  if (!email || !password) {
    return res.status(400).json({ 
      ok: false, 
      message: 'Email dan password wajib diisi.' 
    });
  }

  // Validasi email domain
  const requiredDomain = process.env.LOGIN_EMAIL_DOMAIN;
  const validEmail = requiredDomain ? email.endsWith(requiredDomain) : true;
  
  // Validasi password
  const validPass = password === process.env.PANITIA_PASSWORD;

  console.log('Validation:', { validEmail, validPass, requiredDomain });

  if (!validEmail) {
    return res.status(401).json({ 
      ok: false, 
      message: `Email harus menggunakan domain ${requiredDomain || 'yang valid'}` 
    });
  }

  if (!validPass) {
    return res.status(401).json({ 
      ok: false, 
      message: 'Password salah.' 
    });
  }

  // Set cookie login
  res.cookie(COOKIE_NAME, '1', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 12 * 60 * 60 * 1000 // 12 jam
  });

  console.log('Login successful, cookie set');
  res.json({ ok: true, message: 'Login berhasil' });
});

// Logout handler
app.post('/api/logout', async (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true, message: 'Logout berhasil' });
});

// Test endpoint for debugging
app.get('/api/test', (req, res) => {
  res.json({
    ok: true,
    message: 'API working',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    cookies: req.cookies,
    headers: req.headers
  });
});

// === PROTECTED ROUTES ===
app.get('/scanner.html', requireAuth, (req, res) => {
  console.log('Scanner access attempt');
  res.sendFile(path.join(PUBLIC_DIR, 'scanner.html'));
});

// === MAIN ROUTES ===
app.get('/', (req, res) => {
  console.log('Root access - redirecting to index.html');
  res.redirect('/index.html');
});

app.get('/index.html', (req, res) => {
  console.log('Index page requested');
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Debug route untuk melihat file struktur
app.get('/debug/files', (req, res) => {
  const fs = require('fs');
  try {
    const files = fs.readdirSync(PUBLIC_DIR);
    res.json({ 
      publicDir: PUBLIC_DIR, 
      files,
      __dirname,
      cwd: process.cwd()
    });
  } catch (e) {
    res.json({ error: e.message, publicDir: PUBLIC_DIR });
  }
});

// Catch-all untuk file statis yang tidak ditemukan
app.get('*', (req, res) => {
  console.log('Catch-all route:', req.path);
  
  // Jika request ke file statis yang tidak ada
  if (req.path.includes('.')) {
    return res.status(404).json({ 
      ok: false, 
      message: 'File not found',
      path: req.path 
    });
  }
  
  // Untuk route lain, redirect ke index
  res.redirect('/index.html');
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    ok: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
  console.log(`📁 Public directory: ${PUBLIC_DIR}`);
  console.log(`🔑 Auth cookie name: ${COOKIE_NAME}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📧 Required email domain: ${process.env.LOGIN_EMAIL_DOMAIN || 'none'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});