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
  this.speed = 0.13;
  this.friction = 0.49;
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
  Object.assign(this, sprite.create('player'));

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
 3v;v.vx.x.x.x.x.x.xx
 3vv.v;xx.x.x.x.x.x.x
 3v;v;vx.x.x.x.x.x.xx
 3vv.v;xx.x.x.x.x.x.x
 3v.v.vx.x.x.x.x.x.xx
 3vv.v.xx.x.x.x.x.x.x
 3v;v.vx.x.x.x.x.x.xx
 3vv.v.xx.x.x.x.x.x.x
 3v.v.vx.x.x.x.x.x.xx
 3vv.v.xx.x.x.x.x.x.x
 3v.v.vx.x.x.x.x.x.xx
 3vv.v.xx.x.x.x.x.x.x
 3v;v.vx.x.x.x.x.x.xx
 3vv.v.xx.x.x.x.x.x.x
 3v;v.vx.x.x.x.x.x.xx
 3vv.v.xx.x.x.x.x.x.x
 3v.v.vx.x.x.x.x.x.xx
 3vv.v.xx.x.x.x.x.x.x
 3v.v.vx.x.x.x.x.x.xx
 3vv.v.xx.x.x.x.x.x.x
 3v.v.vx.x.x.x.x.x.xx
 3vv.v.xx.x.x.x.x.x.x
 3v;v.vx.x.x.x.x.x.xx
 3vv.v.xx.x.x.x.x.x.x
 3v;v.vx.x.x.x.x.x.xx
 3vv.v.xx.x.x.x.x.x.x
 3v;v;vx.x.x.x.x.x.xx
 3vv.v.xx.x.x.x.x.x.x
 3v.v.vx.x.x.x.x.x.xx
 3vv.v.xx.x.x.x.x.x.x
 3v;v.vx.x.x.x.x.x.xx
 3vv;v.xx.x.x.x.x.x.x
 3v;v.vx.x.x.x.x.x.xx
 3vv.v.xx.x.x.x.x.x.x
 3v.v.vx.x.x.x.x.x.xx
 3vv.v;xxxxxxxxxxxxxx
 3v.v.xx;x;x.x.x.x.xx
 3vv.xx;x.x.x.x.x.x.x
 3v;xx;x.x.x.x.x.x.xx
 3vx;xx.x.x.x.x.x.x;x
 3v;xx.x.x.x.x.x.x;xx
 3vxx;x.x.x.x.x.x.x;x
 3vxxx.x.x.x.x.x.x;xx
 3vxx;x.x.x.x;x.x;x;x
 3xxxxxxxxxxxxxxxxxxx
 33333333888888888888
   333333333338888888
       33333333333333\
