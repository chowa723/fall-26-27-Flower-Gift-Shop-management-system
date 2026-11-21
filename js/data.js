// Seed data: loaded into localStorage the first time any page opens.
const VAT_RATE = 0.05;
const LOW_STOCK = 5;

const seedUsers = [
  { id: 1, name: "Site Admin", email: "admin@flower.com", phone: "01711000001", password: "admin123", role: "admin", status: "active", wishlist: [] },
  { id: 2, name: "Rahim Ahmed", email: "customer@flower.com", phone: "01711000002", password: "123456", role: "customer", status: "active", wishlist: [] },
  { id: 3, name: "Nusrat Jahan", email: "seller@flower.com", phone: "01711000003", password: "123456", role: "seller", status: "active", wishlist: [] },
  { id: 4, name: "Kamal Hossain", email: "rider@flower.com", phone: "01711000004", password: "123456", role: "delivery", status: "active", wishlist: [] }
];

const seedCategories = [
  { id: 1, name: "Rose" }, { id: 2, name: "Lily" }, { id: 3, name: "Orchid" },
  { id: 4, name: "Sunflower" }, { id: 5, name: "Tulip" }
];

const seedFlowers = [
  { id: 1, sellerId: 3, image: "images/rose-red.svg", name: "Red Rose Bunch", categoryId: 1, price: 120, discount: 0, stock: 30, color: "#C0394F" },
  { id: 2, sellerId: 3, image: "images/rose-pink.svg", name: "Pink Rose Bunch", categoryId: 1, price: 110, discount: 95, stock: 22, color: "#D9778F" },
  { id: 3, sellerId: 3, image: "images/lily.svg", name: "White Lily", categoryId: 2, price: 90, discount: 0, stock: 18, color: "#7E9C8E" },
  { id: 4, sellerId: 3, image: "images/orchid.svg", name: "Purple Orchid", categoryId: 3, price: 250, discount: 0, stock: 4, color: "#7B4FA0" },
  { id: 5, sellerId: 3, image: "images/sunflower.svg", name: "Sunflower", categoryId: 4, price: 70, discount: 0, stock: 6, color: "#B8860B" },
  { id: 6, sellerId: 3, image: "images/tulip.svg", name: "Orange Tulip", categoryId: 5, price: 150, discount: 130, stock: 12, color: "#D4622A" }
];
