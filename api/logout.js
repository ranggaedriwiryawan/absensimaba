// api/logout.js
export default async function handler(req, res) {
  res.clearCookie('auth');
  res.json({ ok: true, message: 'Logout berhasil' });
}
