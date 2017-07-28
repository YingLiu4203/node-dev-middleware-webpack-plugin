import * as express from 'express'

import {
    FunctionVoid,
    IConfiguration, IContext,
    IDevMiddleWare,
} from './middleware_types'

import getFilenameFromUrl from './get_filename_from_url'
import setCompiler from './set_compiler'

const HASH_REGEXP = /[0-9a-f]{10,}/
// a function that does nothing
// tslint:disable-next-line:no-empty
const Nop = () => { }

export default function(context: IContext, options: IConfiguration) {

    const { rebuild } = setCompiler(context, options)

    /**
     * run the function if context stats is ready, otherwise, save to callbacks
     * @param fn the function to be executed
     * @param req the epxress request
     */
    function ready(fn: FunctionVoid, req?: express.Request) {
        if (context.state) {
            return fn(context.webpackStats)
        }

        if (!options.noInfo && !options.quiet) {
            const info = req ? req.url : fn.name
            options.log(`webpack: wait until bundle finished: ${info}`)
        }
        context.callbacks.push(fn)
    }

    function waitUntilValid(callback: FunctionVoid) {
        if (callback) {
            ready(callback)
        }
    }

    function invalidate(callback: FunctionVoid) {
        callback = callback || Nop
        if (context.watching) {
            ready(callback)
            context.watching.invalidate()
        } else {
            callback()
        }
    }

    function close(callback: FunctionVoid) {
        callback = callback || Nop
        if (context.watching) {
            context.watching.close(callback)
        } else {
            callback()
        }
    }

    function handleRequest(
        filename: string,
        processRequest: () => void,
        req: express.Request) {
        // in lazy mode, rebuild on bundle request
        const match = !options.filename || (options.filename as RegExp).test(filename)
        if (options.lazy && match) {
            rebuild()
        }

        // don't block existing files with a hashed name
        if (HASH_REGEXP.test(filename)) {
            try {
                if (context.fileSystem.statSync(filename).isFile()) {
                    processRequest()
                    return
                }
                // tslint:disable-next-line:no-empty
            } catch (e) {
            }
        }
        ready(processRequest, req)
    }

    function setProps(this: any, devMiddleware: IDevMiddleWare) {
        devMiddleware.waitUntilValid = waitUntilValid
        devMiddleware.invalidate = invalidate
        devMiddleware.close = close
        devMiddleware.getFilenameFromUrl =
            getFilenameFromUrl.bind(this, options.publicPath, context.compiler)
        devMiddleware.fileSystem = context.fileSystem
    }

    return { ready, handleRequest, setProps }
}
