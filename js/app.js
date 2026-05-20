/* ============================================================
   NOVAMC LIGHT — SPLIT CONFIG SCRIPT
============================================================ */

const SITE = window.NOVAMC_SITE || {};
const INFO = window.NOVAMC_INFO || [];
const FEATURES = window.NOVAMC_FEATURES || [];
const PROTECTION = window.NOVAMC_PROTECTION || {};
let STAFF = window.NOVAMC_STAFF || { owner:{}, members:[] };
const RULES = window.NOVAMC_RULES || { version:"", general:[], prohibited:[] };
const FAQ = window.NOVAMC_FAQ || [];
let PARTNERS = window.NOVAMC_PARTNERS || [];

// ========== DYNAMIC CONTENT FROM CLOUDFLARE KV ==========
async function loadRemoteContent(){
  try{
    const res = await fetch('/api/content', { cache: 'no-store' });
    if(!res.ok) return;
    const payload = await res.json();
    const content = payload.content || payload || {};

    if(content.staff && typeof content.staff === 'object'){
      STAFF = {
        owner: content.staff.owner || STAFF.owner || {},
        members: Array.isArray(content.staff.members) ? content.staff.members : (STAFF.members || [])
      };
      window.NOVAMC_STAFF = STAFF;
    }

    if(Array.isArray(content.partners)){
      PARTNERS = content.partners;
      window.NOVAMC_PARTNERS = PARTNERS;
    }
  }catch(err){
    console.warn('NovaMC KV content is not available yet, using static config.', err);
  }
}

window.NovaMCContent = {
  get(){
    return {
      staff: typeof structuredClone === 'function' ? structuredClone(STAFF) : JSON.parse(JSON.stringify(STAFF)),
      partners: typeof structuredClone === 'function' ? structuredClone(PARTNERS) : JSON.parse(JSON.stringify(PARTNERS))
    };
  },
  apply(content={}){
    if(content.staff && typeof content.staff === 'object'){
      STAFF = {
        owner: content.staff.owner || {},
        members: Array.isArray(content.staff.members) ? content.staff.members : []
      };
      window.NOVAMC_STAFF = STAFF;
      STAFF_DETAIL_REGISTRY.clear();
      renderStaff();
    }
    if(Array.isArray(content.partners)){
      PARTNERS = content.partners;
      window.NOVAMC_PARTNERS = PARTNERS;
      PARTNER_DETAIL_REGISTRY.clear();
      renderPartners();
    }
  }
};

// ========== HELPERS ==========
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const safe = v=>String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

const sanitizeConfigHtml = value=>{
  const template = document.createElement('template');
  template.innerHTML = String(value || '');
  const allowedTags = new Set(['B','BR','EM','I','STRONG','SPAN']);
  const allowedStyle = /^\s*color\s*:\s*var\(--[a-z0-9_-]+\)\s*;?\s*$/i;

  template.content.querySelectorAll('*').forEach(node=>{
    if(!allowedTags.has(node.tagName)){
      node.replaceWith(document.createTextNode(node.textContent || ''));
      return;
    }

    [...node.attributes].forEach(attr=>{
      const name = attr.name.toLowerCase();
      const value = attr.value || '';
      if(name === 'style' && allowedStyle.test(value)) return;
      node.removeAttribute(attr.name);
    });
  });

  return template.innerHTML;
};
const safeClass = v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'') || 'item';

const STAFF_DETAIL_REGISTRY = new Map();
const STAFF_FIELD_LABELS = {
  username: 'Tên Minecraft',
  minecraft: 'Minecraft',
  discord: 'Discord',
  email: 'Email',
  status: 'Trạng thái',
  joined: 'Tham gia',
  timezone: 'Múi giờ',
  location: 'Khu vực',
  responsibilities: 'Phụ trách',
  skills: 'Kỹ năng',
  note: 'Ghi chú',
  quote: 'Câu nói',
  contact: 'Liên hệ',
  availability: 'Thời gian hỗ trợ',
  permissions: 'Quyền hạn',
  achievements: 'Thành tựu'
};
const safeUrl = value=>{
  const url = String(value || '').trim();
  if(!url) return '#';
  if(url === '#') return '#';
  if(url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) return safe(url);
  if(/^(https?:|mailto:|tel:)/i.test(url)) return safe(url);
  return '#';
};

const isKnownMinecraftName = value=>{
  const name = String(value || '').trim();
  if(!name) return false;
  const normalized = name.toLowerCase();
  return !/(chưa|chua|đang|dang|cập nhật|cap nhat|update)/i.test(normalized);
};

const staffSkinUrl = person=>{
  const explicit = person?.avatarUrl || person?.skinAvatar || person?.skinUrl || person?.image || person?.photo || person?.headUrl;
  if(explicit) return explicit;
  const username = person?.username || person?.minecraft || person?.minecraftName || person?.mcName || person?.mc;
  if(!isKnownMinecraftName(username)) return '';
  return `https://mc-heads.net/avatar/${encodeURIComponent(String(username).trim())}/128`;
};

const renderStaffAvatar = (person={}, fallback='✨')=>{
  const img = staffSkinUrl(person);
  if(img){
    return `<img src="${safeUrl(img)}" alt="${safe(person.name || person.username || 'Minecraft skin')}" loading="lazy" referrerpolicy="no-referrer" />`;
  }
  return safe(person.avatar || fallback);
};

const socialVisualMarkup = (item={}, className='social-image')=>{
  const img = item.image || item.imageUrl || item.iconImage || item.iconUrl || item.img || '';
  const label = item.label || 'Liên kết';
  if(img){
    return `<img class="${safe(className)}" src="${safeUrl(img)}" alt="${safe(label)}" loading="lazy" decoding="async" />`;
  }
  return `<span class="social-emoji" aria-hidden="true">${safe(item.icon || '🔗')}</span>`;
};

const isDiscordLinkItem = item=>{
  const haystack = `${item?.label || ''} ${item?.url || ''} ${item?.href || ''}`.toLowerCase();
  return haystack.includes('discord');
};

const discordPopupAttrs = item=>{
  if(item?.unavailable) return 'data-unavailable-contact="Chưa cập nhật"';
  if(item?.modal || isDiscordLinkItem(item)) return 'data-modal="discord"';
  return 'target="_blank" rel="noopener noreferrer"';
};

const discordPopupHref = item=> (item?.modal || isDiscordLinkItem(item)) ? '#discord' : safeUrl(item?.url);

// ========== RENDER BASICS ==========
function renderBasics(){
  document.title = SITE.title || 'NovaMC';
  const metaDesc = document.querySelector('meta[name="description"]');
  if(metaDesc && SITE.description) metaDesc.setAttribute('content', SITE.description);

  $$('[data-nav-logo-icon]').forEach(el=>el.textContent=SITE.navLogoIcon || '☁️');
  $$('[data-mobile-logo]').forEach(el=>el.textContent=SITE.navLogoIcon || '☁️');
  $$('[data-hero-badge]').forEach(el=>el.textContent=SITE.hero?.badge || '');
  $$('[data-title-left]').forEach(el=>el.textContent=SITE.hero?.titleLeft || 'NOVA');
  $$('[data-title-right]').forEach(el=>el.textContent=SITE.hero?.titleRight || 'MC');
  $$('[data-hero-sub]').forEach(el=>el.textContent=SITE.hero?.subtitle || '');
  $$('[data-hero-desc]').forEach(el=>el.innerHTML=sanitizeConfigHtml(SITE.hero?.description || ''));
  $$('[data-status-state]').forEach(el=>el.textContent=SITE.status?.text || 'TRỰC TUYẾN');
  $$('[data-player-subtext]').forEach(el=>el.textContent=SITE.status?.playerSubtext || 'đang online');
  $$('[data-ping-subtext]').forEach(el=>el.textContent=SITE.status?.pingSubtext || 'kết nối ổn định');

  $$('[data-connect-ticket-label]').forEach(el=>el.textContent=SITE.connectionTicket?.label || 'Địa Chỉ Server');
  $$('[data-connect-ticket-ip]').forEach(el=>el.textContent=SITE.connectionTicket?.ip || 'NOVAMC.VN');
  $$('[data-connect-ticket-note]').forEach(el=>el.textContent=SITE.connectionTicket?.note || 'Nhấn để mở bảng thông tin kết nối');

  $$('[data-info-intro]').forEach(el=>el.textContent=SITE.sections?.infoIntro || '');
  $$('[data-features-intro]').forEach(el=>el.textContent=SITE.sections?.featuresIntro || '');
  $$('[data-staff-title]').forEach(el=>el.textContent=SITE.sections?.staffTitle || 'Đội Ngũ Vận Hành NovaMC');
  $$('[data-staff-desc]').forEach(el=>el.textContent=SITE.sections?.staffDesc || '');
  $$('[data-world-title]').forEach(el=>el.textContent=SITE.world?.title || '');
  $$('[data-world-desc]').forEach(el=>el.textContent=SITE.world?.description || '');
  const worldStats = $('[data-world-stats]');
  if(worldStats && Array.isArray(SITE.world?.stats)){
    const stats = SITE.world.stats;
    worldStats.innerHTML = stats.length ? stats.map(s=>`<div><strong>${safe(s.value)}</strong><span>${safe(s.label)}</span></div>`).join('') : '';
    worldStats.style.display = stats.length ? '' : 'none';
  }

  $$('[data-footer-quote]').forEach(el=>el.innerHTML=sanitizeConfigHtml(SITE.footer?.quote || ''));
  $$('[data-footer-since]').forEach(el=>el.innerHTML=`${safe(SITE.footer?.since || 'SINCE 2025')} • <span>${safe(SITE.serverName || 'NovaMC')}</span>`);
  $$('[data-footer-tagline]').forEach(el=>el.textContent=SITE.footer?.tagline || '');
  $$('[data-copyright]').forEach(el=>{
    const year = safe(SITE.footer?.copyrightYear || new Date().getFullYear());
    const name = safe(String(SITE.serverName || 'NovaMC').toUpperCase());
    el.innerHTML=`
      <div class="footer-legal-brand">© ${year} <strong>${name}</strong></div>
      <div class="footer-legal-message">Được xây dựng bằng tâm huyết dành cho cộng đồng Minecraft Việt Nam.</div>
      <div class="footer-legal-note">${name} là máy chủ cộng đồng độc lập, không phải sản phẩm chính thức của Minecraft và không được Mojang hoặc Microsoft phê duyệt hay liên kết.</div>
    `;
  });

  const btnHolder=$('[data-hero-buttons]');
  if(btnHolder){
    btnHolder.innerHTML=(SITE.hero?.buttons || []).map(b=>{
      const cls=b.type==='primary'?'btn-p':'btn-s';
      if(b.modal) return `<a href="#" data-modal="${safe(b.modal)}" class="${cls}">${safe(b.label)}</a>`;
      return `<a href="${safeUrl(b.href || '#')}" class="${cls}">${safe(b.label)}</a>`;
    }).join('');
  }
}

// ========== RENDER INFO ==========
let infoActiveIndex = 2;

function makeInfoSummary(card){
  if(card.summary) return String(card.summary);
  const desc = String(card.desc || 'Thông tin NovaMC đang được cập nhật.');
  return desc.length > 128 ? `${desc.slice(0, 125).trim()}...` : desc;
}

function makeInfoHighlights(card){
  if(Array.isArray(card.highlights) && card.highlights.length) return card.highlights;
  const tags = Array.isArray(card.tags) ? card.tags.map(t=>typeof t === 'string' ? t : t.text).filter(Boolean) : [];
  const platforms = Array.isArray(card.platforms) ? card.platforms : [];
  const base = [...tags, ...platforms];
  if(card.badge) base.unshift(card.badge);
  if(card.stat?.label) base.push(card.stat.label);
  return base.slice(0, 6);
}

