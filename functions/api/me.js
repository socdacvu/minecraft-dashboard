import { getSession, json } from '../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  const session = await getSession(request, env);
  if (!session || session.role !== 'owner') {
    return json({ ok: false, error: 'Chưa đăng nhập.' }, 401);
  }
  return json({ ok: true, user: { role: 'owner' } });
}

export function onRequest() {
  return json({ ok: false, error: 'Method not allowed' }, 405, { allow: 'GET' });
}
