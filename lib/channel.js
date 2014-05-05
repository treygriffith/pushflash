var pubsub = require('redis-pubsub');

module.exports = createChannel;

function createChannel(id, opts) {
  opts = opts || {};
  opts.host = opts.host || "localhost";
  opts.port = opts.port || 6379;

  if(!id) throw new Error("A channel id is required to create a subscriber.");

  return pubsub.createChannel(opts.port, opts.host, this.channelId);
}
