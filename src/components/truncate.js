export function truncate(num, digits) {
  var re = new RegExp("^-?\\d+(?:.\\d{0," + (digits || -1) + "})?");
  return num.toString().match(re)[0];
}
