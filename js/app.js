/* ============================================================
   NOVAMC LIGHT — SPLIT CONFIG SCRIPT
============================================================ */

const SITE = window.NOVAMC_SITE || {};
const INFO = window.NOVAMC_INFO || [];
const FEATURES = window.NOVAMC_FEATURES || [];
const PROTECTION = window.NOVAMC_PROTECTION || {};
const STAFF = window.NOVAMC_STAFF || { owner:{}, members:[] };
const GALLERY = window.NOVAMC_GALLERY || SITE.gallery || [];
const RULES = window.NOVAMC_RULES || { version:"", general:[], prohibited:[] };
const FAQ = window.NOVAMC_FAQ || [];

// ========== HELPERS ==========
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const safe = v=>String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
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
  $$('[data-hero-desc]').forEach(el=>el.innerHTML=SITE.hero?.description || '');
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

  $$('[data-footer-quote]').forEach(el=>el.innerHTML=SITE.footer?.quote || '');
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
      return `<a href="${safe(b.href || '#')}" class="${cls}">${safe(b.label)}</a>`;
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

      ${tags ? `<div class="info-detail-copy"><h4>Nhãn nhanh</h4><div class="info-detail-tags">${tags}</div></div>` : ''}
      ${platforms ? `<div class="info-detail-copy"><h4>Nền tảng hỗ trợ</h4>${platforms}</div>` : ''}
      ${highlightList ? `<div class="info-detail-copy"><h4>Điểm nổi bật</h4>${highlightList}</div>` : ''}
      ${statList ? `<div class="info-detail-copy"><h4>Thống kê nhanh</h4>${statList}</div>` : ''}

      <div class="info-detail-banner">
        <span>NovaMC</span>
        <b>Cộng đồng là nền tảng — trải nghiệm là ưu tiên hàng đầu.</b>
      </div>
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
            <h3>Thông tin NovaMC gọn gàng</h3>
            <p>Chọn từng mục để xem nội dung chi tiết, điểm nổi bật và thống kê nhanh.</p>
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
          <div data-info-detail-body></div>
        </aside>
      </div>

      <div class="info-card-strip reveal rd2" role="tablist" aria-label="Thông tin NovaMC">
        ${items.map((card, i)=>{
          const number = card.number || String(i + 1).padStart(2,'0');
          const summary = makeInfoSummary(card);
          const active = i === infoActiveIndex;
          const tags = Array.isArray(card.tags) && card.tags.length
            ? `<div class="info-card-tags">${card.tags.slice(0, 3).map(t=>`<span class="${safe(t.className || '')}">${safe(t.text || t)}</span>`).join('')}</div>`
            : '';
          return `
            <button class="info-card${active ? ' active' : ''}" type="button" data-info-card="${i}" role="tab" aria-selected="${active}" aria-label="Xem chi tiết ${safe(card.title || `mục ${i+1}`)}">
              <span class="info-card-art"><i>${safe(card.icon || '✨')}</i></span>
              <span class="info-card-body">
                <span class="info-card-top"><b>${safe(number)}</b><small>${safe(card.label || 'Thông tin')}</small></span>
                <strong>${safe(card.title || 'Thông tin NovaMC')}</strong>
                <em>${safe(summary)}</em>
                ${tags}
                <span class="info-card-price">Xem chi tiết <i>mục ${safe(number)}</i></span>
              </span>
            </button>
          `;
        }).join('')}
      </div>

      <div class="info-benefit-grid reveal rd3">
        <article><span>🛡️</span><b>Cộng đồng văn minh</b><p>Lịch sự, tôn trọng và ưu tiên sự an toàn của người chơi.</p></article>
        <article><span>💙</span><b>Không Pay-to-Win</b><p>Không bán lợi thế, giữ sự công bằng trong gameplay.</p></article>
        <article><span>⚙️</span><b>Vận hành ổn định</b><p>Định hướng lâu dài, rõ ràng và được chăm chút nghiêm túc.</p></article>
        <article><span>💬</span><b>Hỗ trợ 24/7</b><p>Luôn lắng nghe phản hồi qua các kênh chính thức.</p></article>
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

