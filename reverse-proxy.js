'use strict';

var http = require('http'),
    httpProxy = require('http-proxy');

var keyMatcher = /^([A-Z][A-Z-\.]*[A-Z])_PORT$/,
    valMatcher = /^tcp:\/\/(\d+\.\d+\.\d+\.\d+:80)$/;

function matchDomain(key) {
  var match = key.match(keyMatcher);

  if (!match) return;

  return match[1].toLowerCase();
}

function matchTarget(val) {
  var match = val.match(valMatcher);

  if (!match) return;

  return match[1];
}

function Router() {
  var mapping = {};

  for (var key in process.env) {
    var domain = matchDomain(key);
    if (!domain) continue;

    var target = matchTarget(process.env[key]);
    if (!target) continue;

    mapping[domain] = target;

    console.log("Proxying for " + domain);
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

  var target = router(host);

  if (target === undefined) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.write('Unknown host');
    return res.end();
  }

  proxy.web(req, res, { target: 'http://' + target });
});

server.listen(80, function downgradePrivileges() {
  process.setgid('nogroup');
  process.setuid('nobody');
});
