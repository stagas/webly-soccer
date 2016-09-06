var css = require('../style.css');
var draw = require('../lib/draw');
var sprite = require('./sprite');

module.exports = Stadium;

function Stadium() {
  this.area = [
    { x: 300, y: 300 },
    { x: 2154 + 300, y: 1100 + 300 }
  ];

  var boundsMargin = 90;

  this.bounds = [
    { x: this.area[0].x - boundsMargin, y: this.area[0].y - boundsMargin },
    { x: this.area[1].x + boundsMargin, y: this.area[1].y + boundsMargin }
  ];

  this.el = document.createElement('div');
  this.el.className = css.stadium;

  this.debugCanvas = document.createElement('canvas');
  this.debugCanvas.className = css.stadium;
  this.debugCanvas.width = '2754';
  this.debugCanvas.height = '1700';
  this.debugCanvas.style.zIndex = 10000;

  // this.el.appendChild(this.debugCanvas);
  // var ctx = this.debugCanvas.getContext('2d');
  // ctx.strokeStyle = '#f00';
  // ctx.rect(246, 785, 303 - 246, 924 - 785);
  // ctx.rect(2457, 785, 303 - 246, 924 - 785);
  // ctx.stroke();

  this.leftGoalArea = {
    top: [{ x: 246, y: 785 }, { x: 303, y: 785 }],
    bottom: [{ x: 246, y: 924 }, { x: 303, y: 924 }],
    back: [{ x: 247, y: 784 }, { x: 247, y: 926 }],
    front: [{ x: 303, y: 784 }, { x: 303, y: 926 }],
  };

  this.rightGoalArea = {
    top: [{ x: 2457, y: 785 }, { x: 2513, y: 785 }],
    bottom: [{ x: 2457, y: 924 }, { x: 2513, y: 924 }],
    back: [{ x: 2513, y: 784 }, { x: 2513, y: 926 }],
    front: [{ x: 2457, y: 784 }, { x: 2457, y: 926 }],
  };

  draw.line(this.debugCanvas, this.leftGoalArea.top);
  draw.line(this.debugCanvas, this.leftGoalArea.back);
  draw.line(this.debugCanvas, this.leftGoalArea.front);
  draw.line(this.debugCanvas, this.leftGoalArea.bottom);

  draw.line(this.debugCanvas, this.rightGoalArea.top);
  draw.line(this.debugCanvas, this.rightGoalArea.back);
  draw.line(this.debugCanvas, this.rightGoalArea.front);
  draw.line(this.debugCanvas, this.rightGoalArea.bottom);

  draw.circle(this.debugCanvas, this.rightGoalArea.top[0], 3);

  var grass = createGrass();
  this.el.style.background = 'url(' + grass.toDataURL() + ') -60px 0px';

  this.pitch = document.createElement('div');
  this.pitch.className = css.pitch;
  this.el.appendChild(this.pitch);

  this.halfwayLine = document.createElement('div');
  this.halfwayLine.className = css['halfway-line'];
  this.pitch.appendChild(this.halfwayLine);

  this.centerCircle = createCenterCircle();
  this.centerCircle.className = css['center-circle'];
  this.pitch.appendChild(this.centerCircle);

  this.centerSpot = sprite.create('center_spot');
  this.centerSpot.el.className = css['center-spot'];
  this.pitch.appendChild(this.centerSpot.el);

  this.penaltyArcLeft = createCenterCircle({ x: 'Left', y: 'Top' }, 0.85, 5.43);
  this.penaltyArcLeft.className = css['penalty-arc-left'];
  this.pitch.appendChild(this.penaltyArcLeft);

  this.penaltySpotLeft = sprite.create('center_spot');
  this.penaltySpotLeft.el.className = css['penalty-spot-left'];
  this.pitch.appendChild(this.penaltySpotLeft.el);

  this.penaltyArcRight = createCenterCircle({ x: 'Right', y: 'Top' }, 4, 2.29);
  this.penaltyArcRight.className = css['penalty-arc-right'];
  this.pitch.appendChild(this.penaltyArcRight);

  this.penaltySpotRight = sprite.create('center_spot');
  this.penaltySpotRight.el.className = css['penalty-spot-right'];
  this.pitch.appendChild(this.penaltySpotRight.el);

  this.penaltyAreaLeft = document.createElement('div');
  this.penaltyAreaLeft.className = css['penalty-area-left'];
  this.pitch.appendChild(this.penaltyAreaLeft);

  this.penaltyAreaRight = document.createElement('div');
  this.penaltyAreaRight.className = css['penalty-area-right'];
  this.pitch.appendChild(this.penaltyAreaRight);

  this.goalAreaLeft = document.createElement('div');
  this.goalAreaLeft.className = css['goal-area-left'];
  this.pitch.appendChild(this.goalAreaLeft);

  this.goalAreaRight = document.createElement('div');
  this.goalAreaRight.className = css['goal-area-right'];
  this.pitch.appendChild(this.goalAreaRight);

  this.cornerArcTopLeft = createCenterCircle({ x: 'Left', y: 'Top' }, 0, 2 * Math.PI, 24);
  this.cornerArcTopLeft.className = css['corner-arc-top-left'];
  this.pitch.appendChild(this.cornerArcTopLeft);

  this.cornerArcBottomLeft = createCenterCircle({ x: 'Left', y: 'Bottom' }, 0, 2 * Math.PI, 24);
  this.cornerArcBottomLeft.className = css['corner-arc-bottom-left'];
  this.pitch.appendChild(this.cornerArcBottomLeft);

  this.cornerArcTopRight = createCenterCircle({ x: 'Right', y: 'Top' }, 0, 2 * Math.PI, 24);
  this.cornerArcTopRight.className = css['corner-arc-top-right'];
  this.pitch.appendChild(this.cornerArcTopRight);

  this.cornerArcBottomRight = createCenterCircle({ x: 'Right', y: 'Bottom' }, 0, 2 * Math.PI, 24);
  this.cornerArcBottomRight.className = css['corner-arc-bottom-right'];
  this.pitch.appendChild(this.cornerArcBottomRight);

  this.goalNetsLeft = sprite.create('goal_nets');
  this.goalNetsLeft.el.className = css['goal-nets-left'];
  this.el.appendChild(this.goalNetsLeft.el);

  this.goalNetsRight = sprite.create('goal_nets');
  this.goalNetsRight.el.className = css['goal-nets-right'];
  this.el.appendChild(this.goalNetsRight.el);
  this.goalNetsRight.el.style.backgroundPosition = '0 ' + (-(this.goalNetsRight.height * this.goalNetsRight.scale + 3)) + 'px';

  this.cornerFlagTopLeft = sprite.create('corner_flag');
  this.cornerFlagTopLeft.el.className = css['corner-flag-top-left'];
  this.el.appendChild(this.cornerFlagTopLeft.el);
  this.cornerFlagTopLeft.el.style.marginTop = -((this.cornerFlagTopLeft.height) * this.cornerFlagTopLeft.scale) + 'px';

  this.cornerFlagBottomLeft = sprite.create('corner_flag');
  this.cornerFlagBottomLeft.el.className = css['corner-flag-bottom-left'];
  this.el.appendChild(this.cornerFlagBottomLeft.el);
  // this.cornerFlagBottomLeft.el.style.marginTop = +(3 * this.cornerFlagBottomLeft.scale) + 'px';

  this.cornerFlagTopRight = sprite.create('corner_flag');
  this.cornerFlagTopRight.el.className = css['corner-flag-top-right'];
  this.el.appendChild(this.cornerFlagTopRight.el);
  this.cornerFlagTopRight.el.style.marginTop = -((this.cornerFlagTopRight.height) * this.cornerFlagTopRight.scale) + 'px';

  this.cornerFlagBottomRight = sprite.create('corner_flag');
  this.cornerFlagBottomRight.el.className = css['corner-flag-bottom-right'];
  this.el.appendChild(this.cornerFlagBottomRight.el);
  // this.cornerFlagBottomRight.el.style.marginTop = -((this.cornerFlagBottomRight.height) * this.cornerFlagBottomRight.scale) + 'px';
}

