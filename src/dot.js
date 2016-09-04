var css = require('../style.css');

module.exports = Dot;

function Dot(target) {
  this.el = document.createElement('div');
  this.el.className = css.dot;
  this.x = target.px.x;
  this.y = target.px.y;
  this.target = target;
}

Dot.prototype.update = function() {
  //
};

Dot.prototype.render = function() {
  this.x = this.target.px.x;
  this.y = this.target.px.y;
  Object.assign(this.el.style, {
    left: this.x + 'px',
    top: this.y + 'px'
  });
};
