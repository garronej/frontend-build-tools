"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const child_process = require("child_process");
const fs_watch = require("node-watch");
const scriptLib = require("scripting-tools");
const fs = require("fs");
const crypto = require("crypto");
const module_dir_path = path.join(__dirname, "..");
function find_module_path(module_name, module_dir_path) {
    let dir_path = module_dir_path;
    while (true) {
        try {
            return scriptLib.find_module_path(module_name, dir_path);
        }
        catch (_a) { }
        const parent_dir_path = path.join(dir_path, "..");
        if (dir_path === parent_dir_path) {
            break;
        }
        dir_path = parent_dir_path;
    }
    throw new Error(`Can't locate ${module_name}`);
}
exports.prepareForWatching = (() => {
    let isStarted = false;
    return () => {
        if (isStarted) {
            return;
        }
        isStarted = true;
        process.setMaxListeners(70);
        process.once("unhandledRejection", error => { throw error; });
        console.log("Enter exit for graceful termination");
        Object.defineProperty(require("repl").start({
            "terminal": true,
            "prompt": "> "
        }).context, "exit", { "get": () => process.exit(0) });
    };
})();
const fork = (modulePath, args, options, onStdoutData) => new Promise((resolve, reject) => {
    if (!!onStdoutData) {
        options = Object.assign({}, (options || {}), { "silent": true });
    }
    const childProcess = child_process.fork(modulePath, args, options);
    if (!!onStdoutData) {
        childProcess.stdout.on("data", (data) => onStdoutData(data));
    }
    const onExit = () => childProcess.kill();
    process.once("exit", onExit);
    childProcess.once("exit", code => {
        process.removeListener("exit", onExit);
        if (code === 0) {
            resolve(0);
        }
        else {
            reject(new Error(`exited with ${code}`));
        }
    });
});
function tsc(tsconfig_path, watch) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!!watch) {
            exports.prepareForWatching();
            yield tsc(tsconfig_path);
        }
        else {
            console.log(`tsc -p ${path.basename(path.dirname(tsconfig_path))}`);
        }
        const args = ["-p", tsconfig_path];
        if (!!watch) {
            args.push("-w");
        }
        const target_module_dir_path = path.join(path.dirname(tsconfig_path), (() => {
            const { extends: tsconfig_extends } = require(tsconfig_path);
            return tsconfig_extends !== undefined ? path.dirname(tsconfig_extends) : ".";
        })());
        const pr = fork(path.join(find_module_path("typescript", target_module_dir_path), "bin", "tsc"), args, {
            "cwd": target_module_dir_path
        });
        if (!watch) {
            return pr;
        }
    });
}
exports.tsc = tsc;
/** If lessify is required it must be in the page dev-dependencies.*/
function browserify(entry_point_file_path, dst_file_path, extra_args = [], watch) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!!watch) {
            exports.prepareForWatching();
            yield browserify(entry_point_file_path, dst_file_path);
        }
        else {
            console.log(`${entry_point_file_path} -> browserify -> ${dst_file_path}`);
        }
        dst_file_path = path.resolve(dst_file_path);
        const pr = fork(path.join(find_module_path(!!watch ? "watchify" : "browserify", module_dir_path), "bin", "cmd"), [
            ...extra_args,
            "-e", path.resolve(entry_point_file_path),
            "-t", "html2js-browserify",
            "-t", "lessify",
            "-t", "brfs",
            "-o", dst_file_path
        ], { "cwd": module_dir_path });
        if (!watch) {
            return pr;
        }
    });
}
exports.browserify = browserify;
function minify(file_path, watch) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!!watch) {
            exports.prepareForWatching();
            yield minify(file_path);
        }
        const run = () => {
            const minified_file_path = path.join(path.dirname(file_path), `${path.basename(file_path, ".js")}.min.js`);
            console.log(`${file_path} -> minify -> ${minified_file_path}`);
            fork(path.join(find_module_path("uglify-js", module_dir_path), "bin", "uglifyjs"), [
                file_path,
                "-o",
                minified_file_path
            ]);
        };
        if (!!watch) {
            fs_watch(file_path, () => run());
        }
        const pr = run();
        if (!watch) {
            return pr;
        }
    });
}
exports.minify = minify;
function brfs(file_path, watch) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!!watch) {
            exports.prepareForWatching();
            yield brfs(file_path);
        }
        const run = () => __awaiter(this, void 0, void 0, function* () {
            if (brfs.computeDigest(fs.readFileSync(file_path)) === brfs.digest) {
                return;
            }
            console.log(`${file_path} -> brfs -> self`);
            const outFileData = yield (() => __awaiter(this, void 0, void 0, function* () {
                let str = "";
                yield fork(path.join(find_module_path("brfs", module_dir_path), "bin", "cmd.js"), [file_path], undefined, data => str += data.toString("utf8"));
                return Buffer.from(str, "utf8");
            }))();
            brfs.digest = brfs.computeDigest(outFileData);
            fs.writeFileSync(file_path, outFileData);
        });
        if (!!watch) {
            fs_watch(file_path, () => run());
        }
        const pr = run();
        if (!watch) {
            return pr;
        }
    });
}
exports.brfs = brfs;
(function (brfs) {
    brfs.computeDigest = buffer => crypto
        .createHash("md5")
        .update(buffer)
        .digest("hex");
    brfs.digest = "";
})(brfs = exports.brfs || (exports.brfs = {}));
function buildTestHtmlPage(bundled_file_path, watch) {
    const run = () => {
        const html_file_path = path.join(path.dirname(bundled_file_path), `${path.basename(bundled_file_path, ".js")}.html`);
        console.log(`Building page ${html_file_path}`);
        const basename = path.basename(bundled_file_path);
        fs.writeFileSync(html_file_path, Buffer.from([
            `<!DOCTYPE html>`,
            `<html lang="en">`,
            ``,
            `<head>`,
            `    <meta charset="utf-8">`,
            `    <title>Test ${basename}</title>`,
            ``,
            `    <script src="./${basename}"></script>`,
            `    <script>`,
            ``,
            `        document.addEventListener("DOMContentLoaded", function (event) {`,
            ``,
            `            var start = Date.now();`,
            `            var interval = 100;`,
            `            var last = start;`,
            ``,
            `            setInterval(function () {`,
            ``,
            `                var now = Date.now();`,
            `                var elapsed = now - last;`,
            ``,
            `                if (elapsed > interval + 35) {`,
            `                    console.log("UI tread blocked for ~" + (elapsed - interval).toString() + "ms");`,
            `                }`,
            ``,
            `                last += elapsed;`,
            ``,
            `            }, interval);`,
            ``,
            `        });`,
            ``,
            `    </script>`,
            `</head>`,
            ``,
            `<body>`,
            `    <h4>Running ${bundled_file_path} (CTRL + MAJ + i)</h4>`,
            `</body>`,
            ``,
            `</html>`,
        ].join("\n"), "utf8"));
    };
    if (!!watch) {
        exports.prepareForWatching();
        fs_watch(bundled_file_path, () => run());
    }
    run();
}
exports.buildTestHtmlPage = buildTestHtmlPage;
