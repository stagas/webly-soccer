
exports.line = function(canvas, line, color) {
  var ctx = canvas.getContext('2d');
  ctx.strokeStyle = color || '#f00';
  ctx.beginPath();
  ctx.moveTo(line[0].x, line[0].y);
  ctx.lineTo(line[1].x, line[1].y);
  ctx.stroke();
};

exports.circle = function(canvas, pos, radius, color) {
  var ctx = canvas.getContext('2d');
  ctx.strokeStyle = color || '#f00';
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI, false);
  ctx.stroke();
};
