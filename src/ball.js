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

  this.gravity = 2.65;
  this.friction = 0.91;
  this.airFriction = 0.935;
  this.shotDuration = 10;

  this.faceIndex = 0;
  this.faceNeedle = 0;
  this.faceDuration = 4;
  this.faceMap = new Array(this.sprite.length).fill(' ').map((_,i) => i);
}

Ball.prototype.randomizeRotation = function() {
  this.faceMap.sort(() => Math.random() - 0.5);
};

Ball.prototype.shoot = function(player) {
  this.shooting = 10;
  this.kicker = player;
  this.angle = this.kicker.angle;
};

Ball.prototype.updateCollisions = function() {
  var pos = {
    x: this.pos.x + (this.vel.x > 0 ? Math.min(50, this.vel.x) : Math.max(-50, this.vel.x)),
    y: this.pos.y + (this.vel.y > 0 ? Math.min(50, this.vel.y) : Math.max(-50, this.vel.y)),
    z: this.pos.z + this.vel.z
  };

  var netsHeight = 12 * this.scale;
  var isBelowGoalNetsHeight = this.pos.z <= netsHeight;
  if (isBelowGoalNetsHeight) {
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
      this.vel.y = -this.vel.y;
      this.vel.y *= 0.3;
    } else {
      point = math.rayLineIntersect([this.pos, pos], this.stadium.leftGoalArea.bottom);
      if (point) {
        pos.y = point.y;
        if (this.pos.y <= pos.y) {
          pos.y -= 6;
        } else {
          pos.y += 1;
        }
        // this.vel.y = 0;
        this.vel.y = -this.vel.y;
        this.vel.y *= 0.3;
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
          pos.y += 1;
        }
        // this.vel.y = 0;
        this.vel.y = -this.vel.y;
        this.vel.y *= 0.3;
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
      this.vel.x = -this.vel.x;
      this.vel.x *= 0.15;
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
      this.vel.x = -this.vel.x;
      this.vel.x *= 0.15;
    }

    var hit = math.lineCircleCollision([this.pos, pos], this.stadium.leftGoalArea.top[1], 9)
      || math.lineCircleCollision([this.pos, pos], this.stadium.leftGoalArea.bottom[1], 9)
      || math.lineCircleCollision([this.pos, pos], this.stadium.rightGoalArea.top[0], 9)
      || math.lineCircleCollision([this.pos, pos], this.stadium.rightGoalArea.bottom[0], 9);

    if (hit) {
      var power = (Math.abs(this.vel.x) + Math.abs(this.vel.y)) / 2
      this.vel.x = hit.vel.x * power;
      this.vel.y = hit.vel.y * power;
      pos.x = hit.pos.x + hit.vel.x;
      pos.y = hit.pos.y + hit.vel.y;
      this.shooting = 0;
    }
  }

  if (this.pos.x <= this.stadium.leftGoalArea.front[0].x) {
    if ( this.pos.x >= this.stadium.leftGoalArea.back[0].x
      && this.pos.y >= this.stadium.leftGoalArea.top[0].y
      && this.pos.y <= this.stadium.leftGoalArea.bottom[0].y ) {
      if (isBelowGoalNetsHeight) {
        pos.x = Math.max(pos.x, this.stadium.leftGoalArea.back[0].x + 7);
        pos.y = Math.min(
          Math.max(pos.y, this.stadium.leftGoalArea.back[0].y + 3),
          this.stadium.leftGoalArea.back[1].y - 7
        );
        if (pos.z >= netsHeight) {
          pos.z = netsHeight;
          this.vel.z = -this.vel.z;
        }
      } else if (pos.z <= netsHeight) {
        pos.z = netsHeight + 1;
        pos.x -= 2;
        this.vel.x *= 0.9;
        this.vel.y *= 0.9;
        this.vel.z = 0;
      }
    }
    this.shooting = 0;
  }

  if (this.pos.x >= this.stadium.rightGoalArea.front[0].x) {
    if ( this.pos.x <= this.stadium.rightGoalArea.back[0].x
      && this.pos.y >= this.stadium.rightGoalArea.top[0].y
      && this.pos.y <= this.stadium.rightGoalArea.bottom[0].y ) {
      if (isBelowGoalNetsHeight) {
        pos.x = Math.min(pos.x, this.stadium.rightGoalArea.back[0].x + 7);
        pos.y = Math.min(
          Math.max(pos.y, this.stadium.rightGoalArea.back[0].y + 3),
          this.stadium.rightGoalArea.back[1].y - 7
        );
        if (pos.z >= netsHeight) {
          pos.z = netsHeight;
          this.vel.z = -this.vel.z;
          // this.vel.z = 0;
        }
      } else if (pos.z <= netsHeight) {
        pos.z = netsHeight + 1;
        pos.x += 2;
        this.vel.x *= 0.9;
        this.vel.y *= 0.9;
        this.vel.z = 0;
      }
    }
    this.shooting = 0;
  }

  if ( this.pos.y >= this.stadium.leftGoalArea.top[0].y
    && this.pos.y <= this.stadium.leftGoalArea.bottom[0].y ) {

    var hit = math.lineCircleCollision(
      [{ x: this.pos.x, y: this.pos.z }, { x: pos.x, y: pos.z }],
      { x: this.stadium.leftGoalArea.front[0].x, y: netsHeight }, 9
    ) || math.lineCircleCollision(
      [{ x: this.pos.x, y: this.pos.z }, { x: pos.x, y: pos.z }],
      { x: this.stadium.rightGoalArea.front[0].x, y: netsHeight }, 9
    );

    if (hit) {
      var power = (Math.abs(this.vel.x) + Math.abs(this.vel.z)) / 2;
      this.vel.x = hit.vel.x * power;
      this.vel.z = hit.vel.y * power;
      pos.x = hit.pos.x + hit.vel.x;
      pos.z = hit.pos.y + hit.vel.y;
      this.shooting = 0;
    }
  }

  if (pos.x - 7 <= this.stadium.bounds[0].x) {
    pos.x = this.stadium.bounds[0].x + 7;
    this.vel.x = -this.vel.x;
    this.shooting = 0;
  } else if (pos.x + 7 > this.stadium.bounds[1].x) {
    pos.x = this.stadium.bounds[1].x - 8;
    this.vel.x = -this.vel.x;
    this.shooting = 0;
  }

  if (pos.y < this.stadium.bounds[0].y || pos.y > this.stadium.bounds[1].y) {
    this.vel.y = -this.vel.y;
  }

  if (pos.z < 0) {
    this.vel.z = -this.vel.z;
    this.vel.z *= 0.72;
  }

  pos.x = Math.min(this.stadium.bounds[1].x, Math.max(pos.x, this.stadium.bounds[0].x));
  pos.y = Math.min(this.stadium.bounds[1].y, Math.max(pos.y, this.stadium.bounds[0].y));
  pos.z = Math.max(0, pos.z);

  this.pos.x = pos.x;
  this.pos.y = pos.y;
  this.pos.z = pos.z;
};

