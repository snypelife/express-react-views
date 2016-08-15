/*
 *  Copyright (c) 2014, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

var path = require('path');
var React = require('react');
var ReactDOMServer = require('react-dom/server');
var beautifyHTML = require('js-beautify').html;
var assign = require('object-assign');
var _escaperegexp = require('lodash.escaperegexp');

var DEFAULT_OPTIONS = {
  doctype: '<!DOCTYPE html>',
  beautify: false,
  transformViews: true,
  babel: {
    presets: [
      'react',
      'es2015',
    ],
  },
  root: 'default'
};

function omit(source, filterList) {
  return Object.keys(source).reduce(function (prev, curr) {
    if (filterList.indexOf(curr) !== -1) {
      prev[curr] = source[curr];
    }
    return prev;
  }, {});
}

function createEngine(engineOptions) {
  var registered = false;
  var moduleDetectRegEx;

  engineOptions = assign({}, DEFAULT_OPTIONS, engineOptions || {});

  function renderFile(filename, options, cb) {
    var settings = options.settings;
    var rootPath = path.join(settings.views, engineOptions.root + '.jsx');
    // Defer babel registration until the first request so we can grab the view path.
    if (!moduleDetectRegEx) {
      // Path could contain regexp characters so escape it first.
      moduleDetectRegEx = new RegExp('^' + _escaperegexp(settings.views));
    }
    if (engineOptions.transformViews && !registered) {
      // Passing a RegExp to Babel results in an issue on Windows so we'll just
      // pass the view path.
      require('babel-register')(
        assign({only: settings.views}, engineOptions.babel)
      );
      registered = true;
    }

    try {
      if (filename === rootPath) {
        throw new Error('Error:: Don\'t try to render the root view directly!');
      }
      var props = omit(options, ['settings', '_locals', 'cache']);
      var Root = require(rootPath);
      var markup = engineOptions.doctype;
      var component = require(filename);
      // Transpiled ES6 may export components as { default: Component }
      Root = Root.default || Root;
      props.View = component.default || component;
      markup += ReactDOMServer.renderToStaticMarkup(
        React.createElement(Root, props)
      );
    } catch (e) {
      return cb(e);
    } finally {
      if (['development', 'local'].includes(settings.env)) {
        // Remove all files from the module cache that are in the view folder.
        Object.keys(require.cache).forEach(function(module) {
          if (moduleDetectRegEx.test(require.cache[module].filename)) {
            delete require.cache[module];
          }
        });
      }
    }

    if (engineOptions.beautify) {
      // NOTE: This will screw up some things where whitespace is important, and be
      // subtly different than prod.
      markup = beautifyHTML(markup);
    }

    cb(null, markup);
  }

  return renderFile;
}

exports.createEngine = createEngine;
