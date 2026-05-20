import { clearSessionCookie, getCookie, getKv, json, sha256, COOKIE_NAME, SESSION_PREFIX } from '../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  try {
    const token = getCookie(request, COOKIE_NAME);
    if (token) {
      const kv = getKv(env);
      const hash = await sha256(token);
      await kv.delete(`${SESSION_PREFIX}${hash}`);
    }
  } catch (err) {}

  return json({ ok: true }, 200, { 'set-cookie': clearSessionCookie(request) });
}

export function onRequest() {
  return json({ ok: false, error: 'Method not allowed' }, 405, { allow: 'POST' });
}
