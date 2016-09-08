var Point = require('./point');
var geomCollision = require('geom-collision');
var rayVsLineSegment = require('ray-vs-line-segment');

exports.rayLineIntersect = function(a, b) {
  return rayVsLineSegment({
    start: a[0],
    end: a[1]
  }, {
    start: b[0],
    end: b[1]
  });
};

exports.lineCircleCollision = function(line, pos, radius) {
  var output = geomCollision.lineCircle(
    line[0],
    line[1],
    pos,
    radius
  );
  if (output.result === geomCollision.INTERSECT) {
    var hit = output.entry || output.exit;
    return {
      pos: hit,
      vel: exports.angleToPoint(Math.atan2(hit.y - pos.y, hit.x - pos.x))
    };
  } else {
    return null;
  }
}

exports.distanceTo = function(target, src) {
  var dx = src.pos.x - target.pos.x;
  var dy = src.pos.y - target.pos.y;
  var dist = Math.sqrt(dx*dx + dy*dy);
  return dist;
};

exports.angleTo = function(target, src) {
  return Math.atan2(target.pos.y - src.pos.y, target.pos.x - src.pos.x);
};

exports.angleToPoint = function(a) {
  return new Point({
    x: Math.cos(a),
    y: Math.sin(a)
  });
};

exports.pointToAngle = function(point) {
  return Math.atan2(point.y, point.x);
};
