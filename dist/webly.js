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
sprite.scale = 3;

},{}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcnJvd3MuanMiLCJpbmRleC5qcyIsImxvb3AuanMiLCJub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9waXhlbC1hcnQvaW5kZXguanMiLCJzcHJpdGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxuLyohXG4gKlxuICogYXJyb3dzXG4gKlxuICogTUlUXG4gKlxuICovXG5cbi8qKlxuICogQ29udHJvbCBmbGFncy5cbiAqL1xuXG52YXIgY3RybCA9IHtcbiAgbGVmdDogIDEsXG4gIHVwOiAgICAyLFxuICByaWdodDogNCxcbiAgZG93bjogIDgsXG4gIHNob290OiAxNlxufTtcblxuLyoqXG4gKiBPcHBvc2l0ZSBkaXJlY3Rpb25zIGZsYWdzLlxuICovXG5cbnZhciBvcHAgPSB7XG4gIDE6IDQsXG4gIDI6IDgsXG4gIDQ6IDEsXG4gIDg6IDJcbn07XG5cbi8qKlxuICogS2V5bWFwLlxuICovXG5cbnZhciBtYXAgPSB7XG4gIDM3OiBjdHJsLmxlZnQsXG4gIDM4OiBjdHJsLnVwLFxuICAzOTogY3RybC5yaWdodCxcbiAgNDA6IGN0cmwuZG93bixcbiAgMTY6IGN0cmwuc2hvb3QsIC8vIHNoaWZ0XG4gIDE3OiBjdHJsLnNob290LCAvLyBjdHJsXG4gIDg4OiBjdHJsLnNob290LCAvLyB4XG4gIDkwOiBjdHJsLnNob290ICAvLyB6XG59O1xuXG4vKipcbiAqIEFycm93cy5cbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWwpe1xuICAvLyBiaXRtYXNrc1xuICB2YXIgZG93biA9IDA7XG4gIHZhciBrZXlzID0gMDtcblxuICB2YXIgYXJyb3dzID0ge307XG5cbiAgZWwuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9ua2V5ZG93bik7XG4gIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgb25rZXl1cCk7XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGBrZXlzYCBiaXRtYXNrIHdoZW4gZXZhbHVhdGVkLFxuICAgKiB0byB1c2Ugd2l0aCBsb2dpY2FsIG9wZXJhdGlvbnMuXG4gICAqXG4gICAqIEByZXR1cm4ge051bWJlcn0ga2V5c1xuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhcnJvd3MudmFsdWVPZiA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIGtleXM7XG4gIH07XG5cbiAgLy8gbWVyZ2UgY29udHJvbCBmbGFncyB0b1xuICAvLyB1c2Ugd2l0aCBsb2dpY2FsIG9wZXJhdGlvbnNcbiAgLy8gaS5lOiBhcnJvd3MgJiBhcnJvd3MubGVmdCAmJiBsZWZ0KClcbiAgbWVyZ2UoYXJyb3dzLCBjdHJsKTtcblxuICByZXR1cm4gYXJyb3dzO1xuXG4gIC8qKlxuICAgKiBLZXlkb3duIGhhbmRsZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gICAqIEBwYXJhbSB7TnVtYmVyfSBrZXlcbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuXG4gIGZ1bmN0aW9uIG9ua2V5ZG93bihldmVudCl7XG4gICAga2V5ID0gZXZlbnQud2hpY2g7XG4gICAgaWYgKCEoa2V5IGluIG1hcCkpIHJldHVybjtcbiAgICBrZXkgPSBtYXBba2V5XTtcblxuICAgIC8vIE9SIGBrZXlgXG4gICAga2V5cyA9IGRvd24gfD0ga2V5O1xuXG4gICAgLy8gcmVjZW50IG9wcG9zaXRlIGBrZXlgIHRha2VzIHByZWNlZGVuY2VcbiAgICAvLyBzbyBYT1Igb2xkIGZyb20gdGhlIGBrZXlzYCBiaXRtYXNrXG4gICAgaWYgKGtleXMgJiBvcHBba2V5XSkge1xuICAgICAga2V5cyBePSBvcHBba2V5XTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogS2V5dXAgaGFuZGxlci5cbiAgICpcbiAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGtleVxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG5cbiAgZnVuY3Rpb24gb25rZXl1cChldmVudCl7XG4gICAga2V5ID0gZXZlbnQud2hpY2g7XG4gICAgaWYgKCEoa2V5IGluIG1hcCkpIHJldHVybjtcbiAgICBrZXkgPSBtYXBba2V5XTtcblxuICAgIC8vIFhPUiBga2V5YFxuICAgIGtleXMgPSBkb3duIF49IGtleTtcbiAgfVxufTtcblxuLyoqXG4gKiBNZXJnZSB1dGlsLlxuICovXG5cbmZ1bmN0aW9uIG1lcmdlKHRhcmdldCwgc3JjKSB7XG4gIGZvciAodmFyIGtleSBpbiBzcmMpIHtcbiAgICB0YXJnZXRba2V5XSA9IHNyY1trZXldO1xuICB9XG59XG4iLCJ2YXIgcGl4ZWwgPSByZXF1aXJlKCdwaXhlbC1hcnQnKTtcbnZhciBMb29wID0gcmVxdWlyZSgnLi9sb29wJyk7XG52YXIgc3ByaXRlID0gcmVxdWlyZSgnLi9zcHJpdGUnKTtcbnZhciBhcnJvd3MgPSByZXF1aXJlKCcuL2Fycm93cycpO1xuXG52YXIgayA9IGFycm93cyhkb2N1bWVudC5ib2R5KTtcblxudmFyIHBsYXllciA9IGNyZWF0ZVNwcml0ZSgncGxheWVyJyk7XG5cbnBsYXllci5zcGVlZCA9IDE0O1xucGxheWVyLmZhY2UgPSAnc3RhbmRfZG93bic7XG5wbGF5ZXIuZmFjZUR1cmF0aW9uID0gNTtcbnBsYXllci5mYWNlSW5kZXggPSAwO1xucGxheWVyLmZhY2VOZWVkbGUgPSAwO1xucGxheWVyLmZhY2VNYXAgPSB7XG4gICcwLDAnOiAnc3RhbmRfZG93bicsXG4gICctMSwwJzogJ3J1bl9sZWZ0JyxcbiAgJzAsLTEnOiAncnVuX3VwJyxcbiAgJzEsMCc6ICdydW5fcmlnaHQnLFxuICAnMCwxJzogJ3J1bl9kb3duJyxcbiAgJy0xLC0xJzogJ3J1bl91cF9sZWZ0JyxcbiAgJzEsLTEnOiAncnVuX3VwX3JpZ2h0JyxcbiAgJy0xLDEnOiAncnVuX2Rvd25fbGVmdCcsXG4gICcxLDEnOiAncnVuX2Rvd25fcmlnaHQnLFxufTtcbnBsYXllci5mYWNlU3RhbmRNYXAgPSB7XG4gICcwLDAnOiAnc3RhbmRfZG93bicsXG4gICctMSwwJzogJ3N0YW5kX2xlZnQnLFxuICAnMCwtMSc6ICdzdGFuZF91cCcsXG4gICcxLDAnOiAnc3RhbmRfcmlnaHQnLFxuICAnMCwxJzogJ3N0YW5kX2Rvd24nLFxuICAnLTEsLTEnOiAnc3RhbmRfdXBfbGVmdCcsXG4gICcxLC0xJzogJ3N0YW5kX3VwX3JpZ2h0JyxcbiAgJy0xLDEnOiAnc3RhbmRfZG93bl9sZWZ0JyxcbiAgJzEsMSc6ICdzdGFuZF9kb3duX3JpZ2h0Jyxcbn07XG5cbnBsYXllci5tb3ZlID0gZnVuY3Rpb24oeCwgeSl7XG4gIHBsYXllci52ZWwueCB8PSB4O1xuICBwbGF5ZXIudmVsLnkgfD0geTtcbn07XG5cbnBsYXllci51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgcGxheWVyLnBvcy54ICs9IHBsYXllci52ZWwueCAqIHBsYXllci5zcGVlZDtcbiAgcGxheWVyLnBvcy55ICs9IHBsYXllci52ZWwueSAqIHBsYXllci5zcGVlZDtcbiAgcGxheWVyLnZlbC54ID0gMDtcbiAgcGxheWVyLnZlbC55ID0gMDtcbn07XG5cbnBsYXllci5yZW5kZXIgPSBmdW5jdGlvbihkdCwgYWxwaGEpIHtcbiAgcGxheWVyLnB4LnggKz0gKHBsYXllci5wb3MueCAtIHBsYXllci5weC54KSAqIGFscGhhO1xuICBwbGF5ZXIucHgueSArPSAocGxheWVyLnBvcy55IC0gcGxheWVyLnB4LnkpICogYWxwaGE7XG5cbiAgdmFyIGkgPSBwbGF5ZXIuZmFjZUluZGV4O1xuICB2YXIgbiA9IHBsYXllci5mYWNlTmVlZGxlO1xuICBuICU9IHNwcml0ZS5wbGF5ZXIuYW5pbWF0aW9uW3BsYXllci5mYWNlXS5sZW5ndGg7XG5cbiAgdmFyIGluZGV4ID0gc3ByaXRlLnBsYXllci5hbmltYXRpb25bcGxheWVyLmZhY2VdW25dO1xuICB2YXIgeCA9IGluZGV4WzBdICogc3ByaXRlLnBsYXllci53aWR0aCAqIHNwcml0ZS5zY2FsZTtcbiAgdmFyIHkgPSBpbmRleFsxXSA/IHNwcml0ZS5wbGF5ZXIuaGVpZ2h0ICogc3ByaXRlLnNjYWxlIDogMDtcbiAgcGxheWVyLmZhY2VJbmRleCA9IChpICsgMSkgJSBwbGF5ZXIuZmFjZUR1cmF0aW9uO1xuICBpZiAocGxheWVyLmZhY2VJbmRleCA9PT0gMCkgcGxheWVyLmZhY2VOZWVkbGUgPSBuICsgMTtcblxuICBPYmplY3QuYXNzaWduKHBsYXllci5lbC5zdHlsZSwge1xuICAgIGxlZnQ6IE1hdGgucm91bmQocGxheWVyLnB4LngpICsgJ3B4JyxcbiAgICB0b3A6IE1hdGgucm91bmQocGxheWVyLnB4LnkpICsgJ3B4JyxcbiAgICBiYWNrZ3JvdW5kUG9zaXRpb246IGAtJHt4fXB4IC0ke3l9cHhgLFxuICB9KTtcbn07XG5cbmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocGxheWVyLmVsKTtcblxuLyogbG9vcCAqL1xuXG52YXIgbG9vcCA9IG5ldyBMb29wO1xuXG5sb29wLm9uKCd1cGRhdGUnLCAoKSA9PiB7XG4gIGNvbnRyb2xzKCk7XG4gIHVwZGF0ZSgpO1xufSk7XG5cbmxvb3Aub24oJ3JlbmRlcicsIHJlbmRlcik7XG5cbmxvb3AuZnBzKDEwKS5zdGFydCgpO1xuXG5mdW5jdGlvbiB1cGRhdGUoKSB7XG4gIHBsYXllci51cGRhdGUoKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyKGR0LCBhbHBoYSwgZnJhbWUsIGVsYXBzZWQpIHtcbiAgcGxheWVyLnJlbmRlcihkdCwgYWxwaGEsIGZyYW1lLCBlbGFwc2VkKTtcbn1cblxuZnVuY3Rpb24gY29udHJvbHMoKSB7XG4gIGsgJiBrLmxlZnQgICYmIHBsYXllci5tb3ZlKC0xLDApO1xuICBrICYgay51cCAgICAmJiBwbGF5ZXIubW92ZSgwLC0xKTtcbiAgayAmIGsucmlnaHQgJiYgcGxheWVyLm1vdmUoMSwwKTtcbiAgayAmIGsuZG93biAgJiYgcGxheWVyLm1vdmUoMCwxKTtcbiAgcGxheWVyLmZhY2UgPSBwbGF5ZXIuZmFjZU1hcFtwbGF5ZXIudmVsXTtcbiAgcGxheWVyLmZhY2VTdGFuZE1hcFsnMCwwJ10gPVxuICBwbGF5ZXIuZmFjZU1hcFsnMCwwJ10gPSBwbGF5ZXIuZmFjZVN0YW5kTWFwW3BsYXllci52ZWxdO1xufVxuXG4vKiB1dGlscyAqL1xuXG5mdW5jdGlvbiBjcmVhdGVTcHJpdGUobmFtZSkge1xuICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgY2FudmFzLndpZHRoID0gc3ByaXRlW25hbWVdLmxlbmd0aCAqIHNwcml0ZVtuYW1lXS53aWR0aCAqIHNwcml0ZS5zY2FsZTtcbiAgY2FudmFzLmhlaWdodCA9IHNwcml0ZVtuYW1lXS5oZWlnaHQgKiBzcHJpdGUuc2NhbGUgKiAyO1xuXG4gIHNwcml0ZVtuYW1lXVxuICAgIC8vIG5vcm1hbFxuICAgIC5tYXAoKGFydCwgaW5kZXgpID0+IHtcbiAgICAgIHBpeGVsLmFydChhcnQpXG4gICAgICAucGFsZXR0ZShzcHJpdGVbbmFtZV0ucGFsZXR0ZSlcbiAgICAgIC5zY2FsZShzcHJpdGUuc2NhbGUpLnBvcyh7XG4gICAgICAgIHg6IHNwcml0ZVtuYW1lXS53aWR0aCAqIHNwcml0ZS5zY2FsZSAqIGluZGV4LFxuICAgICAgICB5OiAwXG4gICAgICB9KVxuICAgICAgLmRyYXcoY29udGV4dCk7XG4gICAgICByZXR1cm4gYXJ0O1xuICAgIH0pXG5cbiAgICAvLyBtaXJyb3IgeFxuICAgIC5tYXAoKGFydCwgaW5kZXgpID0+IHtcbiAgICAgIGFydCA9IGFydC5zcGxpdCgnXFxuJykubWFwKHJvdyA9PiBwYWRSaWdodChyb3csIHNwcml0ZVtuYW1lXS53aWR0aCkuc3BsaXQoJycpLnJldmVyc2UoKS5qb2luKCcnKSk7XG4gICAgICBwaXhlbC5hcnQoYXJ0KVxuICAgICAgLnBhbGV0dGUoc3ByaXRlW25hbWVdLnBhbGV0dGUpXG4gICAgICAuc2NhbGUoc3ByaXRlLnNjYWxlKS5wb3Moe1xuICAgICAgICB4OiBzcHJpdGVbbmFtZV0ud2lkdGggKiBzcHJpdGUuc2NhbGUgKiBpbmRleCxcbiAgICAgICAgeTogc3ByaXRlW25hbWVdLmhlaWdodCAqIHNwcml0ZS5zY2FsZVxuICAgICAgfSlcbiAgICAgIC5kcmF3KGNvbnRleHQpO1xuICAgICAgcmV0dXJuIGFydDtcbiAgICB9KTtcblxuICB2YXIgZGF0YVVSTCA9IGNhbnZhcy50b0RhdGFVUkwoKTtcbiAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBkaXYuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICBkaXYuc3R5bGUuYmFja2dyb3VuZCA9IGB1cmwoJHtkYXRhVVJMfSkgMCAwIG5vLXJlcGVhdGA7XG4gIGRpdi5zdHlsZS53aWR0aCA9IHNwcml0ZS5zY2FsZSAqIHNwcml0ZVtuYW1lXS53aWR0aCArICdweCc7XG4gIGRpdi5zdHlsZS5oZWlnaHQgPSBzcHJpdGUuc2NhbGUgKiBzcHJpdGVbbmFtZV0uaGVpZ2h0ICsgJ3B4JztcbiAgcmV0dXJuIHtcbiAgICBlbDogZGl2LFxuICAgIHB4OiBuZXcgUG9pbnQsXG4gICAgcG9zOiBuZXcgUG9pbnQsXG4gICAgdmVsOiBuZXcgUG9pbnQsXG4gIH07XG59XG5cbmZ1bmN0aW9uIHBhZFJpZ2h0KHMsIG4pIHtcbiAgcmV0dXJuIHMgKyBuZXcgQXJyYXkobiAtIHMubGVuZ3RoICsgMSkuam9pbignICcpO1xufVxuXG5mdW5jdGlvbiBQb2ludCgpIHtcbiAgdGhpcy54ID0gMDtcbiAgdGhpcy55ID0gMDtcbn1cblxuUG9pbnQucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnggKyAnLCcgKyB0aGlzLnk7XG59O1xuIiwiXG4vKiFcbiAqXG4gKiBsb29wXG4gKlxuICogTUlUIGxpY2Vuc2VkLlxuICpcbiAqL1xuXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcjtcblxuLyoqXG4gKiBFeHBvc2UgYExvb3BgLlxuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IExvb3A7XG5cbi8qKlxuICogTG9vcCBjb25zdHJ1Y3Rvci5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gZnBzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIExvb3AoZnBzKSB7XG4gIHRoaXMubm93ID0gMDtcbiAgdGhpcy5iZWZvcmUgPSAwO1xuICB0aGlzLmRlbHRhVGltZSA9IDA7XG4gIHRoaXMubWF4RGVsdGFUaW1lID0gMDtcbiAgdGhpcy50aW1lU3RlcCA9IDA7XG4gIHRoaXMuc3RhcnRUaW1lID0gMDtcbiAgdGhpcy50aW1lRWxhcHNlZCA9IDA7XG4gIHRoaXMuYWNjdW11bGF0b3IgPSAwO1xuICB0aGlzLnRpY2tpbmcgPSBmYWxzZTtcbiAgdGhpcy5mcmFtZSA9IDA7XG4gIHRoaXMuX2ZwcyA9IDA7XG4gIHRoaXMuZnBzKGZwcyB8fCA2MCk7XG59XG5cbi8qKlxuICogTWFrZSBFbWl0dGVyLlxuICovXG5cbkxvb3AucHJvdG90eXBlLl9fcHJvdG9fXyA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGU7XG5cbi8qKlxuICogU3RhcnQuXG4gKlxuICogQHJldHVybiB7TG9vcH0gdGhpc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5Mb29wLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnN0YXJ0VGltZSA9XG4gIHRoaXMubm93ID1cbiAgdGhpcy5iZWZvcmUgPSBEYXRlLm5vdygpO1xuXG4gIHRoaXMuZW1pdCgnc3RhcnQnKTtcblxuICB0aGlzLnRpY2tpbmcgPSB0cnVlO1xuICB0aGlzLnRpY2soKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFBhdXNlLlxuICpcbiAqIEByZXR1cm4ge0xvb3B9IHRoaXNcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuTG9vcC5wcm90b3R5cGUucGF1c2UgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy50aWNraW5nID0gZmFsc2U7XG4gIHRoaXMuZW1pdCgncGF1c2UnKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNldCBvciBnZXQgZnJhbWVzIHBlciBzZWNvbmQuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IFtmcHNdXG4gKiBAcmV0dXJuIHtOdW1iZXJ8TG9vcH0gZnBzfHRoaXNcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuTG9vcC5wcm90b3R5cGUuZnBzID0gZnVuY3Rpb24oZnBzKSB7XG4gIGlmICghZnBzKSByZXR1cm4gdGhpcy5fZnBzO1xuICB0aGlzLl9mcHMgPSBmcHM7XG4gIHRoaXMudGltZVN0ZXAgPSAxMDAwIC8gdGhpcy5fZnBzIHwgMDtcbiAgdGhpcy5tYXhEZWx0YVRpbWUgPSB0aGlzLnRpbWVTdGVwICogNTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFRpY2suXG4gKlxuICogQHJldHVybiB7TG9vcH0gdGhpc1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuTG9vcC5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHZhciBhbHBoYTtcblxuICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRpY2spO1xuXG4gIHJldHVybiB0aGlzO1xuXG4gIGZ1bmN0aW9uIHRpY2soKSB7XG4gICAgaWYgKCFzZWxmLnRpY2tpbmcpIHJldHVybjtcblxuICAgIC8vIHJlcXVlc3QgYW5pbWF0aW9uIGZyYW1lIGVhcmx5XG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKTtcblxuICAgIC8vIHRpbWVyXG4gICAgc2VsZi5ub3cgPSBEYXRlLm5vdygpO1xuICAgIHNlbGYudGltZUVsYXBzZWQgPSBzZWxmLm5vdyAtIHNlbGYuc3RhcnRUaW1lO1xuICAgIHNlbGYuZGVsdGFUaW1lID0gc2VsZi5ub3cgLSBzZWxmLmJlZm9yZTtcbiAgICBzZWxmLmJlZm9yZSA9IHNlbGYubm93O1xuXG4gICAgLy8gZGlzY2FyZCB1cGRhdGVzIHdoZW4gdGljayB0b28gYmlnXG4gICAgaWYgKHNlbGYuZGVsdGFUaW1lID4gc2VsZi5tYXhEZWx0YVRpbWUpIHtcbiAgICAgIHNlbGYuZW1pdCgnZGlzY2FyZCcsIHNlbGYuZGVsdGFUaW1lIC8gc2VsZi50aW1lU3RlcCwgc2VsZi5kZWx0YVRpbWUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGFjY3VtdWxhdGUgdG8gb3ZlcmZsb3dcbiAgICBzZWxmLmFjY3VtdWxhdG9yICs9IHNlbGYuZGVsdGFUaW1lO1xuXG4gICAgLy8gY29uc3VtZSBuZXcgZnJhbWVzIGlmIG92ZXJmbG93ZWRcbiAgICB3aGlsZSAoc2VsZi5hY2N1bXVsYXRvciA+PSBzZWxmLnRpbWVTdGVwKSB7XG4gICAgICBzZWxmLmFjY3VtdWxhdG9yIC09IHNlbGYudGltZVN0ZXA7XG5cbiAgICAgIC8vIHNlbmQgdXBkYXRlIGFuZCBhZHZhbmNlIGZyYW1lXG4gICAgICBzZWxmLmVtaXQoJ3VwZGF0ZScsIHNlbGYudGltZVN0ZXAsIDEsICsrc2VsZi5mcmFtZSwgc2VsZi50aW1lRWxhcHNlZCk7XG4gICAgfVxuXG4gICAgLy8gY29tcHV0ZSBhbHBoYVxuICAgIGFscGhhID0gc2VsZi5hY2N1bXVsYXRvciAvIHNlbGYudGltZVN0ZXA7XG4gICAgc2VsZi5lbWl0KCdyZW5kZXInLCBzZWxmLmRlbHRhVGltZSwgYWxwaGEsIHNlbGYuZnJhbWUsIHNlbGYudGltZUVsYXBzZWQpO1xuICB9XG59O1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gdGhpcy5fZXZlbnRzIHx8IHt9O1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG5FdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghaXNOdW1iZXIobikgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCduIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBlciwgaGFuZGxlciwgbGVuLCBhcmdzLCBpLCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEF0IGxlYXN0IGdpdmUgc29tZSBraW5kIG9mIGNvbnRleHQgdG8gdGhlIHVzZXJcbiAgICAgICAgdmFyIGVyciA9IG5ldyBFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4gKCcgKyBlciArICcpJyk7XG4gICAgICAgIGVyci5jb250ZXh0ID0gZXI7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc1VuZGVmaW5lZChoYW5kbGVyKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKGlzRnVuY3Rpb24oaGFuZGxlcikpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIGlmIChsaXN0ZW5lcnMpIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIGlmICh0aGlzLl9ldmVudHMpIHtcbiAgICB2YXIgZXZsaXN0ZW5lciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICAgIGlmIChpc0Z1bmN0aW9uKGV2bGlzdGVuZXIpKVxuICAgICAgcmV0dXJuIDE7XG4gICAgZWxzZSBpZiAoZXZsaXN0ZW5lcilcbiAgICAgIHJldHVybiBldmxpc3RlbmVyLmxlbmd0aDtcbiAgfVxuICByZXR1cm4gMDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICByZXR1cm4gZW1pdHRlci5saXN0ZW5lckNvdW50KHR5cGUpO1xufTtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IFBpeGVsQXJ0O1xuXG5mdW5jdGlvbiBQaXhlbEFydChyb3dzKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBQaXhlbEFydCkpIHJldHVybiBuZXcgUGl4ZWxBcnQocm93cyk7XG5cbiAgdGhpcy5fcGFsZXR0ZSA9IHt9O1xuICB0aGlzLl9zY2FsZSA9IDI7XG4gIHRoaXMuX3Jvd3MgPSBbXTtcbiAgdGhpcy5fcG9zID0geyB4OiAwLCB5OiAwIH07XG5cbiAgaWYgKHJvd3MpIHRoaXMuYXJ0KHJvd3MpO1xufVxuXG5QaXhlbEFydC5hcnQgPSBQaXhlbEFydC5wcm90b3R5cGUuYXJ0ID0gZnVuY3Rpb24ocm93cykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUGl4ZWxBcnQpKSByZXR1cm4gbmV3IFBpeGVsQXJ0KHJvd3MpO1xuICB0aGlzLl9yb3dzID0gJ3N0cmluZycgPT09IHR5cGVvZiByb3dzID8gcm93cy5zcGxpdCgnXFxuJykgOiByb3dzO1xuICByZXR1cm4gdGhpcztcbn07XG5cblBpeGVsQXJ0LnByb3RvdHlwZS5wYWxldHRlID0gZnVuY3Rpb24ocGFsZXR0ZSkge1xuICB0aGlzLl9wYWxldHRlID0gcGFsZXR0ZTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5QaXhlbEFydC5wcm90b3R5cGUuc2NhbGUgPSBmdW5jdGlvbihzY2FsZSkge1xuICB0aGlzLl9zY2FsZSA9IHNjYWxlO1xuICByZXR1cm4gdGhpcztcbn07XG5cblBpeGVsQXJ0LnByb3RvdHlwZS5wb3MgPSBmdW5jdGlvbihwb3MpIHtcbiAgdGhpcy5fcG9zID0gcG9zO1xuICByZXR1cm4gdGhpcztcbn07XG5cblBpeGVsQXJ0LnByb3RvdHlwZS5zaXplID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgd2lkdGg6IHRoaXMuX3Jvd3MucmVkdWNlKGZ1bmN0aW9uKG1heCwgY29scykge1xuICAgICAgcmV0dXJuIE1hdGgubWF4KG1heCwgY29scy5sZW5ndGgpO1xuICAgIH0sIDApICogdGhpcy5fc2NhbGUsXG4gICAgaGVpZ2h0OiB0aGlzLl9yb3dzLmxlbmd0aCAqIHRoaXMuX3NjYWxlXG4gIH07XG59O1xuXG5QaXhlbEFydC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKGN0eCkge1xuICB2YXIgcCA9IHRoaXMuX3BvcztcbiAgdmFyIHMgPSB0aGlzLl9zY2FsZTtcbiAgdmFyIHJvd3MgPSB0aGlzLl9yb3dzO1xuICBmb3IgKHZhciBjb2xzLCB5ID0gMDsgeSA8IHJvd3MubGVuZ3RoOyB5KyspIHtcbiAgICBjb2xzID0gcm93c1t5XTtcbiAgICBmb3IgKHZhciBjb2wsIHggPSAwOyB4IDwgY29scy5sZW5ndGg7IHgrKykge1xuICAgICAgY29sID0gY29sc1t4XTtcbiAgICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLl9wYWxldHRlW2NvbF0gfHwgJ3RyYW5zcGFyZW50JztcbiAgICAgIGN0eC5maWxsUmVjdCh4KnMrcC54LCB5KnMrcC55LCBzLCBzKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuIiwiXG52YXIgc3ByaXRlID0gZXhwb3J0cztcblxuLy8gYmFsbFxuXG5zcHJpdGUuYmFsbCA9IFtcbmBcXFxuIG94XG54b29vXG5vb3hvXG4gb29cXFxuYCxgXFxcbiB4b1xub29vb1xueG94b1xuIG9vXFxcbmAsYFxcXG4geG9cbm9vb29cbnhveG9cbiBvb1xcXG5gXG5dO1xuXG5zcHJpdGUuYmFsbC5wYWxldHRlID0ge1xuICAnbyc6ICcjZmZmJyxcbiAgJ3gnOiAnIzAwMCdcbn07XG5cbi8vIGJhbGwgc2hhZG93XG5cbnNwcml0ZS5iYWxsX3NoYWRvdyA9IFtgXFxcbiA3Nzdcbjc3Nzc3XG4gNzc3XFxcbmBdO1xuXG5zcHJpdGUuYmFsbF9zaGFkb3cucGFsZXR0ZSA9IHtcbiAgJzcnOiAncmdiYSgwLDAsMCwwLjMpJ1xufTtcblxuc3ByaXRlLnBsYXllciA9IFtcblxuLy8gMDogZG93blxuYFxcXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eC4uLnh4XG4gIHhveC54b3hcbiAgIC4uLi4uXG4gICAgIC5cbiAgIHR0dHR0XG4gIHQgdHR0IHRcbiAgLiB0dHQgLlxuICAgIHBwcFxuICAgIC4gLlxuICAgIHQgdFxuICAgc3Mgc3NcXFxuYCxcblxuLy8gMTogZG93biByaWdodFxuXG5gXFxcbiAgICB4eHhcbiAgIHh4eHh4XG4gIHh4Li4uLlxuICB4Lm94LnhvXG4gICAuLi4uLlxuICAgICAuXG4gICB0dHR0XG4gIHR0dHR0XG4gIC50dHR0XG4gICAgcHBwXG4gICAgLiAuXG4gICAgdCB0XG4gICAgc3Nzc1xcXG5gLFxuXG4vLyAyOiByaWdodFxuYFxcXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eHguLi5cbiAgeHguLm94XG4gICB4Li4uLlxuICAgICAuXG4gICAgdHR0XG4gICB0dHR0XG4gICAudHR0XG4gICAgcHBcbiAgICAuLlxuICAgIHR0XG4gICAgc3NzXFxcbmAsXG5cbi8vIDM6IHVwIHJpZ2h0XG5cbmBcXFxuICAgIHh4eFxuICAgeHh4eHhcbiAgeHh4eHguXG4gIHh4eHgub3hcbiAgIHh4Li4uXG4gICAgIC5cbiAgIHR0dHRcbiAgIHR0dHR0XG4gICB0dHR0LlxuICAgIHBwcFxuICAgIC4gLlxuICAgIHQgdFxuICAgIHNzc3NcXFxuYCxcblxuLy8gNDogdXBcblxuYFxcXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eHh4eHh4XG4gIHh4eHh4eHhcbiAgIC54eHguXG4gICAgIC5cbiAgIHR0dHR0XG4gIHQgdHR0IHRcbiAgLiB0dHQgLlxuICAgIHBwcFxuICAgIC4gLlxuICAgIHQgdFxuICAgc3Mgc3NcXFxuYCxcblxuLy8gNTogcnVuIHJpZ2h0IDFcblxuYFxcXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eHguLi5cbiAgeHguLm94XG4gICB4Li4uLlxuICAgICAuXG4gICB0dHR0XG4gIHR0dHR0XG4gIC4gdHR0LlxuICAgIHBwcFxuICBzdHQuLlxuICBzICAgdFxuICAgICAgc3NcXFxuYCxcblxuLy8gNjogcnVuIHJpZ2h0IDJcblxuYFxcXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eHguLi5cbiAgeHguLm94XG4gICB4Li4uLlxuICAgICAuXG4gICAgdHR0XG4gICB0dHR0LlxuICAgdC50dFxuICAgIHBwXG4gICAgLi5cbiAgICB0dFxuICAgIHNzc1xcXG5gLFxuXG4vLyA3OiBydW4gcmlnaHQgM1xuXG5gXFxcbiAgICB4eHhcbiAgIHh4eHh4XG4gIHh4eC4uLlxuICB4eC4ub3hcbiAgIHguLi4uXG4gICAgIC5cbiAgICB0dHRcbiAgIHR0dHRcbiAgIHR0LnRcbiAgICBwcHBcbiAgc3R0Li5cbiAgcyAgIHRcbiAgICAgIHNzXFxcbmAsXG5cbi8vIDg6IHJ1biBkb3duIDFcblxuYFxcXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eC4uLnh4XG4gIHhveC54b3hcbiAgIC4uLi4uXG4gICAgIC5cbiAgIHR0dHR0XG4gIHQgdHR0IHRcbiAgLiB0dHQgLlxuICAgIHBwcFxuICAgIC4gLlxuICAgIHQgdFxuICAgIHMgc1xcXG5gLFxuXG4vLyA5OiBydW4gZG93biAyXG5cbmBcXFxuICAgIHh4eFxuICAgeHh4eHhcbiAgeHguLi54eFxuICB4b3gueG94XG4gICAuLi4uLlxuICAgdCAuXG4gIC50dHR0XG4gICAgdHR0dFxuICAgIHR0dHRcbiAgICBwcHAuXG4gICAgLiB0XG4gICAgLiBzXG4gICAgdFxuICAgIHNcXFxuYCxcblxuLy8gMTA6IHJ1biBkb3duIHJpZ2h0IDFcblxuYFxcXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eC4uLi5cbiAgeC5veC54b1xuICAgLi4uLi5cbiAgICAgLlxuICB0dHR0dFxuIC4gdHR0dFxuICAgdHR0dC5cbiAgICBwcHBcbiAgc3QuLi5cbiAgcyAgc3RcbiAgICAgIHNcXFxuYCxcblxuLy8gMTE6IHJ1biBkb3duIHJpZ2h0IDJcblxuYFxcXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eC4uLi5cbiAgeC5veC54b1xuICAgLi4uLi5cbiAgICAgLlxuICAgdHR0dFxuICAgdHR0dFxuICAgdC50dFxuICAgIHBwcFxuICAgIC4uLlxuICBzdCB0XG4gICBzIHNzXFxcbmAsXG5cbi8vIDEyOiBydW4gZG93biByaWdodCAzXG5cbmBcXFxuICAgIHh4eFxuICAgeHh4eHhcbiAgeHguLi4uXG4gIHgub3gueG9cbiAgIC4uLi4uXG4gICAgIC5cbiAudHR0dHRcbiAgIHR0dHQuXG4gICB0dHR0XG4gICAgcHBwXG4gIHN0Li4uXG4gIHMgICAgdFxuICAgICAgIHNzXFxcbmAsXG5cbi8vIDEzOiBydW4gdXAgcmlnaHQgMVxuXG5gXFxcbiAgICB4eHhcbiAgIHh4eHh4XG4gIHh4eHh4LlxuICB4eHh4Lm94XG4gICB4eC4uLlxuICAgICAuXG4gIHR0dHR0XG4gIC50dHR0dC5cbiAgIHR0dHRcbiAgICBwcHBcbiAgc3QuLi5cbiAgcyAgdFxuICAgICBzc1xcXG5gLFxuXG4vLyAxNDogcnVuIHVwIHJpZ2h0IDJcblxuYFxcXG4gICAgeHh4XG4gICB4eHh4eFxuICB4eHh4eC5cbiAgeHh4eC5veFxuICAgeHguLi5cbiAgICAgLlxuICAgdHR0dFxuICB0dHR0dFxuICAudHR0LlxuICAgIHBwcFxuICAgIC4uLlxuICAgc3QgdFxuICAgIHMgc3NcXFxuYCxcblxuLy8gMTU6IHJ1biB1cCByaWdodCAzXG5cbmBcXFxuICAgIHh4eFxuICAgeHh4eHhcbiAgeHh4eHguXG4gIHh4eHgub3hcbiAgIHh4Li4uXG4gICAgIC5cbiAgIHR0dHRcbiAgdHR0dHQuXG4gICB0dHR0XG4gICAgcHBwXG4gIHN0Li4uXG4gIHMgICAgdHNcbiAgICAgICBzXFxcbmAsXG5cblxuLy8gMTY6IHJ1biB1cCAxXG5cbmBcXFxuICAgIHh4eFxuICAgeHh4eHhcbiAgeHh4eHh4eFxuICB4eHh4eHh4XG4gICAueHh4LlxuICAgICAuXG4gICB0dHR0dFxuICB0IHR0dCB0XG4gIC4gdHR0IC5cbiAgICBwcHBcbiAgICAuIC5cbiAgICB0IHRcbiAgICBzIHNcXFxuYCxcblxuLy8gMTc6IHJ1biB1cCAyXG5cbmBcXFxuICAgIHh4eFxuICAgeHh4eHhcbiAgeHh4eHh4eFxuICB4eHh4eHh4XG4gICAueHh4LlxuICAgICAuXG4gIC50dHR0XG4gICAgdHR0dFxuICAgIHR0dHRcbiAgICBwcHAuXG4gICAgLiB0XG4gICAgLiBzXG4gICAgdFxuICAgIHNcXFxuYCxcbl07XG5cbnNwcml0ZS5wbGF5ZXIuYW5pbWF0aW9uID0ge1xuICBzdGFuZF9kb3duOiBbWzBdXSxcbiAgc3RhbmRfZG93bl9yaWdodDogW1sxXV0sXG4gIHN0YW5kX3JpZ2h0OiBbWzJdXSxcbiAgc3RhbmRfdXBfcmlnaHQ6IFtbM11dLFxuICBzdGFuZF91cDogW1s0XV0sXG4gIHN0YW5kX3VwX2xlZnQ6IFtbMyx0cnVlXV0sXG4gIHN0YW5kX2xlZnQ6IFtbMix0cnVlXV0sXG4gIHN0YW5kX2Rvd25fbGVmdDogW1sxLHRydWVdXSxcblxuICBydW5fcmlnaHQ6IFtbN10sWzZdLFs1XSxbMl1dLFxuICBydW5fbGVmdDogW1s3LHRydWVdLFs2LHRydWVdLFs1LHRydWVdLFsyLHRydWVdXSxcbiAgcnVuX2Rvd246IFtbOF0sWzldLFs4XSxbOSx0cnVlXV0sXG4gIHJ1bl91cDogW1sxNl0sWzE3XSxbMTZdLFsxNyx0cnVlXV0sXG4gIHJ1bl9kb3duX3JpZ2h0OiBbWzExXSxbMTJdLFsxMF0sWzFdXSxcbiAgcnVuX3VwX3JpZ2h0OiBbWzEzXSxbMTRdLFsxNV0sWzNdXSxcbiAgcnVuX2Rvd25fbGVmdDogW1sxMSx0cnVlXSxbMTIsdHJ1ZV0sWzEwLHRydWVdLFsxLHRydWVdXSxcbiAgcnVuX3VwX2xlZnQ6IFtbMTMsdHJ1ZV0sWzE0LHRydWVdLFsxNSx0cnVlXSxbMyx0cnVlXV0sXG59O1xuXG5zcHJpdGUucGxheWVyLnBhbGV0dGUgPSB7XG4gICd4JzogJyMwMDAnLFxuICAndic6ICcjNDQ0JyxcbiAgJ28nOiAnI2ZmZicsXG4gICcuJzogJyNmOTEnLFxuICAndCc6ICcjMDBmJyxcbiAgJ3AnOiAnI2ZmZicsXG4gICdzJzogJyMwMDAnLFxuICAnNyc6ICdyZ2JhKDAsMCwwLDAuMyknLFxufTtcblxuc3ByaXRlLnBsYXllci53aWR0aCA9IDExO1xuc3ByaXRlLnBsYXllci5oZWlnaHQgPSAxNDtcbnNwcml0ZS5zY2FsZSA9IDM7XG4iXX0=
