// Signup and login (used by signup.html and login.html).
initData();
const signupForm = $("signupForm");
const loginForm = $("loginForm");

if (signupForm) {
  signupForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const name = $("name").value.trim();
    const email = $("email").value.trim().toLowerCase();
    const phone = $("phone").value.trim();
    const role = $("role").value;
    const pass = $("password").value;
    const again = $("confirmPass").value;
    const users = DB.get("users", []);

    let emailMsg = checkEmail(email);
    if (emailMsg === "" && users.some(function (u) { return u.email === email; })) emailMsg = "This email is already registered";
    let againMsg = "";
    if (again === "") againMsg = "Confirm your password";
    else if (pass !== again) againMsg = "Passwords do not match";

    const ok = runChecks([
      ["nameErr", checkName(name)], ["emailErr", emailMsg], ["phoneErr", checkPhone(phone)],
      ["roleErr", checkSelect(role, "a role")], ["passErr", checkPassword(pass)], ["confirmErr", againMsg]
    ]);
    if (!ok) return;

    const status = role === "customer" ? "active" : "pending";
    users.push({ id: nextId(users), name: name, email: email, phone: phone, password: pass, role: role, status: status, wishlist: [] });
    DB.set("users", users);
    const msg = $("formMsg");
    msg.className = "notice good";
    msg.textContent = status === "active"
      ? "Account created. Taking you to login..."
      : "Account created. An admin must approve it before you can log in.";
    signupForm.reset();
    if (status === "active") setTimeout(function () { location.href = "login.html"; }, 1200);
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const role = $("role").value;
    const email = $("email").value.trim().toLowerCase();
    const pass = $("password").value;
    const ok = runChecks([
      ["roleErr", checkSelect(role, "a role")], ["emailErr", checkEmail(email)],
      ["passErr", pass === "" ? "Password is required" : ""]
    ]);
    if (!ok) return;

    const user = DB.get("users", []).find(function (u) { return u.email === email && u.password === pass && u.role === role; });
    const msg = $("formMsg");
    msg.className = "notice bad";
    if (!user) { msg.textContent = "Email, password or role is wrong."; return; }
    if (user.status === "pending") { msg.textContent = "Your account is waiting for admin approval."; return; }
    if (user.status === "blocked") { msg.textContent = "Your account is blocked. Contact the admin."; return; }
    DB.set("currentUser", user.id);
    location.href = user.role + "/dashboard.html";
  });
}
