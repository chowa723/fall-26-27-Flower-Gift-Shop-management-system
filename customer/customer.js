// Customer dashboard: shop (search), cart + VAT, orders (CRUD), wishlist, reviews.
const me = requireRole("customer");
let editingId = null;

function getCart() { return DB.get("cart_" + me.id, []); }
function saveCart(c) { DB.set("cart_" + me.id, c); }
function allFlowers() { return DB.get("flowers", []); }
function findFlower(id) { return allFlowers().find(function (f) { return f.id === id; }); }
function wishlist() { return currentUser().wishlist || []; }

function init() {
  fillSelect("filterCat", DB.get("categories", []), "id", "name", "All categories");
  initNav("shop");
  $("searchFlower").addEventListener("keyup", renderShop);
  $("filterCat").addEventListener("change", renderShop);
  $("checkoutForm").addEventListener("submit", placeOrder);
  $("editSave").addEventListener("click", saveAddress);
  $("editCancel").addEventListener("click", function () { editingId = null; $("editBox").classList.add("hidden"); });
  $("reviewForm").addEventListener("submit", saveReview);
  renderAll();
}
function renderAll() { renderShop(); renderCart(); renderOrders(); renderWishlist(); renderReviews(); }

// ---------- Shop (Read + Search) ----------
function renderShop() {
  const text = $("searchFlower").value.trim().toLowerCase();
  const cat = $("filterCat").value;
  const grid = $("flowerGrid"); grid.innerHTML = "";
  const list = allFlowers(); let shown = 0;
  list.forEach(function (f) {
    if (cat !== "" && String(f.categoryId) !== cat) return;
    if ((f.name + " " + catName(f.categoryId)).toLowerCase().indexOf(text) === -1) return;
    shown++;
    const liked = wishlist().indexOf(f.id) !== -1;
    const add = btn("Add to cart", function () { addToCart(f); });
    if (f.stock === 0) add.disabled = true;
    grid.appendChild(flowerCard(f, [add, btn(liked ? "Remove from wishlist" : "Wishlist", function () { toggleWish(f.id); }, "btn small ghost")]));
  });
  $("shopCount").textContent = "Showing " + shown + " of " + list.length + " flowers";
}

// ---------- Cart (feature 1: cart + VAT) ----------
function addToCart(f) {
  const cart = getCart();
  const line = cart.find(function (c) { return c.flowerId === f.id; });
  if ((line ? line.qty : 0) + 1 > f.stock) { toast("Only " + f.stock + " in stock", true); return; }
  if (line) line.qty++; else cart.push({ flowerId: f.id, qty: 1 });
  saveCart(cart); renderCart(); toast(f.name + " added to cart");
}
function changeQty(id, delta) {
  const cart = getCart(); const f = findFlower(id);
  const line = cart.find(function (c) { return c.flowerId === id; });
  if (!line || !f) return;
  if (line.qty + delta > f.stock) { toast("Only " + f.stock + " in stock", true); return; }
  line.qty += delta;
  saveCart(cart.filter(function (c) { return c.qty > 0; }));
  renderCart();
}
function removeFromCart(id) { saveCart(getCart().filter(function (c) { return c.flowerId !== id; })); renderCart(); }
function renderCart() {
  const cart = getCart().filter(function (c) { return findFlower(c.flowerId); });
  let subtotal = 0, count = 0;
  const rows = cart.map(function (c) {
    const f = findFlower(c.flowerId); const line = salePrice(f) * c.qty;
    subtotal += line; count += c.qty;
    return [f.name, money(salePrice(f)),
      [btn("-", function () { changeQty(f.id, -1); }), el("span", String(c.qty), "qty"), btn("+", function () { changeQty(f.id, 1); })],
      money(line), btn("Remove", function () { removeFromCart(f.id); }, "btn small danger")];
  });
  fill("cartBox", buildTable(["Flower", "Price", "Quantity", "Line total", ""], rows, "Your cart is empty. Add flowers from the shop."));
  const sum = $("cartSummary"); sum.innerHTML = "";
  if (rows.length > 0) {
    const vat = subtotal * VAT_RATE;
    sum.appendChild(el("p", "Subtotal: " + money(subtotal)));
    sum.appendChild(el("p", "VAT (5%): " + money(vat)));
    sum.appendChild(el("h3", "Total: " + money(subtotal + vat)));
  }
  $("cartCount").textContent = count;
}

