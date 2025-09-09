const form = document.getElementById('loginForm');
const btn = document.getElementById('btnLogin');
const errorBox = document.getElementById('error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.textContent = '';
  btn.disabled = true; btn.textContent = 'Masuk...';

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    const resp = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',          // << penting agar cookie tersimpan
      body: JSON.stringify({ username, password })
    });
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      throw new Error(data.message || 'Login gagal');
    }
    // sukses → pindah ke halaman protected (server-side guard)
    window.location.href = '/scanner';
  } catch (err) {
    errorBox.textContent = err.message || 'Terjadi kesalahan';
  } finally {
    btn.disabled = false; btn.textContent = 'Masuk';
  }
});
