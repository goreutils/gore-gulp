/**
 * Copyright (c) 2015-present, goreutils
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const ava = require('lookly-preset-ava');
const getCliOptions = require('../getCliOptions');

module.exports = function (config, pckg) {
  const options = getCliOptions(config, pckg, process.argv.slice(2));

  return ava(options.glob);
};
