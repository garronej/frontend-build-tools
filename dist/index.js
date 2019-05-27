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
const module_dir_path = path.join(__dirname, "..");
function find_module_path(module_name) {
    const host_module_dir_path = path.join(module_dir_path, "..", "..");
    let dir_path = host_module_dir_path;
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
const fork = (modulePath, args, options) => new Promise((resolve, reject) => {
    const childProcess = child_process.fork(modulePath, args, options);
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
            yield tsc(tsconfig_path);
        }
        else {
            console.log(`tsc -p ${path.basename(path.dirname(tsconfig_path))}`);
        }
        const args = ["-p", tsconfig_path];
        if (!!watch) {
            args.push("-w");
        }
        const pr = fork(path.join(find_module_path("typescript"), "bin", "tsc"), args, {
            "cwd": path.join(path.dirname(tsconfig_path), (() => {
                const { extends: tsconfig_extends } = require(tsconfig_path);
                return tsconfig_extends !== undefined ? path.dirname(tsconfig_extends) : ".";
            })())
        });
        if (!watch) {
            return pr;
        }
    });
}
exports.tsc = tsc;
/** If lessify is required it must be in the page dev-dependencies.*/
function browserify(entry_point_file_path, dst_file_path, watch) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!!watch) {
            yield browserify(entry_point_file_path, dst_file_path);
        }
        else {
            console.log(`${entry_point_file_path} -> browserify -> ${dst_file_path}`);
        }
        const pr = fork(path.join(find_module_path(!!watch ? "watchify" : "browserify"), "bin", "cmd"), [
            "-e", path.resolve(entry_point_file_path),
            "-t", "html2js-browserify",
            "-t", "lessify",
            "-t", "brfs",
            "-o", path.resolve(dst_file_path)
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
            yield minify(file_path);
        }
        const run = () => {
            const minified_file_path = path.join(path.dirname(file_path), `${path.basename(file_path, ".js")}.min.js`);
            console.log(`${file_path} -> minify -> ${minified_file_path}`);
            fork(path.join(find_module_path("uglify-js"), "bin", "uglifyjs"), [
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
function buildTestHtmlPage(bundled_file_path, watch) {
    const run = () => {
        const html_file_path = path.join(path.dirname(bundled_file_path), `${path.basename(bundled_file_path, ".js")}.html`);
        console.log(`Building page ${html_file_path}`);
        fs.writeFileSync(html_file_path, Buffer.from([
            `<!DOCTYPE html>`,
            `<html lang="en">`,
            `  <head>`,
            `    <meta charset="utf-8">`,
            `    <title>title</title>`,
            ``,
            `    <script src="./${path.basename(bundled_file_path)}"></script>`,
            `  </head>`,
            `  <body>`,
            `    <h1>running ${bundled_file_path}.js (CTRL + MAJ + i)</h1>`,
            `  </body>`,
            `</html>`
        ].join("\n"), "utf8"));
    };
    if (!!watch) {
        fs_watch(bundled_file_path, () => run());
    }
    run();
}
exports.buildTestHtmlPage = buildTestHtmlPage;
function tsc_browserify_minify(tsconfig_path, entry_point_file_path, out_file_path, watch) {
    return __awaiter(this, void 0, void 0, function* () {
        yield tsc(tsconfig_path, watch);
        yield browserify(entry_point_file_path, out_file_path, watch);
        yield minify(out_file_path, watch);
    });
}
exports.tsc_browserify_minify = tsc_browserify_minify;
