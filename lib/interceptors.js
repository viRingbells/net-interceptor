/**
 * @file intervene net.Socket.connect via a Map
 **/
'use strict';

const debug   = require('debug')('net-interceptor.interceptors');
const path    = require('path');
const Socket  = require('net').Socket;

const CONSTS  = require('./constants');

debug('loading ...');

/**
 * Stores all interceptors, this set is used in net.Socket when create connections
 * to check if interception should work
 **/
const interceptors = new Map();

process.on('exit', () => {
    debug('process exiting, clearing interceptors ...');
    for (let interceptor of interceptors.values()) {
        interceptor.stop();
    }
});

/**
 * Intervene net.Socket.connect
 **/
const connect = Socket.prototype.connect;
Socket.prototype.connect = function(...args) {
    const options = args[0];
    if (!(options instanceof Object) || interceptors.size === 0) {
        return connect.call(this, ...args);
    }
    debug('Socket starts to connect ...');

    let target = options.path ? options.path : `${options.host}:${options.port}`;
    target = path.normalize(target);
    if (!path.isAbsolute(target)) {
        target = path.join(CONSTS.ROOT, target);
    }
    debug(`Socket connecting target is parsed as ${target}`);

    for (const interceptor of interceptors.values()) {
        if (!match(interceptor.target, target)) {
            continue;
        }
        options.host = options.port = null;
        options.path = interceptor.socketPath;
        args[0] = options;
        debug(`Socket connection reset to ${options.path}`);
    }

    return connect.call(this, ...args);
}

/**
 * Check if interceptorTarget matches target
 **/
function match(interceptorTarget, target) {
    if (interceptorTarget === target) {
        return true;
    }
    // user may omit port 80
    if (!interceptorTarget.match(/:\d+$/) && interceptorTarget + ":80" === target) {
        return true;
    }
    return false;
}


module.exports = interceptors;
debug('loaded!');
