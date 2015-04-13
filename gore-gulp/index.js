/**
 * Copyright (c) 2015-present, goreutils
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

var path = require("path"),
    FS = require("q-io/fs"),
    lint = require(path.join(__dirname, "/lint")),
    test = require(path.join(__dirname, "/test")),
    webpack = require(path.join(__dirname, "/webpack"));

function setup(options, pckgPromise, gulp, self) {
    var defaultWebpackVariant;

    if ("production" === process.env.NODE_ENV) {
        defaultWebpackVariant = "webpack.full";
    } else {
        defaultWebpackVariant = "webpack.quick";
    }

    gulp.task("default", [
        "test"
    ]);
    gulp.task("lint", self.lint(gulp));
    gulp.task("test", [
        "lint"
    ], self.test(gulp));
    gulp.task("webpack", [
      defaultWebpackVariant
    ]);
    gulp.task("webpack.full", self.webpack.full());
    gulp.task("webpack.quick", self.webpack.quick());
}

function setupTask(baseDir, pckgPromise, task) {
    return function (gulp, override) {
        if (override) {
            pckgPromise = pckgPromise.then(override);
        }

        return task(baseDir, pckgPromise, gulp);
    };
}

module.exports = function (baseDir) {
    var pckgPromise;

    pckgPromise = FS.read(path.resolve(baseDir, "package.json"))
        .then(function (pckgContents) {
            return JSON.parse(pckgContents);
        });

    return {
        "lint": setupTask(baseDir, pckgPromise, lint),
        "setup": function (gulp) {
            return setup(baseDir, pckgPromise, gulp, this);
        },
        "test": setupTask(baseDir, pckgPromise, test),
        "webpack": {
            "full": setupTask(baseDir, pckgPromise, webpack.full),
            "quick": setupTask(baseDir, pckgPromise, webpack.quick)
        }
    };
};

module.exports.lint = lint;
module.exports.test = test;
module.exports.webpack = webpack;