function makeInfoStats(card){
  if(Array.isArray(card.stats) && card.stats.length) return card.stats;
  const stats = [];
  if(card.stat) stats.push(card.stat);
  if(Array.isArray(card.platforms) && card.platforms.length){
    stats.push({ value: String(card.platforms.length), label: 'Nền tảng hỗ trợ' });
  }
  if(Array.isArray(card.tags) && card.tags.length){
    stats.push({ value: String(card.tags.length), label: 'Điểm nổi bật' });
  }
  return stats.slice(0, 4);
}

function renderInfoDetail(index = infoActiveIndex, keepViewport = false, keepNode = null){
  const root = $('[data-info-grid]');
  const body = $('[data-info-detail-body]', root || document);
  const items = Array.isArray(INFO) ? INFO : [];
  if(!root || !body || !items.length) return;

  // Khi đổi nội dung chi tiết, chiều cao panel có thể thay đổi.
  // Giữ vị trí nút vừa bấm để trang không bị giật lên/xuống.
  const lockedNode = keepNode || (keepViewport ? document.activeElement?.closest?.('[data-info-card]') : null);
  const lockedTop = lockedNode ? lockedNode.getBoundingClientRect().top : null;

  infoActiveIndex = (Number(index) + items.length) % items.length;
  const card = items[infoActiveIndex];
  const number = card.number || String(infoActiveIndex + 1).padStart(2,'0');
  const highlights = makeInfoHighlights(card).slice(0, 6);
  const stats = makeInfoStats(card).slice(0, 4);
  const tags = Array.isArray(card.tags) && card.tags.length
    ? card.tags.slice(0, 6).map(t=>`<span class="info-detail-tag ${safe(t.className || '')}">${safe(t.text || t)}</span>`).join('')
    : '';
  const platforms = Array.isArray(card.platforms) && card.platforms.length
    ? `<div class="info-detail-platforms">${card.platforms.map(p=>`<span>${safe(p)}</span>`).join('')}</div>`
    : '';
  const highlightList = highlights.length
    ? `<div class="info-highlight-grid">${highlights.map(item=>`<span><i>✓</i>${safe(item)}</span>`).join('')}</div>`
    : '';
  const statList = stats.length
    ? `<div class="info-stat-row">${stats.map(stat=>`<div><b>${safe(stat.value)}</b><small>${safe(stat.label)}</small></div>`).join('')}</div>`
    : '';

  body.innerHTML = `
    <div class="info-detail-shell">
      <div class="info-detail-headline">
        <span class="info-detail-num">${safe(number)}</span>
        <div>
          <small>${safe(card.label || 'Thông tin')}</small>
          <strong>Thông tin chi tiết</strong>
        </div>
        <em data-info-count>${safe(number)} / ${String(items.length).padStart(2,'0')}</em>
      </div>

      <div class="info-detail-main">
        <span class="info-detail-icon">${safe(card.icon || '✨')}</span>
        <div>
          <h3>${safe(card.title || 'Thông tin NovaMC')}</h3>
          <p>${safe(makeInfoSummary(card))}</p>
        </div>
      </div>

      <div class="info-detail-copy">
        <h4>Nội dung đầy đủ</h4>
        <p>${safe(card.desc || 'Nội dung chi tiết đang được cập nhật.')}</p>
      </div>

      ${platforms ? `<div class="info-detail-copy"><h4>Nền tảng hỗ trợ</h4>${platforms}</div>` : ''}
      ${highlightList ? `<div class="info-detail-copy"><h4>Điểm nổi bật</h4>${highlightList}</div>` : ''}
    </div>
  `;

  $$('[data-info-card]', root).forEach((btn)=>{
    const active = Number(btn.dataset.infoCard || 0) === infoActiveIndex;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
  });
  $$('[data-info-orbit]', root).forEach((btn)=>{
    const active = Number(btn.dataset.infoOrbit || 0) === infoActiveIndex;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-current', active ? 'true' : 'false');
  });
  const count = $('[data-info-count]', root);
  if(count) count.textContent = `${safe(number)} / ${String(items.length).padStart(2,'0')}`;
  if(keepViewport && lockedNode && typeof lockedTop === 'number'){
    requestAnimationFrame(()=>{
      const nextTop = lockedNode.getBoundingClientRect().top;
      const delta = nextTop - lockedTop;
      if(Math.abs(delta) > 1){
        window.scrollBy({ top: delta, left: 0, behavior: 'auto' });
      }
    });
  }
}

function renderInfo(){
  const grid=$('[data-info-grid]');
  if(!grid)return;
  const items = Array.isArray(INFO) ? INFO : [];
  if(!items.length){
    grid.innerHTML = '<div class="gallery-empty">Thông tin NovaMC đang được cập nhật.</div>';
    return;
  }
  infoActiveIndex = Math.min(2, items.length - 1);

  grid.innerHTML = `
    <div class="info-cloud-layout">
      <div class="info-cloud-showcase reveal rd1">
        <div class="info-orbit-panel" aria-label="Sơ đồ hệ sinh thái NovaMC">
          <div class="info-orbit-copy">
            <span>NovaMC Core</span>
            <h3>Thông tin NovaMC</h3>
            <p>Chọn từng mục để xem nội dung chi tiết và điểm nổi bật.</p>
          </div>
          <div class="info-orbit-map">
            <div class="info-orbit-ring ring-a"></div>
            <div class="info-orbit-ring ring-b"></div>
            <div class="info-orbit-ring ring-c"></div>
            <div class="info-orbit-core"><span>🌐</span><b>NovaMC</b><small>Survival Server</small></div>
            ${items.map((card, i)=>`
              <button class="info-orbit-node node-${i+1}${i === infoActiveIndex ? ' active' : ''}" type="button" data-info-card="${i}" data-info-orbit="${i}" aria-current="${i === infoActiveIndex ? 'true' : 'false'}" title="${safe(card.title || `Mục ${i+1}`)}">
                <span>${safe(card.icon || '✨')}</span>
                <b>${safe(card.label || card.title || `Mục ${i+1}`)}</b>
              </button>
            `).join('')}
          </div>
        </div>

        <aside class="info-detail-panel" data-info-detail-panel>
          ${items.length > 1 ? `
            <div class="info-mobile-pager" aria-label="Chuyển trang thông tin">
              <button class="info-page-arrow info-page-arrow-prev" type="button" data-info-step="-1" aria-label="Xem mục thông tin trước">←</button>
              <button class="info-page-arrow info-page-arrow-next" type="button" data-info-step="1" aria-label="Xem mục thông tin tiếp theo">→</button>
            </div>
          ` : ''}
          <div data-info-detail-body></div>
        </aside>
      </div>
    </div>
  `;
  renderInfoDetail(infoActiveIndex);
}

// ========== RENDER FEATURES ==========
function renderFeatures(){
  const grid=$('[data-features-grid]');
  if(!grid)return;
  grid.innerHTML=FEATURES.map((f,i)=>`
    <article class="feature-panel reveal rd${(i%4)+1}">
      <div class="feature-index">${String(i+1).padStart(2,'0')}</div>
      <div class="feature-icon">${safe(f.icon)}</div>
      <h3 class="feature-title">${safe(f.title)}</h3>
      <p class="feature-desc">${safe(f.desc)}</p>
    </article>
  `).join('');
}


function renderProtection(){
  const wrap=$('[data-protection-layout]');
  if(!wrap)return;
  const data=PROTECTION || {};
  const points=Array.isArray(data.points) ? data.points : [];
  const stats=Array.isArray(data.stats) ? data.stats : [];
  wrap.innerHTML=`
    <div class="protection-copy">
      <div class="protection-badge"><span>${safe(data.icon || '🛡️')}</span>${safe(data.badge || 'LỚP BẢO VỆ RIÊNG')}</div>
      <h3>${safe(data.title || 'Bảo Vệ AntiDDoS Layer 7')}</h3>
      <p>${safe(data.desc || 'NovaMC tách riêng lớp bảo vệ AntiDDoS Layer 7 để nhấn mạnh khả năng duy trì kết nối ổn định và hạn chế gián đoạn trong quá trình vận hành.')}</p>
      <div class="protection-points">
        ${points.map(point=>`<span>${safe(point)}</span>`).join('')}
      </div>
    </div>
    <div class="protection-shield" aria-hidden="true">
      <div class="shield-orb"><span>${safe(data.icon || '🛡️')}</span></div>
      <div class="shield-rings"><i></i><i></i><i></i></div>
      <div class="protection-stats">
        ${stats.map(item=>`
          <div class="protection-stat">
            <b>${safe(item.value)}</b>
            <small>${safe(item.label)}</small>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}


// ========== STAFF DETAIL HELPERS ==========
function normalizeStaffProfile(person={}, fallbackRole='Staff'){
  return {
    avatar: person.avatar || '✨',
    role: person.role || fallbackRole,
    name: person.name || 'Đang cập nhật',
    desc: person.desc || person.bio || 'Thông tin thành viên đang được cập nhật.',
    ...person
  };
}

function renderStaffValue(value, key=''){
  if(Array.isArray(value)){
    const chipClass = key === 'responsibilities' ? ' staff-detail-chips--responsibilities' : '';
    return `<div class="staff-detail-chips${chipClass}">${value.map((v,i)=>{
      const label = typeof v === 'object' ? (v.label || v.text || v.name || JSON.stringify(v)) : v;
      return `<span class="staff-chip-${i+1}">${safe(label)}</span>`;
    }).join('')}</div>`;
  }
  if(value && typeof value === 'object'){
    return `<div class="staff-detail-nested">${Object.entries(value).map(([k,v])=>`<div><b>${safe(STAFF_FIELD_LABELS[k] || k)}</b><span>${safe(Array.isArray(v) ? v.join(', ') : v)}</span></div>`).join('')}</div>`;
  }
  return `<span>${safe(value || 'Chưa cập nhật')}</span>`;
}

