var geomCollision = require('geom-collision');
var rayVsLineSegment = require('ray-vs-line-segment');

exports.distance = function(a, b) {
  var dx = b.x - a.x
  var dy = b.y - a.y
  var dist = Math.sqrt(dx*dx + dy*dy);
  return dist;
};

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
      vel: exports.angleToCoords(Math.atan2(hit.y - pos.y, hit.x - pos.x))
    };
  } else {
    return null;
  }
}

exports.angleToCoords = function(a) {
  return {
    x: Math.cos(a),
    y: Math.sin(a)
  };
};
