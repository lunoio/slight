var LWS = require('../lib/LWS');
var lws = new LWS({
  port: 3000
});

lws.before(function(req, res, next) {
  req.startTime = process.hrtime();
  next();
});

lws.after(function(req, res, next) {
  var time = process.hrtime(req.startTime);
  var ms = time[0] * 1000 + time[1] / 1000000;
  console.log(req.url + ': took ' + ms + ' ms');
  next();
});

lws.finish(function(err, body, req, res) {
  if (err) {
    return res.send(err.status || 500, err.message || (typeof err === 'string' ? err : 'Internal error'));
  }

  res.setHeader('Server', 'LWS');

  if (String(body) == '[object Object]' || Array.isArray(body)) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    body = JSON.stringify(body);
  }

  res.send(body);
});

lws.get('/', function(req, res, next) {
  // console.log(req,res,next);
  next(null, 'hi');
});

lws.route('GET', '/json', [function(req, res,next) {
  next(null, { test: true });
}]);

lws.route('GET', '/:user', function(req, res, next) {
  // console.log(req,res,next);
  next(new Error('nooo'));
});

lws.route('GET', '/:foo/:bar', function(req, res, next) {
  next(null, req.params);
});

lws.start(function() {
  console.log('listening');
})
