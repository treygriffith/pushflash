/**
 * Export Socket constructor
 */
module.exports = Socket;

/**
 * Create a new Socket instance
 * @param {Manager} manager Manager instance to which this socket belongs
 * @param {Socket.io Socket} io   Socket.io Socket over which we can communicate
 */
function Socket(manager, io) {
  this.manager = manager;
  this.io = io;
  this.channelId = null;

  this.io.on('set channel', this._setChannel.bind(this));
  this.io.on('disconnect', this._onDisconnect.bind(this));
}

/**
 * Listener for `set channel` event
 * @api private
 * @param {String} channelId channel that has been set
 */
Socket.prototype._setChannel = function (channelId) {
  this.manager.authorizeChannel(this.io.handshake, channelId, this._onChannelAuthorize(channelId));
};

/**
 * Listener for when channel has been authorized
 * @param  {String} channelId channel that is being authorized
 * @return {Function}           Callback for `authorizeChannel` that takes `err`, and `authorized`
 */
Socket.prototype._onChannelAuthorize = function (channelId) {

  return (function (err, authorized) {

    if(err) return this.io.emit('error', err);
    if(!authorized) return this.io.emit('unauthorized channel', channelId);

    this._onDisconnect();
    this.channelId = channelId;

    try {
      this.channel = this.manager.subscribeTo(this, this.channelId);
    } catch(e) {
      return this.io.emit('error', "Unable to connect to channel `"+channelId+"`.");
    }

    this.io.emit('channel set', this.channelId);

    this.channel.on('message', this._onMessage.bind(this));

  }).bind(this);
};

/**
 * `message` listener
 * @api private
 * 
 * @param  {Object} msg Message received from channel
 */
Socket.prototype._onMessage = function (msg) {
  if(typeof msg === 'string') {
    msg = {
      body: msg
    };
  }

  msg.type = msg.type || 'info';

  this.io.json.send(msg);
};

/**
 * `disconnect` listener
 * @api private
 * 
 */
Socket.prototype._onDisconnect = function () {
  if(this.channelId) {
    try {
      this.manager.unsubscribeFrom(this, this.channelId);
    } catch(e) {
      // this socket is already disconnected, so forget about it
      console.error(e);
    }
    this.channelId = null;
  }
};
