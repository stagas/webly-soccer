var css = require('../style.css');
var math = require('../lib/math');
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

  this.pos.x = this.px.x = data.pos ? data.pos.x : 2000 + Math.random() * 200 | 0;
  this.pos.y = this.px.y = data.pos ? data.pos.y : 600 + Math.random() * 200 | 0;
  this.vel.x = data.vel ? data.vel.x : 0;
  this.vel.y = data.vel ? data.vel.y : 0;

  this.stadium = this.game.stadium;
  this.ball = this.game.ball;

  this.speed = 19;
  this.shootTimer = 0;
  this.angle = 0;

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

Player.prototype.shoot = function() {
  this.shootTimer++;
  this.maybeShoot();
};

Player.prototype.shootEnd = function() {
  if (this.shootTimer) {
    this.pass();
    this.shootTimer = 0;
  }
};

Player.prototype.pass = function() {
  // console.log('should pass');
};

Player.prototype.maybeShoot = function() {
  if (this.shootTimer > 7) {
    this.actuallyShoot();
    this.shootTimer = 0;
  }
};

Player.prototype.actuallyShoot = function() {
  // console.log('should shoot');
  if (this.collisionWith(this.ball) < 26) {
    this.shooting = true;
  }
};

Player.prototype.collisionWith = function(target) {
  var dx = this.pos.x - target.pos.x
  var dy = this.pos.y - target.pos.y
  var dist = Math.sqrt(dx*dx + dy*dy);
  return dist;
};

Player.prototype.update = function() {
  if (this.vel.x || this.vel.y) {
    this.angle = Math.atan2(this.vel.y, this.vel.x);
  }

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

  if (this.shooting) {
    var vel = math.angleToCoords(this.angle);
    this.ball.vel.x = vel.x * 3 * speed;
    this.ball.vel.y = vel.y * 3 * speed;
    this.ball.vel.z = 10;
    this.shooting = false;
  }

  var pos = {
    x: this.pos.x + (this.vel.x * speed | 0),
    y: this.pos.y + (this.vel.y * speed | 0)
  };

  var point;

  point = math.rayLineIntersect([this.pos, pos], this.stadium.leftGoalArea.top);
  if (point) {
    pos.y = point.y;
    if (this.pos.y >= pos.y) {
      pos.y += 11;
    } else {
      pos.y -= 4;
    }
    // this.vel.y = 0;
    // this.vel.y = -this.vel.y;
    // this.vel.y *= 0.3;
  } else {
    point = math.rayLineIntersect([this.pos, pos], this.stadium.leftGoalArea.bottom);
    if (point) {
      pos.y = point.y;
      if (this.pos.y <= pos.y) {
        pos.y -= 6;
      } else {
        pos.y += 9;
      }
      // this.vel.y = 0;
      // this.vel.y = -this.vel.y;
      // this.vel.y *= 0.3;
    }
  }

  point = math.rayLineIntersect([this.pos, pos], this.stadium.rightGoalArea.top);
  if (point) {
    pos.y = point.y;
    if (this.pos.y >= pos.y) {
      pos.y += 11;
    } else {
      pos.y -= 4;
    }
    // this.vel.y = 0;
    this.vel.y = -this.vel.y;
    this.vel.y *= 0.3;
  } else {
    point = math.rayLineIntersect([this.pos, pos], this.stadium.rightGoalArea.bottom);
    if (point) {
      pos.y = point.y;
      if (this.pos.y <= pos.y) {
        pos.y -= 6;
      } else {
        pos.y += 9;
      }
      // this.vel.y = 0;
      // this.vel.y = -this.vel.y;
      // this.vel.y *= 0.3;
    }
  }

  point = math.rayLineIntersect([this.pos, pos], this.stadium.leftGoalArea.back);
  if (point) {
    pos.x = point.x;
    if (this.pos.x >= pos.x) {
      pos.x += 7;
    } else {
      pos.x -= 8;
    }
    // this.vel.x = 0;
    // this.vel.x = -this.vel.x;
    // this.vel.x *= 0.15;
  }

  point = math.rayLineIntersect([this.pos, pos], this.stadium.rightGoalArea.back);
  if (point) {
    pos.x = point.x;
    if (this.pos.x > pos.x) {
      pos.x += 7;
    } else {
      pos.x -= 8;
    }
    // this.vel.x = 0;
    // this.vel.x = -this.vel.x;
    // this.vel.x *= 0.15;
  }

  this.pos.x = pos.x;
  this.pos.y = pos.y;

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
