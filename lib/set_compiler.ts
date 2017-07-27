import * as webpack from 'webpack'

import { getRptOptions } from './helper'
import { IConfiguration, IContext, WebpackStats } from './middleware_types'

export default function setCompiler(context: IContext, options: IConfiguration) {

    function handleCompilerCallback(err: any) {
        if (err) {
            options.error(err.stack || err)
            if (err.details) {
                options.error(err.details)
            }
        }
    }

    function rebuild() {
        if (context.state) {
            context.state = false
            context.compiler.run(handleCompilerCallback)
        } else {
            context.forceRebuild = true
        }
    }

    function compilerDone(stats: WebpackStats) {
        context.state = true
        context.webpackStats = stats

        // Do the stuff in nextTick, because bundle may be invalidated
        // if a change happened while compiling
        process.nextTick(() => {
            // check if still in invalid state
            const state = context.state
            if (!state) {
                return
            }

            options.reporter!({ state, stats, options: getRptOptions(options) })

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
            options.log('webpack: Compiler invalid or watch-run or run...')
        }

        // We are now in invalid state
        context.state = false

        // resolve async
        if (arguments.length === 2 && typeof arguments[1] === "function") {
            const callback = arguments[1]
            callback()
        }
    }

    function startWatch() {
        const compiler = context.compiler
        if (!options.lazy) {
            const watching = compiler.watch(options.watchOptions, handleCompilerCallback)
            context.watching = watching
        } else {
            context.state = true
        }
    }

    context.compiler.plugin("done", compilerDone)
    context.compiler.plugin("invalid", compilerInvalid)
    context.compiler.plugin("watch-run", compilerInvalid)
    context.compiler.plugin("run", compilerInvalid)

    startWatch()

    return { rebuild }
}
