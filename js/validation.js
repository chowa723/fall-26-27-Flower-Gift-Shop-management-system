// Validation helpers: each check returns "" when valid, or an error message.
function runChecks(list) {
  let ok = true;
  list.forEach(function (pair) {
    $(pair[0]).textContent = pair[1];
    if (pair[1] !== "") ok = false;
  });
  return ok;
}
function checkName(v) {
  if (v === "") return "Name is required";
  if (v.length < 3 || /[0-9]/.test(v)) return "At least 3 characters, no digits";
  return "";
}
function checkEmail(v) {
  if (v === "") return "Email is required";
  if (v.indexOf("@") === -1 || v.indexOf(".") === -1) return "Enter a valid email";
  return "";
}
function checkPhone(v) {
  if (v === "") return "Phone is required";
  if (v.length !== 11 || isNaN(v) || !v.startsWith("01")) return "11 digits starting with 01";
  return "";
}
function checkPassword(v) {
  if (v === "") return "Password is required";
  if (v.length < 6) return "At least 6 characters";
  return "";
}
function checkText(v, label, min) {
  if (v === "") return label + " is required";
  if (v.length < min) return label + " needs at least " + min + " characters";
  return "";
}
function checkNumber(v, label, min, whole) {
  if (v === "") return label + " is required";
  if (isNaN(v)) return label + " must be a number";
  const n = Number(v);
  if (n < min) return label + " must be at least " + min;
  if (whole && n % 1 !== 0) return label + " must be a whole number";
  return "";
}
function checkSelect(v, label) { return v === "" ? "Choose " + label : ""; }