function createCenterCircle(side, a, b, c) {
  var canvas = document.createElement('canvas');
  canvas.width = canvas.height = c || 124;
  var context = canvas.getContext('2d');
  var centerX = canvas.width / 2;
  var centerY = canvas.height / 2;
  var radius = canvas.width / 2.4;

  context.imageSmoothingEnabled = false;

  context.beginPath();
  context.arc(centerX, centerY, radius, a || 0, b || (2 * Math.PI), true);
  context.lineWidth = 1;
  context.strokeStyle = '#fff';
  context.stroke();

  var png = document.createElement('img');
  png.src = canvas.toDataURL('image/png');

  var second = document.createElement('canvas');
  second.width = second.height = canvas.width * 3;
  second.style['margin' + (side ? side.x : 'Left')] = -(canvas.width * 3 / 2) + 'px';
  second.style['margin' + (side ? side.y : 'Top')] = -(canvas.width * 3 / 2) + 'px';
  var ctx = second.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(png, 0, 0, canvas.width * 3, canvas.height * 3);
  return second;
}

function createGrass() {
  var canvas = document.createElement('canvas');
  canvas.height = 60;
  canvas.width = canvas.height * 2;
  var context = canvas.getContext('2d');
  context.fillStyle = '#090';
  context.fillRect(0,0,canvas.width/2,canvas.height);
  context.fillStyle = '#080';
  context.fillRect(canvas.width/2,0,canvas.width/2,canvas.height);
  for (var i = 2500; i--;) {
    context.fillStyle = 'rgba(0,0,0,0.035)';
    var x = Math.random() * canvas.width | 0;
    var y = Math.random() * canvas.height | 0;
    context.fillRect(x,y,1,1);
  }
  for (var i = 500; i--;) {
    context.fillStyle = 'rgba(0,255,0,0.05)';
    var x = Math.random() * canvas.width | 0;
    var y = Math.random() * canvas.height | 0;
    context.fillRect(x,y,1,1);
  }

  var png = document.createElement('img');
  png.src = canvas.toDataURL('image/png');

  var second = document.createElement('canvas');
  second.width = canvas.width * 3;
  second.height = canvas.height * 3;
  var ctx = second.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(png, 0, 0, canvas.width * 3, canvas.height * 3);

  return second;
}
