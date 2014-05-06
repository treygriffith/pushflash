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
var builtins = ['events', 'util'];

/**
 * Export constructor
 */
module.exports = Bundler;

/**
 * Script cache
 */
var cache = {};

/**
 * Bundle client script
 */
function Bundler(name) {
  if(!(this instanceof Bundler)) {
    return new Bundler(name);
  }

  this.responder = this.responder.bind(this);
  this.buildScript(name);
}

util.inherits(Bundler, Emitter);

/**
 * Build the actual script source
 * @param  {String} name Optional standalone name
 */
Bundler.prototype.buildScript = function (name) {

  var self = this;

  if(cache[name]) {
    this.script = cache[name];
    return this.emit('ready');
  }

  browserify(
    client,
    { builtins: builtins }
  )
  .bundle(
    { standalone: name },
    function (err, src) {
      if(err) throw err;

      cache[name] = src;
      self.script = src;
      self.emit('ready');
    }
  );
};

/**
 * HTTP/S Req/Res responder for the script
 * @param  {Req} req
 * @param  {Res} res
 */
Bundler.prototype.responder = function (req, res) {
  if(this.script) {
    res.set('Content-Type', 'application/javascript');
    res.send(this.script);
  } else {
    this.on('ready', this.responder.bind(this, req, res));
  }
};
