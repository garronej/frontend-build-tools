export declare const prepareForWatching: () => void;
export declare function tsc(tsconfig_path: string, watch?: undefined | "WATCH"): Promise<number | undefined>;
/** If lessify is required it must be in the page dev-dependencies.*/
export declare function browserify(entry_point_file_path: string, dst_file_path: string, extra_args?: string[], watch?: undefined | "WATCH"): Promise<number | undefined>;
export declare function minify(file_path: string, watch?: undefined | "WATCH"): Promise<void>;
export declare function brfs(file_path: string, watch?: undefined | "WATCH"): Promise<void>;
export declare namespace brfs {
    const computeDigest: (buffer: any) => string;
    let digest: string;
}
export declare function buildTestHtmlPage(bundled_file_path: string, watch?: undefined | "WATCH"): void;
