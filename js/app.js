/* ============================================================
   NOVAMC REDESIGN V3 APP
   File này chỉ render dữ liệu và điều khiển hiệu ứng.
   Tất cả nội dung chỉnh trong /config.
============================================================ */
const SITE = window.NOVA_SITE_CONFIG || {};
const SERVERS = window.NOVA_SERVERS_CONFIG || [];
const FEATURES = window.NOVA_FEATURES_CONFIG || [];
const STAFF = window.NOVA_STAFF_CONFIG || { owner: {}, members: [] };
const RULES = window.NOVA_RULES_CONFIG || { general: [], prohibited: [] };
const FAQ = window.NOVA_FAQ_CONFIG || [];
const FX = window.NOVA_EFFECTS_CONFIG || {};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const safe = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

let statusCache = { players: '000', ping: '--ms' };

function setTextAll(selector, value){
  $$(selector).forEach(el => { el.textContent = value; });
}

function renderBasics(){
  document.title = SITE.title || 'NovaMC Network | Thành Phố Trên Mây';
  setTextAll('[data-nav-logo-icon]', SITE.navLogoIcon || '☁️');
  setTextAll('[data-mobile-logo]', SITE.navLogoIcon || '☁️');
  setTextAll('[data-hero-badge]', SITE.hero?.badge || 'MÁY CHỦ MINECRAFT HÀNG ĐẦU VIỆT NAM');
  setTextAll('[data-title-left]', SITE.hero?.titleLeft || 'NOVA');
  setTextAll('[data-title-right]', SITE.hero?.titleRight || 'MC');
  setTextAll('[data-hero-sub]', SITE.hero?.subtitle || 'Nơi Những Đám Mây Chạm Tới Giấc Mơ');
  $$('[data-hero-desc]').forEach(el => { el.innerHTML = SITE.hero?.description || 'Chào mừng đến với NovaMC Network.'; });
  setTextAll('[data-status-state]', SITE.status?.text || 'TRỰC TUYẾN');

  const buttons = SITE.hero?.buttons || [];
  const btnHolder = $('[data-hero-buttons]');
  if(btnHolder){
    btnHolder.innerHTML = buttons.map(btn => `
      <a href="${safe(btn.href || '#')}" class="${btn.type === 'primary' ? 'btn-p' : 'btn-s'}">${safe(btn.label || 'Khám Phá')}</a>
    `).join('');
  }

  $$('[data-footer-quote]').forEach(el => { el.innerHTML = SITE.footer?.quote || 'Chúng mình là một gia đình trên đám mây.'; });
  $$('[data-footer-since]').forEach(el => { el.innerHTML = `${safe(SITE.footer?.since || 'SINCE 2024')} • <span>${safe(SITE.networkName || 'NOVAMC NETWORK')}</span>`; });
  setTextAll('[data-footer-tagline]', SITE.footer?.tagline || 'KẾT NỐI ĐAM MÊ');
  $$('[data-copyright]').forEach(el => {
    el.innerHTML = `© ${safe(SITE.footer?.copyrightYear || '2026')} <strong>${safe((SITE.networkName || 'NOVAMC NETWORK').toUpperCase())}</strong>. BUILT WITH ❤️ FOR THE COMMUNITY.<br><span style="font-size:.7rem;opacity:.52">NOT AN OFFICIAL MINECRAFT PRODUCT AND NOT APPROVED BY OR ASSOCIATED WITH MOJANG.</span>`;
  });
}

function renderServers(){
  const grid = $('[data-servers-grid]');
  if(!grid) return;
  grid.innerHTML = SERVERS.map((s, i) => `
    <article class="server-node ${s.featured ? 'is-featured' : ''} reveal rd${(i % 4) + 1}">
      <div class="server-top">
        <div class="server-icon">${safe(s.icon || '☁️')}</div>
        <div class="server-badge ${safe(s.badgeClass || 'b-season')}">${safe(s.badge || 'SEASON')}</div>
      </div>
      <h3 class="server-title">${safe(s.title || 'Nova Server')}</h3>
      <p class="server-desc">${safe(s.desc || '')}</p>
      <div class="server-foot"><span>NovaMC Destination ${String(i + 1).padStart(2, '0')}</span><i></i></div>
    </article>
  `).join('');
}

