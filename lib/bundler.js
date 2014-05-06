/**
 * Dependencies.
 */
var browserify = require('browserify');
var Emitter = require('events').EventEmitter;
var util = require('util');

/**
 * Options
 */
var client = require.resolve('pushflash-client');
var buildCss = require('pushflash-client/css');
var builtins = ['events', 'util'];

/**
 * Export constructor
 */
module.exports = Bundler;

/**
 * Script cache
 */
var scriptCache = {};

/**
 * Css cache
 */
var cssCache = {};



/**
 * Bundle client script
 */
function Bundler(name, theme) {
  if(!(this instanceof Bundler)) {
    return new Bundler(name, theme);
  }

  this.scriptResponder = this.scriptResponder.bind(this);
  this.buildScript(name);

  if(theme) {
    this.cssResponder = this.cssResponder.bind(this);
    this.buildCss(theme);
  }
}

util.inherits(Bundler, Emitter);

Bundler.prototype.buildCss = function (theme) {
  var self = this;

  buildCss(theme, function (err, css) {
    if(err) throw err;
    self.css = css;
    self.emit('cssReady');
  })
};

/**
 * Build the actual script source
 * @param  {String} name Optional standalone name
 */
Bundler.prototype.buildScript = function (name) {

  var self = this;

  if(scriptCache[name]) {
    this.script = scriptCache[name];
    return this.emit('scriptReady');
  }

  browserify(
    client,
    { builtins: builtins }
  )
  .bundle(
    { standalone: name },
    function (err, src) {
      if(err) throw err;

      scriptCache[name] = src;
      self.script = src;
      self.emit('scriptReady');
    }
  );
};

/**
 * HTTP/S Req/Res responder for the script
 * @param  {Req} req
 * @param  {Res} res
 */
Bundler.prototype.scriptResponder = function (req, res) {
  if(this.script) {
    res.set('Content-Type', 'application/javascript');
    res.send(this.script);
  } else {
    this.on('scriptReady', this.scriptResponder.bind(this, req, res));
  }
};

/**
 * HTTP/S Req/Res responder for the CSS
 * @param  {Req} req
 * @param  {Res} res
 */
Bundler.prototype.cssResponder = function (req, res) {
  if(this.script) {
    res.set('Content-Type', 'text/css');
    res.send(this.css);
  } else {
    this.on('cssReady', this.cssResponder.bind(this, req, res));
  }
};
