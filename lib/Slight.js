var http = require('http');
var url = require('url');

var Slight = module.exports = function(opts) {
  var self = this;
  self.opts = {
    port: 3000,
    optional_trailing_slash: true
  };
  for (var i in opts) self.opts[i] = opts[i];

  self.server = http.createServer(self.handle.bind(self));
  self.beforeList = [];
  self.routes = [];
  self.middleware = [];
  self.afterList = [];

  self.finishFn = function(err, body, req, res) {
    if (err) return res.send(err.status || 500, err.message || (typeof err === 'string' ? err : 'Internal error'));
    res.send(body)
  };
};

Slight.prototype.handle = function(req, res) {
  var self = this;

  res.send = function(status, body) {
    if (typeof body === 'undefined') {
      body = status;
      status = 200;
    }
    res.statusCode = status;
    res.end(body);
  };

  var parsed = req.parsedURL = url.parse(req.url, true);
  req.query = parsed.query;

  for (var i = 0; i < self.routes.length; i++) {
    var r = self.routes[i];
    if (req.method !== r.method) continue;
    var match = r.url_regex.exec(parsed.pathname);
    if (!match) continue;

    var params = match.slice(1);
    req.params = {};
    for (var p = 0; p < params.length; p++) {
      req.params[r.vars[p]] = decodeURIComponent(params[p]);
    }

    return self.run(req, res, r.fns);
  }

  self.run(req, res, []);
};

Slight.prototype.run = function(req, res, chain) {
  var self = this;


  function runChain(chain, done) {
    var index = 0;
    function next(err, body) {
      if (err) return done(err, body);
      var fn = chain[index++];
      if (!fn) return done(err, body);
      if (typeof fn !== 'function') console.log(fn);
      fn(req, res, next);
    }
    next();
  }

  // BEFORE -> USE (MIDDLEWARE) + ROUTE FUNCTIONS -> FINISH (response sent)  -> AFTER
  runChain(self.beforeList, function(err, body) {
    if (err) return self.finishFn(err, body, req, res);

    if (!chain || !chain.length) {
      var notFoundErr = new Error('404 Not found');
      notFoundErr.status = 404;
      return self.finishFn(notFoundErr, null, req, res);
    }

    runChain(self.middleware.concat(chain), function(err, body) {
      res.error = err;
      res.body = body;
      self.finishFn(err, body, req, res);
      runChain(self.afterList, function() {});
    });
  });
};

Slight.prototype.use = function(fn) {
  var self = this;
  self.middleware.push(fn);
};

Slight.prototype.before = function(fn) {
  var self = this;
  self.beforeList.push(fn);
};

Slight.prototype.after = function(fn) {
  var self = this;
  self.afterList.push(fn);
};

Slight.prototype.route = function(method, url, fns) {
  var self = this;

  fns = typeof fns === 'function' ? [ fns ] : fns;

  var vars = [];
  var route = {
    method: method,
    url: url,
    url_regex: new RegExp('^' + url.replace(/\/$/, '').replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&").replace(/\/:([A-Za-z0-9_]+)(\([^\\]+?\))?/g, function(s, n) {
      vars.push(n)
      return '\/([^\/]*?)(?=\/|$)';
    }) + '\/?$'),
    fns: fns
  };

  route.vars = vars;
  self.routes.push(route);
};

Slight.prototype.get = function(url) {
  var self = this;
  self.route('GET', url, Array.prototype.slice.call(arguments, 1))
};

Slight.prototype.post = function(url) {
  var self = this;
  self.route('POST', url, Array.prototype.slice.call(arguments, 1))
};

Slight.prototype.put = function(url) {
  var self = this;
  self.route('PUT', url, Array.prototype.slice.call(arguments, 1))
};

Slight.prototype.patch = function(url) {
  var self = this;
  self.route('PATCH', url, Array.prototype.slice.call(arguments, 1))
};

Slight.prototype.del = function(url) {
  var self = this;
  self.route('DELETE', url, Array.prototype.slice.call(arguments, 1))
};


Slight.prototype.finish = function(fn) {
  var self = this;
  self.finishFn = fn;
};

Slight.prototype.start = function(cb) {
  var self = this;

  self.server.listen(self.opts.port, cb);
};
