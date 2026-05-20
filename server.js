import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dgram from 'node:dgram';
import net from 'node:net';
import { lookup } from 'node:dns/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);


const MC_STATUS_DEFAULT_HOST = 'play.novamc.asia';
const MC_STATUS_DEFAULT_PORT = 25552;
const MC_STATUS_REGION_LABEL = 'Singapore';
const MC_STATUS_CACHE_TTL_MS = Number(process.env.MC_STATUS_CACHE_TTL_MS || 12_000);
const MC_STATUS_RATE_LIMIT_WINDOW_MS = Number(process.env.MC_STATUS_RATE_LIMIT_WINDOW_MS || 60_000);
const MC_STATUS_RATE_LIMIT_MAX = Number(process.env.MC_STATUS_RATE_LIMIT_MAX || 30);
const MC_STATUS_ALLOWED_TARGETS = new Set(
  String(process.env.MC_STATUS_ALLOWED_TARGETS || 'play.novamc.asia:25552,novamc.usga.me:25552')
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean)
);
const RAKNET_MAGIC = Buffer.from('00ffff00fefefefefdfdfdfd12345678', 'hex');

function cleanMcHost(value){
  const host = String(value || MC_STATUS_DEFAULT_HOST).trim().toLowerCase();
  if(!/^[a-z0-9.-]{1,253}$/.test(host)) return MC_STATUS_DEFAULT_HOST;
  return host;
}

function cleanMcPort(value){
  const port = Number(value || MC_STATUS_DEFAULT_PORT);
  if(!Number.isInteger(port) || port < 1 || port > 65535) return MC_STATUS_DEFAULT_PORT;
  return port;
}

function resolveRequestedStatusTarget(query = {}){
  const host = cleanMcHost(query.host);
  const port = cleanMcPort(query.port);
  const target = `${host}:${port}`.toLowerCase();
  if(!MC_STATUS_ALLOWED_TARGETS.has(target)){
    return {
      allowed: false,
      host: MC_STATUS_DEFAULT_HOST,
      port: MC_STATUS_DEFAULT_PORT,
      target
    };
  }
  return { allowed: true, host, port, target };
}

const statusCache = new Map();
const rateLimitBuckets = new Map();

function clientIp(req){
  return String(req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}

function checkRateLimit(req){
  const ip = clientIp(req);
  const now = Date.now();
  const bucket = rateLimitBuckets.get(ip) || { count: 0, resetAt: now + MC_STATUS_RATE_LIMIT_WINDOW_MS };
  if(now > bucket.resetAt){
    bucket.count = 0;
    bucket.resetAt = now + MC_STATUS_RATE_LIMIT_WINDOW_MS;
  }
  bucket.count += 1;
  rateLimitBuckets.set(ip, bucket);
  return { ok: bucket.count <= MC_STATUS_RATE_LIMIT_MAX, resetAt: bucket.resetAt };
}

function getCachedStatus(target){
  const item = statusCache.get(target);
  if(!item) return null;
  if(Date.now() - item.time > MC_STATUS_CACHE_TTL_MS){
    statusCache.delete(target);
    return null;
  }
  return item.value;
}

function setCachedStatus(target, value){
  statusCache.set(target, { time: Date.now(), value });
}

function withTimeout(ms){
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(), ms);
  return { controller, timer };
}

async function fetchJson(url, timeoutMs = 5500){
  const { controller, timer } = withTimeout(timeoutMs);
  try{
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { accept: 'application/json', 'user-agent': 'NovaMC-Status/1.0' }
    });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }finally{
    clearTimeout(timer);
  }
}

function normalizeExternalStatus(data){
  if(!data || typeof data !== 'object') return null;
  const online = Boolean(data.online);
  const players = data.players || {};
  const onlinePlayers = Number.isFinite(Number(players.online)) ? Number(players.online) : 0;
  const maxPlayers = Number.isFinite(Number(players.max)) ? Number(players.max) : null;
  return {
    online,
    players: { online: onlinePlayers, max: maxPlayers },
    version: data.version?.name_clean || data.version?.name || data.version || null,
    motd: data.motd?.clean || data.motd?.raw || null
  };
}

function parseBedrockMotd(motd){
  if(!motd || typeof motd !== 'string') return null;
  const parts = motd.split(';');
  const online = Number(parts[4]);
  const max = Number(parts[5]);
  return {
    online: true,
    players: {
      online: Number.isFinite(online) ? online : 0,
      max: Number.isFinite(max) ? max : null
    },
    version: parts[3] || null,
    motd: parts[1] || null
  };
}

async function bedrockUdpPing(host, port, timeoutMs = 4500){
  const startedAt = Date.now();
  const address = await lookup(host, { family: 4 });
  const socket = dgram.createSocket('udp4');
  const packet = Buffer.alloc(1 + 8 + RAKNET_MAGIC.length + 8);
  packet.writeUInt8(0x01, 0);
  packet.writeBigInt64BE(BigInt(Date.now()), 1);
  RAKNET_MAGIC.copy(packet, 9);
  packet.writeBigInt64BE(0x1234567890ABCDEFn, 9 + RAKNET_MAGIC.length);

  return await new Promise((resolve, reject)=>{
    const timer = setTimeout(()=>{
      socket.close();
      reject(new Error('Bedrock UDP ping timeout'));
    }, timeoutMs);

    socket.once('message', msg=>{
      clearTimeout(timer);
      socket.close();
      const latency = Math.max(1, Date.now() - startedAt);
      let parsed = null;
      try{
        const magicIndex = msg.indexOf(RAKNET_MAGIC);
        if(magicIndex >= 0){
          const info = msg.slice(magicIndex + RAKNET_MAGIC.length).toString('utf8').replace(/^\x00+/, '');
          parsed = parseBedrockMotd(info);
        }
      }catch(err){
        parsed = null;
      }
      resolve({ latency, parsed });
    });

    socket.once('error', err=>{
      clearTimeout(timer);
      socket.close();
      reject(err);
    });

    socket.send(packet, port, address.address, err=>{
      if(err){
        clearTimeout(timer);
        socket.close();
        reject(err);
      }
    });
  });
}

