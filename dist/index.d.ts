export declare function tsc(tsconfig_path: string, watch?: undefined | "WATCH"): Promise<number | undefined>;
/** If lessify is required it must be in the page dev-dependencies.*/
export declare function browserify(entry_point_file_path: string, dst_file_path: string, watch?: undefined | "WATCH"): Promise<void>;
export declare namespace browserify {
    function setExternalHook(file_path: string, watch?: undefined | "WATCH"): Promise<void>;
}
export declare function minify(file_path: string, watch?: undefined | "WATCH"): Promise<void>;
export declare function buildTestHtmlPage(bundled_file_path: string, watch?: undefined | "WATCH"): void;
export declare function tsc_browserify_minify(tsconfig_path: string, entry_point_file_path: string, out_file_path: string, watch?: undefined | "WATCH"): Promise<void>;