Ball.prototype.updatePhysics = function() {
  this.angle = math.pointToAngle(this.vel);
  this.vel.x *= this.pos.z > 1 ? this.airFriction : this.friction;
  this.vel.y *= this.pos.z > 1 ? this.airFriction : this.friction;
  this.vel.z -= this.gravity;
  var absVel = this.vel.abs();
  if (absVel.x < 1) this.vel.x = 0;
  if (absVel.y < 1) this.vel.y = 0;
};

Ball.prototype.updateShot = function() {
  if (this.shooting) {
    var shotPower = this.kicker.speed;
    if (this.kicker.vel.x && this.kicker.vel.y) shotPower *= 0.75;

    shotPower = Math.max(0, this.shooting * shotPower * .15);
    if (this.shooting === this.shotDuration) shotPower *= 2;

    var angleDiff = Math.abs(Math.atan2(
      Math.sin(this.kicker.angle-this.angle),
      Math.cos(this.kicker.angle-this.angle)
    ));

    if (this.kicker.vel.x || this.kicker.vel.y) {
      var vel = math.angleToPoint(this.kicker.angle);
      if (angleDiff < Math.PI / 5) {
        this.vel.x += vel.x * shotPower * .6;
        this.vel.y += vel.y * shotPower * .6;
        this.vel.z += shotPower * .11;
      } else if (angleDiff < Math.PI / 2) {
        // this.vel.x *= 1.02;
        // this.vel.y *= 1.02;
        this.vel.x += vel.x * shotPower * .24;
        this.vel.y += vel.y * shotPower * .24;
        this.vel.z += shotPower * .2;
      } else if (angleDiff > Math.PI - 0.1) {
        this.vel.x *= 1.094;
        this.vel.y *= 1.094;
        this.vel.z += shotPower * .29;
      } else {
        this.vel.x *= 1.08;
        this.vel.y *= 1.08;
        this.vel.x += vel.x * shotPower * .28;
        this.vel.y += vel.y * shotPower * .28;
        this.vel.z += shotPower * .3;
      }
    }

    this.shooting--;
  } else {
    this.kicker = null;
  }
};

Ball.prototype.renderRotationAnimation = function() {
  var rotation = this.vel.sign().toString();
  if (rotation !== this.rotation) this.randomizeRotation();
  this.rotation = rotation;
  this.faceDuration = 5;
  var absVel = this.vel.abs();
  if (absVel.x < 4 && absVel.y < 4) this.faceDuration = 8;
  if (absVel.x >= 7 && absVel.y >= 7) this.faceDuration = 3;
};

Ball.prototype.renderFaceAnimation = function() {
  var i = this.faceIndex;
  var n = this.faceNeedle;
  n %= this.sprite.length;

  this.facePos = this.faceMap[n] * this.width * this.scale;
  this.faceIndex = (i + 1) % this.faceDuration;

  if (this.faceIndex === 0 && (this.vel.x || this.vel.y)) this.faceNeedle = n + 1;
};


Ball.prototype.renderPosition = function(alpha) {
  this.px.x += (this.pos.x - this.px.x) * alpha;
  this.px.y += (this.pos.y - this.px.y) * alpha;
  this.px.z += (this.pos.z - this.px.z) * alpha;

  Object.assign(this.el.style, {
    left: this.px.x + 'px',
    top: (this.px.y - this.px.z) + 'px',
    backgroundPosition: `-${this.facePos}px -0px`,
  });

  Object.assign(this.shadow.el.style, {
    left: (this.px.x + this.px.z / 2) + 1 * this.scale + 'px',
    top: (this.px.y + this.px.z / 3) + 2 * this.scale + 'px',
  });
};

Ball.prototype.update = function() {
  this.updateShot();
  this.updateCollisions();
  this.updatePhysics();
};

Ball.prototype.render = function(dt, alpha) {
  this.renderRotationAnimation();
  this.renderFaceAnimation();
  this.renderPosition(alpha);
};
