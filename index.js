require('./style.css');
var Loop = require('./lib/loop');
var arrows = require('./lib/arrows');
var Stadium = require('./src/stadium');
var Camera = require('./src/camera');
// var Player = require('./src/player');
var Team = require('./src/team');
var Ball = require('./src/ball');
var connect = require('./src/network');

var keys = arrows(document.body, onkeys);

var game = {};

var stadium = game.stadium = new Stadium;
var ball = game.ball = new Ball(game);
var team = game.team = new Team(game);
var camera = game.camera = new Camera(ball, team.master);

document.body.appendChild(stadium.el);
document.body.appendChild(team.el);
document.body.appendChild(ball.shadow.el);
document.body.appendChild(ball.el);

var start = { x: 324, y: stadium.rightGoalArea.top[0].y + 20, z: 130 };
camera.pos.x = camera.px.x = start.x - camera.size.x / 2;
camera.pos.y = camera.px.y = start.y - camera.size.y / 2;
ball.pos.x = ball.px.x = start.x;
ball.pos.y = ball.px.y = start.y;
ball.pos.z = ball.px.z = start.z;
// player.pos.x = player.px.x = start.x + 40;
// player.pos.y = player.px.y = start.y + 100;
ball.vel.x = -2.28;
ball.vel.y = 0;
ball.vel.z = 0;

/* loop */

var loop = new Loop;

var prevTime = Date.now();
var prevKeys = +keys;

loop.on('update', (dt, alpha, frame) => {
  controls(keys, team.master);

  if (opponent.team) {
    controls(opponent.keys, opponent.team);
  }

  update(frame);

  if (opponent.socket) {
    if (+keys !== +prevKeys || Date.now() - prevTime > 1000) {
      var packet = JSON.stringify({
        keys: +keys,
        pos: team.master.pos,
        vel: team.master.vel,
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
  team.update();
  if (opponent.team) opponent.team.update();
  ball.update();
  camera.update();
}

function render(dt, alpha, frame, elapsed) {
  team.render(dt, alpha);
  if (opponent.team) opponent.team.render(dt, alpha);
  ball.render(dt, alpha);
  camera.render(dt, alpha);
}

function controls(k, player) {
  player.vel.x = player.vel.y = 0;
  k & keys.left  && player.move(-1,0);
  k & keys.up    && player.move(0,-1);
  k & keys.right && player.move(1,0);
  k & keys.down  && player.move(0,1);
  k & keys.shoot ? player.maybeShoot() : player.shootEnd();
}

function onkeys(k) {
  k & keys.shoot ? team.master.maybeShoot() : team.master.shootEnd();
}

/* network */

var opponent = {
  keys: 0
};

var showFrame;

// connect(
//   peer => {
//     opponent.socket = peer;
//     // showFrame = setInterval(() => console.log(loop.frame), 1000);
//     peer.send(JSON.stringify({
//       colors: team.colors,
//       pos: team.master.pos,
//       vel: team.master.vel,
//       keys: keys
//     }));
//   },
//   message => {
//     var json = new TextDecoder('utf-8').decode(message);
//     var data = JSON.parse(json);
//     if (data.colors) {
//       opponent.team = new Player(game, data);
//       opponent.keys = data.keys;

//       document.body.appendChild(opponent.team.el);
//       console.log('created opponent')
//     } else if (data.pos) {
//       opponent.keys = data.keys;
//       opponent.team.pos.x = data.pos.x;
//       opponent.team.pos.y = data.pos.y;
//       opponent.team.vel.x = data.vel.x;
//       opponent.team.vel.y = data.vel.y;
//       if (opponent.team.collisionWith(data.ball) < 26) {
//         ball.pos.x = data.ball.pos.x;
//         ball.pos.y = data.ball.pos.y;
//         ball.vel.x = data.ball.vel.x;
//         ball.vel.y = data.ball.vel.y;
//         ball.vel.z = data.ball.vel.z;
//       }
//     }
//   },
//   peer => {
//     // clearInterval(showFrame);
//     if (opponent.team) document.body.removeChild(opponent.team.el);
//     opponent.team = null;
//     opponent.socket = null;
//   }
// );
