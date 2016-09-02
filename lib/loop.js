
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
