# simple-https-proxy

Easy way to use HTTPS for local HTTP servers for testing.

Adoptation of [https-proxy](https://github.com/yavorskiy/https-proxy)

## Install globally

```
npm i -g simple-https-proxy@latest
```

## Generate certs

```
simple-https-proxy --makeCerts=true
```

## Run proxy

```
simple-https-proxy [--target=http://localhost:5555] [--host=localhost] [--port=3001] [--rewriteBodyUrls=false]
```

Go to [https://localhost:3001](https://localhost:3001)

