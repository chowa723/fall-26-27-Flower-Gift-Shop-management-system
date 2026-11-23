// Delivery dashboard. Features: accept order, status flow, history + completed count.
const me = requireRole("delivery");
const NEXT = { "Assigned": ["Accept order", "Accepted"], "Accepted": ["Start delivery", "Out for delivery"], "Out for delivery": ["Mark delivered", "Delivered"] };

function myOrders() { return DB.get("orders", []).filter(function (o) { return o.riderId === me.id; }); }

function init() {
  initNav("tasks");
  $("searchTask").addEventListener("keyup", renderTasks);
  $("noteForm").addEventListener("submit", addNote);
  renderAll();
}
function renderAll() { renderTasks(); renderNotes(); renderHistory(); }

function renderTasks() {
  const mine = myOrders();
  const active = mine.filter(function (o) { return o.status !== "Delivered"; });
  const text = $("searchTask").value.trim().toLowerCase();
  const list = active.filter(function (o) { return ("#" + o.id + " " + o.address).toLowerCase().indexOf(text) !== -1; });
  const stats = $("riderStats"); stats.innerHTML = "";
  stats.appendChild(stat("To accept", mine.filter(function (o) { return o.status === "Assigned"; }).length));
  stats.appendChild(stat("In progress", mine.filter(function (o) { return o.status === "Accepted" || o.status === "Out for delivery"; }).length));
  stats.appendChild(stat("Completed", mine.length - active.length));
  const rows = list.map(function (o) {
    const step = NEXT[o.status];
    return ["#" + o.id, o.customerName, o.phone, o.address, itemsText(o), money(o.total), orderBadge(o.status),
      btn(step[0], function () { moveStatus(o.id, step[1]); }, "btn small green")];
  });
  fill("taskBox", buildTable(["Order", "Customer", "Phone", "Address", "Items", "Total", "Status", "Next step"], rows, "No active deliveries. The admin will assign orders to you."));
  $("taskCount").textContent = "Showing " + list.length + " of " + active.length + " active deliveries";
}
function moveStatus(id, status) {
  const orders = DB.get("orders", []);
  const o = orders.find(function (x) { return x.id === id && x.riderId === me.id; });
  if (!o) return;
  o.status = status; DB.set("orders", orders);
  renderAll(); toast("Order #" + id + ": " + status);
}

function renderNotes() {
  fillSelect("noteOrder", myOrders().map(function (o) { return { id: o.id, label: "Order #" + o.id + " - " + o.customerName }; }), "id", "label", "-- Select order --");
  const rows = DB.get("notes", []).filter(function (n) { return n.riderId === me.id; }).map(function (n) {
    return ["#" + n.orderId, n.text, n.date, btn("Delete", function () { deleteNote(n.id); }, "btn small danger")];
  });
  fill("noteBox", buildTable(["Order", "Note", "Date", ""], rows, "No notes yet."));
}
function addNote(event) {
  event.preventDefault();
  const orderId = $("noteOrder").value, text = $("noteText").value.trim();
  if (!runChecks([["noteOrderErr", checkSelect(orderId, "an order")], ["noteTextErr", checkText(text, "Note", 5)]])) return;
  const notes = DB.get("notes", []);
  notes.push({ id: nextId(notes), orderId: Number(orderId), riderId: me.id, text: text, date: new Date().toLocaleString() });
  DB.set("notes", notes); $("noteForm").reset(); renderNotes(); toast("Note added");
}
function deleteNote(id) {
  DB.set("notes", DB.get("notes", []).filter(function (n) { return n.id !== id; }));
  renderNotes(); toast("Note deleted");
}

function renderHistory() {
  const done = myOrders().filter(function (o) { return o.status === "Delivered"; });
  let sum = 0; done.forEach(function (o) { sum += o.total; });
  $("doneCount").textContent = "Total completed: " + done.length + " deliveries, worth " + money(sum);
  const rows = done.map(function (o) { return ["#" + o.id, o.customerName, o.address, money(o.total), o.date]; });
  fill("historyBox", buildTable(["Order", "Customer", "Address", "Total", "Ordered on"], rows, "No completed deliveries yet."));
}

if (me) init();
