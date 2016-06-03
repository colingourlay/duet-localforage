# duet-localforage

Use [localForage](https://github.com/mozilla/localForage) with [duet](https://github.com/colingourlay/duet) by selectively reading and writing asynchronously across threads when IndexedDB is not available to the worker, otherwise use it directly.

```
$ npm install duet-localforage
```

## Usage

```javascript
var duet        = require('duet');
var channel     = require('duet-localforage/channel');
var localforage = require('duet-localforage');
var logger      = console.log.bind(console);

duet([channel], function () {

    /* A: Promises */

    localforage.clear().then(logger);
    // >
    localforage.length().then(logger);
    // > 0
    localforage.setItem('foo', 'bar').then(logger);
    // > 'bar'
    localforage.key(0).then(logger);
    // > 'foo'
    localforage.keys().then(logger);
    // > ['foo']
    localforage.getItem('foo').then(logger);
    // > 'bar'
    localforage.iterator(logger).then(logger);
    // > 'bar', 'foo', 1
    // >
    localforage.removeItem('foo').then(logger);
    // >

    /* B: Callbacks */

    localforage.clear(logger);
    // > null
    localforage.length(logger);
    // > null, 0
    localforage.setItem('foo', 'bar', logger);
    // > null, 'bar'
    localforage.key(0, logger);
    // > null, 'foo'
    localforage.keys(logger);
    // > null, ['foo']
    localforage.getItem('foo', logger);
    // > null, 'bar'
    localforage.iterator(logger, logger);
    // > 'bar', 'foo', 1
    // > null
    localforage.removeItem('foo', logger);
    // > null
});
```

## API

Everything is as you would expect on the localForage's callback and Promise-based async APIs.

## Supported types

`duet-localforage` can safely store the following types of data:

* All† primitives
* `Object`
* `Boolean` object
* `String` object
* `Blob`
* `Array`
* `ArrayBuffer`
* `Int8Array`
* `Uint8Array`
* `Uint8ClampedArray`
* `Int16Array`
* `Uint16Array`
* `Int32Array`
* `Uint32Array`
* `Float32Array`
* `Float64Array`

This list is the intersection of the types that localForage [can normally store](http://mozilla.github.io/localForage/#data-api-setitem), and the types that can be sent between workers as [structured clones](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm).

† Note about primitives: `Symbol` isn't supported. `undefined` will be stored and retrieved as `null`.
