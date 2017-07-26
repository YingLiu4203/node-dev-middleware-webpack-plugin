import * as express from 'express'
import * as mime from 'mime'
import * as path from 'path'
import * as webpack from 'webpack'

import setContext from './context'
import getFilenameFromUrl from './get_filename_from_url'
import { IConfiguration, IContext, WebpackCompiler } from './middleware_types'
import Shared from './share'

// var Shared = require("./lib/Shared");

// constructor for the middleware
export default function(compiler: WebpackCompiler, options: IConfiguration) {

    const context: IContext = setContext(compiler, options)

    // The middleware function
    function middleware(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
    ) {
        function goNext() {
            if (!context.options.serverSideRender) {
                return next()
            }

            return new Promise( (resolve) => {
                shared.ready( () => {
                    res.locals.webpackStats = context.webpackStats;
                    resolve(next())
                }, req)
            })
        }

        if (req.method !== "GET") {
            return goNext();
        }

        let filename = getFilenameFromUrl(
            context.options.publicPath, context.compiler, req.url);
        if (filename === false) {
            return goNext()
        }

        return new Promise( (resolve) => {
            // shared.handleRequest(filename, processRequest, req);
            function processRequest() {
                try {
                    let stat: any = context.fileSystem.statSync(filename);
                    if (!stat.isFile()) {
                        if (stat.isDirectory()) {
                            let index = context.options.index;

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
                content = shared.handleRangeHeaders(content, req, res);
                res.setHeader("Content-Type",
                    mime.lookup(filename as string) + "; charset=UTF-8")
                res.setHeader("Content-Length", content.length);
                const headers = context.options.headers
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

    // middleware.getFilenameFromUrl = getFilenameFromUrl.bind(
    //     this, context.options.publicPath, context.compiler)
    // middleware.waitUntilValid = shared.waitUntilValid
    // middleware.invalidate = shared.invalidate
    // middleware.close = shared.close
    // middleware.fileSystem = context.fs
    return middleware
}
