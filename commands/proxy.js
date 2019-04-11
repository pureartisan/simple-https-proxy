var fs        = require('fs');
var path      = require('path');
var httpProxy = require('http-proxy');

const ROOT_DIR = path.resolve(__dirname, '..');

const sslOptions = {
  key  : fs.readFileSync(path.join(ROOT_DIR, 'certs', 'server', 'local.key'), 'utf8'),
  cert : fs.readFileSync(path.join(ROOT_DIR, 'certs', 'server', 'local.cert'), 'utf8')
};

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
};

const isHtmlResponse = (headers) => {
  const contentType = headers ? (headers['content-type'] || '') : '';
  return contentType.includes('/html');
};

const rewriteUrlInBody = (body, search, replace) => {
  return (body || '').replace(search, replace);
};

const getOriginalHeaders = (rawHeaders) => {
  const headers = {};
  const length = rawHeaders ? (rawHeaders.length) || 0 : 0;
  const key = null;
  for (let i=0; i<length; i++) {
    if (i % 2 === 0) {
      key = rawHeaders[i];
    } else {
      headers[key] = rawHeaders[i];
    }
  }
  return headers;
};

class Proxy {

  run(target, port, rewriteBodyUrls) {

    const proxy = httpProxy.createServer({
      target : target,
      ssl : sslOptions,
      selfHandleResponse : true
    });

    const search = new RegExp(escapeRegExp(`http://localhost:${port}`), 'g');
    const replacement = `https://localhost:${port}`;

    proxy.on('error', function (err, req, res) {
      // do nothing
    });

    proxy.on('proxyRes', function (proxyRes, req, res) {
      let body = new Buffer('');
      proxyRes.on('data', function (data) {
          body = Buffer.concat([body, data]);
      });
      proxyRes.on('end', function () {
          body = body.toString();
          if (rewriteBodyUrls && isHtmlResponse(proxyRes.headers)) {
            body = rewriteUrlInBody(body, search, replacement);
          }
          res.writeHead(proxyRes.statusCode, getOriginalHeaders(proxyRes.rawHeaders));
          res.end(body);
      });
    });

    proxy.listen(port);
    console.log('Proxing to "%s" through "https://localhost:%s"', target, port);

  }

}

module.exports = Proxy;