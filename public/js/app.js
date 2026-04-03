// BoroWood SmartBuild - app.js - Node 001 - Statesboro GA
var aiHistory = [];
var busy = false;

function goApp() { show('s-ai'); }
function goIdea() { show('s-ai'); }

function show(id) {
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('on'); });
  var el = document.getElementById(id);
  if (el) el.classList.add('on');
}

function switchMode(mode) {
  document.querySelectorAll('.ntab').forEach(function(t) { t.classList.remove('on'); });
  if (mode === 'ai') {
    document.querySelectorAll('.ntab').forEach(function(t, i) { if (i === 1) t.classList.add('on'); });
    show('s-ai');
  } else {
    document.querySelectorAll('.ntab').forEach(function(t, i) { if (i === 0) t.classList.add('on'); });
    show('s-idea');
  }
}

function qp(el) {
  var inp = document.getElementById('inp');
  if (inp) { inp.value = el.textContent.trim(); send(); }
}

function hk(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
}

function ar(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 100) + 'px';
}

function addMsg(role, text) {
  var c = document.getElementById('msgs');
  if (!c) return;
  var d = document.createElement('div');
  d.className = 'msg' + (role === 'user' ? ' u' : '');
  var av = role === 'user' ? 'me' : 'ai';
  var label = role === 'user' ? 'You' : 'AI';
  var bub = role === 'user' ? 'me' : 'ai';
  d.innerHTML = '<div class="av ' + av + '">' + label + '</div><div class="bub ' + bub + '">' + text + '</div>';
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
}

function showTyping() {
  var c = document.getElementById('msgs');
  if (!c) return;
  var d = document.createElement('div');
  d.className = 'msg';
  d.id = 'tdiv';
  d.innerHTML = '<div class="av ai">AI</div><div class="bub ai"><em style="opacity:.5">Designing...</em></div>';
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
}

function hideTyping() {
  var t = document.getElementById('tdiv');
  if (t) t.remove();
}

function send() {
  var inp = document.getElementById('inp');
  var txt = inp ? inp.value.trim() : '';
  if (!txt || busy) return;
  inp.value = '';
  inp.style.height = 'auto';
  busy = true;
  var sb = document.getElementById('sbtn');
  if (sb) sb.disabled = true;
  addMsg('user', txt);
  aiHistory.push({ role: 'user', content: txt });
  showTyping();
  fetch('/api/design', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history: aiHistory })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.error) throw new Error(data.error);
    var full = '';
    if (data.content && Array.isArray(data.content)) {
      data.content.forEach(function(b) { if (b.text) full += b.text; });
    }
    var ds = full.indexOf('<DESIGN>');
    var de = full.indexOf('</DESIGN>');
    var chat = ds > -1 ? full.substring(0, ds).trim() : full.trim();
    var dj = null;
    if (ds > -1 && de > -1) {
      try { dj = JSON.parse(full.substring(ds + 8, de).trim()); } catch(e) {}
    }
    hideTyping();
    if (chat) addMsg('ai', chat);
    aiHistory.push({ role: 'assistant', content: full });
    if (dj) {
      addMsg('ai', 'Design ready: ' + dj.name + ' in ' + dj.material + '. Price: $' + dj.price + '. Say cut it to send to CNC.');
    }
  })
  .catch(function(err) {
    hideTyping();
    addMsg('ai', 'Error: ' + err.message);
  })
  .finally(function() {
    busy = false;
    var sb = document.getElementById('sbtn');
    if (sb) sb.disabled = false;
  });
}

document.addEventListener('DOMContentLoaded', function() {
  var sp = document.getElementById('s-splash');
  if (sp) sp.addEventListener('click', function() { show('s-ai'); });
  var sb = document.querySelector('.splash-btn,.sbtn2');
  if (sb) sb.addEventListener('click', function(e) { e.stopPropagation(); show('s-ai'); });
});
