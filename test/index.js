/**
 * Tests of net interceptors
 **/
'use strict';

const http = require('http');
const del  = require('del');
const got  = require('got');

const Interceptor = require('..');

del('/tmp/node-test-net-interceptor.sock');
for (let target of [3000, 3001, 3002, 3003, '/tmp/node-test-net-interceptor.sock']) {
    const server = http.createServer((req, res) => {
        res.write(`Real Server on ${target}!`);
        res.end();
    }).listen(target).unref();
    process.on('exit', () => server.close());
}

function fakeServer(target) {
    return http.createServer((req, res) => {
        res.write(`Fake Server on ${target}`);
        res.end();
    });
}

describe('create new Interceptors', () => {
    it('should be ok using new Interceptor("127.0.0.1", 3000)', (done) => {
        let interceptor = new Interceptor('127.0.0.1', 3000);
        interceptor.server = fakeServer('127.0.0.1:3000');
        interceptor.server.should.be.exactly(interceptor.server);
        done();
    });

    it('should be ok using new Interceptor("127.0.0.1:3001", server)', (done) => {
        let interceptor = new Interceptor('127.0.0.1:3001', fakeServer('127.0.0.1:3001'));
        done();
    });

    it('should be ok using new Interceptor("www.google.com", server)', (done) => {
        let interceptor = new Interceptor('www.google.com', fakeServer('127.0.0.1:3001'));
        done();
    });

    it('should be ok using new Interceptor("/tmp/node-test-net-interceptor.sock", server)', (done) => {
        let interceptor = new Interceptor('/tmp/node-test-net-interceptor.sock',
                fakeServer('/tmp/node-test-net-interceptor.sock'));
        done();
    });
});

describe('intercepting connections on 3000', () => {
    let interceptor = null;

    it('should be ok creating an interceptor', (done) => {
        interceptor = new Interceptor('127.0.0.1:3000', fakeServer('127.0.0.1:3000'));
        done();
    });

    it('should connect Real Server before interceptor starts', (done) => { (async () => {
        let res = await got('127.0.0.1:3000');
        res.body.should.be.exactly('Real Server on 3000!');
        done();
    })().catch(done); });

    it('should starts well', (done) => { (async () => {
        await interceptor.start(); 
        done();
    })().catch(done); });

    it('should connect Faked Server after intereptor starts', (done) => { (async () => {
        let res = await got('127.0.0.1:3000');
        res.body.should.be.exactly('Fake Server on 127.0.0.1:3000');
        done();
    })().catch(done); });

    it('should be ok connecting other servers', (done) => { (async () => {
        let res = await got('127.0.0.1:3001');
        res.body.should.be.exactly('Real Server on 3001!');
        done();
    })().catch(done); });

    it('should stop well', (done) => { (async () => {
        await interceptor.stop();
        done();
    })().catch(done); });

    it('should connect Real Server after interceptor stops', (done) => { (async () => {
        let res = await got('127.0.0.1:3000');
        res.body.should.be.exactly('Real Server on 3000!');
        done();
    })().catch(done); });

});

describe('intercepting connections on www.google.com', () => {
    let interceptor = new Interceptor('www.google.com', fakeServer('Google'));
    interceptor.start();
    it('it should response Fake Server on Google from google', (done) => { (async () => {
        let res = await got('www.google.com');
        res.body.should.be.exactly('Fake Server on Google');
        done();
    })().catch(done); });
});
