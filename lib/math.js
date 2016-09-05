var rayVsLineSegment = require('ray-vs-line-segment');

exports.rayLineIntersect = function(a, b) {
  return rayVsLineSegment({
    start: a[0],
    end: a[1]
  }, {
    start: b[0],
    end: b[1]
  });
}

exports.angleToCoords = function angleToCoords(a) {
  return {
    x: Math.cos(a),
    y: Math.sin(a)
  };
};