function normalizeStaffLinks(person={}){
  const links=[];
  const pushLink=(label,url,icon='🔗',options={})=>{
    if(!url && !options.unavailable) return;
    links.push({ label, url: url || '#', icon, unavailable: Boolean(options.unavailable) });
  };

  if(Array.isArray(person.links)){
    person.links.forEach(link=>{
      if(typeof link === 'string') pushLink('Liên kết', link, '🔗');
      else if(link && typeof link === 'object') pushLink(link.label || link.name || 'Liên kết', link.url || link.href || '#', link.icon || '🔗', { unavailable: link.unavailable || link.updated === false });
    });
  }else if(person.links && typeof person.links === 'object'){
    Object.entries(person.links).forEach(([label,url])=>pushLink(label, url, '🔗'));
  }

  const socialMap = [
    ['Discord', person.discordUrl || person.discordLink, '💬'],
    ['Facebook', person.facebook, '📘'],
    ['TikTok', person.tiktok, '🎵'],
    ['YouTube', person.youtube, '📺'],
    ['GitHub', person.github, '💻'],
    ['Bio', person.bioLink || person.bioUrl || person.bioWebsite, '🪪'],
    ['Website', person.website, '🌐'],
    ['Khác', person.otherWebsite || person.otherUrl || person.websiteOther || person.websiteKhac, '🌐'],
    ['Email', person.email ? `mailto:${person.email}` : '', '✉️']
  ];
  socialMap.forEach(([label,url,icon])=>pushLink(label,url,icon));

  const seen=new Set();
  return links.filter(link=>{
    const key=`${link.label}|${link.url}`;
    if(seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function renderStaffDetailFields(person={}){
  const hidden = new Set(['id','cls','avatar','role','name','desc','bio','links','facebook','tiktok','youtube','github','website','email','discordUrl','discordLink']);
  const entries = Object.entries(person).filter(([key,value])=>{
    if(hidden.has(key)) return false;
    if(value === undefined || value === null || value === '') return false;
    if(Array.isArray(value) && !value.length) return false;
    return true;
  });
  if(!entries.length) return '<div class="staff-detail-empty">Chưa có thông tin chi tiết bổ sung.</div>';
  return entries.map(([key,value])=>`
    <article class="staff-detail-field staff-detail-field--${safeClass(key)}" data-field="${safe(key)}">
      <small>${safe(STAFF_FIELD_LABELS[key] || key)}</small>
      ${renderStaffValue(value, key)}
    </article>
  `).join('');
}

function openStaffDetail(id){
  const body = $('[data-staff-detail-body]');
  if(!body) return;
  const person = normalizeStaffProfile(STAFF_DETAIL_REGISTRY.get(id) || {}, 'Staff');
  const links = normalizeStaffLinks(person);
  const linkMarkup = links.length ? links.map(link=>`
    <a class="staff-detail-link${link.unavailable ? ' is-unavailable' : ''}" href="${safeUrl(link.url)}" ${link.unavailable ? 'data-unavailable-contact="Chưa cập nhật"' : 'target="_blank" rel="noopener noreferrer"'}>
      <span>${safe(link.icon || '🔗')}</span>
      <b>${safe(link.label || 'Liên kết')}</b>
    </a>
  `).join('') : '<div class="staff-detail-empty">Chưa cập nhật đường link cho thành viên này.</div>';

  body.innerHTML = `
    <section class="staff-detail-page">
      <div class="staff-detail-hero">
        <div class="staff-detail-avatar">${renderStaffAvatar(person, '✨')}</div>
        <div>
          <small>${safe(String(person.role || 'Staff').toUpperCase())}</small>
          <h2>${safe(person.name || 'Đang cập nhật')}</h2>
          <p>${safe(person.desc || person.bio || 'Thông tin thành viên đang được cập nhật.')}</p>
        </div>
      </div>

      <div class="staff-detail-section">
        <div class="staff-detail-section-title">Hồ sơ cá nhân & vai trò</div>
        <div class="staff-detail-grid">
          ${renderStaffDetailFields(person)}
        </div>
      </div>

      <div class="staff-detail-section">
        <div class="staff-detail-section-title">Đường link liên hệ / mạng xã hội: Facebook · Bio · Khác</div>
        <div class="staff-detail-links">
          ${linkMarkup}
        </div>
      </div>
    </section>
  `;
  openModal('staff-detail');
}

const OTHER_ROLE_FAKE_USERS = [
  {
    avatar: "🎬",
    role: "Media",
    cls: "r-media",
    name: "Media 01",
    desc: "Tài khoản đại diện nhóm Media, hỗ trợ hình ảnh, nội dung ngắn và truyền thông cộng đồng cho NovaMC.",
    username: "NovaMedia01",
    status: "Hồ sơ ảo",
    joined: "2026",
    responsibilities: ["Nội dung truyền thông", "Hình ảnh sự kiện", "Lan tỏa cộng đồng"],
    note: "User ảo dùng để trình bày vai trò Media."
  },
  {
    avatar: "📸",
    role: "Media",
    cls: "r-media",
    name: "Media 02",
    desc: "Tài khoản đại diện nhóm Media, phụ trách ý tưởng video, ảnh giới thiệu và các bài đăng nổi bật.",
    username: "NovaMedia02",
    status: "Hồ sơ ảo",
    joined: "2026",
    responsibilities: ["Ý tưởng nội dung", "Video ngắn", "Bài đăng cộng đồng"],
    note: "User ảo dùng để trình bày vai trò Media."
  },
  {
    avatar: "💎",
    role: "Donator",
    cls: "r-donator",
    name: "Donator 01",
    desc: "Tài khoản đại diện nhóm Donator, tượng trưng cho những người ủng hộ và đồng hành cùng quá trình phát triển NovaMC.",
    username: "NovaDonator01",
    status: "Hồ sơ ảo",
    joined: "2026",
    responsibilities: ["Ủng hộ máy chủ", "Đồng hành phát triển", "Góp phần duy trì cộng đồng"],
    note: "User ảo dùng để trình bày vai trò Donator."
  },
  {
    avatar: "💠",
    role: "Donator",
    cls: "r-donator",
    name: "Donator 02",
    desc: "Tài khoản đại diện nhóm Donator, hiển thị trong khu vực vai trò khác để giao diện có bố cục đầy đủ và chuyên nghiệp.",
    username: "NovaDonator02",
    status: "Hồ sơ ảo",
    joined: "2026",
    responsibilities: ["Đóng góp cộng đồng", "Ủng hộ vận hành", "Gắn bó lâu dài"],
    note: "User ảo dùng để trình bày vai trò Donator."
  }
];

function renderOtherRolesList(){
  const body = $('[data-other-roles-body]');
  if(!body) return;
  const groups = [
    { key:'media', title:'Media', icon:'🎬', desc:'Nhóm hỗ trợ hình ảnh, nội dung truyền thông và lan tỏa hoạt động của NovaMC.', items: OTHER_ROLE_FAKE_USERS.filter(item=>normalizeRoleName(item.role).includes('media')) },
    { key:'donator', title:'Donator', icon:'💎', desc:'Nhóm đại diện cho những người ủng hộ, đóng góp và đồng hành cùng quá trình phát triển NovaMC.', items: OTHER_ROLE_FAKE_USERS.filter(item=>normalizeRoleName(item.role).includes('donator')) }
  ];
  body.innerHTML = `
    <section class="other-roles-page">
      <div class="other-roles-hero">
        <span>✨</span>
        <div>
          <small>Vai trò khác</small>
          <h2>Media & Donator</h2>
          <p>Danh sách này sử dụng user ảo để trình bày khu vực Vai trò khác. Media luôn nằm trên, Donator nằm dưới đúng theo bố cục yêu cầu.</p>
        </div>
      </div>
      ${groups.map(group=>`
        <article class="other-role-group other-role-group--${group.key}">
          <div class="other-role-group-head">
            <div><span>${group.icon}</span><b>${group.title}</b></div>
            <p>${group.desc}</p>
          </div>
          <div class="other-role-list">
            ${group.items.map((person,i)=>`
              <article class="other-role-profile" tabindex="0" role="button" data-staff-detail-id="other-role-${group.key}-${i}" aria-label="Xem hồ sơ ${safe(person.name)}">
                <div class="other-role-avatar">${renderStaffAvatar(person, person.avatar)}</div>
                <div class="other-role-copy">
                  <h3>${safe(person.name)}</h3>
                  <small class="${safe(person.cls)}">${safe(person.role)}</small>
                  <p>${safe(person.desc)}</p>
                </div>
              </article>
            `).join('')}
          </div>
        </article>
      `).join('')}
    </section>
  `;
}

function openOtherRolesList(){
  OTHER_ROLE_FAKE_USERS.forEach((person,i)=>{
    const key = normalizeRoleName(person.role).includes('media') ? `other-role-media-${OTHER_ROLE_FAKE_USERS.filter((p,idx)=>idx<i && normalizeRoleName(p.role).includes('media')).length}` : `other-role-donator-${OTHER_ROLE_FAKE_USERS.filter((p,idx)=>idx<i && normalizeRoleName(p.role).includes('donator')).length}`;
    STAFF_DETAIL_REGISTRY.set(key, normalizeStaffProfile(person, person.role));
  });
  renderOtherRolesList();
  openModal('other-roles');
}

// ========== RENDER STAFF (UPDATED GROUPS) ==========
function roleClassFor(role='Staff'){
  const key = String(role || 'Staff').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  if(key.includes('admin')) return 'r-admin';
  if(key.includes('owner')) return 'r-owner';
  if(key.includes('helper')) return 'r-help';
  if(key.includes('moderator') || key === 'mod') return 'r-mod';
  if(key.includes('developer') || key.includes('dev')) return 'r-dev';
  if(key.includes('staff')) return 'r-staff';
  if(key.includes('builder') || key.includes('build')) return 'r-build';
  if(key.includes('donator') || key.includes('donate')) return 'r-donator';
  if(key.includes('media') || key.includes('creator')) return 'r-media';
  return 'r-other';
}

function normalizeRoleName(role='Staff'){
  return String(role || 'Staff').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}

function renderStaff(){
  STAFF_DETAIL_REGISTRY.clear();
  const ownerWrap=$('[data-owner-wrap]');
  const owner=normalizeStaffProfile(STAFF.owner || {}, 'Owner');
  owner.cls = owner.cls || roleClassFor(owner.role);
  STAFF_DETAIL_REGISTRY.set('owner', owner);

  if(ownerWrap){
    ownerWrap.innerHTML=`<article class="captain-card owner-premium-card staff-clickable" tabindex="0" role="button" data-staff-detail-id="owner" aria-label="Xem hồ sơ ${safe(owner.name)}">
      <span class="owner-card-glow owner-card-glow-a" aria-hidden="true"></span>
      <span class="owner-card-glow owner-card-glow-b" aria-hidden="true"></span>
      <span class="owner-card-lines" aria-hidden="true"></span>
      <div class="captain-avatar owner-avatar">${renderStaffAvatar(owner, '👑')}</div>
      <div class="captain-info owner-info">
        <small class="owner-rank-badge"><span class="owner-rank-icon" aria-hidden="true">👑</span><span>${safe(owner.role || 'Owner')}</span></small>
        <h3>${safe(owner.name || 'NovaMC')}</h3>
        <p>${safe(owner.desc || 'Người chịu trách nhiệm định hướng và vận hành tổng thể của NovaMC.')}</p>
        <span class="staff-view-hint owner-cta"><span>Nhấn để xem hồ sơ & liên kết</span><i aria-hidden="true">›</i></span>
      </div>
    </article>`;
  }

  const members=Array.isArray(STAFF.members) ? STAFF.members : [];
  const admins=members.filter(m=>normalizeRoleName(m.role)==='admin');
  const coreRoles=new Set(['staff','moderator','mod','helper','developer','dev']);
  const midRow=members.filter(m=>coreRoles.has(normalizeRoleName(m.role)));
  const others=members.filter(m=>{
    const r=normalizeRoleName(m.role);
    return r !== 'admin' && !coreRoles.has(r);
  });

  const placeholderStaff = (fallbackRole='Staff') => ({
    name:'Đang cập nhật',
    role:fallbackRole,
    cls:`${roleClassFor(fallbackRole)} is-updating-role`,
    avatar:fallbackRole === 'Donator' ? '💎' : fallbackRole === 'Media' ? '🎬' : fallbackRole === 'Builder' ? '🔨' : '✨',
    desc:`Thông tin ${fallbackRole} đang được cập nhật.`,
    status:'Chưa cập nhật',
    joined:'Chưa cập nhật',
    responsibilities:['Đang cập nhật'],
    links:[]
  });

  function fillToCount(list, count, fallbackRoles='Staff'){
    const roles = Array.isArray(fallbackRoles) ? fallbackRoles : [fallbackRoles];
    const filled = list.slice(0, count);
    let i=0;
    while(filled.length < count){
      filled.push(placeholderStaff(roles[i % roles.length] || 'Staff'));
      i++;
    }
    return filled;
  }

  function makeTrack(list,trackId,fallbackRole='Staff',speed='16s',options={}){
    const track=$(`#${trackId}`);
    if(!track)return;
    const baseList = list.length ? list : [placeholderStaff(Array.isArray(fallbackRole) ? fallbackRole[0] : fallbackRole)];
    const isStatic = options.static === true;
    const repeatCount = isStatic ? 1 : 4;
    const displayList = isStatic ? baseList : Array.from({length:repeatCount}).flatMap(()=>baseList);

    track.classList.toggle('is-static', isStatic);
    track.classList.toggle('is-pulse-row', isStatic);
    if(isStatic){
      track.style.removeProperty('--staff-loop-shift');
      track.style.removeProperty('--staff-speed');
    }else{
      track.style.setProperty('--staff-loop-shift', `${-(100 / repeatCount)}%`);
      track.style.setProperty('--staff-speed', speed);
    }

    displayList.forEach((raw,i)=>{
      const profile=normalizeStaffProfile(raw, Array.isArray(fallbackRole) ? fallbackRole[0] : fallbackRole);
      profile.cls = profile.cls || roleClassFor(profile.role);
      STAFF_DETAIL_REGISTRY.set(`${trackId}-${i}`, profile);
    });
    track.innerHTML=displayList.map((s,i)=>{
      const profile = normalizeStaffProfile(s, Array.isArray(fallbackRole) ? fallbackRole[0] : fallbackRole);
      profile.cls = profile.cls || roleClassFor(profile.role);
      const detailId = `${trackId}-${i}`;
      const isUpdating = profile.name === 'Đang cập nhật' || profile.status === 'Chưa cập nhật';
      return `<article class="crew-card-day staff-clickable${isUpdating ? ' is-updating-card' : ''}" tabindex="0" role="button" data-staff-detail-id="${safe(detailId)}" aria-label="Xem hồ sơ ${safe(profile.name)}" title="${safe(profile.name)} - ${safe(profile.role)}">
        <div class="crew-avatar-day">${renderStaffAvatar(profile, '✨')}</div>
        <div class="crew-name-day${isUpdating ? ' is-updating-name' : ''}">${safe(profile.name)}</div>
        <div class="crew-role-day ${safe(profile.cls)}">${safe(String(profile.role).toUpperCase())}</div>
        <span class="crew-view-hint">Xem hồ sơ</span>
      </article>`;
    }).join('');
  }

  makeTrack(fillToCount(admins, 1, 'Admin'),'staff-track-admin','Admin','13s',{static:true});
  makeTrack(midRow,'staff-track-mid','Staff','14s',{static:true});
  makeTrack(OTHER_ROLE_FAKE_USERS,'staff-track-other',['Media','Donator'],'18s',{static:false});
}


// ========== PARTNERS ==========
const PARTNER_DETAIL_REGISTRY = new Map();
const PARTNER_FIELD_LABELS = {
  category:'Hạng mục',
  status:'Trạng thái',
  joined:'Hợp tác từ',
  benefits:'Quyền lợi / đóng góp',
  contact:'Liên hệ',
  representative:'Đại diện',
  discord:'Discord',
  website:'Website',
  scope:'Phạm vi hợp tác',
  discordInvite:'Discord Invite',
  discordMemberCount:'Thành viên Discord',
  discordOnlineCount:'Đang online',
  desc:'Mô tả đầy đủ'
};

function normalizePartnerProfile(partner={}, index=0){
  const inviteOnly = Boolean(partner.displayOnlyInvite);
  return {
    id: partner.id || `partner-${index+1}`,
    icon: partner.icon || '🤝',
    name: partner.name || `Đối Tác ${String(index+1).padStart(2,'0')}`,
    category: inviteOnly ? '' : (partner.category || 'Đối tác cộng đồng'),
    status: inviteOnly ? '' : (partner.status || 'Đang cập nhật hồ sơ'),
    shortDesc: partner.shortDesc || partner.desc || 'Thông tin đối tác đang được cập nhật.',
    desc: partner.desc || partner.shortDesc || 'Thông tin đối tác đang được cập nhật.',
    ...partner
  };
}

function renderPartnerValue(value, key=''){
  if(Array.isArray(value)){
    return `<div class="partner-detail-chips">${value.map((item,i)=>{
      const label = typeof item === 'object' ? (item.label || item.text || item.name || JSON.stringify(item)) : item;
      return `<span class="partner-chip-${i+1}">${safe(label)}</span>`;
    }).join('')}</div>`;
  }
  if(value && typeof value === 'object'){
    return `<div class="partner-detail-nested">${Object.entries(value).map(([k,v])=>{
      const display = Array.isArray(v) ? v.join(', ') : v;
      return `<div><b>${safe(PARTNER_FIELD_LABELS[k] || k)}</b><span>${safe(display || 'Chưa cập nhật')}</span></div>`;
    }).join('')}</div>`;
  }
  return `<span>${safe(value || 'Chưa cập nhật')}</span>`;
}

function renderPartnerDetailFields(partner={}){
  const hidden = new Set(['id','icon','name','shortDesc','links','url','websiteUrl','note','contact','discordInvite','discordInviteUrl','avatarUrl','iconUrl','discordIconUrl','serverIconUrl','discordSynced','displayOnlyInvite','lockDisplayName']);
  const preferred = ['category','status','joined','benefits','desc'];
  const entries = [];
  preferred.forEach(key=>{
    if(partner[key] !== undefined && partner[key] !== null && partner[key] !== '') entries.push([key, partner[key]]);
  });
  Object.entries(partner).forEach(([key,value])=>{
    if(hidden.has(key) || preferred.includes(key)) return;
    if(value === undefined || value === null || value === '') return;
    if(Array.isArray(value) && !value.length) return;
    entries.push([key,value]);
  });
  return entries.map(([key,value])=>`
    <article class="partner-detail-field partner-detail-field--${safeClass(key)}">
      <small>${safe(PARTNER_FIELD_LABELS[key] || key)}</small>
      ${renderPartnerValue(value, key)}
    </article>
  `).join('');
}

function partnerLinks(partner={}){
  const links=[];
  const contact = partner.contact && typeof partner.contact === 'object' ? partner.contact : {};
  const invite = partner.discordInviteUrl || partner.discordInvite || partner.inviteUrl || partner.invite || contact.invite;
  const website = partner.websiteUrl || partner.website || contact.website || partner.url;
  const discord = partner.discordUrl || partner.discord || contact.discord;
  const facebook = partner.facebook || contact.facebook;
  const pushUnique=(label,icon,url)=>{
    if(!url || url === 'Đang cập nhật' || url === '#') return;
    const normalized = label === 'Discord' ? makeDiscordInviteUrl(url) : safeUrl(url);
    if(links.some(item=>item.label === label && item.url === normalized)) return;
    links.push({label, icon, url: normalized});
  };
  pushUnique('Discord', '💬', invite || discord);
  pushUnique('Website', '🌐', website);
  pushUnique('Facebook', '📘', facebook);
  return links;
}
function openPartnerDetail(id){
  const body=$('[data-partner-detail-body]');
  if(!body)return;
  const partner=normalizePartnerProfile(PARTNER_DETAIL_REGISTRY.get(id) || {}, 0);
  const links=partnerLinks(partner);
  const linkMarkup = links.length ? links.map(link=>`
    <a class="partner-detail-link" href="${safeUrl(link.url)}" target="_blank" rel="noopener noreferrer"><span>${safe(link.icon)}</span><b>${safe(link.label)}</b></a>
  `).join('') : '<div class="partner-detail-empty">Chưa cập nhật đường link chính thức cho đối tác này.</div>';
  body.innerHTML=`
    <section class="partner-detail-page">
      <div class="partner-detail-hero">
        <div class="partner-detail-icon">${partnerAvatarMarkup(partner)}</div>
        <div>
          <small>${safe(partner.category)}</small>
          <h2>${safe(partner.name)}</h2>
          <p>${safe(partner.desc || partner.shortDesc)}</p>
        </div>
      </div>
      <div class="partner-detail-section">
        <div class="partner-detail-section-title">Thông tin hợp tác</div>
        <div class="partner-detail-grid">${renderPartnerDetailFields(partner)}</div>
      </div>
      <div class="partner-detail-section">
        <div class="partner-detail-section-title">Liên kết đối tác</div>
        <div class="partner-detail-links">${linkMarkup}</div>
      </div>
    </section>
  `;
  openModal('partner-detail');
}


function extractDiscordInviteCode(value='') {
  const raw = String(value || '').trim();
  if(!raw) return '';
  const match = raw.match(/(?:discord\.gg\/|discord(?:app)?\.com\/invite\/)([A-Za-z0-9-]+)/i);
  if(match) return match[1];
  return /^[A-Za-z0-9-]{4,40}$/.test(raw) ? raw : '';
}

function makeDiscordInviteUrl(value='') {
  const code = extractDiscordInviteCode(value);
  if(code) return `https://discord.com/invite/${encodeURIComponent(code)}`;
  return safeUrl(value || '#');
}

function partnerAvatarMarkup(partner={}) {
  const url = partner.avatarUrl || partner.iconUrl || partner.discordIconUrl || partner.serverIconUrl || '';
  if(url){
    return `<img src="${safeUrl(url)}" alt="${safe(partner.name || 'Đối tác Discord')}" loading="lazy" referrerpolicy="no-referrer" />`;
  }
  return safe(partner.icon || '🤝');
}

async function fetchDiscordPartnerProfile(partner={}) {
  const inviteSource = partner.discordInvite || partner.discordInviteUrl || partner.inviteUrl || partner.invite || partner.url || partner.discord || '';
  const code = extractDiscordInviteCode(inviteSource);
  if(!code) return null;
  const endpoint = `https://discord.com/api/v10/invites/${encodeURIComponent(code)}?with_counts=true`;
  const res = await fetch(endpoint, { cache: 'no-store' });
  if(!res.ok) throw new Error(`Discord invite fetch failed: ${res.status}`);
  const data = await res.json();
  const guild = data.guild || {};
  if(!guild.id) return null;
  const iconHash = guild.icon || '';
  const ext = iconHash.startsWith('a_') ? 'gif' : 'webp';
  const avatarUrl = iconHash ? `https://cdn.discordapp.com/icons/${guild.id}/${iconHash}.${ext}?size=128` : '';
  return {
    name: partner.lockDisplayName ? partner.name : (guild.name || partner.name),
    avatarUrl,
    discordInviteUrl: `https://discord.com/invite/${encodeURIComponent(code)}`,
    discordMemberCount: data.approximate_member_count,
    discordOnlineCount: data.approximate_presence_count,
    status: partner.displayOnlyInvite ? '' : (partner.status || 'Discord')
  };
}

function updatePartnerCardDom(id, partner) {
  const key = String(id || '').replace(/\\/g,'\\\\').replace(/"/g,'\\"');
  $$(`[data-partner-card-id="${key}"]`).forEach(card=>{
    const avatar = $('.partner-marquee-avatar', card);
    const name = $('.partner-marquee-name', card);
    const status = $('.partner-marquee-status', card);
    if(avatar) avatar.innerHTML = partnerAvatarMarkup(partner);
    if(name) name.textContent = partner.name || 'Đối tác Discord';
    if(status) status.textContent = partner.status || 'Discord';
    card.setAttribute('aria-label', `Xem thông tin đối tác ${partner.name || 'Đối tác Discord'}`);
  });
}

async function hydrateDiscordPartners(partners=[]) {
  await Promise.all(partners.map(async (partner, i)=>{
    const id = partner.id || `partner-${i+1}`;
    try{
      const profile = await fetchDiscordPartnerProfile(partner);
      if(!profile) return;
      Object.assign(partner, profile, { discordSynced: true });
      PARTNER_DETAIL_REGISTRY.set(id, partner);
      updatePartnerCardDom(id, partner);
    }catch(err){
      console.warn('Không thể đồng bộ đối tác Discord:', err);
    }
  }));
}

function renderPartners(){
  const shell=$('[data-partners-showcase]');
  if(!shell)return;
  PARTNER_DETAIL_REGISTRY.clear();
  const partners = Array.isArray(PARTNERS) && PARTNERS.length ? PARTNERS : [];
  const display = partners.map((p,i)=>normalizePartnerProfile(p,i));
  const countNode = $('[data-partner-count]');
  if(countNode) countNode.textContent = String(display.length).padStart(2,'0');
  if(!display.length){
    shell.innerHTML='<div class="partner-empty">Chưa có đối tác nào được cập nhật.</div>';
    return;
  }

  display.forEach((partner,i)=>PARTNER_DETAIL_REGISTRY.set(partner.id || `partner-${i+1}`, partner));
  const animateMarquee = display.length > 5;
  const speed = Math.max(32, display.length * 5.5);
  const cardMarkup = display.map((partner,i)=>{
    const id = partner.id || `partner-${i+1}`;
    return `<article class="partner-marquee-card" tabindex="0" role="button" data-partner-detail-id="${safe(id)}" data-partner-card-id="${safe(id)}" aria-label="Xem thông tin đối tác ${safe(partner.name)}">
      <div class="partner-marquee-avatar">${partnerAvatarMarkup(partner)}</div>
      <div class="partner-marquee-copy">
        ${partner.category ? `<small>${safe(partner.category)}</small>` : ''}
        <h3 class="partner-marquee-name">${safe(partner.name)}</h3>
        ${partner.displayOnlyInvite ? '' : `<p>${safe(partner.shortDesc)}</p>`}
      </div>
      <div class="partner-marquee-foot">
        ${partner.status ? `<span class="partner-marquee-status">${safe(partner.status)}</span>` : '<span class="partner-marquee-status partner-marquee-status--invite">Discord</span>'}
        <b>Xem chi tiết ›</b>
      </div>
    </article>`;
  }).join('');

  shell.innerHTML = `
    <div class="partner-marquee-shell partner-marquee-shell-top">
      <div class="partner-marquee-intro partner-marquee-intro-top">
        <div class="partner-marquee-intro-main">
          <div class="partner-marquee-intro-copy">
            <h3>Đối tác NovaMC</h3>
            <p>Đối tác NovaMC được trình bày như hồ sơ chiến lược, nhấn mạnh mối quan hệ hợp tác chuyên nghiệp và lợi ích đồng hành.</p>
          </div>
        </div>
        <div class="partner-marquee-mini partner-marquee-mini-top">
          <b>${String(display.length).padStart(2,'0')}</b>
          <small>Đối tác đồng hành</small>
        </div>
      </div>
      <div class="partner-marquee-window ${animateMarquee ? 'is-animated' : 'is-static'}" aria-label="Danh sách đối tác NovaMC">
        <div class="partner-marquee-track ${animateMarquee ? 'is-animated' : 'is-static'}" ${animateMarquee ? `style="--partner-speed:${speed}s"` : ''}>
          ${animateMarquee ? cardMarkup + cardMarkup : cardMarkup}
        </div>
      </div>
    </div>
  `;
  hydrateDiscordPartners(display);
}

// ========== FEATURE SHOWCASE ==========
let featureShowcaseIndex = 0;

function featureShowcaseItems(){
  const items = (Array.isArray(FEATURES) ? FEATURES : []).map((item, i)=>({
    id: `feature-${i+1}`,
    type: 'feature',
    number: String(i + 1).padStart(2,'0'),
    icon: item.icon || '✨',
    badge: 'TÍNH NĂNG NỔI BẬT',
    label: `Mục ${String(i + 1).padStart(2,'0')}`,
    title: item.title || 'Tính năng NovaMC',
    desc: item.desc || 'Thông tin tính năng đang được cập nhật.',
    points: [],
    stats: []
  }));

  if(PROTECTION && (PROTECTION.title || PROTECTION.desc)){
    items.push({
      id: 'feature-protection',
      type: 'protection',
      number: String(items.length + 1).padStart(2,'0'),
      icon: PROTECTION.icon || '🛡️',
      badge: PROTECTION.badge || 'LỚP BẢO VỆ RIÊNG',
      label: 'Bảo vệ kết nối',
      title: PROTECTION.title || 'Bảo Vệ AntiDDoS Layer 7',
      desc: PROTECTION.desc || 'Thông tin lớp bảo vệ đang được cập nhật.',
      points: Array.isArray(PROTECTION.points) ? PROTECTION.points : [],
      stats: Array.isArray(PROTECTION.stats) ? PROTECTION.stats : []
    });
  }
  return items;
}




function featureFocusCard(item, index){
  return `
    <article class="feature-simple-card feature-focus-card feature-focus-card--hidden feature-simple-card--${(index % 5) + 1}" data-feature-focus-card data-feature-focus-index="${index}" aria-label="${safe(item.title)}">
      <div class="feature-simple-icon feature-focus-icon">${safe(item.icon)}</div>
      <div class="feature-focus-copy">
        <small>Module ${safe(item.number)}</small>
        <h3 class="feature-simple-title feature-focus-title">${safe(item.title)}</h3>
        <p class="feature-simple-desc feature-focus-desc">${safe(item.desc)}</p>
      </div>
      <button class="feature-simple-more feature-focus-more" type="button" data-feature-detail="${index}">
        <span>Xem chi tiết</span><b>›</b>
      </button>
    </article>
  `;
}

function featureFocusOffset(index, current, total){
  let offset = (index - current + total) % total;
  if(offset > total / 2) offset -= total;
  return offset;
}

function applyFeatureFocusState(direction = 'next'){
  const root = $('[data-feature-showcase]');
  if(!root) return;
  const items = featureShowcaseItems();
  if(!items.length) return;

  const total = items.length;
  const carousel = $('[data-feature-focus-carousel]', root);
  if(carousel) carousel.dataset.direction = direction;

  $$('[data-feature-focus-card]', root).forEach(card=>{
    const index = Number(card.dataset.featureFocusIndex || 0);
    const offset = featureFocusOffset(index, featureShowcaseIndex, total);

    card.classList.remove(
      'feature-focus-card--current',
      'feature-focus-card--prev',
      'feature-focus-card--next',
      'feature-focus-card--far-prev',
      'feature-focus-card--far-next',
      'feature-focus-card--hidden'
    );

    if(offset === 0){
      card.classList.add('feature-focus-card--current');
      card.removeAttribute('aria-hidden');
    }else if(offset === -1){
      card.classList.add('feature-focus-card--prev');
      card.removeAttribute('aria-hidden');
    }else if(offset === 1){
      card.classList.add('feature-focus-card--next');
      card.removeAttribute('aria-hidden');
    }else if(offset === -2){
      card.classList.add('feature-focus-card--far-prev');
      card.setAttribute('aria-hidden','true');
    }else if(offset === 2){
      card.classList.add('feature-focus-card--far-next');
      card.setAttribute('aria-hidden','true');
    }else{
      card.classList.add('feature-focus-card--hidden');
      card.setAttribute('aria-hidden','true');
    }
  });

  const current = $('[data-feature-simple-page-current]', root);
  const totalEl = $('[data-feature-simple-page-total]', root);
  if(current) current.textContent = String(featureShowcaseIndex + 1);
  if(totalEl) totalEl.textContent = String(total);
}

function renderFeatureFocusSlots(){
  applyFeatureFocusState('init');
}

function updateFeatureShowcase(nextIndex = featureShowcaseIndex, direction = 'auto', animate = true){
  const root = $('[data-feature-showcase]');
  if(!root) return;
  const items = featureShowcaseItems();
  if(!items.length) return;

  const total = items.length;
  const normalized = (nextIndex + total) % total;
  if(normalized === featureShowcaseIndex){
    applyFeatureFocusState(direction);
    return;
  }

  let moveDirection = direction;
  if(moveDirection === 'auto'){
    const forward = (featureShowcaseIndex + 1) % total;
    moveDirection = normalized === forward ? 'next' : 'prev';
  }

  featureShowcaseIndex = normalized;

  const carousel = $('[data-feature-focus-carousel]', root);
  if(carousel){
    carousel.classList.add('is-switching');
    window.clearTimeout(carousel._featureFocusTimer);
    carousel._featureFocusTimer = window.setTimeout(()=>{
      carousel.classList.remove('is-switching');
    }, 520);
  }

  applyFeatureFocusState(moveDirection);
}

function renderFeatureShowcase(){
  const root = $('[data-feature-showcase]');
  if(!root) return;
  const items = featureShowcaseItems();
  if(!items.length){
    root.innerHTML = '<div class="gallery-empty">Tính năng NovaMC đang được cập nhật.</div>';
    return;
  }

  featureShowcaseIndex = 0;

  root.innerHTML = `
    <div class="feature-focus-carousel" data-feature-focus-carousel>
      <div class="feature-focus-toolbar">
        <div class="feature-simple-page feature-focus-page" aria-live="polite">
          <span data-feature-simple-page-current>1</span>/<span data-feature-simple-page-total>${items.length}</span>
        </div>
        <p>Nhấn mũi tên hoặc vuốt ngang để chuyển tính năng.</p>
      </div>

      <div class="feature-focus-stage" data-feature-focus-stage tabindex="0" aria-label="Carousel tính năng nổi bật NovaMC">
        <button class="feature-focus-arrow feature-focus-arrow--prev" type="button" data-feature-focus-nav="prev" aria-label="Tính năng trước">‹</button>
        <div class="feature-focus-track" data-feature-focus-track>
          ${items.map((item, index)=>featureFocusCard(item, index)).join('')}
        </div>
        <button class="feature-focus-arrow feature-focus-arrow--next" type="button" data-feature-focus-nav="next" aria-label="Tính năng tiếp theo">›</button>
      </div>
    </div>
  `;

  const carousel = $('[data-feature-focus-carousel]', root);
  const stage = $('[data-feature-focus-stage]', root);

  if(carousel){
    carousel.addEventListener('click', (event)=>{
      const nav = event.target.closest('[data-feature-focus-nav]');
      if(nav){
        event.preventDefault();
        const isNext = nav.dataset.featureFocusNav === 'next';
        updateFeatureShowcase(featureShowcaseIndex + (isNext ? 1 : -1), isNext ? 'next' : 'prev', true);
        return;
      }

      const card = event.target.closest('[data-feature-focus-card]');
      if(!card || event.target.closest('[data-feature-detail]')) return;
      const index = Number(card.dataset.featureFocusIndex || 0);
      if(index === featureShowcaseIndex) return;

      event.preventDefault();
      const total = items.length;
      const offset = featureFocusOffset(index, featureShowcaseIndex, total);
      updateFeatureShowcase(index, offset < 0 ? 'prev' : 'next', true);
    });
  }

  if(stage){
    let touchStartX = 0;
    let touchStartY = 0;

    stage.addEventListener('keydown', (event)=>{
      if(event.key === 'ArrowRight'){
        event.preventDefault();
        updateFeatureShowcase(featureShowcaseIndex + 1, 'next', true);
      }
      if(event.key === 'ArrowLeft'){
        event.preventDefault();
        updateFeatureShowcase(featureShowcaseIndex - 1, 'prev', true);
      }
    });

    stage.addEventListener('touchstart', (event)=>{
      const touch = event.changedTouches && event.changedTouches[0];
      if(!touch) return;
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    }, { passive: true });

    stage.addEventListener('touchend', (event)=>{
      const touch = event.changedTouches && event.changedTouches[0];
      if(!touch) return;
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      if(Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.25){
        updateFeatureShowcase(featureShowcaseIndex + (dx < 0 ? 1 : -1), dx < 0 ? 'next' : 'prev', true);
      }
    }, { passive: true });
  }

  requestAnimationFrame(()=>applyFeatureFocusState('init'));
}

function openFeatureDetail(index){
  const body = $('[data-feature-detail-body]');
  if(!body) return;
  const items = featureShowcaseItems();
  const item = items[Number(index)] || items[0];
  if(!item) return;
  const points = item.points?.length ? `
    <section class="feature-detail-block">
      <h4>Điểm nổi bật</h4>
      <div class="feature-detail-points">${item.points.map(point=>`<span>${safe(point)}</span>`).join('')}</div>
    </section>` : '';
  const stats = item.stats?.length ? `
    <section class="feature-detail-block">
      <h4>Thông số / trọng tâm</h4>
      <div class="feature-detail-stats">${item.stats.map(stat=>`<div class="feature-detail-stat"><b>${safe(stat.value)}</b><small>${safe(stat.label)}</small></div>`).join('')}</div>
    </section>` : '';
  body.innerHTML = `
    <article class="feature-detail-card feature-detail-card--${safe(item.type)}">
      <div class="feature-detail-top">
        <div class="feature-detail-icon">${safe(item.icon)}</div>
        <div class="feature-detail-meta">
          <span>${safe(item.badge)}</span>
          <h3>${safe(item.title)}</h3>
          <small>Mục ${safe(item.number)} • ${safe(item.label)}</small>
        </div>
      </div>
      <section class="feature-detail-block">
        <h4>Thông tin đầy đủ</h4>
        <p>${safe(item.desc)}</p>
      </section>
      ${points}
      ${stats}
    </article>
  `;
  openModal('feature-detail');
}

// ========== RENDER RULES ==========
let activeRuleCategoryId = '';

function ruleCategories(){
  if(Array.isArray(RULES.categories) && RULES.categories.length){
    return RULES.categories.map((cat,index)=>({
      id: cat.id || `rule-${index}`,
      title: cat.title || cat.id || `Quy định ${index + 1}`,
      icon: cat.icon || '📋',
      summary: cat.summary || '',
      lines: Array.isArray(cat.lines) ? cat.lines : [],
      lineCount: Number(cat.lineCount || (Array.isArray(cat.lines) ? cat.lines.filter(line=>String(line).trim()).length : 0))
    }));
  }
  const legacy = [];
  if(Array.isArray(RULES.general)) legacy.push({id:'general',title:'Quy định chung',icon:'📘',summary:'Các quy định chung của NovaMC.',lines:RULES.general.flatMap(r=>[r.title, ...(r.items || [])])});
  if(Array.isArray(RULES.prohibited)) legacy.push({id:'prohibited',title:'Nghiêm cấm',icon:'⛔',summary:'Các hành vi bị nghiêm cấm.',lines:RULES.prohibited});
  return legacy.map(cat=>({...cat,lineCount:(cat.lines || []).filter(line=>String(line).trim()).length}));
}

function classifyRuleLine(line=''){
  const value = String(line || '');
  const text = value.trim();
  if(!text) return 'empty';
  if(/^🔹/.test(text)) return 'chapter';
  if(/^\[[0-9]+\]/.test(text)) return 'numbered';
  if(/^(❌|✅|⚠️|📌|📖|🔍|📸|📊|⛔|📋|⚖️|📅|✏️|🚫|🟡|🔴|🏠|💬|👥|📝|❗)/.test(text)) return 'heading';
  if(/^(•|→|-)/.test(text) || /^[\s]*(•|→|-)/.test(value)) return 'bullet';
  if(/^[A-ZÀ-Ỵ0-9\s\/.&()_-]+:$/.test(text) && text.length < 90) return 'heading';
  return 'text';
}

function renderRuleDetail(id){
  const cats = ruleCategories();
  const reader = $('[data-rules-reader]');
  if(!reader || !cats.length) return;
  const current = cats.find(cat=>cat.id === id) || cats[0];
  activeRuleCategoryId = current.id;

  $$('[data-rule-category]').forEach(btn=>{
    const isActive = btn.dataset.ruleCategory === current.id;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-current', isActive ? 'true' : 'false');
  });

  reader.innerHTML = `
    <div class="rules-content" data-rule-content>
      ${current.lines.map(line=>{
        const cls = classifyRuleLine(line);
        const text = String(line || '');
        return cls === 'empty'
          ? '<div class="rule-line rule-empty" aria-hidden="true"></div>'
          : `<div class="rule-line rule-${cls}">${safe(text)}</div>`;
      }).join('')}
    </div>
  `;
}

function renderRules(){
  const cats = ruleCategories();
  const list = $('[data-rules-categories]');
  const summary = $('[data-rules-summary]');
  if(summary){
    summary.textContent = 'Chọn danh mục luật cần xem. Nội dung được hiển thị đầy đủ trong khung bên phải.';
  }

  if(list){
    list.innerHTML = cats.map((cat,index)=>`
      <button class="rule-category-btn${index === 0 ? ' active' : ''}" type="button" data-rule-category="${safe(cat.id)}" aria-current="${index === 0 ? 'true' : 'false'}">
        <span class="rule-category-icon">${safe(cat.icon)}</span>
        <span class="rule-category-copy">
          <strong>${safe(cat.title)}</strong>
        </span>
      </button>
    `).join('');
  }

  renderRuleDetail(activeRuleCategoryId || cats[0]?.id || '');
  $$('[data-rules-version]').forEach(el=>el.textContent=`📋 PHIÊN BẢN: ${RULES.version || '2026.01'} • TRUNG TÂM LUẬT LỆ NOVAMC • NỘI DUNG ĐẦY ĐỦ`);
}

// ========== RENDER CONNECTIONS ==========
function renderConnections(){
  const grid=$('[data-connection-grid]');
  if(!grid)return;
  grid.innerHTML=(SITE.connection || []).map(c=>{
    const copyValue = c.copyText || c.ip || '';
    return `
    <article class="addr-card connection-info-card">
      <div class="addr-ico">${safe(c.icon)}</div>
      <div class="addr-info">
        <div class="addr-label">${safe(c.label)}</div>
        <div class="addr-ip">${safe(c.ip)}</div>
        ${c.port?`<div class="addr-port"><span>PORT</span><b>${safe(c.port)}</b></div>`:''}
        <div class="addr-note">${safe(c.note)}</div>
      </div>
      ${c.copy?`<button class="copy-btn" type="button" data-copy-text="${safe(copyValue)}">SAO CHÉP</button>`:''}
    </article>`;
  }).join('');
}

// ========== RENDER FAQ ==========
function renderFaq(){
  const items = Array.isArray(FAQ) ? FAQ : [];
  const makeFaqItem = (item, index=0, openFirst=false)=>`
    <article class="faq-item ${openFirst && index === 0 ? 'open' : ''}">
      <button class="faq-q" type="button">${safe(item.q)}<span>⌄</span></button>
      <div class="faq-a">${safe(item.a)}</div>
    </article>`;

  const list=$('[data-faq-list]');
  if(list){
    list.innerHTML=items.map((item,index)=>makeFaqItem(item,index,false)).join('');
  }

  const inlineList=$('[data-inline-faq-list]');
  if(inlineList){
    inlineList.innerHTML=items.slice(0,6).map((item,index)=>makeFaqItem(item,index,true)).join('');
  }
}

// ========== RENDER FOOTER ==========
function renderFooter(){
  $$('[data-socials]').forEach(el=>{
    el.innerHTML=SITE.socials.map(s=>`<a href="${discordPopupHref(s)}" class="soc-btn${s.unavailable ? ' is-unavailable' : ''}" title="${safe(s.label)}" aria-label="${safe(s.label)}" ${discordPopupAttrs(s)}>${socialVisualMarkup(s)}</a>`).join('');
  });
  const quick=$('[data-quick-links]');
  if(quick) quick.innerHTML=SITE.socials.map(s=>`<a href="${discordPopupHref(s)}" ${discordPopupAttrs(s)}><span class="quick-social-visual">${socialVisualMarkup(s, 'quick-social-image')}</span>${safe(s.label)}</a>`).join('');
}

// ========== DAYTIME EFFECTS ==========
function initSunRays(){
  const rays=$('#sun-rays');
  if(!rays)return;
  const count=12;
  rays.innerHTML=Array.from({length:count},(_,i)=>`<div class="ray" style="transform:rotate(${i*(360/count)}deg);opacity:${0.3+Math.random()*0.7}"></div>`).join('');
}

function initClouds(){
  const cl=$('#cloud-layer');
  if(!cl)return;
  cl.innerHTML='';
  const cloudData=[
    {w:280,top:8,dur:90,delay:0,op:0.55},
    {w:200,top:15,dur:120,delay:-25,op:0.45},
    {w:340,top:25,dur:100,delay:-50,op:0.4},
    {w:180,top:40,dur:80,delay:-15,op:0.35},
    {w:260,top:55,dur:110,delay:-60,op:0.3},
    {w:320,top:6,dur:95,delay:-40,op:0.5},
    {w:150,top:68,dur:75,delay:-30,op:0.3},
    {w:240,top:80,dur:130,delay:-70,op:0.25},
  ];
  cloudData.forEach(c=>{
    const div=document.createElement('div');
    div.className='cloud';
    div.style.cssText=`top:${c.top}%;--cd:${c.dur}s;--cdelay:${c.delay}s;--cop:${c.op}`;
    div.innerHTML=mkCloud(c.w);
    cl.appendChild(div);
  });
}
function mkCloud(w){
  const h=w*.5;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="${w*.5}" cy="${h*.38}" rx="${w*.37}" ry="${h*.38}" fill="white" opacity="0.9"/>
    <ellipse cx="${w*.31}" cy="${h*.5}" rx="${w*.22}" ry="${h*.28}" fill="white" opacity="0.9"/>
    <ellipse cx="${w*.69}" cy="${h*.5}" rx="${w*.2}" ry="${h*.25}" fill="white" opacity="0.9"/>
    <ellipse cx="${w*.5}" cy="${h*.62}" rx="${w*.43}" ry="${h*.18}" fill="white" opacity="0.9"/>
  </svg>`;
}

function initSpecks(){
  const sf=$('#starfield');
  if(!sf)return;
  sf.innerHTML='';
  for(let i=0;i<60;i++){
    const s=document.createElement('div');
    s.className='lspeck';
    const sz=1+Math.random()*3;
    const d=2+Math.random()*5;
    s.style.cssText=`left:${Math.random()*100}%;top:${Math.random()*100}%;width:${sz}px;height:${sz}px;--d:${d}s;animation-delay:${Math.random()*6}s`;
    sf.appendChild(s);
  }
}

function initParticles(){
  const pc=$('#particles');
  if(!pc)return;
  pc.innerHTML='';
  for(let i=0;i<18;i++){
    const p=document.createElement('div');
    p.className='particle';
    const dur=8+Math.random()*12;
    p.style.cssText=`left:${Math.random()*100}%;bottom:0;--pd:${dur}s;--pdelay:-${Math.random()*dur}s;width:${2+Math.random()*2}px;height:${2+Math.random()*2}px;`;
    pc.appendChild(p);
  }
}

// ========== CURSOR ==========
function initCursor(){
  const cg=$('#cursor-glow');
  if(!cg)return;
  document.addEventListener('mousemove',e=>{cg.style.left=`${e.clientX}px`;cg.style.top=`${e.clientY}px`});
}

// ========== STATUS ==========
const MC_STATUS = {
  timer: null,
  fetching: false,
  lastOnline: false,
  lastUpdatedAt: null
};

function minecraftStatusSettings(){
  const s = SITE.status || {};
  const rt = s.realtime || {};
  const host = String(rt.host || s.host || 'play.novamc.asia').trim() || 'play.novamc.asia';
  const port = Number(rt.port || s.port || 25552);
  const target = `${host}:${port}`;
  return {
    enabled: rt.enabled !== false,
    host,
    port,
    target,
    refreshMs: Math.max(8000, Number(rt.refreshMs || 15000)),
    timeoutMs: Math.max(3000, Number(rt.timeoutMs || 8000)),
    edition: String(rt.edition || 'bedrock').toLowerCase(),
    regionLabel: String(rt.regionLabel || 'Singapore')
  };
}

function statusTimeLabel(date = new Date()){
  try{
    return new Intl.DateTimeFormat('vi-VN',{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(date);
  }catch(err){
    return date.toLocaleTimeString();
  }
}

function updateStatusVisual(mode){
  const targets = [
    $('.status-dock.server-status-panel') || $('.server-status-panel'),
    $('#server-status-detail-modal .server-detail-modal-box')
  ].filter(Boolean);
  if(!targets.length) return;
  const stateClass = mode === 'online' ? 'is-online' : mode === 'loading' ? 'is-loading' : 'is-offline';
  targets.forEach(panel=>{
    panel.classList.remove('is-online','is-offline','is-loading');
    panel.classList.add(stateClass);
  });
}

function formatEditionLabel(edition){
  return String(edition || '').toLowerCase() === 'java' ? 'Java Edition' : 'Bedrock Edition';
}

function formatProtocolLabel(protocol){
  if(!protocol) return 'Đang kiểm tra';
  if(protocol === 'bedrock-udp') return 'Bedrock UDP Ping';
  if(protocol === 'tcp') return 'TCP Fallback';
  return String(protocol).replace(/-/g,' ').toUpperCase();
}

function pulseStatusMetrics(){
  $$('.server-status-item, .server-detail-main-metric, .server-detail-latency, .server-detail-card').forEach(el=>{
    el.classList.remove('status-bump');
    void el.offsetWidth;
    el.classList.add('status-bump');
  });
}

function updateServerStatusDetail(detail = {}){
  const settings = minecraftStatusSettings();
  const address = detail.address || `${settings.host}:${settings.port}`;
  const editionLabel = detail.editionLabel || formatEditionLabel(settings.edition);
  const regionText = `${detail.region || settings.regionLabel} node`;
  const mode = detail.mode || 'loading';
  const summaryTitle = detail.summaryTitle || (mode === 'online'
    ? 'NovaMC đang hoạt động ổn định'
    : mode === 'loading'
      ? 'NovaMC đang được kiểm tra'
      : 'NovaMC hiện chưa phản hồi');
  const summaryCopy = detail.summaryCopy || (mode === 'online'
    ? `Theo dõi trực tiếp ${address}. Nhấn vào bảng này để xem trạng thái, người chơi và ping mới nhất.`
    : mode === 'loading'
      ? 'Hệ thống đang lấy dữ liệu trực tiếp từ máy chủ và đồng bộ giao diện trong vài giây.'
      : 'Máy chủ hiện chưa phản hồi từ node giám sát. Bạn có thể thử làm mới lại để kiểm tra trạng thái mới nhất.');
  const updatedLabel = detail.updatedLabel || 'Đang tải...';
  const checkTime = detail.checkTime || updatedLabel;
  const hostOnly = detail.host || settings.host;
  const motd = detail.motd || '';
  const stateText = detail.stateText || (mode === 'offline' ? 'OFFLINE' : mode === 'loading' ? 'ĐANG TẢI' : 'TRỰC TUYẾN');

  $$('[data-status-host]').forEach(el=>el.textContent = address);
  $$('[data-status-edition], [data-detail-edition]').forEach(el=>el.textContent = editionLabel);
  $$('[data-status-region], [data-detail-region]').forEach(el=>el.textContent = regionText);
  $$('[data-status-version], [data-detail-version]').forEach(el=>el.textContent = detail.version || 'Đang cập nhật');
  $$('[data-status-updated], [data-detail-updated], [data-detail-check-time]').forEach(el=>el.textContent = checkTime);
  $$('[data-status-summary-title]').forEach(el=>el.textContent = summaryTitle);
  $$('[data-status-summary-copy], [data-server-detail-summary]').forEach(el=>el.textContent = summaryCopy);
  $$('[data-detail-state]').forEach(el=>el.textContent = stateText);
  $$('[data-detail-players]').forEach(el=>el.textContent = detail.playerText || 'Chưa cập nhật');
  $$('[data-detail-ping]').forEach(el=>el.textContent = detail.pingText || '—');
  $$('[data-detail-host]').forEach(el=>el.textContent = hostOnly);
  $$('[data-detail-port]').forEach(el=>el.textContent = String(detail.port || settings.port));
  $$('[data-detail-protocol]').forEach(el=>el.textContent = formatProtocolLabel(detail.protocol));
  $$('[data-detail-motd]').forEach(el=>el.textContent = motd || 'Máy chủ chưa trả về MOTD hoặc API chưa cung cấp thông tin này.');
  const motdWrap = $('[data-server-motd-wrap]');
  if(motdWrap) motdWrap.hidden = false;
  $$('[data-status-copy-address]').forEach(el=>{ el.dataset.copyText = address; });
}

function setStatusText(detail){
  $$('[data-status-state], [data-system-state]').forEach(el=>el.textContent = detail.stateText);
  $$('#pcnt, [data-system-players]').forEach(el=>el.textContent = detail.playerText);
  $$('[data-player-subtext]').forEach(el=>el.textContent = detail.playerSubtext);
  $$('#ping, [data-system-ping]').forEach(el=>el.textContent = detail.pingText);
  $$('[data-ping-subtext]').forEach(el=>el.textContent = detail.pingSubtext);
  updateStatusVisual(detail.mode);
  updateServerStatusDetail(detail);
  pulseStatusMetrics();
}

function setStaticStatus(){
  const s = SITE.status || {};
  const settings = minecraftStatusSettings();
  setStatusText({
    stateText: s.text || 'TRỰC TUYẾN',
    playerText: s.playerText || 'Chưa cập nhật',
    playerSubtext: s.playerSubtext || 'đang online',
    pingText: s.pingText || '0ms',
    pingSubtext: s.pingSubtext || 'kết nối ổn định',
    mode: 'online',
    host: settings.host,
    port: settings.port,
    address: `${settings.host}:${settings.port}`,
    editionLabel: formatEditionLabel(settings.edition),
    region: settings.regionLabel,
    updatedLabel: 'Sẵn sàng',
    checkTime: 'Sẵn sàng',
    summaryTitle: 'NovaMC sẵn sàng kết nối',
    summaryCopy: 'Bảng trạng thái đang chờ dữ liệu thời gian thực từ máy chủ. Nhấn làm mới để kiểm tra ngay.',
    protocol: null,
    version: 'Đang kiểm tra',
    motd: ''
  });
}

async function fetchJsonWithTimeout(url, timeoutMs){
  const controller = new AbortController();
  const startedAt = performance.now();
  const timeout = setTimeout(()=>controller.abort(), timeoutMs);
  try{
    const res = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: { accept: 'application/json' }
    });
    if(!res.ok) throw new Error(`Status API ${res.status}`);
    const data = await res.json();
    return { data, latency: Math.max(1, Math.round(performance.now() - startedAt)), url };
  }finally{
    clearTimeout(timeout);
  }
}

function normalizeMinecraftStatus(result, settings){
  const data = result?.data || {};
  const online = Boolean(data.online);
  const players = data.players || {};
  const onlinePlayers = Number.isFinite(Number(players.online)) ? Number(players.online) : 0;
  const maxPlayers = Number.isFinite(Number(players.max)) ? Number(players.max) : null;
  const version = data.version?.name_clean || data.version?.name || data.version || '';
  const updatedAt = data.checkedAt ? new Date(data.checkedAt) : new Date();
  const playerText = online
    ? (maxPlayers ? `${onlinePlayers}/${maxPlayers}` : `${onlinePlayers}`)
    : 'Offline';
  const latencyValue = Number(data.latency || result.latency || 0);
  const pingValue = online ? `${latencyValue}ms` : '—';
  const region = data.region || settings.regionLabel;
  const editionLabel = formatEditionLabel(settings.edition);
  const updatedLabel = statusTimeLabel(updatedAt);

  return {
    online,
    stateText: online ? 'TRỰC TUYẾN' : 'OFFLINE',
    playerText,
    playerSubtext: online ? 'đang online' : 'server chưa phản hồi',
    pingText: pingValue,
    pingSubtext: online ? `${data.latencySource || region + ' node'} • ${updatedLabel}` : 'server chưa phản hồi',
    mode: online ? 'online' : 'offline',
    source: result.url,
    version,
    host: data.host || settings.host,
    port: data.port || settings.port,
    address: `${data.host || settings.host}:${data.port || settings.port}`,
    region,
    protocol: data.protocol || null,
    motd: data.motd || '',
    editionLabel,
    updatedLabel,
    checkTime: updatedLabel,
    summaryTitle: online ? 'NovaMC đang trực tuyến' : 'NovaMC hiện đang offline',
    summaryCopy: online
      ? `Máy chủ ${data.host || settings.host} đang hoạt động. Dữ liệu được cập nhật từ ${data.latencySource || region + ' node'} và sẵn sàng để bạn kiểm tra chi tiết.`
      : 'Máy chủ hiện chưa phản hồi. Hãy thử bấm làm mới sau vài giây để kiểm tra lại trạng thái mới nhất.'
  };
}

function minecraftStatusEndpoints(settings){
  const host = encodeURIComponent(settings.host);
  const target = `${host}:${settings.port}`;
  return [
    `/api/minecraft-status?host=${host}&port=${settings.port}&edition=${settings.edition}`,
    `https://api.mcstatus.io/v2/status/bedrock/${target}`,
    `https://api.mcstatus.io/v2/status/java/${target}`,
    `https://api.mcsrvstat.us/bedrock/3/${target}`,
    `https://api.mcsrvstat.us/3/${target}`
  ];
}

async function loadMinecraftStatus(settings){
  const endpoints = minecraftStatusEndpoints(settings);
  let firstParsed = null;
  let lastError = null;

  for(const url of endpoints){
    try{
      const result = await fetchJsonWithTimeout(url, settings.timeoutMs);
      const parsed = normalizeMinecraftStatus(result, settings);
      if(!firstParsed) firstParsed = parsed;
      if(parsed.online) return parsed;
    }catch(err){
      lastError = err;
    }
  }

  if(firstParsed) return firstParsed;
  throw lastError || new Error('Không thể tải trạng thái server');
}

async function refreshMinecraftStatus(showLoading = false){
  const settings = minecraftStatusSettings();
  if(!settings.enabled){
    setStaticStatus();
    return;
  }
  if(MC_STATUS.fetching) return;
  MC_STATUS.fetching = true;

  if(showLoading){
    setStatusText({
      stateText: 'ĐANG TẢI',
      playerText: 'Đang kiểm tra',
      playerSubtext: 'đang kiểm tra',
      pingText: '—',
      pingSubtext: `${settings.regionLabel} node`,
      mode: 'loading',
      host: settings.host,
      port: settings.port,
      address: `${settings.host}:${settings.port}`,
      region: settings.regionLabel,
      editionLabel: formatEditionLabel(settings.edition),
      updatedLabel: 'Đang tải...',
      checkTime: 'Đang tải...',
      summaryTitle: 'NovaMC đang được kiểm tra',
      summaryCopy: 'Hệ thống đang đo ping trực tiếp từ node Singapore và đồng bộ dữ liệu mới nhất cho giao diện.',
      protocol: null,
      version: 'Đang kiểm tra',
      motd: ''
    });
  }

  try{
    const status = await loadMinecraftStatus(settings);
    MC_STATUS.lastOnline = status.online;
    MC_STATUS.lastUpdatedAt = new Date();
    setStatusText(status);
  }catch(err){
    setStatusText({
      stateText: 'OFFLINE',
      playerText: 'Offline',
      playerSubtext: 'server chưa phản hồi',
      pingText: '—',
      pingSubtext: MC_STATUS.lastUpdatedAt ? `lỗi • ${statusTimeLabel(MC_STATUS.lastUpdatedAt)}` : 'server chưa phản hồi',
      mode: 'offline',
      host: settings.host,
      port: settings.port,
      address: `${settings.host}:${settings.port}`,
      region: settings.regionLabel,
      editionLabel: formatEditionLabel(settings.edition),
      updatedLabel: MC_STATUS.lastUpdatedAt ? statusTimeLabel(MC_STATUS.lastUpdatedAt) : 'Chưa có dữ liệu',
      checkTime: MC_STATUS.lastUpdatedAt ? statusTimeLabel(MC_STATUS.lastUpdatedAt) : 'Chưa có dữ liệu',
      summaryTitle: 'NovaMC hiện chưa phản hồi',
      summaryCopy: 'Không thể lấy trạng thái mới nhất từ máy chủ tại thời điểm này. Bạn có thể làm mới lại để thử kiểm tra thêm một lần nữa.',
      protocol: null,
      version: 'Không xác định',
      motd: ''
    });
    console.warn('[NovaMC] Không thể cập nhật trạng thái Minecraft:', err);
  }finally{
    MC_STATUS.fetching = false;
  }
}

function initStatus(){
  const settings = minecraftStatusSettings();
  refreshMinecraftStatus(true);
  if(MC_STATUS.timer) clearInterval(MC_STATUS.timer);
  if(settings.enabled){
    MC_STATUS.timer = setInterval(()=>refreshMinecraftStatus(false), settings.refreshMs);
    document.addEventListener('visibilitychange',()=>{
      if(!document.hidden) refreshMinecraftStatus(false);
    });
    window.NovaMCRefreshServerStatus = ()=>refreshMinecraftStatus(true);
  }
}

// ========== ALLAY ==========
function initAllay(){
  const emojis=SITE.hero.allayIcons;
  const el=$('#hero-allay');
  if(!el)return;
  let i=0;
  setInterval(()=>{
    i=(i+1)%emojis.length;
    el.style.opacity='0';
    setTimeout(()=>{el.textContent=emojis[i];el.style.opacity='1'},220);
  },2600);
}

// ========== REVEAL ==========
function initReveal(){
  const targets=$$('.reveal');
  if(!('IntersectionObserver' in window)){targets.forEach(el=>el.classList.add('vis'));return}
  const ob=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('vis');ob.unobserve(e.target)}}),{threshold:.12});
  targets.forEach(el=>ob.observe(el));
}

