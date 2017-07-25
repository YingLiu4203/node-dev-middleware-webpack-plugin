import * as webpack from 'webpack'

export interface IReportOptions {
    stats: webpack.Stats,
    state: boolean,
    options: IOptions,
}

export interface IOptions {
    // public path is the only required parmater
    // it has the same meaning as in webpack
    publicPath: string,

    filename?: string | RegExp,

    // flag to display no info to console (only warnings and errors)
    noInfo?: boolean,

    // flag to display to the console
    quiet?: boolean,

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

    log?: (...args: any[]) => void,
    warn?: (...args: any[]) => void,
    error?: (...args: any[]) => void,

    // Add custom mime/extension mappings
    // https://github.com/broofa/node-mime#mimedefine
    // https://github.com/webpack/webpack-dev-middleware/pull/150
    mimeTypes?: { [key: string]: string[] },

    // options for formating the statistics
    stats?: webpack.Stats.ToStringOptions,

    // Provide a custom reporter to change the way how logs are shown.
    reporter?: (...args: any[]) => void,

    reportTime?: boolean,

    // Turn off the server-side rendering mode.
    // See Server-Side Rendering part for more info.
    serverSideRender?: boolean,
}

export interface IContext {
    options: IOptions,
    callbacks: Array<(...args: any[]) => void>,
    state: boolean,
    compiler: webpack.Compiler,
    watching?: webpack.Watching,
    forceRebuild?: boolean,
    fileSystem?: any,
    webpackStats?: webpack.Stats,
}
