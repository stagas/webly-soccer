var lineCircleCollision = require('line-circle-collision');
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
  var circle = [pos.x, pos.y];
  var a = [line[0].x, line[0].y];
  var b = [line[1].x, line[1].y];
  var hit = [0,0];
  if (lineCircleCollision(a, b, circle, radius, hit)) {
    return {
      pos: { x: hit[0], y: hit[1] },
      vel: exports.angleToCoords(Math.atan2(hit[1] - pos.y, hit[0] - pos.x))
    };
  }
  else return null;
};

exports.angleToCoords = function(a) {
  return {
    x: Math.cos(a),
    y: Math.sin(a)
  };
};