function renderFeatures(){
  const grid = $('[data-features-grid]');
  if(!grid) return;
  grid.innerHTML = FEATURES.map((f, i) => `
    <article class="feature-panel reveal rd${(i % 4) + 1}">
      <div class="feature-index">${String(i + 1).padStart(2, '0')}</div>
      <div class="feature-icon ${safe(f.iconClass || 'fi-c')}">${safe(f.icon || '✨')}</div>
      <h3 class="feature-title">${safe(f.title || 'Tính Năng')}</h3>
      <p class="feature-desc">${safe(f.desc || '')}</p>
    </article>
  `).join('');
}

function renderStaff(){
  const ownerWrap = $('[data-owner-wrap]');
  const owner = STAFF.owner || {};
  if(ownerWrap){
    ownerWrap.innerHTML = `
      <article class="captain-card">
        <div class="captain-avatar">${safe(owner.avatar || '☁️')}</div>
        <div class="captain-info">
          <small>👑 ${safe(owner.role || 'Quản Lý Tổng')}</small>
          <h3>${safe(owner.name || 'NOVACORE_')}</h3>
          <p>Người điều phối chính của bầu trời NovaMC, quản lý hệ thống và định hướng cộng đồng.</p>
        </div>
      </article>
    `;
  }
  const track = $('#staff-track');
  if(!track) return;
  const members = STAFF.members || [];
  const all = [...members, ...members];
  track.innerHTML = all.map(s => `
    <article class="crew-card" title="${safe(s.name)} - ${safe(s.role)}">
      <div class="crew-avatar">${safe(s.avatar || '☁️')}</div>
      <div class="crew-name">${safe(s.name || 'Staff')}</div>
      <div class="crew-role ${safe(s.cls || 'r-help')}">${safe(String(s.role || 'Helper').toUpperCase())}</div>
    </article>
  `).join('');
}

function renderRules(){
  const general = $('[data-rules-general]');
  if(general){
    general.innerHTML = (RULES.general || []).map(rule => `
      <article class="rule-card">
        <div class="rule-nt"><div class="rule-chk">✓</div><div class="rule-ttl">${safe(rule.title || '')}</div></div>
        <ul class="rule-items">${(rule.items || []).map(i => `<li>${safe(i)}</li>`).join('')}</ul>
      </article>
    `).join('');
  }
  const ban = $('[data-rules-ban]');
  if(ban) ban.innerHTML = (RULES.prohibited || []).map(item => `<li>${safe(item)}</li>`).join('');
  setTextAll('[data-rules-version]', `📋 PHIÊN BẢN: ${RULES.version || '2026.01'} • TRUNG TÂM PHÁP LÝ NOVAMC NETWORK`);
}

function renderConnections(){
  const grid = $('[data-connection-grid]');
  if(!grid) return;
  grid.innerHTML = (SITE.connection || []).map(c => `
    <article class="addr-card">
      <div class="addr-ico">${safe(c.icon || '📍')}</div>
      <div class="addr-info">
        <div class="addr-label">${safe(c.label || '')}</div>
        <div class="addr-ip">${safe(c.ip || '')}</div>
        <div class="addr-note">${safe(c.note || '')}</div>
      </div>
      ${c.copy ? `<button class="copy-btn" type="button" data-copy-text="${safe(c.ip || '')}">COPY</button>` : ''}
    </article>
  `).join('');
}

function renderFaq(){
  const list = $('[data-faq-list]');
  if(!list) return;
  list.innerHTML = FAQ.map(item => `
    <article class="faq-item">
      <button class="faq-q" type="button">${safe(item.q || '')}<span>⌄</span></button>
      <div class="faq-a">${safe(item.a || '')}</div>
    </article>
  `).join('');
}

function renderFooter(){
  const socials = (SITE.socials || []);
  $$('[data-socials]').forEach(el => {
    el.innerHTML = socials.map(s => `
      <a href="${safe(s.url || '#')}" class="soc-btn" title="${safe(s.label || '')}" aria-label="${safe(s.label || '')}">${safe(s.icon || '🔗')}</a>
    `).join('');
  });
  const quick = $('[data-quick-links]');
  if(quick){
    quick.innerHTML = socials.map(s => `<a href="${safe(s.url || '#')}">${safe(s.icon || '🔗')} ${safe(s.label || '')}</a>`).join('');
  }
}

