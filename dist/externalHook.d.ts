export declare const sourceToPrepend: string;
export declare type T__external_hook = {
    node_built_in: {
        __dirname: any;
        __filename: any;
        module: any;
        require: any;
        global: any;
    };
};
export declare function get(): T__external_hook;
/** Assert running in node */
export declare function get_node_built_in(name: "global" | "require"): any;
