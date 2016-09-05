
module.exports = Point;

function Point() {
  this.x = 0;
  this.y = 0;
  this.z = 0;
}

Point.prototype.toString = function() {
  return this.x + ',' + this.y;
};
