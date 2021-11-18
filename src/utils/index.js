function cleanObject(obj) {
  var clean = Object.fromEntries(
    Object.entries(obj)
      .map(([k, v]) => [k, v === Object(v) ? cleanObject(v) : v])
      .filter(([_, v]) => v != null && v != '' && (v !== Object(v) || Object.keys(v).length))
  );
  return Array.isArray(obj) ? Object.values(clean) : clean;
}

module.exports = { cleanObject };