// ========== RENDER STAFF (3 ROWS) ==========
function renderStaff(){
  STAFF_DETAIL_REGISTRY.clear();
  const ownerWrap=$('[data-owner-wrap]');
  const owner=normalizeStaffProfile(STAFF.owner || {}, 'Owner');
  STAFF_DETAIL_REGISTRY.set('owner', owner);

  if(ownerWrap){
    ownerWrap.innerHTML=`<article class="captain-card staff-clickable" tabindex="0" role="button" data-staff-detail-id="owner" aria-label="Xem hồ sơ ${safe(owner.name)}">
      <div class="captain-avatar">${renderStaffAvatar(owner, '👑')}</div>
      <div class="captain-info">
        <small>👑 ${safe(owner.role || 'Owner')}</small>
        <h3>${safe(owner.name || 'NovaMC')}</h3>
        <p>${safe(owner.desc || 'Người chịu trách nhiệm định hướng và vận hành tổng thể của NovaMC.')}</p>
        <span class="staff-view-hint">Nhấn để xem hồ sơ & liên kết</span>
      </div>
    </article>`;
  }

  const members=Array.isArray(STAFF.members) ? STAFF.members : [];
  const admins=members.filter(m=>m.role==='Admin');
  const midRow=members.filter(m=>['Helper','Moderator','Developer'].includes(m.role));
  const others=members.filter(m=>!['Admin','Helper','Moderator','Developer'].includes(m.role));

  const placeholderStaff = (fallbackRole='Staff') => ({
    name:'Đang cập nhật',
    role:fallbackRole,
    cls:fallbackRole === 'Admin' ? 'r-admin is-updating-role' : fallbackRole === 'Helper' ? 'r-help is-updating-role' : 'r-build is-updating-role',
    avatar:'✨',
    desc:'Thông tin thành viên đang được cập nhật.',
    status:'Chưa cập nhật',
    joined:'Chưa cập nhật',
    responsibilities:['Đang cập nhật'],
    links:[]
  });

  function fillToCount(list, count, fallbackRole='Staff'){
    const filled = list.slice(0, count);
    while(filled.length < count) filled.push(placeholderStaff(fallbackRole));
    return filled;
  }

  function makeTrack(list,trackId,fallbackRole='Staff',speed='16s',options={}){
    const track=$(`#${trackId}`);
    if(!track)return;
    const baseList = list.length ? list : [placeholderStaff(fallbackRole)];
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
      const profile=normalizeStaffProfile(raw, fallbackRole);
      STAFF_DETAIL_REGISTRY.set(`${trackId}-${i}`, profile);
    });
    track.innerHTML=displayList.map((s,i)=>{
      const profile = normalizeStaffProfile(s, fallbackRole);
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

  makeTrack(admins.slice(0, 1),'staff-track-admin','Admin','13s',{static:true});
  makeTrack(midRow.slice(0, 2),'staff-track-mid','Helper','14s',{static:true});
  makeTrack(fillToCount(others, 5, 'Staff'),'staff-track-other','Staff','16s');
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

function updateFeatureShowcase(nextIndex = featureShowcaseIndex){
  const root = $('[data-feature-showcase]');
  if(!root) return;
  const items = featureShowcaseItems();
  if(!items.length) return;
  featureShowcaseIndex = (nextIndex + items.length) % items.length;
  const item = items[featureShowcaseIndex];
  const main = $('[data-feature-main]', root);
  if(main){
    const points = item.points?.length ? `<div class="feature-slide-points">${item.points.map(point=>`<span>${safe(point)}</span>`).join('')}</div>` : '';
    const stats = item.stats?.length ? `<div class="feature-slide-stats">${item.stats.map(stat=>`<div class="feature-slide-stat"><b>${safe(stat.value)}</b><small>${safe(stat.label)}</small></div>`).join('')}</div>` : '';
    main.innerHTML = `
      <article class="feature-slide-card feature-slide-card--${safe(item.type)}" data-feature-detail="${featureShowcaseIndex}" tabindex="0" role="button" aria-label="Xem đầy đủ ${safe(item.title)}">
        <div class="feature-slide-head">
          <span class="feature-slide-badge">${safe(item.badge)}</span>
          <strong class="feature-slide-number">${safe(item.number)}</strong>
        </div>
        <div class="feature-slide-icon">${safe(item.icon)}</div>
        <div class="feature-slide-label">${safe(item.label)}</div>
        <h3 class="feature-slide-title">${safe(item.title)}</h3>
        <p class="feature-slide-desc">${safe(item.desc)}</p>
        ${points}
        ${stats}
        <div class="feature-slide-actions">
          <button class="feature-readmore" type="button" data-feature-detail="${featureShowcaseIndex}">Xem toàn bộ thông tin</button>
        </div>
      </article>
      <button class="gallery-nav feature-nav feature-prev" type="button" data-feature-nav="prev" aria-label="Trang trước">‹</button>
      <button class="gallery-nav feature-nav feature-next" type="button" data-feature-nav="next" aria-label="Trang sau">›</button>
    `;
  }

  const count = $('[data-feature-count]', root);
  if(count) count.textContent = `${String(featureShowcaseIndex + 1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}`;
  $$('.feature-thumb', root).forEach((thumb, i)=>thumb.classList.toggle('active', i === featureShowcaseIndex));
  $$('.feature-dot', root).forEach((dot, i)=>dot.classList.toggle('active', i === featureShowcaseIndex));
}

function renderFeatureShowcase(){
  const root = $('[data-feature-showcase]');
  if(!root) return;
  const items = featureShowcaseItems();
  if(!items.length){
    root.innerHTML = '<div class="gallery-empty">Tính năng NovaMC đang được cập nhật.</div>';
    return;
  }
  root.innerHTML = `
    <div class="feature-showcase-shell">
      <div class="feature-stage" data-feature-main></div>
      <aside class="feature-side-panel">
        <div class="feature-side-head">
          <span>Chuyển trang</span>
          <small>Bấm vào mục để xem nhanh</small>
        </div>
        <div class="feature-thumb-list">
          ${items.map((item, i)=>`
            <button class="feature-thumb${i===0 ? ' active' : ''}" type="button" data-feature-thumb="${i}" aria-label="Xem ${safe(item.title)}">
              <b>${safe(item.number)}</b>
              <div>
                <span>${safe(item.title)}</span>
                <small>${safe(item.badge)}</small>
              </div>
            </button>
          `).join('')}
        </div>
        <div class="gallery-dots feature-dots">
          ${items.map((_, i)=>`<button class="gallery-dot feature-dot${i===0 ? ' active' : ''}" type="button" data-feature-dot="${i}" aria-label="Chuyển tới mục ${i+1}"></button>`).join('')}
        </div>
        <div class="feature-side-foot">
          <span>Tổng số mục</span>
          <b data-feature-count>01 / ${String(items.length).padStart(2,'0')}</b>
        </div>
      </aside>
    </div>
  `;
  updateFeatureShowcase(0);
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

// ========== RENDER GALLERY ==========
let galleryIndex = 0;
let galleryTimer = null;

function galleryList(){
  return Array.isArray(GALLERY) ? GALLERY.filter(item=>item && item.image) : [];
}

function updateGallery(nextIndex=galleryIndex){
  const root = $('[data-gallery]');
  if(!root)return;
  const items = galleryList();
  if(!items.length)return;
  galleryIndex = (nextIndex + items.length) % items.length;
  const item = items[galleryIndex];
  const img = $('[data-gallery-image]', root);
  const title = $('[data-gallery-title]', root);
  const desc = $('[data-gallery-desc]', root);
  const tag = $('[data-gallery-tag]', root);
  const count = $('[data-gallery-count]', root);
  if(img){
    img.classList.remove('is-loaded');
    img.src = safeUrl(item.image);
    img.alt = item.alt || item.title || 'Ảnh NovaMC';
    img.onload = ()=>img.classList.add('is-loaded');
  }
  if(title) title.textContent = item.title || 'Khoảnh khắc NovaMC';
  if(desc) desc.textContent = item.desc || 'Ảnh trong album server NovaMC.';
  if(tag) tag.textContent = item.tag || 'NovaMC';
  if(count) count.textContent = `${String(galleryIndex + 1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}`;
  $$('[data-gallery-dot]', root).forEach((dot,i)=>dot.classList.toggle('active', i===galleryIndex));
  $$('[data-gallery-thumb]', root).forEach((thumb,i)=>thumb.classList.toggle('active', i===galleryIndex));
}

function renderGallery(){
  const root = $('[data-gallery]');
  if(!root)return;
  const items = galleryList();
  if(!items.length){
    root.innerHTML = '<div class="gallery-empty">Album ảnh server đang được cập nhật.</div>';
    return;
  }
  root.innerHTML = `
    <div class="gallery-main">
      <div class="gallery-frame">
        <img data-gallery-image src="${safeUrl(items[0].image)}" alt="${safe(items[0].alt || items[0].title || 'Ảnh NovaMC')}" />
        <div class="gallery-glow" aria-hidden="true"></div>
        <button class="gallery-nav gallery-prev" type="button" data-gallery-nav="prev" aria-label="Ảnh trước">‹</button>
        <button class="gallery-nav gallery-next" type="button" data-gallery-nav="next" aria-label="Ảnh tiếp theo">›</button>
      </div>
      <div class="gallery-caption">
        <span class="gallery-tag" data-gallery-tag>${safe(items[0].tag || 'NovaMC')}</span>
        <div>
          <h3 data-gallery-title>${safe(items[0].title || 'Khoảnh khắc NovaMC')}</h3>
          <p data-gallery-desc>${safe(items[0].desc || 'Ảnh trong album server NovaMC.')}</p>
        </div>
        <b data-gallery-count>01 / ${String(items.length).padStart(2,'0')}</b>
      </div>
    </div>
    <div class="gallery-side">
      <div class="gallery-side-head">
        <span>Ảnh nổi bật</span>
        <small>Bấm để xem nhanh</small>
      </div>
      <div class="gallery-thumbs">
        ${items.map((item,i)=>`
          <button class="gallery-thumb${i===0?' active':''}" type="button" data-gallery-thumb="${i}" aria-label="Xem ${safe(item.title || `ảnh ${i+1}`)}">
            <img src="${safeUrl(item.image)}" alt="" loading="lazy" />
            <span>${safe(item.title || `Ảnh ${i+1}`)}</span>
          </button>
        `).join('')}
      </div>
      <div class="gallery-dots">
        ${items.map((_,i)=>`<button class="gallery-dot${i===0?' active':''}" type="button" data-gallery-dot="${i}" aria-label="Chuyển đến ảnh ${i+1}"></button>`).join('')}
      </div>
    </div>
  `;
  updateGallery(0);
}

function initGalleryAuto(){
  const root = $('[data-gallery]');
  const items = galleryList();
  if(!root || items.length < 2)return;
  const start = ()=>{
    clearInterval(galleryTimer);
    galleryTimer = setInterval(()=>updateGallery(galleryIndex + 1), 5200);
  };
  start();
  root.addEventListener('mouseenter', ()=>clearInterval(galleryTimer));
  root.addEventListener('mouseleave', start);
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
    el.innerHTML=SITE.socials.map(s=>`<a href="${safeUrl(s.url)}" class="soc-btn" title="${safe(s.label)}" aria-label="${safe(s.label)}">${safe(s.icon)}</a>`).join('');
  });
  const quick=$('[data-quick-links]');
  if(quick) quick.innerHTML=SITE.socials.map(s=>`<a href="${safeUrl(s.url)}">${safe(s.icon)} ${safe(s.label)}</a>`).join('');
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
function initStatus(){
  const s=SITE.status || {};
  const playerText = s.playerText || 'Chưa cập nhật';
  const pingText = s.pingText || '13ms';
  const stateText = s.text || 'TRỰC TUYẾN';

  $$('[data-system-state]').forEach(el=>el.textContent=stateText);
  $$('#pcnt, [data-system-players]').forEach(el=>el.textContent=playerText);
  $$('#ping, [data-system-ping]').forEach(el=>el.textContent=pingText);
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
  window.addEventListener('scroll',()=>rail?.classList.toggle('scrolled',scrollY>40));
  if(toggle&&rail){
    toggle.addEventListener('click',()=>{
      const open=rail.classList.toggle('mobile-open');
      toggle.setAttribute('aria-expanded',String(open));
    });
  }
  document.addEventListener('click',e=>{
    const galleryNav=e.target.closest('[data-gallery-nav]');
    if(galleryNav){e.preventDefault();updateGallery(galleryIndex + (galleryNav.dataset.galleryNav === 'next' ? 1 : -1));return;}
    const galleryDot=e.target.closest('[data-gallery-dot]');
    if(galleryDot){e.preventDefault();updateGallery(Number(galleryDot.dataset.galleryDot || 0));return;}
    const galleryThumb=e.target.closest('[data-gallery-thumb]');
    if(galleryThumb){e.preventDefault();updateGallery(Number(galleryThumb.dataset.galleryThumb || 0));return;}
    const featureNav=e.target.closest('[data-feature-nav]');
    if(featureNav){e.preventDefault();updateFeatureShowcase(featureShowcaseIndex + (featureNav.dataset.featureNav === 'next' ? 1 : -1));return;}
    const featureDot=e.target.closest('[data-feature-dot]');
    if(featureDot){e.preventDefault();updateFeatureShowcase(Number(featureDot.dataset.featureDot || 0));return;}
    const featureThumb=e.target.closest('[data-feature-thumb]');
    if(featureThumb){e.preventDefault();updateFeatureShowcase(Number(featureThumb.dataset.featureThumb || 0));return;}
    const featureDetail=e.target.closest('[data-feature-detail]');
    if(featureDetail){e.preventDefault();openFeatureDetail(featureDetail.dataset.featureDetail);return;}
    const infoCard=e.target.closest('[data-info-card]');
    if(infoCard){e.preventDefault();renderInfoDetail(Number(infoCard.dataset.infoCard || 0), true, infoCard);return;}
    const ruleCategory=e.target.closest('[data-rule-category]');
    if(ruleCategory){e.preventDefault();renderRuleDetail(ruleCategory.dataset.ruleCategory);return;}
    const mb=e.target.closest('[data-modal]');
    if(mb){e.preventDefault();openModal(mb.dataset.modal);rail?.classList.remove('mobile-open');toggle?.setAttribute('aria-expanded','false');}
    const cb=e.target.closest('[data-close]');if(cb)closeModal(cb.dataset.close);
    const tb=e.target.closest('[data-tab]');if(tb)switchTab(tb.dataset.tab);
    const cpb=e.target.closest('[data-copy-text]');if(cpb)copyText(cpb.dataset.copyText);
    const fq=e.target.closest('.faq-q');if(fq)fq.closest('.faq-item')?.classList.toggle('open');
    const unavailableLink=e.target.closest('[data-unavailable-contact]');
    if(unavailableLink){e.preventDefault();showToast(unavailableLink.dataset.unavailableContact || 'Chưa cập nhật');return;}
    const staffCard=e.target.closest('[data-staff-detail-id]');if(staffCard){e.preventDefault();openStaffDetail(staffCard.dataset.staffDetailId);}
    const ml=e.target.closest('.rail-menu a');if(ml){rail?.classList.remove('mobile-open');toggle?.setAttribute('aria-expanded','false');}
    if(e.target.classList.contains('modal-ov'))closeAllModals();
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){closeAllModals();rail?.classList.remove('mobile-open');toggle?.setAttribute('aria-expanded','false');}
    if((e.key==='Enter' || e.key===' ') && e.target.closest('[data-staff-detail-id]')){
      e.preventDefault();
      openStaffDetail(e.target.closest('[data-staff-detail-id]').dataset.staffDetailId);
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
  });
}

// ========== BOOT ==========
function boot(){
  renderBasics();
  renderInfo();
  renderFeatureShowcase();
  renderStaff();
  renderGallery();
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
  initGalleryAuto();
  initEvents();
}
document.addEventListener('DOMContentLoaded',boot);