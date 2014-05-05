/**
 * Module dependencies
 */
require('es5-shim');
var Emitter = require('events').EventEmitter;
var debug = require('debug')('pubsub');
var humane = require('humane-js');
var io = require('socket.io-client');

// expose the channel listener
function Subscriber(channel, namespace, opts) {
  if(!(this instanceof Subscriber)) {
    return new Subscriber(namespace, channel);
  }

  if(namespace && typeof namespace === 'object' && !opts) {
    opts = namespace;
    namespace = null;
  }

  opts = opts || {};

  Emitter.call(this);

  this.channel = channel;
  this.namespace = namespace || 'notifications';

  this.io = io.connect('/' + namespace);

  this.io.on('connect', this._onConnect.bind(this));
  this.io.on('disconnect', this._onDisconnect.bind(this));
  this.io.on('message', this._onMessage.bind(this));
  this.io.on('connect_failed', this._onConnectFailed.bind(this));
  this.io.on('unauthorized channel', this._onUnauthorizedChannel.bind(this));
  this.io.on('error', this._onError.bind(this));
  this.io.on('channel set', this._onChannelSet.bind(this));

  // humane message instantiation
  this.baseClass = opts.baseClass || 'humane-flatty';

  this.addMessageType('error');
  this.addMessageType('unauthorized', 'error');
  this.addMessageType('info');
  this.addMessageType('success');
  this.addMessageType('warning');
}

Subscriber.prototype.addMessageType = function (type, additionalClass) {
  if(!additionalClass) {
    additionalClass = type;
  }

  this[type] = humane.create({
    baseCls: this.baseClass,
    addnCls: this.baseClass + '-' + additionalClass
  });

  this.on(type, this[type].log.bind(this[type]));
};

Subscriber.prototype.setChannel = function (id) {
  debug('setting channel to '+id);
  this.channel = id;
  this.io.emit('set channel', id);
};

Subscriber.prototype._onConnect = function () {
  debug('connected to namespace '+this.namespace);
  this.setChannel(this.channel);
};

Subscriber.prototype._onDisconnect = function () {
  this.emit('error', 'Disconnected from host');
};

Subscriber.prototype._onMessage = function (msg) {
  debug('message received on channel '+this.channel);

  if(typeof msg === 'string') {
    msg = {
      type: null,
      body: msg
    };
  }

  msg.type = msg.type || 'info';

  debug('message is of type `'+msg.type+'` which is ' + ((typeof this[msg.type] === 'function') ? '' : 'not ') + 'registered.');
  this.emit(msg.type, msg.body);
};

Subscriber.prototype._onConnectFailed = function (reason) {
  this.emit('unauthorized', 'Unable to connect to namespace ' + reason);
};

Subscriber.prototype._onUnauthorizedChannel = function (channel) {
  this.emit('unauthorized', 'Unauthorized for channel '+channel);
};

Subscriber.prototype._onError = function (err) {
  this.emit('error', err);
};

Subscriber.prototype._onChannelSet = function (channel) {
  debug('subscribed to channel '+channel);
};
