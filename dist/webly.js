(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.WeblySoccer = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

/*!
 *
 * arrows
 *
 * MIT
 *
 */

/**
 * Control flags.
 */

var ctrl = {
  left:  1,
  up:    2,
  right: 4,
  down:  8,
  shoot: 16
};

/**
 * Opposite directions flags.
 */

var opp = {
  1: 4,
  2: 8,
  4: 1,
  8: 2
};

/**
 * Keymap.
 */

var map = {
  37: ctrl.left,
  38: ctrl.up,
  39: ctrl.right,
  40: ctrl.down,
  16: ctrl.shoot, // shift
  17: ctrl.shoot, // ctrl
  88: ctrl.shoot, // x
  90: ctrl.shoot  // z
};

/**
 * Arrows.
 *
 * @return {Object}
 * @api public
 */

module.exports = function(el){
  // bitmasks
  var down = 0;
  var keys = 0;

  var arrows = {};

  el.addEventListener('keydown', onkeydown);
  el.addEventListener('keyup', onkeyup);

  /**
   * Returns the `keys` bitmask when evaluated,
   * to use with logical operations.
   *
   * @return {Number} keys
   * @api public
   */

  arrows.valueOf = function(){
    return keys;
  };

  // merge control flags to
  // use with logical operations
  // i.e: arrows & arrows.left && left()
  merge(arrows, ctrl);

  return arrows;

  /**
   * Keydown handler.
   *
   * @param {Event} event
   * @param {Number} key
   * @api private
   */

  function onkeydown(event){
    key = event.which;
    if (!(key in map)) return;
    key = map[key];

    // OR `key`
    keys = down |= key;

    // recent opposite `key` takes precedence
    // so XOR old from the `keys` bitmask
    if (keys & opp[key]) {
      keys ^= opp[key];
    }
  }

  /**
   * Keyup handler.
   *
   * @param {Event} event
   * @param {Number} key
   * @api private
   */

  function onkeyup(event){
    key = event.which;
    if (!(key in map)) return;
    key = map[key];

    // XOR `key`
    keys = down ^= key;
  }
};

/**
 * Merge util.
 */

function merge(target, src) {
  for (var key in src) {
    target[key] = src[key];
  }
}

},{}],2:[function(require,module,exports){
var pixel = require('pixel-art');
var Loop = require('./loop');
var sprite = require('./sprite');
var arrows = require('./arrows');

var k = arrows(document.body);

var player = createSprite('player');

player.speed = 14;
player.face = 'rotate';
player.faceDuration = 5;
player.faceIndex = 0;
player.faceNeedle = 0;
player.faceMap = {
  '0,0': 'rotate',
  '-1,0': 'run_left',
  '0,-1': 'run_up',
  '1,0': 'run_right',
  '0,1': 'run_down',
  '-1,-1': 'run_up_left',
  '1,-1': 'run_up_right',
  '-1,1': 'run_down_left',
  '1,1': 'run_down_right',
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
  var i = player.faceIndex;
  var n = player.faceNeedle;

  player.px.x += (player.pos.x - player.px.x) * alpha;
  player.px.y += (player.pos.y - player.px.y) * alpha;

  var index = sprite.player.animation[player.face][n];
  var x = index * sprite.player.width * sprite.scale;
  var y = ~sprite.player.animation[player.face].mirror_x.indexOf(n)
    ? sprite.player.height * sprite.scale : 0;
  player.faceIndex = (i + 1) % player.faceDuration;
  if (player.faceIndex === 0) {
    player.faceNeedle = (n + 1) % sprite.player.animation[player.face].length;
  }

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

},{"./arrows":1,"./loop":3,"./sprite":6,"pixel-art":5}],3:[function(require,module,exports){

/*!
 *
 * loop
 *
 * MIT licensed.
 *
 */

/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter;

/**
 * Expose `Loop`.
 */

exports = module.exports = Loop;

/**
 * Loop constructor.
 *
 * @param {Number} fps
 * @api public
 */

function Loop(fps) {
  this.now = 0;
  this.before = 0;
  this.deltaTime = 0;
  this.maxDeltaTime = 0;
  this.timeStep = 0;
  this.startTime = 0;
  this.timeElapsed = 0;
  this.accumulator = 0;
  this.ticking = false;
  this.frame = 0;
  this._fps = 0;
  this.fps(fps || 60);
}

/**
 * Make Emitter.
 */

Loop.prototype.__proto__ = EventEmitter.prototype;

/**
 * Start.
 *
 * @return {Loop} this
 * @api public
 */

Loop.prototype.start = function() {
  this.startTime =
  this.now =
  this.before = Date.now();

  this.emit('start');

  this.ticking = true;
  this.tick();
  return this;
};

/**
 * Pause.
 *
 * @return {Loop} this
 * @api public
 */

Loop.prototype.pause = function() {
  this.ticking = false;
  this.emit('pause');
  return this;
};

/**
 * Set or get frames per second.
 *
 * @param {Number} [fps]
 * @return {Number|Loop} fps|this
 * @api public
 */

Loop.prototype.fps = function(fps) {
  if (!fps) return this._fps;
  this._fps = fps;
  this.timeStep = 1000 / this._fps | 0;
  this.maxDeltaTime = this.timeStep * 5;
  return this;
};

/**
 * Tick.
 *
 * @return {Loop} this
 * @api private
 */

Loop.prototype.tick = function() {
  var self = this;
  var alpha;

  window.requestAnimationFrame(tick);

  return this;

  function tick() {
    if (!self.ticking) return;

    // request animation frame early
    window.requestAnimationFrame(tick);

    // timer
    self.now = Date.now();
    self.timeElapsed = self.now - self.startTime;
    self.deltaTime = self.now - self.before;
    self.before = self.now;

    // discard updates when tick too big
    if (self.deltaTime > self.maxDeltaTime) {
      self.emit('discard', self.deltaTime / self.timeStep, self.deltaTime);
      return;
    }

    // accumulate to overflow
    self.accumulator += self.deltaTime;

    // consume new frames if overflowed
    while (self.accumulator >= self.timeStep) {
      self.accumulator -= self.timeStep;

      // send update and advance frame
      self.emit('update', self.timeStep, 1, ++self.frame, self.timeElapsed);
    }

    // compute alpha
    alpha = self.accumulator / self.timeStep;
    self.emit('render', self.deltaTime, alpha, self.frame, self.timeElapsed);
  }
};

},{"events":4}],4:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],5:[function(require,module,exports){

module.exports = PixelArt;

function PixelArt(rows) {
  if (!(this instanceof PixelArt)) return new PixelArt(rows);

  this._palette = {};
  this._scale = 2;
  this._rows = [];
  this._pos = { x: 0, y: 0 };

  if (rows) this.art(rows);
}

PixelArt.art = PixelArt.prototype.art = function(rows) {
  if (!(this instanceof PixelArt)) return new PixelArt(rows);
  this._rows = 'string' === typeof rows ? rows.split('\n') : rows;
  return this;
};

PixelArt.prototype.palette = function(palette) {
  this._palette = palette;
  return this;
};

PixelArt.prototype.scale = function(scale) {
  this._scale = scale;
  return this;
};

PixelArt.prototype.pos = function(pos) {
  this._pos = pos;
  return this;
};

PixelArt.prototype.size = function() {
  return {
    width: this._rows.reduce(function(max, cols) {
      return Math.max(max, cols.length);
    }, 0) * this._scale,
    height: this._rows.length * this._scale
  };
};

PixelArt.prototype.draw = function(ctx) {
  var p = this._pos;
  var s = this._scale;
  var rows = this._rows;
  for (var cols, y = 0; y < rows.length; y++) {
    cols = rows[y];
    for (var col, x = 0; x < cols.length; x++) {
      col = cols[x];
      ctx.fillStyle = this._palette[col] || 'transparent';
      ctx.fillRect(x*s+p.x, y*s+p.y, s, s);
    }
  }
  return this;
};

},{}],6:[function(require,module,exports){

var sprite = exports;

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

sprite.player.animation = {};
sprite.player.animation.rotate = [0,1,2,3,4,3,2,1];
sprite.player.animation.rotate.mirror_x = [5,6,7];
sprite.player.animation.run_right = [7,6,5,2];
sprite.player.animation.run_right.mirror_x = [];
sprite.player.animation.run_left = [7,6,5,2];
sprite.player.animation.run_left.mirror_x = [0,1,2,3];
sprite.player.animation.run_down = [8,9,8,9];
sprite.player.animation.run_down.mirror_x = [3];
sprite.player.animation.run_up = [16,17,16,17];
sprite.player.animation.run_up.mirror_x = [3];
sprite.player.animation.run_down_right = [11,12,10,1];
sprite.player.animation.run_down_right.mirror_x = [];
sprite.player.animation.run_up_right = [13,14,15,3];
sprite.player.animation.run_up_right.mirror_x = [];
sprite.player.animation.run_down_left = [11,12,10,1];
sprite.player.animation.run_down_left.mirror_x = [0,1,2,3];
sprite.player.animation.run_up_left = [13,14,15,3];
sprite.player.animation.run_up_left.mirror_x = [0,1,2,3];
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
sprite.scale = 3;

},{}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcnJvd3MuanMiLCJpbmRleC5qcyIsImxvb3AuanMiLCJub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9waXhlbC1hcnQvaW5kZXguanMiLCJzcHJpdGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxuLyohXG4gKlxuICogYXJyb3dzXG4gKlxuICogTUlUXG4gKlxuICovXG5cbi8qKlxuICogQ29udHJvbCBmbGFncy5cbiAqL1xuXG52YXIgY3RybCA9IHtcbiAgbGVmdDogIDEsXG4gIHVwOiAgICAyLFxuICByaWdodDogNCxcbiAgZG93bjogIDgsXG4gIHNob290OiAxNlxufTtcblxuLyoqXG4gKiBPcHBvc2l0ZSBkaXJlY3Rpb25zIGZsYWdzLlxuICovXG5cbnZhciBvcHAgPSB7XG4gIDE6IDQsXG4gIDI6IDgsXG4gIDQ6IDEsXG4gIDg6IDJcbn07XG5cbi8qKlxuICogS2V5bWFwLlxuICovXG5cbnZhciBtYXAgPSB7XG4gIDM3OiBjdHJsLmxlZnQsXG4gIDM4OiBjdHJsLnVwLFxuICAzOTogY3RybC5yaWdodCxcbiAgNDA6IGN0cmwuZG93bixcbiAgMTY6IGN0cmwuc2hvb3QsIC8vIHNoaWZ0XG4gIDE3OiBjdHJsLnNob290LCAvLyBjdHJsXG4gIDg4OiBjdHJsLnNob290LCAvLyB4XG4gIDkwOiBjdHJsLnNob290ICAvLyB6XG59O1xuXG4vKipcbiAqIEFycm93cy5cbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWwpe1xuICAvLyBiaXRtYXNrc1xuICB2YXIgZG93biA9IDA7XG4gIHZhciBrZXlzID0gMDtcblxuICB2YXIgYXJyb3dzID0ge307XG5cbiAgZWwuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9ua2V5ZG93bik7XG4gIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgb25rZXl1cCk7XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGBrZXlzYCBiaXRtYXNrIHdoZW4gZXZhbHVhdGVkLFxuICAgKiB0byB1c2Ugd2l0aCBsb2dpY2FsIG9wZXJhdGlvbnMuXG4gICAqXG4gICAqIEByZXR1cm4ge051bWJlcn0ga2V5c1xuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhcnJvd3MudmFsdWVPZiA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIGtleXM7XG4gIH07XG5cbiAgLy8gbWVyZ2UgY29udHJvbCBmbGFncyB0b1xuICAvLyB1c2Ugd2l0aCBsb2dpY2FsIG9wZXJhdGlvbnNcbiAgLy8gaS5lOiBhcnJvd3MgJiBhcnJvd3MubGVmdCAmJiBsZWZ0KClcbiAgbWVyZ2UoYXJyb3dzLCBjdHJsKTtcblxuICByZXR1cm4gYXJyb3dzO1xuXG4gIC8qKlxuICAgKiBLZXlkb3duIGhhbmRsZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gICAqIEBwYXJhbSB7TnVtYmVyfSBrZXlcbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuXG4gIGZ1bmN0aW9uIG9ua2V5ZG93bihldmVudCl7XG4gICAga2V5ID0gZXZlbnQud2hpY2g7XG4gICAgaWYgKCEoa2V5IGluIG1hcCkpIHJldHVybjtcbiAgICBrZXkgPSBtYXBba2V5XTtcblxuICAgIC8vIE9SIGBrZXlgXG4gICAga2V5cyA9IGRvd24gfD0ga2V5O1xuXG4gICAgLy8gcmVjZW50IG9wcG9zaXRlIGBrZXlgIHRha2VzIHByZWNlZGVuY2VcbiAgICAvLyBzbyBYT1Igb2xkIGZyb20gdGhlIGBrZXlzYCBiaXRtYXNrXG4gICAgaWYgKGtleXMgJiBvcHBba2V5XSkge1xuICAgICAga2V5cyBePSBvcHBba2V5XTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogS2V5dXAgaGFuZGxlci5cbiAgICpcbiAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGtleVxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG5cbiAgZnVuY3Rpb24gb25rZXl1cChldmVudCl7XG4gICAga2V5ID0gZXZlbnQud2hpY2g7XG4gICAgaWYgKCEoa2V5IGluIG1hcCkpIHJldHVybjtcbiAgICBrZXkgPSBtYXBba2V5XTtcblxuICAgIC8vIFhPUiBga2V5YFxuICAgIGtleXMgPSBkb3duIF49IGtleTtcbiAgfVxufTtcblxuLyoqXG4gKiBNZXJnZSB1dGlsLlxuICovXG5cbmZ1bmN0aW9uIG1lcmdlKHRhcmdldCwgc3JjKSB7XG4gIGZvciAodmFyIGtleSBpbiBzcmMpIHtcbiAgICB0YXJnZXRba2V5XSA9IHNyY1trZXldO1xuICB9XG59XG4iLCJ2YXIgcGl4ZWwgPSByZXF1aXJlKCdwaXhlbC1hcnQnKTtcbnZhciBMb29wID0gcmVxdWlyZSgnLi9sb29wJyk7XG52YXIgc3ByaXRlID0gcmVxdWlyZSgnLi9zcHJpdGUnKTtcbnZhciBhcnJvd3MgPSByZXF1aXJlKCcuL2Fycm93cycpO1xuXG52YXIgayA9IGFycm93cyhkb2N1bWVudC5ib2R5KTtcblxudmFyIHBsYXllciA9IGNyZWF0ZVNwcml0ZSgncGxheWVyJyk7XG5cbnBsYXllci5zcGVlZCA9IDE0O1xucGxheWVyLmZhY2UgPSAncm90YXRlJztcbnBsYXllci5mYWNlRHVyYXRpb24gPSA1O1xucGxheWVyLmZhY2VJbmRleCA9IDA7XG5wbGF5ZXIuZmFjZU5lZWRsZSA9IDA7XG5wbGF5ZXIuZmFjZU1hcCA9IHtcbiAgJzAsMCc6ICdyb3RhdGUnLFxuICAnLTEsMCc6ICdydW5fbGVmdCcsXG4gICcwLC0xJzogJ3J1bl91cCcsXG4gICcxLDAnOiAncnVuX3JpZ2h0JyxcbiAgJzAsMSc6ICdydW5fZG93bicsXG4gICctMSwtMSc6ICdydW5fdXBfbGVmdCcsXG4gICcxLC0xJzogJ3J1bl91cF9yaWdodCcsXG4gICctMSwxJzogJ3J1bl9kb3duX2xlZnQnLFxuICAnMSwxJzogJ3J1bl9kb3duX3JpZ2h0Jyxcbn07XG5cbnBsYXllci5tb3ZlID0gZnVuY3Rpb24oeCwgeSl7XG4gIHBsYXllci52ZWwueCB8PSB4O1xuICBwbGF5ZXIudmVsLnkgfD0geTtcbn07XG5cbnBsYXllci51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgcGxheWVyLnBvcy54ICs9IHBsYXllci52ZWwueCAqIHBsYXllci5zcGVlZDtcbiAgcGxheWVyLnBvcy55ICs9IHBsYXllci52ZWwueSAqIHBsYXllci5zcGVlZDtcbiAgcGxheWVyLnZlbC54ID0gMDtcbiAgcGxheWVyLnZlbC55ID0gMDtcbn07XG5cbnBsYXllci5yZW5kZXIgPSBmdW5jdGlvbihkdCwgYWxwaGEpIHtcbiAgdmFyIGkgPSBwbGF5ZXIuZmFjZUluZGV4O1xuICB2YXIgbiA9IHBsYXllci5mYWNlTmVlZGxlO1xuXG4gIHBsYXllci5weC54ICs9IChwbGF5ZXIucG9zLnggLSBwbGF5ZXIucHgueCkgKiBhbHBoYTtcbiAgcGxheWVyLnB4LnkgKz0gKHBsYXllci5wb3MueSAtIHBsYXllci5weC55KSAqIGFscGhhO1xuXG4gIHZhciBpbmRleCA9IHNwcml0ZS5wbGF5ZXIuYW5pbWF0aW9uW3BsYXllci5mYWNlXVtuXTtcbiAgdmFyIHggPSBpbmRleCAqIHNwcml0ZS5wbGF5ZXIud2lkdGggKiBzcHJpdGUuc2NhbGU7XG4gIHZhciB5ID0gfnNwcml0ZS5wbGF5ZXIuYW5pbWF0aW9uW3BsYXllci5mYWNlXS5taXJyb3JfeC5pbmRleE9mKG4pXG4gICAgPyBzcHJpdGUucGxheWVyLmhlaWdodCAqIHNwcml0ZS5zY2FsZSA6IDA7XG4gIHBsYXllci5mYWNlSW5kZXggPSAoaSArIDEpICUgcGxheWVyLmZhY2VEdXJhdGlvbjtcbiAgaWYgKHBsYXllci5mYWNlSW5kZXggPT09IDApIHtcbiAgICBwbGF5ZXIuZmFjZU5lZWRsZSA9IChuICsgMSkgJSBzcHJpdGUucGxheWVyLmFuaW1hdGlvbltwbGF5ZXIuZmFjZV0ubGVuZ3RoO1xuICB9XG5cbiAgT2JqZWN0LmFzc2lnbihwbGF5ZXIuZWwuc3R5bGUsIHtcbiAgICBsZWZ0OiBNYXRoLnJvdW5kKHBsYXllci5weC54KSArICdweCcsXG4gICAgdG9wOiBNYXRoLnJvdW5kKHBsYXllci5weC55KSArICdweCcsXG4gICAgYmFja2dyb3VuZFBvc2l0aW9uOiBgLSR7eH1weCAtJHt5fXB4YCxcbiAgfSk7XG59O1xuXG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHBsYXllci5lbCk7XG5cbi8qIGxvb3AgKi9cblxudmFyIGxvb3AgPSBuZXcgTG9vcDtcblxubG9vcC5vbigndXBkYXRlJywgKCkgPT4ge1xuICBjb250cm9scygpO1xuICB1cGRhdGUoKTtcbn0pO1xuXG5sb29wLm9uKCdyZW5kZXInLCByZW5kZXIpO1xuXG5sb29wLmZwcygxMCkuc3RhcnQoKTtcblxuZnVuY3Rpb24gdXBkYXRlKCkge1xuICBwbGF5ZXIudXBkYXRlKCk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlcihkdCwgYWxwaGEsIGZyYW1lLCBlbGFwc2VkKSB7XG4gIHBsYXllci5yZW5kZXIoZHQsIGFscGhhLCBmcmFtZSwgZWxhcHNlZCk7XG59XG5cbmZ1bmN0aW9uIGNvbnRyb2xzKCkge1xuICBrICYgay5sZWZ0ICAmJiBwbGF5ZXIubW92ZSgtMSwwKTtcbiAgayAmIGsudXAgICAgJiYgcGxheWVyLm1vdmUoMCwtMSk7XG4gIGsgJiBrLnJpZ2h0ICYmIHBsYXllci5tb3ZlKDEsMCk7XG4gIGsgJiBrLmRvd24gICYmIHBsYXllci5tb3ZlKDAsMSk7XG4gIHBsYXllci5mYWNlID0gcGxheWVyLmZhY2VNYXBbcGxheWVyLnZlbF07XG59XG5cbi8qIHV0aWxzICovXG5cbmZ1bmN0aW9uIGNyZWF0ZVNwcml0ZShuYW1lKSB7XG4gIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICBjYW52YXMud2lkdGggPSBzcHJpdGVbbmFtZV0ubGVuZ3RoICogc3ByaXRlW25hbWVdLndpZHRoICogc3ByaXRlLnNjYWxlO1xuICBjYW52YXMuaGVpZ2h0ID0gc3ByaXRlW25hbWVdLmhlaWdodCAqIHNwcml0ZS5zY2FsZSAqIDI7XG5cbiAgc3ByaXRlW25hbWVdXG4gICAgLy8gbm9ybWFsXG4gICAgLm1hcCgoYXJ0LCBpbmRleCkgPT4ge1xuICAgICAgcGl4ZWwuYXJ0KGFydClcbiAgICAgIC5wYWxldHRlKHNwcml0ZVtuYW1lXS5wYWxldHRlKVxuICAgICAgLnNjYWxlKHNwcml0ZS5zY2FsZSkucG9zKHtcbiAgICAgICAgeDogc3ByaXRlW25hbWVdLndpZHRoICogc3ByaXRlLnNjYWxlICogaW5kZXgsXG4gICAgICAgIHk6IDBcbiAgICAgIH0pXG4gICAgICAuZHJhdyhjb250ZXh0KTtcbiAgICAgIHJldHVybiBhcnQ7XG4gICAgfSlcblxuICAgIC8vIG1pcnJvciB4XG4gICAgLm1hcCgoYXJ0LCBpbmRleCkgPT4ge1xuICAgICAgYXJ0ID0gYXJ0LnNwbGl0KCdcXG4nKS5tYXAocm93ID0+IHBhZFJpZ2h0KHJvdywgc3ByaXRlW25hbWVdLndpZHRoKS5zcGxpdCgnJykucmV2ZXJzZSgpLmpvaW4oJycpKTtcbiAgICAgIHBpeGVsLmFydChhcnQpXG4gICAgICAucGFsZXR0ZShzcHJpdGVbbmFtZV0ucGFsZXR0ZSlcbiAgICAgIC5zY2FsZShzcHJpdGUuc2NhbGUpLnBvcyh7XG4gICAgICAgIHg6IHNwcml0ZVtuYW1lXS53aWR0aCAqIHNwcml0ZS5zY2FsZSAqIGluZGV4LFxuICAgICAgICB5OiBzcHJpdGVbbmFtZV0uaGVpZ2h0ICogc3ByaXRlLnNjYWxlXG4gICAgICB9KVxuICAgICAgLmRyYXcoY29udGV4dCk7XG4gICAgICByZXR1cm4gYXJ0O1xuICAgIH0pO1xuXG4gIHZhciBkYXRhVVJMID0gY2FudmFzLnRvRGF0YVVSTCgpO1xuICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGRpdi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gIGRpdi5zdHlsZS5iYWNrZ3JvdW5kID0gYHVybCgke2RhdGFVUkx9KSAwIDAgbm8tcmVwZWF0YDtcbiAgZGl2LnN0eWxlLndpZHRoID0gc3ByaXRlLnNjYWxlICogc3ByaXRlW25hbWVdLndpZHRoICsgJ3B4JztcbiAgZGl2LnN0eWxlLmhlaWdodCA9IHNwcml0ZS5zY2FsZSAqIHNwcml0ZVtuYW1lXS5oZWlnaHQgKyAncHgnO1xuICByZXR1cm4ge1xuICAgIGVsOiBkaXYsXG4gICAgcHg6IG5ldyBQb2ludCxcbiAgICBwb3M6IG5ldyBQb2ludCxcbiAgICB2ZWw6IG5ldyBQb2ludCxcbiAgfTtcbn1cblxuZnVuY3Rpb24gcGFkUmlnaHQocywgbikge1xuICByZXR1cm4gcyArIG5ldyBBcnJheShuIC0gcy5sZW5ndGggKyAxKS5qb2luKCcgJyk7XG59XG5cbmZ1bmN0aW9uIFBvaW50KCkge1xuICB0aGlzLnggPSAwO1xuICB0aGlzLnkgPSAwO1xufVxuXG5Qb2ludC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMueCArICcsJyArIHRoaXMueTtcbn07XG4iLCJcbi8qIVxuICpcbiAqIGxvb3BcbiAqXG4gKiBNSVQgbGljZW5zZWQuXG4gKlxuICovXG5cbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyO1xuXG4vKipcbiAqIEV4cG9zZSBgTG9vcGAuXG4gKi9cblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gTG9vcDtcblxuLyoqXG4gKiBMb29wIGNvbnN0cnVjdG9yLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBmcHNcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gTG9vcChmcHMpIHtcbiAgdGhpcy5ub3cgPSAwO1xuICB0aGlzLmJlZm9yZSA9IDA7XG4gIHRoaXMuZGVsdGFUaW1lID0gMDtcbiAgdGhpcy5tYXhEZWx0YVRpbWUgPSAwO1xuICB0aGlzLnRpbWVTdGVwID0gMDtcbiAgdGhpcy5zdGFydFRpbWUgPSAwO1xuICB0aGlzLnRpbWVFbGFwc2VkID0gMDtcbiAgdGhpcy5hY2N1bXVsYXRvciA9IDA7XG4gIHRoaXMudGlja2luZyA9IGZhbHNlO1xuICB0aGlzLmZyYW1lID0gMDtcbiAgdGhpcy5fZnBzID0gMDtcbiAgdGhpcy5mcHMoZnBzIHx8IDYwKTtcbn1cblxuLyoqXG4gKiBNYWtlIEVtaXR0ZXIuXG4gKi9cblxuTG9vcC5wcm90b3R5cGUuX19wcm90b19fID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZTtcblxuLyoqXG4gKiBTdGFydC5cbiAqXG4gKiBAcmV0dXJuIHtMb29wfSB0aGlzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkxvb3AucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuc3RhcnRUaW1lID1cbiAgdGhpcy5ub3cgPVxuICB0aGlzLmJlZm9yZSA9IERhdGUubm93KCk7XG5cbiAgdGhpcy5lbWl0KCdzdGFydCcpO1xuXG4gIHRoaXMudGlja2luZyA9IHRydWU7XG4gIHRoaXMudGljaygpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUGF1c2UuXG4gKlxuICogQHJldHVybiB7TG9vcH0gdGhpc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5Mb29wLnByb3RvdHlwZS5wYXVzZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnRpY2tpbmcgPSBmYWxzZTtcbiAgdGhpcy5lbWl0KCdwYXVzZScpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0IG9yIGdldCBmcmFtZXMgcGVyIHNlY29uZC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gW2Zwc11cbiAqIEByZXR1cm4ge051bWJlcnxMb29wfSBmcHN8dGhpc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5Mb29wLnByb3RvdHlwZS5mcHMgPSBmdW5jdGlvbihmcHMpIHtcbiAgaWYgKCFmcHMpIHJldHVybiB0aGlzLl9mcHM7XG4gIHRoaXMuX2ZwcyA9IGZwcztcbiAgdGhpcy50aW1lU3RlcCA9IDEwMDAgLyB0aGlzLl9mcHMgfCAwO1xuICB0aGlzLm1heERlbHRhVGltZSA9IHRoaXMudGltZVN0ZXAgKiA1O1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogVGljay5cbiAqXG4gKiBAcmV0dXJuIHtMb29wfSB0aGlzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5Mb29wLnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24oKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdmFyIGFscGhhO1xuXG4gIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGljayk7XG5cbiAgcmV0dXJuIHRoaXM7XG5cbiAgZnVuY3Rpb24gdGljaygpIHtcbiAgICBpZiAoIXNlbGYudGlja2luZykgcmV0dXJuO1xuXG4gICAgLy8gcmVxdWVzdCBhbmltYXRpb24gZnJhbWUgZWFybHlcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRpY2spO1xuXG4gICAgLy8gdGltZXJcbiAgICBzZWxmLm5vdyA9IERhdGUubm93KCk7XG4gICAgc2VsZi50aW1lRWxhcHNlZCA9IHNlbGYubm93IC0gc2VsZi5zdGFydFRpbWU7XG4gICAgc2VsZi5kZWx0YVRpbWUgPSBzZWxmLm5vdyAtIHNlbGYuYmVmb3JlO1xuICAgIHNlbGYuYmVmb3JlID0gc2VsZi5ub3c7XG5cbiAgICAvLyBkaXNjYXJkIHVwZGF0ZXMgd2hlbiB0aWNrIHRvbyBiaWdcbiAgICBpZiAoc2VsZi5kZWx0YVRpbWUgPiBzZWxmLm1heERlbHRhVGltZSkge1xuICAgICAgc2VsZi5lbWl0KCdkaXNjYXJkJywgc2VsZi5kZWx0YVRpbWUgLyBzZWxmLnRpbWVTdGVwLCBzZWxmLmRlbHRhVGltZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gYWNjdW11bGF0ZSB0byBvdmVyZmxvd1xuICAgIHNlbGYuYWNjdW11bGF0b3IgKz0gc2VsZi5kZWx0YVRpbWU7XG5cbiAgICAvLyBjb25zdW1lIG5ldyBmcmFtZXMgaWYgb3ZlcmZsb3dlZFxuICAgIHdoaWxlIChzZWxmLmFjY3VtdWxhdG9yID49IHNlbGYudGltZVN0ZXApIHtcbiAgICAgIHNlbGYuYWNjdW11bGF0b3IgLT0gc2VsZi50aW1lU3RlcDtcblxuICAgICAgLy8gc2VuZCB1cGRhdGUgYW5kIGFkdmFuY2UgZnJhbWVcbiAgICAgIHNlbGYuZW1pdCgndXBkYXRlJywgc2VsZi50aW1lU3RlcCwgMSwgKytzZWxmLmZyYW1lLCBzZWxmLnRpbWVFbGFwc2VkKTtcbiAgICB9XG5cbiAgICAvLyBjb21wdXRlIGFscGhhXG4gICAgYWxwaGEgPSBzZWxmLmFjY3VtdWxhdG9yIC8gc2VsZi50aW1lU3RlcDtcbiAgICBzZWxmLmVtaXQoJ3JlbmRlcicsIHNlbGYuZGVsdGFUaW1lLCBhbHBoYSwgc2VsZi5mcmFtZSwgc2VsZi50aW1lRWxhcHNlZCk7XG4gIH1cbn07XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQXQgbGVhc3QgZ2l2ZSBzb21lIGtpbmQgb2YgY29udGV4dCB0byB0aGUgdXNlclxuICAgICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LiAoJyArIGVyICsgJyknKTtcbiAgICAgICAgZXJyLmNvbnRleHQgPSBlcjtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2UgaWYgKGxpc3RlbmVycykge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKHRoaXMuX2V2ZW50cykge1xuICAgIHZhciBldmxpc3RlbmVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gICAgaWYgKGlzRnVuY3Rpb24oZXZsaXN0ZW5lcikpXG4gICAgICByZXR1cm4gMTtcbiAgICBlbHNlIGlmIChldmxpc3RlbmVyKVxuICAgICAgcmV0dXJuIGV2bGlzdGVuZXIubGVuZ3RoO1xuICB9XG4gIHJldHVybiAwO1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHJldHVybiBlbWl0dGVyLmxpc3RlbmVyQ291bnQodHlwZSk7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iLCJcbm1vZHVsZS5leHBvcnRzID0gUGl4ZWxBcnQ7XG5cbmZ1bmN0aW9uIFBpeGVsQXJ0KHJvd3MpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFBpeGVsQXJ0KSkgcmV0dXJuIG5ldyBQaXhlbEFydChyb3dzKTtcblxuICB0aGlzLl9wYWxldHRlID0ge307XG4gIHRoaXMuX3NjYWxlID0gMjtcbiAgdGhpcy5fcm93cyA9IFtdO1xuICB0aGlzLl9wb3MgPSB7IHg6IDAsIHk6IDAgfTtcblxuICBpZiAocm93cykgdGhpcy5hcnQocm93cyk7XG59XG5cblBpeGVsQXJ0LmFydCA9IFBpeGVsQXJ0LnByb3RvdHlwZS5hcnQgPSBmdW5jdGlvbihyb3dzKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBQaXhlbEFydCkpIHJldHVybiBuZXcgUGl4ZWxBcnQocm93cyk7XG4gIHRoaXMuX3Jvd3MgPSAnc3RyaW5nJyA9PT0gdHlwZW9mIHJvd3MgPyByb3dzLnNwbGl0KCdcXG4nKSA6IHJvd3M7XG4gIHJldHVybiB0aGlzO1xufTtcblxuUGl4ZWxBcnQucHJvdG90eXBlLnBhbGV0dGUgPSBmdW5jdGlvbihwYWxldHRlKSB7XG4gIHRoaXMuX3BhbGV0dGUgPSBwYWxldHRlO1xuICByZXR1cm4gdGhpcztcbn07XG5cblBpeGVsQXJ0LnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uKHNjYWxlKSB7XG4gIHRoaXMuX3NjYWxlID0gc2NhbGU7XG4gIHJldHVybiB0aGlzO1xufTtcblxuUGl4ZWxBcnQucHJvdG90eXBlLnBvcyA9IGZ1bmN0aW9uKHBvcykge1xuICB0aGlzLl9wb3MgPSBwb3M7XG4gIHJldHVybiB0aGlzO1xufTtcblxuUGl4ZWxBcnQucHJvdG90eXBlLnNpemUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICB3aWR0aDogdGhpcy5fcm93cy5yZWR1Y2UoZnVuY3Rpb24obWF4LCBjb2xzKSB7XG4gICAgICByZXR1cm4gTWF0aC5tYXgobWF4LCBjb2xzLmxlbmd0aCk7XG4gICAgfSwgMCkgKiB0aGlzLl9zY2FsZSxcbiAgICBoZWlnaHQ6IHRoaXMuX3Jvd3MubGVuZ3RoICogdGhpcy5fc2NhbGVcbiAgfTtcbn07XG5cblBpeGVsQXJ0LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oY3R4KSB7XG4gIHZhciBwID0gdGhpcy5fcG9zO1xuICB2YXIgcyA9IHRoaXMuX3NjYWxlO1xuICB2YXIgcm93cyA9IHRoaXMuX3Jvd3M7XG4gIGZvciAodmFyIGNvbHMsIHkgPSAwOyB5IDwgcm93cy5sZW5ndGg7IHkrKykge1xuICAgIGNvbHMgPSByb3dzW3ldO1xuICAgIGZvciAodmFyIGNvbCwgeCA9IDA7IHggPCBjb2xzLmxlbmd0aDsgeCsrKSB7XG4gICAgICBjb2wgPSBjb2xzW3hdO1xuICAgICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuX3BhbGV0dGVbY29sXSB8fCAndHJhbnNwYXJlbnQnO1xuICAgICAgY3R4LmZpbGxSZWN0KHgqcytwLngsIHkqcytwLnksIHMsIHMpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG4iLCJcbnZhciBzcHJpdGUgPSBleHBvcnRzO1xuXG4vLyBiYWxsXG5cbnNwcml0ZS5iYWxsID0gW1xuYFxcXG4gb3hcbnhvb29cbm9veG9cbiBvb1xcXG5gLGBcXFxuIHhvXG5vb29vXG54b3hvXG4gb29cXFxuYCxgXFxcbiB4b1xub29vb1xueG94b1xuIG9vXFxcbmBcbl07XG5cbnNwcml0ZS5iYWxsLnBhbGV0dGUgPSB7XG4gICdvJzogJyNmZmYnLFxuICAneCc6ICcjMDAwJ1xufTtcblxuLy8gYmFsbCBzaGFkb3dcblxuc3ByaXRlLmJhbGxfc2hhZG93ID0gW2BcXFxuIDc3N1xuNzc3NzdcbiA3NzdcXFxuYF07XG5cbnNwcml0ZS5iYWxsX3NoYWRvdy5wYWxldHRlID0ge1xuICAnNyc6ICdyZ2JhKDAsMCwwLDAuMyknXG59O1xuXG5zcHJpdGUucGxheWVyID0gW1xuXG4vLyAwOiBkb3duXG5gXFxcbiAgICB4eHhcbiAgIHh4eHh4XG4gIHh4Li4ueHhcbiAgeG94LnhveFxuICAgLi4uLi5cbiAgICAgLlxuICAgdHR0dHRcbiAgdCB0dHQgdFxuICAuIHR0dCAuXG4gICAgcHBwXG4gICAgLiAuXG4gICAgdCB0XG4gICBzcyBzc1xcXG5gLFxuXG4vLyAxOiBkb3duIHJpZ2h0XG5cbmBcXFxuICAgIHh4eFxuICAgeHh4eHhcbiAgeHguLi4uXG4gIHgub3gueG9cbiAgIC4uLi4uXG4gICAgIC5cbiAgIHR0dHRcbiAgdHR0dHRcbiAgLnR0dHRcbiAgICBwcHBcbiAgICAuIC5cbiAgICB0IHRcbiAgICBzc3NzXFxcbmAsXG5cbi8vIDI6IHJpZ2h0XG5gXFxcbiAgICB4eHhcbiAgIHh4eHh4XG4gIHh4eC4uLlxuICB4eC4ub3hcbiAgIHguLi4uXG4gICAgIC5cbiAgICB0dHRcbiAgIHR0dHRcbiAgIC50dHRcbiAgICBwcFxuICAgIC4uXG4gICAgdHRcbiAgICBzc3NcXFxuYCxcblxuLy8gMzogdXAgcmlnaHRcblxuYFxcXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eHh4eC5cbiAgeHh4eC5veFxuICAgeHguLi5cbiAgICAgLlxuICAgdHR0dFxuICAgdHR0dHRcbiAgIHR0dHQuXG4gICAgcHBwXG4gICAgLiAuXG4gICAgdCB0XG4gICAgc3Nzc1xcXG5gLFxuXG4vLyA0OiB1cFxuXG5gXFxcbiAgICB4eHhcbiAgIHh4eHh4XG4gIHh4eHh4eHhcbiAgeHh4eHh4eFxuICAgLnh4eC5cbiAgICAgLlxuICAgdHR0dHRcbiAgdCB0dHQgdFxuICAuIHR0dCAuXG4gICAgcHBwXG4gICAgLiAuXG4gICAgdCB0XG4gICBzcyBzc1xcXG5gLFxuXG4vLyA1OiBydW4gcmlnaHQgMVxuXG5gXFxcbiAgICB4eHhcbiAgIHh4eHh4XG4gIHh4eC4uLlxuICB4eC4ub3hcbiAgIHguLi4uXG4gICAgIC5cbiAgIHR0dHRcbiAgdHR0dHRcbiAgLiB0dHQuXG4gICAgcHBwXG4gIHN0dC4uXG4gIHMgICB0XG4gICAgICBzc1xcXG5gLFxuXG4vLyA2OiBydW4gcmlnaHQgMlxuXG5gXFxcbiAgICB4eHhcbiAgIHh4eHh4XG4gIHh4eC4uLlxuICB4eC4ub3hcbiAgIHguLi4uXG4gICAgIC5cbiAgICB0dHRcbiAgIHR0dHQuXG4gICB0LnR0XG4gICAgcHBcbiAgICAuLlxuICAgIHR0XG4gICAgc3NzXFxcbmAsXG5cbi8vIDc6IHJ1biByaWdodCAzXG5cbmBcXFxuICAgIHh4eFxuICAgeHh4eHhcbiAgeHh4Li4uXG4gIHh4Li5veFxuICAgeC4uLi5cbiAgICAgLlxuICAgIHR0dFxuICAgdHR0dFxuICAgdHQudFxuICAgIHBwcFxuICBzdHQuLlxuICBzICAgdFxuICAgICAgc3NcXFxuYCxcblxuLy8gODogcnVuIGRvd24gMVxuXG5gXFxcbiAgICB4eHhcbiAgIHh4eHh4XG4gIHh4Li4ueHhcbiAgeG94LnhveFxuICAgLi4uLi5cbiAgICAgLlxuICAgdHR0dHRcbiAgdCB0dHQgdFxuICAuIHR0dCAuXG4gICAgcHBwXG4gICAgLiAuXG4gICAgdCB0XG4gICAgcyBzXFxcbmAsXG5cbi8vIDk6IHJ1biBkb3duIDJcblxuYFxcXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eC4uLnh4XG4gIHhveC54b3hcbiAgIC4uLi4uXG4gICB0IC5cbiAgLnR0dHRcbiAgICB0dHR0XG4gICAgdHR0dFxuICAgIHBwcC5cbiAgICAuIHRcbiAgICAuIHNcbiAgICB0XG4gICAgc1xcXG5gLFxuXG4vLyAxMDogcnVuIGRvd24gcmlnaHQgMVxuXG5gXFxcbiAgICB4eHhcbiAgIHh4eHh4XG4gIHh4Li4uLlxuICB4Lm94LnhvXG4gICAuLi4uLlxuICAgICAuXG4gIHR0dHR0XG4gLiB0dHR0XG4gICB0dHR0LlxuICAgIHBwcFxuICBzdC4uLlxuICBzICBzdFxuICAgICAgc1xcXG5gLFxuXG4vLyAxMTogcnVuIGRvd24gcmlnaHQgMlxuXG5gXFxcbiAgICB4eHhcbiAgIHh4eHh4XG4gIHh4Li4uLlxuICB4Lm94LnhvXG4gICAuLi4uLlxuICAgICAuXG4gICB0dHR0XG4gICB0dHR0XG4gICB0LnR0XG4gICAgcHBwXG4gICAgLi4uXG4gIHN0IHRcbiAgIHMgc3NcXFxuYCxcblxuLy8gMTI6IHJ1biBkb3duIHJpZ2h0IDNcblxuYFxcXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eC4uLi5cbiAgeC5veC54b1xuICAgLi4uLi5cbiAgICAgLlxuIC50dHR0dFxuICAgdHR0dC5cbiAgIHR0dHRcbiAgICBwcHBcbiAgc3QuLi5cbiAgcyAgICB0XG4gICAgICAgc3NcXFxuYCxcblxuLy8gMTM6IHJ1biB1cCByaWdodCAxXG5cbmBcXFxuICAgIHh4eFxuICAgeHh4eHhcbiAgeHh4eHguXG4gIHh4eHgub3hcbiAgIHh4Li4uXG4gICAgIC5cbiAgdHR0dHRcbiAgLnR0dHR0LlxuICAgdHR0dFxuICAgIHBwcFxuICBzdC4uLlxuICBzICB0XG4gICAgIHNzXFxcbmAsXG5cbi8vIDE0OiBydW4gdXAgcmlnaHQgMlxuXG5gXFxcbiAgICB4eHhcbiAgIHh4eHh4XG4gIHh4eHh4LlxuICB4eHh4Lm94XG4gICB4eC4uLlxuICAgICAuXG4gICB0dHR0XG4gIHR0dHR0XG4gIC50dHQuXG4gICAgcHBwXG4gICAgLi4uXG4gICBzdCB0XG4gICAgcyBzc1xcXG5gLFxuXG4vLyAxNTogcnVuIHVwIHJpZ2h0IDNcblxuYFxcXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eHh4eC5cbiAgeHh4eC5veFxuICAgeHguLi5cbiAgICAgLlxuICAgdHR0dFxuICB0dHR0dC5cbiAgIHR0dHRcbiAgICBwcHBcbiAgc3QuLi5cbiAgcyAgICB0c1xuICAgICAgIHNcXFxuYCxcblxuXG4vLyAxNjogcnVuIHVwIDFcblxuYFxcXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eHh4eHh4XG4gIHh4eHh4eHhcbiAgIC54eHguXG4gICAgIC5cbiAgIHR0dHR0XG4gIHQgdHR0IHRcbiAgLiB0dHQgLlxuICAgIHBwcFxuICAgIC4gLlxuICAgIHQgdFxuICAgIHMgc1xcXG5gLFxuXG4vLyAxNzogcnVuIHVwIDJcblxuYFxcXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eHh4eHh4XG4gIHh4eHh4eHhcbiAgIC54eHguXG4gICAgIC5cbiAgLnR0dHRcbiAgICB0dHR0XG4gICAgdHR0dFxuICAgIHBwcC5cbiAgICAuIHRcbiAgICAuIHNcbiAgICB0XG4gICAgc1xcXG5gLFxuXTtcblxuc3ByaXRlLnBsYXllci5hbmltYXRpb24gPSB7fTtcbnNwcml0ZS5wbGF5ZXIuYW5pbWF0aW9uLnJvdGF0ZSA9IFswLDEsMiwzLDQsMywyLDFdO1xuc3ByaXRlLnBsYXllci5hbmltYXRpb24ucm90YXRlLm1pcnJvcl94ID0gWzUsNiw3XTtcbnNwcml0ZS5wbGF5ZXIuYW5pbWF0aW9uLnJ1bl9yaWdodCA9IFs3LDYsNSwyXTtcbnNwcml0ZS5wbGF5ZXIuYW5pbWF0aW9uLnJ1bl9yaWdodC5taXJyb3JfeCA9IFtdO1xuc3ByaXRlLnBsYXllci5hbmltYXRpb24ucnVuX2xlZnQgPSBbNyw2LDUsMl07XG5zcHJpdGUucGxheWVyLmFuaW1hdGlvbi5ydW5fbGVmdC5taXJyb3JfeCA9IFswLDEsMiwzXTtcbnNwcml0ZS5wbGF5ZXIuYW5pbWF0aW9uLnJ1bl9kb3duID0gWzgsOSw4LDldO1xuc3ByaXRlLnBsYXllci5hbmltYXRpb24ucnVuX2Rvd24ubWlycm9yX3ggPSBbM107XG5zcHJpdGUucGxheWVyLmFuaW1hdGlvbi5ydW5fdXAgPSBbMTYsMTcsMTYsMTddO1xuc3ByaXRlLnBsYXllci5hbmltYXRpb24ucnVuX3VwLm1pcnJvcl94ID0gWzNdO1xuc3ByaXRlLnBsYXllci5hbmltYXRpb24ucnVuX2Rvd25fcmlnaHQgPSBbMTEsMTIsMTAsMV07XG5zcHJpdGUucGxheWVyLmFuaW1hdGlvbi5ydW5fZG93bl9yaWdodC5taXJyb3JfeCA9IFtdO1xuc3ByaXRlLnBsYXllci5hbmltYXRpb24ucnVuX3VwX3JpZ2h0ID0gWzEzLDE0LDE1LDNdO1xuc3ByaXRlLnBsYXllci5hbmltYXRpb24ucnVuX3VwX3JpZ2h0Lm1pcnJvcl94ID0gW107XG5zcHJpdGUucGxheWVyLmFuaW1hdGlvbi5ydW5fZG93bl9sZWZ0ID0gWzExLDEyLDEwLDFdO1xuc3ByaXRlLnBsYXllci5hbmltYXRpb24ucnVuX2Rvd25fbGVmdC5taXJyb3JfeCA9IFswLDEsMiwzXTtcbnNwcml0ZS5wbGF5ZXIuYW5pbWF0aW9uLnJ1bl91cF9sZWZ0ID0gWzEzLDE0LDE1LDNdO1xuc3ByaXRlLnBsYXllci5hbmltYXRpb24ucnVuX3VwX2xlZnQubWlycm9yX3ggPSBbMCwxLDIsM107XG5zcHJpdGUucGxheWVyLnBhbGV0dGUgPSB7XG4gICd4JzogJyMwMDAnLFxuICAndic6ICcjNDQ0JyxcbiAgJ28nOiAnI2ZmZicsXG4gICcuJzogJyNmOTEnLFxuICAndCc6ICcjMDBmJyxcbiAgJ3AnOiAnI2ZmZicsXG4gICdzJzogJyMwMDAnLFxuICAnNyc6ICdyZ2JhKDAsMCwwLDAuMyknLFxufTtcblxuc3ByaXRlLnBsYXllci53aWR0aCA9IDExO1xuc3ByaXRlLnBsYXllci5oZWlnaHQgPSAxNDtcbnNwcml0ZS5zY2FsZSA9IDM7XG4iXX0=
