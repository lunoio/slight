# Slight

Slight is a fast, lightweight and dependency-free HTTP server framework designed for APIs, similar to Express.

Used at [Luno](https://luno.io) to power our User Management API.

## Install

[npm](https://www.npmjs.com/package/slight)

```sh
npm install --save slight
```

## Usage

```js
var Slight = require('slight');
var slight = new Slight({
  port: 3000
});

slight.get('/', function(req, res, next) {
  next(null, 'Hi there!');
});

slight.start(function() {
  console.log('listening');
});
```

## Detailed Usage

Middlewares are run in order from `before` -> `use` -> route functions -> `finish` -> `after`

```js
var Slight = require('slight');
var slight = new Slight({
  port: 3000,
  optional_trailing_slash: true
});

slight.before(function(req, res, next) {
  req.startTime = process.hrtime();
  next();
});

slight.after(function(req, res, next) {
  var time = process.hrtime(req.startTime);
  var ms = time[0] * 1000 + time[1] / 1000000;
  console.log(req.url + ': took ' + ms + ' ms');
  next();
});

slight.use(function(req, res, next) {
  var validAuth = true;
  if (validAuth) return next();

  next(new Error('Invalid Auth'));
});

// method, route, function(s)
slight.route('GET', '/users/:name', function(req, res, next) {
  next(null, { name: req.params.name });
});

// A finish function should be defined to handle all responses
slight.finish(function(err, body, req, res) {
  res.setHeader('Server', 'Slight');

  if (err) {
    return res.send(err.status || 500, err.message);
  }

  if (typeof body === 'object') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    body = JSON.stringify(body);
  }

  res.send(body);
});

slight.start(function() {
  console.log('listening');
});
```

If you need more detailed usage examples, take a look at the example directory, the source code (it's quite small and hopefully fairly easy to understand) or create an issue!
