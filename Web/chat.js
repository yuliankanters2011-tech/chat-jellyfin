(() => {
  'use strict';
  if (window.__jellyfinChatLoaded) return;
  window.__jellyfinChatLoaded = true;
  const style = document.createElement('style');
  style.textContent = `#jf-chat-button{position:fixed;right:16px;top:12px;z-index:10000;background:#00a4dc;color:white;border:0;border-radius:50%;width:42px;height:42px;font-size:22px;cursor:pointer}#jf-chat{position:fixed;right:16px;top:62px;bottom:16px;width:min(390px,calc(100vw - 32px));z-index:10000;background:#202329;color:#fff;border:1px solid #555;border-radius:12px;box-shadow:0 8px 35px #0009;display:flex;flex-direction:column;font:14px sans-serif}#jf-chat[hidden]{display:none}#jf-chat header,#jf-chat footer{padding:12px;display:flex;gap:8px;align-items:center}#jf-chat main{padding:12px;overflow:auto;flex:1}#jf-chat button,#jf-chat select,#jf-chat input{font:inherit;padding:7px;border-radius:5px}#jf-chat select,#jf-chat input[type=text]{background:#333;color:#fff;border:1px solid #777;min-width:0}#jf-chat footer input{flex:1}#jf-chat .msg{padding:8px 0;border-bottom:1px solid #ffffff18;overflow-wrap:anywhere;white-space:pre-wrap}#jf-chat small{color:#aaa}#jf-chat .settings label{display:block;margin:8px 0}#jf-chat .settings fieldset{margin:12px 0;border:1px solid #555}#jf-chat .error{color:#ffb3a7}`;
  document.head.appendChild(style);
  const button = document.createElement('button'); button.id = 'jf-chat-button'; button.title = 'Chat'; button.setAttribute('aria-label', 'Chat openen'); button.textContent = '💬'; button.hidden = true;
  const panel = document.createElement('section'); panel.id = 'jf-chat'; panel.hidden = true; panel.setAttribute('aria-label', 'Chat');
  document.body.append(button, panel);
  let me, rooms = [], selected = '', settingsOpen = false, busy = false;
  const el = (tag, text) => { const node = document.createElement(tag); if (text != null) node.textContent = text; return node; };
  function client() { return window.ApiClient; }
  async function api(path, method = 'GET', body) {
    const c = client(); if (!c || !c.accessToken()) throw new Error('Niet aangemeld');
    const response = await fetch(c.getUrl('ChatPlugin/' + path), { method, headers: { 'X-Emby-Token': c.accessToken(), ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
    if (!response.ok) throw new Error('Chatverzoek mislukt (' + response.status + ')');
    const content = await response.text(); return content ? JSON.parse(content) : null;
  }
  function error(err) { const e = panel.querySelector('.error'); if (e) e.textContent = err.message; }
  async function refreshRooms() { rooms = await api('rooms'); if (!rooms.some(r => r.id === selected)) selected = rooms[0]?.id || ''; }
  async function render() {
    panel.replaceChildren();
    const header = el('header'), title = el('strong', 'Chat'); header.append(title);
    if (me.admin) { const config = el('button', settingsOpen ? 'Terug' : 'Beheer'); config.onclick = async () => { settingsOpen = !settingsOpen; try { await render(); } catch(e) { error(e); } }; header.append(config); }
    const close = el('button', '✕'); close.setAttribute('aria-label', 'Sluiten'); close.onclick = () => panel.hidden = true; header.append(close); panel.append(header);
    const main = el('main'); panel.append(main); const err = el('div'); err.className = 'error'; header.append(err);
    if (settingsOpen) { await renderSettings(main); return; }
    await refreshRooms();
    if (!rooms.length) { main.textContent = 'Er zijn nog geen groepen. Vraag een beheerder om er een te maken.'; return; }
    const select = el('select'); select.setAttribute('aria-label', 'Groep'); rooms.forEach(r => { const o = el('option', r.name + (r.adminOnly ? ' 📢' : '')); o.value = r.id; select.append(o); }); select.value = selected;
    select.onchange = async () => { selected = select.value; try { await render(); } catch(e) { error(e); } }; header.insertBefore(select, close);
    main.id = 'jf-chat-messages'; await loadMessages();
    const room = rooms.find(r => r.id === selected);
    const footer = el('footer');
    if (room.adminOnly && !me.admin) footer.append(el('small', 'Alleen beheerders kunnen hier berichten sturen.'));
    else {
      const input = el('input'); input.type = 'text'; input.placeholder = 'Schrijf een bericht'; input.maxLength = 2000; input.setAttribute('aria-label', 'Bericht');
      const send = el('button', 'Verstuur');
      const submit = async () => { const text = input.value.trim(); if (!text || busy) return; busy = true; send.disabled = true; try { await api('rooms/' + selected + '/messages', 'POST', { text }); input.value = ''; await loadMessages(); } catch(e) { error(e); } finally { busy = false; send.disabled = false; } };
      input.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }; send.onclick = submit; footer.append(input, send);
    }
    panel.append(footer);
  }
  async function loadMessages() {
    const target = panel.querySelector('#jf-chat-messages'); if (!target || !selected) return;
    const id = selected, messages = await api('rooms/' + id + '/messages'); if (selected !== id || !target.isConnected) return;
    const atBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 80; target.replaceChildren();
    messages.forEach(m => { const item = el('div'); item.className = 'msg'; item.append(el('strong', m.userName), el('small', ' · ' + new Date(m.time).toLocaleString()), el('div', m.text)); target.append(item); });
    if (atBottom) target.scrollTop = target.scrollHeight;
  }
  function checkbox(label, checked, parent) { const l = el('label'), i = el('input'); i.type = 'checkbox'; i.checked = checked; l.append(i, document.createTextNode(' ' + label)); parent.append(l); return i; }
  async function renderSettings(main) {
    main.className = 'settings'; const data = await api('settings');
    main.append(el('h3', 'Wie mag chatten?'));
    const everyone = checkbox('Iedereen', data.everyone, main);
    const list = el('fieldset'); list.append(el('legend', 'Toegestane gebruikers als niet iedereen toegang heeft')); const allowed = data.users.map(u => [u.id, checkbox(u.name, data.allowedUsers.includes(u.id), list)]); main.append(list);
    const save = el('button', 'Toegang opslaan'); save.onclick = async () => { try { await api('settings', 'PUT', { everyone: everyone.checked, allowedUsers: allowed.filter(x => x[1].checked).map(x => x[0]) }); save.textContent = 'Opgeslagen'; } catch(e) { error(e); } }; main.append(save);
    main.append(el('h3', 'Nieuwe groep')); const name = el('input'); name.type = 'text'; name.placeholder = 'Groepsnaam'; name.maxLength = 80; main.append(name);
    const adminOnly = checkbox('Alleen beheerders mogen berichten sturen', false, main);
    const members = el('fieldset'); members.append(el('legend', 'Leden (niets selecteren = iedereen met toegang)')); const choices = data.users.map(u => [u.id, checkbox(u.name, false, members)]); main.append(members);
    const create = el('button', 'Groep maken'); create.onclick = async () => { try { await api('rooms', 'POST', { name: name.value, adminOnly: adminOnly.checked, members: choices.filter(x => x[1].checked).map(x => x[0]) }); await render(); } catch(e) { error(e); } }; main.append(create);
    main.append(el('h3', 'Groepen')); data.rooms.forEach(r => { const row = el('p'); row.append(document.createTextNode(r.name + ' ')); const del = el('button', 'Verwijderen'); del.onclick = async () => { if (!confirm('Groep en alle berichten definitief verwijderen?')) return; try { await api('rooms/' + r.id, 'DELETE'); await render(); } catch(e) { error(e); } }; row.append(del); main.append(row); });
  }
  button.onclick = async () => { panel.hidden = !panel.hidden; if (!panel.hidden) { settingsOpen = false; try { await render(); } catch(e) { error(e); } } };
  async function check() { try { me = await api('me'); button.hidden = !me.enabled; if (!me.enabled) panel.hidden = true; } catch { button.hidden = true; panel.hidden = true; me = null; } }
  check(); setInterval(check, 10000); setInterval(() => { if (!panel.hidden && !settingsOpen) loadMessages().catch(error); }, 4000);
})();
