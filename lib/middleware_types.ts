import * as webpack from 'webpack'

export type FunctionVoid = (...arg: any[]) => void

export type WebpackCompiler = webpack.Compiler | webpack.MultiCompiler

export interface IReporterArgs {
    state: boolean,
    stats: webpack.Stats & webpack.Stats.ToStringOptionsObject,
    options: IConfiguration,
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
    // public path is the only required parmater
    // it has the same meaning as in webpack
    publicPath: string,

    filename?: string | RegExp,

    // switch into lazy mode
    // that means no watching, but recompilation on every request
    lazy?: true,

    // watch options (only lazy: false)
    watchOptions?: webpack.Options.WatchOptions,

    // The index path for web server, defaults to "index.html".
    // If falsy (but not undefined), the server will not respond
    // to requests to the root URL.
    index?: string | boolean,

    // custom headers
    headers?: { [key: string]: string },

    // report functions
    log?: FunctionVoid,
    warn?: FunctionVoid,
    error?: FunctionVoid,

    // Add custom mime/extension mappings
    // https://github.com/broofa/node-mime#mimedefine
    // https://github.com/webpack/webpack-dev-middleware/pull/150
    mimeTypes?: { [key: string]: string[] },

    // options for formating the statistics
    stats?: webpack.Stats.ToStringOptions,

    // Provide a custom reporter to change the way how logs are shown.
    reporter?: ReportFunction,

    // Turn off the server-side rendering mode.
    // See Server-Side Rendering part for more info.
    serverSideRender?: boolean,
}

export interface IContext {
    options: IConfiguration,
    callbacks: FunctionVoid[],
    state: boolean,
    compiler: WebpackCompiler,
    watching?: webpack.Watching,
    forceRebuild?: boolean,
    fileSystem?: any,
    webpackStats?: webpack.Stats.ToStringOptionsObject,
}
