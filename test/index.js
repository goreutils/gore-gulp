/**
 * Copyright (c) 2015-present, goreutils
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const mocha = require('lookly-preset-mocha');

module.exports = function mochaPlugin(config) {
  return mocha(config.glob, {
    silent: config.silent,
  });
};
