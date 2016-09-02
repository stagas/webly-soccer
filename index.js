require('./style.css');
var Loop = require('./lib/loop');
var arrows = require('./lib/arrows');
var Stadium = require('./src/stadium');
var Player = require('./src/player');

var k = arrows(document.body);

var stadium = new Stadium;
var player = new Player;
document.body.appendChild(stadium.el);
document.body.appendChild(player.el);

/* loop */

var loop = new Loop;

loop.on('update', () => {
  controls();
  update();
});

loop.on('render', render);

loop.fps(10).start();

function update() {
  player.update();
}

function render(dt, alpha, frame, elapsed) {
  player.render(dt, alpha, frame, elapsed);
}

function controls() {
  k & k.left  && player.move(-1,0);
  k & k.up    && player.move(0,-1);
  k & k.right && player.move(1,0);
  k & k.down  && player.move(0,1);
}
