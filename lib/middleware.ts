import * as express from 'express'
import * as mime from 'mime'
import * as path from 'path'
import * as webpack from 'webpack'

import {
    FunctionVoid, IConfiguration,
    IContext, WebpackCompiler,
} from './expressMiddleware_types'

import initConfig from './config'
import setContext from './context'
import getFilenameFromUrl from './get_filename_from_url'
import Shared from './share'

// var Shared = require("./lib/Shared");

// constructor for the expressMiddleware
export default function(compiler: WebpackCompiler, options: IConfiguration) {
    initConfig(options)
    const context: IContext = setContext(compiler)

    /**
     * run the function if context stats is ready, otherwise, save to callbacks
     * @param fn the function to be executed
     * @param req the epxress request
     */
    function ready(fn: FunctionVoid, req: express.Request) {
        if (context.state) {
            return fn(context.webpackStats)
        }

        if (!options.noInfo && !options.quiet) {
            options.log!("webpack: wait until bundle finished: " + (req.url || fn.name))
        }
        context.callbacks.push(fn)
    }

    // The expressMiddleware function
    function expressMiddleware(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction ) {
        function goNext() {
            if (!options.serverSideRender) {
                return next()
            }

            return new Promise<void>((resolve) => {
                ready(() => {
                    res.locals.webpackStats = context.webpackStats;
                    resolve(next())
                }, req)
            })
        }

        if (req.method !== "GET") {
            return goNext();
        }

        let filename = getFilenameFromUrl(options.publicPath, context.compiler, req.url)
        if (filename === false) {
            return goNext()
        }

        return new Promise<void>((resolve) => {
            // shared.handleRequest(filename, processRequest, req);
            function processRequest() {
                try {
                    let stat: any = context.fileSystem.statSync(filename);
                    if (!stat.isFile()) {
                        if (stat.isDirectory()) {
                            let index = options.index;

                            if (index === undefined || index === true) {
                                index = "index.html";
                            } else if (!index) {
                                throw new Error("next");
                            }

                            filename = path.join(filename as string, index);
                            stat = context.fileSystem.statSync(filename);
                            if (!stat.isFile()) {
                                throw new Error("next")
                            }
                        } else {
                            throw new Error("next")
                        }
                    }
                } catch (e) {
                    return resolve(goNext());
                }

                // server content
                let content = context.fileSystem.readFileSync(filename);
                content = 'abc' // shared.handleRangeHeaders(content, req, res);
                res.setHeader("Content-Type",
                    mime.lookup(filename as string) + "; charset=UTF-8")
                res.setHeader("Content-Length", content.length);
                const headers = options.headers
                if (headers) {
                    for (const name in headers) {
                        if (headers.hasOwnProperty(name)) {
                            res.setHeader(name, headers[name])
                        }
                    }
                }
                // Express automatically sets the statusCode to 200, but not all servers do (Koa).
                res.statusCode = res.statusCode || 200;
                if (res.send) {
                    res.send(content)
                } else {
                    res.end(content)
                }
                resolve()
            }
        })
    }

    // expressMiddleware.getFilenameFromUrl = getFilenameFromUrl.bind(
    //     this, context.options.publicPath, context.compiler)
    // expressMiddleware.waitUntilValid = shared.waitUntilValid
    // expressMiddleware.invalidate = shared.invalidate
    // expressMiddleware.close = shared.close
    // expressMiddleware.fileSystem = context.fs
    return expressMiddleware
}
