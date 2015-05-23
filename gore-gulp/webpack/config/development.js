/**
 * Copyright (c) 2015-present, goreutils
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

var _ = require("lodash");

function development(config) {
    return _.merge(config, {
        "debug": true,
        "devtool": "cheap-source-map"
    });
}

module.exports = development;