/**
 * Module dependencies.
 */
var io = require('socket.io');
var Socket = require('./socket');
var createChannel = require('./channel');
var Bundler = require('./bundler');
var debug = require('debug')('pushflash');

/**
 * Export constructor
 */
module.exports = Manager;


/**
 * Construct a new Manager
 * @param {Object} app  Express app
 * @param {Object} server HTTP/S server
 * @param {Object} opts options for Manager
 * @property {String} namespace Path where client side socket should connect, defaults to `notifications`
 * @property {Function} authorize Function called with socket handshake data to check if a user is authorized
 * @property {Function} authorizeChannel Function called with socket handshake data to check if a user is authorized for this channel
 */
function Manager(app, server, opts) {
  if(!(this instanceof Manager)) {
    return new Manager(app, server, opts);
  }

  debug('initializing manager');

  this.opts = opts || {};

  // client options
  this.opts.client = this.opts.client || {};
  this.opts.client.name = this.opts.client.name || 'Pushflash';
  this.opts.client.path = this.opts.client.path || '/pushflash.js';
  this.opts.css = this.opts.css || {};
  this.opts.css.theme = this.opts.css.theme || 'jackedup';
  this.opts.css.path = this.opts.css.path || '/pushflash.css';
  this.namespace = this.opts.namespace || 'notifications';

  // redis options
  this.opts.redis = this.opts.redis || {};

  // clients connected
  this.sockets = [];

  // pubsub channels subscribed to (cache)
  this.channels = {};

  // authorization functions
  this.authorize = this.opts.authorize || function (handshake, callback) {
    return callback(null, true);
  };
  this.authorizeChannel = this.opts.authorizeChannel || function (handshake, id, callback) {
    return callback(null, true);
  };

  // set up io namespace
  this.io = io.listen(server)
            .of('/' + this.namespace)
            .authorization(this.authorize)
            .on('connection', this._onSocket.bind(this));

  debug('socket.io listening on '+this.namespace);

  // send the client side script
  var bundler = new Bundler(this.opts.client.name, this.opts.css.theme);
  app.get(this.opts.client.path, bundler.scriptResponder);
  debug('client-side script ready');

  if(this.opts.css && this.opts.css.theme) {
    app.get(this.opts.css.path, bundler.cssResponder);
    debug('client-side css ready');
  }

}

/**
 * Subscribe a socket to a channel
 * @param  {Socket} socket Socket to subscribe
 * @param  {String} id     Channel to subscribe to
 * @return {Channel}       Channel subscribed to
 */
Manager.prototype.subscribeTo = function (socket, id) {
  if(!this.channels[id]) {
    this.channels[id] = {
      id: id,
      subscribers: [],
      channel: createChannel(id, this.opts.redis)
    };
  }

  var channel = this.channels[id];

  channel.subscribers.push(socket);

  debug('new socket subscribed to '+id);

  return channel.channel;
};

/**
 * Unsubscribe a socket from a channel
 * @param  {Socket} socket Socket to unsubscribe
 * @param  {String} id     Channel to unsubscribe from
 * @return {undefined}
 */
Manager.prototype.unsubscribeFrom = function (socket, id) {
  var channel = this.channels[id];

  if(!channel) throw new Error("No channel `"+id+"` to unsubscribe from.");

  channel.subscribers.splice(channel.subscribers.indexOf(socket), 1);

  if(!channel.subscribers.length) {
    channel.channel.end();
    delete this.channels[id];
  }

  debug('socket unsubscribed from '+id);
};

/**
 * Add a new socket on `connection`
 * @param  {Socket} socket Socket that just connected
 */
Manager.prototype._onSocket = function (socket) {
  this.sockets.push(new Socket(this, socket));
};
