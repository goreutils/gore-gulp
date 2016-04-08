/**
 * Copyright (c) 2015-present, goreutils
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

const deprecate = require("deprecate");
const fs = require("fs");
const identity = require("lodash/identity");
const isEmpty = require("lodash/isEmpty");
const lint = require("./plugin/lint");
const merge = require("lodash/merge");
const noop = require("lodash/noop");
const path = require("path");
const pckg = require("../package.json");
const Promise = require("bluebird");
const test = require("./plugin/test");
const webpack = require("./plugin/webpack");

function setup(options, pckgPromise, plugins, gulp) {
    for (let name in plugins) {
        if (plugins.hasOwnProperty(name)) {
            gulp.task(name, plugins[name].dependencies, plugins[name].task(gulp));
        }
    }

    gulp.task("webpack.full", [
        "webpack.production"
    ], function () {
        deprecate(pckg.name + " - webpack.full task is deprecated, please use webpack.production instead");
    });
    gulp.task("webpack.quick", [
        "webpack.development"
    ], function () {
        deprecate(pckg.name + " - webpack.quick task is deprecated, please use webpack.development instead");
    });
}

function setupDependencies(config, dependencies) {
    if (!isEmpty(config.dependencies)) {
        return config.dependencies.concat(dependencies);
    }

    return dependencies;
}

function setupTask(config, pckgPromise, factory) {
    return function (gulp, override) {
        if (override) {
            pckgPromise = pckgPromise.then(override);
        }

        return factory(config, pckgPromise, gulp);
    };
}

module.exports = function (config) {
    const plugins = {};
    var ret;

    if ("string" === typeof config) {
        config = {
            "baseDir": config
        };
    }

    config = merge({
        "dependencies": [],
        "override": identity
    }, config);

    const pckgPromise = Promise.fromNode(function (cb) {
        fs.readFile(path.resolve(config.baseDir, "package.json"), cb);
    }).then(function (pckgContents) {
        return JSON.parse(pckgContents);
    }).then(config.override);

    function plugin(definition) {
        plugins[definition.name] = {
            "dependencies": setupDependencies(config, definition.dependencies),
            "task": setupTask(config, pckgPromise, definition.factory)
        };

        return ret;
    }

    ret = {
        "plugin": plugin,
        "plugins": plugins,
        "setup": function (gulp) {
            return setup(config, pckgPromise, plugins, gulp);
        }
    };

    plugin({
        "dependencies": [],
        "factory": lint,
        "name": "lint"
    });
    plugin({
        "dependencies": [
            "lint"
        ],
        "factory": test,
        "name": "test"
    });
    plugin({
        "dependencies": [
            "test"
        ],
        "factory": webpack.development,
        "name": "webpack.development"
    });
    plugin({
        "dependencies": [
            "test"
        ],
        "factory": webpack.production,
        "name": "webpack.production"
    });

    if ("production" === process.env.NODE_ENV) {
        plugin({
            "dependencies": [
                "webpack.production"
            ],
            "factory": noop,
            "name": "webpack"
        });
    } else {
        plugin({
            "dependencies": [
                "webpack.development"
            ],
            "factory": noop,
            "name": "webpack"
        });
    }

    plugin({
        "dependencies": [
            "webpack"
        ],
        "factory": noop,
        "name": "build"
    });

    plugin({
        "dependencies": [
            "webpack"
        ],
        "factory": noop,
        "name": "default"
    });

    plugin({
        "dependencies": [
            "webpack.production"
        ],
        "factory": noop,
        "name": "heroku:production"
    });

    return ret;
};
