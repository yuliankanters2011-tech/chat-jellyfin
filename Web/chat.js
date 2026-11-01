(() => {
  'use strict';
  if (window.__jellyfinChatLoaded) return;
  window.__jellyfinChatLoaded = true;

  const style = document.createElement('style');
  style.textContent = `
    #jf-chat-button { box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center; position:relative; width:48px; height:48px; padding:12px; border:0; border-radius:50%; background:transparent; color:inherit; cursor:pointer; flex-shrink:0; }
    #jf-chat-button .jfc-badge { position:absolute; top:3px; right:2px; min-width:18px; height:18px; padding:0 4px; display:grid; place-items:center; border:2px solid #151515; border-radius:10px; background:#21a453; color:#fff; font:700 10px/1 sans-serif; }
    #jf-chat-button .jfc-badge[hidden] { display:none; }
    #jfc-notice { position:fixed; z-index:1400; top:68px; right:18px; display:flex; align-items:center; width:min(370px, calc(100vw - 24px)); border:1px solid rgba(255,255,255,.15); border-left:4px solid #21a453; border-radius:8px; background:#27292d; color:#fff; box-shadow:0 8px 30px #0009; font:inherit; }
    #jfc-notice[hidden] { display:none !important; }
    #jfc-notice .jfc-notice-open { display:flex; align-items:center; gap:12px; flex:1; min-width:0; text-align:left; padding:14px; color:inherit; border:0; background:transparent; cursor:pointer; font:inherit; }
    #jfc-notice .jfc-notice-icon { display:grid; place-items:center; width:36px; height:36px; flex:none; border-radius:50%; background:#17653b; color:#fff; }
    #jfc-notice svg { width:20px; height:20px; fill:currentColor; }
    #jfc-notice strong, #jfc-notice small { display:block; }
    #jfc-notice strong { font-size:14px; } #jfc-notice small { color:#bcbec4; font-size:12px; margin-top:3px; }
    #jfc-notice .jfc-notice-close { align-self:flex-start; border:0; background:transparent; color:#bcbec4; padding:12px; cursor:pointer; font-size:18px; }
    #jfc-notice button:focus-visible { outline:2px solid #00a4dc; outline-offset:-3px; }
    @media (max-width:500px) { #jfc-notice { top:60px; right:12px; } }
    #jf-chat-button:hover, #jf-chat-button[aria-expanded="true"] { background:rgba(255,255,255,.1); }
    #jf-chat-button:focus-visible, #jf-chat :focus-visible { outline:2px solid #00a4dc; outline-offset:2px; }
    #jf-chat-button[hidden], #jf-chat[hidden] { display:none !important; }
    #jf-chat-button.jfc-fallback { position:fixed; right:16px; bottom:20px; z-index:1100; background:#242424; color:#fff; box-shadow:0 4px 16px #0009; }
    #jf-chat-button svg, #jf-chat svg { width:24px; height:24px; fill:currentColor; flex:none; }
    #jf-chat { --jfc-accent:#00a4dc; --jfc-muted:#a9a9b3; box-sizing:border-box; position:fixed; z-index:1300; top:64px; right:clamp(12px, 2vw, 28px); width:min(410px, calc(100vw - 24px)); height:min(650px, calc(100dvh - 80px)); min-height:0; display:flex; flex-direction:column; overflow:hidden; border:1px solid rgba(255,255,255,.12); border-radius:12px; background:#202124; color:#eee; box-shadow:0 12px 40px rgba(0,0,0,.55); font:inherit; font-size:14px; }
    #jf-chat *, #jf-chat *::before, #jf-chat *::after { box-sizing:border-box; }
    #jf-chat button, #jf-chat input, #jf-chat select { font:inherit; }
    #jf-chat button { cursor:pointer; }
    #jf-chat button:disabled { opacity:.5; cursor:default; }
    #jf-chat .jfc-header { display:flex; align-items:center; gap:12px; padding:17px 18px 15px; border-bottom:1px solid rgba(255,255,255,.08); }
    #jf-chat .jfc-brand { display:grid; place-items:center; width:38px; height:38px; border-radius:10px; color:#fff; background:linear-gradient(135deg,#00a4dc,#7257c4); }
    #jf-chat .jfc-brand svg { width:20px; height:20px; }
    #jf-chat .jfc-heading { flex:1; min-width:0; }
    #jf-chat .jfc-heading strong { display:block; font-size:17px; font-weight:600; line-height:1.3; }
    #jf-chat .jfc-heading small { display:block; margin-top:2px; color:var(--jfc-muted); font-size:12px; }
    #jf-chat .jfc-icon-button { display:grid; place-items:center; width:36px; height:36px; padding:7px; color:#d7d7dc; background:transparent; border:0; border-radius:50%; }
    #jf-chat .jfc-icon-button:hover { background:rgba(255,255,255,.1); color:#fff; }
    #jf-chat .jfc-icon-button svg { width:20px; height:20px; }
    #jf-chat .jfc-room-bar { display:flex; align-items:center; gap:10px; padding:13px 18px; border-bottom:1px solid rgba(255,255,255,.08); }
    #jf-chat .jfc-room-mark { display:grid; place-items:center; width:34px; height:34px; flex:none; border-radius:9px; background:#33363d; color:#aaaebb; font-size:20px; font-weight:500; }
    #jf-chat .jfc-room-picker { flex:1; min-width:0; }
    #jf-chat .jfc-room-picker label { display:block; color:var(--jfc-muted); font-size:11px; line-height:1; margin-bottom:3px; }
    #jf-chat .jfc-room-picker select { width:100%; padding:0 20px 0 0; border:0; color:#f3f3f3; background:transparent; font-weight:600; cursor:pointer; }
    #jf-chat .jfc-room-picker option { color:#eee; background:#26272b; }
    #jf-chat .jfc-room-note { font-size:11px; color:var(--jfc-muted); white-space:nowrap; }
    #jf-chat main { min-height:0; flex:1; overflow:auto; overscroll-behavior:contain; }
    #jf-chat .jfc-messages { display:flex; flex-direction:column; gap:15px; padding:20px 18px; }
    #jf-chat .jfc-empty { margin:auto; max-width:250px; text-align:center; color:var(--jfc-muted); line-height:1.5; }
    #jf-chat .jfc-empty strong { display:block; color:#eee; font-size:15px; margin-bottom:5px; }
    #jf-chat .jfc-message { display:flex; align-items:flex-start; gap:9px; max-width:90%; }
    #jf-chat .jfc-message.jfc-own { align-self:flex-end; flex-direction:row-reverse; }
    #jf-chat .jfc-avatar { display:grid; place-items:center; flex:none; width:30px; height:30px; border-radius:50%; background:#434653; color:#eee; font-size:12px; font-weight:700; text-transform:uppercase; }
    #jf-chat .jfc-own .jfc-avatar { background:#126180; }
    #jf-chat .jfc-message-content { min-width:0; }
    #jf-chat .jfc-message-meta { display:flex; align-items:baseline; flex-wrap:wrap; gap:7px; margin:1px 2px 5px; }
    #jf-chat .jfc-own .jfc-message-meta { justify-content:flex-end; }
    #jf-chat .jfc-message-meta strong { font-size:12px; font-weight:600; color:#ddd; }
    #jf-chat .jfc-message-meta time { color:var(--jfc-muted); font-size:11px; }
    #jf-chat .jfc-bubble { padding:9px 12px; border-radius:4px 12px 12px 12px; background:#34363b; line-height:1.45; white-space:pre-wrap; overflow-wrap:anywhere; }
    #jf-chat .jfc-own .jfc-bubble { border-radius:12px 4px 12px 12px; background:#075b7a; }
    #jf-chat .jfc-footer { padding:13px 18px 16px; border-top:1px solid rgba(255,255,255,.08); }
    #jf-chat .jfc-compose { display:flex; align-items:center; gap:8px; padding:5px 5px 5px 12px; border:1px solid #555961; border-radius:9px; background:#292b30; }
    #jf-chat .jfc-compose:focus-within { border-color:var(--jfc-accent); }
    #jf-chat .jfc-compose input { flex:1; min-width:0; padding:7px 0; color:#fff; border:0; background:transparent; outline:none; }
    #jf-chat .jfc-compose input::placeholder { color:#a3a3ad; }
    #jf-chat .jfc-send { display:grid; place-items:center; width:36px; height:36px; border:0; border-radius:7px; color:white; background:#007da8; }
    #jf-chat .jfc-send:hover:not(:disabled) { background:#00a4dc; }
    #jf-chat .jfc-readonly { color:var(--jfc-muted); font-size:13px; line-height:1.5; }
    #jf-chat .jfc-error { padding:9px 18px; color:#ffc3bc; background:#542d31; font-size:12px; line-height:1.4; }
    #jf-chat .jfc-error:empty { display:none; }
    #jf-chat .jfc-settings { padding:20px 18px 24px; }
    #jf-chat .jfc-section { margin-bottom:22px; }
    #jf-chat .jfc-section h3 { margin:0 0 5px; font-size:15px; font-weight:600; }
    #jf-chat .jfc-hint { margin:0 0 12px; color:var(--jfc-muted); font-size:12px; line-height:1.5; }
    #jf-chat .jfc-check { display:flex; align-items:flex-start; gap:9px; margin:9px 0; line-height:1.4; cursor:pointer; }
    #jf-chat .jfc-check input { margin:2px 0 0; accent-color:var(--jfc-accent); }
    #jf-chat fieldset { margin:12px 0; padding:8px 12px; border:1px solid #4c4e56; border-radius:8px; }
    #jf-chat fieldset:disabled { opacity:.55; }
    #jf-chat legend { padding:0 5px; color:var(--jfc-muted); font-size:12px; }
    #jf-chat .jfc-field { width:100%; padding:10px 12px; border:1px solid #555961; border-radius:7px; color:#fff; background:#292b30; }
    #jf-chat .jfc-action { padding:9px 14px; border:0; border-radius:6px; background:#007fa9; color:white; font-weight:600; }
    #jf-chat .jfc-action:hover { background:#00a4dc; }
    #jf-chat .jfc-room-list { border-top:1px solid rgba(255,255,255,.08); }
    #jf-chat .jfc-room-item { display:flex; align-items:center; gap:10px; padding:11px 0; border-bottom:1px solid rgba(255,255,255,.08); }
    #jf-chat .jfc-room-item span { flex:1; min-width:0; overflow-wrap:anywhere; }
    #jf-chat .jfc-delete { border:0; background:transparent; color:#e7a29a; padding:7px; border-radius:6px; font-size:12px; }
    #jf-chat .jfc-delete:hover { background:rgba(255,255,255,.08); }
    @media (max-width:500px) { #jf-chat { top:auto; right:0; bottom:0; width:100%; height:min(78dvh, 680px); border-radius:14px 14px 0 0; } }
  `;
  document.head.appendChild(style);

  const paths = {
    chat: 'M21 6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12l4-4h12a2 2 0 0 0 2-2V6zm-4 5H7V9h10v2z',
    close: 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    settings: 'M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7.3 7.3 0 0 0-1.63-.94l-.36-2.54a.49.49 0 0 0-.49-.42h-3.84a.49.49 0 0 0-.49.42l-.36 2.54c-.59.23-1.14.55-1.63.94l-2.39-.96a.49.49 0 0 0-.61.22L2.64 8.84a.49.49 0 0 0 .12.64L4.79 11c-.05.33-.08.66-.08 1s.03.67.08 1l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.31.61.22l2.39-.96c.49.39 1.04.71 1.63.94l.36 2.54c.04.24.24.42.49.42h3.84c.25 0 .45-.18.49-.42l.36-2.54c.59-.23 1.14-.55 1.63-.94l2.39.96c.22.09.48 0 .61-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.02-1.62zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z',
    back: 'M20 12H4m0 0 7-7m-7 7 7 7',
    add: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z',
    send: 'M2 21 23 12 2 3v7l15 2-15 2z'
  };
  function icon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('d', paths[name]);
    if (name === 'back') { path.setAttribute('fill', 'none'); path.setAttribute('stroke', 'currentColor'); path.setAttribute('stroke-width', '2'); }
    svg.append(path); return svg;
  }
  const el = (tag, text, className) => { const node = document.createElement(tag); if (text != null) node.textContent = text; if (className) node.className = className; return node; };
  const button = el('button'); button.id = 'jf-chat-button'; button.type = 'button'; button.title = 'Chat'; button.setAttribute('aria-label', 'Chat openen'); button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-controls', 'jf-chat'); button.append(icon('chat')); const badge = el('span', null, 'jfc-badge'); badge.hidden = true; badge.setAttribute('aria-hidden', 'true'); button.append(badge); button.hidden = true;
  const panel = el('section'); panel.id = 'jf-chat'; panel.hidden = true; panel.setAttribute('role', 'region'); panel.setAttribute('aria-label', 'Chat');
  const notice = el('div'); notice.id = 'jfc-notice'; notice.hidden = true; notice.setAttribute('role', 'status'); notice.setAttribute('aria-live', 'polite');
  const noticeOpen = el('button', null, 'jfc-notice-open'); noticeOpen.type = 'button';
  const noticeIcon = el('span', null, 'jfc-notice-icon'); noticeIcon.setAttribute('aria-hidden', 'true'); noticeIcon.append(icon('chat'));
  const noticeText = el('span'), noticeTitle = el('strong'), noticeHint = el('small', 'Tik om de chat te openen'); noticeText.append(noticeTitle, noticeHint); noticeOpen.append(noticeIcon, noticeText);
  const noticeClose = el('button', '×', 'jfc-notice-close'); noticeClose.type = 'button'; noticeClose.setAttribute('aria-label', 'Melding sluiten');
  notice.append(noticeOpen, noticeClose); document.body.append(button, panel, notice);
  let noticeTimer, noticePending = false, unreadSeen = false, unreadRequest = 0, unreadLatest = {};
  let me, rooms = [], selected = '', settingsOpen = false, creating = false, busy = false, lastMessages = '', firstLoad = true, unreadRooms = {}, marked = {}, marking = {};

  // Jellyfin can keep a hidden header in the DOM while switching views.
  // Attach only to a visible toolbar; otherwise keep a non-overlapping fallback.
  function visibleHeader(node) {
    if (!node || !node.isConnected || !node.getClientRects().length) return false;
    const rect = node.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= window.innerHeight || rect.right <= 0 || rect.left >= window.innerWidth) return false;
    for (let parent = node; parent && parent !== document.body; parent = parent.parentElement) {
      if (parent.hidden || parent.getAttribute('aria-hidden') === 'true' || parent.classList.contains('hide')) return false;
      const css = getComputedStyle(parent);
      if (css.display === 'none' || css.visibility === 'hidden' || css.visibility === 'collapse') return false;
    }
    return true;
  }
  function placeButton() {
    const modernUser = [...document.querySelectorAll('.MuiAppBar-root .MuiToolbar-root button[aria-controls="app-user-menu"]')]
      .find(node => visibleHeader(node.closest('.MuiAppBar-root')));
    const toolbar = modernUser?.closest('.MuiToolbar-root');
    const modern = modernUser?.parentElement?.previousElementSibling;
    const classic = [...document.querySelectorAll('.skinHeader:not(.osdHeader) .headerRight')]
      .find(node => visibleHeader(node.closest('.skinHeader')));
    const target = (toolbar && modern?.parentElement === toolbar ? modern : null) || classic;
    const fallback = !target;
    if (button.classList.contains('jfc-fallback') !== fallback) button.classList.toggle('jfc-fallback', fallback);
    if (target && button.parentElement !== target) {
      const user = target.querySelector('.headerUserButton');
      target.insertBefore(button, user || null);
    } else if (!target && button.parentElement !== document.body) document.body.append(button);
  }
  let placementQueued = false;
  new MutationObserver(() => {
    if (placementQueued) return;
    placementQueued = true;
    requestAnimationFrame(() => { placementQueued = false; placeButton(); });
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'aria-hidden'] });
  window.addEventListener('resize', placeButton);
  placeButton();

  function client() { return window.ApiClient; }
  async function api(path, method = 'GET', body) {
    const c = client(); if (!c || !c.accessToken()) throw new Error('Niet aangemeld');
    const response = await fetch(c.getUrl('ChatPlugin/' + path), { method, headers: { 'Authorization': 'MediaBrowser Token="' + encodeURIComponent(c.accessToken()) + '"', ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
    if (!response.ok) { const err = new Error('Chatverzoek mislukt (' + response.status + ')'); err.status = response.status; throw err; }
    const content = await response.text(); return content ? JSON.parse(content) : null;
  }
  function error(err) { const e = panel.querySelector('.jfc-error'); if (e) e.textContent = err.message || 'Er is iets misgegaan.'; }
  function closePanel() { panel.hidden = true; button.setAttribute('aria-expanded', 'false'); button.focus(); }
  function actionIcon(name, label, handler) {
    const b = el('button', null, 'jfc-icon-button'); b.type = 'button'; b.title = label; b.setAttribute('aria-label', label); b.append(icon(name)); b.onclick = handler; return b;
  }
  function hideNotice() { notice.hidden = true; clearTimeout(noticeTimer); }
  function otherUnread(counts) {
    return Object.entries(counts).filter(([id, count]) => Number(count) > 0 &&
      (panel.hidden || settingsOpen || creating || normalizeId(id) !== normalizeId(selected)));
  }
  function showNotice(counts) {
    const total = otherUnread(counts).reduce((sum, [, count]) => sum + Math.max(0, Number(count) || 0), 0);
    if (!total) { noticePending = false; hideNotice(); return; }
    if (document.hidden) { noticePending = true; return; }
    noticePending = false;
    noticeTitle.textContent = total === 1 ? 'Je hebt een nieuw chatbericht' : `Je hebt ${total} ongelezen chatberichten`;
    notice.hidden = false; clearTimeout(noticeTimer); noticeTimer = setTimeout(hideNotice, 8000);
  }
  noticeClose.onclick = () => { noticePending = false; hideNotice(); };
  noticeOpen.onclick = async () => {
    const target = otherUnread(unreadRooms)[0]?.[0];
    noticePending = false; hideNotice();
    if (target) selected = target;
    panel.hidden = false; button.setAttribute('aria-expanded', 'true'); settingsOpen = false; creating = false; firstLoad = true;
    try { await render(); } catch(e) { error(e); }
  };
  function resetUnread() { unreadRequest++; unreadSeen = false; noticePending = false; hideNotice(); unreadRooms = {}; unreadLatest = {}; marked = {}; marking = {}; badge.hidden = true; badge.textContent = ''; button.title = 'Chat'; button.setAttribute('aria-label', 'Chat openen'); }
  async function refreshUnread() {
    if (!me?.enabled) return;
    const user = normalizeId(me.userId), request = ++unreadRequest;
    try {
      const data = await api('unread');
      if (!me?.enabled || user !== normalizeId(me.userId) || request !== unreadRequest) return;
      const next = data.rooms || {}, nextLatest = data.latest || {};
      const increased = otherUnread(next).some(([id, count]) => !unreadSeen || Number(count) > (Number(unreadRooms[id]) || 0) ||
        (unreadLatest[id] && nextLatest[id] && unreadLatest[id] !== nextLatest[id]));
      unreadRooms = next; unreadLatest = nextLatest; unreadSeen = true;
      if (increased) showNotice(next);
      else if (!otherUnread(next).length) { noticePending = false; hideNotice(); }
      const total = Math.max(0, Number(data.total) || 0);
      badge.hidden = total === 0; badge.textContent = total ? (total > 99 ? '99+' : String(total)) : '';
      const label = total ? `Chat openen, ${total} ongelezen berichten` : 'Chat openen';
      button.title = label; button.setAttribute('aria-label', label);
      const select = panel.querySelector('#jfc-room-select');
      if (select) for (const option of select.options) {
        const room = rooms.find(r => r.id === option.value); if (!room) continue;
        const count = unreadRooms[room.id] || 0;
        option.textContent = room.name + (room.adminOnly ? ' · Aankondigingen' : '') + (count ? ` (${count} nieuw)` : '');
      }
    } catch { /* A temporary network failure must not dismiss the chat. */ }
  }
  async function markRead(roomId, messageId) {
    if (!messageId || marked[roomId] === messageId || marking[roomId] || panel.hidden || settingsOpen || creating || document.hidden || selected !== roomId) return;
    const user = normalizeId(me?.userId); marking[roomId] = true;
    try {
      await api('rooms/' + roomId + '/read', 'POST', { messageId });
      if (user === normalizeId(me?.userId)) { marked[roomId] = messageId; await refreshUnread(); }
    } catch { /* Retry on the next refresh. */ }
    finally { delete marking[roomId]; }
  }
  async function refreshRooms() { rooms = await api('rooms'); if (!rooms.some(r => r.id === selected)) selected = rooms[0]?.id || ''; }
  async function render() {
    panel.replaceChildren();
    const header = el('header', null, 'jfc-header');
    const brand = el('div', null, 'jfc-brand'); brand.append(icon('chat')); brand.setAttribute('aria-hidden', 'true');
    const heading = el('div', null, 'jfc-heading'); heading.append(el('strong', creating ? 'Nieuwe chat' : settingsOpen ? 'Chat beheren' : 'Chat'), el('small', creating ? 'Start een gesprek' : settingsOpen ? 'Instellingen en groepen' : 'Samen praten op Jellyfin'));
    header.append(brand, heading);
    if (creating) header.append(actionIcon('back', 'Terug naar chat', async () => { creating = false; try { await render(); } catch(e) { error(e); } }));
    else if (!settingsOpen) {
      header.append(actionIcon('add', 'Nieuwe chat', async () => { creating = true; try { await render(); } catch(e) { error(e); } }));
      if (me.admin) header.append(actionIcon('settings', 'Chat beheren', async () => { settingsOpen = true; try { await render(); } catch(e) { error(e); } }));
    } else header.append(actionIcon('back', 'Terug naar chat', async () => { settingsOpen = false; try { await render(); } catch(e) { error(e); } }));
    header.append(actionIcon('close', 'Chat sluiten', closePanel)); panel.append(header);
    const err = el('div', null, 'jfc-error'); err.setAttribute('role', 'alert'); panel.append(err);
    if (creating) { const main = el('main', null, 'jfc-settings'); panel.append(main); await renderCreate(main); return; }
    if (settingsOpen) { const main = el('main', null, 'jfc-settings'); panel.append(main); await renderSettings(main); return; }
    await refreshRooms();
    if (!rooms.length) { const main = el('main', null, 'jfc-messages'); const empty = el('div', null, 'jfc-empty'); empty.append(el('strong', 'Nog geen groepen'), el('span', 'Maak een nieuwe chat om te beginnen.')); main.append(empty); panel.append(main); return; }
    const room = rooms.find(r => r.id === selected);
    const bar = el('div', null, 'jfc-room-bar'), mark = el('span', '#', 'jfc-room-mark'), picker = el('div', null, 'jfc-room-picker');
    mark.setAttribute('aria-hidden', 'true'); const label = el('label', 'Groep'); label.htmlFor = 'jfc-room-select';
    const select = el('select'); select.id = 'jfc-room-select'; rooms.forEach(r => { const o = el('option', r.name + (r.adminOnly ? ' · Aankondigingen' : '')); o.value = r.id; if (unreadRooms[r.id]) o.textContent += ` (${unreadRooms[r.id]} nieuw)`; select.append(o); }); select.value = selected;
    select.onchange = async () => { selected = select.value; firstLoad = true; lastMessages = ''; try { await render(); } catch (e) { error(e); } };
    picker.append(label, select); bar.append(mark, picker); if (room.adminOnly) bar.append(el('span', 'Aankondigingen', 'jfc-room-note')); panel.append(bar);
    const main = el('main', null, 'jfc-messages'); main.id = 'jf-chat-messages'; main.setAttribute('aria-label', 'Berichten'); panel.append(main);
    const footer = el('footer', null, 'jfc-footer');
    if (room.adminOnly && !me.admin) footer.append(el('div', 'Alleen beheerders kunnen hier berichten sturen.', 'jfc-readonly'));
    else {
      const form = el('form', null, 'jfc-compose'); const input = el('input'); input.type = 'text'; input.placeholder = 'Schrijf een bericht...'; input.maxLength = 2000; input.autocomplete = 'off'; input.setAttribute('aria-label', 'Bericht');
      const send = el('button', null, 'jfc-send'); send.type = 'submit'; send.title = 'Bericht versturen'; send.setAttribute('aria-label', 'Bericht versturen'); send.append(icon('send')); form.append(input, send); footer.append(form);
      form.onsubmit = async event => { event.preventDefault(); const text = input.value.trim(); if (!text || busy) return; busy = true; send.disabled = true; const roomId = selected; try { await api('rooms/' + roomId + '/messages', 'POST', { text }); input.value = ''; if (selected === roomId) { firstLoad = true; await loadMessages(); } } catch(e) { error(e); } finally { busy = false; send.disabled = false; } };
    }
    panel.append(footer); await loadMessages();
  }
  const normalizeId = id => String(id || '').replace(/-/g, '').toLowerCase();
  async function loadMessages() {
    const target = panel.querySelector('#jf-chat-messages'); if (!target || !selected) return;
    const id = selected, messages = await api('rooms/' + id + '/messages'); if (selected !== id || !target.isConnected) return;
    const last = messages[messages.length - 1];
    if (last) void markRead(id, last.id);
    const fingerprint = JSON.stringify(messages); if (!firstLoad && fingerprint === lastMessages) return;
    const atBottom = firstLoad || target.scrollHeight - target.scrollTop - target.clientHeight < 80; firstLoad = false; lastMessages = fingerprint; target.replaceChildren();
    if (!messages.length) { const empty = el('div', null, 'jfc-empty'); empty.append(el('strong', 'Begin het gesprek'), el('span', 'Er zijn nog geen berichten in deze groep.')); target.append(empty); }
    messages.forEach(m => {
      const own = normalizeId(m.userId) === normalizeId(me?.userId);
      const item = el('div', null, 'jfc-message' + (own ? ' jfc-own' : '')); const avatar = el('div', (m.userName || '?').trim().charAt(0) || '?', 'jfc-avatar'); avatar.setAttribute('aria-hidden', 'true');
      const content = el('div', null, 'jfc-message-content'), meta = el('div', null, 'jfc-message-meta'); const time = el('time', new Date(m.time).toLocaleString([], { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })); time.dateTime = m.time;
      meta.append(el('strong', own ? 'Jij' : m.userName), time); content.append(meta, el('div', m.text, 'jfc-bubble')); item.append(avatar, content); target.append(item);
    });
    if (atBottom) target.scrollTop = target.scrollHeight;
  }
  function checkbox(label, checked, parent) { const l = el('label', null, 'jfc-check'), i = el('input'); i.type = 'checkbox'; i.checked = checked; l.append(i, el('span', label)); parent.append(l); return i; }
  function section(main, title, description) { const node = el('section', null, 'jfc-section'); node.append(el('h3', title), el('p', description, 'jfc-hint')); main.append(node); return node; }
  async function renderCreate(main) {
    const users = await api('users');
    const area = section(main, 'Start een gesprek', 'Beheerders hebben automatisch toegang tot alle chats en kunnen deze beheren.');
    if (!users.length) { area.append(el('p', 'Er zijn geen andere gebruikers met chattoegang.', 'jfc-hint')); return; }
    const modeLabel = el('label', 'Soort gesprek', 'jfc-hint'); modeLabel.htmlFor = 'jfc-create-mode'; area.append(modeLabel);
    const mode = el('select', null, 'jfc-field'); mode.id = 'jfc-create-mode';
    for (const [value, label] of [['direct', 'Eén-op-één'], ['group', 'Groep']]) { const o = el('option', label); o.value = value; mode.append(o); } area.append(mode);
    const options = el('div'); area.append(options);
    const draw = () => {
      options.replaceChildren();
      const name = el('input', null, 'jfc-field'); name.type = 'text'; name.placeholder = 'Naam van de groep'; name.setAttribute('aria-label', 'Groepsnaam'); name.maxLength = 80;
      if (mode.value === 'group') { name.style.marginTop = '12px'; options.append(name); }
      const members = el('fieldset'); members.append(el('legend', mode.value === 'direct' ? 'Kies een persoon' : 'Kies groepsleden'));
      const choices = users.map(u => {
        const l = el('label', null, 'jfc-check'), input = el('input'); input.type = mode.value === 'direct' ? 'radio' : 'checkbox'; input.name = 'jfc-member'; input.value = u.id; l.append(input, el('span', u.name)); members.append(l); return input;
      });
      options.append(members);
      const create = el('button', mode.value === 'direct' ? 'Chat starten' : 'Groep maken', 'jfc-action'); create.type = 'button';
      create.onclick = async () => {
        const chosen = choices.filter(c => c.checked).map(c => c.value);
        if (!chosen.length) { error(new Error('Kies ten minste één persoon.')); return; }
        if (mode.value === 'group' && !name.value.trim()) { name.focus(); error(new Error('Vul een groepsnaam in.')); return; }
        create.disabled = true;
        try {
          const room = mode.value === 'direct' ? await api('direct', 'POST', { userId: chosen[0] }) : await api('rooms', 'POST', { name: name.value, members: chosen, adminOnly: false });
          selected = room.id; creating = false; firstLoad = true; lastMessages = ''; await render();
        } catch(e) { error(e); create.disabled = false; }
      };
      options.append(create);
    };
    mode.onchange = draw; draw();
  }
  async function renderSettings(main) {
    const data = await api('settings');
    const access = section(main, 'Chattoegang', 'Bepaal wie berichten en groepen kan bekijken. Beheerders hebben altijd toegang.');
    const everyone = checkbox('Iedereen heeft toegang', data.everyone, access);
    const list = el('fieldset'); list.append(el('legend', 'Of kies gebruikers')); const allowed = data.users.map(u => [u.id, checkbox(u.name, data.allowedUsers.includes(u.id), list)]); access.append(list); list.disabled = everyone.checked; everyone.onchange = () => { list.disabled = everyone.checked; };
    const save = el('button', 'Toegang opslaan', 'jfc-action'); save.type = 'button'; save.onclick = async () => { save.disabled = true; try { await api('settings', 'PUT', { everyone: everyone.checked, allowedUsers: allowed.filter(x => x[1].checked).map(x => x[0]) }); save.textContent = 'Opgeslagen'; } catch(e) { error(e); } finally { save.disabled = false; } }; access.append(save);
    const createSection = section(main, 'Nieuwe groep', 'Maak een groep voor iedereen of kies specifieke leden.');
    const name = el('input', null, 'jfc-field'); name.type = 'text'; name.placeholder = 'Naam van de groep'; name.setAttribute('aria-label', 'Groepsnaam'); name.maxLength = 80; createSection.append(name);
    const adminOnly = checkbox('Alleen beheerders mogen berichten sturen', false, createSection);
    const members = el('fieldset'); members.append(el('legend', 'Leden · niets selecteren = iedereen')); const choices = data.users.map(u => [u.id, checkbox(u.name, false, members)]); createSection.append(members);
    const create = el('button', 'Groep maken', 'jfc-action'); create.type = 'button'; create.onclick = async () => { if (!name.value.trim()) { name.focus(); error(new Error('Vul een groepsnaam in.')); return; } create.disabled = true; try { await api('rooms', 'POST', { name: name.value, adminOnly: adminOnly.checked, members: choices.filter(x => x[1].checked).map(x => x[0]) }); await render(); } catch(e) { error(e); create.disabled = false; } }; createSection.append(create);
    const groupSection = section(main, 'Groepen', 'Verwijderen wist ook alle berichten in de groep.'); const groups = el('div', null, 'jfc-room-list'); groupSection.append(groups);
    if (!data.rooms.length) groups.append(el('p', 'Nog geen groepen.', 'jfc-hint'));
    data.rooms.forEach(r => { const row = el('div', null, 'jfc-room-item'); row.append(el('span', r.name + (r.adminOnly ? ' · Aankondigingen' : ''))); const del = el('button', 'Verwijderen', 'jfc-delete'); del.type = 'button'; del.setAttribute('aria-label', r.name + ' verwijderen'); del.onclick = async () => { if (!confirm('Groep en alle berichten definitief verwijderen?')) return; del.disabled = true; try { await api('rooms/' + r.id, 'DELETE'); await render(); } catch(e) { error(e); del.disabled = false; } }; row.append(del); groups.append(row); });
  }
  button.onclick = async () => { if (!panel.hidden) { closePanel(); return; } noticePending = false; hideNotice(); panel.hidden = false; button.setAttribute('aria-expanded', 'true'); settingsOpen = false; creating = false; firstLoad = true; try { await render(); } catch(e) { error(e); } };
  panel.addEventListener('keydown', event => { if (event.key === 'Escape') closePanel(); });
  let confirmedToken = null, observedToken, checkSequence = 0;
  function clearSession() {
    button.hidden = true; panel.hidden = true; button.setAttribute('aria-expanded', 'false');
    me = null; confirmedToken = null; selected = ''; lastMessages = ''; resetUnread();
  }
  async function check() {
    const sequence = ++checkSequence;
    placeButton();
    let token;
    try {
      token = client()?.accessToken();
      observedToken = token;
      if (!token) { clearSession(); return; }
      if (confirmedToken && confirmedToken !== token) clearSession();
      const current = await api('me');
      if (sequence !== checkSequence) return;
      // A delayed response from an earlier session must not reveal its chat.
      const activeToken = client()?.accessToken();
      if (activeToken !== token) { if (!activeToken || confirmedToken === token) clearSession(); return; }
      if (me && normalizeId(me.userId) !== normalizeId(current.userId)) {
        panel.hidden = true; button.setAttribute('aria-expanded', 'false'); selected = ''; lastMessages = ''; resetUnread();
      }
      me = current; confirmedToken = token; button.hidden = !me.enabled;
      if (!me.enabled) { panel.hidden = true; button.setAttribute('aria-expanded', 'false'); resetUnread(); }
      else await refreshUnread();
    } catch (err) {
      if (sequence !== checkSequence) return;
      // Keep an already-authorized button visible during temporary network/server errors.
      // Authentication failures and session changes still fail closed.
      if (!token || token !== confirmedToken || err.status === 401 || err.status === 403) clearSession();
      else if (!panel.hidden) error(new Error('Chat tijdelijk niet bereikbaar. Probeer het opnieuw.'));
    }
  }

  document.addEventListener('visibilitychange', () => { if (!document.hidden) { check(); if (noticePending) showNotice(unreadRooms); if (!panel.hidden && !settingsOpen && !creating) loadMessages().catch(error); } else hideNotice(); });
  check(); setInterval(check, 5000); setInterval(() => { if (me?.enabled) refreshUnread(); if (!panel.hidden && !settingsOpen && !creating && !document.hidden) loadMessages().catch(error); }, 4000);
  // The web app may create ApiClient or restore its session after our script
  // runs. Detect that promptly instead of waiting for the next 5-second check.
  // This checks only local state; it does not send a request unless it changes.
  setInterval(() => {
    let token;
    try { token = client()?.accessToken(); } catch { token = undefined; }
    if (token !== observedToken) { observedToken = token; return check(); }
  }, 200);
})();
