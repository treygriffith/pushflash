/**
 * Module dependencies.
 */
var io = require('socket.io');
var Socket = require('./socket');
var createChannel = require('./channel');
var bundler = require('./bundler');

/**
 * Export constructor
 */
module.exports = Subscriber;


/**
 * Construct a new Subscriber
 * @param {Object} app  Express server
 * @param {Object} opts options for Subscriber
 * @property {String} namespace Path where client side socket should connect, defaults to `notifications`
 * @property {Function} authorize Function called with socket handshake data to check if a user is authorized
 * @property {Function} authorizeChannel Function called with socket handshake data to check if a user is authorized for this channel
 */
function Subscriber(app, opts) {
  if(!(this instanceof Subscriber)) {
    return new Subscriber(app, opts);
  }

  this.opts = opts || {};

  // client options
  this.opts.client = this.opts.client || {};
  this.opts.client.name = this.opts.client.name || 'Pushflash';
  this.opts.client.path = this.opts.client.path || '/pushflash.js';
  this.namespace = this.opts.namespace || 'notifications';

  // clients connected
  this.sockets = [];

  // pubsub channels subscribed to (cache)
  this.channels = {};

  // pubsub channel publishers (cache)
  this.publishers = {};

  // authorization functions
  this.authorize = this.opts.authorize || function (handshake, callback) {
    return callback(null, true);
  };
  this.authorizeChannel = this.opts.authorizeChannel || function (handshake, id, callback) {
    return callback(null, true);
  };

  // set up io namespace
  this.io = io.listen(app)
            .of('/' + this.namespace)
            .authorization(this.authorize)
            .on('connection', this._onSocket.bind(this));

  // send the client side script
  app.get(this.opts.client.path, bundler(this.opts.client.name).responder);
}

/**
 * Subscribe a socket to a channel
 * @param  {Socket} socket Socket to subscribe
 * @param  {String} id     Channel to subscribe to
 * @return {Channel}       Channel subscribed to
 */
Subscriber.prototype.subscribeTo = function (socket, id) {
  if(!this.channels[id]) {
    this.channels[id] = {
      id: id,
      subscribers: [],
      channel: createChannel(id, this.opts)
    };
  }

  var channel = this.channels[id];

  channel.subscribers.push(socket);

  return channel.channel;
};

/**
 * Unsubscribe a socket from a channel
 * @param  {Socket} socket Socket to unsubscribe
 * @param  {String} id     Channel to unsubscribe from
 * @return {undefined}
 */
Subscriber.prototype.unsubscribeFrom = function (socket, id) {
  var channel = this.channels[id];

  if(!channel) throw new Error("No channel `"+id+"` to unsubscribe from.");

  channel.subscribers.splice(channel.subscribers.indexOf(socket), 1);

  if(!channel.subscribers.length) {
    channel.end();
    delete this.channels[id];
  }
};

/**
 * Publish a message to a channel
 * @param  {String} channel Channel to publish to
 * @param  {String} type type of message to send
 * @param {String | Mixed} body body of message to send
 */
Subscriber.prototype.publish = function (channel, type, body) {
  if(!this.publishers[channel]) {
    this.publishers[channel] = new Publisher(channel, this.opts);
  }

  this.publishers[channel].send(type, body);
};

/**
 * Add a new socket on `connection`
 * @param  {Socket} socket Socket that just connected
 */
Subscriber.prototype._onSocket = function (socket) {
  this.sockets.push(new Socket(this, socket));
};
