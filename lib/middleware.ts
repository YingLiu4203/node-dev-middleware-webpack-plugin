import * as express from 'express'
import * as mime from 'mime'
import * as path from 'path'
import * as webpack from 'webpack'

import { FunctionVoid, IConfiguration, IContext, IDevMiddleWare } from './middleware_types'

import initConfig from './config'
import setContext from './context'
import getFilenameFromUrl from './get_filename_from_url'
import { handleRangeHeaders } from './helper'
import setCompiler from './set_compiler'

const HASH_REGEXP = /[0-9a-f]{10,}/

// constructor for the expressMiddleware
export default function(this: any, compiler: any, options: IConfiguration) {
    initConfig(options)
    const context: IContext = setContext(compiler)
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
            options.log!(`webpack: wait until bundle finished: ${info}`)
        }
        context.callbacks.push(fn)
    }

    function waitUntilValid(callback: FunctionVoid) {
        if (callback) {
            ready(callback)
        }
    }

    function invalidate(callback: FunctionVoid) {
        if (callback) {
            if (context.watching) {
                ready(callback)
                context.watching.invalidate()
            } else {
                callback()
            }
        }
    }

    function close(callback: FunctionVoid) {
        if (callback) {
            if (context.watching) {
                context.watching.close(callback)
            } else {
                callback()
            }
        }
    }

    function handleRequest(
        filename: string,
        processRequest: () => void,
        req: express.Request) {
        // in lazy mode, rebuild on bundle request
        if (options.lazy && (!options.filename ||
            (options.filename as RegExp).test(filename))) {
            rebuild()
        }

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

    // The expressMiddleware function
    const devMiddleware = ((
        req: express.Request,
        res: express.Response,
        next: express.NextFunction) => {
        function goNext() {
            if (!options.serverSideRender) {
                return next()
            }

            return new Promise<void>((resolve) => {
                ready(() => {
                    res.locals.webpackStats = context.webpackStats
                    resolve(next())
                }, req)
            })
        }

        if (req.method !== "GET") {
            return goNext()
        }

        let filename = getFilenameFromUrl(options.publicPath, context.compiler, req.url)
        if (!filename) {
            return goNext()
        }

        return new Promise<void>((resolve) => {
            handleRequest(filename as string, processRequest, req)
            function processRequest() {
                try {
                    let stat: any = context.fileSystem.statSync(filename)
                    if (!stat.isFile()) {
                        if (stat.isDirectory()) {
                            let index = options.index

                            if (index === undefined || index === true) {
                                index = "index.html"
                            } else if (!index) {
                                throw new Error("next")
                            }

                            filename = path.join(filename as string, index)
                            stat = context.fileSystem.statSync(filename)
                            if (!stat.isFile()) {
                                throw new Error("next")
                            }
                        } else {
                            throw new Error("next")
                        }
                    }
                } catch (e) {
                    return resolve(goNext())
                }

                // server content
                let content = context.fileSystem.readFileSync(filename)
                content = handleRangeHeaders(content, req, res)
                res.setHeader("Content-Type",
                    mime.lookup(filename as string) + " charset=UTF-8")
                res.setHeader("Content-Length", content.length)
                const headers = options.headers
                if (headers) {
                    for (const name in headers) {
                        if (headers.hasOwnProperty(name)) {
                            res.setHeader(name, headers[name])
                        }
                    }
                }
                // Express automatically sets the statusCode to 200, but not all servers do (Koa).
                res.statusCode = res.statusCode || 200
                if (res.send) {
                    res.send(content)
                } else {
                    res.end(content)
                }
                resolve()
            }
        })
    }) as IDevMiddleWare

    devMiddleware.waitUntilValid = waitUntilValid
    devMiddleware.invalidate = invalidate
    devMiddleware.close = close
    devMiddleware.getFilenameFromUrl =
        getFilenameFromUrl.bind(this, options.publicPath, context.compiler)
    devMiddleware.fileSystem = context.fileSystem

    return devMiddleware
}
