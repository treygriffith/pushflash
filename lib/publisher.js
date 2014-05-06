/**
 * Module dependencies.
 */
var createChannel = require('./channel');
var debug = require('debug')('pushflash');

/**
 * Export Publisher constructor
 */
module.exports = Publisher;

/**
 * Create new Publisher instance
 * @param {String} channel Id of channel to publish to
 * @param {Object} opts    Channel creation options
 */
function Publisher(channel, opts) {
  if(!(this instanceof Publisher)) {
    return new Publisher(channel, opts);
  }

  debug('creating publisher on channel '+channel);

  this.channelId = channel;
  this.channel = createChannel(channel, opts);
}

/**
 * Publish a message to a channel
 * @param  {String} type Type of message to send, e.g. `error`
 * @param  {String | Mixed} body Body of message to send
 */
Publisher.prototype.send = function (type, body) {
  var msg;

  if(arguments.length < 2) {
    msg = {
      type: null,
      body: type
    };
  } else {
    msg = {
      type: type,
      body: body
    };
  }

  msg.type = msg.type || 'info';

  debug('sending message of type `'+msg.type+'` on channel '+this.channelId);

  this.channel.send(msg);
};
