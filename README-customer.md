# Customer part - Petal & Co (Flower Shop Management)

Only the customer side plus the shared files it needs. Open `index.html` in a browser.

Login: role Customer, customer@flower.com / 123456 (or sign up as a new customer).

## My files
- `customer/dashboard.html` and `customer/customer.js` (my main work)

## Shared files (change only after telling the group)
`index.html`, `css/style.css`, `js/data.js`, `js/storage.js`, `js/validation.js`, `js/auth.js`, `js/home.js`, `login.html`, `signup.html`, `images/`

## What I built
- CRUD: place order, read orders, edit address of a pending order, cancel a pending order
- Search: flowers by name or category, category filter, "Showing X of Y"
- 3 unique features: cart with 5% VAT, wishlist, reviews and ratings
- Validation: signup, checkout address, review form

## Testing reviews without the other roles
A review needs a Delivered order. Place an order, then paste this in the browser console (F12) on the dashboard page and refresh:

    const o = JSON.parse(localStorage.orders); o.forEach(x => x.status = "Delivered"); localStorage.orders = JSON.stringify(o);

In the full project the admin assigns a rider and the delivery man marks it Delivered.

## Git (repo: fall-26-27-management-system)
The Group Leader pushes the shared files to main first. I only commit inside `customer/`.

    git checkout -b feature/customer
    git add customer/
    git commit -m "Add customer dashboard"
    git push origin feature/customer
