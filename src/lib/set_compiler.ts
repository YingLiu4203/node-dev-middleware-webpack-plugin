import * as webpack from 'webpack'

import { IConfiguration, IContext, WebpackStats } from './middleware_types'

export default function setCompiler(context: IContext, options: IConfiguration) {

    // compiler call this function to report its results
    function processRunResult(err: any, stats?: webpack.Stats) {
        console.log(`in report compiler run error: ${err}`)
        if (err) {
            options.error!(err.stack || err)
            if (err.details) {
                options.error!(err.details)
            }
        }
    }

    function rebuild() {
        console.log('rebuild state: ${context.state}')
        if (context.state) {
            context.state = false
            context.compiler.run(processRunResult)
        } else {
            context.forceRebuild = true
        }
    }

    function compilerDone(stats: WebpackStats) {
        context.state = true
        context.webpackStats = stats
        console.log('in compile done')
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
            cbs.forEach( (cb) => {
                console.log(`run saved callback: ${cb.name}`)
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
        console.log('in compilerRun')
        console.log('in compiler Watch Run')
        if (context.state && (!options.noInfo && !options.quiet)) {
            options.log!('webpack: state is true, called by watch-run or run...')
        }

        // We are now in invalid state
        context.state = false

        // resolve async
        if (arguments.length === 2 && typeof arguments[1] === "function") {
            const callback = arguments[1]
            console.log(`callback name: ${callback.name}`)
            callback()
        }
    }

    function compilerWatchRun() {
        console.log('in compiler Watch Run')
        console.log(`arguments length: ${arguments.length}`)
        if (context.state && (!options.noInfo && !options.quiet)) {
            options.log!('webpack: state is true, called by watch-run or run...')
        }

        // We are now in invalid state
        context.state = false

        // resolve async
        if (arguments.length === 2 && typeof arguments[1] === "function") {
            const callback = arguments[1]
            console.log(`callback name: ${callback.name}`)
            callback()
        }
    }

    function compilerInvalid(filename: string, changeTime: any) {
        console.log(`In compilerInvalid. file: ${filename}  Time: ${changeTime}`)
        console.log(`arguments length: ${arguments.length}`)
        if (context.state && (!options.noInfo && !options.quiet)) {
            options.log!('webpack: state is true, called by invalid or watch-run or run...')
        }

        // We are now in invalid state
        context.state = false
    }

    function setPlugins() {
        context.compiler.plugin('done', compilerDone)
        context.compiler.plugin('invalid', compilerInvalid)
        context.compiler.plugin('watch-run', compilerWatchRun)
        context.compiler.plugin('run', compilerRun)
    }

    function start() {
        const compiler = context.compiler
        if (options.lazy) {
            context.state = true
        } else {
            context.watching = compiler.watch(options.watchOptions, processRunResult)
        }
    }

    setPlugins()
    start()

    return { rebuild }
}
