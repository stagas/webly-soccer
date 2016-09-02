var pixel = require('pixel-art');
var merge = require('../lib/merge');
var Point = require('../lib/point');

var sprite = exports;

sprite.scale = 3;

// ball

sprite.ball = [
`\
 ox
xooo
ooxo
 oo\
`,`\
 xo
oooo
xoxo
 oo\
`,`\
 xo
oooo
xoxo
 oo\
`
];

sprite.ball.palette = {
  'o': '#fff',
  'x': '#000'
};

// ball shadow

sprite.ball_shadow = [`\
 777
77777
 777\
`];

sprite.ball_shadow.palette = {
  '7': 'rgba(0,0,0,0.3)'
};

sprite.player = [

// 0: down
`\
    xxx
   xxxxx
  xx...xx
  xox.xox
   .....
     .
   ttttt
  t ttt t
  . ttt .
    ppp
    . .
    t t
   ss ss\
`,

// 1: down right

`\
    xxx
   xxxxx
  xx....
  x.ox.xo
   .....
     .
   tttt
  ttttt
  .tttt
    ppp
    . .
    t t
    ssss\
`,

// 2: right
`\
    xxx
   xxxxx
  xxx...
  xx..ox
   x....
     .
    ttt
   tttt
   .ttt
    pp
    ..
    tt
    sss\
`,

// 3: up right

`\
    xxx
   xxxxx
  xxxxx.
  xxxx.ox
   xx...
     .
   tttt
   ttttt
   tttt.
    ppp
    . .
    t t
    ssss\
`,

// 4: up

`\
    xxx
   xxxxx
  xxxxxxx
  xxxxxxx
   .xxx.
     .
   ttttt
  t ttt t
  . ttt .
    ppp
    . .
    t t
   ss ss\
`,

// 5: run right 1

`\
    xxx
   xxxxx
  xxx...
  xx..ox
   x....
     .
   tttt
  ttttt
  . ttt.
    ppp
  stt..
  s   t
      ss\
`,

// 6: run right 2

`\
    xxx
   xxxxx
  xxx...
  xx..ox
   x....
     .
    ttt
   tttt.
   t.tt
    pp
    ..
    tt
    sss\
`,

// 7: run right 3

`\
    xxx
   xxxxx
  xxx...
  xx..ox
   x....
     .
    ttt
   tttt
   tt.t
    ppp
  stt..
  s   t
      ss\
`,

// 8: run down 1

`\
    xxx
   xxxxx
  xx...xx
  xox.xox
   .....
     .
   ttttt
  t ttt t
  . ttt .
    ppp
    . .
    t t
    s s\
`,

// 9: run down 2

`\
    xxx
   xxxxx
  xx...xx
  xox.xox
   .....
   t .
  .tttt
    tttt
    tttt
    ppp.
    . t
    . s
    t
    s\
`,

// 10: run down right 1

`\
    xxx
   xxxxx
  xx....
  x.ox.xo
   .....
     .
  ttttt
 . tttt
   tttt.
    ppp
  st...
  s  st
      s\
`,

// 11: run down right 2

`\
    xxx
   xxxxx
  xx....
  x.ox.xo
   .....
     .
   tttt
   tttt
   t.tt
    ppp
    ...
  st t
   s ss\
`,

// 12: run down right 3

`\
    xxx
   xxxxx
  xx....
  x.ox.xo
   .....
     .
 .ttttt
   tttt.
   tttt
    ppp
  st...
  s    t
       ss\
`,

// 13: run up right 1

`\
    xxx
   xxxxx
  xxxxx.
  xxxx.ox
   xx...
     .
  ttttt
  .ttttt.
   tttt
    ppp
  st...
  s  t
     ss\
`,

// 14: run up right 2

`\
    xxx
   xxxxx
  xxxxx.
  xxxx.ox
   xx...
     .
   tttt
  ttttt
  .ttt.
    ppp
    ...
   st t
    s ss\
`,

// 15: run up right 3

`\
    xxx
   xxxxx
  xxxxx.
  xxxx.ox
   xx...
     .
   tttt
  ttttt.
   tttt
    ppp
  st...
  s    ts
       s\
`,


// 16: run up 1

`\
    xxx
   xxxxx
  xxxxxxx
  xxxxxxx
   .xxx.
     .
   ttttt
  t ttt t
  . ttt .
    ppp
    . .
    t t
    s s\
`,

// 17: run up 2

`\
    xxx
   xxxxx
  xxxxxxx
  xxxxxxx
   .xxx.
     .
  .tttt
    tttt
    tttt
    ppp.
    . t
    . s
    t
    s\
`,
];

sprite.player.animation = {
  stand_down: [[0]],
  stand_down_right: [[1]],
  stand_right: [[2]],
  stand_up_right: [[3]],
  stand_up: [[4]],
  stand_up_left: [[3,true]],
  stand_left: [[2,true]],
  stand_down_left: [[1,true]],

  run_right: [[7],[6],[5],[2]],
  run_left: [[7,true],[6,true],[5,true],[2,true]],
  run_down: [[8],[9],[8],[9,true]],
  run_up: [[16],[17],[16],[17,true]],
  run_down_right: [[11],[12],[10],[1]],
  run_up_right: [[13],[14],[15],[3]],
  run_down_left: [[11,true],[12,true],[10,true],[1,true]],
  run_up_left: [[13,true],[14,true],[15,true],[3,true]],
};

sprite.player.palette = {
  'x': '#000',
  'v': '#444',
  'o': '#fff',
  '.': '#f91',
  't': '#00f',
  'p': '#fff',
  's': '#000',
  '7': 'rgba(0,0,0,0.3)',
};

sprite.player.width = 11;
sprite.player.height = 14;
sprite.player.scale = sprite.scale;

sprite.create = function createSprite(name) {
  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');
  var s = sprite[name];

  canvas.width = s.length * s.width * s.scale;
  canvas.height = s.height * s.scale * 2;

  s
    // normal
    .map((art, index) => {
      pixel.art(art)
      .palette(s.palette)
      .scale(s.scale).pos({
        x: s.width * s.scale * index,
        y: 0
      })
      .draw(context);
      return art;
    })

    // mirror x
    .map((art, index) => {
      art = art.split('\n').map(row => padRight(row, s.width).split('').reverse().join(''));
      pixel.art(art)
      .palette(s.palette)
      .scale(s.scale).pos({
        x: s.width * s.scale * index,
        y: s.height * s.scale
      })
      .draw(context);
      return art;
    });

  var dataURL = canvas.toDataURL();
  var div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.background = `url(${dataURL}) 0 0 no-repeat`;
  div.style.width = s.scale * s.width + 'px';
  div.style.height = s.scale * s.height + 'px';
  return merge({
    el: div,
    px: new Point,
    pos: new Point,
    vel: new Point,
  }, s);
};

function padRight(s, n) {
  return s + new Array(n - s.length + 1).join(' ');
}
