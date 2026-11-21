/* =========================================================
   seller.js - Everything the Seller can do (seller.html)
   ---------------------------------------------------------
   CRUD + Search : Manage Flowers
   Unique 1      : Low Stock Badge
   Unique 2      : Quick Stock Update (+ / -)
   Unique 3      : Discount Price Management
   ========================================================= */


// Get the logged-in seller
const me = requireRole("seller");


// Index of the flower being edited
let editFlowerIndex = -1;


// Fields used in the flower form
const flowerFields = ["fName", "fCat", "fPrice", "fDiscount", "fStock"];


// Low stock limit
const LOW_STOCK_LIMIT = LOW_STOCK;


/* =========================================================
   SHARED FUNCTIONS
   ========================================================= */


// Returns only the flowers belonging to this seller
function myFlowers() {
    let all = DB.get("flowers", []);
    let mine = [];

    for (let i = 0; i < all.length; i++) {
        if (all[i].sellerId === me.id) {
            mine.push(all[i]);
        }
    }

    return mine;
}


// Finds a flower using its id
function findFlower(id) {
    let all = DB.get("flowers", []);

    for (let i = 0; i < all.length; i++) {
        if (all[i].id === Number(id) && all[i].sellerId === me.id) {
            return all[i];
        }
    }

    return null;
}


// Redraws the flower list and statistics
function refreshAll() {
    renderStock();
}


/* =========================================================
   MANAGE FLOWERS: CREATE, READ, UPDATE, DELETE AND SEARCH
   ========================================================= */


// READ + SEARCH
function renderStock() {

    let mine = myFlowers();

    let totalStock = 0;
    let lowStock = 0;

    // Calculate seller statistics
    for (let i = 0; i < mine.length; i++) {

        totalStock += mine[i].stock;

        if (mine[i].stock <= LOW_STOCK_LIMIT) {
            lowStock++;
        }
    }


    // Display statistics
    let stats = "";

    stats += "<div class='stat-card'>";
    stats += "<div class='stat-number'>" + mine.length + "</div>";
    stats += "<div class='stat-label'>Flowers Listed</div>";
    stats += "</div>";

    stats += "<div class='stat-card'>";
    stats += "<div class='stat-number'>" + totalStock + "</div>";
    stats += "<div class='stat-label'>Total Stock</div>";
    stats += "</div>";

    stats += "<div class='stat-card'>";
    stats += "<div class='stat-number'>" + lowStock + "</div>";
    stats += "<div class='stat-label'>Low Stock Items</div>";
    stats += "</div>";

    document.getElementById("sellerStats").innerHTML = stats;


    // Get search and filter values
    let keyword = document.getElementById("searchStock").value.toLowerCase();
    let onlyLow = document.getElementById("onlyLow").checked;

    let rows = "";
    let shown = 0;


    // Search through seller's flowers
    for (let i = 0; i < mine.length; i++) {

        let flower = mine[i];

        let matchesName = flower.name.toLowerCase().indexOf(keyword) !== -1;

        let matchesStock = onlyLow === false ||
                           flower.stock <= LOW_STOCK_LIMIT;


        if (matchesName && matchesStock) {

            // Low stock badge
            let stockBadge = "";

            if (flower.stock <= LOW_STOCK_LIMIT) {
                stockBadge = "<span class='badge orange'>Low Stock</span>";
            } else {
                stockBadge = "<span class='badge green'>Available</span>";
            }


            // Stock update buttons
            let stockButtons =
                "<button type='button' class='btn btn-small' onclick='changeStock(" +
                flower.id + ", -1)'>-</button> " +

                "<strong>" + flower.stock + "</strong> " +

                "<button type='button' class='btn btn-small' onclick='changeStock(" +
                flower.id + ", 1)'>+</button>";


            // Discount price
            let discountPrice = "-";

            if (flower.discount > 0) {
                discountPrice = money(flower.discount);
            }


            // Create table row
            rows += "<tr>" +

                    "<td>" + flower.id + "</td>" +

                    "<td><strong>" + flower.name + "</strong></td>" +

                    "<td>" + catName(flower.categoryId) + "</td>" +

                    "<td>" + money(flower.price) + "</td>" +

                    "<td>" + discountPrice + "</td>" +

                    "<td>" + stockButtons + "<br>" + stockBadge + "</td>" +

                    "<td>" +
                        "<button type='button' class='btn btn-small' onclick='editFlower(" +
                        flower.id + ")'>Edit</button> " +

                        "<button type='button' class='btn btn-small btn-danger' onclick='deleteFlower(" +
                        flower.id + ")'>Delete</button>" +
                    "</td>" +

                    "</tr>";

            shown++;
        }
    }


    // Show message if no flowers are found
    if (shown === 0) {

        rows = "<tr><td colspan='7' class='empty-row'>" +
               "No flowers match your search.</td></tr>";
    }


    // Display flower table
    let table = "";

    table += "<table class='data-table'>";

    table += "<thead>";
    table += "<tr>";
    table += "<th>ID</th>";
    table += "<th>Flower</th>";
    table += "<th>Category</th>";
    table += "<th>Price</th>";
    table += "<th>Discount</th>";
    table += "<th>Stock</th>";
    table += "<th>Actions</th>";
    table += "</tr>";
    table += "</thead>";

    table += "<tbody>" + rows + "</tbody>";

    table += "</table>";

    document.getElementById("stockBox").innerHTML = table;


    // Show total search results
    document.getElementById("stockCount").innerHTML =
        "Showing " + shown + " of " + mine.length + " flowers";
}


