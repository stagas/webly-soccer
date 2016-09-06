var css = require('../style.css');
var math = require('../lib/math');
var sprite = require('./sprite');

module.exports = Ball;

function Ball(game) {
  Object.assign(this, sprite.create('ball'));
  this.game = game;
  this.stadium = this.game.stadium;
  this.el.className = css.ball;
  this.shadow = sprite.create('ball_shadow');
  this.shadow.el.className = css['ball-shadow'];
  this.friction = 0.91;
  this.airFriction = 0.95;
  this.gravity = 2.65;
  this.faceIndex = 0;
  this.faceNeedle = 0;
  this.faceDuration = 4;
  this.faceMap = new Array(this.sprite.length).fill(' ').map((_,i) => i);
  this.randomizeRotate();
  this.angle = 0;
  this.prev = { x: 500, y: 500 };
}

Ball.prototype.shoot = function(player) {
  this.shooting = 20;
  this.kicker = player;
  this.angle = this.kicker.angle;
};

Ball.prototype.update = function() {
  var dir = Math.sign(this.vel.x).toString() + Math.sign(this.vel.y).toString();
  if (dir !== this.dir) this.randomizeRotate();
  this.dir = dir;

  if (this.shooting) {
    var shotPower = this.kicker.speed;
    if (this.kicker.vel.x && this.kicker.vel.y) shotPower *= 0.75;

    shotPower = Math.max(0, this.shooting * shotPower * .045);
    if (this.shooting === 20) shotPower *= 3;

    var angleDiff = Math.abs(Math.atan2(
      Math.sin(this.kicker.angle-this.angle),
      Math.cos(this.kicker.angle-this.angle)
    ));

    var vel = math.angleToCoords(this.kicker.angle);

    if (angleDiff < Math.PI / 4) {
      this.vel.x += vel.x * shotPower * .4;
      this.vel.y += vel.y * shotPower * .4;
      this.vel.z += shotPower * .15;
    } else if (angleDiff < Math.PI / 2) {
      this.vel.x += vel.x * shotPower * .2;
      this.vel.y += vel.y * shotPower * .2;
      this.vel.z += shotPower * .2;
    } else {
      this.vel.x *= 1.07;
      this.vel.y *= 1.07;
      this.vel.x += vel.x * shotPower * .2;
      this.vel.y += vel.y * shotPower * .2;
      this.vel.z += shotPower * .3;
    }

    this.shooting--;
  } else {
    this.kicker = null;
  }

  this.angle = Math.atan2(this.vel.y, this.vel.x);

  var pos = {
    x: this.prev.x + (this.vel.x > 0 ? Math.min(50, this.vel.x) : Math.max(-50, this.vel.x)),
    y: this.prev.y + (this.vel.y > 0 ? Math.min(50, this.vel.y) : Math.max(-50, this.vel.y))
  };

  var point;

  point = math.rayLineIntersect([this.prev, pos], this.stadium.leftGoalArea.top);
  if (point) {
    pos.y = point.y;
    if (this.prev.y >= pos.y) {
      pos.y += 11;
    } else {
      pos.y -= 4;
    }
    // this.vel.y = 0;
    this.vel.y = -this.vel.y;
    this.vel.y *= 0.3;
  } else {
    point = math.rayLineIntersect([this.prev, pos], this.stadium.leftGoalArea.bottom);
    if (point) {
      pos.y = point.y;
      if (this.prev.y <= pos.y) {
        pos.y -= 6;
      } else {
        pos.y += 1;
      }
      // this.vel.y = 0;
      this.vel.y = -this.vel.y;
      this.vel.y *= 0.3;
    }
  }

  point = math.rayLineIntersect([this.prev, pos], this.stadium.rightGoalArea.top);
  if (point) {
    pos.y = point.y;
    if (this.prev.y >= pos.y) {
      pos.y += 11;
    } else {
      pos.y -= 4;
    }
    // this.vel.y = 0;
    this.vel.y = -this.vel.y;
    this.vel.y *= 0.3;
  } else {
    point = math.rayLineIntersect([this.prev, pos], this.stadium.rightGoalArea.bottom);
    if (point) {
      pos.y = point.y;
      if (this.prev.y <= pos.y) {
        pos.y -= 6;
      } else {
        pos.y += 1;
      }
      // this.vel.y = 0;
      this.vel.y = -this.vel.y;
      this.vel.y *= 0.3;
    }
  }

  point = math.rayLineIntersect([this.prev, pos], this.stadium.leftGoalArea.back);
  if (point) {
    pos.x = point.x;
    if (this.prev.x >= pos.x) {
      pos.x += 7;
    } else {
      pos.x -= 8;
    }
    // this.vel.x = 0;
    this.vel.x = -this.vel.x;
    this.vel.x *= 0.15;
  }

  point = math.rayLineIntersect([this.prev, pos], this.stadium.rightGoalArea.back);
  if (point) {
    pos.x = point.x;
    if (this.prev.x > pos.x) {
      pos.x += 7;
    } else {
      pos.x -= 8;
    }
    // this.vel.x = 0;
    this.vel.x = -this.vel.x;
    this.vel.x *= 0.15;
  }

  if (this.prev.x <= this.stadium.leftGoalArea.front[0].x) {
    if ( this.prev.x >= this.stadium.leftGoalArea.back[0].x
      && this.prev.y >= this.stadium.leftGoalArea.top[0].y
      && this.prev.y <= this.stadium.leftGoalArea.bottom[0].y ) {
      pos.x = Math.max(pos.x, this.stadium.leftGoalArea.back[0].x + 7);
      pos.y = Math.min(
        Math.max(pos.y, this.stadium.leftGoalArea.back[0].y + 3),
        this.stadium.leftGoalArea.back[1].y - 7
      );
    }
  }

  if (this.prev.x >= this.stadium.rightGoalArea.front[0].x) {
    if ( this.prev.x <= this.stadium.rightGoalArea.back[0].x
      && this.prev.y >= this.stadium.rightGoalArea.top[0].y
      && this.prev.y <= this.stadium.rightGoalArea.bottom[0].y ) {
      pos.x = Math.min(pos.x, this.stadium.rightGoalArea.back[0].x + 7);
      pos.y = Math.min(
        Math.max(pos.y, this.stadium.rightGoalArea.back[0].y + 3),
        this.stadium.rightGoalArea.back[1].y - 7
      );
    }
  }

  var hit = math.lineCircleCollision([this.prev, pos], this.stadium.leftGoalArea.top[1], 12)
    || math.lineCircleCollision([this.prev, pos], this.stadium.leftGoalArea.bottom[1], 12)
    || math.lineCircleCollision([this.prev, pos], this.stadium.rightGoalArea.top[0], 12)
    || math.lineCircleCollision([this.prev, pos], this.stadium.rightGoalArea.bottom[0], 12);

  if (hit) {
    var power = (Math.abs(this.vel.x) + Math.abs(this.vel.y)) / 2
    this.vel.x = hit.vel.x * power;
    this.vel.y = hit.vel.y * power;
    pos.x += ((hit.pos.x + hit.vel.x * 2) - pos.x) * .9;
  }

  this.pos.x = pos.x; //this.vel.x > 0 ? Math.min(50, this.vel.x) : Math.max(-50, this.vel.x);
  this.pos.y = pos.y; //this.vel.y > 0 ? Math.min(50, this.vel.y) : Math.max(-50, this.vel.y);

  this.pos.z += this.vel.z;

  this.pos.z = Math.round(this.pos.z);

  if (this.pos.x - 7 <= this.stadium.bounds[0].x) {
    this.pos.x = this.stadium.bounds[0].x + 7;
    this.vel.x = -this.vel.x;
  } else if (this.pos.x + 7 > this.stadium.bounds[1].x) {
    this.pos.x = this.stadium.bounds[1].x - 8;
    this.vel.x = -this.vel.x;
  }

  if (this.pos.y < this.stadium.bounds[0].y || this.pos.y > this.stadium.bounds[1].y) {
    this.vel.y = -this.vel.y;
  }

  if (this.pos.z < 0) {
    this.vel.z = -this.vel.z;
    this.vel.z *= 0.72;
  }

  // this.pos.x = Math.min(this.stadium.bounds[1].x, Math.max(this.pos.x, this.stadium.bounds[0].x));
  // this.pos.y = Math.min(this.stadium.bounds[1].y, Math.max(this.pos.y, this.stadium.bounds[0].y));
  this.pos.z = Math.max(0, this.pos.z);

  this.vel.x *= this.pos.z > 1 ? this.airFriction : this.friction;
  this.vel.y *= this.pos.z > 1 ? this.airFriction : this.friction;
  this.vel.z -= this.gravity;

  var avx = Math.abs(this.vel.x);
  var avy = Math.abs(this.vel.y);

  this.faceDuration = 5;
  if (avx < 4 && avy < 4) this.faceDuration = 8;
  if (avx >= 7 && avy >= 7) this.faceDuration = 3;

  if (avx < 1) this.vel.x = 0;
  if (avy < 1) this.vel.y = 0;

  this.prev.x = this.pos.x;
  this.prev.y = this.pos.y;
};

Ball.prototype.randomizeRotate = function() {
  this.faceMap.sort(() => Math.random() - 0.5);
};

Ball.prototype.render = function(dt, alpha) {
  this.px.x += (this.pos.x - this.px.x) * alpha;
  this.px.y += (this.pos.y - this.px.y) * alpha;
  this.px.z += (this.pos.z - this.px.z) * alpha;

  var i = this.faceIndex;
  var n = this.faceNeedle;
  n %= this.sprite.length;

  var x = this.faceMap[n] * this.width * this.scale;
  this.faceIndex = (i + 1) % this.faceDuration;

  if (this.faceIndex === 0 && (this.vel.x || this.vel.y)) this.faceNeedle = n + 1;

  Object.assign(this.el.style, {
    left: this.px.x + 'px',
    top: (this.px.y - this.px.z) + 'px',
    backgroundPosition: `-${x}px -0px`,
  });

  Object.assign(this.shadow.el.style, {
    left: (this.px.x + this.px.z / 2) + 1 * this.scale + 'px',
    top: (this.px.y + this.px.z / 3) + 2 * this.scale + 'px',
  });
};
