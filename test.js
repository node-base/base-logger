'use strict';

var captureStream = require('capture-stream');
var assert = require('assert');
var Base = require('base');
var option = require('base-option');
var logger = require('./');
var App, app;

describe('base-logger', function() {

  function create() {
    function App(options) {
      if (!(this instanceof App)) {
        return new App(options);
      }
      Base.call(this, null, options);
      this.use(option());
    }
    Base.extend(App);

    return App;
  }

  function capture(stream, fn) {
    var output = null;
    var restore = captureStream(stream);
    try {
      fn();
    } catch (err) {
      output = restore(true);
      throw err;
    } finally {
      if (output == null) {
        output = restore(true);
      }
    }
    return output;
  }

  beforeEach(function() {
    // ensure prototype is fresh for each test
    App = create();
    app = App({logger: true});
    app.use(logger());
  });

  it('should create a new instance', function() {
    app = new App({logger: true});
    assert(app);
    assert.equal(app instanceof App, true);
  });

  it('should create a new instance without using the `new` keyword', function() {
    app = App({logger: true});
    assert(app);
    assert.equal(app instanceof App, true);
  });

  it('should not redefine logger plugin', function() {
    var called = false;
    app.on('plugin', function(name) {
      console.log(arguments);
      if (name === 'base-logger') {
        called = true;
      }
    });

    app.use(logger());
    assert.equal(typeof app.logger, 'function');
    assert.equal(called, false);
  });

  it('should not overwrite an existing method with a logger method', function() {
    App = create();
    app = new App({logger: true});
    app.error = function(str) {
      return 'error: ' + str;
    };
    assert.equal(app.hasOwnProperty('error'), true);
    assert.equal(app.error('bar'), 'error: bar');
    app.use(logger());
    assert.equal(app.hasOwnProperty('error'), true);
    assert.equal(app.error('bar'), 'error: bar');
  });

  it('should throw an error when trying to add a logger for a methods already on the app', function(cb) {
    App = create();
    app = new App({logger: true});
    app.foo = function(str) {
      return 'foo' + str;
    };
    assert.equal(app.hasOwnProperty('foo'), true);
    assert.equal(app.foo('bar'), 'foobar');
    app.use(logger());
    try {
      app.logger.mode('foo');
      cb(new Error('expected an error'));
    } catch (err) {
      assert(err);
      assert.equal(err.message, 'App "base" already has a method "foo". Unable to add logger method "foo".');
      cb();
    }
  });

  it('should have an _emit method', function() {
    assert.equal(typeof app.logger._emit, 'function');
  });

  it('should have an emit method', function() {
    assert.equal(typeof app.logger.emit, 'function');
  });

  it('should have an on method', function() {
    assert.equal(typeof app.logger.on, 'function');
  });

  it('should have a emitter method', function() {
    assert.equal(typeof app.logger.emitter, 'function');
  });

  it('should have a mode method', function() {
    assert.equal(typeof app.logger.mode, 'function');
  });

  it('should have a default app.logger `log` method', function() {
    assert.equal(typeof app.logger.log, 'function');
  });

  it('should add a new app.logger method', function() {
    assert.equal(typeof app.logger.foo, 'undefined');
    app.logger.emitter('foo');
    assert.equal(typeof app.logger.foo, 'function');
  });

  it('should add a new mode method', function() {
    assert.equal(typeof app.logger.bar, 'undefined');
    app.logger.mode('bar');
    assert.equal(typeof app.logger.bar, 'function');
  });

  it('should emit when adding a new app.logger method', function(cb) {
    app.logger.on('emitter', function(name) {
      assert.equal(name, 'foo');
      assert.equal(app.logger.emitterKeys.indexOf('foo') === -1, false);
      cb();
    });
    app.logger.emitter('foo');
  });

  it('should emit when adding a new mode method', function(cb) {
    app.logger.on('mode', function(name) {
      assert.equal(name, 'bar');
      assert.equal(app.logger.modeKeys.indexOf('bar') === -1, false);
      cb();
    });
    app.logger.mode('bar');
  });

  it('should chain mode and app.logger methods', function() {
    assert.equal(typeof app.logger.foo, 'undefined');
    assert.equal(typeof app.logger.bar, 'undefined');
    app.logger.mode('bar');
    assert.equal(typeof app.logger.bar, 'function');
    assert.equal(typeof app.logger.foo, 'undefined');
    app.logger.emitter('foo');
    assert.equal(typeof app.logger.bar, 'function');
    assert.equal(typeof app.logger.foo, 'function');
    assert.equal(typeof app.logger.bar.foo, 'function');
  });

  it('should allow overwritting set methods', function() {
    assert.equal(typeof app.logger.foo, 'undefined');
    app.logger.emitter('foo');
    assert.equal(typeof app.logger.foo, 'function');
    app.logger.foo = function(str) {
      console.error(str);
      return this;
    };
    assert.equal(typeof app.logger.foo, 'function');

    var output = capture(process.stderr, function() {
      app.logger.verbose.foo('foo')
            .not.verbose.foo('bar');
    });
    assert.equal(output, 'foo\nbar\n');
  });

  it('should allow passing a modifier function when creating a app.logger', function() {
    app.logger.emitter('foo', function(msg) {
      return '[LOG]: ' + msg;
    });
    assert.equal(typeof app.logger.foo, 'function');
    assert.equal(app.logger.emitters.foo.fn('foo'), '[LOG]: foo');
  });

  it('should chain modifiers in current stats object when type is modifier', function(cb) {
    app.logger.on('log', function(stats) {
      assert.equal(stats.name, 'log');
      assert.deepEqual(stats.getModes('name'), ['verbose']);
      assert.deepEqual(stats.styles, ['red']);
      assert.deepEqual(stats.args, ['foo']);
      cb();
    });
    app.logger.verbose.red.log('foo');
  });

  it('should allow passing a modifier function when defining a mode', function() {
    app.logger.mode('foo', function(msg) {
      return '[FOO]: ' + msg;
    });
    assert.equal(typeof app.logger.foo, 'function');
    assert.equal(app.logger.modes.foo.fn('foo'), '[FOO]: foo');
  });

  it('should allow calling a mode function directly', function(cb) {
    app.logger.mode('foo');
    assert.equal(typeof app.logger.foo, 'function');
    app.logger.on('log', function(stats) {
      assert.equal(stats.name, 'log');
      assert.deepEqual(stats.getModes('name'), ['foo']);
      assert.deepEqual(stats.styles, []);
      assert.deepEqual(stats.args, ['foo']);
      cb();
    });
    app.logger.foo('foo');
  });

  it('should throw an error when an undefined logger name is given to `_emit`', function(cb) {
    try {
      app.logger._emit('foo', 'bar');
      cb(new Error('expected an error'));
    } catch (err) {
      assert(err);
      assert.equal(err.message, 'Unable to find emitter "foo"');
      cb();
    }
  });

  it('should format arguments', function() {
    assert.equal(app.logger._format('%s', 'foo'), 'foo');
  });

  it('should format empty arguments', function() {
    assert.equal(app.logger._format([]), '');
  });

  it('should format and write to stdout', function() {
    var output = capture(process.stdout, function() {
      app.logger.write('foo');
    });
    assert.equal(output, 'foo');
  });

  it('should format and write empty string to stdout', function() {
    var output = capture(process.stdout, function() {
      app.logger.write('');
    });
    assert.equal(output, '');
  });

  it('should format and writeln to stdout', function() {
    var output = capture(process.stdout, function() {
      app.logger.writeln('foo');
    });
    assert.equal(output, 'foo\n');
  });

  it('should format and writeln empty string to stdout', function() {
    var output = capture(process.stdout, function() {
      app.logger.writeln('');
    });
    assert.equal(output, '\n');
  });

  it('should stylize a message', function() {
    assert.equal(app.logger.stylize('red', 'red message'), '\u001b[31mred message\u001b[39m');
  });

  it('should not stylize a message when style is not found', function() {
    assert.equal(app.logger.stylize('zebra', 'zebra message'), 'zebra message');
  });

  it('should strip colors from a message when strip color is `true`', function() {
    app.logger.options.stripColor = true;
    assert.equal(app.logger.stylize('red', '\u001b[31mred message\u001b[39m'), 'red message');
  });

  it('should add a separator in string', function() {
    var output = capture(process.stdout, function() {
      app.logger.writeln('%s %s %s', 'before', app.logger.sep(), 'after');
    });
    assert.equal(output, 'before \u001b[90m · \u001b[39m after\n');
  });

  it('should add a custom separator in string', function() {
    var output = capture(process.stdout, function() {
      app.logger.writeln('%s %s %s', 'before', app.logger.sep(' - '), 'after');
    });
    assert.equal(output, 'before \u001b[90m - \u001b[39m after\n');
  });

  it('should handle a stats object and write formatted output', function() {
    var output = capture(process.stdout, function() {
      app.logger.info('info message');
    });
    assert.equal(output, '\u001b[36minfo message\u001b[39m\n');
  });

  it('should handle multiple stats objects with different modes', function() {
    var output = capture(process.stdout, function() {
      app.logger.info('info message')
        .verbose.error('error message')
        .not.verbose.warn('warn message');
    });
    assert.equal(output, '\u001b[36minfo message\u001b[39m\n');
  });

  it('should handle multiple stats objects with different modes when verbose is `true`', function() {
    var output = capture(process.stdout, function() {
      app.logger.options.verbose = true;
      app.logger.info('info message')
        .verbose.error('error message')
        .not.verbose.warn('warn message');
    });
    assert.equal(output, '\u001b[36minfo message\u001b[39m\n\u001b[31merror message\u001b[39m\n');
  });

  it('should handle multiple stats objects with different modes when verbose is `false`', function() {
    var output = capture(process.stdout, function() {
      app.logger.options.verbose = false;
      app.logger.info('info message')
        .verbose.error('error message')
        .not.verbose.warn('warn message');
    });
    assert.equal(output, '\u001b[36minfo message\u001b[39m\n\u001b[33mwarn message\u001b[39m\n');
  });

  it('should handle default styles from styles plugin', function() {
    var time = new Date().toLocaleTimeString();
    var output = capture(process.stdout, function() {
      app.logger.log('log message');
      app.logger.subhead('subhead message');
      app.logger.writeln(app.logger.time('time message'));
      app.logger.writeln(app.logger.timestamp('timestamp message'));
      app.logger.inform('inform message');
      app.logger.info('info message');
      app.logger.warn('warn message');
      app.logger.error('error message');
      app.logger.success('success message');
    });
    assert.equal(output, [
      '\u001b[37mlog message\u001b[39m',
      '\u001b[1msubhead message\u001b[22m',
      '\u001b[40m\u001b[37m' + time + '\u001b[39m\u001b[49m ',
      '\u001b[40m\u001b[37m' + time + '\u001b[39m\u001b[49m \u001b[90mtimestamp message\u001b[39m',
      '\u001b[90minform message\u001b[39m',
      '\u001b[36minfo message\u001b[39m',
      '\u001b[33mwarn message\u001b[39m',
      '\u001b[31merror message\u001b[39m',
      '\u001b[32msuccess message\u001b[39m',
      ''
    ].join('\n'));
  });

  it('should disable the default listener', function() {
    app = new App({logger: true});
    app.use(logger({defaultListener: false}));
    var output = capture(process.stdout, function() {
      app.logger.error('nothing');
    });
    assert.equal(output, '');
  });

  it('should not add the logger when `options.logger` is disabled', function() {
    app = new App();
    app.use(logger());
    assert.equal(typeof app.logger, 'undefined');
  });

  it('should be able to log a message directly with the `logger` property', function() {
    var output = capture(process.stdout, function() {
      app.logger('message');
    });
    assert.equal(output, '\u001b[37mmessage\u001b[39m\n');
  });

  it('should be able to use logger methods directly on the app to log a message', function() {
    var output = capture(process.stdout, function() {
      app.info('info message');
    });
    assert.equal(output, '\u001b[36minfo message\u001b[39m\n');
  });
});
