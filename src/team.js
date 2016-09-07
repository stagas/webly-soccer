var Player = require('./player');

module.exports = Team;

function Team(game, data) {
  data = data || {};
  this.el = document.createElement('div');
  this.game = game;
  this.colors = data.colors || this.randomColors();
  this.createPlayers();
  this.master = this.players[0];
  this.setFormation(data.formation || '4-4-2');
  this.placeFormation();
}

Team.prototype.createPlayers = function() {
  this.players = [];
  for (var i = 0; i < 11; i++) {
    var player = new Player(this.game, { colors: this.colors, number: i });
    this.players.push(player);
    this.el.appendChild(player.el);
  }
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
