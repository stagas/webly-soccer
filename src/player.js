var css = require('../style.css');
var math = require('../lib/math');
var Point = require('../lib/point');
var behavior = require('../lib/behavior-tree');
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

  this.nearBallDistance = 200;
  this.veryNearBallDistance = 120;
  this.touchBallDistance = 26;
  this.dribbleBallDistance = 16;
  this.formationInDistance = 400;

  this.speed = 19;
  this.shootTimer = 0;
  this.angle = 0;

  this.face = 'stand_down';
  this.facePos = new Point;
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

  this.makeBehaviors();
}

Player.prototype.setPosition = function(pos) {
  this.pos.x = this.px.x = pos.x + this.game.stadium.offset.x;
  this.pos.y = this.px.y = pos.y + this.game.stadium.offset.y;
};

Player.prototype.setFormation = function(pos) {
  this.formation = { pos: pos };
  this.setPosition(this.formation.pos);
};

Player.prototype.move = function(x, y){
  this.vel.x |= x;
  this.vel.y |= y;
};

Player.prototype.shoot = function() {
  this.shootTimer++;
  return true;
};

Player.prototype.shootEnd = function() {
  if (this.shootTimer) this.pass();
};

Player.prototype.pass = function() {
  this.team.pass();
  this.shootTimer = 0;
  return true;
};

Player.prototype.isPastShootThreshold = function() {
  return this.shootTimer > 4;
};

Player.prototype.actuallyShoot = function() {
  this.ball.shoot(this);
  this.shootTimer = 0;
  return true;
};

Player.prototype.isRunning = function() {
  return this.vel.x || this.vel.y;
};

Player.prototype.isTeamOwner = function() {
  return this.ball.owner ? this.ball.owner.team === this.team : false;
};

Player.prototype.isBallOwner = function() {
  return this.ball.owner === this;
};

Player.prototype.isMaster = function() {
  return this.team.master === this;
};

Player.prototype.isNearBall = function() {
  return this.distanceToBall < this.nearBallDistance;
};

Player.prototype.isVeryNearBall = function() {
  return this.distanceToBall < this.veryNearBallDistance;
};

Player.prototype.isTouchingBall = function() {
  return this.distanceToBall < this.touchBallDistance;
};

Player.prototype.isDribblingBall = function() {
  return this.distanceToBall < this.dribbleBallDistance;
};

Player.prototype.isBallBelowZ = function() {
  return this.ball.pos.z <= this.pos.z + 12 * this.scale;
};

Player.prototype.isInFormation = function() {
  return this.distanceToFormation < this.formationInDistance;
};

Player.prototype.runToBall = function() {
  var velToBall = this.velToBall.round();
  this.vel.x = velToBall.x;
  this.vel.y = velToBall.y;
  return true;
};

Player.prototype.runToFormation = function() {
  var velToFormation = this.velToFormation.round();
  this.vel.x = velToFormation.x;
  this.vel.y = velToFormation.y;
  return true;
};

Player.prototype.makeMaster = function() {
  this.team.setMaster(this);
};

Player.prototype.makeBallOwner = function() {
  this.ball.owner = this;
  this.ball.passing = false;
  this.ball.pos.x += (this.pos.x - this.ball.pos.x) * 0.8;
  this.ball.pos.y += (this.pos.y - this.ball.pos.y) * 0.8;
  return true;
};

Player.prototype.dribbleBall = function() {
  var rand = 0.86 + Math.random() * 0.46;
  this.ball.vel.x = this.vel.x * this.velSpeed * rand;
  this.ball.vel.y = this.vel.y * this.velSpeed * rand;
  return true;
};

Player.prototype.attractBall = function() {
  this.ball.pos.x += (this.pos.x - this.ball.pos.x) * 0.10;
  this.ball.pos.y += (this.pos.y - this.ball.pos.y) * 0.10;
  return true;
};

Player.prototype.isClosestToBall = function() {
  return this.team.closestToBall === this;
};

Player.prototype.isBallKicker = function() {
  return this.ball.kicker === this;
};

Player.prototype.stop = function() {
  this.vel.x = this.vel.y = 0;
  return true;
};

