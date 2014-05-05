var Publisher = require('./lib/publisher');
var Manager = require('./lib/manager');

module.exports = Manager;

Manager.Publisher = Publisher;

// cache publishers
var publishers = {};

/**
 * Publish a message to a channel
 * @param  {String} channel Channel to publish to
 * @param {Object} opts Optional Publisher options
 * @param  {String} type type of message to send
 * @param {String | Mixed} body body of message to send
 */
Manager.publish = function (channel, opts, type, body) {
  if(typeof opts !== 'object') {
    body = type;
    type = opts;
    opts = null;
  }

  if(!publishers[channel]) {
    publishers[channel] = new Publisher(channel, opts);
  }

  publishers[channel].send(type, body);
};