// ---------- Orders (Create, Read, Update, Delete) ----------
function placeOrder(event) {
  event.preventDefault();
  const address = $("address").value.trim();
  if (!runChecks([["addressErr", checkText(address, "Address", 10)]])) return;
  const cart = getCart();
  if (cart.length === 0) { toast("Your cart is empty", true); return; }
  const flowers = allFlowers(); const items = []; let subtotal = 0;
  for (let i = 0; i < cart.length; i++) {
    const f = flowers.find(function (x) { return x.id === cart[i].flowerId; });
    if (!f || f.stock < cart[i].qty) { toast("Not enough stock for " + (f ? f.name : "an item"), true); return; }
    items.push({ flowerId: f.id, name: f.name, price: salePrice(f), qty: cart[i].qty });
    subtotal += salePrice(f) * cart[i].qty;
    f.stock -= cart[i].qty;
  }
  const orders = DB.get("orders", []); const vat = subtotal * VAT_RATE;
  orders.push({ id: nextId(orders), customerId: me.id, customerName: me.name, phone: me.phone, items: items,
    subtotal: subtotal, vat: vat, total: subtotal + vat, address: address, status: "Pending", riderId: null, date: new Date().toLocaleString() });
  DB.set("orders", orders); DB.set("flowers", flowers); saveCart([]);
  $("checkoutForm").reset(); renderAll(); showSection("orders"); toast("Order placed");
}
function myOrders() { return DB.get("orders", []).filter(function (o) { return o.customerId === me.id; }); }
function renderOrders() {
  const rows = myOrders().map(function (o) {
    const acts = [];
    if (o.status === "Pending") {
      acts.push(btn("Edit address", function () { startEdit(o); }));
      acts.push(btn("Cancel", function () { cancelOrder(o.id); }, "btn small danger"));
    }
    return ["#" + o.id, itemsText(o), money(o.total), o.address, orderBadge(o.status), o.riderId ? userName(o.riderId) : "-", acts];
  });
  fill("orderBox", buildTable(["Order", "Items", "Total", "Address", "Status", "Rider", "Actions"], rows, "You have not placed an order yet."));
}
function startEdit(o) { editingId = o.id; $("editAddress").value = o.address; $("editErr").textContent = ""; $("editBox").classList.remove("hidden"); }
function saveAddress() {
  const address = $("editAddress").value.trim();
  if (!runChecks([["editErr", checkText(address, "Address", 10)]])) return;
  const orders = DB.get("orders", []);
  const o = orders.find(function (x) { return x.id === editingId; });
  if (!o || o.status !== "Pending") { toast("This order can no longer be edited", true); return; }
  o.address = address; DB.set("orders", orders);
  editingId = null; $("editBox").classList.add("hidden"); renderOrders(); toast("Address updated");
}
function cancelOrder(id) {
  if (!confirm("Cancel order #" + id + "?")) return;
  const orders = DB.get("orders", []); const flowers = allFlowers();
  const o = orders.find(function (x) { return x.id === id; });
  if (!o || o.status !== "Pending") { toast("Only pending orders can be cancelled", true); return; }
  o.items.forEach(function (i) { const f = flowers.find(function (x) { return x.id === i.flowerId; }); if (f) f.stock += i.qty; });
  DB.set("flowers", flowers);
  DB.set("orders", orders.filter(function (x) { return x.id !== id; }));
  renderAll(); toast("Order cancelled");
}

// ---------- Wishlist (feature 2) ----------
function toggleWish(fid) {
  const users = DB.get("users", []);
  const u = users.find(function (x) { return x.id === me.id; });
  u.wishlist = u.wishlist || [];
  const i = u.wishlist.indexOf(fid);
  if (i === -1) u.wishlist.push(fid); else u.wishlist.splice(i, 1);
  DB.set("users", users); renderShop(); renderWishlist();
}
function renderWishlist() {
  const box = $("wishBox"); box.innerHTML = "";
  const list = allFlowers().filter(function (f) { return wishlist().indexOf(f.id) !== -1; });
  if (list.length === 0) { box.appendChild(el("p", "Your wishlist is empty.", "empty")); return; }
  list.forEach(function (f) {
    box.appendChild(flowerCard(f, [btn("Add to cart", function () { addToCart(f); }), btn("Remove", function () { toggleWish(f.id); }, "btn small ghost")]));
  });
}

// ---------- Reviews (feature 3) ----------
function renderReviews() {
  const seen = {}; const list = [];
  myOrders().filter(function (o) { return o.status === "Delivered"; }).forEach(function (o) {
    o.items.forEach(function (i) { if (!seen[i.flowerId]) { seen[i.flowerId] = true; list.push({ id: i.flowerId, name: i.name }); } });
  });
  fillSelect("reviewFlower", list, "id", "name", "-- Select flower --");
  const mine = DB.get("reviews", []).filter(function (r) { return r.customerId === me.id; });
  const rows = mine.map(function (r) {
    return [r.flowerName, r.rating + " / 5", r.text, r.date, btn("Delete", function () { deleteReview(r.id); }, "btn small danger")];
  });
  fill("reviewBox", buildTable(["Flower", "Rating", "Comment", "Date", ""], rows, "You have not written a review yet."));
}
function saveReview(event) {
  event.preventDefault();
  const fid = $("reviewFlower").value, rating = $("reviewRating").value, text = $("reviewText").value.trim();
  if (!runChecks([["reviewFlowerErr", checkSelect(fid, "a flower")], ["ratingErr", checkSelect(rating, "a rating")],
    ["reviewTextErr", checkText(text, "Comment", 3)]])) return;
  const reviews = DB.get("reviews", []);
  const old = reviews.find(function (r) { return r.customerId === me.id && r.flowerId === Number(fid); });
  const name = $("reviewFlower").options[$("reviewFlower").selectedIndex].text;
  if (old) { old.rating = Number(rating); old.text = text; old.date = new Date().toLocaleDateString(); }
  else reviews.push({ id: nextId(reviews), flowerId: Number(fid), flowerName: name, customerId: me.id, rating: Number(rating), text: text, date: new Date().toLocaleDateString() });
  DB.set("reviews", reviews);
  $("reviewForm").reset(); renderAll(); toast("Review saved");
}
function deleteReview(id) {
  DB.set("reviews", DB.get("reviews", []).filter(function (r) { return r.id !== id; }));
  renderAll(); toast("Review deleted");
}

if (me) init();