async function tcpConnectPing(host, port, timeoutMs = 4500){
  const startedAt = Date.now();
  return await new Promise((resolve, reject)=>{
    const socket = net.createConnection({ host, port });
    socket.setTimeout(timeoutMs);
    socket.once('connect', ()=>{
      const latency = Math.max(1, Date.now() - startedAt);
      socket.destroy();
      resolve({ latency });
    });
    socket.once('timeout', ()=>{
      socket.destroy();
      reject(new Error('TCP ping timeout'));
    });
    socket.once('error', reject);
  });
}

async function loadExternalMinecraftStatus(host, port){
  const target = `${encodeURIComponent(host)}:${port}`;
  const urls = [
    `https://api.mcstatus.io/v2/status/bedrock/${target}`,
    `https://api.mcsrvstat.us/bedrock/3/${target}`,
    `https://api.mcstatus.io/v2/status/java/${target}`,
    `https://api.mcsrvstat.us/3/${target}`
  ];
  let fallback = null;
  for(const url of urls){
    try{
      const data = await fetchJson(url);
      const normalized = normalizeExternalStatus(data);
      if(normalized && !fallback) fallback = normalized;
      if(normalized?.online) return { ...normalized, source: url };
    }catch(err){
      // Try next API.
    }
  }
  return fallback;
}

async function loadDirectMinecraftLatency(host, port){
  try{
    const udp = await bedrockUdpPing(host, port);
    return { latency: udp.latency, protocol: 'bedrock-udp', parsed: udp.parsed };
  }catch(udpError){
    try{
      const tcp = await tcpConnectPing(host, port);
      return { latency: tcp.latency, protocol: 'tcp', parsed: null };
    }catch(tcpError){
      return { latency: null, protocol: null, parsed: null, error: udpError?.message || tcpError?.message };
    }
  }
}

const app = express();
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'https://cdn.discordapp.com', 'https://media.discordapp.net', 'https://mc-heads.net'],
      connectSrc: ["'self'", 'https://discord.com', 'https://api.mcstatus.io', 'https://api.mcsrvstat.us'],
      frameSrc: ['https://discord.com'],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: null
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.get('/api/health', (req, res)=>{
  res.json({
    ok: true,
    mode: 'discord-server-sync-only',
    note: 'Frontend chỉ đồng bộ thông tin server Discord công khai, không dùng OAuth.'
  });
});


app.get('/api/minecraft-status', async (req, res)=>{
  const rateLimit = checkRateLimit(req);
  if(!rateLimit.ok){
    res.set('Retry-After', String(Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))));
    return res.status(429).json({
      ok: false,
      online: false,
      error: 'Bạn đang kiểm tra trạng thái quá nhanh. Vui lòng thử lại sau ít giây.'
    });
  }

  const requested = resolveRequestedStatusTarget(req.query);
  if(!requested.allowed){
    return res.status(403).json({
      ok: false,
      online: false,
      host: MC_STATUS_DEFAULT_HOST,
      port: MC_STATUS_DEFAULT_PORT,
      players: { online: 0, max: null },
      latency: null,
      region: MC_STATUS_REGION_LABEL,
      error: 'Target không được phép kiểm tra.'
    });
  }

  const { host, port, target } = requested;
  const cached = getCachedStatus(target);
  if(cached){
    res.set('Cache-Control', 'public, max-age=10, stale-while-revalidate=15');
    return res.json({ ...cached, cache: true });
  }

  const startedAt = Date.now();

  try{
    const [latencyResult, externalResult] = await Promise.all([
      loadDirectMinecraftLatency(host, port),
      loadExternalMinecraftStatus(host, port)
    ]);

    const parsed = latencyResult.parsed || externalResult || null;
    const online = Boolean(parsed?.online || latencyResult.latency);
    const players = parsed?.players || { online: 0, max: null };

    const payload = {
      ok: true,
      online,
      host,
      port,
      players,
      latency: latencyResult.latency,
      latencySource: `${MC_STATUS_REGION_LABEL} node`,
      region: MC_STATUS_REGION_LABEL,
      protocol: latencyResult.protocol,
      version: parsed?.version || null,
      motd: parsed?.motd || null,
      checkedAt: new Date().toISOString(),
      responseMs: Math.max(1, Date.now() - startedAt),
      cache: false
    };

    setCachedStatus(target, payload);
    res.set('Cache-Control', 'public, max-age=10, stale-while-revalidate=15');
    res.json(payload);
  }catch(err){
    res.status(502).json({
      ok: false,
      online: false,
      host,
      port,
      players: { online: 0, max: null },
      latency: null,
      region: MC_STATUS_REGION_LABEL,
      error: 'Không thể kiểm tra trạng thái máy chủ.'
    });
  }
});

const staticOptions = {
  extensions: ['html'],
  maxAge: '5m',
  index: false
};

app.use('/assets', express.static(path.join(__dirname, 'assets'), staticOptions));
app.use('/config', express.static(path.join(__dirname, 'config'), staticOptions));
app.use('/css', express.static(path.join(__dirname, 'css'), staticOptions));
app.use('/js', express.static(path.join(__dirname, 'js'), staticOptions));

app.get(['/', '/index.html'], (req, res)=>{
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('*', (req, res)=>{
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, ()=>{
  console.log(`NovaMC website đang chạy tại http://localhost:${PORT}`);
});
