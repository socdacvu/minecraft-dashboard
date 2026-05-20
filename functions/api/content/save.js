import { CONTENT_KEY, getKv, json, normalizeContent, requireOwner } from '../../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  const auth = await requireOwner(request, env);
  if (!auth.ok) return auth.response;

  let body = {};
  try { body = await request.json(); }
  catch (err) { return json({ ok: false, error: 'Dữ liệu gửi lên không hợp lệ.' }, 400); }

  const content = normalizeContent(body.content || body);
  const kv = getKv(env);
  await kv.put(CONTENT_KEY, JSON.stringify(content), {
    metadata: { updatedAt: content.updatedAt }
  });

  return json({ ok: true, content });
}

export function onRequest() {
  return json({ ok: false, error: 'Method not allowed' }, 405, { allow: 'POST' });
}
