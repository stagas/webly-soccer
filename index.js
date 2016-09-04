require('./style.css');
var Loop = require('./lib/loop');
var arrows = require('./lib/arrows');
var Stadium = require('./src/stadium');
var Camera = require('./src/camera');
var Player = require('./src/player');
var Ball = require('./src/ball');
var Dot = require('./src/dot');

var k = arrows(document.body);

var stadium = new Stadium;
var ball = new Ball;
var player = new Player(ball);
var playerDot = new Dot(player);
var ballDot = new Dot(ball);
var camera = new Camera(ball);
document.body.appendChild(stadium.el);
document.body.appendChild(player.el);
// document.body.appendChild(playerDot.el);
document.body.appendChild(ball.shadow.el);
// document.body.appendChild(ballDot.el);
document.body.appendChild(ball.el);
// player.pos.x = player.px.x = 2300 / 2 - player.width * player.scale / 2;
// player.pos.y = player.px.y = 1700 / 2 - player.height * player.scale;
player.pos.x = player.px.x = 500;
player.pos.y = player.px.y = 500;

ball.pos.y = ball.px.y = 60;
ball.pos.x = ball.px.x = 50;
ball.vel.x = 100;
ball.vel.y = 100;

/* loop */

var loop = new Loop;

loop.on('update', () => {
  controls();
  update();
});

loop.on('render', render);

loop.fps(14).start();

function update() {
  player.update();
  ball.update();
  camera.update();
}

function render(dt, alpha, frame, elapsed) {
  player.render(dt, alpha);
  ball.render(dt, alpha);
  camera.render(dt, alpha);
}

function controls() {
  k & k.left  && player.move(-1,0);
  k & k.up    && player.move(0,-1);
  k & k.right && player.move(1,0);
  k & k.down  && player.move(0,1);
}
