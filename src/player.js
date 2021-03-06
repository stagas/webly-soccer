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

  this.shadow = sprite.create('player_shadow');
  this.shadow.el.className = css['player-shadow'];

  this.pos.x = this.px.x = data.pos ? data.pos.x : 300 + Math.random() * 200 | 0;
  this.pos.y = this.px.y = data.pos ? data.pos.y : 200 + Math.random() * 200 | 0;
  this.vel.x = data.vel ? data.vel.x : 0;
  this.vel.y = data.vel ? data.vel.y : 0;

  this.stadium = this.game.stadium;
  this.ball = this.game.ball;

  this.nearBallDistance = 200;
  this.veryNearBallDistance = 150;
  this.touchBallDistance = 28;
  this.dribbleBallDistance = 16;
  this.formationInDistance = 100;

  this.gravity = 2.65;
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
  this.pos.x = this.px.x = pos.x;
  this.pos.y = this.px.y = pos.y;
};

Player.prototype.setFormation = function(pos) {
  this.formation = { pos: new Point(pos) };
  this.setPosition(this.formation.pos);
};

Player.prototype.controls = function() {
  var k = this.game.keys;
  this.vel.x = this.vel.y = 0;
  k & k.left  && this.move(-1,0);
  k & k.up    && this.move(0,-1);
  k & k.right && this.move(1,0);
  k & k.down  && this.move(0,1);
  k & k.shoot ? this.maybeShoot() : this.shootEnd();
  return true;
}

Player.prototype.move = function(x, y){
  this.vel.x |= x;
  this.vel.y |= y;
};

Player.prototype.shoot = function() {
  this.shootTimer += 1;
  return true;
};

Player.prototype.pass = function() {
  this.team.pass();
  this.shootTimer = 0;
  return true;
};

Player.prototype.isShooting = function() {
  return this.shootTimer > 0;
};

Player.prototype.isPastShootThreshold = function() {
  return this.shootTimer > 3;
};

Player.prototype.actuallyShoot = function() {
  this.ball.shoot(this);
  this.shootTimer = 0;
  return true;
};

Player.prototype.isRunning = function() {
  return this.vel.x || this.vel.y;
};

Player.prototype.isGoalkeeper = function() {
  return this.number === 0;
};

Player.prototype.isTeamOwner = function() {
  return this.ball.owner && this.ball.owner.team === this.team;
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
  var velToBall = this.velToBall; //.round();
  this.vel.x = velToBall.x;
  this.vel.y = velToBall.y;
  return true;
};

Player.prototype.runToFormation = function() {
  var velToFormation = this.velToFormation;
  this.vel.x = velToFormation.x;
  this.vel.y = velToFormation.y;
  return true;
};

Player.prototype.makeMaster = function() {
  this.team.setMaster(this);
};

Player.prototype.makeBallOwner = function() {
  this.ball.owner = this;
  this.ball.pos.x += (this.pos.x - this.ball.pos.x) * 0.8;
  this.ball.pos.y += (this.pos.y - this.ball.pos.y) * 0.8;
  return true;
};

Player.prototype.holdBall = function() {
  var arms = math.angleToPoint(this.angle);

  this.ball.vel.x = 0;
  this.ball.vel.y = 0;
  this.ball.vel.z = 0;
  this.ball.pos.x = this.newPos.x + arms.x * 9;
  this.ball.pos.y = this.newPos.y + arms.y * 3;
  this.ball.pos.z = this.newPos.z > 1 ? this.newPos.z : 9;
  return true;
};

