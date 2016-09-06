var math = require('../lib/math');
var Point = require('../lib/point');

module.exports = Camera;

function Camera(leader, follower) {
  this.leader = leader;
  this.follower = follower
  this.speed = 0.14;
  this.friction = 0.55;
  this.px = new Point;
  this.pos = new Point;
  this.vel = new Point;
  this.size = new Point;
  this.onresize();
  window.onresize = this.onresize.bind(this);
}

Camera.prototype.onresize = function() {
  this.size.x = window.innerWidth;
  this.size.y = window.innerHeight;
};

Camera.prototype.update = function() {
  var dx = (
    ( this.leader.pos.x + this.leader.width * this.leader.scale // / 2
    // + this.follower.pos.x + this.follower.width * this.follower.scale / 2
    ) // / 2
    - this.size.x / 2
  ) - this.pos.x;

  var dy = (
    ( this.leader.pos.y + this.leader.height * this.leader.scale // / 2
    // + this.follower.pos.y + this.follower.height * this.follower.scale / 2
    ) // / 2
    - this.size.y / 2
  ) - this.pos.y;

  if (Math.abs(dx) < 1) dx = 0;
  if (Math.abs(dy) < 1) dy = 0;

  this.vel.x += dx * this.speed;
  this.vel.y += dy * this.speed;

  this.pos.x += this.vel.x;
  this.pos.y += this.vel.y;

  this.vel.x *= this.friction;
  this.vel.y *= this.friction;
};

Camera.prototype.render = function(dt, alpha) {
  this.px.x += (this.pos.x - this.px.x) * alpha;
  this.px.y += (this.pos.y - this.px.y) * alpha;

  window.scrollTo(this.px.x, this.px.y);
};