// ========== EVENTS ==========
function openModal(name){
  const m=$(`#${name}-modal`);
  if(!m)return;
  m.classList.add('open');
  m.setAttribute('aria-hidden','false');
  if(name === 'donate'){
    m.scrollTop = 0;
    const donateBody = m.querySelector('.donate-modal-body');
    if(donateBody) donateBody.scrollTop = 0;
  }
  document.body.style.overflow='hidden';
}
function closeModal(name){
  const m=$(`#${name}-modal`);
  if(!m)return;
  m.classList.remove('open');
  m.setAttribute('aria-hidden','true');
  if(!$('.modal-ov.open'))document.body.style.overflow='';
}
function closeAllModals(){
  $$('.modal-ov.open').forEach(m=>{m.classList.remove('open');m.setAttribute('aria-hidden','true')});
  document.body.style.overflow='';
}
function switchTab(tab){
  $$('.mtab').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));
  $$('.tabcont').forEach(c=>c.classList.remove('on'));
  const pane=$(`#tab-${tab}`);
  if(pane)pane.classList.add('on');
}
function showToast(text){
  const t=$('#toast');if(!t)return;
  t.textContent=text;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),1700);
}
async function copyText(text){
  if(!text)return;
  try{await navigator.clipboard.writeText(text);showToast(`Đã copy: ${text}`);}
  catch(err){const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();showToast(`Đã copy: ${text}`);}
}