`,
];

sprite.goal_nets.palette = {
  'x': '#fff',
  'v': '#ddd',
  ';': 'rgba(200,200,200,.6)',
  '.': 'rgba(150,150,150,.5)',
  '/': 'rgba(180,180,180,.6)',
  '3': 'rgba(0,0,0,.2)',
  '8': 'rgba(0,0,0,.3)',
};
sprite.goal_nets.width = sprite.goal_nets[0].split('\n')[0].length;
sprite.goal_nets.height = sprite.goal_nets[0].split('\n').length + 5;
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
  '7': 'rgba(0,0,0,.3)',
};
sprite.corner_flag.width = 5;
sprite.corner_flag.height = sprite.corner_flag[0].split('\n').length - 1;
sprite.corner_flag.scale = sprite.scale;

sprite.create = function createSprite(name) {
  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');
  var s = sprite[name];

  canvas.width = s.length * s.width * s.scale;
  canvas.height = s.scale * 2 + s.height * s.scale * 2;

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
      if ('string' === typeof art) art = art.split('\n');
      art = art.map(row => padRight(row, s.width).split('').reverse().join(''));
      pixel.art(art)
      .palette(s.palette)
      .scale(s.scale).pos({
        x: s.width * s.scale * index,
        y: s.height * s.scale + s.scale
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
  this.goalNetsLeft.el.style.marginTop = -(this.goalNetsLeft.height * this.goalNetsLeft.scale / 2) + 'px';
  this.goalNetsLeft.el.style.marginLeft = -((this.goalNetsLeft.width - 1) * this.goalNetsLeft.scale) + 'px';

  this.goalNetsRight = sprite.create('goal_nets');
  this.goalNetsRight.el.className = css['goal-nets-right'];
  this.el.appendChild(this.goalNetsRight.el);
  this.goalNetsRight.el.style.backgroundPosition = '0 ' + (-(this.goalNetsRight.height * this.goalNetsRight.scale + 3)) + 'px';
  this.goalNetsRight.el.style.marginTop = -(this.goalNetsRight.height * this.goalNetsRight.scale / 2) + 'px';
  this.goalNetsRight.el.style.marginRight = -((this.goalNetsRight.width + 1) * this.goalNetsRight.scale) + 'px';

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
    context.fillStyle = 'rgba(0,0,0,0.03)';
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsImxpYi9hcnJvd3MuanMiLCJsaWIvbG9vcC5qcyIsImxpYi9tZXJnZS5qcyIsImxpYi9wb2ludC5qcyIsIm5vZGVfbW9kdWxlcy9ldmVudHMvZXZlbnRzLmpzIiwibm9kZV9tb2R1bGVzL3BpeGVsLWFydC9pbmRleC5qcyIsInNyYy9jYW1lcmEuanMiLCJzcmMvcGxheWVyLmpzIiwic3JjL3Nwcml0ZS5qcyIsInNyYy9zdGFkaXVtLmpzIiwic3R5bGUuY3NzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZLQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJyZXF1aXJlKCcuL3N0eWxlLmNzcycpO1xudmFyIExvb3AgPSByZXF1aXJlKCcuL2xpYi9sb29wJyk7XG52YXIgYXJyb3dzID0gcmVxdWlyZSgnLi9saWIvYXJyb3dzJyk7XG52YXIgU3RhZGl1bSA9IHJlcXVpcmUoJy4vc3JjL3N0YWRpdW0nKTtcbnZhciBDYW1lcmEgPSByZXF1aXJlKCcuL3NyYy9jYW1lcmEnKTtcbnZhciBQbGF5ZXIgPSByZXF1aXJlKCcuL3NyYy9wbGF5ZXInKTtcblxudmFyIGsgPSBhcnJvd3MoZG9jdW1lbnQuYm9keSk7XG5cbnZhciBzdGFkaXVtID0gbmV3IFN0YWRpdW07XG52YXIgcGxheWVyID0gbmV3IFBsYXllcjtcbnZhciBjYW1lcmEgPSBuZXcgQ2FtZXJhKHBsYXllcik7XG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHN0YWRpdW0uZWwpO1xuZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChwbGF5ZXIuZWwpO1xuLy8gcGxheWVyLnBvcy54ID0gcGxheWVyLnB4LnggPSAyMzAwIC8gMiAtIHBsYXllci53aWR0aCAqIHBsYXllci5zY2FsZSAvIDI7XG4vLyBwbGF5ZXIucG9zLnkgPSBwbGF5ZXIucHgueSA9IDE3MDAgLyAyIC0gcGxheWVyLmhlaWdodCAqIHBsYXllci5zY2FsZTtcbnBsYXllci5wb3MueSA9IHBsYXllci5weC55ID0gNTAwO1xucGxheWVyLnBvcy54ID0gcGxheWVyLnB4LnggPSA1MDA7XG5cbi8qIGxvb3AgKi9cblxudmFyIGxvb3AgPSBuZXcgTG9vcDtcblxubG9vcC5vbigndXBkYXRlJywgKCkgPT4ge1xuICBjb250cm9scygpO1xuICB1cGRhdGUoKTtcbn0pO1xuXG5sb29wLm9uKCdyZW5kZXInLCByZW5kZXIpO1xuXG5sb29wLmZwcygxNCkuc3RhcnQoKTtcblxuZnVuY3Rpb24gdXBkYXRlKCkge1xuICBwbGF5ZXIudXBkYXRlKCk7XG4gIGNhbWVyYS51cGRhdGUoKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyKGR0LCBhbHBoYSwgZnJhbWUsIGVsYXBzZWQpIHtcbiAgcGxheWVyLnJlbmRlcihkdCwgYWxwaGEpO1xuICBjYW1lcmEucmVuZGVyKGR0LCBhbHBoYSlcbn1cblxuZnVuY3Rpb24gY29udHJvbHMoKSB7XG4gIGsgJiBrLmxlZnQgICYmIHBsYXllci5tb3ZlKC0xLDApO1xuICBrICYgay51cCAgICAmJiBwbGF5ZXIubW92ZSgwLC0xKTtcbiAgayAmIGsucmlnaHQgJiYgcGxheWVyLm1vdmUoMSwwKTtcbiAgayAmIGsuZG93biAgJiYgcGxheWVyLm1vdmUoMCwxKTtcbn1cbiIsIlxuLyohXG4gKlxuICogYXJyb3dzXG4gKlxuICogTUlUXG4gKlxuICovXG5cbi8qKlxuICogQ29udHJvbCBmbGFncy5cbiAqL1xuXG52YXIgY3RybCA9IHtcbiAgbGVmdDogIDEsXG4gIHVwOiAgICAyLFxuICByaWdodDogNCxcbiAgZG93bjogIDgsXG4gIHNob290OiAxNlxufTtcblxuLyoqXG4gKiBPcHBvc2l0ZSBkaXJlY3Rpb25zIGZsYWdzLlxuICovXG5cbnZhciBvcHAgPSB7XG4gIDE6IDQsXG4gIDI6IDgsXG4gIDQ6IDEsXG4gIDg6IDJcbn07XG5cbi8qKlxuICogS2V5bWFwLlxuICovXG5cbnZhciBtYXAgPSB7XG4gIDM3OiBjdHJsLmxlZnQsXG4gIDM4OiBjdHJsLnVwLFxuICAzOTogY3RybC5yaWdodCxcbiAgNDA6IGN0cmwuZG93bixcbiAgMTY6IGN0cmwuc2hvb3QsIC8vIHNoaWZ0XG4gIDE3OiBjdHJsLnNob290LCAvLyBjdHJsXG4gIDg4OiBjdHJsLnNob290LCAvLyB4XG4gIDkwOiBjdHJsLnNob290ICAvLyB6XG59O1xuXG4vKipcbiAqIEFycm93cy5cbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWwpe1xuICAvLyBiaXRtYXNrc1xuICB2YXIgZG93biA9IDA7XG4gIHZhciBrZXlzID0gMDtcblxuICB2YXIgYXJyb3dzID0ge307XG5cbiAgZWwuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9ua2V5ZG93bik7XG4gIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgb25rZXl1cCk7XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGBrZXlzYCBiaXRtYXNrIHdoZW4gZXZhbHVhdGVkLFxuICAgKiB0byB1c2Ugd2l0aCBsb2dpY2FsIG9wZXJhdGlvbnMuXG4gICAqXG4gICAqIEByZXR1cm4ge051bWJlcn0ga2V5c1xuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhcnJvd3MudmFsdWVPZiA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIGtleXM7XG4gIH07XG5cbiAgLy8gbWVyZ2UgY29udHJvbCBmbGFncyB0b1xuICAvLyB1c2Ugd2l0aCBsb2dpY2FsIG9wZXJhdGlvbnNcbiAgLy8gaS5lOiBhcnJvd3MgJiBhcnJvd3MubGVmdCAmJiBsZWZ0KClcbiAgbWVyZ2UoYXJyb3dzLCBjdHJsKTtcblxuICByZXR1cm4gYXJyb3dzO1xuXG4gIC8qKlxuICAgKiBLZXlkb3duIGhhbmRsZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gICAqIEBwYXJhbSB7TnVtYmVyfSBrZXlcbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuXG4gIGZ1bmN0aW9uIG9ua2V5ZG93bihldmVudCl7XG4gICAga2V5ID0gZXZlbnQud2hpY2g7XG4gICAgaWYgKCEoa2V5IGluIG1hcCkpIHJldHVybjtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGtleSA9IG1hcFtrZXldO1xuXG4gICAgLy8gT1IgYGtleWBcbiAgICBrZXlzID0gZG93biB8PSBrZXk7XG5cbiAgICAvLyByZWNlbnQgb3Bwb3NpdGUgYGtleWAgdGFrZXMgcHJlY2VkZW5jZVxuICAgIC8vIHNvIFhPUiBvbGQgZnJvbSB0aGUgYGtleXNgIGJpdG1hc2tcbiAgICBpZiAoa2V5cyAmIG9wcFtrZXldKSB7XG4gICAgICBrZXlzIF49IG9wcFtrZXldO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBLZXl1cCBoYW5kbGVyLlxuICAgKlxuICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICAgKiBAcGFyYW0ge051bWJlcn0ga2V5XG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cblxuICBmdW5jdGlvbiBvbmtleXVwKGV2ZW50KXtcbiAgICBrZXkgPSBldmVudC53aGljaDtcbiAgICBpZiAoIShrZXkgaW4gbWFwKSkgcmV0dXJuO1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAga2V5ID0gbWFwW2tleV07XG5cbiAgICAvLyBYT1IgYGtleWBcbiAgICBrZXlzID0gZG93biBePSBrZXk7XG4gIH1cbn07XG5cbi8qKlxuICogTWVyZ2UgdXRpbC5cbiAqL1xuXG5mdW5jdGlvbiBtZXJnZSh0YXJnZXQsIHNyYykge1xuICBmb3IgKHZhciBrZXkgaW4gc3JjKSB7XG4gICAgdGFyZ2V0W2tleV0gPSBzcmNba2V5XTtcbiAgfVxufVxuIiwiXG4vKiFcbiAqXG4gKiBsb29wXG4gKlxuICogTUlUIGxpY2Vuc2VkLlxuICpcbiAqL1xuXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcjtcblxuLyoqXG4gKiBFeHBvc2UgYExvb3BgLlxuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IExvb3A7XG5cbi8qKlxuICogTG9vcCBjb25zdHJ1Y3Rvci5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gZnBzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIExvb3AoZnBzKSB7XG4gIHRoaXMubm93ID0gMDtcbiAgdGhpcy5iZWZvcmUgPSAwO1xuICB0aGlzLmRlbHRhVGltZSA9IDA7XG4gIHRoaXMubWF4RGVsdGFUaW1lID0gMDtcbiAgdGhpcy50aW1lU3RlcCA9IDA7XG4gIHRoaXMuc3RhcnRUaW1lID0gMDtcbiAgdGhpcy50aW1lRWxhcHNlZCA9IDA7XG4gIHRoaXMuYWNjdW11bGF0b3IgPSAwO1xuICB0aGlzLnRpY2tpbmcgPSBmYWxzZTtcbiAgdGhpcy5mcmFtZSA9IDA7XG4gIHRoaXMuX2ZwcyA9IDA7XG4gIHRoaXMuZnBzKGZwcyB8fCA2MCk7XG59XG5cbi8qKlxuICogTWFrZSBFbWl0dGVyLlxuICovXG5cbkxvb3AucHJvdG90eXBlLl9fcHJvdG9fXyA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGU7XG5cbi8qKlxuICogU3RhcnQuXG4gKlxuICogQHJldHVybiB7TG9vcH0gdGhpc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5Mb29wLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnN0YXJ0VGltZSA9XG4gIHRoaXMubm93ID1cbiAgdGhpcy5iZWZvcmUgPSBEYXRlLm5vdygpO1xuXG4gIHRoaXMuZW1pdCgnc3RhcnQnKTtcblxuICB0aGlzLnRpY2tpbmcgPSB0cnVlO1xuICB0aGlzLnRpY2soKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFBhdXNlLlxuICpcbiAqIEByZXR1cm4ge0xvb3B9IHRoaXNcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuTG9vcC5wcm90b3R5cGUucGF1c2UgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy50aWNraW5nID0gZmFsc2U7XG4gIHRoaXMuZW1pdCgncGF1c2UnKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNldCBvciBnZXQgZnJhbWVzIHBlciBzZWNvbmQuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IFtmcHNdXG4gKiBAcmV0dXJuIHtOdW1iZXJ8TG9vcH0gZnBzfHRoaXNcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuTG9vcC5wcm90b3R5cGUuZnBzID0gZnVuY3Rpb24oZnBzKSB7XG4gIGlmICghZnBzKSByZXR1cm4gdGhpcy5fZnBzO1xuICB0aGlzLl9mcHMgPSBmcHM7XG4gIHRoaXMudGltZVN0ZXAgPSAxMDAwIC8gdGhpcy5fZnBzIHwgMDtcbiAgdGhpcy5tYXhEZWx0YVRpbWUgPSB0aGlzLnRpbWVTdGVwICogNTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFRpY2suXG4gKlxuICogQHJldHVybiB7TG9vcH0gdGhpc1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuTG9vcC5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHZhciBhbHBoYTtcblxuICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRpY2spO1xuXG4gIHJldHVybiB0aGlzO1xuXG4gIGZ1bmN0aW9uIHRpY2soKSB7XG4gICAgaWYgKCFzZWxmLnRpY2tpbmcpIHJldHVybjtcblxuICAgIC8vIHJlcXVlc3QgYW5pbWF0aW9uIGZyYW1lIGVhcmx5XG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKTtcblxuICAgIC8vIHRpbWVyXG4gICAgc2VsZi5ub3cgPSBEYXRlLm5vdygpO1xuICAgIHNlbGYudGltZUVsYXBzZWQgPSBzZWxmLm5vdyAtIHNlbGYuc3RhcnRUaW1lO1xuICAgIHNlbGYuZGVsdGFUaW1lID0gc2VsZi5ub3cgLSBzZWxmLmJlZm9yZTtcbiAgICBzZWxmLmJlZm9yZSA9IHNlbGYubm93O1xuXG4gICAgLy8gZGlzY2FyZCB1cGRhdGVzIHdoZW4gdGljayB0b28gYmlnXG4gICAgaWYgKHNlbGYuZGVsdGFUaW1lID4gc2VsZi5tYXhEZWx0YVRpbWUpIHtcbiAgICAgIHNlbGYuZW1pdCgnZGlzY2FyZCcsIHNlbGYuZGVsdGFUaW1lIC8gc2VsZi50aW1lU3RlcCwgc2VsZi5kZWx0YVRpbWUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGFjY3VtdWxhdGUgdG8gb3ZlcmZsb3dcbiAgICBzZWxmLmFjY3VtdWxhdG9yICs9IHNlbGYuZGVsdGFUaW1lO1xuXG4gICAgLy8gY29uc3VtZSBuZXcgZnJhbWVzIGlmIG92ZXJmbG93ZWRcbiAgICB3aGlsZSAoc2VsZi5hY2N1bXVsYXRvciA+PSBzZWxmLnRpbWVTdGVwKSB7XG4gICAgICBzZWxmLmFjY3VtdWxhdG9yIC09IHNlbGYudGltZVN0ZXA7XG5cbiAgICAgIC8vIHNlbmQgdXBkYXRlIGFuZCBhZHZhbmNlIGZyYW1lXG4gICAgICBzZWxmLmVtaXQoJ3VwZGF0ZScsIHNlbGYudGltZVN0ZXAsIDEsICsrc2VsZi5mcmFtZSwgc2VsZi50aW1lRWxhcHNlZCk7XG4gICAgfVxuXG4gICAgLy8gY29tcHV0ZSBhbHBoYVxuICAgIGFscGhhID0gc2VsZi5hY2N1bXVsYXRvciAvIHNlbGYudGltZVN0ZXA7XG4gICAgc2VsZi5lbWl0KCdyZW5kZXInLCBzZWxmLmRlbHRhVGltZSwgYWxwaGEsIHNlbGYuZnJhbWUsIHNlbGYudGltZUVsYXBzZWQpO1xuICB9XG59O1xuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHRhcmdldCwgc3JjKSB7XG4gIGZvciAodmFyIGtleSBpbiBzcmMpIHtcbiAgICB0YXJnZXRba2V5XSA9IHNyY1trZXldO1xuICB9XG4gIHJldHVybiB0YXJnZXQ7XG59O1xuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IFBvaW50O1xuXG5mdW5jdGlvbiBQb2ludCgpIHtcbiAgdGhpcy54ID0gMDtcbiAgdGhpcy55ID0gMDtcbn1cblxuUG9pbnQucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnggKyAnLCcgKyB0aGlzLnk7XG59O1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gdGhpcy5fZXZlbnRzIHx8IHt9O1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG5FdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghaXNOdW1iZXIobikgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCduIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBlciwgaGFuZGxlciwgbGVuLCBhcmdzLCBpLCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEF0IGxlYXN0IGdpdmUgc29tZSBraW5kIG9mIGNvbnRleHQgdG8gdGhlIHVzZXJcbiAgICAgICAgdmFyIGVyciA9IG5ldyBFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4gKCcgKyBlciArICcpJyk7XG4gICAgICAgIGVyci5jb250ZXh0ID0gZXI7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc1VuZGVmaW5lZChoYW5kbGVyKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKGlzRnVuY3Rpb24oaGFuZGxlcikpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIGlmIChsaXN0ZW5lcnMpIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIGlmICh0aGlzLl9ldmVudHMpIHtcbiAgICB2YXIgZXZsaXN0ZW5lciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICAgIGlmIChpc0Z1bmN0aW9uKGV2bGlzdGVuZXIpKVxuICAgICAgcmV0dXJuIDE7XG4gICAgZWxzZSBpZiAoZXZsaXN0ZW5lcilcbiAgICAgIHJldHVybiBldmxpc3RlbmVyLmxlbmd0aDtcbiAgfVxuICByZXR1cm4gMDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICByZXR1cm4gZW1pdHRlci5saXN0ZW5lckNvdW50KHR5cGUpO1xufTtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IFBpeGVsQXJ0O1xuXG5mdW5jdGlvbiBQaXhlbEFydChyb3dzKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBQaXhlbEFydCkpIHJldHVybiBuZXcgUGl4ZWxBcnQocm93cyk7XG5cbiAgdGhpcy5fcGFsZXR0ZSA9IHt9O1xuICB0aGlzLl9zY2FsZSA9IDI7XG4gIHRoaXMuX3Jvd3MgPSBbXTtcbiAgdGhpcy5fcG9zID0geyB4OiAwLCB5OiAwIH07XG5cbiAgaWYgKHJvd3MpIHRoaXMuYXJ0KHJvd3MpO1xufVxuXG5QaXhlbEFydC5hcnQgPSBQaXhlbEFydC5wcm90b3R5cGUuYXJ0ID0gZnVuY3Rpb24ocm93cykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUGl4ZWxBcnQpKSByZXR1cm4gbmV3IFBpeGVsQXJ0KHJvd3MpO1xuICB0aGlzLl9yb3dzID0gJ3N0cmluZycgPT09IHR5cGVvZiByb3dzID8gcm93cy5zcGxpdCgnXFxuJykgOiByb3dzO1xuICByZXR1cm4gdGhpcztcbn07XG5cblBpeGVsQXJ0LnByb3RvdHlwZS5wYWxldHRlID0gZnVuY3Rpb24ocGFsZXR0ZSkge1xuICB0aGlzLl9wYWxldHRlID0gcGFsZXR0ZTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5QaXhlbEFydC5wcm90b3R5cGUuc2NhbGUgPSBmdW5jdGlvbihzY2FsZSkge1xuICB0aGlzLl9zY2FsZSA9IHNjYWxlO1xuICByZXR1cm4gdGhpcztcbn07XG5cblBpeGVsQXJ0LnByb3RvdHlwZS5wb3MgPSBmdW5jdGlvbihwb3MpIHtcbiAgdGhpcy5fcG9zID0gcG9zO1xuICByZXR1cm4gdGhpcztcbn07XG5cblBpeGVsQXJ0LnByb3RvdHlwZS5zaXplID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgd2lkdGg6IHRoaXMuX3Jvd3MucmVkdWNlKGZ1bmN0aW9uKG1heCwgY29scykge1xuICAgICAgcmV0dXJuIE1hdGgubWF4KG1heCwgY29scy5sZW5ndGgpO1xuICAgIH0sIDApICogdGhpcy5fc2NhbGUsXG4gICAgaGVpZ2h0OiB0aGlzLl9yb3dzLmxlbmd0aCAqIHRoaXMuX3NjYWxlXG4gIH07XG59O1xuXG5QaXhlbEFydC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGN0eCkge1xuICB2YXIgcCA9IHRoaXMuX3BvcztcbiAgdmFyIHMgPSB0aGlzLl9zY2FsZTtcbiAgdmFyIHJvd3MgPSB0aGlzLl9yb3dzO1xuICBmb3IgKHZhciBjb2xzLCB5ID0gMDsgeSA8IHJvd3MubGVuZ3RoOyB5KyspIHtcbiAgICBjb2xzID0gcm93c1t5XTtcbiAgICBmb3IgKHZhciBjb2wsIHggPSAwOyB4IDwgY29scy5sZW5ndGg7IHgrKykge1xuICAgICAgY29sID0gY29sc1t4XTtcbiAgICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLl9wYWxldHRlW2NvbF0gfHwgJ3RyYW5zcGFyZW50JztcbiAgICAgIGN0eC5maWxsUmVjdCh4KnMrcC54LCB5KnMrcC55LCBzLCBzKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuIiwidmFyIFBvaW50ID0gcmVxdWlyZSgnLi4vbGliL3BvaW50Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ2FtZXJhO1xuXG5mdW5jdGlvbiBDYW1lcmEobGVhZGVyKSB7XG4gIHRoaXMubGVhZGVyID0gbGVhZGVyO1xuICB0aGlzLnNwZWVkID0gMC4xMztcbiAgdGhpcy5mcmljdGlvbiA9IDAuNDk7XG4gIHRoaXMucHggPSBuZXcgUG9pbnQ7XG4gIHRoaXMucG9zID0gbmV3IFBvaW50O1xuICB0aGlzLnZlbCA9IG5ldyBQb2ludDtcbiAgdGhpcy5zaXplID0gbmV3IFBvaW50O1xuICB0aGlzLm9ucmVzaXplKCk7XG4gIHdpbmRvdy5vbnJlc2l6ZSA9IHRoaXMub25yZXNpemUuYmluZCh0aGlzKTtcbn1cblxuQ2FtZXJhLnByb3RvdHlwZS5vbnJlc2l6ZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnNpemUueCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICB0aGlzLnNpemUueSA9IHdpbmRvdy5pbm5lckhlaWdodDtcbn07XG5cbkNhbWVyYS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gIHZhciBkeCA9ICh0aGlzLmxlYWRlci5wb3MueCArIHRoaXMubGVhZGVyLndpZHRoICogdGhpcy5sZWFkZXIuc2NhbGUgLyAyIC0gdGhpcy5zaXplLnggLyAyKSAtIHRoaXMucG9zLng7XG4gIHZhciBkeSA9ICh0aGlzLmxlYWRlci5wb3MueSArIHRoaXMubGVhZGVyLmhlaWdodCAqIHRoaXMubGVhZGVyLnNjYWxlIC8gMiAtIHRoaXMuc2l6ZS55IC8gMikgLSB0aGlzLnBvcy55O1xuXG4gIHRoaXMudmVsLnggKz0gZHggKiB0aGlzLnNwZWVkO1xuICB0aGlzLnZlbC55ICs9IGR5ICogdGhpcy5zcGVlZDtcblxuICB0aGlzLnBvcy54ICs9IHRoaXMudmVsLng7XG4gIHRoaXMucG9zLnkgKz0gdGhpcy52ZWwueTtcblxuICB0aGlzLnZlbC54ICo9IHRoaXMuZnJpY3Rpb247XG4gIHRoaXMudmVsLnkgKj0gdGhpcy5mcmljdGlvbjtcbn07XG5cbkNhbWVyYS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oZHQsIGFscGhhKSB7XG4gIHRoaXMucHgueCArPSAodGhpcy5wb3MueCAtIHRoaXMucHgueCkgKiBhbHBoYTtcbiAgdGhpcy5weC55ICs9ICh0aGlzLnBvcy55IC0gdGhpcy5weC55KSAqIGFscGhhO1xuXG4gIHdpbmRvdy5zY3JvbGxUbyh0aGlzLnB4LngsIHRoaXMucHgueSk7XG59O1xuIiwidmFyIHNwcml0ZSA9IHJlcXVpcmUoJy4vc3ByaXRlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGxheWVyO1xuXG5mdW5jdGlvbiBQbGF5ZXIoKSB7XG4gIE9iamVjdC5hc3NpZ24odGhpcywgc3ByaXRlLmNyZWF0ZSgncGxheWVyJykpO1xuXG4gIHRoaXMuc3BlZWQgPSAxOTtcbiAgdGhpcy5mYWNlID0gJ3N0YW5kX2Rvd24nO1xuICB0aGlzLmZhY2VEdXJhdGlvbiA9IDQ7XG4gIHRoaXMuZmFjZUluZGV4ID0gMDtcbiAgdGhpcy5mYWNlTmVlZGxlID0gMDtcbiAgdGhpcy5mYWNlTWFwID0ge1xuICAgICcwLDAnOiAnc3RhbmRfZG93bicsXG4gICAgJy0xLDAnOiAncnVuX2xlZnQnLFxuICAgICcwLC0xJzogJ3J1bl91cCcsXG4gICAgJzEsMCc6ICdydW5fcmlnaHQnLFxuICAgICcwLDEnOiAncnVuX2Rvd24nLFxuICAgICctMSwtMSc6ICdydW5fdXBfbGVmdCcsXG4gICAgJzEsLTEnOiAncnVuX3VwX3JpZ2h0JyxcbiAgICAnLTEsMSc6ICdydW5fZG93bl9sZWZ0JyxcbiAgICAnMSwxJzogJ3J1bl9kb3duX3JpZ2h0JyxcbiAgfTtcbiAgdGhpcy5mYWNlU3RhbmRNYXAgPSB7XG4gICAgJzAsMCc6ICdzdGFuZF9kb3duJyxcbiAgICAnLTEsMCc6ICdzdGFuZF9sZWZ0JyxcbiAgICAnMCwtMSc6ICdzdGFuZF91cCcsXG4gICAgJzEsMCc6ICdzdGFuZF9yaWdodCcsXG4gICAgJzAsMSc6ICdzdGFuZF9kb3duJyxcbiAgICAnLTEsLTEnOiAnc3RhbmRfdXBfbGVmdCcsXG4gICAgJzEsLTEnOiAnc3RhbmRfdXBfcmlnaHQnLFxuICAgICctMSwxJzogJ3N0YW5kX2Rvd25fbGVmdCcsXG4gICAgJzEsMSc6ICdzdGFuZF9kb3duX3JpZ2h0JyxcbiAgfTtcbn1cblxuUGxheWVyLnByb3RvdHlwZS5tb3ZlID0gZnVuY3Rpb24oeCwgeSl7XG4gIHRoaXMudmVsLnggfD0geDtcbiAgdGhpcy52ZWwueSB8PSB5O1xufTtcblxuUGxheWVyLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5mYWNlID0gdGhpcy5mYWNlTWFwW3RoaXMudmVsXTtcbiAgdGhpcy5mYWNlU3RhbmRNYXBbJzAsMCddID1cbiAgdGhpcy5mYWNlTWFwWycwLDAnXSA9IHRoaXMuZmFjZVN0YW5kTWFwW3RoaXMudmVsXTtcblxuICB2YXIgc3BlZWQgPSB0aGlzLnNwZWVkO1xuICBpZiAodGhpcy52ZWwueCAmJiB0aGlzLnZlbC55KSBzcGVlZCAqPSAwLjc1O1xuXG4gIHRoaXMucG9zLnggKz0gdGhpcy52ZWwueCAqIHNwZWVkIHwgMDtcbiAgdGhpcy5wb3MueSArPSB0aGlzLnZlbC55ICogc3BlZWQgfCAwO1xuICB0aGlzLnZlbC54ID0gMDtcbiAgdGhpcy52ZWwueSA9IDA7XG59O1xuXG5QbGF5ZXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKGR0LCBhbHBoYSkge1xuICB0aGlzLnB4LnggKz0gKHRoaXMucG9zLnggLSB0aGlzLnB4LngpICogYWxwaGE7XG4gIHRoaXMucHgueSArPSAodGhpcy5wb3MueSAtIHRoaXMucHgueSkgKiBhbHBoYTtcblxuICB2YXIgaSA9IHRoaXMuZmFjZUluZGV4O1xuICB2YXIgbiA9IHRoaXMuZmFjZU5lZWRsZTtcbiAgbiAlPSB0aGlzLmFuaW1hdGlvblt0aGlzLmZhY2VdLmxlbmd0aDtcblxuICB2YXIgaW5kZXggPSB0aGlzLmFuaW1hdGlvblt0aGlzLmZhY2VdW25dO1xuICB2YXIgeCA9IGluZGV4WzBdICogdGhpcy53aWR0aCAqIHRoaXMuc2NhbGU7XG4gIHZhciB5ID0gaW5kZXhbMV0gPyB0aGlzLmhlaWdodCAqIHRoaXMuc2NhbGUgKyB0aGlzLnNjYWxlIDogMDtcbiAgdGhpcy5mYWNlSW5kZXggPSAoaSArIDEpICUgdGhpcy5mYWNlRHVyYXRpb247XG4gIGlmICh0aGlzLmZhY2VJbmRleCA9PT0gMCkgdGhpcy5mYWNlTmVlZGxlID0gbiArIDE7XG5cbiAgT2JqZWN0LmFzc2lnbih0aGlzLmVsLnN0eWxlLCB7XG4gICAgbGVmdDogdGhpcy5weC54ICsgJ3B4JyxcbiAgICB0b3A6IHRoaXMucHgueSArICdweCcsXG4gICAgYmFja2dyb3VuZFBvc2l0aW9uOiBgLSR7eH1weCAtJHt5fXB4YCxcbiAgfSk7XG59O1xuIiwidmFyIHBpeGVsID0gcmVxdWlyZSgncGl4ZWwtYXJ0Jyk7XG52YXIgbWVyZ2UgPSByZXF1aXJlKCcuLi9saWIvbWVyZ2UnKTtcbnZhciBQb2ludCA9IHJlcXVpcmUoJy4uL2xpYi9wb2ludCcpO1xuXG52YXIgc3ByaXRlID0gZXhwb3J0cztcblxuc3ByaXRlLnNjYWxlID0gMztcblxuLy8gYmFsbFxuXG5zcHJpdGUuYmFsbCA9IFtcbmBcXFxuIG94XG54b29vXG5vb3hvXG4gb29cXFxuYCxgXFxcbiB4b1xub29vb1xueG94b1xuIG9vXFxcbmAsYFxcXG4geG9cbm9vb29cbnhveG9cbiBvb1xcXG5gXG5dO1xuXG5zcHJpdGUuYmFsbC5wYWxldHRlID0ge1xuICAnbyc6ICcjZmZmJyxcbiAgJ3gnOiAnIzAwMCdcbn07XG5cbi8vIGJhbGwgc2hhZG93XG5cbnNwcml0ZS5iYWxsX3NoYWRvdyA9IFtgXFxcbiA3Nzdcbjc3Nzc3XG4gNzc3XFxcbmBdO1xuXG5zcHJpdGUuYmFsbF9zaGFkb3cucGFsZXR0ZSA9IHtcbiAgJzcnOiAncmdiYSgwLDAsMCwwLjMpJ1xufTtcblxuc3ByaXRlLnBsYXllciA9IFtcblxuLy8gMDogZG93blxuYFxcXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eC4uLnh4XG4gIHhveC54b3hcbiAgIC4uLi4uXG4gICAgIC5cbiAgIHR0dHR0XG4gIHQgdHR0IHRcbiAgLiB0dHQgLlxuICAgIHBwcFxuICAgIC4gLlxuICAgIHQgdFxuICAgc3Mgc3NcXFxuYCxcblxuLy8gMTogZG93biByaWdodFxuXG5gXFxcbiAgICB4eHhcbiAgIHh4eHh4XG4gIHh4Li4uLlxuICB4Lm94LnhvXG4gICAuLi4uLlxuICAgICAuXG4gICB0dHR0XG4gIHR0dHR0XG4gIC50dHR0XG4gICAgcHBwXG4gICAgLiAuXG4gICAgdCB0XG4gICAgc3Nzc1xcXG5gLFxuXG4vLyAyOiByaWdodFxuYFxcXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eHguLi5cbiAgeHguLm94XG4gICB4Li4uLlxuICAgICAuXG4gICAgdHR0XG4gICB0dHR0XG4gICAudHR0XG4gICAgcHBcbiAgICAuLlxuICAgIHR0XG4gICAgc3NzXFxcbmAsXG5cbi8vIDM6IHVwIHJpZ2h0XG5cbmBcXFxuICAgIHh4eFxuICAgeHh4eHhcbiAgeHh4eHguXG4gIHh4eHgub3hcbiAgIHh4Li4uXG4gICAgIC5cbiAgIHR0dHRcbiAgIHR0dHR0XG4gICB0dHR0LlxuICAgIHBwcFxuICAgIC4gLlxuICAgIHQgdFxuICAgIHNzc3NcXFxuYCxcblxuLy8gNDogdXBcblxuYFxcXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eHh4eHh4XG4gIHh4eHh4eHhcbiAgIC54eHguXG4gICAgIC5cbiAgIHR0dHR0XG4gIHQgdHR0IHRcbiAgLiB0dHQgLlxuICAgIHBwcFxuICAgIC4gLlxuICAgIHQgdFxuICAgc3Mgc3NcXFxuYCxcblxuLy8gNTogcnVuIHJpZ2h0IDFcblxuYFxcXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eHguLi5cbiAgeHguLm94XG4gICB4Li4uLlxuICAgICAuXG4gICB0dHR0XG4gIHR0dHR0XG4gIC4gdHR0LlxuICAgIHBwcFxuICBzdHQuLlxuICBzICAgdFxuICAgICAgc3NcXFxuYCxcblxuLy8gNjogcnVuIHJpZ2h0IDJcblxuYFxcXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eHguLi5cbiAgeHguLm94XG4gICB4Li4uLlxuICAgICAuXG4gICAgdHR0XG4gICB0dHR0LlxuICAgdC50dFxuICAgIHBwXG4gICAgLi5cbiAgICB0dFxuICAgIHNzc1xcXG5gLFxuXG4vLyA3OiBydW4gcmlnaHQgM1xuXG5gXFxcbiAgICB4eHhcbiAgIHh4eHh4XG4gIHh4eC4uLlxuICB4eC4ub3hcbiAgIHguLi4uXG4gICAgIC5cbiAgICB0dHRcbiAgIHR0dHRcbiAgIHR0LnRcbiAgICBwcHBcbiAgc3R0Li5cbiAgcyAgIHRcbiAgICAgIHNzXFxcbmAsXG5cbi8vIDg6IHJ1biBkb3duIDFcblxuYFxcXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eC4uLnh4XG4gIHhveC54b3hcbiAgIC4uLi4uXG4gICAgIC5cbiAgIHR0dHR0XG4gIHQgdHR0IHRcbiAgLiB0dHQgLlxuICAgIHBwcFxuICAgIC4gLlxuICAgIHQgdFxuICAgIHMgc1xcXG5gLFxuXG4vLyA5OiBydW4gZG93biAyXG5cbmBcXFxuICAgIHh4eFxuICAgeHh4eHhcbiAgeHguLi54eFxuICB4b3gueG94XG4gICAuLi4uLlxuICAgdCAuXG4gIC50dHR0XG4gICAgdHR0dFxuICAgIHR0dHRcbiAgICBwcHAuXG4gICAgLiB0XG4gICAgLiBzXG4gICAgdFxuICAgIHNcXFxuYCxcblxuLy8gMTA6IHJ1biBkb3duIHJpZ2h0IDFcblxuYFxcXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eC4uLi5cbiAgeC5veC54b1xuICAgLi4uLi5cbiAgICAgLlxuICB0dHR0dFxuIC4gdHR0dFxuICAgdHR0dC5cbiAgICBwcHBcbiAgc3QuLi5cbiAgcyAgc3RcbiAgICAgIHNcXFxuYCxcblxuLy8gMTE6IHJ1biBkb3duIHJpZ2h0IDJcblxuYFxcXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eC4uLi5cbiAgeC5veC54b1xuICAgLi4uLi5cbiAgICAgLlxuICAgdHR0dFxuICAgdHR0dFxuICAgdC50dFxuICAgIHBwcFxuICAgIC4uLlxuICBzdCB0XG4gICBzIHNzXFxcbmAsXG5cbi8vIDEyOiBydW4gZG93biByaWdodCAzXG5cbmBcXFxuICAgIHh4eFxuICAgeHh4eHhcbiAgeHguLi4uXG4gIHgub3gueG9cbiAgIC4uLi4uXG4gICAgIC5cbiAudHR0dHRcbiAgIHR0dHQuXG4gICB0dHR0XG4gICAgcHBwXG4gIHN0Li4uXG4gIHMgICAgdFxuICAgICAgIHNzXFxcbmAsXG5cbi8vIDEzOiBydW4gdXAgcmlnaHQgMVxuXG5gXFxcbiAgICB4eHhcbiAgIHh4eHh4XG4gIHh4eHh4LlxuICB4eHh4Lm94XG4gICB4eC4uLlxuICAgICAuXG4gIHR0dHR0XG4gIC50dHR0dC5cbiAgIHR0dHRcbiAgICBwcHBcbiAgc3QuLi5cbiAgcyAgdFxuICAgICBzc1xcXG5gLFxuXG4vLyAxNDogcnVuIHVwIHJpZ2h0IDJcblxuYFxcXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eHh4eC5cbiAgeHh4eC5veFxuICAgeHguLi5cbiAgICAgLlxuICAgdHR0dFxuICB0dHR0dFxuICAudHR0LlxuICAgIHBwcFxuICAgIC4uLlxuICAgc3QgdFxuICAgIHMgc3NcXFxuYCxcblxuLy8gMTU6IHJ1biB1cCByaWdodCAzXG5cbmBcXFxuICAgIHh4eFxuICAgeHh4eHhcbiAgeHh4eHguXG4gIHh4eHgub3hcbiAgIHh4Li4uXG4gICAgIC5cbiAgIHR0dHRcbiAgdHR0dHQuXG4gICB0dHR0XG4gICAgcHBwXG4gIHN0Li4uXG4gIHMgICAgdHNcbiAgICAgICBzXFxcbmAsXG5cblxuLy8gMTY6IHJ1biB1cCAxXG5cbmBcXFxuICAgIHh4eFxuICAgeHh4eHhcbiAgeHh4eHh4eFxuICB4eHh4eHh4XG4gICAueHh4LlxuICAgICAuXG4gICB0dHR0dFxuICB0IHR0dCB0XG4gIC4gdHR0IC5cbiAgICBwcHBcbiAgICAuIC5cbiAgICB0IHRcbiAgICBzIHNcXFxuYCxcblxuLy8gMTc6IHJ1biB1cCAyXG5cbmBcXFxuICAgIHh4eFxuICAgeHh4eHhcbiAgeHh4eHh4eFxuICB4eHh4eHh4XG4gICAueHh4LlxuICAgICAuXG4gIC50dHR0XG4gICAgdHR0dFxuICAgIHR0dHRcbiAgICBwcHAuXG4gICAgLiB0XG4gICAgLiBzXG4gICAgdFxuICAgIHNcXFxuYCxcbl07XG5cbnNwcml0ZS5wbGF5ZXIuYW5pbWF0aW9uID0ge1xuICBzdGFuZF9kb3duOiBbWzBdXSxcbiAgc3RhbmRfZG93bl9yaWdodDogW1sxXV0sXG4gIHN0YW5kX3JpZ2h0OiBbWzJdXSxcbiAgc3RhbmRfdXBfcmlnaHQ6IFtbM11dLFxuICBzdGFuZF91cDogW1s0XV0sXG4gIHN0YW5kX3VwX2xlZnQ6IFtbMyx0cnVlXV0sXG4gIHN0YW5kX2xlZnQ6IFtbMix0cnVlXV0sXG4gIHN0YW5kX2Rvd25fbGVmdDogW1sxLHRydWVdXSxcblxuICBydW5fcmlnaHQ6IFtbN10sWzZdLFs1XSxbMl1dLFxuICBydW5fbGVmdDogW1s3LHRydWVdLFs2LHRydWVdLFs1LHRydWVdLFsyLHRydWVdXSxcbiAgcnVuX2Rvd246IFtbOF0sWzldLFs4XSxbOSx0cnVlXV0sXG4gIHJ1bl91cDogW1sxNl0sWzE3XSxbMTZdLFsxNyx0cnVlXV0sXG4gIHJ1bl9kb3duX3JpZ2h0OiBbWzExXSxbMTJdLFsxMF0sWzFdXSxcbiAgcnVuX3VwX3JpZ2h0OiBbWzEzXSxbMTRdLFsxNV0sWzNdXSxcbiAgcnVuX2Rvd25fbGVmdDogW1sxMSx0cnVlXSxbMTIsdHJ1ZV0sWzEwLHRydWVdLFsxLHRydWVdXSxcbiAgcnVuX3VwX2xlZnQ6IFtbMTMsdHJ1ZV0sWzE0LHRydWVdLFsxNSx0cnVlXSxbMyx0cnVlXV0sXG59O1xuXG5zcHJpdGUucGxheWVyLnBhbGV0dGUgPSB7XG4gICd4JzogJyMwMDAnLFxuICAndic6ICcjNDQ0JyxcbiAgJ28nOiAnI2ZmZicsXG4gICcuJzogJyNmOTEnLFxuICAndCc6ICcjMDBmJyxcbiAgJ3AnOiAnI2ZmZicsXG4gICdzJzogJyMwMDAnLFxuICAnNyc6ICdyZ2JhKDAsMCwwLDAuMyknLFxufTtcblxuc3ByaXRlLnBsYXllci53aWR0aCA9IDExO1xuc3ByaXRlLnBsYXllci5oZWlnaHQgPSAxNDtcbnNwcml0ZS5wbGF5ZXIuc2NhbGUgPSBzcHJpdGUuc2NhbGU7XG5cbnNwcml0ZS5jZW50ZXJfc3BvdCA9IFtgXFxcblxuICB4b3hcbiB4b29veFxuIHhvb294XG4gIHhveFxuXFxcbmBdXG5cbnNwcml0ZS5jZW50ZXJfc3BvdC5wYWxldHRlID0ge1xuICAnbyc6ICcjZmZmJyxcbiAgJ3gnOiAncmdiYSgyNTUsMjU1LDI1NSwuNSknXG59O1xuc3ByaXRlLmNlbnRlcl9zcG90LndpZHRoID0gNztcbnNwcml0ZS5jZW50ZXJfc3BvdC5oZWlnaHQgPSA2O1xuc3ByaXRlLmNlbnRlcl9zcG90LnNjYWxlID0gc3ByaXRlLnNjYWxlO1xuXG5zcHJpdGUuZ29hbF9uZXRzID0gW1xuYFxcXG4gICAgICA7eHh4eHh4eHh4eHh4eHhcbiAgICAgO3Z4O3g7eDt4L3gveC94eFxuICAgICB2O3h4O3gveC94L3gveC94XG4gICAgO3Y7eC94L3gveC94L3gveHhcbiAgICB2di94eC94L3gveC94L3gveFxuICAgO3Y7dngveC94L3gveC94L3h4XG4gICB2O3YveHgveC94L3gveC94L3hcbiAgO3Z2L3Z4L3gveC94L3gveC94eFxuICB2djt2O3h4L3gveC94L3g7eDt4XG4gIHY7djt2eDt4O3g7eDt4O3g7eHhcbiAgdnYudi54eC54LngueC54LngueFxuIDN2O3YudngueC54LngueC54Lnh4XG4gM3Z2LnY7eHgueC54LngueC54LnhcbiAzdjt2O3Z4LngueC54LngueC54eFxuIDN2di52O3h4LngueC54LngueC54XG4gM3Yudi52eC54LngueC54LngueHhcbiAzdnYudi54eC54LngueC54LngueFxuIDN2O3YudngueC54LngueC54Lnh4XG4gM3Z2LnYueHgueC54LngueC54LnhcbiAzdi52LnZ4LngueC54LngueC54eFxuIDN2di52Lnh4LngueC54LngueC54XG4gM3Yudi52eC54LngueC54LngueHhcbiAzdnYudi54eC54LngueC54LngueFxuIDN2O3YudngueC54LngueC54Lnh4XG4gM3Z2LnYueHgueC54LngueC54LnhcbiAzdjt2LnZ4LngueC54LngueC54eFxuIDN2di52Lnh4LngueC54LngueC54XG4gM3Yudi52eC54LngueC54LngueHhcbiAzdnYudi54eC54LngueC54LngueFxuIDN2LnYudngueC54LngueC54Lnh4XG4gM3Z2LnYueHgueC54LngueC54LnhcbiAzdi52LnZ4LngueC54LngueC54eFxuIDN2di52Lnh4LngueC54LngueC54XG4gM3Y7di52eC54LngueC54LngueHhcbiAzdnYudi54eC54LngueC54LngueFxuIDN2O3YudngueC54LngueC54Lnh4XG4gM3Z2LnYueHgueC54LngueC54LnhcbiAzdjt2O3Z4LngueC54LngueC54eFxuIDN2di52Lnh4LngueC54LngueC54XG4gM3Yudi52eC54LngueC54LngueHhcbiAzdnYudi54eC54LngueC54LngueFxuIDN2O3YudngueC54LngueC54Lnh4XG4gM3Z2O3YueHgueC54LngueC54LnhcbiAzdjt2LnZ4LngueC54LngueC54eFxuIDN2di52Lnh4LngueC54LngueC54XG4gM3Yudi52eC54LngueC54LngueHhcbiAzdnYudjt4eHh4eHh4eHh4eHh4eFxuIDN2LnYueHg7eDt4LngueC54Lnh4XG4gM3Z2Lnh4O3gueC54LngueC54LnhcbiAzdjt4eDt4LngueC54LngueC54eFxuIDN2eDt4eC54LngueC54LngueDt4XG4gM3Y7eHgueC54LngueC54Lng7eHhcbiAzdnh4O3gueC54LngueC54Lng7eFxuIDN2eHh4LngueC54LngueC54O3h4XG4gM3Z4eDt4LngueC54O3gueDt4O3hcbiAzeHh4eHh4eHh4eHh4eHh4eHh4eFxuIDMzMzMzMzMzODg4ODg4ODg4ODg4XG4gICAzMzMzMzMzMzMzMzg4ODg4ODhcbiAgICAgICAzMzMzMzMzMzMzMzMzM1xcXG5gLFxuXTtcblxuc3ByaXRlLmdvYWxfbmV0cy5wYWxldHRlID0ge1xuICAneCc6ICcjZmZmJyxcbiAgJ3YnOiAnI2RkZCcsXG4gICc7JzogJ3JnYmEoMjAwLDIwMCwyMDAsLjYpJyxcbiAgJy4nOiAncmdiYSgxNTAsMTUwLDE1MCwuNSknLFxuICAnLyc6ICdyZ2JhKDE4MCwxODAsMTgwLC42KScsXG4gICczJzogJ3JnYmEoMCwwLDAsLjIpJyxcbiAgJzgnOiAncmdiYSgwLDAsMCwuMyknLFxufTtcbnNwcml0ZS5nb2FsX25ldHMud2lkdGggPSBzcHJpdGUuZ29hbF9uZXRzWzBdLnNwbGl0KCdcXG4nKVswXS5sZW5ndGg7XG5zcHJpdGUuZ29hbF9uZXRzLmhlaWdodCA9IHNwcml0ZS5nb2FsX25ldHNbMF0uc3BsaXQoJ1xcbicpLmxlbmd0aCArIDU7XG5zcHJpdGUuZ29hbF9uZXRzLnNjYWxlID0gc3ByaXRlLnNjYWxlO1xuXG5zcHJpdGUuY29ybmVyX2ZsYWcgPSBbYFxcXG5nYlxuZ2diXG5nZ2diXG54XG54XG54XG54XG43NzdcbiAgNzdcblxuXFxcbmBdXG5cbnNwcml0ZS5jb3JuZXJfZmxhZy5wYWxldHRlID0ge1xuICAneCc6ICcjY2NjJyxcbiAgJ2cnOiAnI2YwMCcsXG4gICdiJzogJyNjMjAnLFxuICAnOyc6ICdyZ2JhKDI1NSwyNTUsMjU1LC4xKScsXG4gICc3JzogJ3JnYmEoMCwwLDAsLjMpJyxcbn07XG5zcHJpdGUuY29ybmVyX2ZsYWcud2lkdGggPSA1O1xuc3ByaXRlLmNvcm5lcl9mbGFnLmhlaWdodCA9IHNwcml0ZS5jb3JuZXJfZmxhZ1swXS5zcGxpdCgnXFxuJykubGVuZ3RoIC0gMTtcbnNwcml0ZS5jb3JuZXJfZmxhZy5zY2FsZSA9IHNwcml0ZS5zY2FsZTtcblxuc3ByaXRlLmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZVNwcml0ZShuYW1lKSB7XG4gIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgdmFyIHMgPSBzcHJpdGVbbmFtZV07XG5cbiAgY2FudmFzLndpZHRoID0gcy5sZW5ndGggKiBzLndpZHRoICogcy5zY2FsZTtcbiAgY2FudmFzLmhlaWdodCA9IHMuc2NhbGUgKiAyICsgcy5oZWlnaHQgKiBzLnNjYWxlICogMjtcblxuICBzXG4gICAgLy8gbm9ybWFsXG4gICAgLm1hcCgoYXJ0LCBpbmRleCkgPT4ge1xuICAgICAgcGl4ZWwuYXJ0KGFydClcbiAgICAgIC5wYWxldHRlKHMucGFsZXR0ZSlcbiAgICAgIC5zY2FsZShzLnNjYWxlKS5wb3Moe1xuICAgICAgICB4OiBzLndpZHRoICogcy5zY2FsZSAqIGluZGV4LFxuICAgICAgICB5OiAwXG4gICAgICB9KVxuICAgICAgLmRyYXcoY29udGV4dCk7XG4gICAgICByZXR1cm4gYXJ0O1xuICAgIH0pXG5cbiAgICAvLyBtaXJyb3IgeFxuICAgIC5tYXAoKGFydCwgaW5kZXgpID0+IHtcbiAgICAgIGlmICgnc3RyaW5nJyA9PT0gdHlwZW9mIGFydCkgYXJ0ID0gYXJ0LnNwbGl0KCdcXG4nKTtcbiAgICAgIGFydCA9IGFydC5tYXAocm93ID0+IHBhZFJpZ2h0KHJvdywgcy53aWR0aCkuc3BsaXQoJycpLnJldmVyc2UoKS5qb2luKCcnKSk7XG4gICAgICBwaXhlbC5hcnQoYXJ0KVxuICAgICAgLnBhbGV0dGUocy5wYWxldHRlKVxuICAgICAgLnNjYWxlKHMuc2NhbGUpLnBvcyh7XG4gICAgICAgIHg6IHMud2lkdGggKiBzLnNjYWxlICogaW5kZXgsXG4gICAgICAgIHk6IHMuaGVpZ2h0ICogcy5zY2FsZSArIHMuc2NhbGVcbiAgICAgIH0pXG4gICAgICAuZHJhdyhjb250ZXh0KTtcbiAgICAgIHJldHVybiBhcnQ7XG4gICAgfSk7XG5cbiAgdmFyIGRhdGFVUkwgPSBjYW52YXMudG9EYXRhVVJMKCk7XG4gIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZGl2LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgZGl2LnN0eWxlLmJhY2tncm91bmQgPSBgdXJsKCR7ZGF0YVVSTH0pIDAgMCBuby1yZXBlYXRgO1xuICBkaXYuc3R5bGUud2lkdGggPSBzLnNjYWxlICogcy53aWR0aCArICdweCc7XG4gIGRpdi5zdHlsZS5oZWlnaHQgPSBzLnNjYWxlICogcy5oZWlnaHQgKyAncHgnO1xuICByZXR1cm4gbWVyZ2Uoe1xuICAgIGVsOiBkaXYsXG4gICAgcHg6IG5ldyBQb2ludCxcbiAgICBwb3M6IG5ldyBQb2ludCxcbiAgICB2ZWw6IG5ldyBQb2ludCxcbiAgfSwgcyk7XG59O1xuXG5mdW5jdGlvbiBwYWRSaWdodChzLCBuKSB7XG4gIG4gPSBNYXRoLm1heChuLCBzLmxlbmd0aCAtIDEpO1xuICByZXR1cm4gcyArIG5ldyBBcnJheShuIC0gcy5sZW5ndGggKyAxKS5qb2luKCcgJyk7XG59XG4iLCJ2YXIgY3NzID0gcmVxdWlyZSgnLi4vc3R5bGUuY3NzJyk7XG52YXIgc3ByaXRlID0gcmVxdWlyZSgnLi9zcHJpdGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdGFkaXVtO1xuXG5mdW5jdGlvbiBTdGFkaXVtKCkge1xuICB0aGlzLmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHRoaXMuZWwuY2xhc3NOYW1lID0gY3NzLnN0YWRpdW07XG5cbiAgdmFyIGdyYXNzID0gY3JlYXRlR3Jhc3MoKTtcbiAgdGhpcy5lbC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3VybCgnICsgZ3Jhc3MudG9EYXRhVVJMKCkgKyAnKSAtNjBweCAwcHgnO1xuXG4gIHRoaXMucGl0Y2ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdGhpcy5waXRjaC5jbGFzc05hbWUgPSBjc3MucGl0Y2g7XG4gIHRoaXMuZWwuYXBwZW5kQ2hpbGQodGhpcy5waXRjaCk7XG5cbiAgdGhpcy5oYWxmd2F5TGluZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB0aGlzLmhhbGZ3YXlMaW5lLmNsYXNzTmFtZSA9IGNzc1snaGFsZndheS1saW5lJ107XG4gIHRoaXMucGl0Y2guYXBwZW5kQ2hpbGQodGhpcy5oYWxmd2F5TGluZSk7XG5cbiAgdGhpcy5jZW50ZXJDaXJjbGUgPSBjcmVhdGVDZW50ZXJDaXJjbGUoKTtcbiAgdGhpcy5jZW50ZXJDaXJjbGUuY2xhc3NOYW1lID0gY3NzWydjZW50ZXItY2lyY2xlJ107XG4gIHRoaXMucGl0Y2guYXBwZW5kQ2hpbGQodGhpcy5jZW50ZXJDaXJjbGUpO1xuXG4gIHRoaXMuY2VudGVyU3BvdCA9IHNwcml0ZS5jcmVhdGUoJ2NlbnRlcl9zcG90Jyk7XG4gIHRoaXMuY2VudGVyU3BvdC5lbC5jbGFzc05hbWUgPSBjc3NbJ2NlbnRlci1zcG90J107XG4gIHRoaXMucGl0Y2guYXBwZW5kQ2hpbGQodGhpcy5jZW50ZXJTcG90LmVsKTtcblxuICB0aGlzLnBlbmFsdHlBcmNMZWZ0ID0gY3JlYXRlQ2VudGVyQ2lyY2xlKHsgeDogJ0xlZnQnLCB5OiAnVG9wJyB9LCAwLjg1LCA1LjQzKTtcbiAgdGhpcy5wZW5hbHR5QXJjTGVmdC5jbGFzc05hbWUgPSBjc3NbJ3BlbmFsdHktYXJjLWxlZnQnXTtcbiAgdGhpcy5waXRjaC5hcHBlbmRDaGlsZCh0aGlzLnBlbmFsdHlBcmNMZWZ0KTtcblxuICB0aGlzLnBlbmFsdHlTcG90TGVmdCA9IHNwcml0ZS5jcmVhdGUoJ2NlbnRlcl9zcG90Jyk7XG4gIHRoaXMucGVuYWx0eVNwb3RMZWZ0LmVsLmNsYXNzTmFtZSA9IGNzc1sncGVuYWx0eS1zcG90LWxlZnQnXTtcbiAgdGhpcy5waXRjaC5hcHBlbmRDaGlsZCh0aGlzLnBlbmFsdHlTcG90TGVmdC5lbCk7XG5cbiAgdGhpcy5wZW5hbHR5QXJjUmlnaHQgPSBjcmVhdGVDZW50ZXJDaXJjbGUoeyB4OiAnUmlnaHQnLCB5OiAnVG9wJyB9LCA0LCAyLjI5KTtcbiAgdGhpcy5wZW5hbHR5QXJjUmlnaHQuY2xhc3NOYW1lID0gY3NzWydwZW5hbHR5LWFyYy1yaWdodCddO1xuICB0aGlzLnBpdGNoLmFwcGVuZENoaWxkKHRoaXMucGVuYWx0eUFyY1JpZ2h0KTtcblxuICB0aGlzLnBlbmFsdHlTcG90UmlnaHQgPSBzcHJpdGUuY3JlYXRlKCdjZW50ZXJfc3BvdCcpO1xuICB0aGlzLnBlbmFsdHlTcG90UmlnaHQuZWwuY2xhc3NOYW1lID0gY3NzWydwZW5hbHR5LXNwb3QtcmlnaHQnXTtcbiAgdGhpcy5waXRjaC5hcHBlbmRDaGlsZCh0aGlzLnBlbmFsdHlTcG90UmlnaHQuZWwpO1xuXG4gIHRoaXMucGVuYWx0eUFyZWFMZWZ0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHRoaXMucGVuYWx0eUFyZWFMZWZ0LmNsYXNzTmFtZSA9IGNzc1sncGVuYWx0eS1hcmVhLWxlZnQnXTtcbiAgdGhpcy5waXRjaC5hcHBlbmRDaGlsZCh0aGlzLnBlbmFsdHlBcmVhTGVmdCk7XG5cbiAgdGhpcy5wZW5hbHR5QXJlYVJpZ2h0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHRoaXMucGVuYWx0eUFyZWFSaWdodC5jbGFzc05hbWUgPSBjc3NbJ3BlbmFsdHktYXJlYS1yaWdodCddO1xuICB0aGlzLnBpdGNoLmFwcGVuZENoaWxkKHRoaXMucGVuYWx0eUFyZWFSaWdodCk7XG5cbiAgdGhpcy5nb2FsQXJlYUxlZnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdGhpcy5nb2FsQXJlYUxlZnQuY2xhc3NOYW1lID0gY3NzWydnb2FsLWFyZWEtbGVmdCddO1xuICB0aGlzLnBpdGNoLmFwcGVuZENoaWxkKHRoaXMuZ29hbEFyZWFMZWZ0KTtcblxuICB0aGlzLmdvYWxBcmVhUmlnaHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdGhpcy5nb2FsQXJlYVJpZ2h0LmNsYXNzTmFtZSA9IGNzc1snZ29hbC1hcmVhLXJpZ2h0J107XG4gIHRoaXMucGl0Y2guYXBwZW5kQ2hpbGQodGhpcy5nb2FsQXJlYVJpZ2h0KTtcblxuICB0aGlzLmNvcm5lckFyY1RvcExlZnQgPSBjcmVhdGVDZW50ZXJDaXJjbGUoeyB4OiAnTGVmdCcsIHk6ICdUb3AnIH0sIDAsIDIgKiBNYXRoLlBJLCAyNCk7XG4gIHRoaXMuY29ybmVyQXJjVG9wTGVmdC5jbGFzc05hbWUgPSBjc3NbJ2Nvcm5lci1hcmMtdG9wLWxlZnQnXTtcbiAgdGhpcy5waXRjaC5hcHBlbmRDaGlsZCh0aGlzLmNvcm5lckFyY1RvcExlZnQpO1xuXG4gIHRoaXMuY29ybmVyQXJjQm90dG9tTGVmdCA9IGNyZWF0ZUNlbnRlckNpcmNsZSh7IHg6ICdMZWZ0JywgeTogJ0JvdHRvbScgfSwgMCwgMiAqIE1hdGguUEksIDI0KTtcbiAgdGhpcy5jb3JuZXJBcmNCb3R0b21MZWZ0LmNsYXNzTmFtZSA9IGNzc1snY29ybmVyLWFyYy1ib3R0b20tbGVmdCddO1xuICB0aGlzLnBpdGNoLmFwcGVuZENoaWxkKHRoaXMuY29ybmVyQXJjQm90dG9tTGVmdCk7XG5cbiAgdGhpcy5jb3JuZXJBcmNUb3BSaWdodCA9IGNyZWF0ZUNlbnRlckNpcmNsZSh7IHg6ICdSaWdodCcsIHk6ICdUb3AnIH0sIDAsIDIgKiBNYXRoLlBJLCAyNCk7XG4gIHRoaXMuY29ybmVyQXJjVG9wUmlnaHQuY2xhc3NOYW1lID0gY3NzWydjb3JuZXItYXJjLXRvcC1yaWdodCddO1xuICB0aGlzLnBpdGNoLmFwcGVuZENoaWxkKHRoaXMuY29ybmVyQXJjVG9wUmlnaHQpO1xuXG4gIHRoaXMuY29ybmVyQXJjQm90dG9tUmlnaHQgPSBjcmVhdGVDZW50ZXJDaXJjbGUoeyB4OiAnUmlnaHQnLCB5OiAnQm90dG9tJyB9LCAwLCAyICogTWF0aC5QSSwgMjQpO1xuICB0aGlzLmNvcm5lckFyY0JvdHRvbVJpZ2h0LmNsYXNzTmFtZSA9IGNzc1snY29ybmVyLWFyYy1ib3R0b20tcmlnaHQnXTtcbiAgdGhpcy5waXRjaC5hcHBlbmRDaGlsZCh0aGlzLmNvcm5lckFyY0JvdHRvbVJpZ2h0KTtcblxuICB0aGlzLmdvYWxOZXRzTGVmdCA9IHNwcml0ZS5jcmVhdGUoJ2dvYWxfbmV0cycpO1xuICB0aGlzLmdvYWxOZXRzTGVmdC5lbC5jbGFzc05hbWUgPSBjc3NbJ2dvYWwtbmV0cy1sZWZ0J107XG4gIHRoaXMuZWwuYXBwZW5kQ2hpbGQodGhpcy5nb2FsTmV0c0xlZnQuZWwpO1xuICB0aGlzLmdvYWxOZXRzTGVmdC5lbC5zdHlsZS5tYXJnaW5Ub3AgPSAtKHRoaXMuZ29hbE5ldHNMZWZ0LmhlaWdodCAqIHRoaXMuZ29hbE5ldHNMZWZ0LnNjYWxlIC8gMikgKyAncHgnO1xuICB0aGlzLmdvYWxOZXRzTGVmdC5lbC5zdHlsZS5tYXJnaW5MZWZ0ID0gLSgodGhpcy5nb2FsTmV0c0xlZnQud2lkdGggLSAxKSAqIHRoaXMuZ29hbE5ldHNMZWZ0LnNjYWxlKSArICdweCc7XG5cbiAgdGhpcy5nb2FsTmV0c1JpZ2h0ID0gc3ByaXRlLmNyZWF0ZSgnZ29hbF9uZXRzJyk7XG4gIHRoaXMuZ29hbE5ldHNSaWdodC5lbC5jbGFzc05hbWUgPSBjc3NbJ2dvYWwtbmV0cy1yaWdodCddO1xuICB0aGlzLmVsLmFwcGVuZENoaWxkKHRoaXMuZ29hbE5ldHNSaWdodC5lbCk7XG4gIHRoaXMuZ29hbE5ldHNSaWdodC5lbC5zdHlsZS5iYWNrZ3JvdW5kUG9zaXRpb24gPSAnMCAnICsgKC0odGhpcy5nb2FsTmV0c1JpZ2h0LmhlaWdodCAqIHRoaXMuZ29hbE5ldHNSaWdodC5zY2FsZSArIDMpKSArICdweCc7XG4gIHRoaXMuZ29hbE5ldHNSaWdodC5lbC5zdHlsZS5tYXJnaW5Ub3AgPSAtKHRoaXMuZ29hbE5ldHNSaWdodC5oZWlnaHQgKiB0aGlzLmdvYWxOZXRzUmlnaHQuc2NhbGUgLyAyKSArICdweCc7XG4gIHRoaXMuZ29hbE5ldHNSaWdodC5lbC5zdHlsZS5tYXJnaW5SaWdodCA9IC0oKHRoaXMuZ29hbE5ldHNSaWdodC53aWR0aCArIDEpICogdGhpcy5nb2FsTmV0c1JpZ2h0LnNjYWxlKSArICdweCc7XG5cbiAgdGhpcy5jb3JuZXJGbGFnVG9wTGVmdCA9IHNwcml0ZS5jcmVhdGUoJ2Nvcm5lcl9mbGFnJyk7XG4gIHRoaXMuY29ybmVyRmxhZ1RvcExlZnQuZWwuY2xhc3NOYW1lID0gY3NzWydjb3JuZXItZmxhZy10b3AtbGVmdCddO1xuICB0aGlzLmVsLmFwcGVuZENoaWxkKHRoaXMuY29ybmVyRmxhZ1RvcExlZnQuZWwpO1xuICB0aGlzLmNvcm5lckZsYWdUb3BMZWZ0LmVsLnN0eWxlLm1hcmdpblRvcCA9IC0oKHRoaXMuY29ybmVyRmxhZ1RvcExlZnQuaGVpZ2h0KSAqIHRoaXMuY29ybmVyRmxhZ1RvcExlZnQuc2NhbGUpICsgJ3B4JztcblxuICB0aGlzLmNvcm5lckZsYWdCb3R0b21MZWZ0ID0gc3ByaXRlLmNyZWF0ZSgnY29ybmVyX2ZsYWcnKTtcbiAgdGhpcy5jb3JuZXJGbGFnQm90dG9tTGVmdC5lbC5jbGFzc05hbWUgPSBjc3NbJ2Nvcm5lci1mbGFnLWJvdHRvbS1sZWZ0J107XG4gIHRoaXMuZWwuYXBwZW5kQ2hpbGQodGhpcy5jb3JuZXJGbGFnQm90dG9tTGVmdC5lbCk7XG4gIC8vIHRoaXMuY29ybmVyRmxhZ0JvdHRvbUxlZnQuZWwuc3R5bGUubWFyZ2luVG9wID0gKygzICogdGhpcy5jb3JuZXJGbGFnQm90dG9tTGVmdC5zY2FsZSkgKyAncHgnO1xuXG4gIHRoaXMuY29ybmVyRmxhZ1RvcFJpZ2h0ID0gc3ByaXRlLmNyZWF0ZSgnY29ybmVyX2ZsYWcnKTtcbiAgdGhpcy5jb3JuZXJGbGFnVG9wUmlnaHQuZWwuY2xhc3NOYW1lID0gY3NzWydjb3JuZXItZmxhZy10b3AtcmlnaHQnXTtcbiAgdGhpcy5lbC5hcHBlbmRDaGlsZCh0aGlzLmNvcm5lckZsYWdUb3BSaWdodC5lbCk7XG4gIHRoaXMuY29ybmVyRmxhZ1RvcFJpZ2h0LmVsLnN0eWxlLm1hcmdpblRvcCA9IC0oKHRoaXMuY29ybmVyRmxhZ1RvcFJpZ2h0LmhlaWdodCkgKiB0aGlzLmNvcm5lckZsYWdUb3BSaWdodC5zY2FsZSkgKyAncHgnO1xuXG4gIHRoaXMuY29ybmVyRmxhZ0JvdHRvbVJpZ2h0ID0gc3ByaXRlLmNyZWF0ZSgnY29ybmVyX2ZsYWcnKTtcbiAgdGhpcy5jb3JuZXJGbGFnQm90dG9tUmlnaHQuZWwuY2xhc3NOYW1lID0gY3NzWydjb3JuZXItZmxhZy1ib3R0b20tcmlnaHQnXTtcbiAgdGhpcy5lbC5hcHBlbmRDaGlsZCh0aGlzLmNvcm5lckZsYWdCb3R0b21SaWdodC5lbCk7XG4gIC8vIHRoaXMuY29ybmVyRmxhZ0JvdHRvbVJpZ2h0LmVsLnN0eWxlLm1hcmdpblRvcCA9IC0oKHRoaXMuY29ybmVyRmxhZ0JvdHRvbVJpZ2h0LmhlaWdodCkgKiB0aGlzLmNvcm5lckZsYWdCb3R0b21SaWdodC5zY2FsZSkgKyAncHgnO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVDZW50ZXJDaXJjbGUoc2lkZSwgYSwgYiwgYykge1xuICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gIGNhbnZhcy53aWR0aCA9IGNhbnZhcy5oZWlnaHQgPSBjIHx8IDEyNDtcbiAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgdmFyIGNlbnRlclggPSBjYW52YXMud2lkdGggLyAyO1xuICB2YXIgY2VudGVyWSA9IGNhbnZhcy5oZWlnaHQgLyAyO1xuICB2YXIgcmFkaXVzID0gY2FudmFzLndpZHRoIC8gMi40O1xuXG4gIGNvbnRleHQuaW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XG5cbiAgY29udGV4dC5iZWdpblBhdGgoKTtcbiAgY29udGV4dC5hcmMoY2VudGVyWCwgY2VudGVyWSwgcmFkaXVzLCBhIHx8IDAsIGIgfHwgKDIgKiBNYXRoLlBJKSwgdHJ1ZSk7XG4gIGNvbnRleHQubGluZVdpZHRoID0gMTtcbiAgY29udGV4dC5zdHJva2VTdHlsZSA9ICcjZmZmJztcbiAgY29udGV4dC5zdHJva2UoKTtcblxuICB2YXIgcG5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG4gIHBuZy5zcmMgPSBjYW52YXMudG9EYXRhVVJMKCdpbWFnZS9wbmcnKTtcblxuICB2YXIgc2Vjb25kID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gIHNlY29uZC53aWR0aCA9IHNlY29uZC5oZWlnaHQgPSBjYW52YXMud2lkdGggKiAzO1xuICBzZWNvbmQuc3R5bGVbJ21hcmdpbicgKyAoc2lkZSA/IHNpZGUueCA6ICdMZWZ0JyldID0gLShjYW52YXMud2lkdGggKiAzIC8gMikgKyAncHgnO1xuICBzZWNvbmQuc3R5bGVbJ21hcmdpbicgKyAoc2lkZSA/IHNpZGUueSA6ICdUb3AnKV0gPSAtKGNhbnZhcy53aWR0aCAqIDMgLyAyKSArICdweCc7XG4gIHZhciBjdHggPSBzZWNvbmQuZ2V0Q29udGV4dCgnMmQnKTtcbiAgY3R4LmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuICBjdHguZHJhd0ltYWdlKHBuZywgMCwgMCwgY2FudmFzLndpZHRoICogMywgY2FudmFzLmhlaWdodCAqIDMpO1xuICByZXR1cm4gc2Vjb25kO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVHcmFzcygpIHtcbiAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICBjYW52YXMuaGVpZ2h0ID0gNjA7XG4gIGNhbnZhcy53aWR0aCA9IGNhbnZhcy5oZWlnaHQgKiAyO1xuICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICBjb250ZXh0LmZpbGxTdHlsZSA9ICcjMDkwJztcbiAgY29udGV4dC5maWxsUmVjdCgwLDAsY2FudmFzLndpZHRoLzIsY2FudmFzLmhlaWdodCk7XG4gIGNvbnRleHQuZmlsbFN0eWxlID0gJyMwODAnO1xuICBjb250ZXh0LmZpbGxSZWN0KGNhbnZhcy53aWR0aC8yLDAsY2FudmFzLndpZHRoLzIsY2FudmFzLmhlaWdodCk7XG4gIGZvciAodmFyIGkgPSAyNTAwOyBpLS07KSB7XG4gICAgY29udGV4dC5maWxsU3R5bGUgPSAncmdiYSgwLDAsMCwwLjAzKSc7XG4gICAgdmFyIHggPSBNYXRoLnJhbmRvbSgpICogY2FudmFzLndpZHRoIHwgMDtcbiAgICB2YXIgeSA9IE1hdGgucmFuZG9tKCkgKiBjYW52YXMuaGVpZ2h0IHwgMDtcbiAgICBjb250ZXh0LmZpbGxSZWN0KHgseSwxLDEpO1xuICB9XG5cbiAgdmFyIHBuZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICBwbmcuc3JjID0gY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvcG5nJyk7XG5cbiAgdmFyIHNlY29uZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICBzZWNvbmQud2lkdGggPSBjYW52YXMud2lkdGggKiAzO1xuICBzZWNvbmQuaGVpZ2h0ID0gY2FudmFzLmhlaWdodCAqIDM7XG4gIHZhciBjdHggPSBzZWNvbmQuZ2V0Q29udGV4dCgnMmQnKTtcbiAgY3R4LmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuICBjdHguZHJhd0ltYWdlKHBuZywgMCwgMCwgY2FudmFzLndpZHRoICogMywgY2FudmFzLmhlaWdodCAqIDMpO1xuXG4gIHJldHVybiBzZWNvbmQ7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcInN0YWRpdW1cIjpcIl9zdHlsZV9fc3RhZGl1bVwiLFwicGl0Y2hcIjpcIl9zdHlsZV9fcGl0Y2hcIixcImhhbGZ3YXktbGluZVwiOlwiX3N0eWxlX19oYWxmd2F5LWxpbmVcIixcImNlbnRlci1jaXJjbGVcIjpcIl9zdHlsZV9fY2VudGVyLWNpcmNsZVwiLFwiY2VudGVyLXNwb3RcIjpcIl9zdHlsZV9fY2VudGVyLXNwb3RcIixcInBlbmFsdHktYXJjLWxlZnRcIjpcIl9zdHlsZV9fcGVuYWx0eS1hcmMtbGVmdFwiLFwicGVuYWx0eS1zcG90LWxlZnRcIjpcIl9zdHlsZV9fcGVuYWx0eS1zcG90LWxlZnRcIixcInBlbmFsdHktYXJjLXJpZ2h0XCI6XCJfc3R5bGVfX3BlbmFsdHktYXJjLXJpZ2h0XCIsXCJwZW5hbHR5LXNwb3QtcmlnaHRcIjpcIl9zdHlsZV9fcGVuYWx0eS1zcG90LXJpZ2h0XCIsXCJwZW5hbHR5LWFyZWEtbGVmdFwiOlwiX3N0eWxlX19wZW5hbHR5LWFyZWEtbGVmdFwiLFwicGVuYWx0eS1hcmVhLXJpZ2h0XCI6XCJfc3R5bGVfX3BlbmFsdHktYXJlYS1yaWdodFwiLFwiZ29hbC1hcmVhLWxlZnRcIjpcIl9zdHlsZV9fZ29hbC1hcmVhLWxlZnRcIixcImdvYWwtYXJlYS1yaWdodFwiOlwiX3N0eWxlX19nb2FsLWFyZWEtcmlnaHRcIixcImNvcm5lci1hcmMtYm90dG9tLWxlZnRcIjpcIl9zdHlsZV9fY29ybmVyLWFyYy1ib3R0b20tbGVmdFwiLFwiY29ybmVyLWFyYy10b3AtcmlnaHRcIjpcIl9zdHlsZV9fY29ybmVyLWFyYy10b3AtcmlnaHRcIixcImNvcm5lci1hcmMtYm90dG9tLXJpZ2h0XCI6XCJfc3R5bGVfX2Nvcm5lci1hcmMtYm90dG9tLXJpZ2h0XCIsXCJnb2FsLW5ldHMtbGVmdFwiOlwiX3N0eWxlX19nb2FsLW5ldHMtbGVmdFwiLFwiZ29hbC1uZXRzLXJpZ2h0XCI6XCJfc3R5bGVfX2dvYWwtbmV0cy1yaWdodFwiLFwiY29ybmVyLWZsYWctdG9wLWxlZnRcIjpcIl9zdHlsZV9fY29ybmVyLWZsYWctdG9wLWxlZnRcIixcImNvcm5lci1mbGFnLWJvdHRvbS1sZWZ0XCI6XCJfc3R5bGVfX2Nvcm5lci1mbGFnLWJvdHRvbS1sZWZ0XCIsXCJjb3JuZXItZmxhZy10b3AtcmlnaHRcIjpcIl9zdHlsZV9fY29ybmVyLWZsYWctdG9wLXJpZ2h0XCIsXCJjb3JuZXItZmxhZy1ib3R0b20tcmlnaHRcIjpcIl9zdHlsZV9fY29ybmVyLWZsYWctYm90dG9tLXJpZ2h0XCJ9Il19
