/**
 * Dependencies.
 */
var browserify = require('browserify');
var path = require('path');
var Emitter = require('events').EventEmitter;

/**
 * Options
 */
var client = path.join(__dirname, '../client');
var builtins = ['events'];

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
    return new Bundler();
  }
  Emitter.call(this);

  this.responder = this.responder.bind(this);
  this.buildScript(name);
}

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
