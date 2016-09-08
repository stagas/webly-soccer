var css = require('../style.css');
var math = require('../lib/math');
var Point = require('../lib/point');
var sprite = require('./sprite');

module.exports = Player;

function Player(game, data) {
  data = data || {};

  this.game = game;
  this.team = data.team;
  this.number = data.number || 0;

  this.colors = data.colors || {
    't': `rgb(${Math.random() * 256 | 0}, ${Math.random() * 256 | 0}, ${Math.random() * 256 | 0})`,
    'p': `rgb(${Math.random() * 256 | 0}, ${Math.random() * 256 | 0}, ${Math.random() * 256 | 0})`,
  };

  Object.assign(this, sprite.create('player', this.colors));

  this.el.className = css.player;

  this.pos.x = this.px.x = data.pos ? data.pos.x : 300 + Math.random() * 200 | 0;
  this.pos.y = this.px.y = data.pos ? data.pos.y : 200 + Math.random() * 200 | 0;
  this.vel.x = data.vel ? data.vel.x : 0;
  this.vel.y = data.vel ? data.vel.y : 0;

  this.stadium = this.game.stadium;
  this.ball = this.game.ball;

  this.nearBall = 26;
  this.touchBall = 16;
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

Player.prototype.setPosition = function(pos) {
  this.pos.x = this.px.x = pos.x + this.game.stadium.offset.x;
  this.pos.y = this.px.y = pos.y + this.game.stadium.offset.y;
};

Player.prototype.move = function(x, y){
  this.vel.x |= x;
  this.vel.y |= y;
};

Player.prototype.shoot = function() {
  this.shootTimer++;
};

Player.prototype.shootEnd = function() {
  if (this.shootTimer) {
    this.pass();
    this.shootTimer = 0;
  }
};

Player.prototype.pass = function() {
  if (this.distanceToBall < this.nearBall) {
    this.team.pass();
  }
  // console.log('should pass');
};

Player.prototype.maybeShoot = function() {
  if (this.shootTimer > 4) {
    this.actuallyShoot();
    this.shootTimer = 0;
  }
};

Player.prototype.actuallyShoot = function() {
  // console.log('should shoot');
  if (this.distanceToBall < this.nearBall) {
    this.ball.shoot(this);
  }
};

Player.prototype.update = function() {
  this.distanceToBall = math.distanceTo(this.ball, this);
  this.angleToBall = math.angleTo(this.ball, this);
  this.velToBall = math.angleToPoint(this.angleToBall);
  this.faceStandMap['0,0'] = this.faceMap['0,0'] = this.faceStandMap[this.velToBall.round()];

  var speed = this.speed;
  if (this.vel.x && this.vel.y) speed *= 0.75;

  // ai: go to ball
  if (!this.master) {
    if (this.distanceToBall < 200) {
      if (this.distanceToBall > 80 || this === this.team.closestToBall) {
        var velToBall = this.velToBall.round();
        this.vel.x = velToBall.x;
        this.vel.y = velToBall.y;
      }
    }
  }

  if (this.vel.x || this.vel.y) {
    this.angle = math.pointToAngle(this.vel);
  }

  this.face = this.faceMap[this.vel];

  // ball collision
  if (this.ball.pos.z <= this.pos.z + 12 * this.scale) {
    if (this.distanceToBall < this.touchBall) {
      // this.team.setMaster(this);
      var rand = 0.85 + Math.random() * 0.46;
      if (this.vel.x || this.vel.y) this.ball.vel.x = this.vel.x * speed * rand;
      if (this.vel.y || this.vel.x) this.ball.vel.y = this.vel.y * speed * rand;
    } else if (this.distanceToBall < this.nearBall && this.distanceToBall >= this.touchBall) {
      this.ball.vel.x += (this.pos.x - this.ball.pos.x) * 0.12;
      this.ball.vel.y += (this.pos.y - this.ball.pos.y) * 0.12;
    }
  }

  var pos = {
    x: this.pos.x + (this.vel.x * speed | 0),
    y: this.pos.y + (this.vel.y * speed | 0)
  };

  if (this.pos.x <= this.stadium.leftGoalArea.front[0].x) {
    if ( this.pos.x >= this.stadium.leftGoalArea.back[0].x
      && this.pos.y >= this.stadium.leftGoalArea.top[0].y
      && this.pos.y <= this.stadium.leftGoalArea.bottom[0].y ) {
      pos.x = Math.max(
          pos.x, this.stadium.leftGoalArea.back[0].x + 11
        +(pos.y < this.stadium.leftGoalArea.top[0].y + 12 ? 6 : 0)
      );
      pos.y = Math.min(
        Math.max(pos.y, this.stadium.leftGoalArea.back[0].y + 12),
        this.stadium.leftGoalArea.back[1].y - 7
      );
    } else if (
      this.pos.x < this.stadium.leftGoalArea.back[0].x
      && pos.x >= this.stadium.leftGoalArea.back[0].x
      && pos.y >= this.stadium.leftGoalArea.top[0].y
      && pos.y <= this.stadium.leftGoalArea.bottom[0].y ) {
      pos.x = Math.min(pos.x, this.stadium.leftGoalArea.back[0].x - 13);
    } else if (this.pos.x >= this.stadium.leftGoalArea.back[0].x) {
      if ( this.pos.y < this.stadium.leftGoalArea.top[0].y
        && pos.y >= this.stadium.leftGoalArea.top[0].y ) {
        pos.y = Math.min(pos.y, this.stadium.leftGoalArea.top[0].y - 4);
      } else if ( this.pos.y > this.stadium.leftGoalArea.bottom[0].y
        && pos.y <= this.stadium.leftGoalArea.bottom[0].y ) {
        pos.y = Math.max(pos.y, this.stadium.leftGoalArea.bottom[0].y + 4);
      }
    }
  }

  if (this.pos.x >= this.stadium.rightGoalArea.front[0].x) {
    if ( this.pos.x <= this.stadium.rightGoalArea.back[0].x
      && this.pos.y >= this.stadium.rightGoalArea.top[0].y
      && this.pos.y <= this.stadium.rightGoalArea.bottom[0].y ) {
      pos.x = Math.min(
          pos.x, this.stadium.rightGoalArea.back[0].x - 11
        -(pos.y < this.stadium.rightGoalArea.top[0].y + 12 ? 6 : 0)
      );
      pos.y = Math.min(
        Math.max(pos.y, this.stadium.rightGoalArea.back[0].y + 12),
        this.stadium.rightGoalArea.back[1].y - 7
      );
    } else if (
      this.pos.x > this.stadium.rightGoalArea.back[0].x
      && pos.x <= this.stadium.rightGoalArea.back[0].x
      && pos.y >= this.stadium.rightGoalArea.top[0].y
      && pos.y <= this.stadium.rightGoalArea.bottom[0].y ) {
      pos.x = Math.max(pos.x, this.stadium.rightGoalArea.back[0].x + 10);
    } else if (this.pos.x <= this.stadium.rightGoalArea.back[0].x) {
      if ( this.pos.y < this.stadium.rightGoalArea.top[0].y
        && pos.y >= this.stadium.rightGoalArea.top[0].y ) {
        pos.y = Math.min(pos.y, this.stadium.rightGoalArea.top[0].y - 4);
      } else if ( this.pos.y > this.stadium.rightGoalArea.bottom[0].y
        && pos.y <= this.stadium.rightGoalArea.bottom[0].y ) {
        pos.y = Math.max(pos.y, this.stadium.rightGoalArea.bottom[0].y + 4);
      }
    }
  }

  this.pos.x = pos.x;
  this.pos.y = pos.y;

  this.pos.x = Math.min(this.stadium.bounds[1].x, Math.max(this.pos.x, this.stadium.bounds[0].x));
  this.pos.y = Math.min(this.stadium.bounds[1].y, Math.max(this.pos.y, this.stadium.bounds[0].y));

  this.maybeShoot();
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
