import * as express from 'express'
import * as webpack from 'webpack'

export type FunctionVoid = (...arg: any[]) => void

export type WebpackStats = webpack.Stats & webpack.Stats.ToStringOptionsObject

export interface IReporterArgs {
    state: boolean,
    stats?: WebpackStats,
    options: IReporterConfig,
}

export type ReportFunction = (args: IReporterArgs) => void

export interface IReporterConfig {
    // whether to add timestamp or not
    reportTime?: boolean,

    // flag to display no info to console (only warnings and errors)
    noInfo?: boolean,

    // flag to display to the console
    quiet?: boolean,
}

export interface IConfiguration extends IReporterConfig {
    // it has the same meaning as webpack's publicPath
    publicPath?: string,

    filename?: string | RegExp,

    // switch into lazy mode
    // that means no watching, but recompilation on every request
    lazy?: boolean,

    // watch options (only lazy: false)
    watchOptions?: webpack.Options.WatchOptions,

    // The index filename for web server, defaults to "index.html".
    // If falsy (but not undefined), the server will not respond
    // to requests to the root URL.
    index?: string | boolean,

    // custom http response headers
    headers?: { [key: string]: string },

    // report functions and reporter are initialized
    log?: FunctionVoid,
    warn?: FunctionVoid,
    error?: FunctionVoid,
    reporter?: ReportFunction,

    // Add custom mime/extension mappings
    // https://github.com/broofa/node-mime#mimedefine
    // https://github.com/webpack/webpack-dev-middleware/pull/150
    mimeTypes?: { [key: string]: string[] },

    // options for formating the statistics
    stats?: webpack.Stats.ToStringOptions,

    // Turn off the server-side rendering mode.
    // See Server-Side Rendering part for more info.
    serverSideRender?: boolean,
}

export interface IContext {
    callbacks: FunctionVoid[],
    // true if the compiler completes run.
    state: boolean,
    compiler: any,
    watching?: webpack.Watching,
    forceRebuild?: boolean,
    fileSystem?: any,
    webpackStats?: WebpackStats,
}

export interface IDevMiddleWare {
    // the express middleware api
    (req: express.Request, res: express.Response, next: express.NextFunction): any,

    //  executes the callback if the bundle is valid or after it is valid again
    waitUntilValid: (fn?: FunctionVoid) => void,

    // recompile the bundle - e.g. after you changed the configuration
    invalidate: (fn?: FunctionVoid) => void,

    // stop watching for file changes
    close: (fn?: FunctionVoid) => void,

    // For testing, the MemroryFileSystem
    fileSystem: any,

    // For testing, get file pathname from a request url
    getPathnameFromUrl: (url: string) => string,
}
