
import * as express from 'express'
import * as mime from 'mime'
import * as webpack from 'webpack'

import getFilenameFromUrl from './get_filename_from_url'
import { IOptions } from './middleware_types'

// var Shared = require("./lib/Shared");

// constructor for the middleware
export default function(compiler: any, options: IOptions) {

    const context = {
        state: false,
        webpackStats: null,
        callbacks: [],
        options,
        compiler,
        watching: null,
        forceRebuild: false,
    };
    // var shared = Shared(context);

    // The middleware function
    function middleware(req: express.Request,
                        res: express.Response,
                        next: express.NextFunction,
    ) {
        function goNext() {
            if (!context.options.serverSideRender) {
                return next()
            }

            return new Promise( (resolve) => {
                // TODO
                // shared.ready(function() {
                //     res.locals.webpackStats = context.webpackStats;
                //     resolve(next());
                // }, req);
            });
        }

        if (req.method !== "GET") {
            return goNext();
        }

        const filename = getFilenameFromUrl(
            context.options.publicPath, context.compiler, req.url);
        if (filename === false) {
            return goNext()
        }

        return new Promise( (resolve) => {
            // shared.handleRequest(filename, processRequest, req);
            function processRequest() {
                try {
                    var stat = context.fs.statSync(filename);
                    if (!stat.isFile()) {
                        if (stat.isDirectory()) {
                            var index = context.options.index;

                            if (index === undefined || index === true) {
                                index = "index.html";
                            } else if (!index) {
                                throw "next";
                            }

                            filename = pathJoin(filename, index);
                            stat = context.fs.statSync(filename);
                            if (!stat.isFile()) throw "next";
                        } else {
                            throw "next";
                        }
                    }
                } catch (e) {
                    return resolve(goNext());
                }

                // server content
                var content = context.fs.readFileSync(filename);
                content = shared.handleRangeHeaders(content, req, res);
                res.setHeader("Content-Type", mime.lookup(filename) + "; charset=UTF-8");
                res.setHeader("Content-Length", content.length);
                if (context.options.headers) {
                    for (var name in context.options.headers) {
                        res.setHeader(name, context.options.headers[name]);
                    }
                }
                // Express automatically sets the statusCode to 200, but not all servers do (Koa).
                res.statusCode = res.statusCode || 200;
                if (res.send) res.send(content);
                else res.end(content);
                resolve();
            }
        });
    }

    // middleware.getFilenameFromUrl = getFilenameFromUrl.bind(
    //     this, context.options.publicPath, context.compiler)
    // middleware.waitUntilValid = shared.waitUntilValid
    // middleware.invalidate = shared.invalidate
    // middleware.close = shared.close
    // middleware.fileSystem = context.fs
    return middleware;
};