function initEvents(){
  const rail=$('#navbar');const toggle=$('.nav-toggle');
  let lastScrollY=window.scrollY||document.documentElement.scrollTop||0;
  let scrollTicking=false;
  const updateRailOnScroll=()=>{
    const currentY=Math.max(0,window.scrollY||document.documentElement.scrollTop||0);
    if(rail){
      rail.classList.toggle('scrolled',currentY>40);
      const diff=currentY-lastScrollY;
      if(currentY<=80){
        rail.classList.remove('nav-hidden');
      }else if(diff>8){
        rail.classList.add('nav-hidden');
        rail.classList.remove('mobile-open');
        toggle?.setAttribute('aria-expanded','false');
      }else if(diff<-8){
        rail.classList.remove('nav-hidden');
      }
    }
    lastScrollY=currentY;
    scrollTicking=false;
  };
  window.addEventListener('scroll',()=>{
    if(scrollTicking)return;
    scrollTicking=true;
    window.requestAnimationFrame(updateRailOnScroll);
  },{passive:true});
  if(toggle&&rail){
    toggle.addEventListener('click',()=>{
      const open=rail.classList.toggle('mobile-open');
      toggle.setAttribute('aria-expanded',String(open));
    });
  }
  document.addEventListener('click',e=>{
    const featureNav=e.target.closest('[data-feature-nav]');
    if(featureNav){e.preventDefault();updateFeatureShowcase(featureShowcaseIndex + (featureNav.dataset.featureNav === 'next' ? 1 : -1));return;}
    const featureDot=e.target.closest('[data-feature-dot]');
    if(featureDot){e.preventDefault();updateFeatureShowcase(Number(featureDot.dataset.featureDot || 0));return;}
    const featureThumb=e.target.closest('[data-feature-thumb]');
    if(featureThumb){e.preventDefault();updateFeatureShowcase(Number(featureThumb.dataset.featureThumb || 0));return;}
    const featureDetail=e.target.closest('[data-feature-detail]');
    if(featureDetail){e.preventDefault();openFeatureDetail(featureDetail.dataset.featureDetail);return;}
    const infoStep=e.target.closest('[data-info-step]');
    if(infoStep){
      e.preventDefault();
      const step = Number(infoStep.dataset.infoStep || 0);
      renderInfoDetail(infoActiveIndex + step, true, infoStep);
      return;
    }
    const infoCard=e.target.closest('[data-info-card]');
    if(infoCard){e.preventDefault();renderInfoDetail(Number(infoCard.dataset.infoCard || 0), true, infoCard);return;}
    const ruleCategory=e.target.closest('[data-rule-category]');
    if(ruleCategory){e.preventDefault();renderRuleDetail(ruleCategory.dataset.ruleCategory);return;}
    const statusRefresh=e.target.closest('[data-status-refresh]');
    if(statusRefresh){e.preventDefault();window.NovaMCRefreshServerStatus?.();return;}
    const mb=e.target.closest('[data-modal]');
    if(mb){e.preventDefault();openModal(mb.dataset.modal);rail?.classList.remove('mobile-open');toggle?.setAttribute('aria-expanded','false');}
    const cb=e.target.closest('[data-close]');if(cb)closeModal(cb.dataset.close);
    const tb=e.target.closest('[data-tab]');if(tb)switchTab(tb.dataset.tab);
    const cpb=e.target.closest('[data-copy-text]');if(cpb)copyText(cpb.dataset.copyText);
    const fq=e.target.closest('.faq-q');if(fq)fq.closest('.faq-item')?.classList.toggle('open');
    const unavailableLink=e.target.closest('[data-unavailable-contact]');
    if(unavailableLink){e.preventDefault();showToast(unavailableLink.dataset.unavailableContact || 'Chưa cập nhật');return;}
    const otherRolesButton=e.target.closest('[data-other-roles-list]');
    if(otherRolesButton){e.preventDefault();openOtherRolesList();return;}
    const staffCard=e.target.closest('[data-staff-detail-id]');if(staffCard){e.preventDefault();openStaffDetail(staffCard.dataset.staffDetailId);}
    const partnerCard=e.target.closest('[data-partner-detail-id]');if(partnerCard){e.preventDefault();openPartnerDetail(partnerCard.dataset.partnerDetailId);}
    const ml=e.target.closest('.rail-menu a');if(ml){rail?.classList.remove('mobile-open');toggle?.setAttribute('aria-expanded','false');}
    if(e.target.classList.contains('modal-ov'))closeAllModals();
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){closeAllModals();rail?.classList.remove('mobile-open');toggle?.setAttribute('aria-expanded','false');}
    if((e.key==='Enter' || e.key===' ') && e.target.closest('[data-staff-detail-id]')){
      e.preventDefault();
      openStaffDetail(e.target.closest('[data-staff-detail-id]').dataset.staffDetailId);
    }
    if((e.key==='Enter' || e.key===' ') && e.target.closest('[data-partner-detail-id]')){
      e.preventDefault();
      openPartnerDetail(e.target.closest('[data-partner-detail-id]').dataset.partnerDetailId);
    }
    if((e.key==='Enter' || e.key===' ') && e.target.closest('[data-feature-detail]')){
      e.preventDefault();
      openFeatureDetail(e.target.closest('[data-feature-detail]').dataset.featureDetail);
    }
    if((e.key==='Enter' || e.key===' ') && e.target.closest('[data-info-card]')){
      e.preventDefault();
      const currentInfoCard = e.target.closest('[data-info-card]');
      renderInfoDetail(Number(currentInfoCard.dataset.infoCard || 0), true, currentInfoCard);
    }
    if((e.key==='Enter' || e.key===' ') && e.target.closest('[data-status-refresh]')){
      e.preventDefault();
      window.NovaMCRefreshServerStatus?.();
    }
    if((e.key==='Enter' || e.key===' ') && e.target.closest('[data-modal]')){
      e.preventDefault();
      const modalTarget = e.target.closest('[data-modal]');
      openModal(modalTarget.dataset.modal);
    }
    if((e.key==='ArrowLeft' || e.key==='ArrowRight') && e.target.closest('.info-section')){
      e.preventDefault();
      renderInfoDetail(infoActiveIndex + (e.key === 'ArrowRight' ? 1 : -1), true, e.target.closest('.info-section'));
    }
  });
}

// ========== BOOT ==========
function boot(){
  renderBasics();
  renderInfo();
  renderFeatureShowcase();
  renderStaff();
  renderPartners();
  renderRules();
  renderConnections();
  renderFaq();
  renderFooter();
  initSunRays();
  initClouds();
  initSpecks();
  initParticles();
  initReveal();
  initCursor();
  initStatus();
  initAllay();
  initEvents();
}
document.addEventListener('DOMContentLoaded', async ()=>{
  await loadRemoteContent();
  boot();
});