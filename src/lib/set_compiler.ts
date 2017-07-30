import * as webpack from 'webpack'

import { IConfiguration, IContext, WebpackStats } from './middleware_types'

export default function setCompiler(context: IContext, options: IConfiguration) {

    // used by the compiler's run() and watch methods
    function reportCompilerError(err: any, stats?: webpack.Stats) {
        if (err) {
            options.error!(err.stack || err)
            if (err.details) {
                options.error!(err.details)
            }
            return
        }

        if (stats) {
            const info = stats.toJson();
            if (stats.hasErrors()) {
                options.error!(info.errors)
            }
        }
    }

    function rebuild() {
        if (context.state) {
            context.state = false
            context.compiler.run(reportCompilerError)
        } else {
            context.forceRebuild = true
        }
    }

    function compilerDone(stats: WebpackStats) {
        context.state = true
        context.webpackStats = stats

        // Do the stuff in nextTick, because bundle may be invalidated
        // if a change may happen in rebuild
        process.nextTick(() => {
            // check if still in invalid state
            const state = context.state
            if (!state) {
                return
            }

            const { reportTime, noInfo, quiet } = options
            options.reporter!({ state, stats, options: { reportTime, noInfo, quiet } })

            // execute callback that are delayed
            const cbs = context.callbacks
            context.callbacks = []
            cbs.forEach((cb) => cb(stats))
        })

        // In lazy mode, we may issue another rebuild
        if (context.forceRebuild) {
            context.forceRebuild = false
            rebuild()
        }
    }

    function compilerInvalid() {
        if (context.state && (!options.noInfo && !options.quiet)) {
            options.log!('webpack: state is true, called by invalid or watch-run or run...')
        }

        // We are now in invalid state
        context.state = false

        // resolve async
        if (arguments.length === 2 && typeof arguments[1] === "function") {
            const callback = arguments[1]
            callback()
        }
    }

    function setPlugins() {
        context.compiler.plugin("done", compilerDone)
        context.compiler.plugin("invalid", compilerInvalid)
        context.compiler.plugin("watch-run", compilerInvalid)
        context.compiler.plugin("run", compilerInvalid)
    }

    function start() {
        const compiler = context.compiler
        if (options.lazy) {
            context.state = true
        } else {
            const watching = compiler.watch(options.watchOptions, reportCompilerError)
            context.watching = watching
        }
    }

    setPlugins()
    start()

    return { rebuild }
}
