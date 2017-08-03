import * as webpack from 'webpack'

import { IConfiguration, IContext, WebpackStats } from './middleware_types'

export default function setCompiler(context: IContext, options: IConfiguration) {

    // compiler call this function to report its results
    function handleCompileResult(err: any, stats?: webpack.Stats) {
        if (err) {
            options.error!(err.stack || err)
            if (err.details) {
                options.error!(err.details)
            }
        }
    }

    function rebuild() {
        if (context.state) {
            context.state = false
            context.compiler.run(handleCompileResult)
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
            cbs.forEach((cb) => {
                cb(stats)
            })
        })

        // In lazy mode, we may issue another rebuild
        if (context.forceRebuild) {
            context.forceRebuild = false
            rebuild()
        }
    }

    function compilerRun() {
        const { reportTime, noInfo, quiet } = options
        if (context.state && (!noInfo && !quiet)) {
            options.reporter!({ state: false, options: { reportTime, noInfo, quiet } })
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
        context.compiler.plugin('done', compilerDone)
        context.compiler.plugin('invalid', compilerRun)
        context.compiler.plugin('watch-run', compilerRun)
        context.compiler.plugin('run', compilerRun)
    }

    function start() {
        const compiler = context.compiler
        if (options.lazy) {
            context.state = true
        } else {
            context.watching = compiler.watch(options.watchOptions, handleCompileResult)
        }
    }

    setPlugins()
    start()

    return { rebuild }
}
