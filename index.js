require('./style.css');
var Loop = require('./lib/loop');
var arrows = require('./lib/arrows');
var Stadium = require('./src/stadium');
var Camera = require('./src/camera');
var Player = require('./src/player');
var Ball = require('./src/ball');
var connect = require('./src/network');

var keys = arrows(document.body, onkeys);

var game = {};

var stadium = game.stadium = new Stadium;
var ball = game.ball = new Ball(game);
var player = game.player = new Player(game);
var camera = game.camera = new Camera(ball);

document.body.appendChild(stadium.el);
document.body.appendChild(player.el);
document.body.appendChild(ball.shadow.el);
document.body.appendChild(ball.el);

ball.pos.y = ball.px.y = 300;
ball.pos.x = ball.px.x = 300;
ball.vel.x = 10;
ball.vel.y = 10;
ball.vel.z = 0;

/* loop */

var loop = new Loop;

var prevTime = Date.now();
var prevKeys = +keys;

loop.on('update', (dt, alpha, frame) => {
  controls(keys, player);

  if (opponent.player) {
    controls(opponent.keys, opponent.player);
  }

  update(frame);

  if (opponent.socket) {
    if (+keys !== +prevKeys || Date.now() - prevTime > 1000) {
      var packet = JSON.stringify({
        keys: +keys,
        pos: player.pos,
        vel: player.vel,
        ball: {
          pos: ball.pos,
          vel: ball.vel
        }
      });

      // setTimeout(packet => opponent.socket.send(packet), 170, packet);
      opponent.socket.send(packet);

      prevKeys = +keys;
      prevTime = Date.now();
    }
  }
});

loop.on('render', render);

loop.tps(14).start();

function update() {
  player.update();
  if (opponent.player) opponent.player.update();
  ball.update();
  camera.update();
}

function render(dt, alpha, frame, elapsed) {
  player.render(dt, alpha);
  if (opponent.player) opponent.player.render(dt, alpha);
  ball.render(dt, alpha);
  camera.render(dt, alpha);
}

function controls(k, player) {
  player.vel.x = player.vel.y = 0;
  k & keys.left  && player.move(-1,0);
  k & keys.up    && player.move(0,-1);
  k & keys.right && player.move(1,0);
  k & keys.down  && player.move(0,1);
  k & keys.shoot ? player.shoot() : player.shootEnd();
}

function onkeys(k) {
  k & keys.shoot ? player.shoot() : player.shootEnd();
}

/* network */

var opponent = {
  keys: 0
};

var showFrame;

connect(
  peer => {
    opponent.socket = peer;
    // showFrame = setInterval(() => console.log(loop.frame), 1000);
    peer.send(JSON.stringify({
      colors: player.colors,
      pos: player.pos,
      vel: player.vel,
      keys: keys
    }));
  },
  message => {
    var json = new TextDecoder('utf-8').decode(message);
    var data = JSON.parse(json);
    if (data.colors) {
      opponent.player = new Player(game, data);
      opponent.keys = data.keys;

      document.body.appendChild(opponent.player.el);
      console.log('created opponent')
    } else if (data.pos) {
      opponent.keys = data.keys;
      opponent.player.pos.x = data.pos.x;
      opponent.player.pos.y = data.pos.y;
      opponent.player.vel.x = data.vel.x;
      opponent.player.vel.y = data.vel.y;
      if (opponent.player.collisionWith(data.ball) < 26) {
        ball.pos.x = data.ball.pos.x;
        ball.pos.y = data.ball.pos.y;
        ball.vel.x = data.ball.vel.x;
        ball.vel.y = data.ball.vel.y;
        ball.vel.z = data.ball.vel.z;
      }
    }
  },
  peer => {
    // clearInterval(showFrame);
    if (opponent.player) document.body.removeChild(opponent.player.el);
    opponent.player = null;
    opponent.socket = null;
  }
);
