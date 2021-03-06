# base-logger [![NPM version](https://img.shields.io/npm/v/base-logger.svg)](https://www.npmjs.com/package/base-logger) [![Build Status](https://img.shields.io/travis/node-base/base-logger.svg)](https://travis-ci.org/node-base/base-logger)

> Add a verbalize logger to your base application.

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm install base-logger --save
```

## Usage

Add `base-logger` to an app.

> App inherited from [base](https://github.com/node-base/base) an uses [base-option](https://github.com/node-base/base-option)

```js
var App = require('my-app');
var logger = require('base-logger');
```

> create a new `app` instance setting the `logger` option to `true`

```js
var app = new App();
app.option('logger', true);
```

> add the [base-logger](https://github.com/node-base/base-logger) plugin.

```js
app.use(logger());
```

`.logger` is now an instance of [verbalize](https://github.com/jonschlinkert/verbalize) on `app`.
All built in emitter, style, and mode methods are also exposed on
`app` directly.

```js
// always log this info message
app.info('this is an information message');
// only log this message when app.options.verbose is true
app.verbose.info('this is a verbose information message');
// only log this message when app.options.verbose is false
app.not.verbose.info('this is a not.verbose information message');
```

Add new logger methods through the `.logger`

```js
app.logger.emitter('status');
app.status('status message');
//=> "status message"
```

Logger methods may pass in a modifier function to stylize the output.

```js
app.logger.emitter('status', function() {
  return this.yellow(...arguments);
});
app.status('status message');
//=> "status message" <= will be yellow in the console
```

## API

### [logger](index.js#L33)

Add [verbalize](https://github.com/jonschlinkert/verbalize) instance to app as `.logger`. Adds logger and mode methods to the `app` directly for easy logging. Sets up a default listener to handle log events and write messages to `process.stdout`

Pass `options.defaultListener = false` to disable the default listener.

**Params**

* `options` **{Objects}**: Options used when creating the logger.
* `returns` **{Function}**: plugin function to pass to `app.use`

**Example**

```js
var options {
  defaultListener: true
};

app.use(logger(options));
app.verbose.info('info message');
```

## Related projects

* [base](https://www.npmjs.com/package/base): base is the foundation for creating modular, unit testable and highly pluggable node.js applications, starting… [more](https://www.npmjs.com/package/base) | [homepage](https://github.com/node-base/base)
* [base-option](https://www.npmjs.com/package/base-option): Adds a few options methods to base, like `option`, `enable` and `disable`. See the readme… [more](https://www.npmjs.com/package/base-option) | [homepage](https://github.com/node-base/base-option)
* [log-events](https://www.npmjs.com/package/log-events): Create custom, chainable logging methods that emit log events when called. | [homepage](https://github.com/doowb/log-events)
* [verbalize](https://www.npmjs.com/package/verbalize): A pluggable logging utility with built-in colors, styles, and modes. | [homepage](https://github.com/jonschlinkert/verbalize)

## Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/doowb/base-logger/issues/new).

## Building docs

Generate readme and API documentation with [verb](https://github.com/verbose/verb):

```sh
$ npm install verb && npm run docs
```

Or, if [verb](https://github.com/verbose/verb) is installed globally:

```sh
$ verb
```

## Running tests

Install dev dependencies:

```sh
$ npm install -d && npm test
```

## Author

**Brian Woodward**

* [github/doowb](https://github.com/doowb)
* [twitter/doowb](http://twitter.com/doowb)

## License

Copyright © 2016 [Brian Woodward](https://github.com/doowb)
Released under the [MIT license](https://github.com/node-base/base-logger/blob/master/LICENSE).

***

_This file was generated by [verb](https://github.com/verbose/verb), v0.9.0, on March 07, 2016._