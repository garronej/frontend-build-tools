
export const sourceToPrepend = [
    `if (typeof __external_hook === "undefined") {`,
    ``,
    `    var __external_hook = {};`,
    ``,
    `    var isBrowser = (typeof window === "undefined") || (typeof self !== "undefined" && !!self.postMessage);`,
    ``,
    `    if (!isBrowser) {`,
    ``,
    `        __external_hook["node_built_in"] = {`,
    `            "__dirname": __dirname,`,
    `            "__filename": __filename,`,
    `            "module": module,`,
    `            "require": require,`,
    `            "global": global`,
    `        };`,
    ``,
    `    }`,
    ``,
    `}`
].join("\n");

export type T__external_hook = {
    node_built_in: {
        __dirname: any;
        __filename: any;
        module: any;
        require: any;
        global: any;
    };
}

declare const __external_hook: T__external_hook | undefined;

export function get(): T__external_hook {
    if (typeof __external_hook !== "undefined") {
        throw new Error("External hook not defined");
    }
    return __external_hook!
}

/** Assert running in node */
export function get_node_built_in(
    name: "global" | "require"
): any {

    if (typeof __external_hook === "undefined") {

        switch (name) {
            case "global": return global;
            case "require": return require;
            default:

        }

    } else {

        return __external_hook.node_built_in[name];

    }

}

