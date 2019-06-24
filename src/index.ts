
import * as path from "path";
import * as child_process from "child_process";
import * as fs_watch from "node-watch";
import * as scriptLib from "scripting-tools";
import * as fs from "fs";
import * as crypto from "crypto";

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




const fork = (
    modulePath: string,
    args: string[],
    options?: child_process.ForkOptions,
    onStdoutData?: (data: Buffer) => void
) =>
    new Promise<number>(
        (resolve, reject) => {

            if (!!onStdoutData) {
                options = {
                    ...(options || {}),
                    "silent": true
                };
            }

            const childProcess = child_process.fork(
                modulePath,
                args,
                options
            );

            if (!!onStdoutData) {

                childProcess.stdout.on(
                    "data",
                    (data: Buffer) => onStdoutData(data)
                );

            }

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
    input: ["--entry" | "--require", string],
    output: ["--outfile", string],
    extra_args: string[] = [],
    watch?: undefined | "WATCH"
) {

    if (!!watch) {
        prepareForWatching();
        await browserify(
            input,
            output,
            extra_args
        );
    } else {

        console.log(`${input[1]} -> browserify -> ${output[1]}`);

    }

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
            ...extra_args,
            ...[input[0], path.resolve(input[1])],
            "-t", "html2js-browserify",
            "-t", "lessify",
            "-t", "brfs",
            ...[output[0], path.resolve(output[1])]
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

export async function brfs(
    file_path: string,
    watch?: undefined | "WATCH"
) {

    if (!!watch) {
        prepareForWatching();
        await brfs(file_path);
    }

    const run = async () => {

        if (
            brfs.computeDigest(
                fs.readFileSync(file_path)
            ) === brfs.digest
        ) {
            return;
        }

        console.log(`${file_path} -> brfs -> self`);

        const outFileData = await (async () => {

            let str = "";

            await fork(
                path.join(
                    find_module_path(
                        "brfs",
                        module_dir_path
                    ),
                    "bin",
                    "cmd.js"
                ),
                [file_path],
                undefined,
                data => str += data.toString("utf8")
            );

            return Buffer.from(str, "utf8");

        })();

        brfs.digest = brfs.computeDigest(outFileData);

        fs.writeFileSync(file_path, outFileData);

    };

    if (!!watch) {

        fs_watch(file_path, () => run());

    }

    const pr = run();

    if (!watch) {
        return pr;
    }

}

export namespace brfs {

    export const computeDigest = buffer => crypto
        .createHash("md5")
        .update(buffer)
        .digest("hex")
        ;

    export let digest = "";

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
