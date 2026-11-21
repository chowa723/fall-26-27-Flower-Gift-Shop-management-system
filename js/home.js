// Home page: show featured flowers.
initData();
const featured = $("featured");
DB.get("flowers", []).slice(0, 4).forEach(function (f) { featured.appendChild(flowerCard(f)); });
