"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sourceToPrepend = [
    "if (typeof __external_hook === \"undefined\") {",
    "",
    "    var __external_hook = {};",
    "",
    "    var isBrowser = (typeof window === \"undefined\") || (typeof self !== \"undefined\" && !!self.postMessage);",
    "",
    "    if (!isBrowser) {",
    "",
    "        __external_hook[\"node_built_in\"] = {",
    "            \"__dirname\": __dirname,",
    "            \"__filename\": __filename,",
    "            \"module\": module,",
    "            \"require\": require,",
    "            \"global\": global",
    "        };",
    "",
    "    }",
    "",
    "}"
].join("\n");
function get() {
    if (typeof __external_hook !== "undefined") {
        throw new Error("External hook not defined");
    }
    return __external_hook;
}
exports.get = get;
/** Assert running in node */
function get_node_built_in(name) {
    if (typeof __external_hook === "undefined") {
        switch (name) {
            case "global": return global;
            case "require": return require;
            default:
        }
    }
    else {
        return __external_hook.node_built_in[name];
    }
}
exports.get_node_built_in = get_node_built_in;