Player.prototype.dribbleBall = function() {
  var rand = 0.86 + Math.random() * 0.46;
  this.ball.vel.x = this.vel.x * this.velSpeed * rand;
  this.ball.vel.y = this.vel.y * this.velSpeed * rand;
  this.ball.vel.z *= 0.8;
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

Player.prototype.isClosestToBallPrediction = function() {
  return this.team.closestToBallPrediction === this;
};

Player.prototype.isBallKicker = function() {
  return this.ball.kicker === this;
};

Player.prototype.stop = function() {
  this.vel.x = this.vel.y = 0;
  return true;
};

Player.prototype.isJumping = function() {
  return this.pos.z > 0 || this.jumping;
};

Player.prototype.isBallInArea = function() {
  return this.ball.prediction.pos.isInside(this.stadium.leftPenaltyArea);
};

Player.prototype.jumpToBall = function() {
  this.jumping = 20;
  this.vel.x = this.velToBall.x * Math.min(40, Math.abs(this.ball.prediction.pos.x - this.pos.x) * .45);
  this.vel.y = this.velToBall.y * Math.min(40, Math.abs(this.ball.prediction.pos.y - this.pos.y) * .45);
  this.vel.z = 10
  return true;
};

Player.prototype.isBallFast = function() {
  return Math.abs(this.ball.vel.x) + Math.abs(this.ball.vel.y) > 35;
};

Player.prototype.waitToDrop = function() {
  // this.newPos.z = 1;
  // this.newPos.x += (this.ball.prediction.pos.x - this.newPos.x) * .2;
  // this.newPos.y += (this.ball.prediction.pos.y - this.newPos.y) * .2;
  this.vel.x *= 0.8;
  this.vel.y *= 0.8;
  if (this.isTouchingBall() && this.isBallBelowZ()) {
    this.makeMaster();
    this.makeBallOwner();
    this.holdBall();
  }
  if (--this.jumping) return null;
  else return true;
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

  this.maybeDribble =
    _.sequence([
      _.not(p.isBallKicker),
      p.isMaster,
      p.isBallBelowZ,
      p.isTouchingBall,
      p.attractBall,
      p.makeBallOwner,
      p.isDribblingBall,
      p.dribbleBall,
    ]);

  this.goalKeeperWalkWithBall =
    _.sequence([
      p.isTouchingBall,
      p.makeBallOwner,
      p.makeMaster,
      _.select([
        _.sequence([
          p.isBallInArea,
          p.holdBall,
        ]),
        p.maybeDribble,
      ]),
      p.controls,
    ]);

  this.goalKeeperMaybeJump =
    _.select([
      _.sequence([
        _.not(p.isBallOwner),
        _.not(p.isTouchingBall),
        p.isNearBall,
        p.isBallInArea,
        p.isBallFast,
        p.jumpToBall,
        p.waitToDrop,
      ]),
      // _.sequence([
      //   p.isBallOwner,
      //   p.maybeDribble,
      //   p.controls,
      // ]),
      _.sequence([
        _.not(p.isBallOwner),
        _.not(p.isTouchingBall),
        p.isBallInArea,
        p.runToBall,
      ]),
    ]);

  this.goalKeeper =
    _.sequence([
      p.isGoalkeeper,
      _.not(p.isBallKicker),
      _.select([
        p.goalKeeperMaybeJump,
        p.goalKeeperWalkWithBall,
      ]),
    ]);

  this.shootEnd =
    _.sequence([
      p.isShooting,
      _.not(p.isPastShootThreshold),
      p.isBallBelowZ,
      p.isTouchingBall,
      p.pass,
    ]);

  this.maybeShoot =
    _.sequence([
      p.isBallBelowZ,
      p.isBallOwner,
      p.isDribblingBall,
      p.shoot,
      p.isPastShootThreshold,
      p.actuallyShoot,
    ]);

  this.maybeRunToBall =
    _.sequence([
      _.not(p.isMaster),
      // _.not(p.isGoalkeeper),

      _.select([
        _.sequence([
          p.isClosestToBallPrediction,

          _.repeat(_.sequence([
            _.not(p.isDribblingBall),
            _.not(p.isTeamOwner),
            p.runToBall,
          ])),

          // p.isTeamOwner,
          _.not(p.isGoalkeeper),
          p.isVeryNearBall,
          p.stop,
        ]),

        _.sequence([
          _.repeat(_.sequence([
            _.select([
              _.sequence([
                p.isGoalkeeper,
                _.not(p.isInFormation),
                p.runToFormation,
              ]),
              _.sequence([
                _.not(p.isInFormation),
                _.not(p.isNearBall),
                p.runToFormation,
              ]),
            ]),
          ])),
          p.stop,
        ]),

        p.stop,
      ])
    ]);

  this.maybeControl =
    _.sequence([
      p.isMaster,
      p.controls,
    ]);

  this.maybeMakeMaster =
    _.sequence([
      _.not(p.isMaster),
      _.not(p.isTeamOwner),
      _.not(p.isBallKicker),
      p.isBallBelowZ,
      p.isTouchingBall,
      p.attractBall,
      p.makeMaster,
      p.makeBallOwner,
      p.dribbleBall,
    ]);

  this.runBehaviors =
    _.select([
      p.goalKeeper,
      _.all([
        p.maybeMakeMaster,
        p.maybeDribble,
        p.maybeRunToBall,
        p.maybeControl
      ]),
    ]);
};

Player.prototype.updateBehaviors = function() {
  this.runBehaviors();
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
  this.pos.z = Math.max(0, pos.z);
  if (!this.isJumping()) {
    this.vel.x = this.vel.x > 0 ? Math.min(1, this.vel.x) : Math.max(-1, this.vel.x);
    this.vel.y = this.vel.y > 0 ? Math.min(1, this.vel.y) : Math.max(-1, this.vel.y);
  }
};


Player.prototype.updatePhysics = function() {
  this.distanceToBallPrediction = math.distanceTo(this.ball.prediction, this);
  this.distanceToBall = math.distanceTo(this.ball, this);
  this.angleToBall = math.angleTo(this.ball.prediction, this);
  this.velToBall = math.angleToPoint(this.angleToBall);

  this.tacticsFormation = {
    pos: this.isGoalkeeper() ? new Point(this.formation.pos) : this.formation.pos.lerp(this.ball.prediction.pos, 0.2)
  };
  if (this.ball.pos.x > (this.stadium.offset.x + this.stadium.size.x / 2)) {
    this.tacticsFormation.pos.x += 150;
  }
  this.distanceToFormation = math.distanceTo(this.tacticsFormation, this);
  this.angleToFormation = math.angleTo(this.tacticsFormation, this);
  this.velToFormation = math.angleToPoint(this.angleToFormation);

  if (this.isRunning()) {
    this.angle = math.pointToAngle(this.vel);
  } else {
    this.angle = math.pointToAngle(this.velToBall.round());
  }

  this.velSpeed = this.speed;
  if (this.vel.round().x && this.vel.round().y) this.velSpeed *= 0.75;

  if (this.isJumping()) this.velSpeed = 1;

  this.newPos.x = this.pos.x + (this.vel.x * this.velSpeed);
  this.newPos.y = this.pos.y + (this.vel.y * this.velSpeed);
  this.newPos.z = this.pos.z + this.vel.z;

  this.vel.z -= this.gravity;
};

Player.prototype.renderFaceAnimation = function() {
  if (this.isJumping() && this.isGoalkeeper()) {
    if (Math.abs(this.vel.x) > Math.abs(this.vel.y)) {
      if (this.vel.x < 0) this.face = 'keeper_jump_left';
      else this.face = 'keeper_jump_right';
    } else {
      if (this.vel.y < 0) this.face = 'keeper_jump_up';
      else this.face = 'keeper_jump_down';
    }
  } else {
    this.faceStandMap['0,0'] = this.faceMap['0,0'] =
    this.faceStandMap[this.velToBall.round()];
    this.face = this.faceMap[this.vel.round()];
  }

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
  this.px.z += (this.pos.z - this.px.z) * alpha;
};

Player.prototype.renderDraw = function() {
  Object.assign(this.el.style, {
    left: this.px.x + 'px',
    top: (this.px.y - this.px.z) + 'px',
    backgroundPosition: `-${this.facePos.x}px -${this.facePos.y}px`,
  });

  Object.assign(this.shadow.el.style, {
    left: this.px.x + 'px',
    top: (this.px.y + this.px.z) + 'px',
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
