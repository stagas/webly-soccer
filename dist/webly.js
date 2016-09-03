(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.WeblySoccer = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
// player.pos.y = player.px.y = 1700 / 2 - player.height * player.scale;
player.pos.y = player.px.y = 500;
player.pos.x = player.px.x = 500;

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

},{"./lib/arrows":2,"./lib/loop":3,"./src/camera":8,"./src/player":9,"./src/stadium":11,"./style.css":12}],2:[function(require,module,exports){

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
    event.preventDefault();
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
    event.preventDefault();
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

},{}],3:[function(require,module,exports){

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
  this.timeStep = 1000 / this._fps;
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

},{"events":6}],4:[function(require,module,exports){

module.exports = function(target, src) {
  for (var key in src) {
    target[key] = src[key];
  }
  return target;
};

},{}],5:[function(require,module,exports){

module.exports = Point;

function Point() {
  this.x = 0;
  this.y = 0;
}

Point.prototype.toString = function() {
  return this.x + ',' + this.y;
};

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){

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

},{}],8:[function(require,module,exports){
var Point = require('../lib/point');

module.exports = Camera;

function Camera(leader) {
  this.leader = leader;
  this.speed = 0.14;
  this.friction = 0.55;
  this.px = new Point;
  this.pos = new Point;
  this.vel = new Point;
  this.size = new Point;
  this.onresize();
  window.onresize = this.onresize.bind(this);
}

Camera.prototype.onresize = function() {
  this.size.x = window.innerWidth;
  this.size.y = window.innerHeight;
};

Camera.prototype.update = function() {
  var dx = (this.leader.pos.x + this.leader.width * this.leader.scale / 2 - this.size.x / 2) - this.pos.x;
  var dy = (this.leader.pos.y + this.leader.height * this.leader.scale / 2 - this.size.y / 2) - this.pos.y;

  if (Math.abs(dx) < 1) dx = 0;
  if (Math.abs(dy) < 1) dy = 0;

  this.vel.x += dx * this.speed;
  this.vel.y += dy * this.speed;

  this.pos.x += this.vel.x;
  this.pos.y += this.vel.y;

  this.vel.x *= this.friction;
  this.vel.y *= this.friction;
};

Camera.prototype.render = function(dt, alpha) {
  this.px.x += (this.pos.x - this.px.x) * alpha;
  this.px.y += (this.pos.y - this.px.y) * alpha;

  window.scrollTo(this.px.x, this.px.y);
};

},{"../lib/point":5}],9:[function(require,module,exports){
var sprite = require('./sprite');

module.exports = Player;

function Player() {
  Object.assign(this, sprite.create('player', true));

  this.speed = 19;
  this.face = 'stand_down';
  this.faceDuration = 4;
  this.faceIndex = 0;
  this.faceNeedle = 0;
  this.faceMap = {
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
  this.faceStandMap = {
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
}

Player.prototype.move = function(x, y){
  this.vel.x |= x;
  this.vel.y |= y;
};

Player.prototype.update = function() {
  this.face = this.faceMap[this.vel];
  this.faceStandMap['0,0'] =
  this.faceMap['0,0'] = this.faceStandMap[this.vel];

  var speed = this.speed;
  if (this.vel.x && this.vel.y) speed *= 0.75;

  this.pos.x += this.vel.x * speed | 0;
  this.pos.y += this.vel.y * speed | 0;
  this.vel.x = 0;
  this.vel.y = 0;
};

Player.prototype.render = function(dt, alpha) {
  this.px.x += (this.pos.x - this.px.x) * alpha;
  this.px.y += (this.pos.y - this.px.y) * alpha;

  var i = this.faceIndex;
  var n = this.faceNeedle;
  n %= this.animation[this.face].length;

  var index = this.animation[this.face][n];
  var x = index[0] * this.width * this.scale;
  var y = index[1] ? this.height * this.scale + this.scale : 0;
  this.faceIndex = (i + 1) % this.faceDuration;
  if (this.faceIndex === 0) this.faceNeedle = n + 1;

  Object.assign(this.el.style, {
    left: this.px.x + 'px',
    top: this.px.y + 'px',
    backgroundPosition: `-${x}px -${y}px`,
  });
};

},{"./sprite":10}],10:[function(require,module,exports){
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

sprite.player.shadow = function makeShadow(art) {
  if ('string' === typeof art) art = art.split('\n');
  art = art.slice();
  var flipped = art.slice().reverse();
  var regexp = /[^ ]/g;
  var size = 0;
  var skewX = 1;
  var skewY = 1.3;
  var shortX = 0;
  var width = 0;
  for (var i = 0; i < flipped.length; i += skewY) {
    size++;
    skewY += 1.2;
    skewX += 1;
    shortX += 0.52;
    if (shortX > 1.5) regexp = /[^ ]{1,2}/g;
    if (shortX > 2.5) regexp = /[^ ]{1,3}/g;
    var row = new Array(skewX | 0).join(' ') + flipped[i | 0].replace(regexp, () => '%');
    width = row.length;
    art.push(row);
  }
  return art;
};

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

sprite.center_spot = [`\

  xox
 xooox
 xooox
  xox
\
`]

sprite.center_spot.palette = {
  'o': '#fff',
  'x': 'rgba(255,255,255,.5)'
};
sprite.center_spot.width = 7;
sprite.center_spot.height = 6;
sprite.center_spot.scale = sprite.scale;

sprite.goal_nets = [
`\
    ;xxxxxxxxxxxxxx
   ;vx;x;x;x/x/x/xx
   v;xx;x/x/x/x/x/x
  ;v;x/x/x/x/x/x/xx
  vv/xx/x/x/x/x/x/x
 ;v;vx/x/x/x/x/x/xx
 v;v/xx/x/x/x/x/x/x
;vv/vx/x/x/x/x/x/xx
vv;v;xx/x/x/x/x;x;x
v;v;vx;x;x;x;x;x;xx
vv.v.xx.x.x.x.x.x.x
v;v.vx.x.x.x.x.x.xx
vv.v;xx.x.x.x.x.x.x
v;v;vx.x.x.x.x.x.xx
vv.v;xx.x.x.x.x.x.x
v.v.vx.x.x.x.x.x.xx
vv.v.xx.x.x.x.x.x.x
v;v.vx.x.x.x.x.x.xx
vv.v.xx.x.x.x.x.x.x
v.v.vx.x.x.x.x.x.xx
vv.v.xx.x.x.x.x.x.x
v.v.vx.x.x.x.x.x.xx
vv.v.xx.x.x.x.x.x.x
v;v.vx.x.x.x.x.x.xx
vv.v.xx.x.x.x.x.x.x
v;v.vx.x.x.x.x.x.xx
vv.v.xx.x.x.x.x.x.x
v.v.vx.x.x.x.x.x.xx
vv.v.xx.x.x.x.x.x.x
v.v.vx.x.x.x.x.x.xx
vv.v.xx.x.x.x.x.x.x
v.v.vx.x.x.x.x.x.xx
vv.v.xx.x.x.x.x.x.x
v;v.vx.x.x.x.x.x.xx
vv.v.xx.x.x.x.x.x.x
v;v.vx.x.x.x.x.x.xx
vv.v.xx.x.x.x.x.x.x
v;v;vx.x.x.x.x.x.xx
vv.v.xx.x.x.x.x.x.x
v.v.vx.x.x.x.x.x.xx
vv.v.xx.x.x.x.x.x.x
v;v.vx.x.x.x.x.x.xx
vv;v.xx.x.x.x.x.x.x
v;v.vx.x.x.x.x.x.xx
vv.v.xx.x.x.x.x.x.x
v.v.vx.x.x.x.x.x.xx
vv.v;xxxxxxxxxxxxxx
v.v.xx;x;x.x.x.x.xx
vv.xx;x.x.x.x.x.x.x
v;xx;x.x.x.x.x.x.xx
vx;xx.x.x.x.x.x.x;x
v;xx.x.x.x.x.x.x;xx
vxx;x.x.x.x.x.x.x;x
vxxx.x.x.x.x.x.x;xx
vxx;x.x.x.x;x.x;x;x
xxxxxxxxxxxxxxxxxxx\
`,
];

sprite.goal_nets.shadow = function makeShadow(art) {
  if ('string' === typeof art) art = art.split('\n');
  art = art.slice();
  for (var i = 0; i < art.length; i++) {
    art[i] = art[i].trimRight();
  }
  var f = true;
  art[10] += '%'
  art[11] += ' %'
  art[12] += '% %'
  art[13] += ' % %'
  art[14] += '% % %'
  for (var i = 15; i < art.length; i++) {
    art[i] += (f ? ' ' : '') + '% % %' + (f ? '' : '%');
    f = !f;
  }
  var width = 24;
  var line = [];
  for (var i = 0; i < width; i++) {
    line[i] = f ? '%' : ' ';
    f = !f;
  }
  for (var i = 0; i < 3; i++) {
    art.push(new Array(20 + i).join(' ') + line.slice(0, line.length - i).join('') + '%');
  }
  art.push(new Array(20 + i + 1).join(' ') + '%%%%%%%%%%%%%%%%%%%%%')
  return art;
};

sprite.goal_nets.palette = {
  'x': '#fff',
  'v': '#ddd',
  ';': 'rgba(200,200,200,.6)',
  '.': 'rgba(150,150,150,.5)',
  '/': 'rgba(180,180,180,.6)',
  '3': 'rgba(0,0,0,.2)',
  '8': 'rgba(0,0,0,.25)',
};
sprite.goal_nets.width = sprite.goal_nets[0].split('\n')[0].length;
sprite.goal_nets.height = sprite.goal_nets[0].split('\n').length;
sprite.goal_nets.left = sprite.goal_nets.width;
sprite.goal_nets.top = (sprite.goal_nets.height / 2 | 0) + 3;
sprite.goal_nets.scale = sprite.scale;

sprite.corner_flag = [`\
gb
ggb
gggb
x
x
x
x
777
  77

\
`]

sprite.corner_flag.palette = {
  'x': '#ccc',
  'g': '#f00',
  'b': '#c20',
  ';': 'rgba(255,255,255,.1)',
  '7': 'rgba(0,0,0,.25)',
};
sprite.corner_flag.width = 5;
sprite.corner_flag.height = sprite.corner_flag[0].split('\n').length - 1;
sprite.corner_flag.scale = sprite.scale;

sprite.create = function createSprite(name) {
  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');
  var s = sprite[name];

  if (s.shadow) {
    s.palette['%'] = 'rgba(0,0,0,.25)';
    var padded = s
      .map(art => 'string' === typeof art ? art.split('\n') : art)
      .map(art => art.map(row => new Array(s.width + 1).join(' ') + row));

    padded.animation = s.animation;
    padded.shadow = s.shadow;
    padded.width = s.width * 3;
    padded.height = s.height * 2;
    padded.left = s.left + s.width / 3 | 0;
    padded.top = s.top;
    padded.palette = s.palette;
    padded.scale = s.scale;
    s = padded;
  }

  canvas.width = s.length * s.width * s.scale;
  canvas.height = s.scale * 2 + s.height * s.scale * 2;

  // normal
  s.forEach((art, index) => {
    if (s.shadow) art = s.shadow(art);
    pixel.art(art)
    .palette(s.palette)
    .scale(s.scale).pos({
      x: s.width * s.scale * index,
      y: 0
    })
    .draw(context);
  });

  // mirror x
  s.forEach((art, index) => {
    if ('string' === typeof art) art = art.split('\n');
    art = art.map(row => padRight(row, s.width).split('').reverse().join(''));
    if (s.shadow) art = s.shadow(art);
    pixel.art(art)
    .palette(s.palette)
    .scale(s.scale).pos({
      x: s.width * s.scale * index,
      y: s.height * s.scale + s.scale
    })
    .draw(context);
  });

  var dataURL = canvas.toDataURL();
  var div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.background = `url(${dataURL}) 0 0 no-repeat`;
  div.style.width = s.scale * s.width + 'px';
  div.style.height = s.scale * s.height + 'px';
  if (s.top) div.style.marginTop = -(s.scale * s.top) + 'px';
  return merge({
    el: div,
    px: new Point,
    pos: new Point,
    vel: new Point,
  }, s);
};

function padRight(s, n) {
  n = Math.max(n, s.length - 1);
  return s + new Array(n - s.length + 1).join(' ');
}

},{"../lib/merge":4,"../lib/point":5,"pixel-art":7}],11:[function(require,module,exports){
var css = require('../style.css');
var sprite = require('./sprite');

module.exports = Stadium;

function Stadium() {
  this.el = document.createElement('div');
  this.el.className = css.stadium;

  var grass = createGrass();
  this.el.style.background = 'url(' + grass.toDataURL() + ') -60px 0px';

  this.pitch = document.createElement('div');
  this.pitch.className = css.pitch;
  this.el.appendChild(this.pitch);

  this.halfwayLine = document.createElement('div');
  this.halfwayLine.className = css['halfway-line'];
  this.pitch.appendChild(this.halfwayLine);

  this.centerCircle = createCenterCircle();
  this.centerCircle.className = css['center-circle'];
  this.pitch.appendChild(this.centerCircle);

  this.centerSpot = sprite.create('center_spot');
  this.centerSpot.el.className = css['center-spot'];
  this.pitch.appendChild(this.centerSpot.el);

  this.penaltyArcLeft = createCenterCircle({ x: 'Left', y: 'Top' }, 0.85, 5.43);
  this.penaltyArcLeft.className = css['penalty-arc-left'];
  this.pitch.appendChild(this.penaltyArcLeft);

  this.penaltySpotLeft = sprite.create('center_spot');
  this.penaltySpotLeft.el.className = css['penalty-spot-left'];
  this.pitch.appendChild(this.penaltySpotLeft.el);

  this.penaltyArcRight = createCenterCircle({ x: 'Right', y: 'Top' }, 4, 2.29);
  this.penaltyArcRight.className = css['penalty-arc-right'];
  this.pitch.appendChild(this.penaltyArcRight);

  this.penaltySpotRight = sprite.create('center_spot');
  this.penaltySpotRight.el.className = css['penalty-spot-right'];
  this.pitch.appendChild(this.penaltySpotRight.el);

  this.penaltyAreaLeft = document.createElement('div');
  this.penaltyAreaLeft.className = css['penalty-area-left'];
  this.pitch.appendChild(this.penaltyAreaLeft);

  this.penaltyAreaRight = document.createElement('div');
  this.penaltyAreaRight.className = css['penalty-area-right'];
  this.pitch.appendChild(this.penaltyAreaRight);

  this.goalAreaLeft = document.createElement('div');
  this.goalAreaLeft.className = css['goal-area-left'];
  this.pitch.appendChild(this.goalAreaLeft);

  this.goalAreaRight = document.createElement('div');
  this.goalAreaRight.className = css['goal-area-right'];
  this.pitch.appendChild(this.goalAreaRight);

  this.cornerArcTopLeft = createCenterCircle({ x: 'Left', y: 'Top' }, 0, 2 * Math.PI, 24);
  this.cornerArcTopLeft.className = css['corner-arc-top-left'];
  this.pitch.appendChild(this.cornerArcTopLeft);

  this.cornerArcBottomLeft = createCenterCircle({ x: 'Left', y: 'Bottom' }, 0, 2 * Math.PI, 24);
  this.cornerArcBottomLeft.className = css['corner-arc-bottom-left'];
  this.pitch.appendChild(this.cornerArcBottomLeft);

  this.cornerArcTopRight = createCenterCircle({ x: 'Right', y: 'Top' }, 0, 2 * Math.PI, 24);
  this.cornerArcTopRight.className = css['corner-arc-top-right'];
  this.pitch.appendChild(this.cornerArcTopRight);

  this.cornerArcBottomRight = createCenterCircle({ x: 'Right', y: 'Bottom' }, 0, 2 * Math.PI, 24);
  this.cornerArcBottomRight.className = css['corner-arc-bottom-right'];
  this.pitch.appendChild(this.cornerArcBottomRight);

  this.goalNetsLeft = sprite.create('goal_nets');
  this.goalNetsLeft.el.className = css['goal-nets-left'];
  this.el.appendChild(this.goalNetsLeft.el);

  this.goalNetsRight = sprite.create('goal_nets');
  this.goalNetsRight.el.className = css['goal-nets-right'];
  this.el.appendChild(this.goalNetsRight.el);
  this.goalNetsRight.el.style.backgroundPosition = '0 ' + (-(this.goalNetsRight.height * this.goalNetsRight.scale + 3)) + 'px';

  this.cornerFlagTopLeft = sprite.create('corner_flag');
  this.cornerFlagTopLeft.el.className = css['corner-flag-top-left'];
  this.el.appendChild(this.cornerFlagTopLeft.el);
  this.cornerFlagTopLeft.el.style.marginTop = -((this.cornerFlagTopLeft.height) * this.cornerFlagTopLeft.scale) + 'px';

  this.cornerFlagBottomLeft = sprite.create('corner_flag');
  this.cornerFlagBottomLeft.el.className = css['corner-flag-bottom-left'];
  this.el.appendChild(this.cornerFlagBottomLeft.el);
  // this.cornerFlagBottomLeft.el.style.marginTop = +(3 * this.cornerFlagBottomLeft.scale) + 'px';

  this.cornerFlagTopRight = sprite.create('corner_flag');
  this.cornerFlagTopRight.el.className = css['corner-flag-top-right'];
  this.el.appendChild(this.cornerFlagTopRight.el);
  this.cornerFlagTopRight.el.style.marginTop = -((this.cornerFlagTopRight.height) * this.cornerFlagTopRight.scale) + 'px';

  this.cornerFlagBottomRight = sprite.create('corner_flag');
  this.cornerFlagBottomRight.el.className = css['corner-flag-bottom-right'];
  this.el.appendChild(this.cornerFlagBottomRight.el);
  // this.cornerFlagBottomRight.el.style.marginTop = -((this.cornerFlagBottomRight.height) * this.cornerFlagBottomRight.scale) + 'px';
}

function createCenterCircle(side, a, b, c) {
  var canvas = document.createElement('canvas');
  canvas.width = canvas.height = c || 124;
  var context = canvas.getContext('2d');
  var centerX = canvas.width / 2;
  var centerY = canvas.height / 2;
  var radius = canvas.width / 2.4;

  context.imageSmoothingEnabled = false;

  context.beginPath();
  context.arc(centerX, centerY, radius, a || 0, b || (2 * Math.PI), true);
  context.lineWidth = 1;
  context.strokeStyle = '#fff';
  context.stroke();

  var png = document.createElement('img');
  png.src = canvas.toDataURL('image/png');

  var second = document.createElement('canvas');
  second.width = second.height = canvas.width * 3;
  second.style['margin' + (side ? side.x : 'Left')] = -(canvas.width * 3 / 2) + 'px';
  second.style['margin' + (side ? side.y : 'Top')] = -(canvas.width * 3 / 2) + 'px';
  var ctx = second.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(png, 0, 0, canvas.width * 3, canvas.height * 3);
  return second;
}

function createGrass() {
  var canvas = document.createElement('canvas');
  canvas.height = 60;
  canvas.width = canvas.height * 2;
  var context = canvas.getContext('2d');
  context.fillStyle = '#090';
  context.fillRect(0,0,canvas.width/2,canvas.height);
  context.fillStyle = '#080';
  context.fillRect(canvas.width/2,0,canvas.width/2,canvas.height);
  for (var i = 2500; i--;) {
    context.fillStyle = 'rgba(0,0,0,0.035)';
    var x = Math.random() * canvas.width | 0;
    var y = Math.random() * canvas.height | 0;
    context.fillRect(x,y,1,1);
  }
  for (var i = 500; i--;) {
    context.fillStyle = 'rgba(0,255,0,0.05)';
    var x = Math.random() * canvas.width | 0;
    var y = Math.random() * canvas.height | 0;
    context.fillRect(x,y,1,1);
  }

  var png = document.createElement('img');
  png.src = canvas.toDataURL('image/png');

  var second = document.createElement('canvas');
  second.width = canvas.width * 3;
  second.height = canvas.height * 3;
  var ctx = second.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(png, 0, 0, canvas.width * 3, canvas.height * 3);

  return second;
}

},{"../style.css":12,"./sprite":10}],12:[function(require,module,exports){
module.exports = {"stadium":"_style__stadium","pitch":"_style__pitch","halfway-line":"_style__halfway-line","center-circle":"_style__center-circle","center-spot":"_style__center-spot","penalty-arc-left":"_style__penalty-arc-left","penalty-spot-left":"_style__penalty-spot-left","penalty-arc-right":"_style__penalty-arc-right","penalty-spot-right":"_style__penalty-spot-right","penalty-area-left":"_style__penalty-area-left","penalty-area-right":"_style__penalty-area-right","goal-area-left":"_style__goal-area-left","goal-area-right":"_style__goal-area-right","corner-arc-bottom-left":"_style__corner-arc-bottom-left","corner-arc-top-right":"_style__corner-arc-top-right","corner-arc-bottom-right":"_style__corner-arc-bottom-right","goal-nets-left":"_style__goal-nets-left","goal-nets-right":"_style__goal-nets-right","corner-flag-top-left":"_style__corner-flag-top-left","corner-flag-bottom-left":"_style__corner-flag-bottom-left","corner-flag-top-right":"_style__corner-flag-top-right","corner-flag-bottom-right":"_style__corner-flag-bottom-right"}
},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsImxpYi9hcnJvd3MuanMiLCJsaWIvbG9vcC5qcyIsImxpYi9tZXJnZS5qcyIsImxpYi9wb2ludC5qcyIsIm5vZGVfbW9kdWxlcy9ldmVudHMvZXZlbnRzLmpzIiwibm9kZV9tb2R1bGVzL3BpeGVsLWFydC9pbmRleC5qcyIsInNyYy9jYW1lcmEuanMiLCJzcmMvcGxheWVyLmpzIiwic3JjL3Nwcml0ZS5qcyIsInNyYy9zdGFkaXVtLmpzIiwic3R5bGUuY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4cEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDektBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInJlcXVpcmUoJy4vc3R5bGUuY3NzJyk7XG52YXIgTG9vcCA9IHJlcXVpcmUoJy4vbGliL2xvb3AnKTtcbnZhciBhcnJvd3MgPSByZXF1aXJlKCcuL2xpYi9hcnJvd3MnKTtcbnZhciBTdGFkaXVtID0gcmVxdWlyZSgnLi9zcmMvc3RhZGl1bScpO1xudmFyIENhbWVyYSA9IHJlcXVpcmUoJy4vc3JjL2NhbWVyYScpO1xudmFyIFBsYXllciA9IHJlcXVpcmUoJy4vc3JjL3BsYXllcicpO1xuXG52YXIgayA9IGFycm93cyhkb2N1bWVudC5ib2R5KTtcblxudmFyIHN0YWRpdW0gPSBuZXcgU3RhZGl1bTtcbnZhciBwbGF5ZXIgPSBuZXcgUGxheWVyO1xudmFyIGNhbWVyYSA9IG5ldyBDYW1lcmEocGxheWVyKTtcbmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc3RhZGl1bS5lbCk7XG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHBsYXllci5lbCk7XG4vLyBwbGF5ZXIucG9zLnggPSBwbGF5ZXIucHgueCA9IDIzMDAgLyAyIC0gcGxheWVyLndpZHRoICogcGxheWVyLnNjYWxlIC8gMjtcbi8vIHBsYXllci5wb3MueSA9IHBsYXllci5weC55ID0gMTcwMCAvIDIgLSBwbGF5ZXIuaGVpZ2h0ICogcGxheWVyLnNjYWxlO1xucGxheWVyLnBvcy55ID0gcGxheWVyLnB4LnkgPSA1MDA7XG5wbGF5ZXIucG9zLnggPSBwbGF5ZXIucHgueCA9IDUwMDtcblxuLyogbG9vcCAqL1xuXG52YXIgbG9vcCA9IG5ldyBMb29wO1xuXG5sb29wLm9uKCd1cGRhdGUnLCAoKSA9PiB7XG4gIGNvbnRyb2xzKCk7XG4gIHVwZGF0ZSgpO1xufSk7XG5cbmxvb3Aub24oJ3JlbmRlcicsIHJlbmRlcik7XG5cbmxvb3AuZnBzKDE0KS5zdGFydCgpO1xuXG5mdW5jdGlvbiB1cGRhdGUoKSB7XG4gIHBsYXllci51cGRhdGUoKTtcbiAgY2FtZXJhLnVwZGF0ZSgpO1xufVxuXG5mdW5jdGlvbiByZW5kZXIoZHQsIGFscGhhLCBmcmFtZSwgZWxhcHNlZCkge1xuICBwbGF5ZXIucmVuZGVyKGR0LCBhbHBoYSk7XG4gIGNhbWVyYS5yZW5kZXIoZHQsIGFscGhhKVxufVxuXG5mdW5jdGlvbiBjb250cm9scygpIHtcbiAgayAmIGsubGVmdCAgJiYgcGxheWVyLm1vdmUoLTEsMCk7XG4gIGsgJiBrLnVwICAgICYmIHBsYXllci5tb3ZlKDAsLTEpO1xuICBrICYgay5yaWdodCAmJiBwbGF5ZXIubW92ZSgxLDApO1xuICBrICYgay5kb3duICAmJiBwbGF5ZXIubW92ZSgwLDEpO1xufVxuIiwiXG4vKiFcbiAqXG4gKiBhcnJvd3NcbiAqXG4gKiBNSVRcbiAqXG4gKi9cblxuLyoqXG4gKiBDb250cm9sIGZsYWdzLlxuICovXG5cbnZhciBjdHJsID0ge1xuICBsZWZ0OiAgMSxcbiAgdXA6ICAgIDIsXG4gIHJpZ2h0OiA0LFxuICBkb3duOiAgOCxcbiAgc2hvb3Q6IDE2XG59O1xuXG4vKipcbiAqIE9wcG9zaXRlIGRpcmVjdGlvbnMgZmxhZ3MuXG4gKi9cblxudmFyIG9wcCA9IHtcbiAgMTogNCxcbiAgMjogOCxcbiAgNDogMSxcbiAgODogMlxufTtcblxuLyoqXG4gKiBLZXltYXAuXG4gKi9cblxudmFyIG1hcCA9IHtcbiAgMzc6IGN0cmwubGVmdCxcbiAgMzg6IGN0cmwudXAsXG4gIDM5OiBjdHJsLnJpZ2h0LFxuICA0MDogY3RybC5kb3duLFxuICAxNjogY3RybC5zaG9vdCwgLy8gc2hpZnRcbiAgMTc6IGN0cmwuc2hvb3QsIC8vIGN0cmxcbiAgODg6IGN0cmwuc2hvb3QsIC8vIHhcbiAgOTA6IGN0cmwuc2hvb3QgIC8vIHpcbn07XG5cbi8qKlxuICogQXJyb3dzLlxuICpcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlbCl7XG4gIC8vIGJpdG1hc2tzXG4gIHZhciBkb3duID0gMDtcbiAgdmFyIGtleXMgPSAwO1xuXG4gIHZhciBhcnJvd3MgPSB7fTtcblxuICBlbC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgb25rZXlkb3duKTtcbiAgZWwuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBvbmtleXVwKTtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYGtleXNgIGJpdG1hc2sgd2hlbiBldmFsdWF0ZWQsXG4gICAqIHRvIHVzZSB3aXRoIGxvZ2ljYWwgb3BlcmF0aW9ucy5cbiAgICpcbiAgICogQHJldHVybiB7TnVtYmVyfSBrZXlzXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFycm93cy52YWx1ZU9mID0gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4ga2V5cztcbiAgfTtcblxuICAvLyBtZXJnZSBjb250cm9sIGZsYWdzIHRvXG4gIC8vIHVzZSB3aXRoIGxvZ2ljYWwgb3BlcmF0aW9uc1xuICAvLyBpLmU6IGFycm93cyAmIGFycm93cy5sZWZ0ICYmIGxlZnQoKVxuICBtZXJnZShhcnJvd3MsIGN0cmwpO1xuXG4gIHJldHVybiBhcnJvd3M7XG5cbiAgLyoqXG4gICAqIEtleWRvd24gaGFuZGxlci5cbiAgICpcbiAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGtleVxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG5cbiAgZnVuY3Rpb24gb25rZXlkb3duKGV2ZW50KXtcbiAgICBrZXkgPSBldmVudC53aGljaDtcbiAgICBpZiAoIShrZXkgaW4gbWFwKSkgcmV0dXJuO1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAga2V5ID0gbWFwW2tleV07XG5cbiAgICAvLyBPUiBga2V5YFxuICAgIGtleXMgPSBkb3duIHw9IGtleTtcblxuICAgIC8vIHJlY2VudCBvcHBvc2l0ZSBga2V5YCB0YWtlcyBwcmVjZWRlbmNlXG4gICAgLy8gc28gWE9SIG9sZCBmcm9tIHRoZSBga2V5c2AgYml0bWFza1xuICAgIGlmIChrZXlzICYgb3BwW2tleV0pIHtcbiAgICAgIGtleXMgXj0gb3BwW2tleV07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEtleXVwIGhhbmRsZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gICAqIEBwYXJhbSB7TnVtYmVyfSBrZXlcbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuXG4gIGZ1bmN0aW9uIG9ua2V5dXAoZXZlbnQpe1xuICAgIGtleSA9IGV2ZW50LndoaWNoO1xuICAgIGlmICghKGtleSBpbiBtYXApKSByZXR1cm47XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBrZXkgPSBtYXBba2V5XTtcblxuICAgIC8vIFhPUiBga2V5YFxuICAgIGtleXMgPSBkb3duIF49IGtleTtcbiAgfVxufTtcblxuLyoqXG4gKiBNZXJnZSB1dGlsLlxuICovXG5cbmZ1bmN0aW9uIG1lcmdlKHRhcmdldCwgc3JjKSB7XG4gIGZvciAodmFyIGtleSBpbiBzcmMpIHtcbiAgICB0YXJnZXRba2V5XSA9IHNyY1trZXldO1xuICB9XG59XG4iLCJcbi8qIVxuICpcbiAqIGxvb3BcbiAqXG4gKiBNSVQgbGljZW5zZWQuXG4gKlxuICovXG5cbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyO1xuXG4vKipcbiAqIEV4cG9zZSBgTG9vcGAuXG4gKi9cblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gTG9vcDtcblxuLyoqXG4gKiBMb29wIGNvbnN0cnVjdG9yLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBmcHNcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gTG9vcChmcHMpIHtcbiAgdGhpcy5ub3cgPSAwO1xuICB0aGlzLmJlZm9yZSA9IDA7XG4gIHRoaXMuZGVsdGFUaW1lID0gMDtcbiAgdGhpcy5tYXhEZWx0YVRpbWUgPSAwO1xuICB0aGlzLnRpbWVTdGVwID0gMDtcbiAgdGhpcy5zdGFydFRpbWUgPSAwO1xuICB0aGlzLnRpbWVFbGFwc2VkID0gMDtcbiAgdGhpcy5hY2N1bXVsYXRvciA9IDA7XG4gIHRoaXMudGlja2luZyA9IGZhbHNlO1xuICB0aGlzLmZyYW1lID0gMDtcbiAgdGhpcy5fZnBzID0gMDtcbiAgdGhpcy5mcHMoZnBzIHx8IDYwKTtcbn1cblxuLyoqXG4gKiBNYWtlIEVtaXR0ZXIuXG4gKi9cblxuTG9vcC5wcm90b3R5cGUuX19wcm90b19fID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZTtcblxuLyoqXG4gKiBTdGFydC5cbiAqXG4gKiBAcmV0dXJuIHtMb29wfSB0aGlzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkxvb3AucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuc3RhcnRUaW1lID1cbiAgdGhpcy5ub3cgPVxuICB0aGlzLmJlZm9yZSA9IERhdGUubm93KCk7XG5cbiAgdGhpcy5lbWl0KCdzdGFydCcpO1xuXG4gIHRoaXMudGlja2luZyA9IHRydWU7XG4gIHRoaXMudGljaygpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUGF1c2UuXG4gKlxuICogQHJldHVybiB7TG9vcH0gdGhpc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5Mb29wLnByb3RvdHlwZS5wYXVzZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnRpY2tpbmcgPSBmYWxzZTtcbiAgdGhpcy5lbWl0KCdwYXVzZScpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0IG9yIGdldCBmcmFtZXMgcGVyIHNlY29uZC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gW2Zwc11cbiAqIEByZXR1cm4ge051bWJlcnxMb29wfSBmcHN8dGhpc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5Mb29wLnByb3RvdHlwZS5mcHMgPSBmdW5jdGlvbihmcHMpIHtcbiAgaWYgKCFmcHMpIHJldHVybiB0aGlzLl9mcHM7XG4gIHRoaXMuX2ZwcyA9IGZwcztcbiAgdGhpcy50aW1lU3RlcCA9IDEwMDAgLyB0aGlzLl9mcHM7XG4gIHRoaXMubWF4RGVsdGFUaW1lID0gdGhpcy50aW1lU3RlcCAqIDU7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBUaWNrLlxuICpcbiAqIEByZXR1cm4ge0xvb3B9IHRoaXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbkxvb3AucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB2YXIgYWxwaGE7XG5cbiAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKTtcblxuICByZXR1cm4gdGhpcztcblxuICBmdW5jdGlvbiB0aWNrKCkge1xuICAgIGlmICghc2VsZi50aWNraW5nKSByZXR1cm47XG5cbiAgICAvLyByZXF1ZXN0IGFuaW1hdGlvbiBmcmFtZSBlYXJseVxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGljayk7XG5cbiAgICAvLyB0aW1lclxuICAgIHNlbGYubm93ID0gRGF0ZS5ub3coKTtcbiAgICBzZWxmLnRpbWVFbGFwc2VkID0gc2VsZi5ub3cgLSBzZWxmLnN0YXJ0VGltZTtcbiAgICBzZWxmLmRlbHRhVGltZSA9IHNlbGYubm93IC0gc2VsZi5iZWZvcmU7XG4gICAgc2VsZi5iZWZvcmUgPSBzZWxmLm5vdztcblxuICAgIC8vIGRpc2NhcmQgdXBkYXRlcyB3aGVuIHRpY2sgdG9vIGJpZ1xuICAgIGlmIChzZWxmLmRlbHRhVGltZSA+IHNlbGYubWF4RGVsdGFUaW1lKSB7XG4gICAgICBzZWxmLmVtaXQoJ2Rpc2NhcmQnLCBzZWxmLmRlbHRhVGltZSAvIHNlbGYudGltZVN0ZXAsIHNlbGYuZGVsdGFUaW1lKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBhY2N1bXVsYXRlIHRvIG92ZXJmbG93XG4gICAgc2VsZi5hY2N1bXVsYXRvciArPSBzZWxmLmRlbHRhVGltZTtcblxuICAgIC8vIGNvbnN1bWUgbmV3IGZyYW1lcyBpZiBvdmVyZmxvd2VkXG4gICAgd2hpbGUgKHNlbGYuYWNjdW11bGF0b3IgPj0gc2VsZi50aW1lU3RlcCkge1xuICAgICAgc2VsZi5hY2N1bXVsYXRvciAtPSBzZWxmLnRpbWVTdGVwO1xuXG4gICAgICAvLyBzZW5kIHVwZGF0ZSBhbmQgYWR2YW5jZSBmcmFtZVxuICAgICAgc2VsZi5lbWl0KCd1cGRhdGUnLCBzZWxmLnRpbWVTdGVwLCAxLCArK3NlbGYuZnJhbWUsIHNlbGYudGltZUVsYXBzZWQpO1xuICAgIH1cblxuICAgIC8vIGNvbXB1dGUgYWxwaGFcbiAgICBhbHBoYSA9IHNlbGYuYWNjdW11bGF0b3IgLyBzZWxmLnRpbWVTdGVwO1xuICAgIHNlbGYuZW1pdCgncmVuZGVyJywgc2VsZi5kZWx0YVRpbWUsIGFscGhhLCBzZWxmLmZyYW1lLCBzZWxmLnRpbWVFbGFwc2VkKTtcbiAgfVxufTtcbiIsIlxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih0YXJnZXQsIHNyYykge1xuICBmb3IgKHZhciBrZXkgaW4gc3JjKSB7XG4gICAgdGFyZ2V0W2tleV0gPSBzcmNba2V5XTtcbiAgfVxuICByZXR1cm4gdGFyZ2V0O1xufTtcbiIsIlxubW9kdWxlLmV4cG9ydHMgPSBQb2ludDtcblxuZnVuY3Rpb24gUG9pbnQoKSB7XG4gIHRoaXMueCA9IDA7XG4gIHRoaXMueSA9IDA7XG59XG5cblBvaW50LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy54ICsgJywnICsgdGhpcy55O1xufTtcbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gdGhpcy5fbWF4TGlzdGVuZXJzIHx8IHVuZGVmaW5lZDtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIWlzTnVtYmVyKG4pIHx8IG4gPCAwIHx8IGlzTmFOKG4pKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNPYmplY3QodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpIHtcbiAgICAgIGVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBBdCBsZWFzdCBnaXZlIHNvbWUga2luZCBvZiBjb250ZXh0IHRvIHRoZSB1c2VyXG4gICAgICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoJ1VuY2F1Z2h0LCB1bnNwZWNpZmllZCBcImVycm9yXCIgZXZlbnQuICgnICsgZXIgKyAnKScpO1xuICAgICAgICBlcnIuY29udGV4dCA9IGVyO1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNVbmRlZmluZWQoaGFuZGxlcikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdChoYW5kbGVyKSkge1xuICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gIGlmICh0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgIGlzRnVuY3Rpb24obGlzdGVuZXIubGlzdGVuZXIpID9cbiAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIGVsc2UgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSAmJiAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5fbWF4TGlzdGVuZXJzKSkge1xuICAgICAgbSA9IHRoaXMuX21heExpc3RlbmVycztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH1cblxuICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlLnRyYWNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIG5vdCBzdXBwb3J0ZWQgaW4gSUUgMTBcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICB2YXIgZmlyZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG5cbiAgICBpZiAoIWZpcmVkKSB7XG4gICAgICBmaXJlZCA9IHRydWU7XG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGg7XG4gIHBvc2l0aW9uID0gLTE7XG5cbiAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8XG4gICAgICAoaXNGdW5jdGlvbihsaXN0Lmxpc3RlbmVyKSAmJiBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIH0gZWxzZSBpZiAoaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGxpc3RlbmVycykpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gIH0gZWxzZSBpZiAobGlzdGVuZXJzKSB7XG4gICAgLy8gTElGTyBvcmRlclxuICAgIHdoaWxlIChsaXN0ZW5lcnMubGVuZ3RoKVxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbbGlzdGVuZXJzLmxlbmd0aCAtIDFdKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gW107XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgZWxzZVxuICAgIHJldCA9IHRoaXMuX2V2ZW50c1t0eXBlXS5zbGljZSgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24odHlwZSkge1xuICBpZiAodGhpcy5fZXZlbnRzKSB7XG4gICAgdmFyIGV2bGlzdGVuZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgICBpZiAoaXNGdW5jdGlvbihldmxpc3RlbmVyKSlcbiAgICAgIHJldHVybiAxO1xuICAgIGVsc2UgaWYgKGV2bGlzdGVuZXIpXG4gICAgICByZXR1cm4gZXZsaXN0ZW5lci5sZW5ndGg7XG4gIH1cbiAgcmV0dXJuIDA7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgcmV0dXJuIGVtaXR0ZXIubGlzdGVuZXJDb3VudCh0eXBlKTtcbn07XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbiIsIlxubW9kdWxlLmV4cG9ydHMgPSBQaXhlbEFydDtcblxuZnVuY3Rpb24gUGl4ZWxBcnQocm93cykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUGl4ZWxBcnQpKSByZXR1cm4gbmV3IFBpeGVsQXJ0KHJvd3MpO1xuXG4gIHRoaXMuX3BhbGV0dGUgPSB7fTtcbiAgdGhpcy5fc2NhbGUgPSAyO1xuICB0aGlzLl9yb3dzID0gW107XG4gIHRoaXMuX3BvcyA9IHsgeDogMCwgeTogMCB9O1xuXG4gIGlmIChyb3dzKSB0aGlzLmFydChyb3dzKTtcbn1cblxuUGl4ZWxBcnQuYXJ0ID0gUGl4ZWxBcnQucHJvdG90eXBlLmFydCA9IGZ1bmN0aW9uKHJvd3MpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFBpeGVsQXJ0KSkgcmV0dXJuIG5ldyBQaXhlbEFydChyb3dzKTtcbiAgdGhpcy5fcm93cyA9ICdzdHJpbmcnID09PSB0eXBlb2Ygcm93cyA/IHJvd3Muc3BsaXQoJ1xcbicpIDogcm93cztcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5QaXhlbEFydC5wcm90b3R5cGUucGFsZXR0ZSA9IGZ1bmN0aW9uKHBhbGV0dGUpIHtcbiAgdGhpcy5fcGFsZXR0ZSA9IHBhbGV0dGU7XG4gIHJldHVybiB0aGlzO1xufTtcblxuUGl4ZWxBcnQucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24oc2NhbGUpIHtcbiAgdGhpcy5fc2NhbGUgPSBzY2FsZTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5QaXhlbEFydC5wcm90b3R5cGUucG9zID0gZnVuY3Rpb24ocG9zKSB7XG4gIHRoaXMuX3BvcyA9IHBvcztcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5QaXhlbEFydC5wcm90b3R5cGUuc2l6ZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHdpZHRoOiB0aGlzLl9yb3dzLnJlZHVjZShmdW5jdGlvbihtYXgsIGNvbHMpIHtcbiAgICAgIHJldHVybiBNYXRoLm1heChtYXgsIGNvbHMubGVuZ3RoKTtcbiAgICB9LCAwKSAqIHRoaXMuX3NjYWxlLFxuICAgIGhlaWdodDogdGhpcy5fcm93cy5sZW5ndGggKiB0aGlzLl9zY2FsZVxuICB9O1xufTtcblxuUGl4ZWxBcnQucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihjdHgpIHtcbiAgdmFyIHAgPSB0aGlzLl9wb3M7XG4gIHZhciBzID0gdGhpcy5fc2NhbGU7XG4gIHZhciByb3dzID0gdGhpcy5fcm93cztcbiAgZm9yICh2YXIgY29scywgeSA9IDA7IHkgPCByb3dzLmxlbmd0aDsgeSsrKSB7XG4gICAgY29scyA9IHJvd3NbeV07XG4gICAgZm9yICh2YXIgY29sLCB4ID0gMDsgeCA8IGNvbHMubGVuZ3RoOyB4KyspIHtcbiAgICAgIGNvbCA9IGNvbHNbeF07XG4gICAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5fcGFsZXR0ZVtjb2xdIHx8ICd0cmFuc3BhcmVudCc7XG4gICAgICBjdHguZmlsbFJlY3QoeCpzK3AueCwgeSpzK3AueSwgcywgcyk7XG4gICAgfVxuICB9XG4gIHJldHVybiB0aGlzO1xufTtcbiIsInZhciBQb2ludCA9IHJlcXVpcmUoJy4uL2xpYi9wb2ludCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhbWVyYTtcblxuZnVuY3Rpb24gQ2FtZXJhKGxlYWRlcikge1xuICB0aGlzLmxlYWRlciA9IGxlYWRlcjtcbiAgdGhpcy5zcGVlZCA9IDAuMTQ7XG4gIHRoaXMuZnJpY3Rpb24gPSAwLjU1O1xuICB0aGlzLnB4ID0gbmV3IFBvaW50O1xuICB0aGlzLnBvcyA9IG5ldyBQb2ludDtcbiAgdGhpcy52ZWwgPSBuZXcgUG9pbnQ7XG4gIHRoaXMuc2l6ZSA9IG5ldyBQb2ludDtcbiAgdGhpcy5vbnJlc2l6ZSgpO1xuICB3aW5kb3cub25yZXNpemUgPSB0aGlzLm9ucmVzaXplLmJpbmQodGhpcyk7XG59XG5cbkNhbWVyYS5wcm90b3R5cGUub25yZXNpemUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5zaXplLnggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgdGhpcy5zaXplLnkgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG59O1xuXG5DYW1lcmEucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZHggPSAodGhpcy5sZWFkZXIucG9zLnggKyB0aGlzLmxlYWRlci53aWR0aCAqIHRoaXMubGVhZGVyLnNjYWxlIC8gMiAtIHRoaXMuc2l6ZS54IC8gMikgLSB0aGlzLnBvcy54O1xuICB2YXIgZHkgPSAodGhpcy5sZWFkZXIucG9zLnkgKyB0aGlzLmxlYWRlci5oZWlnaHQgKiB0aGlzLmxlYWRlci5zY2FsZSAvIDIgLSB0aGlzLnNpemUueSAvIDIpIC0gdGhpcy5wb3MueTtcblxuICBpZiAoTWF0aC5hYnMoZHgpIDwgMSkgZHggPSAwO1xuICBpZiAoTWF0aC5hYnMoZHkpIDwgMSkgZHkgPSAwO1xuXG4gIHRoaXMudmVsLnggKz0gZHggKiB0aGlzLnNwZWVkO1xuICB0aGlzLnZlbC55ICs9IGR5ICogdGhpcy5zcGVlZDtcblxuICB0aGlzLnBvcy54ICs9IHRoaXMudmVsLng7XG4gIHRoaXMucG9zLnkgKz0gdGhpcy52ZWwueTtcblxuICB0aGlzLnZlbC54ICo9IHRoaXMuZnJpY3Rpb247XG4gIHRoaXMudmVsLnkgKj0gdGhpcy5mcmljdGlvbjtcbn07XG5cbkNhbWVyYS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oZHQsIGFscGhhKSB7XG4gIHRoaXMucHgueCArPSAodGhpcy5wb3MueCAtIHRoaXMucHgueCkgKiBhbHBoYTtcbiAgdGhpcy5weC55ICs9ICh0aGlzLnBvcy55IC0gdGhpcy5weC55KSAqIGFscGhhO1xuXG4gIHdpbmRvdy5zY3JvbGxUbyh0aGlzLnB4LngsIHRoaXMucHgueSk7XG59O1xuIiwidmFyIHNwcml0ZSA9IHJlcXVpcmUoJy4vc3ByaXRlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGxheWVyO1xuXG5mdW5jdGlvbiBQbGF5ZXIoKSB7XG4gIE9iamVjdC5hc3NpZ24odGhpcywgc3ByaXRlLmNyZWF0ZSgncGxheWVyJywgdHJ1ZSkpO1xuXG4gIHRoaXMuc3BlZWQgPSAxOTtcbiAgdGhpcy5mYWNlID0gJ3N0YW5kX2Rvd24nO1xuICB0aGlzLmZhY2VEdXJhdGlvbiA9IDQ7XG4gIHRoaXMuZmFjZUluZGV4ID0gMDtcbiAgdGhpcy5mYWNlTmVlZGxlID0gMDtcbiAgdGhpcy5mYWNlTWFwID0ge1xuICAgICcwLDAnOiAnc3RhbmRfZG93bicsXG4gICAgJy0xLDAnOiAncnVuX2xlZnQnLFxuICAgICcwLC0xJzogJ3J1bl91cCcsXG4gICAgJzEsMCc6ICdydW5fcmlnaHQnLFxuICAgICcwLDEnOiAncnVuX2Rvd24nLFxuICAgICctMSwtMSc6ICdydW5fdXBfbGVmdCcsXG4gICAgJzEsLTEnOiAncnVuX3VwX3JpZ2h0JyxcbiAgICAnLTEsMSc6ICdydW5fZG93bl9sZWZ0JyxcbiAgICAnMSwxJzogJ3J1bl9kb3duX3JpZ2h0JyxcbiAgfTtcbiAgdGhpcy5mYWNlU3RhbmRNYXAgPSB7XG4gICAgJzAsMCc6ICdzdGFuZF9kb3duJyxcbiAgICAnLTEsMCc6ICdzdGFuZF9sZWZ0JyxcbiAgICAnMCwtMSc6ICdzdGFuZF91cCcsXG4gICAgJzEsMCc6ICdzdGFuZF9yaWdodCcsXG4gICAgJzAsMSc6ICdzdGFuZF9kb3duJyxcbiAgICAnLTEsLTEnOiAnc3RhbmRfdXBfbGVmdCcsXG4gICAgJzEsLTEnOiAnc3RhbmRfdXBfcmlnaHQnLFxuICAgICctMSwxJzogJ3N0YW5kX2Rvd25fbGVmdCcsXG4gICAgJzEsMSc6ICdzdGFuZF9kb3duX3JpZ2h0JyxcbiAgfTtcbn1cblxuUGxheWVyLnByb3RvdHlwZS5tb3ZlID0gZnVuY3Rpb24oeCwgeSl7XG4gIHRoaXMudmVsLnggfD0geDtcbiAgdGhpcy52ZWwueSB8PSB5O1xufTtcblxuUGxheWVyLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5mYWNlID0gdGhpcy5mYWNlTWFwW3RoaXMudmVsXTtcbiAgdGhpcy5mYWNlU3RhbmRNYXBbJzAsMCddID1cbiAgdGhpcy5mYWNlTWFwWycwLDAnXSA9IHRoaXMuZmFjZVN0YW5kTWFwW3RoaXMudmVsXTtcblxuICB2YXIgc3BlZWQgPSB0aGlzLnNwZWVkO1xuICBpZiAodGhpcy52ZWwueCAmJiB0aGlzLnZlbC55KSBzcGVlZCAqPSAwLjc1O1xuXG4gIHRoaXMucG9zLnggKz0gdGhpcy52ZWwueCAqIHNwZWVkIHwgMDtcbiAgdGhpcy5wb3MueSArPSB0aGlzLnZlbC55ICogc3BlZWQgfCAwO1xuICB0aGlzLnZlbC54ID0gMDtcbiAgdGhpcy52ZWwueSA9IDA7XG59O1xuXG5QbGF5ZXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKGR0LCBhbHBoYSkge1xuICB0aGlzLnB4LnggKz0gKHRoaXMucG9zLnggLSB0aGlzLnB4LngpICogYWxwaGE7XG4gIHRoaXMucHgueSArPSAodGhpcy5wb3MueSAtIHRoaXMucHgueSkgKiBhbHBoYTtcblxuICB2YXIgaSA9IHRoaXMuZmFjZUluZGV4O1xuICB2YXIgbiA9IHRoaXMuZmFjZU5lZWRsZTtcbiAgbiAlPSB0aGlzLmFuaW1hdGlvblt0aGlzLmZhY2VdLmxlbmd0aDtcblxuICB2YXIgaW5kZXggPSB0aGlzLmFuaW1hdGlvblt0aGlzLmZhY2VdW25dO1xuICB2YXIgeCA9IGluZGV4WzBdICogdGhpcy53aWR0aCAqIHRoaXMuc2NhbGU7XG4gIHZhciB5ID0gaW5kZXhbMV0gPyB0aGlzLmhlaWdodCAqIHRoaXMuc2NhbGUgKyB0aGlzLnNjYWxlIDogMDtcbiAgdGhpcy5mYWNlSW5kZXggPSAoaSArIDEpICUgdGhpcy5mYWNlRHVyYXRpb247XG4gIGlmICh0aGlzLmZhY2VJbmRleCA9PT0gMCkgdGhpcy5mYWNlTmVlZGxlID0gbiArIDE7XG5cbiAgT2JqZWN0LmFzc2lnbih0aGlzLmVsLnN0eWxlLCB7XG4gICAgbGVmdDogdGhpcy5weC54ICsgJ3B4JyxcbiAgICB0b3A6IHRoaXMucHgueSArICdweCcsXG4gICAgYmFja2dyb3VuZFBvc2l0aW9uOiBgLSR7eH1weCAtJHt5fXB4YCxcbiAgfSk7XG59O1xuIiwidmFyIHBpeGVsID0gcmVxdWlyZSgncGl4ZWwtYXJ0Jyk7XG52YXIgbWVyZ2UgPSByZXF1aXJlKCcuLi9saWIvbWVyZ2UnKTtcbnZhciBQb2ludCA9IHJlcXVpcmUoJy4uL2xpYi9wb2ludCcpO1xuXG52YXIgc3ByaXRlID0gZXhwb3J0cztcblxuc3ByaXRlLnNjYWxlID0gMztcblxuLy8gYmFsbFxuXG5zcHJpdGUuYmFsbCA9IFtcbmBcXFxuIG94XG54b29vXG5vb3hvXG4gb29cXFxuYCxgXFxcbiB4b1xub29vb1xueG94b1xuIG9vXFxcbmAsYFxcXG4geG9cbm9vb29cbnhveG9cbiBvb1xcXG5gXG5dO1xuXG5zcHJpdGUuYmFsbC5wYWxldHRlID0ge1xuICAnbyc6ICcjZmZmJyxcbiAgJ3gnOiAnIzAwMCdcbn07XG5cbi8vIGJhbGwgc2hhZG93XG5cbnNwcml0ZS5iYWxsX3NoYWRvdyA9IFtgXFxcbiA3Nzdcbjc3Nzc3XG4gNzc3XFxcbmBdO1xuXG5zcHJpdGUuYmFsbF9zaGFkb3cucGFsZXR0ZSA9IHtcbiAgJzcnOiAncmdiYSgwLDAsMCwwLjMpJ1xufTtcblxuc3ByaXRlLnBsYXllciA9IFtcblxuLy8gMDogZG93blxuYFxcXG5cbiAgICB4eHhcbiAgIHh4eHh4XG4gIHh4Li4ueHhcbiAgeG94LnhveFxuICAgLi4uLi5cbiAgICAgLlxuICAgdHR0dHRcbiAgdCB0dHQgdFxuICAuIHR0dCAuXG4gICAgcHBwXG4gICAgLiAuXG4gICAgdCB0XG4gICBzcyBzc1xcXG5gLFxuXG4vLyAxOiBkb3duIHJpZ2h0XG5cbmBcXFxuXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eC4uLi5cbiAgeC5veC54b1xuICAgLi4uLi5cbiAgICAgLlxuICAgdHR0dFxuICB0dHR0dFxuICAudHR0dFxuICAgIHBwcFxuICAgIC4gLlxuICAgIHQgdFxuICAgIHNzc3NcXFxuYCxcblxuLy8gMjogcmlnaHRcbmBcXFxuXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eHguLi5cbiAgeHguLm94XG4gICB4Li4uLlxuICAgICAuXG4gICAgdHR0XG4gICB0dHR0XG4gICAudHR0XG4gICAgcHBcbiAgICAuLlxuICAgIHR0XG4gICAgc3NzXFxcbmAsXG5cbi8vIDM6IHVwIHJpZ2h0XG5cbmBcXFxuXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eHh4eC5cbiAgeHh4eC5veFxuICAgeHguLi5cbiAgICAgLlxuICAgdHR0dFxuICAgdHR0dHRcbiAgIHR0dHQuXG4gICAgcHBwXG4gICAgLiAuXG4gICAgdCB0XG4gICAgc3Nzc1xcXG5gLFxuXG4vLyA0OiB1cFxuXG5gXFxcblxuICAgIHh4eFxuICAgeHh4eHhcbiAgeHh4eHh4eFxuICB4eHh4eHh4XG4gICAueHh4LlxuICAgICAuXG4gICB0dHR0dFxuICB0IHR0dCB0XG4gIC4gdHR0IC5cbiAgICBwcHBcbiAgICAuIC5cbiAgICB0IHRcbiAgIHNzIHNzXFxcbmAsXG5cbi8vIDU6IHJ1biByaWdodCAxXG5cbmBcXFxuXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eHguLi5cbiAgeHguLm94XG4gICB4Li4uLlxuICAgICAuXG4gICB0dHR0XG4gIHR0dHR0XG4gIC4gdHR0LlxuICAgIHBwcFxuICBzdHQuLlxuICBzICAgdFxuICAgICAgc3NcXFxuYCxcblxuLy8gNjogcnVuIHJpZ2h0IDJcblxuYFxcXG5cbiAgICB4eHhcbiAgIHh4eHh4XG4gIHh4eC4uLlxuICB4eC4ub3hcbiAgIHguLi4uXG4gICAgIC5cbiAgICB0dHRcbiAgIHR0dHQuXG4gICB0LnR0XG4gICAgcHBcbiAgICAuLlxuICAgIHR0XG4gICAgc3NzXFxcbmAsXG5cbi8vIDc6IHJ1biByaWdodCAzXG5cbmBcXFxuXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eHguLi5cbiAgeHguLm94XG4gICB4Li4uLlxuICAgICAuXG4gICAgdHR0XG4gICB0dHR0XG4gICB0dC50XG4gICAgcHBwXG4gIHN0dC4uXG4gIHMgICB0XG4gICAgICBzc1xcXG5gLFxuXG4vLyA4OiBydW4gZG93biAxXG5cbmBcXFxuICAgIHh4eFxuICAgeHh4eHhcbiAgeHguLi54eFxuICB4b3gueG94XG4gICAuLi4uLlxuICAgICAuXG4gICB0dHR0dFxuICB0IHR0dCB0XG4gIC4gdHR0IC5cbiAgICBwcHBcbiAgICAuIC5cbiAgICB0IHRcbiAgICBzIHNcXFxuYCxcblxuLy8gOTogcnVuIGRvd24gMlxuXG5gXFxcbiAgICB4eHhcbiAgIHh4eHh4XG4gIHh4Li4ueHhcbiAgeG94LnhveFxuICAgLi4uLi5cbiAgIHQgLlxuICAudHR0dFxuICAgIHR0dHRcbiAgICB0dHR0XG4gICAgcHBwLlxuICAgIC4gdFxuICAgIC4gc1xuICAgIHRcbiAgICBzXFxcbmAsXG5cbi8vIDEwOiBydW4gZG93biByaWdodCAxXG5cbmBcXFxuXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eC4uLi5cbiAgeC5veC54b1xuICAgLi4uLi5cbiAgICAgLlxuICB0dHR0dFxuIC4gdHR0dFxuICAgdHR0dC5cbiAgICBwcHBcbiAgc3QuLi5cbiAgcyAgc3RcbiAgICAgIHNcXFxuYCxcblxuLy8gMTE6IHJ1biBkb3duIHJpZ2h0IDJcblxuYFxcXG5cbiAgICB4eHhcbiAgIHh4eHh4XG4gIHh4Li4uLlxuICB4Lm94LnhvXG4gICAuLi4uLlxuICAgICAuXG4gICB0dHR0XG4gICB0dHR0XG4gICB0LnR0XG4gICAgcHBwXG4gICAgLi4uXG4gIHN0IHRcbiAgIHMgc3NcXFxuYCxcblxuLy8gMTI6IHJ1biBkb3duIHJpZ2h0IDNcblxuYFxcXG5cbiAgICB4eHhcbiAgIHh4eHh4XG4gIHh4Li4uLlxuICB4Lm94LnhvXG4gICAuLi4uLlxuICAgICAuXG4gLnR0dHR0XG4gICB0dHR0LlxuICAgdHR0dFxuICAgIHBwcFxuICBzdC4uLlxuICBzICAgIHRcbiAgICAgICBzc1xcXG5gLFxuXG4vLyAxMzogcnVuIHVwIHJpZ2h0IDFcblxuYFxcXG5cbiAgICB4eHhcbiAgIHh4eHh4XG4gIHh4eHh4LlxuICB4eHh4Lm94XG4gICB4eC4uLlxuICAgICAuXG4gIHR0dHR0XG4gIC50dHR0dC5cbiAgIHR0dHRcbiAgICBwcHBcbiAgc3QuLi5cbiAgcyAgdFxuICAgICBzc1xcXG5gLFxuXG4vLyAxNDogcnVuIHVwIHJpZ2h0IDJcblxuYFxcXG5cbiAgICB4eHhcbiAgIHh4eHh4XG4gIHh4eHh4LlxuICB4eHh4Lm94XG4gICB4eC4uLlxuICAgICAuXG4gICB0dHR0XG4gIHR0dHR0XG4gIC50dHQuXG4gICAgcHBwXG4gICAgLi4uXG4gICBzdCB0XG4gICAgcyBzc1xcXG5gLFxuXG4vLyAxNTogcnVuIHVwIHJpZ2h0IDNcblxuYFxcXG5cbiAgICB4eHhcbiAgIHh4eHh4XG4gIHh4eHh4LlxuICB4eHh4Lm94XG4gICB4eC4uLlxuICAgICAuXG4gICB0dHR0XG4gIHR0dHR0LlxuICAgdHR0dFxuICAgIHBwcFxuICBzdC4uLlxuICBzICAgIHRzXG4gICAgICAgc1xcXG5gLFxuXG5cbi8vIDE2OiBydW4gdXAgMVxuXG5gXFxcbiAgICB4eHhcbiAgIHh4eHh4XG4gIHh4eHh4eHhcbiAgeHh4eHh4eFxuICAgLnh4eC5cbiAgICAgLlxuICAgdHR0dHRcbiAgdCB0dHQgdFxuICAuIHR0dCAuXG4gICAgcHBwXG4gICAgLiAuXG4gICAgdCB0XG4gICAgcyBzXFxcbmAsXG5cbi8vIDE3OiBydW4gdXAgMlxuXG5gXFxcbiAgICB4eHhcbiAgIHh4eHh4XG4gIHh4eHh4eHhcbiAgeHh4eHh4eFxuICAgLnh4eC5cbiAgICAgLlxuICAudHR0dFxuICAgIHR0dHRcbiAgICB0dHR0XG4gICAgcHBwLlxuICAgIC4gdFxuICAgIC4gc1xuICAgIHRcbiAgICBzXFxcbmAsXG5dO1xuXG5zcHJpdGUucGxheWVyLnNoYWRvdyA9IGZ1bmN0aW9uIG1ha2VTaGFkb3coYXJ0KSB7XG4gIGlmICgnc3RyaW5nJyA9PT0gdHlwZW9mIGFydCkgYXJ0ID0gYXJ0LnNwbGl0KCdcXG4nKTtcbiAgYXJ0ID0gYXJ0LnNsaWNlKCk7XG4gIHZhciBmbGlwcGVkID0gYXJ0LnNsaWNlKCkucmV2ZXJzZSgpO1xuICB2YXIgcmVnZXhwID0gL1teIF0vZztcbiAgdmFyIHNpemUgPSAwO1xuICB2YXIgc2tld1ggPSAxO1xuICB2YXIgc2tld1kgPSAxLjM7XG4gIHZhciBzaG9ydFggPSAwO1xuICB2YXIgd2lkdGggPSAwO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGZsaXBwZWQubGVuZ3RoOyBpICs9IHNrZXdZKSB7XG4gICAgc2l6ZSsrO1xuICAgIHNrZXdZICs9IDEuMjtcbiAgICBza2V3WCArPSAxO1xuICAgIHNob3J0WCArPSAwLjUyO1xuICAgIGlmIChzaG9ydFggPiAxLjUpIHJlZ2V4cCA9IC9bXiBdezEsMn0vZztcbiAgICBpZiAoc2hvcnRYID4gMi41KSByZWdleHAgPSAvW14gXXsxLDN9L2c7XG4gICAgdmFyIHJvdyA9IG5ldyBBcnJheShza2V3WCB8IDApLmpvaW4oJyAnKSArIGZsaXBwZWRbaSB8IDBdLnJlcGxhY2UocmVnZXhwLCAoKSA9PiAnJScpO1xuICAgIHdpZHRoID0gcm93Lmxlbmd0aDtcbiAgICBhcnQucHVzaChyb3cpO1xuICB9XG4gIHJldHVybiBhcnQ7XG59O1xuXG5zcHJpdGUucGxheWVyLmFuaW1hdGlvbiA9IHtcbiAgc3RhbmRfZG93bjogW1swXV0sXG4gIHN0YW5kX2Rvd25fcmlnaHQ6IFtbMV1dLFxuICBzdGFuZF9yaWdodDogW1syXV0sXG4gIHN0YW5kX3VwX3JpZ2h0OiBbWzNdXSxcbiAgc3RhbmRfdXA6IFtbNF1dLFxuICBzdGFuZF91cF9sZWZ0OiBbWzMsdHJ1ZV1dLFxuICBzdGFuZF9sZWZ0OiBbWzIsdHJ1ZV1dLFxuICBzdGFuZF9kb3duX2xlZnQ6IFtbMSx0cnVlXV0sXG5cbiAgcnVuX3JpZ2h0OiBbWzddLFs2XSxbNV0sWzJdXSxcbiAgcnVuX2xlZnQ6IFtbNyx0cnVlXSxbNix0cnVlXSxbNSx0cnVlXSxbMix0cnVlXV0sXG4gIHJ1bl9kb3duOiBbWzhdLFs5XSxbOF0sWzksdHJ1ZV1dLFxuICBydW5fdXA6IFtbMTZdLFsxN10sWzE2XSxbMTcsdHJ1ZV1dLFxuICBydW5fZG93bl9yaWdodDogW1sxMV0sWzEyXSxbMTBdLFsxXV0sXG4gIHJ1bl91cF9yaWdodDogW1sxM10sWzE0XSxbMTVdLFszXV0sXG4gIHJ1bl9kb3duX2xlZnQ6IFtbMTEsdHJ1ZV0sWzEyLHRydWVdLFsxMCx0cnVlXSxbMSx0cnVlXV0sXG4gIHJ1bl91cF9sZWZ0OiBbWzEzLHRydWVdLFsxNCx0cnVlXSxbMTUsdHJ1ZV0sWzMsdHJ1ZV1dLFxufTtcblxuc3ByaXRlLnBsYXllci5wYWxldHRlID0ge1xuICAneCc6ICcjMDAwJyxcbiAgJ3YnOiAnIzQ0NCcsXG4gICdvJzogJyNmZmYnLFxuICAnLic6ICcjZjkxJyxcbiAgJ3QnOiAnIzAwZicsXG4gICdwJzogJyNmZmYnLFxuICAncyc6ICcjMDAwJyxcbiAgJzcnOiAncmdiYSgwLDAsMCwwLjMpJyxcbn07XG5cbnNwcml0ZS5wbGF5ZXIud2lkdGggPSAxMTtcbnNwcml0ZS5wbGF5ZXIuaGVpZ2h0ID0gMTQ7XG5zcHJpdGUucGxheWVyLnNjYWxlID0gc3ByaXRlLnNjYWxlO1xuXG5zcHJpdGUuY2VudGVyX3Nwb3QgPSBbYFxcXG5cbiAgeG94XG4geG9vb3hcbiB4b29veFxuICB4b3hcblxcXG5gXVxuXG5zcHJpdGUuY2VudGVyX3Nwb3QucGFsZXR0ZSA9IHtcbiAgJ28nOiAnI2ZmZicsXG4gICd4JzogJ3JnYmEoMjU1LDI1NSwyNTUsLjUpJ1xufTtcbnNwcml0ZS5jZW50ZXJfc3BvdC53aWR0aCA9IDc7XG5zcHJpdGUuY2VudGVyX3Nwb3QuaGVpZ2h0ID0gNjtcbnNwcml0ZS5jZW50ZXJfc3BvdC5zY2FsZSA9IHNwcml0ZS5zY2FsZTtcblxuc3ByaXRlLmdvYWxfbmV0cyA9IFtcbmBcXFxuICAgIDt4eHh4eHh4eHh4eHh4eFxuICAgO3Z4O3g7eDt4L3gveC94eFxuICAgdjt4eDt4L3gveC94L3gveFxuICA7djt4L3gveC94L3gveC94eFxuICB2di94eC94L3gveC94L3gveFxuIDt2O3Z4L3gveC94L3gveC94eFxuIHY7di94eC94L3gveC94L3gveFxuO3Z2L3Z4L3gveC94L3gveC94eFxudnY7djt4eC94L3gveC94O3g7eFxudjt2O3Z4O3g7eDt4O3g7eDt4eFxudnYudi54eC54LngueC54LngueFxudjt2LnZ4LngueC54LngueC54eFxudnYudjt4eC54LngueC54LngueFxudjt2O3Z4LngueC54LngueC54eFxudnYudjt4eC54LngueC54LngueFxudi52LnZ4LngueC54LngueC54eFxudnYudi54eC54LngueC54LngueFxudjt2LnZ4LngueC54LngueC54eFxudnYudi54eC54LngueC54LngueFxudi52LnZ4LngueC54LngueC54eFxudnYudi54eC54LngueC54LngueFxudi52LnZ4LngueC54LngueC54eFxudnYudi54eC54LngueC54LngueFxudjt2LnZ4LngueC54LngueC54eFxudnYudi54eC54LngueC54LngueFxudjt2LnZ4LngueC54LngueC54eFxudnYudi54eC54LngueC54LngueFxudi52LnZ4LngueC54LngueC54eFxudnYudi54eC54LngueC54LngueFxudi52LnZ4LngueC54LngueC54eFxudnYudi54eC54LngueC54LngueFxudi52LnZ4LngueC54LngueC54eFxudnYudi54eC54LngueC54LngueFxudjt2LnZ4LngueC54LngueC54eFxudnYudi54eC54LngueC54LngueFxudjt2LnZ4LngueC54LngueC54eFxudnYudi54eC54LngueC54LngueFxudjt2O3Z4LngueC54LngueC54eFxudnYudi54eC54LngueC54LngueFxudi52LnZ4LngueC54LngueC54eFxudnYudi54eC54LngueC54LngueFxudjt2LnZ4LngueC54LngueC54eFxudnY7di54eC54LngueC54LngueFxudjt2LnZ4LngueC54LngueC54eFxudnYudi54eC54LngueC54LngueFxudi52LnZ4LngueC54LngueC54eFxudnYudjt4eHh4eHh4eHh4eHh4eFxudi52Lnh4O3g7eC54LngueC54eFxudnYueHg7eC54LngueC54LngueFxudjt4eDt4LngueC54LngueC54eFxudng7eHgueC54LngueC54Lng7eFxudjt4eC54LngueC54LngueDt4eFxudnh4O3gueC54LngueC54Lng7eFxudnh4eC54LngueC54LngueDt4eFxudnh4O3gueC54Lng7eC54O3g7eFxueHh4eHh4eHh4eHh4eHh4eHh4eFxcXG5gLFxuXTtcblxuc3ByaXRlLmdvYWxfbmV0cy5zaGFkb3cgPSBmdW5jdGlvbiBtYWtlU2hhZG93KGFydCkge1xuICBpZiAoJ3N0cmluZycgPT09IHR5cGVvZiBhcnQpIGFydCA9IGFydC5zcGxpdCgnXFxuJyk7XG4gIGFydCA9IGFydC5zbGljZSgpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGFydC5sZW5ndGg7IGkrKykge1xuICAgIGFydFtpXSA9IGFydFtpXS50cmltUmlnaHQoKTtcbiAgfVxuICB2YXIgZiA9IHRydWU7XG4gIGFydFsxMF0gKz0gJyUnXG4gIGFydFsxMV0gKz0gJyAlJ1xuICBhcnRbMTJdICs9ICclICUnXG4gIGFydFsxM10gKz0gJyAlICUnXG4gIGFydFsxNF0gKz0gJyUgJSAlJ1xuICBmb3IgKHZhciBpID0gMTU7IGkgPCBhcnQubGVuZ3RoOyBpKyspIHtcbiAgICBhcnRbaV0gKz0gKGYgPyAnICcgOiAnJykgKyAnJSAlICUnICsgKGYgPyAnJyA6ICclJyk7XG4gICAgZiA9ICFmO1xuICB9XG4gIHZhciB3aWR0aCA9IDI0O1xuICB2YXIgbGluZSA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHdpZHRoOyBpKyspIHtcbiAgICBsaW5lW2ldID0gZiA/ICclJyA6ICcgJztcbiAgICBmID0gIWY7XG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICBhcnQucHVzaChuZXcgQXJyYXkoMjAgKyBpKS5qb2luKCcgJykgKyBsaW5lLnNsaWNlKDAsIGxpbmUubGVuZ3RoIC0gaSkuam9pbignJykgKyAnJScpO1xuICB9XG4gIGFydC5wdXNoKG5ldyBBcnJheSgyMCArIGkgKyAxKS5qb2luKCcgJykgKyAnJSUlJSUlJSUlJSUlJSUlJSUlJSUlJylcbiAgcmV0dXJuIGFydDtcbn07XG5cbnNwcml0ZS5nb2FsX25ldHMucGFsZXR0ZSA9IHtcbiAgJ3gnOiAnI2ZmZicsXG4gICd2JzogJyNkZGQnLFxuICAnOyc6ICdyZ2JhKDIwMCwyMDAsMjAwLC42KScsXG4gICcuJzogJ3JnYmEoMTUwLDE1MCwxNTAsLjUpJyxcbiAgJy8nOiAncmdiYSgxODAsMTgwLDE4MCwuNiknLFxuICAnMyc6ICdyZ2JhKDAsMCwwLC4yKScsXG4gICc4JzogJ3JnYmEoMCwwLDAsLjI1KScsXG59O1xuc3ByaXRlLmdvYWxfbmV0cy53aWR0aCA9IHNwcml0ZS5nb2FsX25ldHNbMF0uc3BsaXQoJ1xcbicpWzBdLmxlbmd0aDtcbnNwcml0ZS5nb2FsX25ldHMuaGVpZ2h0ID0gc3ByaXRlLmdvYWxfbmV0c1swXS5zcGxpdCgnXFxuJykubGVuZ3RoO1xuc3ByaXRlLmdvYWxfbmV0cy5sZWZ0ID0gc3ByaXRlLmdvYWxfbmV0cy53aWR0aDtcbnNwcml0ZS5nb2FsX25ldHMudG9wID0gKHNwcml0ZS5nb2FsX25ldHMuaGVpZ2h0IC8gMiB8IDApICsgMztcbnNwcml0ZS5nb2FsX25ldHMuc2NhbGUgPSBzcHJpdGUuc2NhbGU7XG5cbnNwcml0ZS5jb3JuZXJfZmxhZyA9IFtgXFxcbmdiXG5nZ2JcbmdnZ2Jcbnhcbnhcbnhcbnhcbjc3N1xuICA3N1xuXG5cXFxuYF1cblxuc3ByaXRlLmNvcm5lcl9mbGFnLnBhbGV0dGUgPSB7XG4gICd4JzogJyNjY2MnLFxuICAnZyc6ICcjZjAwJyxcbiAgJ2InOiAnI2MyMCcsXG4gICc7JzogJ3JnYmEoMjU1LDI1NSwyNTUsLjEpJyxcbiAgJzcnOiAncmdiYSgwLDAsMCwuMjUpJyxcbn07XG5zcHJpdGUuY29ybmVyX2ZsYWcud2lkdGggPSA1O1xuc3ByaXRlLmNvcm5lcl9mbGFnLmhlaWdodCA9IHNwcml0ZS5jb3JuZXJfZmxhZ1swXS5zcGxpdCgnXFxuJykubGVuZ3RoIC0gMTtcbnNwcml0ZS5jb3JuZXJfZmxhZy5zY2FsZSA9IHNwcml0ZS5zY2FsZTtcblxuc3ByaXRlLmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZVNwcml0ZShuYW1lKSB7XG4gIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgdmFyIHMgPSBzcHJpdGVbbmFtZV07XG5cbiAgaWYgKHMuc2hhZG93KSB7XG4gICAgcy5wYWxldHRlWyclJ10gPSAncmdiYSgwLDAsMCwuMjUpJztcbiAgICB2YXIgcGFkZGVkID0gc1xuICAgICAgLm1hcChhcnQgPT4gJ3N0cmluZycgPT09IHR5cGVvZiBhcnQgPyBhcnQuc3BsaXQoJ1xcbicpIDogYXJ0KVxuICAgICAgLm1hcChhcnQgPT4gYXJ0Lm1hcChyb3cgPT4gbmV3IEFycmF5KHMud2lkdGggKyAxKS5qb2luKCcgJykgKyByb3cpKTtcblxuICAgIHBhZGRlZC5hbmltYXRpb24gPSBzLmFuaW1hdGlvbjtcbiAgICBwYWRkZWQuc2hhZG93ID0gcy5zaGFkb3c7XG4gICAgcGFkZGVkLndpZHRoID0gcy53aWR0aCAqIDM7XG4gICAgcGFkZGVkLmhlaWdodCA9IHMuaGVpZ2h0ICogMjtcbiAgICBwYWRkZWQubGVmdCA9IHMubGVmdCArIHMud2lkdGggLyAzIHwgMDtcbiAgICBwYWRkZWQudG9wID0gcy50b3A7XG4gICAgcGFkZGVkLnBhbGV0dGUgPSBzLnBhbGV0dGU7XG4gICAgcGFkZGVkLnNjYWxlID0gcy5zY2FsZTtcbiAgICBzID0gcGFkZGVkO1xuICB9XG5cbiAgY2FudmFzLndpZHRoID0gcy5sZW5ndGggKiBzLndpZHRoICogcy5zY2FsZTtcbiAgY2FudmFzLmhlaWdodCA9IHMuc2NhbGUgKiAyICsgcy5oZWlnaHQgKiBzLnNjYWxlICogMjtcblxuICAvLyBub3JtYWxcbiAgcy5mb3JFYWNoKChhcnQsIGluZGV4KSA9PiB7XG4gICAgaWYgKHMuc2hhZG93KSBhcnQgPSBzLnNoYWRvdyhhcnQpO1xuICAgIHBpeGVsLmFydChhcnQpXG4gICAgLnBhbGV0dGUocy5wYWxldHRlKVxuICAgIC5zY2FsZShzLnNjYWxlKS5wb3Moe1xuICAgICAgeDogcy53aWR0aCAqIHMuc2NhbGUgKiBpbmRleCxcbiAgICAgIHk6IDBcbiAgICB9KVxuICAgIC5kcmF3KGNvbnRleHQpO1xuICB9KTtcblxuICAvLyBtaXJyb3IgeFxuICBzLmZvckVhY2goKGFydCwgaW5kZXgpID0+IHtcbiAgICBpZiAoJ3N0cmluZycgPT09IHR5cGVvZiBhcnQpIGFydCA9IGFydC5zcGxpdCgnXFxuJyk7XG4gICAgYXJ0ID0gYXJ0Lm1hcChyb3cgPT4gcGFkUmlnaHQocm93LCBzLndpZHRoKS5zcGxpdCgnJykucmV2ZXJzZSgpLmpvaW4oJycpKTtcbiAgICBpZiAocy5zaGFkb3cpIGFydCA9IHMuc2hhZG93KGFydCk7XG4gICAgcGl4ZWwuYXJ0KGFydClcbiAgICAucGFsZXR0ZShzLnBhbGV0dGUpXG4gICAgLnNjYWxlKHMuc2NhbGUpLnBvcyh7XG4gICAgICB4OiBzLndpZHRoICogcy5zY2FsZSAqIGluZGV4LFxuICAgICAgeTogcy5oZWlnaHQgKiBzLnNjYWxlICsgcy5zY2FsZVxuICAgIH0pXG4gICAgLmRyYXcoY29udGV4dCk7XG4gIH0pO1xuXG4gIHZhciBkYXRhVVJMID0gY2FudmFzLnRvRGF0YVVSTCgpO1xuICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGRpdi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gIGRpdi5zdHlsZS5iYWNrZ3JvdW5kID0gYHVybCgke2RhdGFVUkx9KSAwIDAgbm8tcmVwZWF0YDtcbiAgZGl2LnN0eWxlLndpZHRoID0gcy5zY2FsZSAqIHMud2lkdGggKyAncHgnO1xuICBkaXYuc3R5bGUuaGVpZ2h0ID0gcy5zY2FsZSAqIHMuaGVpZ2h0ICsgJ3B4JztcbiAgaWYgKHMudG9wKSBkaXYuc3R5bGUubWFyZ2luVG9wID0gLShzLnNjYWxlICogcy50b3ApICsgJ3B4JztcbiAgcmV0dXJuIG1lcmdlKHtcbiAgICBlbDogZGl2LFxuICAgIHB4OiBuZXcgUG9pbnQsXG4gICAgcG9zOiBuZXcgUG9pbnQsXG4gICAgdmVsOiBuZXcgUG9pbnQsXG4gIH0sIHMpO1xufTtcblxuZnVuY3Rpb24gcGFkUmlnaHQocywgbikge1xuICBuID0gTWF0aC5tYXgobiwgcy5sZW5ndGggLSAxKTtcbiAgcmV0dXJuIHMgKyBuZXcgQXJyYXkobiAtIHMubGVuZ3RoICsgMSkuam9pbignICcpO1xufVxuIiwidmFyIGNzcyA9IHJlcXVpcmUoJy4uL3N0eWxlLmNzcycpO1xudmFyIHNwcml0ZSA9IHJlcXVpcmUoJy4vc3ByaXRlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3RhZGl1bTtcblxuZnVuY3Rpb24gU3RhZGl1bSgpIHtcbiAgdGhpcy5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB0aGlzLmVsLmNsYXNzTmFtZSA9IGNzcy5zdGFkaXVtO1xuXG4gIHZhciBncmFzcyA9IGNyZWF0ZUdyYXNzKCk7XG4gIHRoaXMuZWwuc3R5bGUuYmFja2dyb3VuZCA9ICd1cmwoJyArIGdyYXNzLnRvRGF0YVVSTCgpICsgJykgLTYwcHggMHB4JztcblxuICB0aGlzLnBpdGNoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHRoaXMucGl0Y2guY2xhc3NOYW1lID0gY3NzLnBpdGNoO1xuICB0aGlzLmVsLmFwcGVuZENoaWxkKHRoaXMucGl0Y2gpO1xuXG4gIHRoaXMuaGFsZndheUxpbmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdGhpcy5oYWxmd2F5TGluZS5jbGFzc05hbWUgPSBjc3NbJ2hhbGZ3YXktbGluZSddO1xuICB0aGlzLnBpdGNoLmFwcGVuZENoaWxkKHRoaXMuaGFsZndheUxpbmUpO1xuXG4gIHRoaXMuY2VudGVyQ2lyY2xlID0gY3JlYXRlQ2VudGVyQ2lyY2xlKCk7XG4gIHRoaXMuY2VudGVyQ2lyY2xlLmNsYXNzTmFtZSA9IGNzc1snY2VudGVyLWNpcmNsZSddO1xuICB0aGlzLnBpdGNoLmFwcGVuZENoaWxkKHRoaXMuY2VudGVyQ2lyY2xlKTtcblxuICB0aGlzLmNlbnRlclNwb3QgPSBzcHJpdGUuY3JlYXRlKCdjZW50ZXJfc3BvdCcpO1xuICB0aGlzLmNlbnRlclNwb3QuZWwuY2xhc3NOYW1lID0gY3NzWydjZW50ZXItc3BvdCddO1xuICB0aGlzLnBpdGNoLmFwcGVuZENoaWxkKHRoaXMuY2VudGVyU3BvdC5lbCk7XG5cbiAgdGhpcy5wZW5hbHR5QXJjTGVmdCA9IGNyZWF0ZUNlbnRlckNpcmNsZSh7IHg6ICdMZWZ0JywgeTogJ1RvcCcgfSwgMC44NSwgNS40Myk7XG4gIHRoaXMucGVuYWx0eUFyY0xlZnQuY2xhc3NOYW1lID0gY3NzWydwZW5hbHR5LWFyYy1sZWZ0J107XG4gIHRoaXMucGl0Y2guYXBwZW5kQ2hpbGQodGhpcy5wZW5hbHR5QXJjTGVmdCk7XG5cbiAgdGhpcy5wZW5hbHR5U3BvdExlZnQgPSBzcHJpdGUuY3JlYXRlKCdjZW50ZXJfc3BvdCcpO1xuICB0aGlzLnBlbmFsdHlTcG90TGVmdC5lbC5jbGFzc05hbWUgPSBjc3NbJ3BlbmFsdHktc3BvdC1sZWZ0J107XG4gIHRoaXMucGl0Y2guYXBwZW5kQ2hpbGQodGhpcy5wZW5hbHR5U3BvdExlZnQuZWwpO1xuXG4gIHRoaXMucGVuYWx0eUFyY1JpZ2h0ID0gY3JlYXRlQ2VudGVyQ2lyY2xlKHsgeDogJ1JpZ2h0JywgeTogJ1RvcCcgfSwgNCwgMi4yOSk7XG4gIHRoaXMucGVuYWx0eUFyY1JpZ2h0LmNsYXNzTmFtZSA9IGNzc1sncGVuYWx0eS1hcmMtcmlnaHQnXTtcbiAgdGhpcy5waXRjaC5hcHBlbmRDaGlsZCh0aGlzLnBlbmFsdHlBcmNSaWdodCk7XG5cbiAgdGhpcy5wZW5hbHR5U3BvdFJpZ2h0ID0gc3ByaXRlLmNyZWF0ZSgnY2VudGVyX3Nwb3QnKTtcbiAgdGhpcy5wZW5hbHR5U3BvdFJpZ2h0LmVsLmNsYXNzTmFtZSA9IGNzc1sncGVuYWx0eS1zcG90LXJpZ2h0J107XG4gIHRoaXMucGl0Y2guYXBwZW5kQ2hpbGQodGhpcy5wZW5hbHR5U3BvdFJpZ2h0LmVsKTtcblxuICB0aGlzLnBlbmFsdHlBcmVhTGVmdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB0aGlzLnBlbmFsdHlBcmVhTGVmdC5jbGFzc05hbWUgPSBjc3NbJ3BlbmFsdHktYXJlYS1sZWZ0J107XG4gIHRoaXMucGl0Y2guYXBwZW5kQ2hpbGQodGhpcy5wZW5hbHR5QXJlYUxlZnQpO1xuXG4gIHRoaXMucGVuYWx0eUFyZWFSaWdodCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB0aGlzLnBlbmFsdHlBcmVhUmlnaHQuY2xhc3NOYW1lID0gY3NzWydwZW5hbHR5LWFyZWEtcmlnaHQnXTtcbiAgdGhpcy5waXRjaC5hcHBlbmRDaGlsZCh0aGlzLnBlbmFsdHlBcmVhUmlnaHQpO1xuXG4gIHRoaXMuZ29hbEFyZWFMZWZ0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHRoaXMuZ29hbEFyZWFMZWZ0LmNsYXNzTmFtZSA9IGNzc1snZ29hbC1hcmVhLWxlZnQnXTtcbiAgdGhpcy5waXRjaC5hcHBlbmRDaGlsZCh0aGlzLmdvYWxBcmVhTGVmdCk7XG5cbiAgdGhpcy5nb2FsQXJlYVJpZ2h0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHRoaXMuZ29hbEFyZWFSaWdodC5jbGFzc05hbWUgPSBjc3NbJ2dvYWwtYXJlYS1yaWdodCddO1xuICB0aGlzLnBpdGNoLmFwcGVuZENoaWxkKHRoaXMuZ29hbEFyZWFSaWdodCk7XG5cbiAgdGhpcy5jb3JuZXJBcmNUb3BMZWZ0ID0gY3JlYXRlQ2VudGVyQ2lyY2xlKHsgeDogJ0xlZnQnLCB5OiAnVG9wJyB9LCAwLCAyICogTWF0aC5QSSwgMjQpO1xuICB0aGlzLmNvcm5lckFyY1RvcExlZnQuY2xhc3NOYW1lID0gY3NzWydjb3JuZXItYXJjLXRvcC1sZWZ0J107XG4gIHRoaXMucGl0Y2guYXBwZW5kQ2hpbGQodGhpcy5jb3JuZXJBcmNUb3BMZWZ0KTtcblxuICB0aGlzLmNvcm5lckFyY0JvdHRvbUxlZnQgPSBjcmVhdGVDZW50ZXJDaXJjbGUoeyB4OiAnTGVmdCcsIHk6ICdCb3R0b20nIH0sIDAsIDIgKiBNYXRoLlBJLCAyNCk7XG4gIHRoaXMuY29ybmVyQXJjQm90dG9tTGVmdC5jbGFzc05hbWUgPSBjc3NbJ2Nvcm5lci1hcmMtYm90dG9tLWxlZnQnXTtcbiAgdGhpcy5waXRjaC5hcHBlbmRDaGlsZCh0aGlzLmNvcm5lckFyY0JvdHRvbUxlZnQpO1xuXG4gIHRoaXMuY29ybmVyQXJjVG9wUmlnaHQgPSBjcmVhdGVDZW50ZXJDaXJjbGUoeyB4OiAnUmlnaHQnLCB5OiAnVG9wJyB9LCAwLCAyICogTWF0aC5QSSwgMjQpO1xuICB0aGlzLmNvcm5lckFyY1RvcFJpZ2h0LmNsYXNzTmFtZSA9IGNzc1snY29ybmVyLWFyYy10b3AtcmlnaHQnXTtcbiAgdGhpcy5waXRjaC5hcHBlbmRDaGlsZCh0aGlzLmNvcm5lckFyY1RvcFJpZ2h0KTtcblxuICB0aGlzLmNvcm5lckFyY0JvdHRvbVJpZ2h0ID0gY3JlYXRlQ2VudGVyQ2lyY2xlKHsgeDogJ1JpZ2h0JywgeTogJ0JvdHRvbScgfSwgMCwgMiAqIE1hdGguUEksIDI0KTtcbiAgdGhpcy5jb3JuZXJBcmNCb3R0b21SaWdodC5jbGFzc05hbWUgPSBjc3NbJ2Nvcm5lci1hcmMtYm90dG9tLXJpZ2h0J107XG4gIHRoaXMucGl0Y2guYXBwZW5kQ2hpbGQodGhpcy5jb3JuZXJBcmNCb3R0b21SaWdodCk7XG5cbiAgdGhpcy5nb2FsTmV0c0xlZnQgPSBzcHJpdGUuY3JlYXRlKCdnb2FsX25ldHMnKTtcbiAgdGhpcy5nb2FsTmV0c0xlZnQuZWwuY2xhc3NOYW1lID0gY3NzWydnb2FsLW5ldHMtbGVmdCddO1xuICB0aGlzLmVsLmFwcGVuZENoaWxkKHRoaXMuZ29hbE5ldHNMZWZ0LmVsKTtcblxuICB0aGlzLmdvYWxOZXRzUmlnaHQgPSBzcHJpdGUuY3JlYXRlKCdnb2FsX25ldHMnKTtcbiAgdGhpcy5nb2FsTmV0c1JpZ2h0LmVsLmNsYXNzTmFtZSA9IGNzc1snZ29hbC1uZXRzLXJpZ2h0J107XG4gIHRoaXMuZWwuYXBwZW5kQ2hpbGQodGhpcy5nb2FsTmV0c1JpZ2h0LmVsKTtcbiAgdGhpcy5nb2FsTmV0c1JpZ2h0LmVsLnN0eWxlLmJhY2tncm91bmRQb3NpdGlvbiA9ICcwICcgKyAoLSh0aGlzLmdvYWxOZXRzUmlnaHQuaGVpZ2h0ICogdGhpcy5nb2FsTmV0c1JpZ2h0LnNjYWxlICsgMykpICsgJ3B4JztcblxuICB0aGlzLmNvcm5lckZsYWdUb3BMZWZ0ID0gc3ByaXRlLmNyZWF0ZSgnY29ybmVyX2ZsYWcnKTtcbiAgdGhpcy5jb3JuZXJGbGFnVG9wTGVmdC5lbC5jbGFzc05hbWUgPSBjc3NbJ2Nvcm5lci1mbGFnLXRvcC1sZWZ0J107XG4gIHRoaXMuZWwuYXBwZW5kQ2hpbGQodGhpcy5jb3JuZXJGbGFnVG9wTGVmdC5lbCk7XG4gIHRoaXMuY29ybmVyRmxhZ1RvcExlZnQuZWwuc3R5bGUubWFyZ2luVG9wID0gLSgodGhpcy5jb3JuZXJGbGFnVG9wTGVmdC5oZWlnaHQpICogdGhpcy5jb3JuZXJGbGFnVG9wTGVmdC5zY2FsZSkgKyAncHgnO1xuXG4gIHRoaXMuY29ybmVyRmxhZ0JvdHRvbUxlZnQgPSBzcHJpdGUuY3JlYXRlKCdjb3JuZXJfZmxhZycpO1xuICB0aGlzLmNvcm5lckZsYWdCb3R0b21MZWZ0LmVsLmNsYXNzTmFtZSA9IGNzc1snY29ybmVyLWZsYWctYm90dG9tLWxlZnQnXTtcbiAgdGhpcy5lbC5hcHBlbmRDaGlsZCh0aGlzLmNvcm5lckZsYWdCb3R0b21MZWZ0LmVsKTtcbiAgLy8gdGhpcy5jb3JuZXJGbGFnQm90dG9tTGVmdC5lbC5zdHlsZS5tYXJnaW5Ub3AgPSArKDMgKiB0aGlzLmNvcm5lckZsYWdCb3R0b21MZWZ0LnNjYWxlKSArICdweCc7XG5cbiAgdGhpcy5jb3JuZXJGbGFnVG9wUmlnaHQgPSBzcHJpdGUuY3JlYXRlKCdjb3JuZXJfZmxhZycpO1xuICB0aGlzLmNvcm5lckZsYWdUb3BSaWdodC5lbC5jbGFzc05hbWUgPSBjc3NbJ2Nvcm5lci1mbGFnLXRvcC1yaWdodCddO1xuICB0aGlzLmVsLmFwcGVuZENoaWxkKHRoaXMuY29ybmVyRmxhZ1RvcFJpZ2h0LmVsKTtcbiAgdGhpcy5jb3JuZXJGbGFnVG9wUmlnaHQuZWwuc3R5bGUubWFyZ2luVG9wID0gLSgodGhpcy5jb3JuZXJGbGFnVG9wUmlnaHQuaGVpZ2h0KSAqIHRoaXMuY29ybmVyRmxhZ1RvcFJpZ2h0LnNjYWxlKSArICdweCc7XG5cbiAgdGhpcy5jb3JuZXJGbGFnQm90dG9tUmlnaHQgPSBzcHJpdGUuY3JlYXRlKCdjb3JuZXJfZmxhZycpO1xuICB0aGlzLmNvcm5lckZsYWdCb3R0b21SaWdodC5lbC5jbGFzc05hbWUgPSBjc3NbJ2Nvcm5lci1mbGFnLWJvdHRvbS1yaWdodCddO1xuICB0aGlzLmVsLmFwcGVuZENoaWxkKHRoaXMuY29ybmVyRmxhZ0JvdHRvbVJpZ2h0LmVsKTtcbiAgLy8gdGhpcy5jb3JuZXJGbGFnQm90dG9tUmlnaHQuZWwuc3R5bGUubWFyZ2luVG9wID0gLSgodGhpcy5jb3JuZXJGbGFnQm90dG9tUmlnaHQuaGVpZ2h0KSAqIHRoaXMuY29ybmVyRmxhZ0JvdHRvbVJpZ2h0LnNjYWxlKSArICdweCc7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUNlbnRlckNpcmNsZShzaWRlLCBhLCBiLCBjKSB7XG4gIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgY2FudmFzLndpZHRoID0gY2FudmFzLmhlaWdodCA9IGMgfHwgMTI0O1xuICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICB2YXIgY2VudGVyWCA9IGNhbnZhcy53aWR0aCAvIDI7XG4gIHZhciBjZW50ZXJZID0gY2FudmFzLmhlaWdodCAvIDI7XG4gIHZhciByYWRpdXMgPSBjYW52YXMud2lkdGggLyAyLjQ7XG5cbiAgY29udGV4dC5pbWFnZVNtb290aGluZ0VuYWJsZWQgPSBmYWxzZTtcblxuICBjb250ZXh0LmJlZ2luUGF0aCgpO1xuICBjb250ZXh0LmFyYyhjZW50ZXJYLCBjZW50ZXJZLCByYWRpdXMsIGEgfHwgMCwgYiB8fCAoMiAqIE1hdGguUEkpLCB0cnVlKTtcbiAgY29udGV4dC5saW5lV2lkdGggPSAxO1xuICBjb250ZXh0LnN0cm9rZVN0eWxlID0gJyNmZmYnO1xuICBjb250ZXh0LnN0cm9rZSgpO1xuXG4gIHZhciBwbmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcbiAgcG5nLnNyYyA9IGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycpO1xuXG4gIHZhciBzZWNvbmQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgc2Vjb25kLndpZHRoID0gc2Vjb25kLmhlaWdodCA9IGNhbnZhcy53aWR0aCAqIDM7XG4gIHNlY29uZC5zdHlsZVsnbWFyZ2luJyArIChzaWRlID8gc2lkZS54IDogJ0xlZnQnKV0gPSAtKGNhbnZhcy53aWR0aCAqIDMgLyAyKSArICdweCc7XG4gIHNlY29uZC5zdHlsZVsnbWFyZ2luJyArIChzaWRlID8gc2lkZS55IDogJ1RvcCcpXSA9IC0oY2FudmFzLndpZHRoICogMyAvIDIpICsgJ3B4JztcbiAgdmFyIGN0eCA9IHNlY29uZC5nZXRDb250ZXh0KCcyZCcpO1xuICBjdHguaW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XG4gIGN0eC5kcmF3SW1hZ2UocG5nLCAwLCAwLCBjYW52YXMud2lkdGggKiAzLCBjYW52YXMuaGVpZ2h0ICogMyk7XG4gIHJldHVybiBzZWNvbmQ7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUdyYXNzKCkge1xuICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gIGNhbnZhcy5oZWlnaHQgPSA2MDtcbiAgY2FudmFzLndpZHRoID0gY2FudmFzLmhlaWdodCAqIDI7XG4gIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gIGNvbnRleHQuZmlsbFN0eWxlID0gJyMwOTAnO1xuICBjb250ZXh0LmZpbGxSZWN0KDAsMCxjYW52YXMud2lkdGgvMixjYW52YXMuaGVpZ2h0KTtcbiAgY29udGV4dC5maWxsU3R5bGUgPSAnIzA4MCc7XG4gIGNvbnRleHQuZmlsbFJlY3QoY2FudmFzLndpZHRoLzIsMCxjYW52YXMud2lkdGgvMixjYW52YXMuaGVpZ2h0KTtcbiAgZm9yICh2YXIgaSA9IDI1MDA7IGktLTspIHtcbiAgICBjb250ZXh0LmZpbGxTdHlsZSA9ICdyZ2JhKDAsMCwwLDAuMDM1KSc7XG4gICAgdmFyIHggPSBNYXRoLnJhbmRvbSgpICogY2FudmFzLndpZHRoIHwgMDtcbiAgICB2YXIgeSA9IE1hdGgucmFuZG9tKCkgKiBjYW52YXMuaGVpZ2h0IHwgMDtcbiAgICBjb250ZXh0LmZpbGxSZWN0KHgseSwxLDEpO1xuICB9XG4gIGZvciAodmFyIGkgPSA1MDA7IGktLTspIHtcbiAgICBjb250ZXh0LmZpbGxTdHlsZSA9ICdyZ2JhKDAsMjU1LDAsMC4wNSknO1xuICAgIHZhciB4ID0gTWF0aC5yYW5kb20oKSAqIGNhbnZhcy53aWR0aCB8IDA7XG4gICAgdmFyIHkgPSBNYXRoLnJhbmRvbSgpICogY2FudmFzLmhlaWdodCB8IDA7XG4gICAgY29udGV4dC5maWxsUmVjdCh4LHksMSwxKTtcbiAgfVxuXG4gIHZhciBwbmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcbiAgcG5nLnNyYyA9IGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycpO1xuXG4gIHZhciBzZWNvbmQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgc2Vjb25kLndpZHRoID0gY2FudmFzLndpZHRoICogMztcbiAgc2Vjb25kLmhlaWdodCA9IGNhbnZhcy5oZWlnaHQgKiAzO1xuICB2YXIgY3R4ID0gc2Vjb25kLmdldENvbnRleHQoJzJkJyk7XG4gIGN0eC5pbWFnZVNtb290aGluZ0VuYWJsZWQgPSBmYWxzZTtcbiAgY3R4LmRyYXdJbWFnZShwbmcsIDAsIDAsIGNhbnZhcy53aWR0aCAqIDMsIGNhbnZhcy5oZWlnaHQgKiAzKTtcblxuICByZXR1cm4gc2Vjb25kO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XCJzdGFkaXVtXCI6XCJfc3R5bGVfX3N0YWRpdW1cIixcInBpdGNoXCI6XCJfc3R5bGVfX3BpdGNoXCIsXCJoYWxmd2F5LWxpbmVcIjpcIl9zdHlsZV9faGFsZndheS1saW5lXCIsXCJjZW50ZXItY2lyY2xlXCI6XCJfc3R5bGVfX2NlbnRlci1jaXJjbGVcIixcImNlbnRlci1zcG90XCI6XCJfc3R5bGVfX2NlbnRlci1zcG90XCIsXCJwZW5hbHR5LWFyYy1sZWZ0XCI6XCJfc3R5bGVfX3BlbmFsdHktYXJjLWxlZnRcIixcInBlbmFsdHktc3BvdC1sZWZ0XCI6XCJfc3R5bGVfX3BlbmFsdHktc3BvdC1sZWZ0XCIsXCJwZW5hbHR5LWFyYy1yaWdodFwiOlwiX3N0eWxlX19wZW5hbHR5LWFyYy1yaWdodFwiLFwicGVuYWx0eS1zcG90LXJpZ2h0XCI6XCJfc3R5bGVfX3BlbmFsdHktc3BvdC1yaWdodFwiLFwicGVuYWx0eS1hcmVhLWxlZnRcIjpcIl9zdHlsZV9fcGVuYWx0eS1hcmVhLWxlZnRcIixcInBlbmFsdHktYXJlYS1yaWdodFwiOlwiX3N0eWxlX19wZW5hbHR5LWFyZWEtcmlnaHRcIixcImdvYWwtYXJlYS1sZWZ0XCI6XCJfc3R5bGVfX2dvYWwtYXJlYS1sZWZ0XCIsXCJnb2FsLWFyZWEtcmlnaHRcIjpcIl9zdHlsZV9fZ29hbC1hcmVhLXJpZ2h0XCIsXCJjb3JuZXItYXJjLWJvdHRvbS1sZWZ0XCI6XCJfc3R5bGVfX2Nvcm5lci1hcmMtYm90dG9tLWxlZnRcIixcImNvcm5lci1hcmMtdG9wLXJpZ2h0XCI6XCJfc3R5bGVfX2Nvcm5lci1hcmMtdG9wLXJpZ2h0XCIsXCJjb3JuZXItYXJjLWJvdHRvbS1yaWdodFwiOlwiX3N0eWxlX19jb3JuZXItYXJjLWJvdHRvbS1yaWdodFwiLFwiZ29hbC1uZXRzLWxlZnRcIjpcIl9zdHlsZV9fZ29hbC1uZXRzLWxlZnRcIixcImdvYWwtbmV0cy1yaWdodFwiOlwiX3N0eWxlX19nb2FsLW5ldHMtcmlnaHRcIixcImNvcm5lci1mbGFnLXRvcC1sZWZ0XCI6XCJfc3R5bGVfX2Nvcm5lci1mbGFnLXRvcC1sZWZ0XCIsXCJjb3JuZXItZmxhZy1ib3R0b20tbGVmdFwiOlwiX3N0eWxlX19jb3JuZXItZmxhZy1ib3R0b20tbGVmdFwiLFwiY29ybmVyLWZsYWctdG9wLXJpZ2h0XCI6XCJfc3R5bGVfX2Nvcm5lci1mbGFnLXRvcC1yaWdodFwiLFwiY29ybmVyLWZsYWctYm90dG9tLXJpZ2h0XCI6XCJfc3R5bGVfX2Nvcm5lci1mbGFnLWJvdHRvbS1yaWdodFwifSJdfQ==
