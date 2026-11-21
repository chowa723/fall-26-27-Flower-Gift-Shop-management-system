// Admin dashboard. Features: assign riders, approve/block users, sales summary.
const me = requireRole("admin");
const STATUSES = ["Pending", "Assigned", "Accepted", "Out for delivery", "Delivered"];

function init() {
  initNav("overview");
  $("searchUser").addEventListener("keyup", renderUsers);
  $("catForm").addEventListener("submit", saveCategory);
  $("catCancel").addEventListener("click", resetCatForm);
  $("orderFilter").addEventListener("change", renderOrders);
  renderAll();
}
function renderAll() { renderSummary(); renderUsers(); renderCategories(); renderOrders(); }

// ---------- Sales summary (feature 3) ----------
function renderSummary() {
  const orders = DB.get("orders", []); const users = DB.get("users", []);
  let revenue = 0; orders.forEach(function (o) { if (o.status === "Delivered") revenue += o.total; });
  const stats = $("summaryStats"); stats.innerHTML = "";
  stats.appendChild(stat("Total orders", orders.length));
  stats.appendChild(stat("Revenue (delivered)", money(revenue)));
  stats.appendChild(stat("Users", users.length));
  const pending = users.filter(function (u) { return u.status === "pending"; }).length;
  const p = stat("Waiting for approval", pending); if (pending > 0) p.classList.add("warn"); stats.appendChild(p);
  const rows = STATUSES.map(function (s) {
    return [orderBadge(s), orders.filter(function (o) { return o.status === s; }).length];
  });
  fill("statusBox", buildTable(["Status", "Orders"], rows));
}

// ---------- Users: Read, Update (approve/block), Delete, Search (feature 2) ----------
function setUserStatus(id, status) {
  const users = DB.get("users", []);
  const u = users.find(function (x) { return x.id === id; });
  if (!u) return;
  u.status = status; DB.set("users", users); renderAll(); toast(u.name + " is now " + status);
}
function deleteUser(id) {
  if (!confirm("Delete this user?")) return;
  DB.set("users", DB.get("users", []).filter(function (u) { return u.id !== id; }));
  renderAll(); toast("User deleted");
}
function renderUsers() {
  const text = $("searchUser").value.trim().toLowerCase();
  const all = DB.get("users", []);
  const list = all.filter(function (u) { return (u.name + " " + u.email).toLowerCase().indexOf(text) !== -1; });
  const rows = list.map(function (u) {
    const acts = [];
    if (u.role !== "admin") {
      if (u.status === "pending") acts.push(btn("Approve", function () { setUserStatus(u.id, "active"); }, "btn small green"));
      if (u.status === "active") acts.push(btn("Block", function () { setUserStatus(u.id, "blocked"); }, "btn small ghost"));
      if (u.status === "blocked") acts.push(btn("Unblock", function () { setUserStatus(u.id, "active"); }, "btn small green"));
      acts.push(btn("Delete", function () { deleteUser(u.id); }, "btn small danger"));
    }
    return [u.name, u.email, u.phone, u.role, badge(u.status, u.status === "pending" ? "pending" : u.status), acts];
  });
  fill("userBox", buildTable(["Name", "Email", "Phone", "Role", "Status", "Actions"], rows, "No user matches your search."));
  $("userCount").textContent = "Showing " + list.length + " of " + all.length + " users";
}

// ---------- Categories: Create, Read, Update, Delete ----------
function saveCategory(event) {
  event.preventDefault();
  const id = $("catId").value, name = $("catName").value.trim();
  const cats = DB.get("categories", []);
  let msg = checkText(name, "Category name", 3);
  if (msg === "" && cats.some(function (c) { return c.name.toLowerCase() === name.toLowerCase() && String(c.id) !== id; })) msg = "This category already exists";
  if (!runChecks([["catNameErr", msg]])) return;
  if (id !== "") {
    cats.find(function (c) { return c.id === Number(id); }).name = name; toast("Category renamed");
  } else {
    cats.push({ id: nextId(cats), name: name }); toast("Category added");
  }
  DB.set("categories", cats); resetCatForm(); renderCategories();
}
function resetCatForm() {
  $("catForm").reset(); $("catId").value = ""; $("catNameErr").textContent = "";
  $("catSave").textContent = "Add category";
}
function renderCategories() {
  const flowers = DB.get("flowers", []);
  const rows = DB.get("categories", []).map(function (c) {
    const used = flowers.filter(function (f) { return f.categoryId === c.id; }).length;
    return [c.name, used, [
      btn("Rename", function () { $("catId").value = c.id; $("catName").value = c.name; $("catSave").textContent = "Save name"; $("catName").focus(); }),
      btn("Delete", function () { deleteCategory(c.id, used); }, "btn small danger")]];
  });
  fill("catBox", buildTable(["Category", "Flowers", "Actions"], rows, "No categories yet."));
}
function deleteCategory(id, used) {
  if (used > 0) { toast("Cannot delete: " + used + " flower(s) use this category", true); return; }
  if (!confirm("Delete this category?")) return;
  DB.set("categories", DB.get("categories", []).filter(function (c) { return c.id !== id; }));
  renderCategories(); toast("Category deleted");
}

// ---------- Orders: Read, assign rider (feature 1) ----------
function assignRider(orderId, riderId) {
  if (!riderId) { toast("Choose a rider first", true); return; }
  const orders = DB.get("orders", []);
  const o = orders.find(function (x) { return x.id === orderId; });
  if (!o || (o.status !== "Pending" && o.status !== "Assigned")) return;
  o.riderId = riderId; o.status = "Assigned"; DB.set("orders", orders);
  renderAll(); toast("Order #" + orderId + " assigned to " + userName(riderId));
}
function renderOrders() {
  const filter = $("orderFilter").value;
  const riders = DB.get("users", []).filter(function (u) { return u.role === "delivery" && u.status === "active"; });
  const list = DB.get("orders", []).filter(function (o) { return filter === "" || o.status === filter; });
  const rows = list.map(function (o) {
    let rider;
    if (o.status === "Pending" || o.status === "Assigned") {
      if (riders.length === 0) rider = "No active riders";
      else {
        const sel = el("select"); sel.setAttribute("aria-label", "Rider for order " + o.id);
        const first = el("option", "-- Rider --"); first.value = ""; sel.appendChild(first);
        riders.forEach(function (r) { const op = el("option", r.name); op.value = r.id; if (r.id === o.riderId) op.selected = true; sel.appendChild(op); });
        rider = [sel, btn("Assign", function () { assignRider(o.id, Number(sel.value)); })];
      }
    } else rider = userName(o.riderId);
    return ["#" + o.id, o.customerName, itemsText(o), money(o.total), o.address, orderBadge(o.status), rider];
  });
  fill("orderBox", buildTable(["Order", "Customer", "Items", "Total", "Address", "Status", "Rider"], rows, "No orders to show."));
}

if (me) init();
