var localforage = require('localforage');
var channel     = require('./channel');

var SUPPORTS_INDEXEDDB = localforage.supports(localforage.INDEXEDDB);
var nextHandlerKey = 0;
var handlers = {};

function isNotUndefined(x) {
    return typeof x !== 'undefined';
}

function request(method, argA, argB, callback) {
    var args, data, promise, iteratorCallback;

    args = [argA, argB].filter(isNotUndefined);

    if (SUPPORTS_INDEXEDDB) {
        args = args.concat(callback);

        return localforage[method](args[0], args[1], args[2]);
    }

    data = {
        method: method,
        args: args,
        handlerKey: nextHandlerKey++
    };

    if (data.method === 'iterate') {
        iteratorCallback = data.args[0];
        data.args.length = 0;
    }

    promise = new Promise(function (resolve, reject) {

        handlers[data.handlerKey] = {
            resolve: resolve,
            reject: reject,
            iteratorCallback: iteratorCallback
        };

    });

    if (typeof callback === 'function') {
        promise.then(function (result) {

            callback(null, result);

        }, function (error) {

            callback(error);

        });
    }

    channel.postMessageToMain({
        type: 'REQUEST',
        data: data
    });

    return promise;
}

function onRequest(data) {

    if (data.method === 'iterate') {

        data.args = [function (value, key, iterationNumber) {
            channel.postMessageToWorker({
                type: 'RESPONSE',
                data: {
                    handlerKey: data.handlerKey,
                    iteration: {
                        value: value,
                        key: key,
                        iterationNumber: iterationNumber
                    }
                }
            });
        }];

    }

    localforage[data.method](data.args[0], data.args[1])
    .then(function (result) {

        channel.postMessageToWorker({
            type: 'RESPONSE',
            data: {
                handlerKey: data.handlerKey,
                result: result
            }
        });

    }, function (error) {

        channel.postMessageToWorker({
            type: 'RESPONSE',
            data: {
                handlerKey: data.handlerKey,
                error: error.toString()
            }
        });

    });
}

function onResponse(data) {
    var handler = handlers[data.handlerKey];

    if (handler == null) {
        return;
    }

    if (data.error) {
        return handler.reject(data.error);
    }

    if (data.iteration) {
        return handler.iteratorCallback(
            data.iteration.key,
            data.iteration.value,
            data.iteration.iterationNumber
        );
    }

    handler.resolve(data.result);
}

channel.on('REQUEST',  onRequest);
channel.on('RESPONSE', onResponse);

module.exports = {
    clear:      request.bind(null, 'clear',      undefined, undefined), // callback
    getItem:    request.bind(null, 'getItem',    undefined           ), // key, callback
    iterate:    request.bind(null, 'iterate',    undefined           ), // iteratorCallback, callback
    key:        request.bind(null, 'key',        undefined           ), // keyIndex
    keys:       request.bind(null, 'keys',       undefined, undefined), // callback
    removeItem: request.bind(null, 'removeItem', undefined           ), // keyIndex, callback
    setItem:    request.bind(null, 'setItem'                         )  // key, value, callback
};

Object.defineProperty(module.exports, 'length', {
    enumerable: true,
    value:      request.bind(null, 'length',     undefined, undefined)  // callback
});
