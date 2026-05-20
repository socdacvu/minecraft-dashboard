/* ============================================================
   NOVAMC INTERNAL ADMIN — CLOUDFLARE PAGES + KV
============================================================ */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const escapeHtml = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const splitList = value => String(value || '')
    .split('\n')
    .flatMap(line => line.split(','))
    .map(item => item.trim())
    .filter(Boolean);

  const joinList = value => Array.isArray(value) ? value.join(', ') : '';

  const defaultStaffMember = () => ({
    avatar: '🎧',
    role: 'Helper',
    cls: 'r-help',
    name: 'Tên thành viên',
    desc: 'Mô tả vai trò và nhiệm vụ của thành viên.',
    username: '',
    discord: '',
    status: '✅ Đang vận hành',
    responsibilities: ['Hỗ trợ người chơi'],
    joined: String(new Date().getFullYear()),
    links: [
      { icon: '📘', label: 'Facebook', url: '#', unavailable: true },
      { icon: '🪪', label: 'Bio', url: '#', unavailable: true }
    ]
  });

  const defaultPartner = () => ({
    id: `partner-${Date.now().toString().slice(-6)}`,
    icon: '🤝',
    name: 'Đối tác mới',
    category: 'Đối tác cộng đồng',
    status: 'Đang hợp tác',
    shortDesc: 'Mô tả ngắn về đối tác.',
    desc: 'Thông tin chi tiết về đối tác.',
    benefits: ['Kết nối cộng đồng'],
    discordInvite: '',
    url: '',
    contact: { discord: '', representative: '', website: '' },
    joined: String(new Date().getFullYear())
  });

  let adminContent = null;
  let activeTab = 'staff';

  function clone(value) {
    try {
      return typeof structuredClone === 'function'
        ? structuredClone(value)
        : JSON.parse(JSON.stringify(value));
    } catch (err) {
      return JSON.parse(JSON.stringify(value));
    }
  }

  function fallbackContent() {
    const existing = window.NovaMCContent?.get?.() || {
      staff: window.NOVAMC_STAFF || { owner: {}, members: [] },
      partners: window.NOVAMC_PARTNERS || []
    };

    return {
      staff: {
        owner: existing.staff?.owner || {},
        members: Array.isArray(existing.staff?.members) ? clone(existing.staff.members) : []
      },
      partners: Array.isArray(existing.partners) ? clone(existing.partners) : []
    };
  }

  async function requestJson(url, options = {}) {
    const res = await fetch(url, {
      cache: 'no-store',
      credentials: 'same-origin',
      ...options,
      headers: {
        'content-type': 'application/json',
        ...(options.headers || {})
      }
    });

    const text = await res.text();
    let data = {};
    if (text) {
      try { data = JSON.parse(text); }
      catch (err) { data = { ok: false, error: text }; }
    }

    if (!res.ok || data.ok === false) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    return data;
  }

  function ensurePanel() {
    if ($('#novamc-admin-panel')) return;

    const panel = document.createElement('div');
    panel.className = 'admin-panel-ov';
    panel.id = 'novamc-admin-panel';
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = `
      <div class="admin-panel-box" role="dialog" aria-modal="true" aria-label="Hệ thống đăng nhập nội bộ NovaMC">
        <div class="admin-panel-head">
          <div>
            <span>🔐 NOVAMC INTERNAL</span>
            <h2>Hệ Thống Quản Trị Nội Bộ</h2>
            <p>Đăng nhập Owner để chỉnh Đội Ngũ Vận Hành và Không Gian Đối Tác.</p>
          </div>
          <button type="button" class="admin-close" data-admin-close aria-label="Đóng">✕</button>
        </div>

        <div class="admin-alert" data-admin-alert hidden></div>

        <section class="admin-login" data-admin-login>
          <form data-admin-login-form>
            <label>
              <span>Tài khoản Owner</span>
              <input name="username" autocomplete="username" value="admin" placeholder="admin" required />
            </label>
            <label>
              <span>Mật khẩu</span>
              <input name="password" type="password" autocomplete="current-password" placeholder="admin123" required />
            </label>
            <button type="submit" class="admin-primary-btn">Đăng nhập nội bộ</button>
          </form>
          <p class="admin-login-note">Mật khẩu không lưu trong JavaScript ngoài trình duyệt. API xác thực chạy bằng Cloudflare Pages Functions.</p>
        </section>

        <section class="admin-dashboard" data-admin-dashboard hidden>
          <div class="admin-toolbar">
            <div class="admin-tabs">
              <button type="button" class="is-active" data-admin-tab="staff">Đội Ngũ Vận Hành</button>
              <button type="button" data-admin-tab="partners">Không Gian Đối Tác</button>
            </div>
            <div class="admin-toolbar-actions">
              <button type="button" class="admin-ghost-btn" data-admin-refresh>Lấy dữ liệu mới</button>
              <button type="button" class="admin-danger-btn" data-admin-logout>Đăng xuất</button>
            </div>
          </div>

          <div class="admin-editor" data-admin-editor></div>

          <div class="admin-savebar">
            <button type="button" class="admin-ghost-btn" data-admin-add-staff>+ Thêm thành viên</button>
            <button type="button" class="admin-ghost-btn" data-admin-add-partner>+ Thêm đối tác</button>
            <button type="button" class="admin-primary-btn" data-admin-save>Lưu thay đổi lên Cloudflare KV</button>
          </div>
        </section>
      </div>
    `;
    document.body.appendChild(panel);
  }

  function showAlert(message, type = 'info') {
    const alert = $('[data-admin-alert]');
    if (!alert) return;
    alert.hidden = false;
    alert.className = `admin-alert admin-alert--${type}`;
    alert.textContent = message;
    clearTimeout(showAlert.timer);
    showAlert.timer = setTimeout(() => { alert.hidden = true; }, 3500);
  }

  function openPanel() {
    ensurePanel();
    const panel = $('#novamc-admin-panel');
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    checkSession();
  }

  function closePanel() {
    const panel = $('#novamc-admin-panel');
    if (!panel) return;
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function setMode(isLoggedIn) {
    const login = $('[data-admin-login]');
    const dashboard = $('[data-admin-dashboard]');
    if (login) login.hidden = isLoggedIn;
    if (dashboard) dashboard.hidden = !isLoggedIn;
  }

  async function loadContent() {
    const fallback = fallbackContent();
    try {
      const data = await requestJson('/api/content');
      const remote = data.content || {};
      adminContent = {
        staff: remote.staff || fallback.staff,
        partners: Array.isArray(remote.partners) ? remote.partners : fallback.partners
      };
    } catch (err) {
      adminContent = fallback;
    }
    renderEditor();
  }

  async function checkSession() {
    try {
      await requestJson('/api/me');
      setMode(true);
      await loadContent();
    } catch (err) {
      setMode(false);
    }
  }

  function staffForm(person = {}, key = 'member', index = 0) {
    const links = Array.isArray(person.links) ? person.links : [];
    const facebook = links.find(link => /facebook/i.test(link.label || '')) || {};
    const bio = links.find(link => /bio/i.test(link.label || '')) || {};

    return `
      <article class="admin-card" data-staff-card="${escapeHtml(key)}" data-index="${index}">
        <div class="admin-card-head">
          <div><span>${key === 'owner' ? 'Owner chính' : `Thành viên #${index + 1}`}</span><h3>${escapeHtml(person.name || 'Chưa đặt tên')}</h3></div>
          ${key === 'owner' ? '' : '<button type="button" class="admin-mini-danger" data-admin-remove-staff>Xóa thành viên</button>'}
        </div>
        <div class="admin-grid-2">
          <label><span>Tên hiển thị</span><input name="name" value="${escapeHtml(person.name || '')}" /></label>
          <label><span>Vai trò</span><input name="role" value="${escapeHtml(person.role || '')}" placeholder="Owner / Admin / Helper" /></label>
          <label><span>Class màu vai trò</span><input name="cls" value="${escapeHtml(person.cls || '')}" placeholder="r-owner / r-admin / r-help / r-staff" /></label>
          <label><span>Icon / Emoji</span><input name="avatar" value="${escapeHtml(person.avatar || '')}" placeholder="👑" /></label>
          <label><span>Minecraft username</span><input name="username" value="${escapeHtml(person.username || '')}" /></label>
          <label><span>Discord username</span><input name="discord" value="${escapeHtml(person.discord || '')}" /></label>
          <label><span>Trạng thái</span><input name="status" value="${escapeHtml(person.status || '')}" placeholder="✅ Đang vận hành" /></label>
          <label><span>Năm tham gia</span><input name="joined" value="${escapeHtml(person.joined || '')}" /></label>
          <label><span>Link Facebook</span><input name="facebook" value="${escapeHtml(facebook.url || '')}" placeholder="https://facebook.com/..." /></label>
          <label><span>Link Bio / thông tin</span><input name="bio" value="${escapeHtml(bio.url || '')}" placeholder="https://guns.lol/..." /></label>
        </div>
        <label class="admin-full"><span>Mô tả</span><textarea name="desc" rows="3">${escapeHtml(person.desc || '')}</textarea></label>
        <label class="admin-full"><span>Nhiệm vụ / quyền hạn, cách nhau bằng dấu phẩy</span><textarea name="responsibilities" rows="2">${escapeHtml(joinList(person.responsibilities))}</textarea></label>
      </article>
    `;
  }

  function partnerForm(partner = {}, index = 0) {
    const contact = partner.contact && typeof partner.contact === 'object' ? partner.contact : {};
    return `
      <article class="admin-card" data-partner-card data-index="${index}">
        <div class="admin-card-head">
          <div><span>Đối tác #${index + 1}</span><h3>${escapeHtml(partner.name || 'Chưa đặt tên')}</h3></div>
          <button type="button" class="admin-mini-danger" data-admin-remove-partner>Xóa đối tác</button>
        </div>
        <div class="admin-grid-2">
          <label><span>ID</span><input name="id" value="${escapeHtml(partner.id || `partner-${index + 1}`)}" /></label>
          <label><span>Icon / Emoji</span><input name="icon" value="${escapeHtml(partner.icon || '')}" placeholder="🤝" /></label>
          <label><span>Tên đối tác</span><input name="name" value="${escapeHtml(partner.name || '')}" /></label>
          <label><span>Nhóm / danh mục</span><input name="category" value="${escapeHtml(partner.category || '')}" /></label>
          <label><span>Trạng thái</span><input name="status" value="${escapeHtml(partner.status || '')}" /></label>
          <label><span>Năm hợp tác</span><input name="joined" value="${escapeHtml(partner.joined || '')}" /></label>
          <label><span>Discord Invite</span><input name="discordInvite" value="${escapeHtml(partner.discordInvite || partner.discordInviteUrl || '')}" placeholder="https://discord.gg/..." /></label>
          <label><span>Link chính</span><input name="url" value="${escapeHtml(partner.url || '')}" placeholder="https://..." /></label>
          <label><span>Website</span><input name="website" value="${escapeHtml(contact.website || partner.website || '')}" /></label>
          <label><span>Đại diện / liên hệ</span><input name="representative" value="${escapeHtml(contact.representative || '')}" /></label>
        </div>
        <label class="admin-full"><span>Mô tả ngắn</span><textarea name="shortDesc" rows="2">${escapeHtml(partner.shortDesc || '')}</textarea></label>
        <label class="admin-full"><span>Mô tả chi tiết</span><textarea name="desc" rows="3">${escapeHtml(partner.desc || '')}</textarea></label>
        <label class="admin-full"><span>Lợi ích / thông tin thêm, cách nhau bằng dấu phẩy</span><textarea name="benefits" rows="2">${escapeHtml(joinList(partner.benefits))}</textarea></label>
        <label class="admin-check"><input type="checkbox" name="displayOnlyInvite" ${partner.displayOnlyInvite ? 'checked' : ''} /> <span>Chỉ hiển thị theo Discord Invite</span></label>
      </article>
    `;
  }

  function renderEditor() {
    const editor = $('[data-admin-editor]');
    if (!editor || !adminContent) return;

    $$('.admin-tabs button').forEach(btn => btn.classList.toggle('is-active', btn.dataset.adminTab === activeTab));
    const addStaff = $('[data-admin-add-staff]');
    const addPartner = $('[data-admin-add-partner]');
    if (addStaff) addStaff.hidden = activeTab !== 'staff';
    if (addPartner) addPartner.hidden = activeTab !== 'partners';

    if (activeTab === 'staff') {
      const staff = adminContent.staff || { owner: {}, members: [] };
      editor.innerHTML = `
        <div class="admin-section-title">
          <h3>Điều chỉnh toàn bộ thông tin Đội Ngũ Vận Hành NovaMC</h3>
          <p>Chỉnh tên, vai trò, link thông tin, nhiệm vụ; có thể thêm hoặc xóa thành viên khỏi web.</p>
        </div>
        ${staffForm(staff.owner || {}, 'owner', 0)}
        ${(staff.members || []).map((person, i) => staffForm(person, 'member', i)).join('')}
      `;
      return;
    }

    const partners = Array.isArray(adminContent.partners) ? adminContent.partners : [];
    editor.innerHTML = `
      <div class="admin-section-title">
        <h3>Điều chỉnh toàn bộ thông tin Không Gian Đối Tác</h3>
        <p>Thêm đối tác mới, cập nhật link Discord/website hoặc xóa đối tác khỏi web.</p>
      </div>
      ${partners.length ? partners.map((partner, i) => partnerForm(partner, i)).join('') : '<div class="admin-empty">Chưa có đối tác nào. Bấm “Thêm đối tác”.</div>'}
    `;
  }

  function readStaffCard(card) {
    const get = name => $(`[name="${name}"]`, card)?.value?.trim() || '';
    const facebook = get('facebook');
    const bio = get('bio');
    const links = [];
    links.push({ icon: '📘', label: 'Facebook', url: facebook || '#', unavailable: !facebook || facebook === '#' });
    links.push({ icon: '🪪', label: 'Bio', url: bio || '#', unavailable: !bio || bio === '#' });

    return {
      avatar: get('avatar') || '🎧',
      role: get('role') || 'Staff',
      cls: get('cls') || 'r-staff',
      name: get('name') || 'Chưa cập nhật',
      desc: get('desc') || 'Thông tin đang được cập nhật.',
      username: get('username'),
      discord: get('discord'),
      status: get('status') || '✅ Đang vận hành',
      joined: get('joined'),
      responsibilities: splitList(get('responsibilities')),
      links
    };
  }

  function readPartnerCard(card, index) {
    const get = name => $(`[name="${name}"]`, card)?.value?.trim() || '';
    const displayOnlyInvite = Boolean($('[name="displayOnlyInvite"]', card)?.checked);
    return {
      id: get('id') || `partner-${index + 1}`,
      icon: get('icon') || '🤝',
      name: get('name') || 'Đối tác chưa cập nhật',
      category: get('category') || 'Đối tác cộng đồng',
      status: get('status') || 'Đang hợp tác',
      shortDesc: get('shortDesc') || 'Thông tin đối tác đang được cập nhật.',
      desc: get('desc') || get('shortDesc') || 'Thông tin đối tác đang được cập nhật.',
      benefits: splitList(get('benefits')),
      discordInvite: get('discordInvite'),
      url: get('url') || get('discordInvite') || '#',
      contact: {
        discord: get('discordInvite'),
        representative: get('representative'),
        website: get('website') || get('url') || '#'
      },
      joined: get('joined'),
      displayOnlyInvite
    };
  }

  function collectEditor() {
    if (!adminContent) adminContent = fallbackContent();

    const ownerCard = $('[data-staff-card="owner"]');
    const memberCards = $$('[data-staff-card="member"]');
    if (ownerCard || memberCards.length) {
      adminContent.staff = {
        owner: ownerCard ? readStaffCard(ownerCard) : (adminContent.staff?.owner || {}),
        members: memberCards.map(card => readStaffCard(card))
      };
    }

    const partnerCards = $$('[data-partner-card]');
    if (partnerCards.length || activeTab === 'partners') {
      adminContent.partners = partnerCards.map((card, i) => readPartnerCard(card, i));
    }
  }

  async function login(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const username = form.username.value.trim();
    const password = form.password.value;
    try {
      await requestJson('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      showAlert('Đăng nhập thành công.', 'success');
      setMode(true);
      await loadContent();
    } catch (err) {
      showAlert(`Đăng nhập thất bại: ${err.message}`, 'error');
    }
  }

  async function saveContent() {
    collectEditor();
    try {
      const data = await requestJson('/api/content/save', {
        method: 'POST',
        body: JSON.stringify({ content: adminContent })
      });
      adminContent = data.content || adminContent;
      window.NovaMCContent?.apply?.(adminContent);
      renderEditor();
      showAlert('Đã lưu lên Cloudflare KV. Người xem web sẽ thấy dữ liệu mới.', 'success');
    } catch (err) {
      showAlert(`Không lưu được: ${err.message}`, 'error');
    }
  }

  async function logout() {
    try { await requestJson('/api/logout', { method: 'POST', body: '{}' }); }
    catch (err) {}
    setMode(false);
    showAlert('Đã đăng xuất.', 'info');
  }

  function bindEvents() {
    document.addEventListener('click', event => {
      const open = event.target.closest('[data-admin-open]');
      if (open) { event.preventDefault(); openPanel(); return; }

      const close = event.target.closest('[data-admin-close]');
      if (close) { event.preventDefault(); closePanel(); return; }

      const overlay = event.target.closest('#novamc-admin-panel');
      if (event.target.id === 'novamc-admin-panel') { closePanel(); return; }
      if (!overlay) return;

      const tab = event.target.closest('[data-admin-tab]');
      if (tab) {
        event.preventDefault();
        collectEditor();
        activeTab = tab.dataset.adminTab;
        renderEditor();
        return;
      }

      if (event.target.closest('[data-admin-add-staff]')) {
        event.preventDefault();
        collectEditor();
        adminContent.staff = adminContent.staff || { owner: {}, members: [] };
        adminContent.staff.members = adminContent.staff.members || [];
        adminContent.staff.members.push(defaultStaffMember());
        activeTab = 'staff';
        renderEditor();
        return;
      }

      if (event.target.closest('[data-admin-add-partner]')) {
        event.preventDefault();
        collectEditor();
        adminContent.partners = Array.isArray(adminContent.partners) ? adminContent.partners : [];
        adminContent.partners.push(defaultPartner());
        activeTab = 'partners';
        renderEditor();
        return;
      }

      const removeStaff = event.target.closest('[data-admin-remove-staff]');
      if (removeStaff) {
        event.preventDefault();
        collectEditor();
        const card = removeStaff.closest('[data-staff-card="member"]');
        const index = Number(card?.dataset.index || -1);
        if (index >= 0) adminContent.staff.members.splice(index, 1);
        renderEditor();
        return;
      }

      const removePartner = event.target.closest('[data-admin-remove-partner]');
      if (removePartner) {
        event.preventDefault();
        collectEditor();
        const card = removePartner.closest('[data-partner-card]');
        const index = Number(card?.dataset.index || -1);
        if (index >= 0) adminContent.partners.splice(index, 1);
        renderEditor();
        return;
      }

      if (event.target.closest('[data-admin-refresh]')) {
        event.preventDefault();
        loadContent().then(() => showAlert('Đã tải lại dữ liệu mới.', 'success'));
        return;
      }

      if (event.target.closest('[data-admin-save]')) {
        event.preventDefault();
        saveContent();
        return;
      }

      if (event.target.closest('[data-admin-logout]')) {
        event.preventDefault();
        logout();
      }
    });

    document.addEventListener('submit', event => {
      if (event.target.matches('[data-admin-login-form]')) login(event);
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && $('#novamc-admin-panel')?.classList.contains('is-open')) closePanel();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensurePanel();
    bindEvents();
  });
})();
