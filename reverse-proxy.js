'use strict';

var http = require('http'),
    httpProxy = require('http-proxy');

var KEY_MATCHER = /^(\d+)_([A-Z][A-Z-\.]*[A-Z])_NAME/;

function Parse(envVar) {
  var match = envVar.match(KEY_MATCHER);

  if (!match) return null;

  var val = {
    port: match[1],
    host: match[2].toLowerCase(),
  };

  val.target = 'http://' + val.port + '_' + val.host + ':' + val.port;

  return Object.freeze(val);
}

function Router() {
  var mapping = {};

  for (var key in process.env) {
    var parsed = Parse(key);

    if (!parsed) continue;

    if (parsed.host in mapping) {
      console.error("Duplicate mapping for host " + parsed.host);
      process.exit(1);
    }

    mapping[parsed.host] = parsed;

    console.log("Proxying " + parsed.host + " to " + parsed.target);
  }

  return function targetFor(domain) {
    return mapping[domain];
  };
}

var router = Router(),
    proxy = httpProxy.createProxyServer({});

proxy.on('error', function (err, req, res) {
  res.writeHead(500, {
    'Content-Type': 'text/plain'
  });

  console.error("ERROR: (%s) %s", req.headers.host, err.message);

  res.end('Something went wrong.');
});

var server = http.createServer(function(req, res) {
  var host = req.headers.host;

  if (!host) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.write('Host header required');
    return res.end();
  }

  var parsed = router(host);

  if (parsed === undefined) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.write('Unknown host');
    return res.end();
  }

  proxy.web(req, res, { target: parsed.target });
});

server.listen(8080);
