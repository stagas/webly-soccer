
module.exports = Point;

function Point(p) {
  p = p || {};
  this.x = p.x || 0;
  this.y = p.y || 0;
  this.z = p.z || 0;
}

Point.prototype.isInside = function(area) {
  return this.x >= area[0].x && this.x <= area[1].x
      && this.y >= area[0].y && this.y <= area[1].y;
};

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

Point.prototype.lerp = function(target, alpha) {
  return new Point({
    x: this.x + (target.x - this.x) * alpha,
    y: this.y + (target.y - this.y) * alpha,
    z: this.z + (target.z - this.z) * alpha,
  });
};

Point.prototype.abs = function() {
  return new Point({
    x: Math.abs(this.x),
    y: Math.abs(this.y),
    z: Math.abs(this.z),
  });
};

Point.prototype.sign = function() {
  return new Point({
    x: Math.sign(this.x),
    y: Math.sign(this.y),
    z: Math.sign(this.z),
  });
};

Point.prototype.toString = function() {
  return this.x + ',' + this.y;
};
