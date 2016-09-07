
module.exports = Point;

function Point(p) {
  p = p || {};
  this.x = p.x || 0;
  this.y = p.y || 0;
  this.z = p.z || 0;
}

Point.prototype.round = function() {
  return new Point({
    x: Math.round(this.x),
    y: Math.round(this.y),
    z: Math.round(this.z),
  });
};

Point.prototype.inverse = function() {
  return new Point({
    x: -this.x,
    y: -this.y,
    z: -this.z,
  });
};

Point.prototype.toString = function() {
  return this.x + ',' + this.y;
};