function initStars(){
  const cfg = FX.stars || { count: 110, minD: 2, maxD: 6 };
  const sf = $('#starfield');
  if(!sf) return;
  sf.innerHTML = '';
  for(let i = 0; i < cfg.count; i++){
    const s = document.createElement('div');
    s.className = 'star';
    const sz = Math.random() > .72 ? 3 : 2;
    const d = cfg.minD + Math.random() * (cfg.maxD - cfg.minD);
    s.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;--d:${d}s;animation-delay:${Math.random()*6}s;width:${sz}px;height:${sz}px;`;
    sf.appendChild(s);
  }
}

function mkCloud(w){
  const h = w * .5;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="${w*.5}" cy="${h*.38}" rx="${w*.37}" ry="${h*.38}" fill="rgba(190,245,255,1)"/>
    <ellipse cx="${w*.31}" cy="${h*.5}" rx="${w*.22}" ry="${h*.28}" fill="rgba(190,245,255,1)"/>
    <ellipse cx="${w*.69}" cy="${h*.5}" rx="${w*.2}" ry="${h*.25}" fill="rgba(190,245,255,1)"/>
    <ellipse cx="${w*.5}" cy="${h*.62}" rx="${w*.43}" ry="${h*.18}" fill="rgba(190,245,255,1)"/>
  </svg>`;
}

function initClouds(){
  const cfg = FX.clouds || { count: 8, minDur: 55, maxDur: 110, minOp: .05, maxOp: .13, sizes: [130,170,210,155,195] };
  const cl = $('#cloud-layer');
  if(!cl) return;
  cl.innerHTML = '';
  for(let i = 0; i < cfg.count; i++){
    const div = document.createElement('div');
    div.className = 'cloud';
    const sz = cfg.sizes[Math.floor(Math.random() * cfg.sizes.length)];
    const dur = cfg.minDur + Math.random() * (cfg.maxDur - cfg.minDur);
    const delay = -Math.random() * dur;
    const op = (cfg.minOp + Math.random() * (cfg.maxOp - cfg.minOp)).toFixed(3);
    div.style.cssText = `top:${5 + Math.random()*70}%;--cd:${dur}s;--cdelay:${delay}s;--cop:${op};`;
    div.innerHTML = mkCloud(sz);
    cl.appendChild(div);
  }
}

function initParticles(){
  const cfg = FX.particles || { count: 22, minD: 8, maxD: 18 };
  const pc = $('#particles');
  if(!pc) return;
  pc.innerHTML = '';
  for(let i = 0; i < cfg.count; i++){
    const p = document.createElement('div');
    p.className = 'particle';
    const dur = cfg.minD + Math.random() * (cfg.maxD - cfg.minD);
    p.style.cssText = `left:${Math.random()*100}%;bottom:0;--pd:${dur}s;--pdelay:-${Math.random()*dur}s;width:${2+Math.random()*3}px;height:${2+Math.random()*3}px;`;
    pc.appendChild(p);
  }
}

function initReveal(){
  const targets = $$('.reveal');
  if(!('IntersectionObserver' in window)){
    targets.forEach(el => el.classList.add('vis'));
    return;
  }
  const ob = new IntersectionObserver(entries => entries.forEach(e => {
    if(e.isIntersecting){
      e.target.classList.add('vis');
      ob.unobserve(e.target);
    }
  }), { threshold: .12 });
  targets.forEach(el => ob.observe(el));
}

function initCursor(){
  const cg = $('#cursor-glow');
  if(!cg) return;
  document.addEventListener('mousemove', e => {
    cg.style.left = `${e.clientX}px`;
    cg.style.top = `${e.clientY}px`;
  });
}

function initStatus(){
  const s = SITE.status || {};
  const min = Number(s.playerMin || 15);
  const max = Number(s.playerMax || 99);
  const target = Math.floor(Math.random() * (max - min + 1)) + min;
  let cur = 0;
  const playerEls = [$('#pcnt'), $('[data-system-players]')].filter(Boolean);
  setTextAll('[data-system-state]', s.text || 'ONLINE');
  const timer = setInterval(() => {
    cur = Math.min(cur + target / 64, target);
    statusCache.players = String(Math.floor(cur)).padStart(3, '0');
    playerEls.forEach(el => { el.textContent = statusCache.players; });
    if(cur >= target) clearInterval(timer);
  }, 28);
  setTimeout(() => {
    const pmin = Number(s.pingMin || 8);
    const pmax = Number(s.pingMax || 22);
    statusCache.ping = `${Math.floor(Math.random() * (pmax - pmin + 1)) + pmin}ms`;
    const pingEls = [$('#ping'), $('[data-system-ping]')].filter(Boolean);
    pingEls.forEach(el => { el.textContent = statusCache.ping; });
  }, 850);
}

function initAllay(){
  const emojis = SITE.hero?.allayIcons || ['🦋','☁️','✨','💙','🌟','🫧'];
  const el = $('#hero-allay');
  if(!el) return;
  let i = 0;
  setInterval(() => {
    i = (i + 1) % emojis.length;
    el.style.opacity = '0';
    setTimeout(() => {
      el.textContent = emojis[i];
      el.style.opacity = '1';
    }, 220);
  }, 2600);
}

function openModal(name){
  const modal = $(`#${name}-modal`);
  if(!modal) return;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeModal(name){
  const modal = $(`#${name}-modal`);
  if(!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  if(!$('.modal-ov.open')) document.body.style.overflow = '';
}
function closeAllModals(){
  $$('.modal-ov.open').forEach(m => {
    m.classList.remove('open');
    m.setAttribute('aria-hidden','true');
  });
  document.body.style.overflow = '';
}
function switchTab(tab){
  $$('.mtab').forEach(btn => btn.classList.toggle('on', btn.dataset.tab === tab));
  $$('.tabcont').forEach(c => c.classList.remove('on'));
  const pane = $(`#tab-${tab}`);
  if(pane) pane.classList.add('on');
}
function showToast(text){
  const toast = $('#toast');
  if(!toast) return;
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1700);
}
async function copyText(text){
  if(!text) return;
  try{
    await navigator.clipboard.writeText(text);
    showToast(`Đã copy: ${text}`);
  }catch(err){
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    showToast(`Đã copy: ${text}`);
  }
}

function initEvents(){
  const rail = $('#navbar');
  const toggle = $('.nav-toggle');

  window.addEventListener('scroll', () => rail?.classList.toggle('scrolled', scrollY > 40));

  if(toggle && rail){
    toggle.addEventListener('click', () => {
      const open = rail.classList.toggle('mobile-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  document.addEventListener('click', e => {
    const modalBtn = e.target.closest('[data-modal]');
    if(modalBtn){
      e.preventDefault();
      openModal(modalBtn.dataset.modal);
      rail?.classList.remove('mobile-open');
      toggle?.setAttribute('aria-expanded', 'false');
    }

    const closeBtn = e.target.closest('[data-close]');
    if(closeBtn) closeModal(closeBtn.dataset.close);

    const tabBtn = e.target.closest('[data-tab]');
    if(tabBtn) switchTab(tabBtn.dataset.tab);

    const copyBtn = e.target.closest('[data-copy-text]');
    if(copyBtn) copyText(copyBtn.dataset.copyText);

    const faqBtn = e.target.closest('.faq-q');
    if(faqBtn) faqBtn.closest('.faq-item')?.classList.toggle('open');

    const menuLink = e.target.closest('.rail-menu a');
    if(menuLink){
      rail?.classList.remove('mobile-open');
      toggle?.setAttribute('aria-expanded', 'false');
    }

    if(e.target.classList.contains('modal-ov')) closeAllModals();
  });

  document.addEventListener('keydown', e => {
    if(e.key === 'Escape'){
      closeAllModals();
      rail?.classList.remove('mobile-open');
      toggle?.setAttribute('aria-expanded', 'false');
    }
  });
}

function boot(){
  renderBasics();
  renderServers();
  renderFeatures();
  renderStaff();
  renderRules();
  renderConnections();
  renderFaq();
  renderFooter();
  initStars();
  initClouds();
  initParticles();
  initReveal();
  initCursor();
  initStatus();
  initAllay();
  initEvents();
}

document.addEventListener('DOMContentLoaded', boot);
