/**
 * Copyright (c) 2015-present, goreutils
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

var path = require("path"),
    ecmaScriptTestFileExtensionsRegExp = require(path.resolve(__dirname, "..", "..", "pckg", "ecmaScriptTestFileExtensionsRegExp")),
    fs = require("fs"),
    karma = require("karma"),
    mustache = require("mustache"),
    Promise = require("bluebird"),
    tmp = require("tmp"),
    promisifiedReadFile = Promise.promisify(fs.readFile),
    promisifiedTmpFile = Promise.promisify(tmp.file),
    promisifiedWriteFile = Promise.promisify(fs.writeFile);

function awaitPreprocessorCode(config, pckg) {
    return promisifiedReadFile(path.resolve(__dirname, "..", "..", "..", "karma", "preprocessor.js.mustache"))
        .then(function (preprocessorTemplateBuffer) {
            return preprocessorTemplateBuffer.toString();
        })
        .then(function (preprocessorTemplate) {
            return mustache.render(preprocessorTemplate, {
                "config": config,
                "ecmaScriptTestFileExtensionsRegExp": ecmaScriptTestFileExtensionsRegExp(pckg)
            });
        });
}

module.exports = function (config, pckgPromise) {
    return function () {
        var cleanupCallback,
            initPromises = [
                pckgPromise.then(function (pckg) {
                    return awaitPreprocessorCode(config, pckg);
                }),
                promisifiedTmpFile({
                    "postfix": ".js"
                })
            ];

        return Promise.all(initPromises)
            .spread(function (preprocessorCode, tmpfile) {
                cleanupCallback = tmpfile[2];

                return promisifiedWriteFile(tmpfile[0], preprocessorCode)
                    .then(function () {
                        return tmpfile[0];
                    });
            })
            .then(function (preprocessorPath) {
                return new Promise(function (resolve, reject) {
                    var preprocessors = {};

                    preprocessors[preprocessorPath] = [
                        "sourcemap",
                        "webpack"
                    ];

                    karma.server.start({
                        "browsers": [
                            "PhantomJS"
                        ],
                        "files": [
                            preprocessorPath
                        ],
                        "frameworks": [
                            "mocha"
                        ],
                        "preprocessors": preprocessors,
                        "reporters": [
                            "dots"
                        ],
                        "singleRun": true,
                        "webpack": {
                            "devtool": "inline-source-map",
                            "module": {
                                "loaders": [
                                    {
                                        "loader": "babel-loader",
                                        "test": /\.js$/
                                    }
                                ]
                            }
                        },
                        "webpackServer": {
                            "noInfo": true
                        }
                    }, function (exitCode) {
                        if (0 === exitCode) {
                            resolve();
                        } else {
                            reject(new Error("Karma server has exited with non-zero exit code: " + exitCode));
                        }
                    });
                });
            })
            .finally(function () {
                if (cleanupCallback) {
                    cleanupCallback();
                }
            });
    };
};
