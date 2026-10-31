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
  const NativeObserver = w.MutationObserver;
  w.MutationObserver = class extends NativeObserver { constructor(callback) { super(callback); observers.push(this); } };
  const cleanup = () => { observers.forEach(observer => observer.disconnect()); dom.window.close(); };
  let admin = true, enabled = true, userId = 'abcdefab-cdef-abcd-efab-cdefabcdefab';
  let rooms = [{ id: 'room1', name: 'Algemeen', adminOnly: false, members: [] }];
  let messages = [{ userId: 'abcdefabcdefabcdefabcdefabcdefab', userName: 'Tester', text: '<img src=x onerror=alert(1)>', time: '2026-01-01T12:00:00Z' }];
  w.ApiClient = { accessToken: () => 'token', getUrl: p => '/' + p };
  w.setInterval = fn => { intervals.push(fn); return intervals.length; };
  w.confirm = () => true;
  w.fetch = async (url, options) => {
    calls.push({ url, ...options });
    const path = url.replace('/ChatPlugin/', '');
    let data = null;
    if (path === 'me') data = { enabled, admin, userId };
    else if (path === 'rooms' && options.method === 'GET') data = rooms;
    else if (path === 'settings' && options.method === 'GET') data = { everyone: true, allowedUsers: [], rooms, users: [{ id: userId, name: 'Tester' }] };
    else if (path.endsWith('/messages') && options.method === 'GET') data = messages;
    else if (path.endsWith('/messages') && options.method === 'POST') messages = [...messages, { userId, userName: 'Tester', text: JSON.parse(options.body).text, time: '2026-01-01T12:01:00Z' }];
    else if (path === 'rooms' && options.method === 'POST') { data = { ...JSON.parse(options.body), id: 'room2' }; rooms = [...rooms, data]; }
    else if (path.startsWith('rooms/') && options.method === 'DELETE') rooms = rooms.filter(r => !path.endsWith(r.id));
    return { ok: true, text: async () => data === null ? '' : JSON.stringify(data) };
  };
  w.eval(script); await wait();
  return { dom, w, calls, intervals, cleanup, setAdmin: value => { admin = value; }, setEnabled: value => { enabled = value; }, setUser: value => { userId = value; }, setRooms: value => { rooms = value; } };
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