function log(s) {
  return function() {
    console.log(s);
    return true;
  };
}

Player.prototype.makeBehaviors = function() {
  var p = this;
  var _ = behavior;
  var not = _.not;
  var repeat = _.repeat;

  this.maybeShoot =
    _.sequence([
      p.isBallOwner,
      p.isTouchingBall,
      p.shoot,
      p.isPastShootThreshold,
      p.actuallyShoot,
    ]);

  // this.maybeGoBack =
  //   _.sequence([
  //     not(p.isMaster),
  //     repeat(_.sequence([
  //       not(p.isInFormation),
  //       p.runToFormation,
  //     ])),
  //     p.stop,
  //   ]);

  this.maybeRunToBall =
    _.sequence([
      not(p.isMaster),

      p.isClosestToBall,
      p.runToBall,

      p.isTeamOwner,
      p.isVeryNearBall,
      p.stop,
    ]);

  this.maybeDribble =
    _.sequence([
      // p.isMaster,

      p.isBallBelowZ,

      p.isTouchingBall,
      p.attractBall,
      p.makeMaster,

      not(p.isBallKicker),

      _.select([
        _.sequence([
          not(p.isBallOwner),
          p.makeBallOwner,
          p.dribbleBall,
        ]),

        _.sequence([
          p.isDribblingBall,
          p.dribbleBall,
        ]),
      ]),
    ]);
};

Player.prototype.updateBehaviors = function() {
  this.maybeDribble();
  // this.maybeGoBack();
  this.maybeRunToBall();
};

Player.prototype.updateCollisions = function() {
  var pos = this.newPos;

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

  this.pos.x = Math.min(this.stadium.bounds[1].x, Math.max(pos.x, this.stadium.bounds[0].x));
  this.pos.y = Math.min(this.stadium.bounds[1].y, Math.max(pos.y, this.stadium.bounds[0].y));
};

Player.prototype.updatePhysics = function() {
  this.distanceToBall = math.distanceTo(this.ball, this);
  this.angleToBall = math.angleTo(this.ball, this);
  this.velToBall = math.angleToPoint(this.angleToBall);

  this.distanceToFormation = math.distanceTo(this.formation, this);
  this.angleToFormation = math.distanceTo(this.formation, this);
  this.velToFormation = math.angleToPoint(this.angleToFormation);

  if (this.vel.x || this.vel.y) {
    this.angle = math.pointToAngle(this.vel);
  } else {
    this.angle = math.pointToAngle(this.velToBall.round());
  }

  this.velSpeed = this.speed;
  if (this.vel.x && this.vel.y) this.velSpeed *= 0.75;

  this.newPos.x = this.pos.x + (this.vel.x * this.velSpeed);
  this.newPos.y = this.pos.y + (this.vel.y * this.velSpeed);
};

Player.prototype.renderFaceAnimation = function() {
  this.faceStandMap['0,0'] = this.faceMap['0,0'] = this.faceStandMap[this.velToBall.round()];
  this.face = this.faceMap[this.vel];

  var i = this.faceIndex;
  var n = this.faceNeedle;
  n %= this.animation[this.face].length;

  var index = this.animation[this.face][n];
  this.facePos.x = index[0] * this.width * this.scale;
  this.facePos.y = index[1] ? this.height * this.scale + this.scale : 0;
  this.faceIndex = (i + 1) % this.faceDuration;
  if (this.faceIndex === 0) this.faceNeedle = n + 1;
};

Player.prototype.renderPosition = function(alpha) {
  this.px.x += (this.pos.x - this.px.x) * alpha;
  this.px.y += (this.pos.y - this.px.y) * alpha;
};

Player.prototype.renderDraw = function() {
  Object.assign(this.el.style, {
    left: this.px.x + 'px',
    top: this.px.y + 'px',
    backgroundPosition: `-${this.facePos.x}px -${this.facePos.y}px`,
  });
};

Player.prototype.update = function() {
  this.updatePhysics();
  this.updateBehaviors();
  this.updateCollisions();
};

Player.prototype.render = function(dt, alpha) {
  this.renderFaceAnimation();
  this.renderPosition(alpha);
  this.renderDraw();
};
