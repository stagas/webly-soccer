var css = require('../style.css');
var Player = require('./player');

module.exports = Team;

function Team(game, data) {
  data = data || {};
  this.el = document.createElement('div');
  this.game = game;
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
  var closest = this.getClosestToBall(this.master);
  var vel = closest.velToBall.inverse();
  this.game.ball.vel.x = vel.x * closest.distanceToBall * .1;
  this.game.ball.vel.y = vel.y * closest.distanceToBall * .1;
};

Team.prototype.getClosestToBall = function(exclude) {
  return this.players.reduce((p, n) => {
    if (p.distanceToBall < n.distanceToBall && p !== exclude) {
      return p;
    } else {
      return n;
    }
  }, exclude === this.players[0] ? this.players[1] : this.players[0]);
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
  var rowHeight = this.game.stadium.size.y / this.formation.length;
  var colWidth = this.game.stadium.size.x / this.formation[0].length;

  this.formation.forEach((row, y) => {
    row.forEach((col, x) => {
      if (col) {
        this.players[col - 1].setPosition({
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
  this.closestToBall = this.getClosestToBall();
  this.setMaster(this.closestToBall);
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
