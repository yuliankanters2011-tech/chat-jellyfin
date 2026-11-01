const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');

const script = fs.readFileSync('Web/chat.js', 'utf8');
const wait = () => new Promise(resolve => setTimeout(resolve, 40));

async function setup(header = '<div class="skinHeader"><div class="headerRight"><button class="headerUserButton">Profiel</button></div></div>') {
  const dom = new JSDOM(`<!doctype html><html><head></head><body>${header}</body></html>`, { url: 'http://jellyfin.test/web/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  const calls = [], intervals = [], observers = [];
  // jsdom does not lay out elements; model an attached, visible header.
  w.HTMLElement.prototype.getClientRects = function () { return this.isConnected ? [{ width: 100, height: 48 }] : []; };
  w.HTMLElement.prototype.getBoundingClientRect = function () { return { top: 0, bottom: 48, left: 0, right: 100, width: 100, height: 48 }; };
  const NativeObserver = w.MutationObserver;
  w.MutationObserver = class extends NativeObserver { constructor(callback) { super(callback); observers.push(this); } };
  const cleanup = () => { observers.forEach(observer => observer.disconnect()); dom.window.close(); };
  let failure = null, token = 'token';
  let admin = true, enabled = true, userId = 'abcdefab-cdef-abcd-efab-cdefabcdefab';
  let rooms = [{ id: 'room1', name: 'Algemeen', adminOnly: false, members: [] }];
  let unread = { total: 0, rooms: {} };
  let messages = [{ id: 'message1', userId: 'abcdefabcdefabcdefabcdefabcdefab', userName: 'Tester', text: '<img src=x onerror=alert(1)>', time: '2026-01-01T12:00:00Z' }];
  w.ApiClient = { accessToken: () => token, getUrl: p => '/' + p };
  w.setInterval = fn => { intervals.push(fn); return intervals.length; };
  w.confirm = () => true;
  w.fetch = async (url, options) => {
    calls.push({ url, ...options });
    const path = url.replace('/ChatPlugin/', '');
    if (failure && path === 'me') { if (typeof failure === 'function') return failure(); if (failure === 'network') throw new Error('offline'); return { ok: false, status: failure, text: async () => '' }; }
    let data = null;
    if (path === 'me') data = { enabled, admin, userId };
    else if (path === 'rooms' && options.method === 'GET') data = rooms;
    else if (path === 'unread') data = unread;
    else if (path.endsWith('/read') && options.method === 'POST') unread = { total: 0, rooms: {} };
    else if (path === 'users') data = [{ id: 'other', name: 'Andere gebruiker' }];
    else if (path === 'direct' && options.method === 'POST') { data = { id: 'dm', name: 'Privé', direct: true }; rooms = [...rooms, data]; }
    else if (path === 'settings' && options.method === 'GET') data = { everyone: true, allowedUsers: [], rooms, users: [{ id: userId, name: 'Tester' }] };
    else if (path.endsWith('/messages') && options.method === 'GET') data = messages;
    else if (path.endsWith('/messages') && options.method === 'POST') messages = [...messages, { id: 'message2', userId, userName: 'Tester', text: JSON.parse(options.body).text, time: '2026-01-01T12:01:00Z' }];
    else if (path === 'rooms' && options.method === 'POST') { data = { ...JSON.parse(options.body), id: 'room2' }; rooms = [...rooms, data]; }
    else if (path.startsWith('rooms/') && options.method === 'DELETE') rooms = rooms.filter(r => !path.endsWith(r.id));
    return { ok: true, text: async () => data === null ? '' : JSON.stringify(data) };
  };
  w.eval(script); await wait();
  return { dom, w, calls, intervals, cleanup, setAdmin: value => { admin = value; }, setEnabled: value => { enabled = value; }, setUser: value => { userId = value; }, setRooms: value => { rooms = value; }, setUnread: value => { unread = value; }, setMessages: value => { messages = value; }, setFailure: value => { failure = value; }, setToken: value => { token = value; } };
}

test('classic header, safe messages, sending and settings work', async t => {
  const { w, calls, cleanup } = await setup(); t.after(cleanup);
  const doc = w.document, button = doc.querySelector('#jf-chat-button');
  assert.equal(button.parentElement.className, 'headerRight');
  assert.equal(button.hidden, false);
  assert.equal(button.nextElementSibling.className, 'headerUserButton');
  assert.equal(calls[0].headers.Authorization, 'MediaBrowser Token="token"');
  button.click(); await wait();
  assert.equal(button.getAttribute('aria-expanded'), 'true');
  assert.equal(doc.querySelector('.jfc-message-meta strong').textContent, 'Jij');
  assert.equal(doc.querySelector('.jfc-bubble').textContent, '<img src=x onerror=alert(1)>');
  assert.equal(doc.querySelector('.jfc-bubble img'), null);
  const input = doc.querySelector('[aria-label="Bericht"]'); input.value = 'Hallo!';
  doc.querySelector('.jfc-compose').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await wait();
  assert.ok(calls.some(c => c.url.endsWith('/messages') && c.method === 'POST' && JSON.parse(c.body).text === 'Hallo!'));
  assert.equal(doc.querySelectorAll('.jfc-message').length, 2);
  doc.querySelector('[aria-label="Chat beheren"]').click(); await wait();
  assert.ok(doc.querySelector('.jfc-settings'));
  assert.equal(doc.querySelector('fieldset').disabled, true);
  doc.querySelector('.jfc-check input').click();
  assert.equal(doc.querySelector('fieldset').disabled, false);
  doc.querySelector('.jfc-action').click(); await wait();
  assert.ok(calls.some(c => c.url.endsWith('/settings') && c.method === 'PUT' && JSON.parse(c.body).everyone === false));
  const name = doc.querySelector('[aria-label="Groepsnaam"]'); name.value = 'Familie';
  [...doc.querySelectorAll('.jfc-action')].find(x => x.textContent === 'Groep maken').click(); await wait();
  assert.ok(calls.some(c => c.url.endsWith('/rooms') && c.method === 'POST' && JSON.parse(c.body).name === 'Familie'));
  assert.ok(doc.querySelector('[aria-label="Familie verwijderen"]'));
  doc.querySelector('[aria-label="Familie verwijderen"]').click(); await wait();
  assert.ok(calls.some(c => c.url.endsWith('/rooms/room2') && c.method === 'DELETE'));
  assert.equal(doc.querySelector('[aria-label="Familie verwijderen"]'), null);
  doc.querySelector('[aria-label="Terug naar chat"]').click(); await wait();
  doc.querySelector('#jf-chat').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(doc.querySelector('#jf-chat').hidden, true);
  assert.equal(button.getAttribute('aria-expanded'), 'false');
});

test('modern toolbar and navigation reattach the button; fallback does not cover header', async t => {
  const { w, cleanup } = await setup('<header class="MuiAppBar-root"><div class="MuiToolbar-root"><div></div><div class="toolbar-actions"><button aria-haspopup="true" aria-controls="sync-menu">Sync</button><button aria-haspopup="true" aria-controls="cast-menu">Cast</button><button>Search</button></div><div><button aria-haspopup="true" aria-controls="app-user-menu">User</button></div></div></header>'); t.after(cleanup);
  const doc = w.document, button = doc.querySelector('#jf-chat-button');
  assert.equal(button.parentElement.className, 'toolbar-actions');
  assert.equal(button.previousElementSibling.textContent, 'Search');
  assert.equal(doc.querySelectorAll('#jf-chat-button').length, 1);
  assert.ok(button.querySelector('svg'));
  assert.equal(button.textContent, '');
  doc.querySelector('header').remove(); await wait();
  assert.equal(button.parentElement, doc.body);
  assert.ok(button.classList.contains('jfc-fallback'));
  const next = doc.createElement('div'); next.className = 'skinHeader'; next.innerHTML = '<div class="headerRight"><button class="headerUserButton"></button></div>'; doc.body.append(next); await wait();
  assert.equal(button.parentElement.className, 'headerRight');
  assert.equal(button.classList.contains('jfc-fallback'), false);
});

test('announcement room is read-only and access changes close the panel', async t => {
  const { w, intervals, setAdmin, setEnabled, setRooms, cleanup } = await setup(); t.after(cleanup);
  setAdmin(false); setRooms([{ id: 'news', name: 'Nieuws', adminOnly: true, members: [] }]); await intervals[0]();
  const doc = w.document; doc.querySelector('#jf-chat-button').click(); await wait();
  assert.equal(doc.querySelector('.jfc-compose'), null);
  assert.match(doc.querySelector('.jfc-readonly').textContent, /Alleen beheerders/);
  assert.equal(doc.querySelector('[aria-label="Chat beheren"]'), null);
  setEnabled(false); await intervals[0]();
  assert.equal(doc.querySelector('#jf-chat').hidden, true);
  assert.equal(doc.querySelector('#jf-chat-button').hidden, true);
});

test('account switch closes the panel instead of showing the previous user’s messages', async t => {
  const { w, intervals, setUser, cleanup } = await setup(); t.after(cleanup);
  w.document.querySelector('#jf-chat-button').click(); await wait();
  setUser('10000000-0000-0000-0000-000000000000'); await intervals[0]();
  assert.equal(w.document.querySelector('#jf-chat').hidden, true);
});


test('non-admin can start a direct chat and a group, with admin visibility explained', async t => {
  const { w, calls, intervals, setAdmin, cleanup } = await setup(); t.after(cleanup);
  setAdmin(false); await intervals[0]();
  const doc = w.document; doc.querySelector('#jf-chat-button').click(); await wait();
  doc.querySelector('[aria-label="Nieuwe chat"]').click(); await wait();
  assert.match(doc.querySelector('.jfc-settings').textContent, /Beheerders hebben automatisch toegang/);
  doc.querySelector('input[type=radio]').click();
  [...doc.querySelectorAll('button')].find(b => b.textContent === 'Chat starten').click(); await wait();
  assert.ok(calls.some(c => c.url.endsWith('/direct') && JSON.parse(c.body).userId === 'other'));
  assert.equal(doc.querySelector('#jfc-room-select').value, 'dm');
  doc.querySelector('[aria-label="Nieuwe chat"]').click(); await wait();
  const mode = doc.querySelector('#jfc-create-mode'); mode.value = 'group'; mode.dispatchEvent(new w.Event('change'));
  doc.querySelector('[aria-label="Groepsnaam"]').value = 'Vrienden';
  doc.querySelector('input[type=checkbox]').click();
  [...doc.querySelectorAll('button')].find(b => b.textContent === 'Groep maken').click(); await wait();
  assert.ok(calls.some(c => c.url.endsWith('/rooms') && c.method === 'POST' && JSON.parse(c.body).members[0] === 'other'));
});


test('green unread badge updates and a visible open room is marked read', async t => {
  const { w, calls, intervals, setUnread, setMessages, cleanup } = await setup(); t.after(cleanup);
  const doc = w.document; setUnread({ total: 3, rooms: { room1: 3 } }); await intervals[0]();
  const badge = doc.querySelector('.jfc-badge'); assert.equal(badge.hidden, false); assert.equal(badge.textContent, '3');
  assert.match(doc.querySelector('#jf-chat-button').getAttribute('aria-label'), /3 ongelezen/);
  setMessages([{ id: 'last-message', userId: 'other', userName: 'Ander', text: 'Hallo', time: '2026-01-01T12:00:00Z' }]);
  doc.querySelector('#jf-chat-button').click(); await wait();
  assert.ok(calls.some(c => c.url.endsWith('/rooms/room1/read') && JSON.parse(c.body).messageId === 'last-message'));
  assert.equal(badge.hidden, true);
});

test('a hidden browser tab does not mark messages read', async t => {
  const { w, calls, setMessages, cleanup } = await setup(); t.after(cleanup);
  Object.defineProperty(w.document, 'hidden', { configurable: true, value: true });
  setMessages([{ id: 'hidden-message', userId: 'other', userName: 'Ander', text: 'Hallo', time: '2026-01-01T12:00:00Z' }]);
  w.document.querySelector('#jf-chat-button').click(); await wait();
  assert.ok(!calls.some(c => c.url.endsWith('/read')));
  Object.defineProperty(w.document, 'hidden', { configurable: true, value: false });
  w.document.dispatchEvent(new w.Event('visibilitychange')); await wait();
  assert.ok(calls.some(c => c.url.endsWith('/read')));
});

test('new messages show a private, clickable notification without repeated popups', async t => {
  const { w, intervals, setUnread, setMessages, cleanup } = await setup(); t.after(cleanup);
  const doc = w.document, notice = doc.querySelector('#jfc-notice');
  setMessages([{ id: 'new-message', userId: 'other', userName: 'Ander', text: 'Een privébericht', time: '2026-01-01T12:00:00Z' }]);
  setUnread({ total: 1, rooms: { room1: 1 }, latest: { room1: 'new-message' } }); await intervals[0]();
  assert.equal(notice.hidden, false);
  assert.match(notice.textContent, /nieuw chatbericht/);
  assert.doesNotMatch(notice.textContent, /privébericht|Ander/);
  doc.querySelector('.jfc-notice-close').click(); assert.equal(notice.hidden, true);
  await intervals[0](); assert.equal(notice.hidden, true);
  // Another device can read one message while a new one arrives: the count stays the same.
  setUnread({ total: 1, rooms: { room1: 1 }, latest: { room1: 'newer-message' } }); await intervals[0]();
  assert.equal(notice.hidden, false);
  doc.querySelector('.jfc-notice-open').click(); await wait();
  assert.equal(notice.hidden, true);
  assert.equal(doc.querySelector('#jf-chat').hidden, false);
  assert.equal(doc.querySelector('#jfc-room-select').value, 'room1');
});

test('notifications wait until a hidden tab is visible and are cleared when access is removed', async t => {
  const { w, intervals, setUnread, setEnabled, cleanup } = await setup(); t.after(cleanup);
  const doc = w.document, notice = doc.querySelector('#jfc-notice');
  Object.defineProperty(doc, 'hidden', { configurable: true, value: true });
  setUnread({ total: 2, rooms: { room1: 2 }, latest: { room1: 'newest' } }); await intervals[0]();
  assert.equal(notice.hidden, true);
  Object.defineProperty(doc, 'hidden', { configurable: true, value: false });
  doc.dispatchEvent(new w.Event('visibilitychange'));
  assert.equal(notice.hidden, false);
  assert.match(notice.textContent, /2 ongelezen/);
  setEnabled(false); await intervals[0]();
  assert.equal(notice.hidden, true);
});

test('messages in the currently open room do not trigger a popup', async t => {
  const { w, intervals, setUnread, cleanup } = await setup(); t.after(cleanup);
  const doc = w.document; doc.querySelector('#jf-chat-button').click(); await wait();
  setUnread({ total: 1, rooms: { room1: 1 }, latest: { room1: 'new-message' } }); await intervals[0]();
  assert.equal(doc.querySelector('#jfc-notice').hidden, true);
});


test('hidden header moves chat to visible fallback and restores it when the header returns', async t => {
  const { w, cleanup } = await setup(); t.after(cleanup);
  const doc = w.document, header = doc.querySelector('.skinHeader'), button = doc.querySelector('#jf-chat-button');
  assert.equal(button.parentElement.className, 'headerRight');
  header.style.display = 'none'; await wait();
  assert.equal(button.parentElement, doc.body);
  assert.ok(button.classList.contains('jfc-fallback'));
  header.style.display = ''; await wait();
  assert.equal(button.parentElement.className, 'headerRight');
  assert.equal(button.classList.contains('jfc-fallback'), false);
});

test('temporary server and network failures do not hide an authorized chat button', async t => {
  const { w, intervals, setFailure, cleanup } = await setup(); t.after(cleanup);
  const button = w.document.querySelector('#jf-chat-button');
  setFailure(500); await intervals[0](); assert.equal(button.hidden, false);
  setFailure('network'); await intervals[0](); assert.equal(button.hidden, false);
  setFailure(401); await intervals[0](); assert.equal(button.hidden, true);
  setFailure(null); await intervals[0](); assert.equal(button.hidden, false);
});

test('a changed or missing session cannot expose a previous user chat after a failed check', async t => {
  const { w, intervals, setFailure, setToken, cleanup } = await setup(); t.after(cleanup);
  const doc = w.document; doc.querySelector('#jf-chat-button').click(); await wait();
  setToken('different-token'); setFailure('network'); await intervals[0]();
  assert.equal(doc.querySelector('#jf-chat-button').hidden, true);
  assert.equal(doc.querySelector('#jf-chat').hidden, true);
  setFailure(null); await intervals[0](); assert.equal(doc.querySelector('#jf-chat-button').hidden, false);
  setToken(null); await intervals[0](); assert.equal(doc.querySelector('#jf-chat-button').hidden, true);
});


test('off-screen toolbar moves the button to a visible fallback', async t => {
  const { w, cleanup } = await setup(); t.after(cleanup);
  const doc = w.document, header = doc.querySelector('.skinHeader'), button = doc.querySelector('#jf-chat-button');
  header.getBoundingClientRect = () => ({ top: -100, bottom: -52, left: 0, right: 100 });
  header.classList.add('scrolled-away'); await wait();
  assert.equal(button.parentElement, doc.body);
  assert.equal(button.classList.contains('jfc-fallback'), true);
  delete header.getBoundingClientRect; header.classList.remove('scrolled-away'); await wait();
  assert.equal(button.parentElement.className, 'headerRight');
});

test('an outdated authentication error cannot hide a newer successful session check', async t => {
  const { w, intervals, setFailure, cleanup } = await setup(); t.after(cleanup);
  let complete;
  setFailure(() => new Promise(resolve => { complete = resolve; }));
  const old = intervals[0]();
  setFailure(null); await intervals[0]();
  complete({ ok: false, status: 401, text: async () => '' }); await old;
  assert.equal(w.document.querySelector('#jf-chat-button').hidden, false);
});
