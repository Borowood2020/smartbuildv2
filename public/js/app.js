/* BoroWood SmartBuild - app.js - Node 001 - Fixed */
var MATS = {"Birch 1/4\"": {color:"#9E6028",rate:0.171,cnc:1.0,grade:"A/B Sanded"}, "Birch 1/2\"": {color:"#9E6028",rate:0.265,cnc:1.1,grade:"A/B Sanded"}, "Birch 3/4\"": {color:"#9E6028",rate:0.342,cnc:1.25,grade:"A/B Sanded"}, "MDF 1/2\"": {color:"#6A625A",rate:0.148,cnc:0.85,grade:"Smooth B/S"}, "Baltic Birch 3/4\"": {color:"#B8904A",rate:0.418,cnc:1.2,grade:"B/BB 13-ply"}};
var SYSTEM = "You are SmartBuild AI for BoroWood CNC shop Statesboro GA. Design what customers want using ONLY: Birch 1/4\" $0.171/sqin cnc 1.0, Birch 1/2\" $0.265/sqin cnc 1.1, Birch 3/4\" $0.342/sqin cnc 1.25, MDF 1/2\" $0.148/sqin cnc 0.85, Baltic Birch 3/4\" $0.418/sqin cnc 1.2. Price=(sqin*rate+mins/60*20*mult+1.5)/0.8. Reply with one craftsman sentence then <DESIGN>{type,name,width,depth_height,thickness,sqin,cut_minutes,cut_time,material,grade,material_reason,alternative_materials,build_notes,material_cost,cnc_cost,margin,price}</DESIGN>";
var aiHistory = [];
var busy = false;

function goApp() { show("s-idea"); }
function goIdea() { show("s-idea"); }
function show(id) {
  document.querySelectorAll(".screen").forEach(function(s) { s.classList.remove("on"); });
  var el = document.getElementById(id);
  if (el) el.classList.add("on");
}
function switchMode(mode) {
  document.querySelectorAll(".ntab").forEach(function(t) { t.classList.remove("on"); });
  if (mode === "ai") {
    document.querySelectorAll(".ntab").forEach(function(t, i) { if (i === 1) t.classList.add("on"); });
    show("s-ai");
  } else {
    document.querySelectorAll(".ntab").forEach(function(t, i) { if (i === 0) t.classList.add("on"); });
    show("s-idea");
  }
}
function qp(el) {
  var inp = document.getElementById("inp");
  if (inp) { inp.value = el.textContent; send(); }
}
function hk(e) {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
}
function ar(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 100) + "px";
}
function addMsg(role, text) {
  var c = document.getElementById("msgs");
  if (!c) return;
  var d = document.createElement("div");
  d.className = "msg" + (role === "user" ? " u" : "");
  d.innerHTML = "<div class=\"av " + (role === "user" ? "me" : "ai") + "\">" + (role === "user" ? "You" : "AI") + "</div><div class=\"bub " + (role === "user" ? "me" : "ai") + "\">" + text.replace(/\n/g, "<br>") + "</div>";
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
}
function showTyping() {
  var c = document.getElementById("msgs");
  if (!c) return;
  var d = document.createElement("div");
  d.className = "msg"; d.id = "tdiv";
  d.innerHTML = "<div class=\"av ai\">AI</div><div class=\"bub ai\"><div style=\"display:flex;gap:4px;padding:4px;\"><div style=\"width:5px;height:5px;border-radius:50%;background:#735236;animation:lp .8s ease-in-out infinite;\"></div><div style=\"width:5px;height:5px;border-radius:50%;background:#735236;animation:lp .8s ease-in-out .15s infinite;\"></div><div style=\"width:5px;height:5px;border-radius:50%;background:#735236;animation:lp .8s ease-in-out .3s infinite;\"></div></div></div>";
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
}
function hideTyping() { var t = document.getElementById("tdiv"); if (t) t.remove(); }

function send() {
  var inp = document.getElementById("inp");
  var txt = inp ? inp.value.trim() : "";
  if (!txt || busy) return;
  inp.value = ""; inp.style.height = "auto";
  busy = true;
  var sbtn = document.getElementById("sbtn");
  if (sbtn) sbtn.disabled = true;
  addMsg("user", txt);
  aiHistory.push({role: "user", content: txt});
  showTyping();
  fetch("/api/design", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({history: aiHistory})
  }).then(function(res) { return res.json(); }).then(function(data) {
    if (data.error) throw new Error(data.error);
    var full = (data.content || []).map(function(b) { return b.text || ""; }).join("");
    var dm = full.match(/<DESIGN>([\s\S]*?)<\/DESIGN>/);
    var chat = full.replace(/<DESIGN>[\s\S]*?<\/DESIGN>/g, "").trim();
    hideTyping();
    if (chat) addMsg("ai", chat);
    aiHistory.push({role: "assistant", content: full});
    if (dm) {
      try {
        var d = JSON.parse(dm[1].trim());
        addMsg("ai", "Design ready: " + d.name + " in " + d.material + ". Price: $" + d.price + ". Tell me to cut it and we go.");
      } catch(e) {}
    }
  }).catch(function(err) {
    hideTyping();
    addMsg("ai", "Connection error: " + err.message);
  }).finally(function() {
    busy = false;
    if (sbtn) sbtn.disabled = false;
  });
}

document.addEventListener("DOMContentLoaded", function() {
  var splash = document.getElementById("s-splash");
  if (splash) splash.addEventListener("click", goApp);
  var startBtn = document.querySelector(".splash-btn, .sbtn2");
  if (startBtn) startBtn.addEventListener("click", function(e) { e.stopPropagation(); goApp(); });
});
