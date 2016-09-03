require('./style.css');
var Loop = require('./lib/loop');
var arrows = require('./lib/arrows');
var Stadium = require('./src/stadium');
var Camera = require('./src/camera');
var Player = require('./src/player');

var k = arrows(document.body);

var stadium = new Stadium;
var player = new Player;
var camera = new Camera(player);
document.body.appendChild(stadium.el);
document.body.appendChild(player.el);
// player.pos.x = player.px.x = 2300 / 2 - player.width * player.scale / 2;
player.pos.y = player.px.y = 1700 / 2 - player.height * player.scale;
player.pos.x = player.px.x = 2080;
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
  camera.update();
}

function render(dt, alpha, frame, elapsed) {
  player.render(dt, alpha);
  camera.render(dt, alpha)
}

function controls() {
  k & k.left  && player.move(-1,0);
  k & k.up    && player.move(0,-1);
  k & k.right && player.move(1,0);
  k & k.down  && player.move(0,1);
}
