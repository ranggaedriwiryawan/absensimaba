// api/login.js
export default async function handler(req, res) {
  const { email, password } = req.body || {};
  
  // Validasi input
  if (!email || !password) {
    return res.status(400).json({ 
      ok: false, 
      message: 'Email dan password wajib diisi.' 
    });
  }

  // Validasi email domain (jika ada setting)
  const validEmail = process.env.LOGIN_EMAIL_DOMAIN
    ? email.endsWith(process.env.LOGIN_EMAIL_DOMAIN)
    : true;

  // Validasi password
  const validPass = password === process.env.PANITIA_PASSWORD;

  if (!validEmail) {
    return res.status(401).json({ 
      ok: false, 
      message: `Email harus menggunakan domain ${process.env.LOGIN_EMAIL_DOMAIN}` 
    });
  }

  if (!validPass) {
    return res.status(401).json({ 
      ok: false, 
      message: 'Password salah.' 
    });
  }

  // Set cookie login
  res.cookie('auth', '1', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 12 * 60 * 60 * 1000 // 12 jam
  });

  res.json({ ok: true, message: 'Login berhasil' });
}
