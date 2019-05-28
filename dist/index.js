"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var child_process = require("child_process");
var fs_watch = require("node-watch");
var scriptLib = require("scripting-tools");
var fs = require("fs");
var externalHook = require("./externalHook");
var module_dir_path = path.join(__dirname, "..");
function find_module_path(module_name) {
    var host_module_dir_path = path.join(module_dir_path, "..", "..");
    var dir_path = host_module_dir_path;
    while (true) {
        try {
            return scriptLib.find_module_path(module_name, dir_path);
        }
        catch (_a) { }
        var parent_dir_path = path.join(dir_path, "..");
        if (dir_path === parent_dir_path) {
            break;
        }
        dir_path = parent_dir_path;
    }
    throw new Error("Can't locate " + module_name);
}
var fork = function (modulePath, args, options) {
    return new Promise(function (resolve, reject) {
        var childProcess = child_process.fork(modulePath, args, options);
        var onExit = function () { return childProcess.kill(); };
        process.once("exit", onExit);
        childProcess.once("exit", function (code) {
            process.removeListener("exit", onExit);
            if (code === 0) {
                resolve(0);
            }
            else {
                reject(new Error("exited with " + code));
            }
        });
    });
};
function tsc(tsconfig_path, watch) {
    return __awaiter(this, void 0, void 0, function () {
        var args, pr;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!!watch) return [3 /*break*/, 2];
                    return [4 /*yield*/, tsc(tsconfig_path)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    console.log("tsc -p " + path.basename(path.dirname(tsconfig_path)));
                    _a.label = 3;
                case 3:
                    args = ["-p", tsconfig_path];
                    if (!!watch) {
                        args.push("-w");
                    }
                    pr = fork(path.join(find_module_path("typescript"), "bin", "tsc"), args, {
                        "cwd": path.join(path.dirname(tsconfig_path), (function () {
                            var tsconfig_extends = require(tsconfig_path).extends;
                            return tsconfig_extends !== undefined ? path.dirname(tsconfig_extends) : ".";
                        })())
                    });
                    if (!watch) {
                        return [2 /*return*/, pr];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.tsc = tsc;
/** If lessify is required it must be in the page dev-dependencies.*/
function browserify(entry_point_file_path, dst_file_path, watch) {
    return __awaiter(this, void 0, void 0, function () {
        var pr;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!!watch) return [3 /*break*/, 2];
                    return [4 /*yield*/, browserify(entry_point_file_path, dst_file_path)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    console.log(entry_point_file_path + " -> browserify -> " + dst_file_path);
                    _a.label = 3;
                case 3:
                    dst_file_path = path.resolve(dst_file_path);
                    pr = fork(path.join(find_module_path(!!watch ? "watchify" : "browserify"), "bin", "cmd"), [
                        "-e", path.resolve(entry_point_file_path),
                        "-t", "html2js-browserify",
                        "-t", "lessify",
                        "-t", "brfs",
                        "-o", dst_file_path
                    ], { "cwd": module_dir_path });
                    if (!!watch) return [3 /*break*/, 5];
                    return [4 /*yield*/, pr];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5: return [4 /*yield*/, browserify.setExternalHook(dst_file_path, watch)];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.browserify = browserify;
(function (browserify) {
    function setExternalHook(file_path, watch) {
        return __awaiter(this, void 0, void 0, function () {
            var run, pr;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!!watch) return [3 /*break*/, 2];
                        return [4 /*yield*/, setExternalHook(file_path)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        run = function () { return fs.writeFileSync(file_path, Buffer.from([
                            externalHook.sourceToPrepend,
                            fs.readFileSync(file_path).toString("utf8")
                        ].join("\n"), "utf8")); };
                        if (!!watch) {
                            fs_watch(file_path, function () { return run(); });
                        }
                        pr = run();
                        if (!watch) {
                            return [2 /*return*/, pr];
                        }
                        return [2 /*return*/];
                }
            });
        });
    }
    browserify.setExternalHook = setExternalHook;
})(browserify = exports.browserify || (exports.browserify = {}));
function minify(file_path, watch) {
    return __awaiter(this, void 0, void 0, function () {
        var run, pr;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!!watch) return [3 /*break*/, 2];
                    return [4 /*yield*/, minify(file_path)];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    run = function () {
                        var minified_file_path = path.join(path.dirname(file_path), path.basename(file_path, ".js") + ".min.js");
                        console.log(file_path + " -> minify -> " + minified_file_path);
                        fork(path.join(find_module_path("uglify-js"), "bin", "uglifyjs"), [
                            file_path,
                            "-o",
                            minified_file_path
                        ]);
                    };
                    if (!!watch) {
                        fs_watch(file_path, function () { return run(); });
                    }
                    pr = run();
                    if (!watch) {
                        return [2 /*return*/, pr];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.minify = minify;
function buildTestHtmlPage(bundled_file_path, watch) {
    var run = function () {
        var html_file_path = path.join(path.dirname(bundled_file_path), path.basename(bundled_file_path, ".js") + ".html");
        console.log("Building page " + html_file_path);
        var basename = path.basename(bundled_file_path);
        fs.writeFileSync(html_file_path, Buffer.from([
            "<!DOCTYPE html>",
            "<html lang=\"en\">",
            "",
            "<head>",
            "    <meta charset=\"utf-8\">",
            "    <title>Test " + basename + "</title>",
            "",
            "    <script src=\"./" + basename + "\"></script>",
            "    <script>",
            "",
            "        document.addEventListener(\"DOMContentLoaded\", function (event) {",
            "",
            "            var start = Date.now();",
            "            var interval = 100;",
            "            var last = start;",
            "",
            "            setInterval(function () {",
            "",
            "                var now = Date.now();",
            "                var elapsed = now - last;",
            "",
            "                if (elapsed > interval + 35) {",
            "                    console.log(\"UI tread blocked for ~\" + (elapsed - interval).toString() + \"ms\");",
            "                }",
            "",
            "                last += elapsed;",
            "",
            "            }, interval);",
            "",
            "        });",
            "",
            "    </script>",
            "</head>",
            "",
            "<body>",
            "    <h4>Running " + bundled_file_path + " (CTRL + MAJ + i)</h4>",
            "</body>",
            "",
            "</html>",
        ].join("\n"), "utf8"));
    };
    if (!!watch) {
        fs_watch(bundled_file_path, function () { return run(); });
    }
    run();
}
exports.buildTestHtmlPage = buildTestHtmlPage;
function tsc_browserify_minify(tsconfig_path, entry_point_file_path, out_file_path, watch) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, tsc(tsconfig_path, watch)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, browserify(entry_point_file_path, out_file_path, watch)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, minify(out_file_path, watch)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.tsc_browserify_minify = tsc_browserify_minify;
