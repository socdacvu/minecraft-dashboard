/* ============================================================
   DISCORD SERVER SYNC + OFFICIAL WIDGET EMBED
   - Đồng bộ thông tin server công khai bằng Discord Invite API và Widget API.
   - Hiển thị thêm Discord Widget: channel, voice room, member online và nút Join Discord.
   - Không dùng OAuth, Bot Token, Client Secret hoặc dữ liệu riêng tư.
============================================================ */
(function(){
  const SITE = window.NOVAMC_SITE || {};
  const baseConfig = {
    inviteUrl: 'https://discord.com/invite/vWxxZ6mjPb',
    guildId: '',
    enableWidgetSync: true,
    enableOfficialWidgetEmbed: true,
    widgetTheme: 'dark',
    widgetHeight: 430,
    cacheMs: 60 * 1000,
    fallbackChannels: []
  };
  const CONFIG = Object.assign({}, baseConfig, SITE.discord || {}, window.NOVAMC_DISCORD || {});
  const $ = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc = v=>String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

  const inviteCode = value=>{
    const raw = String(value || '').trim();
    const match = raw.match(/(?:discord\.gg\/|discord(?:app)?\.com\/invite\/)([A-Za-z0-9-]+)/i);
    if(match) return match[1];
    return /^[A-Za-z0-9-]{4,80}$/.test(raw) ? raw : '';
  };

  const makeInviteUrl = ()=>{
    const code = inviteCode(CONFIG.inviteUrl || CONFIG.inviteCode || '');
    return code ? `https://discord.com/invite/${encodeURIComponent(code)}` : (CONFIG.inviteUrl || '#');
  };

  const state = {
    guildId: String(CONFIG.guildId || '').trim(),
    inviteCode: inviteCode(CONFIG.inviteUrl || CONFIG.inviteCode || ''),
    inviteUrl: makeInviteUrl(),
    name: SITE.serverName ? `${SITE.serverName} Discord` : 'Discord Community',
    iconUrl: './assets/social/discord.svg',
    memberCount: null,
    onlineCount: null,
    channels: Array.isArray(CONFIG.fallbackChannels) ? CONFIG.fallbackChannels : [],
    members: [],
    widgetEnabled: false,
    widgetChecked: false,
    lastSyncText: 'Đang chờ đồng bộ',
    lastSyncAt: '',
    loading: false
  };

  function formatNumber(value){
    if(value === null || value === undefined || value === '') return '—';
    const num = Number(value);
    if(Number.isFinite(num)) return num.toLocaleString('vi-VN');
    return String(value);
  }

  function guildIconUrl(guild={}){
    if(!guild.id || !guild.icon) return '';
    const ext = String(guild.icon).startsWith('a_') ? 'gif' : 'webp';
    return `https://cdn.discordapp.com/icons/${encodeURIComponent(guild.id)}/${encodeURIComponent(guild.icon)}.${ext}?size=256`;
  }

  function channelIcon(channel={}){
    if(channel.icon) return channel.icon;
    const type = String(channel.type || '').toLowerCase();
    const numberType = Number(channel.type);
    if(type.includes('stage') || numberType === 13) return '🎙️';
    if(type.includes('voice') || numberType === 2) return '🔊';
    if(type.includes('forum') || numberType === 15) return '🧵';
    if(type.includes('announcement') || numberType === 5) return '📢';
    return '#';
  }

  function channelTypeLabel(channel={}){
    const type = String(channel.type || '').toLowerCase();
    const numberType = Number(channel.type);
    if(type.includes('stage') || numberType === 13) return 'Stage';
    if(type.includes('voice') || numberType === 2) return 'Voice';
    if(type.includes('forum') || numberType === 15) return 'Forum';
    if(type.includes('announcement') || numberType === 5) return 'News';
    return 'Text';
  }

  function cacheGet(key){
    try{
      const raw = localStorage.getItem(key);
      if(!raw) return null;
      const data = JSON.parse(raw);
      if(!data || !data.time || Date.now() - data.time > Number(CONFIG.cacheMs || 0)) return null;
      return data.value;
    }catch(err){return null;}
  }

  function cacheSet(key,value){
    try{localStorage.setItem(key, JSON.stringify({time:Date.now(), value}));}catch(err){}
  }

  function cacheClear(){
    try{
      if(state.inviteCode) localStorage.removeItem(`novamc_discord_invite_${state.inviteCode}`);
      if(state.guildId) localStorage.removeItem(`novamc_discord_widget_${state.guildId}`);
    }catch(err){}
  }

  function showToast(text){
    if(typeof window.showToast === 'function') return window.showToast(text);
    const toast = $('#toast');
    if(!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    setTimeout(()=>toast.classList.remove('show'), 1800);
  }

  function normalizeChannels(channels=[]){
    return channels
      .filter(Boolean)
      .sort((a,b)=>(Number(a.position ?? 999) - Number(b.position ?? 999)))
      .slice(0, Number(CONFIG.maxWidgetChannels || 16))
      .map(ch=>({
        id: ch.id || ch.channel_id || ch.name,
        name: ch.name || 'channel',
        type: ch.type,
        position: ch.position,
        icon: channelIcon(ch)
      }));
  }

  function normalizeMembers(members=[]){
    return members
      .filter(Boolean)
      .slice(0, Number(CONFIG.maxWidgetMembers || 40))
      .map(member=>({
        id: member.id || member.username,
        username: member.username || member.name || 'Member',
        avatarUrl: member.avatar_url || member.avatarUrl || '',
        status: member.status || 'online',
        channelId: member.channel_id || member.channelId || '',
        mute: Boolean(member.mute || member.self_mute),
        deaf: Boolean(member.deaf || member.self_deaf),
        suppress: Boolean(member.suppress)
      }));
  }

  function officialWidgetUrl(){
    if(CONFIG.enableOfficialWidgetEmbed === false || !state.guildId) return '';
    const theme = String(CONFIG.widgetTheme || 'dark').toLowerCase() === 'light' ? 'light' : 'dark';
    return `https://discord.com/widget?id=${encodeURIComponent(state.guildId)}&theme=${theme}`;
  }

  function widgetConfigured(){
    return CONFIG.enableWidgetSync !== false && CONFIG.enableOfficialWidgetEmbed !== false;
  }

  function widgetDisplayLabel(){
    if(state.widgetEnabled) return 'Đã bật';
    if(state.widgetChecked) return 'Chưa bật';
    return widgetConfigured() ? 'Đã bật' : 'Đang kiểm tra';
  }

  function renderDiscordHub(){
    const body = $('.discord-hub-body');
    if(!body) return;
    body.innerHTML = `
      <section class="discord-sync-panel discord-server-only-panel">
        <article class="discord-server-live-card discord-sync-hero-card">
          <div class="discord-server-glow"></div>
          <div class="discord-server-profile discord-sync-profile">
            <div class="discord-server-avatar discord-sync-avatar">
              <img data-discord-server-icon src="${esc(state.iconUrl)}" alt="Discord server" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
            </div>
            <div>
              <small class="discord-sync-kicker">NovaMC Discord</small>
              <h3 data-discord-server-name>${esc(state.name)}</h3>
              <div class="discord-profile-badges" aria-label="Điểm nổi bật Discord">
                <span>Community Hub</span>
                <span>Voice Rooms</span>
                <span>Live Members</span>
              </div>
            </div>
          </div>

          <div class="discord-live-stats discord-sync-stats" aria-label="Thống kê Discord">
            <div><span>Thành viên</span><b data-discord-members>—</b></div>
            <div><span>Đang online</span><b data-discord-online>—</b></div>
            <div><span>Channel</span><b data-discord-channel-count>—</b></div>
          </div>


          <div class="discord-sync-actions">
            <a class="discord-join-channel discord-sync-join" data-discord-join href="${esc(state.inviteUrl)}" target="_blank" rel="noopener noreferrer">
              <img src="./assets/social/discord.svg" alt="" loading="lazy" decoding="async" /> Tham gia Discord
            </a>
          </div>
        </article>

      </section>

      <aside class="discord-widget-preview discord-sync-widget discord-server-only-widget" aria-label="Widget cộng đồng Discord">
        <div class="discord-live-label"><span></span> Cộng đồng đang hoạt động</div>

        <div class="discord-official-widget-shell" data-discord-official-shell>
          <div class="discord-official-placeholder" data-discord-official-placeholder>
            <img src="./assets/social/discord.svg" alt="" loading="lazy" decoding="async" />
            <b>Đang tải Discord Widget...</b>
            <span>Widget sẽ hiển thị channel, phòng voice và thành viên online.</span>
          </div>
          <iframe
            data-discord-official-iframe
            class="discord-official-iframe"
            title="Discord Widget NovaMC"
            loading="lazy"
            hidden
            allowtransparency="true"
            frameborder="0"
            sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts">
          </iframe>
        </div>

        <div class="discord-widget-card discord-fallback-widget-card" data-discord-fallback-widget>
          <div class="discord-widget-top">
            <div><img src="./assets/social/discord.svg" alt="" loading="lazy" decoding="async" /><b data-discord-widget-name>Discord</b></div>
            <span><b data-discord-widget-online>—</b> online</span>
          </div>
          <div class="discord-channel-list" data-discord-channel-list>
            <div class="discord-loading-row">Đang tải channel từ Discord...</div>
          </div>
          <div class="discord-members-title">MEMBERS ONLINE</div>
          <div class="discord-member-list" data-discord-member-list>
            <div class="discord-loading-row">Đang tải thành viên online...</div>
          </div>
          <a class="discord-widget-footer-join" data-discord-join href="${esc(state.inviteUrl)}" target="_blank" rel="noopener noreferrer">
            <img src="./assets/social/discord.svg" alt="" loading="lazy" decoding="async" /> Tham gia channel
          </a>
        </div>
      </aside>
    `;
  }

  function renderOfficialWidgetFrame(){
    const shell = $('[data-discord-official-shell]');
    const iframe = $('[data-discord-official-iframe]');
    const placeholder = $('[data-discord-official-placeholder]');
    const fallback = $('[data-discord-fallback-widget]');
    if(!shell || !iframe || !placeholder || !fallback) return;

    const url = officialWidgetUrl();
    const height = Math.max(320, Math.min(720, Number(CONFIG.widgetHeight || 430)));
    iframe.style.height = `${height}px`;

    const canShowOfficial = Boolean(url && (!state.widgetChecked || state.widgetEnabled));
    if(canShowOfficial){
      if(iframe.getAttribute('src') !== url) iframe.setAttribute('src', url);
      iframe.hidden = false;
      placeholder.hidden = true;
      fallback.hidden = true;
      shell.classList.add('is-ready');
    }else{
      iframe.removeAttribute('src');
      iframe.hidden = true;
      placeholder.hidden = Boolean(url);
      fallback.hidden = false;
      shell.classList.remove('is-ready');
    }
  }

  function membersForChannel(channelId){
    if(!channelId) return [];
    return state.members.filter(member=>String(member.channelId || '') === String(channelId));
  }

  function renderMemberAvatar(member){
    const avatar = member.avatarUrl || './assets/social/discord.svg';
    const name = esc(member.username);
    const status = esc(member.status || 'online');
    return `
      <span class="discord-member-avatar-wrap is-${status}">
        <img src="${esc(avatar)}" alt="${name}" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
        <i></i>
      </span>
    `;
  }

  function renderVoiceMember(member){
    const flags = [member.mute ? 'muted' : '', member.deaf ? 'deaf' : '', member.suppress ? 'suppressed' : ''].filter(Boolean).join(' ');
    return `
      <div class="discord-voice-member ${esc(flags)}">
        ${renderMemberAvatar(member)}
        <span>${esc(member.username)}</span>
        ${member.mute || member.deaf ? '<em aria-label="Muted">⌁</em>' : ''}
      </div>
    `;
  }

  function renderChannels(){
    const list = $('[data-discord-channel-list]');
    if(!list) return;
    const channels = state.channels && state.channels.length ? state.channels : CONFIG.fallbackChannels;
    if(!channels || !channels.length){
      list.innerHTML = '<div class="discord-loading-row">Chưa có danh sách channel công khai.</div>';
      $$('[data-discord-channel-count]').forEach(el=>el.textContent = '0');
      return;
    }

    const normalized = normalizeChannels(channels);
    $$('[data-discord-channel-count]').forEach(el=>el.textContent = formatNumber(normalized.length));
    list.innerHTML = normalized.map(ch=>{
      const connected = membersForChannel(ch.id).slice(0, 6);
      const voiceUsers = connected.length ? `<div class="discord-voice-member-list">${connected.map(renderVoiceMember).join('')}</div>` : '';
      return `
        <section class="discord-channel-row ${connected.length ? 'has-users' : ''}">
          <div class="discord-channel-row-main">
            <span>${esc(channelIcon(ch))}</span>
            <div>
              <b>• ${esc(String(ch.name || '').toUpperCase())}</b>
              <small>${esc(channelTypeLabel(ch))}</small>
            </div>
          </div>
          ${voiceUsers}
        </section>
      `;
    }).join('');
  }

  function renderMembers(){
    const list = $('[data-discord-member-list]');
    if(!list) return;
    const members = normalizeMembers(state.members).slice(0, 18);
    if(!members.length){
      list.innerHTML = '<div class="discord-loading-row">Server Widget chưa trả về danh sách thành viên online.</div>';
      return;
    }
    list.innerHTML = members.map(member=>`
      <div class="discord-member-row">
        ${renderMemberAvatar(member)}
        <span>${esc(member.username)}</span>
      </div>
    `).join('');
  }

  function renderState(){
    $$('[data-discord-server-name]').forEach(el=>el.textContent = state.name || 'Discord Community');
    $$('[data-discord-widget-name]').forEach(el=>el.textContent = state.name || 'Discord');
    $$('[data-discord-server-icon]').forEach(el=>{ el.src = state.iconUrl || './assets/social/discord.svg'; });
    $$('[data-discord-members]').forEach(el=>el.textContent = formatNumber(state.memberCount));
    $$('[data-discord-online], [data-discord-widget-online]').forEach(el=>el.textContent = formatNumber(state.onlineCount));
    const widgetLabel = widgetDisplayLabel();
    $$('[data-discord-widget-state]').forEach(el=>el.textContent = state.widgetEnabled ? 'Đã bật' : (state.widgetChecked ? 'Dự phòng' : widgetLabel));
    $$('[data-discord-sync-state]').forEach(el=>el.textContent = state.lastSyncText || 'Đã đồng bộ');
    $$('[data-discord-join]').forEach(el=>el.href = state.inviteUrl || '#');

    $$('a[href*="discord.gg"], a[href*="discord.com/invite"]').forEach(a=>{
      if(a.matches('[data-modal="discord"]')) return;
      if(state.inviteUrl && state.inviteUrl !== '#') a.href = state.inviteUrl;
    });
    $$('[aria-label="Discord"], [title="Discord"]').forEach(el=>{
      if(el.tagName === 'A' && el.matches('[data-modal="discord"]')) return;
      if(el.tagName === 'A' && state.inviteUrl) el.href = state.inviteUrl;
    });

    renderOfficialWidgetFrame();
    renderChannels();
    renderMembers();
  }

  async function fetchInviteInfo(force=false){
    if(!state.inviteCode) return null;
    const key = `novamc_discord_invite_${state.inviteCode}`;
    if(!force){
      const cached = cacheGet(key);
      if(cached) return cached;
    }
    const endpoint = `https://discord.com/api/v10/invites/${encodeURIComponent(state.inviteCode)}?with_counts=true`;
    const res = await fetch(endpoint, { cache: 'no-store' });
    if(!res.ok) throw new Error(`Discord invite API ${res.status}`);
    const data = await res.json();
    cacheSet(key, data);
    return data;
  }

  async function fetchWidgetInfo(guildId, force=false){
    if(!guildId || !CONFIG.enableWidgetSync) return null;
    const key = `novamc_discord_widget_${guildId}`;
    if(!force){
      const cached = cacheGet(key);
      if(cached) return cached;
    }
    const endpoint = `https://discord.com/api/guilds/${encodeURIComponent(guildId)}/widget.json`;
    const res = await fetch(endpoint, { cache: 'no-store' });
    if(!res.ok) throw new Error(`Discord widget API ${res.status}`);
    const data = await res.json();
    cacheSet(key, data);
    return data;
  }

  async function syncDiscordServer(force=false){
    if(state.loading) return;
    state.loading = true;
    state.lastSyncText = 'Đang đồng bộ Discord...';
    renderState();

    if(force) cacheClear();

    try{
      const invite = await fetchInviteInfo(force);
      const guild = invite?.guild || {};
      if(guild.id) state.guildId = guild.id;
      if(guild.name) state.name = guild.name;
      const icon = guildIconUrl(guild);
      if(icon) state.iconUrl = icon;
      if(typeof invite?.approximate_member_count === 'number') state.memberCount = invite.approximate_member_count;
      if(typeof invite?.approximate_presence_count === 'number') state.onlineCount = invite.approximate_presence_count;
      state.lastSyncText = 'Đã đồng bộ Invite API';
      state.lastSyncAt = new Date().toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' });
      renderState();
    }catch(err){
      console.warn('Không thể đồng bộ invite Discord:', err);
      state.lastSyncText = 'Đang dùng dữ liệu dự phòng';
      state.lastSyncAt = new Date().toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' });
      renderState();
    }

    try{
      const widget = await fetchWidgetInfo(state.guildId, force);
      state.widgetChecked = true;
      if(widget){
        state.widgetEnabled = true;
        if(widget.name) state.name = widget.name;
        // Giữ link invite chính thức đã cấu hình, không ghi đè bằng instant_invite của widget.
        if(typeof widget.presence_count === 'number') state.onlineCount = widget.presence_count;
        if(Array.isArray(widget.channels) && widget.channels.length) state.channels = normalizeChannels(widget.channels);
        if(Array.isArray(widget.members)) state.members = normalizeMembers(widget.members);
        state.lastSyncText = 'Discord Widget sẵn sàng';
        state.lastSyncAt = new Date().toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' });
        renderState();
      }
    }catch(err){
      console.warn('Không thể đồng bộ Discord Widget:', err);
      state.widgetChecked = true;
      state.widgetEnabled = false;
      renderState();
    }finally{
      state.loading = false;
    }
  }

  function openDiscordFromHash(){
    if(window.location.hash !== '#discord') return;
    const btn = $('[data-modal="discord"]');
    if(btn) setTimeout(()=>btn.click(), 200);
    if(window.history && window.history.replaceState){
      setTimeout(()=>window.history.replaceState(null, document.title, window.location.pathname + window.location.search), 1000);
    }
  }

  function init(){
    renderDiscordHub();
    renderState();
    syncDiscordServer();
    openDiscordFromHash();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
