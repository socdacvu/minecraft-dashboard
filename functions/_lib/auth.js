export const CONTENT_KEY = 'novamc:site-content:v1';
export const SESSION_PREFIX = 'novamc:session:';
export const COOKIE_NAME = 'novamc_session';
export const SESSION_TTL = 60 * 60 * 24;

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers
    }
  });
}

export function methodNotAllowed() {
  return json({ ok: false, error: 'Method not allowed' }, 405, { allow: 'GET, POST' });
}

export function getCookie(request, name) {
  const cookie = request.headers.get('cookie') || '';
  const parts = cookie.split(';').map(item => item.trim()).filter(Boolean);
  for (const part of parts) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = decodeURIComponent(part.slice(0, eq));
    if (key === name) return decodeURIComponent(part.slice(eq + 1));
  }
  return '';
}

export async function sha256(input) {
  const data = new TextEncoder().encode(String(input));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export function makeToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export function sessionCookie(request, token, maxAge = SESSION_TTL) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Strict${secure}`;
}

export function clearSessionCookie(request) {
  return sessionCookie(request, '', 0);
}

export function getKv(env) {
  if (!env || !env.NOVAMC_KV) {
    throw new Error('Cloudflare KV binding NOVAMC_KV chưa được cấu hình. Vào Pages > Settings > Bindings > KV namespace và đặt Variable name là NOVAMC_KV.');
  }
  return env.NOVAMC_KV;
}

export async function createSession(request, env) {
  const kv = getKv(env);
  const token = makeToken();
  const hash = await sha256(token);
  await kv.put(`${SESSION_PREFIX}${hash}`, JSON.stringify({
    role: 'owner',
    createdAt: new Date().toISOString()
  }), { expirationTtl: SESSION_TTL });
  return token;
}

export async function getSession(request, env) {
  const kv = getKv(env);
  const token = getCookie(request, COOKIE_NAME) || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (!token) return null;
  const hash = await sha256(token);
  const raw = await kv.get(`${SESSION_PREFIX}${hash}`);
  if (!raw) return null;
  try { return JSON.parse(raw); }
  catch (err) { return null; }
}

export async function requireOwner(request, env) {
  const session = await getSession(request, env);
  if (!session || session.role !== 'owner') {
    return { ok: false, response: json({ ok: false, error: 'Bạn cần đăng nhập Owner để thực hiện thao tác này.' }, 401) };
  }
  return { ok: true, session };
}

export function sanitizeValue(value, depth = 0) {
  if (depth > 8) return null;
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value.slice(0, 5000);
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.slice(0, 120).map(item => sanitizeValue(item, depth + 1)).filter(item => item !== null);
  if (typeof value === 'object') {
    const output = {};
    for (const [key, item] of Object.entries(value)) {
      if (!/^[a-zA-Z0-9_.$-]{1,64}$/.test(key)) continue;
      if (key === '__proto__' || key === 'prototype' || key === 'constructor') continue;
      output[key] = sanitizeValue(item, depth + 1);
    }
    return output;
  }
  return null;
}

export function normalizeContent(input) {
  const clean = sanitizeValue(input || {});
  const staff = clean.staff && typeof clean.staff === 'object' ? clean.staff : {};
  const partners = Array.isArray(clean.partners) ? clean.partners : [];
  return {
    staff: {
      owner: staff.owner && typeof staff.owner === 'object' ? staff.owner : {},
      members: Array.isArray(staff.members) ? staff.members : []
    },
    partners,
    updatedAt: new Date().toISOString()
  };
}