/* =========================================================
   UNIQUE FEATURE 1: QUICK STOCK UPDATE
   ========================================================= */


// Increase or decrease flower stock
function changeStock(id, amount) {

    let all = DB.get("flowers", []);
    let flower = findFlower(id);

    if (flower === null) {
        return;
    }

    // Find the flower in the complete array
    for (let i = 0; i < all.length; i++) {

        if (all[i].id === Number(id) && all[i].sellerId === me.id) {

            if (all[i].stock + amount >= 0) {

                all[i].stock = all[i].stock + amount;

                DB.set("flowers", all);

                refreshAll();
            }

            return;
        }
    }
}


/* =========================================================
   CREATE OR UPDATE FLOWER
   ========================================================= */


function saveFlower(event) {

    event.preventDefault();

    let id = document.getElementById("fId").value;

    let name = document.getElementById("fName").value.trim();

    let category = document.getElementById("fCat").value;

    let priceText = document.getElementById("fPrice").value;

    let discountText = document.getElementById("fDiscount").value;

    let stockText = document.getElementById("fStock").value;


    let price = Number(priceText);

    let discount = Number(discountText);

    let stock = Number(stockText);


    // ----- Validation -----

    let discountError = "";

    if (discountText !== "") {

        discountError = checkNumber(discountText, "Discount price", 1, false);

        if (discountError === "" && discount >= price) {
            discountError = "Discount must be lower than the price.";
        }
    }


    let isValid = runChecks([

        ["fNameErr", checkText(name, "Name", 3)],

        ["fCatErr", checkSelect(category, "a category")],

        ["fPriceErr", checkNumber(priceText, "Price", 1, false)],

        ["fDiscountErr", discountError],

        ["fStockErr", checkNumber(stockText, "Stock", 0, true)]

    ]);


    if (isValid === false) {
        return false;
    }


    // ----- Save flower data -----

    let all = DB.get("flowers", []);


    let flowerData = {

        name: name,

        categoryId: Number(category),

        price: price,

        discount: discountText === "" ? 0 : discount,

        stock: stock,

        color: document.getElementById("fColor").value,

        image: document.getElementById("fImage").value

    };


    if (id !== "") {

        // UPDATE existing flower

        let flower = findFlower(id);

        if (flower !== null) {

            flower.name = flowerData.name;

            flower.categoryId = flowerData.categoryId;

            flower.price = flowerData.price;

            flower.discount = flowerData.discount;

            flower.stock = flowerData.stock;

            flower.color = flowerData.color;

            flower.image = flowerData.image;

            DB.set("flowers", all);

            toast("Flower updated");

        }

    } else {

        // CREATE new flower

        flowerData.id = nextId(all);

        flowerData.sellerId = me.id;

        all.push(flowerData);

        DB.set("flowers", all);

        toast("Flower added");
    }


    resetForm();

    refreshAll();

    showSection("stock");

    return false;
}


/* =========================================================
   UPDATE: PUT FLOWER DETAILS INTO THE FORM
   ========================================================= */


function editFlower(id) {

    let flower = findFlower(id);

    if (flower === null) {
        return;
    }


    document.getElementById("fId").value = flower.id;

    document.getElementById("fName").value = flower.name;

    document.getElementById("fCat").value = flower.categoryId;

    document.getElementById("fPrice").value = flower.price;

    document.getElementById("fDiscount").value =
        flower.discount > 0 ? flower.discount : "";

    document.getElementById("fStock").value = flower.stock;

    document.getElementById("fColor").value = flower.color;

    document.getElementById("fImage").value = flower.image || "";


    document.getElementById("formTitle").innerHTML = "Edit Flower";

    document.getElementById("saveBtn").value = "Update Flower";


    showSection("form");
}


/* =========================================================
   RESET FLOWER FORM
   ========================================================= */


function resetForm() {

    document.getElementById("flowerForm").reset();

    document.getElementById("fId").value = "";

    clearErrors(flowerFields);

    document.getElementById("formTitle").innerHTML = "Add a Flower";

    document.getElementById("saveBtn").value = "Save Flower";
}


/* =========================================================
   DELETE FLOWER
   ========================================================= */


function deleteFlower(id) {

    let flower = findFlower(id);

    if (flower === null) {
        return;
    }


    if (confirm("Are you sure you want to delete this flower?") === false) {
        return;
    }


    let all = DB.get("flowers", []);

    let newFlowers = [];


    // Copy all flowers except the selected flower
    for (let i = 0; i < all.length; i++) {

        if (all[i].id !== Number(id) || all[i].sellerId !== me.id) {

            newFlowers.push(all[i]);
        }
    }


    DB.set("flowers", newFlowers);


    resetForm();
    refreshAll();
    toast("Flower deleted");
}

/* =========================================================
   START
   ========================================================= */

function init() {

    // Fill flower category dropdown
    fillSelect("fCat", DB.get("categories", []), "id", "name", "-- Select --");
    // Navigation
    initNav("stock");
    // Search flowers
    document.getElementById("searchStock").addEventListener("keyup", renderStock);
    // Low stock filter
    document.getElementById("onlyLow").addEventListener("change", renderStock);
    // Flower form submission
    document.getElementById("flowerForm").addEventListener("submit", saveFlower);
    // Clear form
    document.getElementById("cancelEdit").addEventListener("click", resetForm);
    // Display flowers
    renderStock();
}
// Start seller dashboard
if (me) {
    init();
}
