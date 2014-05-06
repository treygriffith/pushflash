/**
 * Module dependenices.
 */
var pubsub = require('redis-pubsub');

/**
 * Export channel creation function
 */
module.exports = createChannel;

/**
 * Create a new redis-pubsub channel
 * @param  {String} id   Channel id
 * @param  {Object} opts Redis-pubsub channel options
 * @return {Channel}     redis-pubsub channel
 */
function createChannel(id, opts) {
  opts = opts || {};
  opts.host = opts.host || "localhost";
  opts.port = opts.port || 6379;
  opts.password = opts.password || undefined;

  if(!id) throw new Error("A channel id is required.");

  debug('creating new pubsub channel on `'+id+
        '` with port: `'+opts.port+'` and host: `'+opts.host+'`. '+
        (opts.password ? 'Using' : 'Not using') + 'password.');

  return pubsub.createChannel(opts.port, opts.host, id, {auth_pass: opts.password});
}
