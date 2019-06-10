
import * as path from "path";
import * as child_process from "child_process";
import * as fs_watch from "node-watch";
import * as scriptLib from "scripting-tools";
import * as fs from "fs";

const module_dir_path = path.join(__dirname, "..");

function find_module_path(module_name: string, module_dir_path: string){

    let dir_path = module_dir_path;

    while (true) {

        try {

            return scriptLib.find_module_path(
                module_name,
                dir_path
            );

        } catch{ }

        const parent_dir_path = path.join(dir_path, "..");

        if (dir_path === parent_dir_path) {
            break;
        }

        dir_path = parent_dir_path;

    }

    throw new Error(`Can't locate ${module_name}`);

}

export const prepareForWatching = (() => {

    let isStarted = false;

    return () => {

        if (isStarted) {
            return;
        }

        isStarted = true;

        process.setMaxListeners(70)

        process.once("unhandledRejection", error => { throw error; });

        console.log("Enter exit for graceful termination");

        Object.defineProperty(
            require("repl").start({
                "terminal": true,
                "prompt": "> "
            }).context,
            "exit", { "get": () => process.exit(0) }
        );

    };


})();




const fork = (modulePath: string, args: string[], options?: child_process.ForkOptions) =>
    new Promise<number>(
        (resolve, reject) => {

            const childProcess = child_process.fork(
                modulePath,
                args,
                options
            );

            const onExit = () => childProcess.kill();

            process.once("exit", onExit);

            childProcess.once(
                "exit",
                code => {

                    process.removeListener("exit", onExit);

                    if (code === 0) {
                        resolve(0);
                    } else {
                        reject(new Error(`exited with ${code}`));
                    }

                }
            );
        }
    );

export async function tsc(
    tsconfig_path: string,
    watch?: undefined | "WATCH"
) {

    if (!!watch) {
        prepareForWatching();
        await tsc(tsconfig_path);
    } else {

        console.log(`tsc -p ${path.basename(path.dirname(tsconfig_path))}`);

    }

    const args: string[] = ["-p", tsconfig_path];

    if (!!watch) {

        args.push("-w");

    }

    const target_module_dir_path = path.join(
        path.dirname(tsconfig_path),
        (() => {

            const { extends: tsconfig_extends } = require(tsconfig_path);

            return tsconfig_extends !== undefined ? path.dirname(tsconfig_extends) : ".";

        })()
    );

    const pr = fork(
        path.join(
            find_module_path("typescript", target_module_dir_path),
            "bin",
            "tsc"
        ),
        args,
        {
            "cwd": target_module_dir_path
        }
    );

    if (!watch) {
        return pr;
    }

}

/** If lessify is required it must be in the page dev-dependencies.*/
export async function browserify(
    entry_point_file_path: string,
    dst_file_path: string,
    watch?: undefined | "WATCH"
) {

    if (!!watch) {
        prepareForWatching();
        await browserify(
            entry_point_file_path,
            dst_file_path
        );
    } else {

        console.log(`${entry_point_file_path} -> browserify -> ${dst_file_path}`);

    }

    dst_file_path = path.resolve(dst_file_path);

    const pr = fork(
        path.join(
            find_module_path(
                !!watch ? "watchify" : "browserify",
                module_dir_path
            ),
            "bin",
            "cmd"
        ),
        [
            "-e", path.resolve(entry_point_file_path),
            "-t", "html2js-browserify",
            "-t", "lessify",
            "-t", "brfs",
            "-o", dst_file_path
        ],
        { "cwd": module_dir_path }
    );

    if (!watch) {
        return pr;
    }

}


export async function minify(
    file_path: string,
    watch?: undefined | "WATCH"
) {

    if (!!watch) {
        prepareForWatching();
        await minify(file_path);
    }

    const run = () => {

        const minified_file_path = path.join(
            path.dirname(file_path),
            `${path.basename(file_path, ".js")}.min.js`
        );

        console.log(`${file_path} -> minify -> ${minified_file_path}`);

        fork(
            path.join(
                find_module_path(
                    "uglify-js",
                    module_dir_path
                ),
                "bin",
                "uglifyjs"
            ),
            [
                file_path,
                "-o",
                minified_file_path
            ]
        );

    };

    if (!!watch) {

        fs_watch(file_path, () => run());

    }

    const pr = run();

    if (!watch) {
        return pr;
    }

}

export function buildTestHtmlPage(
    bundled_file_path: string,
    watch?: undefined | "WATCH"
) {

    const run = () => {

        const html_file_path = path.join(
            path.dirname(bundled_file_path),
            `${path.basename(bundled_file_path, ".js")}.html`
        );

        console.log(`Building page ${html_file_path}`);

        const basename = path.basename(bundled_file_path);

        fs.writeFileSync(
            html_file_path,
            Buffer.from(
                [
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
                ].join("\n"),
                "utf8"
            )
        );

    };

    if (!!watch) {

        prepareForWatching();

        fs_watch(bundled_file_path, () => run());

    }

    run();

}

export async function tsc_browserify_minify(
    tsconfig_path: string,
    entry_point_file_path: string,
    out_file_path: string,
    watch?: undefined | "WATCH"
) {

    await tsc(
        tsconfig_path,
        watch
    );

    await browserify(
        entry_point_file_path,
        out_file_path,
        watch
    );

    await minify(
        out_file_path,
        watch
    );

}

