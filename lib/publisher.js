var createChannel = require('./channel');

module.exports = Publisher;

function Publisher(channel, opts) {
  if(!(this instanceof Publisher)) {
    return new Publisher(opts);
  }

  this.channel = createChannel(channel, opts);
}

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

  this.channel.send(msg);
};
