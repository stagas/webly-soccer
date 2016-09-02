var pixel = require('pixel-art');
var Loop = require('./loop');
var sprite = require('./sprite');
var arrows = require('./arrows');

var k = arrows(document.body);

var player = createSprite('player');

player.speed = 14;
player.face = 'stand_down';
player.faceDuration = 5;
player.faceIndex = 0;
player.faceNeedle = 0;
player.faceMap = {
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
player.faceStandMap = {
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

player.move = function(x, y){
  player.vel.x |= x;
  player.vel.y |= y;
};

player.update = function() {
  player.pos.x += player.vel.x * player.speed;
  player.pos.y += player.vel.y * player.speed;
  player.vel.x = 0;
  player.vel.y = 0;
};

player.render = function(dt, alpha) {
  player.px.x += (player.pos.x - player.px.x) * alpha;
  player.px.y += (player.pos.y - player.px.y) * alpha;

  var i = player.faceIndex;
  var n = player.faceNeedle;
  n %= sprite.player.animation[player.face].length;

  var index = sprite.player.animation[player.face][n];
  var x = index[0] * sprite.player.width * sprite.scale;
  var y = index[1] ? sprite.player.height * sprite.scale : 0;
  player.faceIndex = (i + 1) % player.faceDuration;
  if (player.faceIndex === 0) player.faceNeedle = n + 1;

  Object.assign(player.el.style, {
    left: Math.round(player.px.x) + 'px',
    top: Math.round(player.px.y) + 'px',
    backgroundPosition: `-${x}px -${y}px`,
  });
};

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
  player.face = player.faceMap[player.vel];
  player.faceStandMap['0,0'] =
  player.faceMap['0,0'] = player.faceStandMap[player.vel];
}

/* utils */

function createSprite(name) {
  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');

  canvas.width = sprite[name].length * sprite[name].width * sprite.scale;
  canvas.height = sprite[name].height * sprite.scale * 2;

  sprite[name]
    // normal
    .map((art, index) => {
      pixel.art(art)
      .palette(sprite[name].palette)
      .scale(sprite.scale).pos({
        x: sprite[name].width * sprite.scale * index,
        y: 0
      })
      .draw(context);
      return art;
    })

    // mirror x
    .map((art, index) => {
      art = art.split('\n').map(row => padRight(row, sprite[name].width).split('').reverse().join(''));
      pixel.art(art)
      .palette(sprite[name].palette)
      .scale(sprite.scale).pos({
        x: sprite[name].width * sprite.scale * index,
        y: sprite[name].height * sprite.scale
      })
      .draw(context);
      return art;
    });

  var dataURL = canvas.toDataURL();
  var div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.background = `url(${dataURL}) 0 0 no-repeat`;
  div.style.width = sprite.scale * sprite[name].width + 'px';
  div.style.height = sprite.scale * sprite[name].height + 'px';
  return {
    el: div,
    px: new Point,
    pos: new Point,
    vel: new Point,
  };
}

function padRight(s, n) {
  return s + new Array(n - s.length + 1).join(' ');
}

function Point() {
  this.x = 0;
  this.y = 0;
}

Point.prototype.toString = function() {
  return this.x + ',' + this.y;
};
