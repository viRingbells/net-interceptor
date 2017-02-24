# net-interceptor
An interceptor for connections via Net in native node lib

# install
```
$ npm install --save-dev net-interceptor
```

# How to use

Remember this tool is supposed to be used in your tests.

```
// xxx.test.js

const interceptor = new Interceptor('www.google.com');  // Here intercepts connections to a certain ip/host

interceptor.server = http.createServer((req, res) => res.end("Hello World"));  // should be an instance of net.Server

await interceptor.start();

let res = await got('www.google.com');

console.log(res.body);   // ===> "Hello World"

await interceptor.stop();

```

# License
MIT
