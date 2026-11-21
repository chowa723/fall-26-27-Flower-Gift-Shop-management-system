// Shared helpers: localStorage, DOM building, navigation, session.
const ROOT = document.body.dataset.root || "";
const STATUS_CLASS = { "Pending": "pending", "Assigned": "assigned", "Accepted": "accepted", "Out for delivery": "out", "Delivered": "done" };

const DB = {
  get: function (key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  },
  set: function (key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};

function $(id) { return document.getElementById(id); }

function initData() {
  if (DB.get("seeded", false)) {
    // older saved data: add the picture field to the demo flowers
    const saved = DB.get("flowers", []);
    saved.forEach(function (f) {
      if (f.image === undefined) { const s = seedFlowers.find(function (x) { return x.id === f.id; }); f.image = s ? s.image : ""; }
    });
    DB.set("flowers", saved);
    return;
  }
  DB.set("users", seedUsers); DB.set("categories", seedCategories); DB.set("flowers", seedFlowers);
  DB.set("orders", []); DB.set("reviews", []); DB.set("notes", []); DB.set("seeded", true);
}
function nextId(list) { let m = 0; list.forEach(function (x) { if (x.id > m) m = x.id; }); return m + 1; }
function money(n) { return Number(n).toFixed(2) + " Tk"; }
function salePrice(f) { return f.discount > 0 ? f.discount : f.price; }
function catName(id) {
  const c = DB.get("categories", []).find(function (x) { return x.id === id; });
  return c ? c.name : "Other";
}
function userName(id) {
  const u = DB.get("users", []).find(function (x) { return x.id === id; });
  return u ? u.name : "-";
}
function itemsText(o) { return o.items.map(function (i) { return i.name + " x" + i.qty; }).join(", "); }
function avgRating(fid) {
  const r = DB.get("reviews", []).filter(function (x) { return x.flowerId === fid; });
  if (r.length === 0) return "No reviews yet";
  let s = 0; r.forEach(function (x) { s += x.rating; });
  return (s / r.length).toFixed(1) + " / 5 (" + r.length + ")";
}

// ---- session ----
function currentUser() {
  const id = DB.get("currentUser", null);
  return DB.get("users", []).find(function (u) { return u.id === id; }) || null;
}
function requireRole(role) {
  initData();
  const u = currentUser();
  if (!u || u.role !== role || u.status !== "active") { location.href = ROOT + "login.html"; return null; }
  $("who").textContent = u.name;
  $("logoutBtn").addEventListener("click", logout);
  return u;
}
function logout() { localStorage.removeItem("currentUser"); location.href = ROOT + "login.html"; }

// ---- DOM helpers ----
function el(tag, text, cls) {
  const e = document.createElement(tag);
  if (text !== undefined && text !== "") e.textContent = text;
  if (cls) e.className = cls;
  return e;
}
function btn(text, fn, cls) {
  const b = el("button", text, cls || "btn small");
  b.type = "button";
  b.addEventListener("click", fn);
  return b;
}
function badge(text, cls) { return el("span", text, "badge " + (cls || "")); }
function orderBadge(s) { return badge(s, STATUS_CLASS[s]); }
function stockBadge(n) {
  if (n === 0) return badge("Out of stock", "low");
  if (n <= LOW_STOCK) return badge("Low stock: " + n + " left", "low");
  return badge("In stock: " + n, "ok");
}
function buildTable(headers, rows, emptyMsg) {
  if (rows.length === 0) return el("p", emptyMsg || "Nothing here yet.", "empty");
  const wrap = el("div", "", "tablebox");
  const t = el("table"); const head = el("tr");
  headers.forEach(function (h) { head.appendChild(el("th", h)); });
  const thead = el("thead"); thead.appendChild(head); t.appendChild(thead);
  const body = el("tbody");
  rows.forEach(function (r) {
    const tr = el("tr");
    r.forEach(function (c) {
      const td = el("td");
      (Array.isArray(c) ? c : [c]).forEach(function (x) {
        td.appendChild(x instanceof Node ? x : document.createTextNode(String(x)));
      });
      tr.appendChild(td);
    });
    body.appendChild(tr);
  });
  t.appendChild(body); wrap.appendChild(t);
  return wrap;
}
function fill(id, node) { const c = $(id); c.innerHTML = ""; c.appendChild(node); }
function fillSelect(id, items, valueKey, textKey, placeholder) {
  const s = $(id); s.innerHTML = "";
  const first = el("option", placeholder); first.value = ""; s.appendChild(first);
  items.forEach(function (it) { const o = el("option", it[textKey]); o.value = it[valueKey]; s.appendChild(o); });
}
function stat(label, value) {
  const d = el("div", "", "stat");
  d.appendChild(el("span", label, "muted")); d.appendChild(el("strong", String(value)));
  return d;
}
function flowerCard(f, actions) {
  const card = el("div", "", "card flower");
  const pic = el("div", "", "pic"); pic.style.background = f.color;
  if (f.image) {
    const img = el("img"); img.src = ROOT + f.image; img.alt = f.name; pic.appendChild(img);
  } else pic.textContent = f.name.charAt(0);
  card.appendChild(pic);
  card.appendChild(el("h3", f.name));
  card.appendChild(el("p", catName(f.categoryId), "muted"));
  const p = el("p", "", "price");
  if (f.discount > 0) { p.appendChild(el("s", money(f.price), "old")); p.appendChild(document.createTextNode(" ")); }
  p.appendChild(el("strong", money(salePrice(f))));
  card.appendChild(p);
  card.appendChild(el("p", "Rating: " + avgRating(f.id), "muted"));
  card.appendChild(stockBadge(f.stock));
  if (actions && actions.length) {
    const row = el("div", "", "actions");
    actions.forEach(function (a) { row.appendChild(a); });
    card.appendChild(row);
  }
  return card;
}
function toast(msg, bad) {
  const t = el("div", msg, "toast" + (bad ? " bad" : ""));
  t.setAttribute("role", "status");
  document.body.appendChild(t);
  setTimeout(function () { t.remove(); }, 2600);
}

// ---- dashboard navigation ----
function showSection(name) {
  document.querySelectorAll(".panel").forEach(function (p) { p.classList.toggle("hidden", p.id !== "sec-" + name); });
  document.querySelectorAll(".sidebar button[data-section]").forEach(function (b) {
    b.classList.toggle("active", b.dataset.section === name);
  });
}
function initNav(first) {
  document.querySelectorAll(".sidebar button[data-section]").forEach(function (b) {
    b.addEventListener("click", function () { showSection(b.dataset.section); });
  });
  showSection(first);
}
