
exports.angleToCoords = function angleToCoords(a) {
  return {
    x: Math.cos(a),
    y: Math.sin(a)
  };
};
