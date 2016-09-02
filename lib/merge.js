
module.exports = function(target, src) {
  for (var key in src) {
    target[key] = src[key];
  }
  return target;
};
