var css = require('../style.css');
var math = require('../lib/math');
var Player = require('./player');

module.exports = Team;

function Team(game, data) {
  data = data || {};
  this.el = document.createElement('div');
  this.game = game;
  this.ball = this.game.ball;
  this.stadium = this.game.stadium;
  this.colors = data.colors || this.randomColors();
  this.createPlayers();
  this.master = null;
  this.setMaster(this.players[0]);
  this.setFormation(data.formation || '4-4-2');
  this.placeFormation();
}

Team.prototype.createPlayers = function() {
  this.players = [];
  for (var i = 0; i < 11; i++) {
    var player = new Player(this.game, { team: this, colors: this.colors, number: i });
    this.players.push(player);
    this.el.appendChild(player.el);
  }
};

Team.prototype.pass = function() {
  var closest = this.getPlayerInFront();
  if (!closest) closest = this.getPlayerClosestToBall(this.master);
  var vel = closest.velToBall.inverse();
  this.ball.pass(this.master, closest);
  this.ball.vel.x = vel.x * closest.distanceToBall * .1;
  this.ball.vel.y = vel.y * closest.distanceToBall * .1;
};

Team.prototype.getPlayerInFront = function() {
  var players = [];
  for (var i = 0; i < this.players.length; i++) {
    if (this.players[i] === this.master) continue;
    var angle = math.angleTo(this.players[i], this.master);
    var diff = math.angleDiff(this.master.angle, angle);
    if (diff < Math.PI / 3) {
      players.push(this.players[i]);
    }
  }
  if (!players.length) return null;
  else return players.sort((a, b) => a.distanceToBall - b.distanceToBall)[0];
};

Team.prototype.getPlayerClosestToBall = function(ref) {
  return this.players
    .slice()
    .filter(player => player !== ref)
    .sort((a, b) => a.distanceToBall - b.distanceToBall)[0];
};

Team.prototype.setMaster = function(player) {
  if (this.master) {
    this.master.master = false;
    this.master.el.classList.remove(css.master);
  }
  this.master = player;
  this.master.el.classList.add(css.master);
  this.master.master = true;
};

Team.prototype.setFormation = function(formation) {
  this.formation = Formation[formation];
};

Team.prototype.placeFormation = function() {
  var rowHeight = this.stadium.size.y / this.formation.length;
  var colWidth = this.stadium.size.x / this.formation[0].length;

  this.formation.forEach((row, y) => {
    row.forEach((col, x) => {
      if (col) {
        this.players[col - 1].setFormation({
          x: x * colWidth + colWidth / 2,
          y: y * rowHeight + rowHeight / 2
        });
      }
    });
  });
};

Team.prototype.randomColors = function() {
  return {
    't': `rgb(${Math.random() * 256 | 0}, ${Math.random() * 256 | 0}, ${Math.random() * 256 | 0})`,
    'p': `rgb(${Math.random() * 256 | 0}, ${Math.random() * 256 | 0}, ${Math.random() * 256 | 0})`,
  };
};

Team.prototype.update = function() {
  this.closestToBall = this.getPlayerClosestToBall();
  this.players.forEach(player => player.update());
};

Team.prototype.render = function(dt, alpha) {
  this.players.forEach(player => player.render(dt, alpha));
};

var Formation = {};
Formation['4-4-2'] = [
  [0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0],
  [0, 0, 0, 4, 0, 0,  0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 8,  0, 0, 0, 0, 0, 0],
  [0, 0, 2, 0, 0, 0,  0,10, 0, 0, 0, 0],
  [0, 0, 0, 0, 6, 0,  0, 0, 0, 0, 0, 0],

  [1, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0],

  [0, 0, 0, 0, 7, 0,  0, 0, 0, 0, 0, 0],
  [0, 0, 3, 0, 0, 0,  0,11, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 9,  0, 0, 0, 0, 0, 0],
  [0, 0, 0, 5, 0, 0,  0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0]
];
