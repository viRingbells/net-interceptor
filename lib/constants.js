/**
 * @file provides constants
 **/
const debug       = require('debug')('net-interceptor.constants');
const del         = require('del');
const mkdirp      = require('mkdirp');
const path        = require('path');


/**
 * Initialize constants
 **/
debug('loading ...');

const ROOT      = path.dirname(process.mainModule.filename);
const WORK_DIR  = path.join(ROOT, '.net-intercepter');
const SOCK_DIR  = path.join(WORK_DIR, 'socks');

/**
 * Initialize envrioments
 **/
debug('creating enviroments ...');
del.sync(WORK_DIR);
mkdirp.sync(WORK_DIR);
mkdirp.sync(SOCK_DIR);

process.on('exit', () => {
    debug('process exiting, clearing environments ...');
    del.sync(WORK_DIR);
});

module.exports = { ROOT, WORK_DIR, SOCK_DIR };
debug('loaded!');
