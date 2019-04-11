var fs        = require('fs');
var path      = require('path');
var httpProxy = require('http-proxy');

const ROOT_DIR = path.resolve(__dirname, '..');

const REGEX_URL_EXTRACT = /^(https?\:\/\/)([^:\/]+)(\:(\d+))?\/?$/;

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

const rewriteUrlInString = (body, search, replace) => {
  return (body || '').replace(search, replace);
};

const getOriginalHeaders = (rawHeaders) => {
  const headers = {};
  const length = rawHeaders ? (rawHeaders.length) || 0 : 0;
  let key = null;
  for (let i=0; i<length; i++) {
    if (i % 2 === 0) {
      key = rawHeaders[i];
    } else {
      headers[key] = rawHeaders[i];
    }
  }
  return headers;
};

const isRedirect = (statusCode) => {
  return statusCode >= 301 && statusCode <= 308;
};

const rewriteLocationHeader = (originalHeaders, search, replacement) => {
  const headers = {};
  for (let key in originalHeaders) {
    if (key.toLowerCase() === 'location') {
      headers[key] = rewriteUrlInString(originalHeaders[key], search, replacement);
    } else {
      headers[key] = originalHeaders[key];
    }
  }
  return headers;
};

const extractUrlData = (url) => {
  const s = url || '';
  let match = REGEX_URL_EXTRACT.exec(s);
  if (match) {
    return {
      host: match[2],
      port: match[4]
    };
  }
  return {};
};

const buildRegexForRewrite = (target, port) => {
  const targetParts = extractUrlData(target);
  const targetHost = targetParts.host || 'localhost';
  const targetPort = targetParts.port || '80';

  const rgxPartTarget = escapeRegExp(`http://${targetHost}:${targetPort}`);
  const rgxPartProxy = escapeRegExp(`http://${targetHost}:${port}`);

  return new RegExp(`${rgxPartTarget}|${rgxPartProxy}`, 'g');
};


class Proxy {

  run(target, host, port, rewriteBodyUrls) {

    const proxy = httpProxy.createServer({
      target : target,
      ssl : sslOptions,
      selfHandleResponse : true
    });

    const hostReplacement = host || 'localhost';
    const search = buildRegexForRewrite(target, port);
    const replacement = `https://${hostReplacement}:${port}`;

    proxy.on('error', function (err, req, res) {
      // do nothing
    });

    proxy.on('proxyRes', function (proxyRes, req, res) {
      let body = new Buffer('');
      let originalHeaders = getOriginalHeaders(proxyRes.rawHeaders);
      proxyRes.on('data', function (data) {
          body = Buffer.concat([body, data]);
      });
      proxyRes.on('end', function () {
          if (rewriteBodyUrls) {
            if (isHtmlResponse(proxyRes.headers)) {
              body = rewriteUrlInString(body.toString(), search, replacement);
            }
            if (isRedirect(proxyRes.statusCode)) {
              originalHeaders = rewriteLocationHeader(originalHeaders, search, replacement);
            }
          }
          res.writeHead(proxyRes.statusCode, originalHeaders);
          res.end(body);
      });
    });

    proxy.listen(port);
    console.log(`Proxing to "${target}" through "https://${host}:${port}"`);

  }

}

module.exports = Proxy;