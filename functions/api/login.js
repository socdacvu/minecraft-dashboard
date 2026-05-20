import { createSession, json, sessionCookie, sha256 } from '../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  let body = {};
  try { body = await request.json(); }
  catch (err) { return json({ ok: false, error: 'Dữ liệu đăng nhập không hợp lệ.' }, 400); }

  const expectedUser = env.OWNER_USERNAME || 'admin';
  const expectedPassword = env.OWNER_PASSWORD || 'admin123';
  const expectedPasswordHash = env.OWNER_PASSWORD_SHA256 || '';

  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  const passwordOk = expectedPasswordHash
    ? (await sha256(password)) === expectedPasswordHash
    : password === expectedPassword;

  if (username !== expectedUser || !passwordOk) {
    return json({ ok: false, error: 'Sai tài khoản hoặc mật khẩu Owner.' }, 401);
  }

  const token = await createSession(request, env);
  return json({ ok: true, user: { username: expectedUser, role: 'owner' } }, 200, {
    'set-cookie': sessionCookie(request, token)
  });
}

export function onRequest() {
  return json({ ok: false, error: 'Method not allowed' }, 405, { allow: 'POST' });
}
