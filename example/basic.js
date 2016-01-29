var Slight = require('../lib/Slight');
var slight = new Slight({
  port: 3000
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

slight.finish(function(err, body, req, res) {
  if (err) {
    return res.send(err.status || 500, err.message || (typeof err === 'string' ? err : 'Internal error'));
  }

  res.setHeader('Server', 'Slight');

  if (String(body) == '[object Object]' || Array.isArray(body)) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    body = JSON.stringify(body);
  }

  res.send(body);
});

slight.get('/', function(req, res, next) {
  // console.log(req,res,next);
  next(null, 'hi');
});

slight.route('GET', '/json', [function(req, res,next) {
  next(null, { test: true });
}]);

slight.route('GET', '/:user', function(req, res, next) {
  // console.log(req,res,next);
  next(new Error('nooo'));
});

slight.route('GET', '/:foo/:bar', function(req, res, next) {
  next(null, req.params);
});

slight.start(function() {
  console.log('listening');
});
