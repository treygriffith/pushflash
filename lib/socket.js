module.exports = Socket;

function Socket(subscriber, io) {
  this.subscriber = subscriber;
  this.io = io;
  this.channelId = null;

  this.io.on('set channel', this._setChannel.bind(this));
  this.io.on('disconnect', this._onDisconnect.bind(this));
}

Socket.prototype._setChannel = function (channelId) {
  this.subscriber.authorizeChannel(this.io.handshake, channelId, this._onChannelAuthorize(channelId));
};

Socket.prototype._onChannelAuthorize = function (channelId) {

  return (function (err, authorized) {

    if(err) return this.io.emit('error', err);
    if(!authorized) return this.io.emit('unauthorized channel', channelId);

    this._onDisconnect();
    this.channelId = channelId;
    this.channel = this.subscriber.subscribeTo(this, this.channelId);

    this.io = this.io.emit('channel set', this.channelId);

    this.channel.on('message', this._onMessage.bind(this));

  }).bind(this);
};

Socket.prototype._onMessage = function (msg) {
  if(typeof msg === 'string') {
    msg = {
      body: msg
    };
  }

  msg.type = msg.type || 'info';

  this.io.send(msg);
};

Socket.prototype._onDisconnect = function () {
  if(this.channelId) {
    this.subscriber.unsubscribeFrom(this, this.channelId);
    this.channelId = null;
  }
};
