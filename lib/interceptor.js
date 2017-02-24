/**
 * @file An interceptor for connections via Net in node native lib.
 *       This module is supposed to be used in case of tests or developments
 *       to simulate a backend service or whatever the like.
 *       Since this module CHANGES the native node module 'net.Socket', be cautious
 *       using it in production environments.
 * @author  Sun Haohao
 **/
'use strict';

const assert        = require('assert');
const debug         = require('debug')('net-interceptor.interceptors');
const del           = require('del');
const net           = require('net');
const path          = require('path');
const randomize     = require('randomatic');

const CONSTS        = require('./constants');
const interceptors  = require('./interceptors');

debug('loading ...');

/**
 * Initialize interceptor servers
 **/
const socketPaths = new Set();

/**
 * Define class Intercepter
 **/
class Interceptor {
    constructor(target, port, server) {
        debug('intializing a new interceptor ...');
        if (port instanceof net.Server) {
            server = port;
            port = null;
        }
        if (port && (port = Number.parseInt(port, 10)) && isPort(port)) {
            target = `${target}:${port}`;
        }
        if (server instanceof net.Server) {
            this.server = server;
        }
        this._desc = target;
        this._target = path.normalize(target);
        if (!path.isAbsolute(this._target)) {
            this._target = path.join(CONSTS.ROOT, this._target);
        }
        debug(`interceptor target is ${this._target}`);
    }

    /**
     * Starts to intercept connetions for the target
     * All connections would be transferred to the server
     * on the interceptor
     **/
    start() {
        debug(`starts to intercept connections for ${this._desc}`);
        assert(!interceptors.has(this._target), `Can not intercept on ${this._desc} twice`);
        interceptors.set(this._target, this);

        let socketPath = randomize('Aa0', 10);
        while (socketPaths.has(socketPath)) {
            socketPath = randomize('Aa0', 10);
        }
        socketPaths.add(socketPath);
        this._socketPath = path.join(CONSTS.SOCK_DIR, `${socketPath}.sock`);

        debug(`starts to listen on ${this._socketPath}`);
        assert(this._server instanceof net.Server, 'Invalid net server');
        this._server.on('close', () => {
            del(this._socketPath);
            socketPaths.delete(this._socketPath);
            interceptors.delete(this._target);
            debug(`listening on ${this._socketPath} closed`);
        });
        this._server.unref();

        return new Promise((resolve, reject) => {
            this._server.listen(this._socketPath, resolve);
        });
    }

    /**
     * stop the interceptor
     **/
    stop() {
        assert(this._server instanceof net.Server, 'Invalid net server!');
        return new Promise((resolve, reject) => {
            this._server.close((error) => {
                if (error) return reject(error);
                return resolve();
            });
        });
    }

    /**
     * get the target path to interceptor
     **/
    get target() {
        return this._target;
    }

    /**
     * get the path of sock file
     **/
    get socketPath() {
        return this._socketPath;
    }

    /**
     * set a server to handle connections intercepted
     **/
    set server(server) {
        assert(server instanceof net.Server, 'Invalid net server!');
        this._server = server;
        return this;
    }

    /**
     * get the server
     **/
    get server() {
        return this._server;
    }
}

/**
 * Test if port is a port
 **/
function isPort(port) {
    const MIN_PORT = 1;
    const MAX_PORT = 65535;
    return Number.isInteger(port) && port >= MIN_PORT && port <= MAX_PORT;
}

module.exports = Interceptor;
debug('loaded!');
