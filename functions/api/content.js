import { CONTENT_KEY, getKv, json } from '../_lib/auth.js';

export async function onRequestGet({ env }) {
  const kv = getKv(env);
  const raw = await kv.get(CONTENT_KEY);
  if (!raw) {
    return json({ ok: true, content: {}, hasCustomContent: false });
  }

  try {
    return json({ ok: true, content: JSON.parse(raw), hasCustomContent: true });
  } catch (err) {
    return json({ ok: false, error: 'Dữ liệu KV bị lỗi JSON.' }, 500);
  }
}

export function onRequest() {
  return json({ ok: false, error: 'Method not allowed' }, 405, { allow: 'GET' });
}
