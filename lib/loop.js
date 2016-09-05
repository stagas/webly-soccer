
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
 * @param {Number} tps
 * @api public
 */

function Loop(tps) {
  this.now = 0;
  this.before = 0;
  this.deltaTime = 0;
  this.maxDeltaTime = 0;
  this.timeStep = 0;
  this.startTime = 0;
  this.timeElapsed = 0;
  this.accumulator = 0;
  this.alpha = 0;
  this.frame = 0;
  this._tps = 0;
  this.tps(tps || 60);
  this.request = -1;
  this.tick = this.tick.bind(this);
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
  this.frame = 0;

  this.startTime =
  this.now =
  this.before = Date.now();

  this.cancelTick();
  this.requestTick();

  this.emit('start');

  return this;
};

/**
 * Pause.
 *
 * @return {Loop} this
 * @api public
 */

Loop.prototype.pause = function() {
  this.cancelTick();
  this.emit('pause');
  return this;
};

Loop.prototype.cancelTick = function() {
  window.cancelAnimationFrame(this.request);
};

Loop.prototype.requestTick = function() {
  this.request = window.requestAnimationFrame(this.tick);
};

/**
 * Set or get ticks per second.
 *
 * @param {Number} [tps]
 * @return {Number|Loop} tps|this
 * @api public
 */

Loop.prototype.tps = function(tps) {
  if (!tps) return this._tps;
  this._tps = tps;
  this.timeStep = 1000 / this._tps;
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
  // request animation frame early
  this.requestTick();

  // timer
  this.now = Date.now();
  this.timeElapsed = this.now - this.startTime;
  this.deltaTime = this.now - this.before;
  this.before = this.now;

  // discard updates when tick too big
  if (this.deltaTime > this.maxDeltaTime) {
    this.emit('discard', this.deltaTime / this.timeStep, this.deltaTime);
    return;
  }

  // accumulate to overflow
  this.accumulator += this.deltaTime;

  // consume new frames if overflowed
  while (this.accumulator >= this.timeStep) {
    this.accumulator -= this.timeStep;

    // send update and advance frame
    this.emit('update', this.timeStep, 1, ++this.frame, this.timeElapsed);
  }

  // compute alpha
  this.alpha = this.accumulator / this.timeStep;
  this.emit('render', this.deltaTime, this.alpha, this.frame, this.timeElapsed);
};
