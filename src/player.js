var css = require('../style.css');
var sprite = require('./sprite');

module.exports = Player;

function Player(game, data) {
  data = data || {};

  this.game = game;

  this.colors = data.colors || {
    't': `rgb(${Math.random() * 256 | 0}, ${Math.random() * 256 | 0}, ${Math.random() * 256 | 0})`,
    'p': `rgb(${Math.random() * 256 | 0}, ${Math.random() * 256 | 0}, ${Math.random() * 256 | 0})`,
  };

  Object.assign(this, sprite.create('player', this.colors));

  this.el.className = css.player;

  this.pos.x = this.px.x = data.pos ? data.pos.x : 300 + Math.random() * 200 | 0;
  this.pos.y = this.px.y = data.pos ? data.pos.y : 300 + Math.random() * 200 | 0;
  this.vel.x = data.vel ? data.vel.x : 0;
  this.vel.y = data.vel ? data.vel.y : 0;

  this.speed = 19;

  this.stadium = this.game.stadium;
  this.ball = this.game.ball;

  this.face = 'stand_down';
  this.faceDuration = 4;
  this.faceIndex = 0;
  this.faceNeedle = 0;
  this.faceMap = {
    '0,0': 'stand_down',
    '-1,0': 'run_left',
    '0,-1': 'run_up',
    '1,0': 'run_right',
    '0,1': 'run_down',
    '-1,-1': 'run_up_left',
    '1,-1': 'run_up_right',
    '-1,1': 'run_down_left',
    '1,1': 'run_down_right',
  };
  this.faceStandMap = {
    '0,0': 'stand_down',
    '-1,0': 'stand_left',
    '0,-1': 'stand_up',
    '1,0': 'stand_right',
    '0,1': 'stand_down',
    '-1,-1': 'stand_up_left',
    '1,-1': 'stand_up_right',
    '-1,1': 'stand_down_left',
    '1,1': 'stand_down_right',
  };
}

Player.prototype.move = function(x, y){
  this.vel.x |= x;
  this.vel.y |= y;
};

Player.prototype.collisionWith = function(target) {
  var dx = this.pos.x - target.pos.x
  var dy = this.pos.y - target.pos.y
  var dist = Math.sqrt(dx*dx + dy*dy);
  return dist;
};

Player.prototype.update = function() {
  this.angle = Math.atan2(this.vel.y, this.vel.x);
  this.face = this.faceMap[this.vel];
  this.faceStandMap['0,0'] =
  this.faceMap['0,0'] = this.faceStandMap[this.vel];

  var speed = this.speed;
  if (this.vel.x && this.vel.y) speed *= 0.75;

  var col = this.collisionWith(this.ball);
  if (col < 16) {
    var rand = 0.85 + Math.random() * 0.46;
    if (this.vel.x || this.vel.y) this.ball.vel.x = this.vel.x * speed * rand;
    if (this.vel.y || this.vel.x) this.ball.vel.y = this.vel.y * speed * rand;
  } else if (col < 26 && col >= 16) {
    this.ball.pos.x += (this.pos.x - this.ball.pos.x) * 0.19;
    this.ball.pos.y += (this.pos.y - this.ball.pos.y) * 0.19;
  }

  this.pos.x += this.vel.x * speed | 0;
  this.pos.y += this.vel.y * speed | 0;

  this.pos.x = Math.min(this.stadium.bounds[1].x, Math.max(this.pos.x, this.stadium.bounds[0].x));
  this.pos.y = Math.min(this.stadium.bounds[1].y, Math.max(this.pos.y, this.stadium.bounds[0].y));
};

Player.prototype.render = function(dt, alpha) {
  this.px.x += (this.pos.x - this.px.x) * alpha;
  this.px.y += (this.pos.y - this.px.y) * alpha;

  var i = this.faceIndex;
  var n = this.faceNeedle;
  n %= this.animation[this.face].length;

  var index = this.animation[this.face][n];
  var x = index[0] * this.width * this.scale;
  var y = index[1] ? this.height * this.scale + this.scale : 0;
  this.faceIndex = (i + 1) % this.faceDuration;
  if (this.faceIndex === 0) this.faceNeedle = n + 1;

  Object.assign(this.el.style, {
    left: this.px.x + 'px',
    top: this.px.y + 'px',
    backgroundPosition: `-${x}px -${y}px`,
  });
};
