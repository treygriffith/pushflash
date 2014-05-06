Pushflash
=========

Uses [Redis](http://redis.io), [Socket.io](http://socket.io), and [Humane.js](http://wavded.github.io/humane-js/) to make it easy to notify any user of your web app of something that happened.

Server:

```javascript
var pushflash = require('pushflash');

pushflash(app, server);
```

Client:

```html
<link rel="stylesheet" href="/pushflash.css">
<script src="/pushflash.js"></script>
<script>
  Pushflash('my_user_id'); // new messages on this channel will appear automatically
</script>
```

Worker:

```javascript
var pushflash = require('pushflash');
pushflash.publish('some_user_id', 'error', "something broke!");
```

Installation
------------

```
$ npm install pushflash
```

Usage
-----

### Server-side

#### Express Application Server

For the Application server, you simply call the exported function on your Express application, your HTTP/S server, and with any options you want.

```javascript
var app = express();
var server = http.createServer(app);

pushflash(app, server, options);
```

The `options` available are:

* `namespace` The Socket.io namespace for passing notifications. Defaults to `/notifications`
* `client.name` The name that gets exposed on `window` for the client-side script. Defaults to `Pushflash`
* `client.path` The path where the client-side script can be retrieved. Defaults to `/pushflash.js`
* `css.theme` The CSS theme from humane.js you'll be using. Defaults to `jackedup`
* `css.path` The path where the client-side css can be retrieved. Defaults to `/pushflash.css`
* `authorize` Function called when a client connects to Pushflash with the Socket.io handshake data and a callback. Callback with `(null, true)` if the client is authorized.
* `authorizeChannel` Function called when a client connects to Pushflash with the Socket.io handshake data, the channel id, and a callback. Callback with `(null, true)` if the client is authorized.
* `redis.port` Port number of the redis server. Defaults to `6379`.
* `redis.host` Host name of the redis server. Defaults to `localhost`.

The returned value is a `Manager` instance, but you don't need to do anything with it.

#### Worker Server

This can be the same server as the Application server, but it doesn't have to be (that's the whole point of Pushflash).

You can use the convenience `.publish` function like this:

```javascript
pushflash.publish(channel, options, messageType, messageBody);
```

The `options` available are the same as the `redis.` options for the Applications server.

You can also create a dedicated Publisher instance, by calling the `Publisher` constructor:

```javascript
var publisher = new pushflash.Publisher(channel, options);
```

And send messages with this publisher with the `send` method:

```javascript
publisher.send('info', "some info");
```

### Client-side

To use the client-side script, just define a script with the `src` tag set to the `client.path` defined in the Application Server options, which defaults to `/pushflash.js`. Also add a stylesheet to use the styles for humane.js.

```html
<link rel="stylesheet" href="/pushflash.css">

<script src="/pushflash.js"></script>
```

This will create a global variable with the name of `client.name` defined in the Application Server options, which defaults to `Pushflash`.

To subscribe to a channel, just call the `Pushflash` function with the name of the channel to subscribe to and any options you want.

```javascript
Pushflash(channel, opts);
```

The `options` available are:

* `namespace` The Socket.io namespace for passing notifications. Defaults to `/notifications`
* `baseClass` The humane.js baseClass to use for styling notifications. Defaults to `humane-jackedup`.

### Message Types

By default, Pushflash defines the following message types:

* `error` - Used both for Socket.io errors, Redis pubsub errors, and user space errors.
* `unauthorized` - Used internally for authorization problems.
* `info` - Informational messages.
* `success` - Success messages.

To add additional message types, just add them to the client instance:

```javascript
var pushflash = Pushflash('my_channel');

pushflash.addMessageType('custom', 'success'); // adds a `custom` message type that is styled like a `success` message.
```

Then you can publish messages of that type on the server:
```javascript
var pushflash = require('pushflash');

pushflash.publish('my_channel', 'custom', 'some custom message goes here.');
```
