
module.exports = Point;

function Point(p) {
  p = p || {};
  this.x = p.x || 0;
  this.y = p.y || 0;
  this.z = p.z || 0;
}

Point.prototype.toString = function() {
  return this.x + ',' + this.y;
};
